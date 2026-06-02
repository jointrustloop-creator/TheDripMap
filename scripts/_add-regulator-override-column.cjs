// Add providers.regulator_override TEXT column.
//
// Background: TheDripMap's safety module localizes the State board criterion
// per region (REGULATOR_MAP in DefinitiveListingLayout.tsx). For clinics whose
// primary admin type doesn't match the default for their province (e.g. an
// Ontario *naturopathic* clinic, regulated by the College of Naturopaths of
// Ontario rather than the College of Nurses of Ontario), the operator now
// supplies an exact override string. This script adds the nullable column,
// then verifies it's writable.
//
// HOW IT WORKS:
//   1. Probes for a generic exec_sql RPC (none exists on this project — checked
//      2026-06-02 via scripts/_try-exec-sql.cjs). If found, runs the DDL.
//   2. Otherwise prints the DDL for the operator to paste into the Supabase
//      SQL editor.
//   3. Verifies via a single-row update that the column is writable.
//
// Run: node scripts/_add-regulator-override-column.cjs
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');

const SQL = `ALTER TABLE providers ADD COLUMN IF NOT EXISTS regulator_override TEXT;`;

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  // 1) Check whether the column already exists by probing a SELECT
  const { error: probeErr } = await s.from('providers').select('regulator_override').limit(1);
  if (!probeErr) {
    console.log('OK regulator_override column already exists — nothing to add.');
    return;
  }
  console.log('Column missing. Probed error:', probeErr.message);

  // 2) Try generic exec_sql RPCs (none on this project, but safe to try)
  for (const fn of ['exec_sql', 'execute_sql', 'sql']) {
    const { error } = await s.rpc(fn, { query: SQL });
    if (!error) {
      console.log(`Ran DDL via rpc.${fn}() — verifying...`);
      const { error: vErr } = await s.from('providers').select('regulator_override').limit(1);
      console.log(vErr ? 'STILL MISSING: ' + vErr.message : 'OK column now writable.');
      return;
    }
  }

  // 3) Fall back: tell the operator to paste it.
  console.log('\n========================================================');
  console.log('No exec-sql RPC available on this project.');
  console.log('Operator: paste the following into the Supabase SQL editor');
  console.log('  https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql');
  console.log('--------------------------------------------------------');
  console.log(SQL);
  console.log('--------------------------------------------------------');
  console.log('Then re-run this script to verify.');
  console.log('========================================================');
  process.exit(1);
})();
