// Reconcile the operator's manual send of the 12:08 draft batch (sent 19:25 ET
// 2026-06-12). Marks outreach_sent=true + outreach_sent_at on every provider
// whose email received one, so W2 never re-drafts them. SELECT first, count
// check, abort on unexpected scope.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SENT_AT = '2026-06-12T23:25:00Z';
const EMAILS = [
  'info@zenithsante.com',
  'info@ziaiv.ca',
  'shahnaz@youthfulderma.ca',
  'info@xydlab.com',
  'info@yorkvillesportsmed.com',
  'manny@youthbar.ca',
  'info@yaletownintegrative.com',
  'info@winterholme.com',
];

(async () => {
  const { data: rows, error } = await sb
    .from('providers')
    .select('id, name, slug, email, outreach_sent, outreach_sent_at')
    .in('email', EMAILS);
  if (error) { console.error('ABORT select:', error.message); process.exit(1); }

  console.log(`Providers matching the 8 sent emails: ${rows.length}`);
  rows.forEach(r => console.log(`  ${r.email} -> ${r.slug} (outreach_sent=${r.outreach_sent}, at=${r.outreach_sent_at})`));

  const missing = EMAILS.filter(e => !rows.some(r => (r.email || '').toLowerCase() === e));
  if (missing.length) { console.error('ABORT: emails with no provider row:', missing); process.exit(1); }
  if (rows.length < 8 || rows.length > 12) {
    console.error(`ABORT: unexpected scope (${rows.length} rows for 8 emails; allow 8-12 for shared-email multi-location)`);
    process.exit(1);
  }

  const toMark = rows.filter(r => !r.outreach_sent_at);
  console.log(`Rows needing outreach_sent_at: ${toMark.length} (already marked: ${rows.length - toMark.length})`);
  let marked = 0;
  for (const r of toMark) {
    const { error: updErr, count } = await sb
      .from('providers')
      .update({ outreach_sent: true, outreach_sent_at: SENT_AT }, { count: 'exact' })
      .eq('id', r.id);
    if (updErr) { console.error(`ABORT updating ${r.slug}:`, updErr.message); process.exit(1); }
    if (count !== 1) { console.error(`ABORT: update scope ${count} for ${r.slug}`); process.exit(1); }
    marked++;
  }
  console.log(`Marked ${marked} provider rows outreach_sent=true at ${SENT_AT}. Done.`);
})();
