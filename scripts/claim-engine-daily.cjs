/**
 * CLAIM ENGINE — daily run (docs/claim-engine-spec.md v1.0)
 *
 * DRAFTS-ONLY: this script SENDS NOTHING. It computes today's qualifying
 * clinics (Track A + Track B), applies every exclusion in the spec, and prints
 * a JSON work order. The scheduled session turns that into Gmail drafts and
 * logs each one back into decision_drivers.claim_engine.
 *
 *   node scripts/claim-engine-daily.cjs           # today's work order
 *   node scripts/claim-engine-daily.cjs --log '{"id":"...","touch":2,"template":"stats-v1"}'
 *                                                 # record a created draft
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DAY = 864e5;
const MAX_DRAFTS_PER_DAY = 20;   // spec §6, hard
const ACTION_TYPES = new Set(['website_click', 'call_click', 'book_click', 'message_click', 'directions_click']);
const QC = /quebec|québec|qc/i;
const validEmail = (e) => e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && !/(no-?reply|example\.|growth99)/i.test(e);

// Lifetime touch count including pre-engine campaigns (spec Phase 0.1).
function touchCount(p) {
  const dd = p.decision_drivers || {};
  const ce = dd.claim_engine || {};
  let t = 0;
  if (p.outreach_sent) t++;                    // June campaign
  if (dd.second_touch_at) t++;                 // July "Still holding"
  if (ce.aug6_sent) t++;                       // Aug 6 stats wave
  t += Array.isArray(ce.touches) ? ce.touches.length : 0; // engine-era touches
  return t;
}
function lastContactAt(p) {
  const dd = p.decision_drivers || {};
  const ce = dd.claim_engine || {};
  const dates = [p.outreach_sent_at, dd.second_touch_at, ce.aug6_sent, ...(Array.isArray(ce.touches) ? ce.touches.map((t) => t.date) : [])]
    .filter(Boolean).map((d) => new Date(d).getTime()).filter((n) => !isNaN(n));
  return dates.length ? Math.max(...dates) : 0;
}

async function fetchAll(table, cols, filter) {
  let rows = [], f = 0;
  while (true) {
    let q = s.from(table).select(cols).range(f, f + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(table + ': ' + error.message);
    rows = rows.concat(data || []);
    if (!data || data.length < 1000) break;
    f += 1000;
  }
  return rows;
}

(async () => {
  // --log mode: record a created draft as an engine touch
  const logIdx = process.argv.indexOf('--log');
  if (logIdx > -1) {
    const rec = JSON.parse(process.argv[logIdx + 1]);
    const { data: p } = await s.from('providers').select('decision_drivers').eq('id', rec.id).single();
    const dd = (p && typeof p.decision_drivers === 'object' && p.decision_drivers) || {};
    dd.claim_engine = dd.claim_engine || {};
    dd.claim_engine.touches = [...(dd.claim_engine.touches || []), { date: new Date().toISOString(), touch: rec.touch, template: rec.template || 'stats-v1', track: rec.track || 'A' }];
    dd.claim_engine.pending_draft = new Date().toISOString();
    const { error } = await s.from('providers').update({ decision_drivers: dd }).eq('id', rec.id);
    console.log(error ? 'LOG ERROR: ' + error.message : 'logged touch for ' + rec.id);
    return;
  }

  const now = Date.now();
  const d30 = new Date(now - 30 * DAY).toISOString();
  const d14 = new Date(now - 14 * DAY).toISOString();
  const d7 = new Date(now - 7 * DAY).toISOString();

  const P = await fetchAll('providers', 'id,name,slug,city,state,country,email,website,is_hidden,is_claimed,email_bounced,outreach_sent,outreach_sent_at,decision_drivers,created_at,reply_category');
  const events = await fetchAll('listing_events', 'provider_id,event_type,created_at', (q) => q.gte('created_at', d30));
  const olderFirsts = await fetchAll('listing_events', 'provider_id,event_type', (q) => q.lt('created_at', d30).in('event_type', ['book_click', 'call_click']));

  // suppression: BOTH tables, fail closed (missing table = treat as suppressed none, but flag)
  const suppressed = new Set();
  for (const t of ['email_suppressions', 'outreach_suppressions']) {
    try { (await fetchAll(t, 'email')).forEach((r) => r.email && suppressed.add(r.email.toLowerCase().trim())); }
    catch (e) { console.error('SUPPRESSION TABLE ERROR (' + t + '): ' + e.message + ' — failing closed, aborting run'); process.exit(1); }
  }

  const hadEarlier = new Set(olderFirsts.map((e) => String(e.provider_id) + '|' + e.event_type));
  const per = {};
  for (const e of events) {
    const k = String(e.provider_id);
    per[k] = per[k] || { views: 0, website: 0, call: 0, book: 0, message: 0, directions: 0, actions: 0, firstCall: false, firstBook: false };
    if (e.event_type === 'view') per[k].views++;
    else if (ACTION_TYPES.has(e.event_type)) {
      per[k].actions++;
      if (e.event_type === 'website_click') per[k].website++;
      if (e.event_type === 'call_click') { per[k].call++; if (!hadEarlier.has(k + '|call_click')) per[k].firstCall = true; }
      if (e.event_type === 'book_click') { per[k].book++; if (!hadEarlier.has(k + '|book_click')) per[k].firstBook = true; }
      if (e.event_type === 'message_click') per[k].message++;
      if (e.event_type === 'directions_click') per[k].directions++;
    }
  }

  const claimedTouched = P.filter((p) => p.is_claimed && (p.decision_drivers || {}).claim_engine);
  const trackA = [], manual = [], skipped = { cap: 0, recent: 0, suppressed: 0, replied: 0, pending: 0 };
  for (const p of P) {
    if (p.is_hidden || p.is_claimed || p.country !== 'Canada') continue;
    const st = per[String(p.id)];
    if (!st) continue;
    const qualifies = st.actions >= 5 || st.views >= 15 || st.firstCall || st.firstBook;
    if (!qualifies) continue;
    const t = touchCount(p);
    if (t >= 3) { skipped.cap++; continue; }
    if (lastContactAt(p) > now - 14 * DAY) { skipped.recent++; continue; }
    if (p.reply_category) { skipped.replied++; continue; }
    const ce = (p.decision_drivers || {}).claim_engine || {};
    if (ce.pending_draft && new Date(ce.pending_draft).getTime() > now - 14 * DAY) { skipped.pending++; continue; }
    const em = (p.email || '').toLowerCase().trim();
    if (em && suppressed.has(em)) { skipped.suppressed++; continue; }
    const row = {
      id: p.id, name: p.name, slug: p.slug, city: p.city, state: p.state,
      email: validEmail(p.email) && !p.email_bounced ? p.email : null,
      website: p.website || null,
      touch: t + 1, language: QC.test((p.state || '') + ' ' + (p.city || '')) ? 'fr' : 'en',
      stats: st, claimUrl: 'https://www.thedripmap.com/providers/' + p.slug + '?claim=1',
    };
    if (row.email) trackA.push(row); else manual.push(row);
  }
  trackA.sort((a, b) => (b.stats.actions - a.stats.actions) || (b.stats.views - a.stats.views));

  const trackB = P.filter((p) => !p.is_hidden && !p.is_claimed && p.country === 'Canada' && p.created_at >= d7 && touchCount(p) === 0 && !suppressed.has((p.email || '').toLowerCase().trim()))
    .map((p) => ({ id: p.id, name: p.name, slug: p.slug, city: p.city, email: validEmail(p.email) ? p.email : null, listingUrl: 'https://www.thedripmap.com/providers/' + p.slug, claimUrl: 'https://www.thedripmap.com/providers/' + p.slug + '?claim=1', language: QC.test((p.state || '') + ' ' + (p.city || '')) ? 'fr' : 'en' }));

  // pending claims older than 48h (hygiene report; reminder cron owns the nudge)
  const { data: pend } = await s.from('claim_requests').select('owner_name,email,created_at,status').eq('status', 'pending');
  const stale = (pend || []).filter((c) => new Date(c.created_at).getTime() < now - 2 * DAY);

  const budget = Math.max(0, MAX_DRAFTS_PER_DAY);
  const order = {
    date: new Date().toISOString().slice(0, 10),
    caps: { perDay: MAX_DRAFTS_PER_DAY },
    trackA: trackA.slice(0, budget),
    trackB: trackB.slice(0, Math.max(0, budget - Math.min(trackA.length, budget))),
    manualContactForm: manual,
    skipped,
    hygiene: {
      newClaimsFromEngine: claimedTouched.map((p) => ({ name: p.name, convertedAfterTouch: touchCount(p) })),
      stalePendingClaims: stale.map((c) => ({ owner: c.owner_name, email: c.email, ageDays: Math.floor((now - new Date(c.created_at).getTime()) / DAY) })),
    },
  };
  console.log(JSON.stringify(order, null, 1));
  if (!order.trackA.length && !order.trackB.length) console.error('\nZERO qualifying clinics today. Per spec: log it and stop. Never lower the bar.');
})().catch((e) => { console.error('FATAL: ' + e.message); process.exit(1); });
