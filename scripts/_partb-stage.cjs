/**
 * _partb-stage.cjs (2026-08) — compute the Part B score-powered outreach list.
 *
 * Applies every approved rule and writes the ready-to-send drafts to
 * .audit-tmp/_partb-drafts.json, ordered priority-cities-first. Prints the
 * counts report. Does NOT touch Gmail (staging is done via the MCP after this).
 */
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const MAILING = 'TheDripMap, Caledon, Ontario, Canada';
const PRIORITY = ['Toronto', 'Mississauga', 'Vaughan', 'Richmond Hill', 'Markham', 'Brampton', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'];
const CITY_20PLUS = { Montreal: 83, Toronto: 34, Mississauga: 24 }; // >=20 views/30d

function footer(name) {
  return `\n\nYou are receiving this because ${name} is listed on TheDripMap, the Canadian IV therapy matching platform. ${MAILING}. Reply with the word REMOVE and we will not contact you again.`;
}

// Human phrasing: never render internal check labels in email copy.
const PHRASE = {
  'Medical oversight disclosed': 'who provides medical oversight',
  'Administering professional identified': 'who administers your IVs',
  'Health screening disclosed': 'whether there is a health screening before treatment',
  'Drip ingredients disclosed': 'what is in your drips',
  'Pricing published': 'your pricing',
  'Business details confirmed': 'your current business details',
  'Booking path available': 'how patients can book',
};
const phraseFor = (label) => PHRASE[label] || label.toLowerCase();
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const numWord = (n) => (n >= 0 && n < 10 ? NUM[n] : String(n));
function joinNatural(arr) {
  if (arr.length <= 1) return arr[0] || '';
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
}

(async () => {
  // suppression sets
  const supp = new Set();
  for (const t of ['email_suppressions', 'outreach_suppressions']) {
    try { const { data } = await s.from(t).select('email'); (data || []).forEach((r) => r.email && supp.add(r.email.toLowerCase().trim())); } catch {}
  }
  // views 30d
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  let ev = [], f = 0;
  while (true) { const { data } = await s.from('listing_events').select('provider_id,event_type,created_at').eq('event_type', 'view').gte('created_at', since).range(f, f + 999); if (!data || !data.length) break; ev = ev.concat(data); if (data.length < 1000) break; f += 1000; }
  const pv = {}; ev.forEach((e) => pv[e.provider_id] = (pv[e.provider_id] || 0) + 1);

  // providers
  let P = [], g = 0;
  while (true) { const { data } = await s.from('providers').select('id,name,slug,city,state,country,email,email_bounced,is_claimed,is_hidden,transparency_score,transparency_checks,outreach_sent,followup_sent,reply_category,needs_human,decision_drivers,forward_leads').range(g, g + 999); if (!data || !data.length) break; P = P.concat(data); if (data.length < 1000) break; g += 1000; }

  const counts = { total_ca_unclaimed: 0, staged: 0, first_touch: 0, followup_replacement: 0, capped_out: 0, suppressed: 0, skipped_0of7: 0, no_email: 0, bounced: 0, us_excluded: 0, other_excluded: 0 };
  const drafts = [];

  for (const p of P) {
    if (p.is_hidden || p.is_claimed) continue;
    if (p.country !== 'Canada') { counts.us_excluded++; continue; }
    counts.total_ca_unclaimed++;
    const email = (p.email || '').toLowerCase().trim();
    if (!email) { counts.no_email++; continue; }
    if (p.email_bounced) { counts.bounced++; continue; }
    if (supp.has(email)) { counts.suppressed++; continue; }
    if (['not_interested', 'replied', 'closed', 'flagged', 'unsubscribed'].includes((p.reply_category || '').toLowerCase())) { counts.other_excluded++; continue; }
    if (p.needs_human) { counts.other_excluded++; continue; }
    if ((p.decision_drivers || {}).source === 'orphan_claim_stub') { counts.other_excluded++; continue; }
    const touches = (p.outreach_sent ? 1 : 0) + (p.followup_sent ? 1 : 0);
    if (touches >= 2) { counts.capped_out++; continue; }
    const score = p.transparency_score;
    if (score == null) { counts.other_excluded++; continue; }
    if (score === 0) { counts.skipped_0of7++; continue; } // nothing true to say
    const unmet = (p.transparency_checks || []).filter((c) => !c.passed).map((c) => c.label);
    const unmetPhrases = unmet.map(phraseFor);
    const views = pv[p.id] || 0;
    const cityViews = CITY_20PLUS[p.city] || 0;
    const isFollowup = touches === 1;
    const band = score <= 2 ? '0-2' : '3-5';
    const viewLine = views >= 5 ? ` Your listing was viewed ${views} times in the same period.` : '';
    const cityLine = cityViews >= 20 ? `Patients in ${p.city} compared IV therapy clinics on TheDripMap ${cityViews} times in the last month.` : '';

    let subject, body;
    if (band === '0-2') {
      subject = `Patients are comparing ${p.city} IV clinics on TheDripMap`;
      const lead = cityLine ? cityLine + viewLine : `Patients are comparing IV therapy clinics in ${p.city} on TheDripMap.` + viewLine;
      body = `Hi ${p.name} team,\n\n${lead}\n\nRight now your listing shows ${score} of the 7 transparency details patients look for before they book. The ${numWord(unmet.length)} not yet shown are ${joinNatural(unmetPhrases)}. Claiming your listing is free and takes a few minutes, and filling these in updates what patients see right away.${footer(p.name)}`;
    } else {
      subject = `${p.name} shows ${score} of 7 transparency details on TheDripMap`;
      const cityBit = cityLine ? '\n\n' + cityLine : '';
      body = `Hi ${p.name} team,\n\nYour listing on TheDripMap already shows ${score} of 7 transparency details, which puts you ahead of most clinics in ${p.city}. You are ${numWord(unmet.length)} details away from a full 7 of 7: ${joinNatural(unmetPhrases)}.${cityBit}${viewLine ? '\n\n' + viewLine.trim() : ''}\n\nClaiming your listing is free and takes a few minutes, and adding those details completes your profile the moment you save.${footer(p.name)}`;
    }

    const prioIdx = PRIORITY.indexOf(p.city);
    drafts.push({ id: p.id, to: p.email, name: p.name, city: p.city, score, band, touch: isFollowup ? 'followup-replacement' : 'first', views, subject, body, _prio: prioIdx === -1 ? 999 : prioIdx, _views: views });
    counts.staged++;
    if (isFollowup) counts.followup_replacement++; else counts.first_touch++;
  }

  drafts.sort((a, b) => a._prio - b._prio || b._views - a._views);
  // One conversation per clinic: dedupe by email (keep the highest-priority
  // instance). Collapses shared-inbox chains (e.g. Signature, Higher Health).
  const seenEmail = new Set();
  const deduped = [];
  let dupDropped = 0;
  for (const d of drafts) {
    const key = d.to.toLowerCase().trim();
    if (seenEmail.has(key)) { dupDropped++; continue; }
    seenEmail.add(key);
    deduped.push(d);
  }
  counts.dup_same_email_dropped = dupDropped;
  counts.staged = deduped.length;
  counts.first_touch = deduped.filter((d) => d.touch === 'first').length;
  counts.followup_replacement = deduped.filter((d) => d.touch === 'followup-replacement').length;
  fs.writeFileSync('.audit-tmp/_partb-drafts.json', JSON.stringify(deduped, null, 2));
  drafts.length = 0; drafts.push(...deduped);

  console.log('=== PART B qualifying counts ===');
  Object.entries(counts).forEach(([k, v]) => console.log('  ' + k.padEnd(22) + v));
  console.log('\n=== first 25 (priority order) ===');
  drafts.slice(0, 25).forEach((d, i) => console.log(`  ${String(i + 1).padStart(2)}. [${d.band}/${d.touch}] ${d.name} (${d.city}) score ${d.score} views ${d.views} -> ${d.to}`));
  console.log(`\nWrote ${drafts.length} drafts to .audit-tmp/_partb-drafts.json`);
})();
