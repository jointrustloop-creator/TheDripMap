// Normalize providers.country to canonical values: 'United States' or 'Canada'.
// Currently the table has 4 distinct US values ("US", "United States",
// "United States of America") which causes .eq('country', 'US') queries
// in getListingsByCity to silently match only 1 of the 4 — triggering
// state-wide fallback queries that pollute city pages.
//
// Run without args for PREVIEW. Pass --apply to write.

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Canonical mapping
const REMAP = {
  'US':                        'United States',
  'USA':                       'United States',
  'United States of America':  'United States',
  'U.S.':                      'United States',
  'U.S.A.':                    'United States',
  // 'United States' and 'Canada' are already canonical — leave alone
};

console.log(`Mode: ${APPLY ? 'APPLY (will write)' : 'PREVIEW (no writes — pass --apply to commit)'}`);
console.log('');

// === BEFORE counts ===
console.log('=== providers.country BEFORE ===');
const { data: allBefore } = await supabase.from('providers').select('country').not('country', 'is', null);
const beforeCounts = {};
for (const p of allBefore || []) beforeCounts[p.country] = (beforeCounts[p.country] || 0) + 1;
for (const [c, n] of Object.entries(beforeCounts).sort((a,b) => b[1] - a[1])) {
  const willBecome = REMAP[c] || c;
  const arrow = willBecome === c ? '' : ` → "${willBecome}"`;
  console.log(`  ${c.padEnd(25)} ${String(n).padStart(4)}${arrow}`);
}

// === Build update list ===
const updates = [];
for (const [oldValue, newValue] of Object.entries(REMAP)) {
  if (!beforeCounts[oldValue]) continue;
  updates.push({ oldValue, newValue, count: beforeCounts[oldValue] });
}

console.log(`\nDistinct country values to normalize: ${updates.length}`);

if (!APPLY) {
  console.log('\n[PREVIEW] No DB writes. Re-run with --apply to commit changes.');
  process.exit(0);
}

console.log('\nApplying normalizations...');
for (const u of updates) {
  const { error, count } = await supabase
    .from('providers')
    .update({ country: u.newValue }, { count: 'exact' })
    .eq('country', u.oldValue);
  if (error) console.log(`  ⚠ "${u.oldValue}" → "${u.newValue}": ${error.message}`);
  else console.log(`  ✓ "${u.oldValue}" → "${u.newValue}"  (${u.count} rows)`);
}

// === AFTER counts ===
console.log('\n=== providers.country AFTER ===');
const { data: allAfter } = await supabase.from('providers').select('country').not('country', 'is', null);
const afterCounts = {};
for (const p of allAfter || []) afterCounts[p.country] = (afterCounts[p.country] || 0) + 1;
for (const [c, n] of Object.entries(afterCounts).sort((a,b) => b[1] - a[1])) {
  console.log(`  ${c.padEnd(25)} ${String(n).padStart(4)}`);
}
