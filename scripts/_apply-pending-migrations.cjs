// Try to apply the two pending migrations from 2026-06-08:
//   - scripts/sql/add-safety-verified.sql (providers.safety_verified column)
//   - scripts/sql/add-kit-orders.sql (kit_orders table)
//
// Strategy mirrors scripts/_add-regulator-override-column.cjs:
//   1. Probe to see if each migration's effect is already present.
//   2. If missing, try generic exec_sql / execute_sql / sql RPCs.
//   3. If all RPCs fail, print the SQL the operator must paste into the
//      Supabase SQL editor.
//
// Run: node scripts/_apply-pending-migrations.cjs
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1];
const SB = get('NEXT_PUBLIC_SUPABASE_URL');
const KEY = get('SUPABASE_SERVICE_ROLE_KEY');

const SAFETY_SQL = fs.readFileSync('scripts/sql/add-safety-verified.sql', 'utf8');
const KIT_SQL = fs.readFileSync('scripts/sql/add-kit-orders.sql', 'utf8');

async function rpcCall(fn, body) {
  const r = await fetch(SB + '/rest/v1/rpc/' + fn, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, status: r.status, text: await r.text() };
}

async function probeColumn(table, col) {
  const r = await fetch(SB + '/rest/v1/' + table + '?select=' + col + '&limit=1', {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
  });
  if (r.ok) return { exists: true };
  const t = await r.text();
  return { exists: false, reason: t.slice(0, 200) };
}

async function probeTable(table) {
  const r = await fetch(SB + '/rest/v1/' + table + '?select=id&limit=1', {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
  });
  if (r.ok) return { exists: true };
  const t = await r.text();
  return { exists: false, reason: t.slice(0, 200) };
}

async function tryApplySql(sql, label) {
  console.log('Attempting to run ' + label + ' via RPC...');
  for (const fn of ['exec_sql', 'execute_sql', 'sql', 'run_sql']) {
    for (const arg of ['query', 'sql', 'statement']) {
      const body = {};
      body[arg] = sql;
      const r = await rpcCall(fn, body);
      if (r.ok) {
        console.log('  OK via rpc.' + fn + '({' + arg + '}).');
        return true;
      }
    }
  }
  console.log('  No exec-SQL RPC available on this project.');
  return false;
}

function printManual(sql, file) {
  console.log('');
  console.log('========================================================');
  console.log('Operator: paste this into the Supabase SQL editor');
  console.log('  https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new');
  console.log('Source file: ' + file);
  console.log('--------------------------------------------------------');
  console.log(sql.trim());
  console.log('========================================================');
}

(async () => {
  // --- Migration 1: providers.safety_verified ---
  console.log('=== Migration 1: providers.safety_verified ===');
  let r = await probeColumn('providers', 'safety_verified');
  if (r.exists) {
    console.log('  Already present. Skip.');
  } else {
    console.log('  Missing.');
    const applied = await tryApplySql(SAFETY_SQL, 'add-safety-verified.sql');
    r = await probeColumn('providers', 'safety_verified');
    if (r.exists) {
      console.log('  Verified: column now exists.');
    } else if (!applied) {
      printManual(SAFETY_SQL, 'scripts/sql/add-safety-verified.sql');
    } else {
      console.log('  RPC claimed success but column still missing.');
      console.log('  ' + r.reason);
    }
  }

  // --- Migration 2: kit_orders table ---
  console.log('');
  console.log('=== Migration 2: kit_orders table ===');
  let r2 = await probeTable('kit_orders');
  if (r2.exists) {
    console.log('  Already present. Skip.');
  } else {
    console.log('  Missing.');
    const applied = await tryApplySql(KIT_SQL, 'add-kit-orders.sql');
    r2 = await probeTable('kit_orders');
    if (r2.exists) {
      console.log('  Verified: table now exists.');
    } else if (!applied) {
      printManual(KIT_SQL, 'scripts/sql/add-kit-orders.sql');
    } else {
      console.log('  RPC claimed success but table still missing.');
      console.log('  ' + r2.reason);
    }
  }
})();
