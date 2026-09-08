// Read-only weekly analyst gather. No writes.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const NOW = new Date();
const iso = (d) => d.toISOString();
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000);
const W1 = iso(daysAgo(7));   // this week start
const W2 = iso(daysAgo(14));  // prior week start
const CLICKS = ['book_click', 'call_click', 'website_click', 'directions_click', 'message_click'];

async function pageAll(table, build) {
  let from = 0; const rows = [];
  while (true) {
    let q = sb.from(table).select('*').range(from, from + 999);
    if (build) q = build(q);
    const { data, error } = await q;
    if (error) { console.log(`ERR ${table}: ${error.message}`); return rows; }
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

(async () => {
  console.log('WINDOW this week:', W1, '->', iso(NOW));
  console.log('WINDOW prior week:', W2, '->', W1);

  // ---------- 2. CONVERSION BY LISTING QUALITY ----------
  const evThis = await pageAll('listing_events', q => q.gte('created_at', W1));
  const evPrior = await pageAll('listing_events', q => q.gte('created_at', W2).lt('created_at', W1));
  console.log(`\n[EVENTS] this week=${evThis.length}  prior week=${evPrior.length}`);
  const mix = (evs) => { const m = {}; evs.forEach(e => m[e.event_type] = (m[e.event_type] || 0) + 1); return m; };
  console.log('[EVENT MIX this]', JSON.stringify(mix(evThis)));
  console.log('[EVENT MIX prior]', JSON.stringify(mix(evPrior)));

  const byProv = new Map();
  for (const e of evThis) {
    if (!e.provider_id) continue;
    if (!byProv.has(e.provider_id)) byProv.set(e.provider_id, { view: 0, clicks: 0 });
    const r = byProv.get(e.provider_id);
    if (e.event_type === 'view') r.view++;
    else if (CLICKS.includes(e.event_type)) r.clicks++;
  }
  console.log('[providers with events this week]', byProv.size);

  const ids = [...byProv.keys()];
  const provRows = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await sb.from('providers').select('*').in('id', ids.slice(i, i + 100));
    if (error) { console.log('prov err', error.message); break; }
    provRows.push(...data);
  }

  function attrs(p) {
    const desc = p.description || '';
    let svcCount = 0, svcWithPrice = 0;
    try {
      const arr = typeof p.services === 'string' ? JSON.parse(p.services) : p.services;
      if (Array.isArray(arr)) { svcCount = arr.length; svcWithPrice = arr.filter(s => JSON.stringify(s).match(/\$|price|cost/i)).length; }
    } catch {}
    const mt = p.medical_team;
    const mtLen = mt ? JSON.stringify(mt).length : 0;
    return {
      hasSvcPricing: svcWithPrice > 0 || /\$\d{2,}/.test(desc),
      svcCount,
      hasPhotos: !!(p.photos && JSON.stringify(p.photos).length > 10) || !!p.image_url || !!p.imageUrl,
      claimed: !!p.is_claimed,
      featured: !!p.is_featured,
      safetyVerified: !!p.safety_verified,
      namedPractitionerDesc: /\b(Dr\.|RN|NP|ND|nurse|naturopath\w*|MD)\b/.test(desc),
      hasMedicalTeam: mtLen > 10,
    };
  }
  const rows = provRows.map(p => ({ name: p.name, city: p.city, slug: p.slug, ...attrs(p), ...byProv.get(p.id) }));

  function cohort(label, pred) {
    const g = rows.filter(pred);
    const v = g.reduce((s, r) => s + r.view, 0), c = g.reduce((s, r) => s + r.clicks, 0);
    console.log(`  ${label.padEnd(26)} n=${String(g.length).padStart(4)} views=${String(v).padStart(5)} clicks=${String(c).padStart(4)} rate=${v ? (c / v * 100).toFixed(1) + '%' : 'n/a'}${v < 20 ? '  [<20 views: directional only]' : ''}`);
  }
  console.log('\n[COHORTS this week, pooled clicks/views]');
  cohort('hasSvcPricing', r => r.hasSvcPricing);
  cohort('noSvcPricing', r => !r.hasSvcPricing);
  cohort('svcCount>=3', r => r.svcCount >= 3);
  cohort('svcCount=0', r => r.svcCount === 0);
  cohort('namedPractitioner(desc)', r => r.namedPractitionerDesc);
  cohort('noNamedPractitioner', r => !r.namedPractitionerDesc);
  cohort('hasMedicalTeam', r => r.hasMedicalTeam);
  cohort('noMedicalTeam', r => !r.hasMedicalTeam);
  cohort('claimed=true', r => r.claimed);
  cohort('claimed=false', r => !r.claimed);
  cohort('featured=true', r => r.featured);
  cohort('safetyVerified=true', r => r.safetyVerified);
  cohort('hasPhotos', r => r.hasPhotos);
  cohort('noPhotos', r => !r.hasPhotos);
  console.log(`  TOTAL                      n=${rows.length} views=${rows.reduce((s, r) => s + r.view, 0)} clicks=${rows.reduce((s, r) => s + r.clicks, 0)}`);

  console.log('\n[TOP 10 by clicks this week]');
  rows.slice().sort((a, b) => b.clicks - a.clicks).slice(0, 10).forEach(r =>
    console.log(`  ${r.clicks}c/${r.view}v | ${r.name} (${r.city}) claimed=${r.claimed} pricing=${r.hasSvcPricing} team=${r.hasMedicalTeam}`));

  // ---------- 3. SEO ----------
  const runsThis = await pageAll('seo_health_runs', q => q.gte('started_at', W1));
  const runsPrior = await pageAll('seo_health_runs', q => q.gte('started_at', W2).lt('started_at', W1));
  const sumRuns = (rs) => {
    const byLayer = {};
    rs.forEach(r => {
      byLayer[r.layer] = byLayer[r.layer] || { runs: 0, issues: 0, crawled: 0, statuses: {} };
      byLayer[r.layer].runs++;
      byLayer[r.layer].issues += r.issue_count || 0;
      byLayer[r.layer].crawled += r.crawled_urls || 0;
      byLayer[r.layer].statuses[r.status] = (byLayer[r.layer].statuses[r.status] || 0) + 1;
    });
    return byLayer;
  };
  console.log('\n[SEO RUNS this week]', JSON.stringify(sumRuns(runsThis)));
  console.log('[SEO RUNS prior week]', JSON.stringify(sumRuns(runsPrior)));

  const fThis = await pageAll('seo_health_findings', q => q.gte('seen_at', W1));
  const fPrior = await pageAll('seo_health_findings', q => q.gte('seen_at', W2).lt('seen_at', W1));
  const byType = (fs) => { const m = {}; fs.forEach(f => m[f.type] = (m[f.type] || 0) + 1); return m; };
  console.log(`[FINDINGS this=${fThis.length} prior=${fPrior.length}]`);
  console.log('  this by type:', JSON.stringify(byType(fThis)));
  console.log('  prior by type:', JSON.stringify(byType(fPrior)));

  // ---------- 4. OUTREACH ----------
  const provsAll = await pageAll('providers');
  const active = provsAll.filter(p => !p.is_hidden);
  const outThis = active.filter(p => p.outreach_sent_at && p.outreach_sent_at >= W1);
  const outPrior = active.filter(p => p.outreach_sent_at && p.outreach_sent_at >= W2 && p.outreach_sent_at < W1);
  const fuThis = active.filter(p => p.followup_sent_at && p.followup_sent_at >= W1);
  console.log(`\n[OUTREACH] sent this week=${outThis.length}  prior week=${outPrior.length}  followups this week=${fuThis.length}`);
  const repliesThis = active.filter(p => p.reply_received_at && p.reply_received_at >= W1);
  console.log(`[REPLIES] received this week=${repliesThis.length}`);
  const rc = {}; active.filter(p => p.reply_category).forEach(p => rc[p.reply_category] = (rc[p.reply_category] || 0) + 1);
  const rs = {}; active.filter(p => p.reply_status).forEach(p => rs[p.reply_status] = (rs[p.reply_status] || 0) + 1);
  console.log('[reply_category lifetime]', JSON.stringify(rc));
  console.log('[reply_status lifetime]', JSON.stringify(rs));
  console.log(`[bounced lifetime]=${active.filter(p => p.email_bounced).length}`);
  const supp = await pageAll('outreach_suppressions');
  const esupp = await pageAll('email_suppressions');
  console.log(`[suppressions] outreach_suppressions=${supp.length} (new this week=${supp.filter(s => s.created_at >= W1).length})  email_suppressions=${esupp.length} (new this week=${esupp.filter(s => s.suppressed_at >= W1).length})`);
  console.log(`[outreach lifetime] sent=${active.filter(p => p.outreach_sent_at).length}  never-emailed w/ email=${active.filter(p => p.email && !p.outreach_sent_at && !p.email_bounced).length}`);

  // ---------- claims / onboarding this week ----------
  const claims = await pageAll('claim_requests');
  console.log(`\n[CLAIMS] started this week=${claims.filter(c => c.created_at >= W1).length} (prior=${claims.filter(c => c.created_at >= W2 && c.created_at < W1).length})  verified this week=${claims.filter(c => c.verified_at && c.verified_at >= W1).length} (prior=${claims.filter(c => c.verified_at && c.verified_at >= W2 && c.verified_at < W1).length})`);
  const claimedThis = active.filter(p => p.claimed_at && p.claimed_at >= W1);
  console.log(`[CLAIMED listings] this week=${claimedThis.length} (${claimedThis.map(p => p.slug).join(', ') || 'none'})  prior week=${active.filter(p => p.claimed_at && p.claimed_at >= W2 && p.claimed_at < W1).length}`);
  const pend = claims.filter(c => c.status !== 'verified');
  console.log(`[claims not verified] ${pend.length}: ${pend.map(c => c.email + '/' + c.status).join(' | ')}`);

  const onb = await pageAll('onboarding_requests');
  const ob = {}; onb.forEach(o => ob[o.status] = (ob[o.status] || 0) + 1);
  console.log(`[ONBOARDING] ${JSON.stringify(ob)}  sent this week=${onb.filter(o => o.sent_at && o.sent_at >= W1).length}  submitted this week=${onb.filter(o => o.published_at && o.published_at >= W1).length}`);

  // ---------- leads ----------
  const inq = await pageAll('inquiries');
  console.log(`\n[INQUIRIES] total=${inq.length}  this week=${inq.filter(i => (i.created_at || '') >= W1).length}  prior week=${inq.filter(i => (i.created_at || '') >= W2 && (i.created_at || '') < W1).length}`);
  if (inq[0]) console.log('  inquiries cols:', Object.keys(inq[0]).sort().join(', '));
  const ld = await pageAll('lead_deliveries');
  console.log(`[LEAD_DELIVERIES] total=${ld.length}  this week=${ld.filter(l => (l.delivered_at || '') >= W1).length}  prior=${ld.filter(l => (l.delivered_at || '') >= W2 && (l.delivered_at || '') < W1).length}`);

  // ---------- safety review queue ----------
  const srs = {}; active.forEach(p => { if (p.safety_review_status) srs[p.safety_review_status] = (srs[p.safety_review_status] || 0) + 1; });
  console.log(`[SAFETY REVIEW STATUS] ${JSON.stringify(srs)}`);

  // ---------- discovery ----------
  const newProv = provsAll.filter(p => p.created_at >= W1);
  console.log(`[NEW PROVIDER ROWS] this week=${newProv.length}  prior week=${provsAll.filter(p => p.created_at >= W2 && p.created_at < W1).length}`);
  const bc = {}; newProv.forEach(p => bc[p.country || 'null'] = (bc[p.country || 'null'] || 0) + 1);
  console.log('  new by country:', JSON.stringify(bc));
})();
