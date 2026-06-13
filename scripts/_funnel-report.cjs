// Read-only claim funnel report. Computes outreach -> claim -> verify -> finish
// from existing timestamps (no schema changes). Safe to run anytime.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : 'n/a');

async function countAll(table, build) {
  // paginate to bypass the 1000-row cap when needed
  let from = 0, total = 0, rows = [];
  while (true) {
    let q = sb.from(table).select('*').range(from, from + 999);
    if (build) q = build(q);
    const { data, error } = await q;
    if (error) { console.error(table, 'err', error.message); break; }
    rows.push(...data); total += data.length;
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

(async () => {
  console.log('================ THEDRIPMAP CLAIM FUNNEL ================\n');

  // Providers
  const provs = await countAll('providers', (q) => q.eq('is_hidden', false));
  const withEmail = provs.filter((p) => p.email);
  const outreached = provs.filter((p) => p.outreach_sent_at);
  const claimed = provs.filter((p) => p.is_claimed === true);
  const featured = provs.filter((p) => p.is_featured === true);
  const safety = provs.filter((p) => p.safety_verified === true);
  const bounced = provs.filter((p) => p.email_bounced === true);
  const finished = provs.filter((p) => p.decision_drivers && typeof p.decision_drivers === 'object' && p.decision_drivers.manage);
  const claimedFromOutreach = provs.filter((p) => p.is_claimed === true && p.outreach_sent_at);

  // Claim requests
  const claims = await countAll('claim_requests');
  const verifiedClaims = claims.filter((c) => c.status === 'verified');
  const pendingClaims = claims.filter((c) => c.status !== 'verified');

  // Onboarding
  let onb = [];
  try { onb = await countAll('onboarding_requests'); } catch {}
  const onbBy = {};
  onb.forEach((o) => { onbBy[o.status] = (onbBy[o.status] || 0) + 1; });

  // Suppressions
  let supp = 0;
  try { const { data } = await sb.from('outreach_suppressions').select('email'); supp = (data || []).length; } catch {}

  console.log('POOL');
  console.log(`  Active providers:        ${provs.length}`);
  console.log(`  With email on file:      ${withEmail.length} (${pct(withEmail.length, provs.length)})`);
  console.log(`  Email bounced:           ${bounced.length}`);
  console.log(`  In suppression list:     ${supp}`);

  console.log('\nFUNNEL (lifetime)');
  console.log(`  1. Outreach sent:        ${outreached.length}`);
  console.log(`  2. Claims started:       ${claims.length}`);
  console.log(`  3. Claims verified:      ${verifiedClaims.length}  (${pct(verifiedClaims.length, claims.length)} of started)`);
  console.log(`  4. Listings claimed:     ${claimed.length}`);
  console.log(`  5. Finished via /finish: ${finished.length}  (${pct(finished.length, claimed.length)} of claimed)`);
  console.log(`  6. Safety Verified:      ${safety.length}`);
  console.log(`  Featured (paid-ready):   ${featured.length}`);

  console.log('\nKEY CONVERSIONS');
  console.log(`  Outreach -> claimed:     ${pct(claimedFromOutreach.length, outreached.length)}  (${claimedFromOutreach.length}/${outreached.length})`);
  console.log(`  Claim start -> verified: ${pct(verifiedClaims.length, claims.length)}`);
  console.log(`  Verified -> finished:    ${pct(finished.length, claimed.length)}`);

  console.log('\nLEAKS TO WATCH');
  console.log(`  Claims started but NOT verified: ${pendingClaims.length}` + (pendingClaims.length ? '  <-- verify-nudge opportunity' : ''));
  console.log(`  Claimed but NOT finished:        ${claimed.length - finished.length}  <-- finish-nudge opportunity`);
  console.log(`  Claimed but NOT safety-verified: ${claimed.length - safety.length}`);
  console.log(`  Onboarding rows by status:       ${JSON.stringify(onbBy)}`);

  // Geographic of claimed
  const byCountry = {};
  claimed.forEach((p) => { byCountry[p.country || 'null'] = (byCountry[p.country || 'null'] || 0) + 1; });
  console.log(`\n  Claimed by country: ${JSON.stringify(byCountry)}`);
})();
