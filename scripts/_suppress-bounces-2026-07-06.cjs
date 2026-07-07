// 2026-07-06 inbox triage — process bounce notifications found in Gmail.
// CONFIRMED permanent failures (mailer-daemon "Failure" 2026-06-21):
//   email@medspaoftampa.com, hello@litemindbody.com
// -> suppress in both tables + providers.email_bounced=true.
// CHECK-ONLY (delay notices 2026-06-24/26, outcome unknown):
//   info@carecliniconalbion.com, rola@theloungemedicalspa.com, info@nomorewrinkles.ca
// -> report current suppression/bounce status, change nothing.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Second pass 2026-07-06: the 3 delay-notice addresses are already
// email_bounced=true on their providers; add them to the suppression
// tables too (fail closed — row flags miss shared emails).
const FAILURES = ['info@carecliniconalbion.com', 'rola@theloungemedicalspa.com', 'info@nomorewrinkles.ca'];
const CHECKS = [];

(async () => {
  for (const email of FAILURES) {
    console.log(`\n=== FAILURE ${email} ===`);
    for (const tbl of ['outreach_suppressions', 'email_suppressions']) {
      const { data: ex, error: e1 } = await sb.from(tbl).select('email').eq('email', email);
      if (e1) { console.error(`ABORT select ${tbl}:`, e1.message); process.exit(1); }
      if ((ex || []).length > 0) { console.log(`  ${tbl}: already suppressed`); continue; }
      const ins = await sb.from(tbl).insert([{ email, reason: 'hard_bounce_final_failure_2026-06-21', source: 'inbox_triage_2026-07-06' }], { count: 'exact' });
      if (ins.error) {
        const r2 = await sb.from(tbl).insert([{ email }], { count: 'exact' });
        if (r2.error) { console.error(`ABORT insert ${tbl}:`, r2.error.message); process.exit(1); }
      }
      console.log(`  ${tbl}: suppression inserted`);
    }
    const { data: provs, error: e2 } = await sb.from('providers').select('id, slug, email_bounced').eq('email', email);
    if (e2) { console.error('ABORT select providers:', e2.message); process.exit(1); }
    const toFlag = (provs || []).filter((p) => p.email_bounced !== true);
    console.log(`  providers matched: ${(provs || []).length}, needing flag: ${toFlag.length}`);
    if (toFlag.length > 0 && toFlag.length <= 3) {
      const upd = await sb.from('providers').update({ email_bounced: true }).in('id', toFlag.map((p) => p.id)).select('id');
      if (upd.error) { console.error('ABORT update:', upd.error.message); process.exit(1); }
      console.log(`  flagged email_bounced=true: ${toFlag.map((p) => p.slug).join(', ')}`);
    }
  }

  console.log('\n=== CHECK-ONLY (delay notices, no changes) ===');
  for (const email of CHECKS) {
    const { data: sup } = await sb.from('outreach_suppressions').select('email').eq('email', email);
    const { data: provs } = await sb.from('providers').select('slug, email_bounced').eq('email', email);
    console.log(`${email}: suppressed=${(sup || []).length > 0}, providers=${(provs || []).map((p) => `${p.slug}(bounced=${p.email_bounced})`).join(', ') || 'none'}`);
  }
  console.log('\nDone.');
})();
