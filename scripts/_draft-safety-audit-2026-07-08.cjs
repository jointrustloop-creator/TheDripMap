// Safety-audit every current Gmail draft recipient before the operator sends.
// Flags: suppressed (either table), bounced, not_interested, email matching no
// provider, and the SAME email appearing in more than one draft (would double
// email a clinic in one day). Read-only.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// email -> [cohort labels] (a clinic in >1 cohort = same-day double-send risk)
const DRAFTS = [
  ['admin@trihealth.ca', 'Jul8-nudge'], ['info@unitybeauty.ca', 'Jul8-nudge'], ['info@barbeauty.ca', 'Jul8-nudge'],
  ['hello@vida-flow.com', 'Jul8-nudge'], ['info@vphealth.ca', 'Jul8-nudge'], ['info@puretehealth.ca', 'Jul8-nudge'],
  ['info@liftbotoxbar.com', 'Jul8-nudge'], ['hello@somaandsoul.ca', 'Jul8-nudge'], ['naturestouchnd@gmail.com', 'Jul8-nudge'],
  ['reception@insightnaturopathic.com', 'Jul8-nudge'], ['jennifer@diamondaesthetics.ca', 'Jul8-nudge'],
  ['5thave@evolvechiro.ca', 'Jul7-outreach'], ['info@jpdwellness.com', 'Jul7-outreach'],
  ['info@beautybarclinics.ca', 'Jul7-outreach'], ['info@elixirbeautyottawa.com', 'Jul7-outreach'],
  ['info@refreshmedspala.com', 'Jul5-deals'], ['info@bluecypressky.com', 'Jul5-deals'], ['info@liftbotoxbar.com', 'Jul5-deals'],
  ['drsmobiletherapy@gmail.com', 'Jul5-deals'], ['info@vphealth.ca', 'Jul5-deals'], ['info@kneadtherapy.ca', 'Jul5-deals'],
  ['reception@insightnaturopathic.com', 'Jul5-deals'], ['info@naturestouchnd.ca', 'Jul5-deals'], ['info@barbeauty.ca', 'Jul5-deals'],
  ['info@unitybeauty.ca', 'Jul5-deals'], ['erinmillshealth@bellnet.ca', 'Jul5-deals'], ['info@signaturebeautylounge.ca', 'Jul5-deals'],
  ['jennifer@diamondaesthetics.ca', 'Jul5-deals'], ['info@baywellnesscentre.com', 'Jul5-deals'], ['hello@vida-flow.com', 'Jul5-deals'],
  ['hello@somaandsoul.ca', 'Jul5-deals'], ['admin@trihealth.ca', 'Jul5-deals'], ['info@puretehealth.ca', 'Jul5-deals'],
  ['wellness@driptonic.ca', 'Jul5-deals'],
];

(async () => {
  const byEmail = {};
  for (const [e, c] of DRAFTS) (byEmail[e.toLowerCase()] = byEmail[e.toLowerCase()] || []).push(c);

  const suppressed = {};
  for (const tbl of ['email_suppressions', 'outreach_suppressions']) {
    const { data, error } = await s.from(tbl).select('email').range(0, 4999);
    if (error) { console.error('FATAL', tbl, error.message); process.exit(1); }
    for (const r of data || []) (suppressed[String(r.email).toLowerCase().trim()] = suppressed[String(r.email).toLowerCase().trim()] || []).push(tbl.replace('_suppressions', ''));
  }

  const emails = Object.keys(byEmail);
  const { data: provs } = await s.from('providers')
    .select('slug,name,city,email,is_claimed,safety_verified,email_bounced,reply_category')
    .in('email', emails);
  const provByEmail = {};
  for (const p of provs || []) provByEmail[(p.email || '').toLowerCase()] = p;

  const flags = [];
  console.log('DRAFT SAFETY AUDIT (', emails.length, 'unique recipients,', DRAFTS.length, 'drafts )\n');
  for (const e of emails) {
    const cohorts = byEmail[e];
    const p = provByEmail[e];
    const supp = suppressed[e];
    const marks = [];
    if (supp) marks.push('SUPPRESSED(' + supp.join('+') + ')');
    if (cohorts.length > 1) marks.push('DUPLICATE(' + cohorts.join(' & ') + ')');
    if (!p) marks.push('NO_PROVIDER_MATCH');
    if (p && p.email_bounced) marks.push('BOUNCED');
    if (p && p.reply_category === 'not_interested') marks.push('NOT_INTERESTED');
    const status = p ? `${p.is_claimed ? 'CLAIMED' : 'unclaimed'}${p.safety_verified ? '+VERIFIED' : ''}` : '-';
    const flag = marks.length ? '  <<< ' + marks.join(', ') : '';
    if (marks.length) flags.push(e);
    console.log(`${e.padEnd(34)} ${status.padEnd(18)} ${(p ? p.name : '(no match)').padEnd(30)} [${cohorts.join(',')}]${flag}`);
  }
  console.log(`\n${flags.length} recipient(s) flagged for review:`, flags.join(', ') || 'none');
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
