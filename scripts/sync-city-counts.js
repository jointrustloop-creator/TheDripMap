// One-off: sync cities.listings_count to exact-match COUNT(providers.city = cities.name)
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: cities, error: cErr } = await supabase
  .from('cities')
  .select('id, name, slug, listings_count');
if (cErr) { console.error(cErr); process.exit(1); }

const { data: providers, error: pErr } = await supabase
  .from('providers')
  .select('city')
  .limit(10000);
if (pErr) { console.error(pErr); process.exit(1); }

const actual = new Map();
for (const p of providers) {
  if (!p.city) continue;
  const key = p.city.trim();
  actual.set(key, (actual.get(key) || 0) + 1);
}

const updates = [];
const bigDiffs = [];

for (const c of cities) {
  const actualCount = actual.get((c.name || '').trim()) || 0;
  if (c.listings_count === actualCount) continue;

  updates.push({ id: c.id, name: c.name, listings_count: actualCount });

  if (Math.abs(actualCount - (c.listings_count || 0)) >= 5) {
    bigDiffs.push({
      slug: c.slug,
      name: c.name,
      before: c.listings_count,
      after: actualCount,
      diff: actualCount - (c.listings_count || 0),
    });
  }
}

console.log(`\nCities to update: ${updates.length}`);
console.log(`\nLarge changes (|diff| >= 5) — record these in case you want to revert:`);
console.log('city                                  BEFORE  AFTER   diff');
console.log('-----------------------------------------------------------');
for (const d of bigDiffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))) {
  const name = (d.name || '').padEnd(36).slice(0, 36);
  const before = String(d.before).padStart(6);
  const after = String(d.after).padStart(7);
  const diffStr = (d.diff > 0 ? '+' : '') + d.diff;
  console.log(`${name}  ${before}  ${after}   ${diffStr}`);
}

console.log(`\nApplying updates...`);

// Batch upsert in chunks of 100 to be safe
const chunkSize = 100;
let totalUpdated = 0;
for (let i = 0; i < updates.length; i += chunkSize) {
  const chunk = updates.slice(i, i + chunkSize).map(u => ({
    id: u.id,
    name: u.name,
    listings_count: u.listings_count,
  }));
  const { error } = await supabase.from('cities').upsert(chunk, { onConflict: 'id' });
  if (error) {
    console.error(`Chunk ${i}-${i + chunkSize} failed:`, error.message);
    process.exit(1);
  }
  totalUpdated += chunk.length;
}

console.log(`\n✓ Updated ${totalUpdated} cities.`);

// Verify by re-running the mismatch check
const { data: cities2 } = await supabase
  .from('cities')
  .select('name, listings_count');

let remainingMismatches = 0;
for (const c of cities2) {
  const a = actual.get((c.name || '').trim()) || 0;
  if (c.listings_count !== a) remainingMismatches++;
}

console.log(`Remaining mismatches after update: ${remainingMismatches} (should be 0)`);
