// 2026-07-06 inbox triage — Mobile IV Canada (mobileivhomecare@gmail.com)
// replied "Unsubscribe" on 2026-06-24 to the claim outreach. CASL: suppress
// in BOTH suppression tables and mark the provider not_interested so no
// pipeline (daily drafts, follow-ups, nudges) ever selects them again.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const EMAIL = 'mobileivhomecare@gmail.com';
const REASON = 'unsubscribe_reply_2026-06-24';

(async () => {
  for (const tbl of ['outreach_suppressions', 'email_suppressions']) {
    const { data: existing, error: e1 } = await sb.from(tbl).select('email').eq('email', EMAIL);
    if (e1) { console.error(`ABORT select ${tbl}:`, e1.message); process.exit(1); }
    if ((existing || []).length > 0) {
      console.log(`${tbl}: already suppressed, skip`);
      continue;
    }
    const ins = await sb.from(tbl).insert([{ email: EMAIL, reason: REASON, source: 'inbox_triage_2026-07-06' }], { count: 'exact' });
    if (ins.error) {
      console.log(`${tbl}: insert w/ reason failed (${ins.error.message}), retrying email-only`);
      const r2 = await sb.from(tbl).insert([{ email: EMAIL }], { count: 'exact' });
      if (r2.error) { console.error(`ABORT insert ${tbl}:`, r2.error.message); process.exit(1); }
    }
    console.log(`${tbl}: suppression inserted`);
  }

  const { data: provs, error: e2 } = await sb
    .from('providers')
    .select('id, slug, name, reply_category')
    .eq('email', EMAIL);
  if (e2) { console.error('ABORT select providers:', e2.message); process.exit(1); }
  console.log(`matching providers: ${(provs || []).length}: ${(provs || []).map((p) => p.slug).join(', ')}`);
  if ((provs || []).length > 3) { console.error('ABORT: >3 providers on one email, review manually'); process.exit(1); }
  const toFlag = (provs || []).filter((p) => p.reply_category !== 'not_interested');
  if (toFlag.length > 0) {
    const upd = await sb
      .from('providers')
      .update({ reply_category: 'not_interested' })
      .in('id', toFlag.map((p) => p.id))
      .select('id');
    if (upd.error) { console.error('ABORT update providers:', upd.error.message); process.exit(1); }
    console.log(`marked not_interested on ${(upd.data || []).length}`);
  } else {
    console.log('providers already marked not_interested (or none matched)');
  }
  console.log('Done.');
})();
