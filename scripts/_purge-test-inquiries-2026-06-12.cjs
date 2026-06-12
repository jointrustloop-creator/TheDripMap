// A1 (operator-approved 2026-06-12): purge the 2026-05-26 delivery-test loop
// from inquiries. Backs up every row to JSON BEFORE deleting. SELECT first,
// exact-count abort, scoped strictly to the two test emails.
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEST_EMAILS = ['pipeline-test@thedripmap.com', 'verify-dns-fix@test.com'];
const EXPECTED = 2217;
const BACKUP = 'scripts/_inquiries-purge-backup-2026-06-12.json';

(async () => {
  // SELECT first: pull every row we intend to delete.
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb.from('inquiries')
      .select('*')
      .in('email', TEST_EMAILS)
      .range(from, from + 999);
    if (error) { console.error('ABORT select:', error.message); process.exit(1); }
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Rows matching test emails: ${rows.length} (expected ${EXPECTED})`);
  if (rows.length !== EXPECTED) {
    console.error(`ABORT: scope mismatch. Expected exactly ${EXPECTED}, found ${rows.length}. Nothing deleted.`);
    process.exit(1);
  }
  // Sanity: every row must be from 2026-05-26 and match a test email.
  const bad = rows.filter(r => !TEST_EMAILS.includes((r.email || '').toLowerCase()) || !(r.created_at || '').startsWith('2026-05'));
  if (bad.length) { console.error(`ABORT: ${bad.length} rows fail the sanity check. Nothing deleted.`); process.exit(1); }

  fs.writeFileSync(BACKUP, JSON.stringify(rows, null, 1));
  console.log(`Backup written: ${BACKUP} (${rows.length} rows)`);

  const { error: delErr, count } = await sb.from('inquiries')
    .delete({ count: 'exact' })
    .in('email', TEST_EMAILS);
  if (delErr) { console.error('ABORT delete:', delErr.message); process.exit(1); }
  if (count !== EXPECTED) {
    console.error(`WARNING: deleted ${count}, expected ${EXPECTED}. Check backup + admin/leads.`);
    process.exit(1);
  }
  const { count: remaining } = await sb.from('inquiries').select('id', { count: 'exact', head: true });
  console.log(`Deleted ${count}. Remaining inquiries rows: ${remaining} (expect 4).`);
})();
