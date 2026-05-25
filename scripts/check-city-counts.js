// One-off: find cities whose listings_count doesn't match the actual provider count.
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Fetch all cities
const { data: cities, error: cErr } = await supabase
  .from('cities')
  .select('slug, name, listings_count');
if (cErr) { console.error(cErr); process.exit(1); }

// Fetch all providers (just city field)
const { data: providers, error: pErr } = await supabase
  .from('providers')
  .select('city')
  .limit(10000);
if (pErr) { console.error(pErr); process.exit(1); }

// Count providers per city (exact name match, trimmed and case-insensitive)
const actual = new Map();
for (const p of providers) {
  if (!p.city) continue;
  const key = p.city.trim();
  actual.set(key, (actual.get(key) || 0) + 1);
}

// Build comparison
const mismatches = [];
for (const c of cities) {
  if (c.listings_count == null) continue;
  const actualCount = actual.get((c.name || '').trim()) || 0;
  if (c.listings_count !== actualCount) {
    mismatches.push({
      slug: c.slug,
      name: c.name,
      stored: c.listings_count,
      actual: actualCount,
      diff: actualCount - c.listings_count,
    });
  }
}

mismatches.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

console.log(`\nTotal cities: ${cities.length}`);
console.log(`Cities with listings_count set: ${cities.filter(c => c.listings_count != null).length}`);
console.log(`Mismatches: ${mismatches.length}\n`);

if (mismatches.length > 0) {
  console.log('city                                  stored  actual   diff');
  console.log('-----------------------------------------------------------');
  for (const m of mismatches.slice(0, 60)) {
    const name = (m.name || '').padEnd(36).slice(0, 36);
    const stored = String(m.stored).padStart(6);
    const a = String(m.actual).padStart(7);
    const diffStr = (m.diff > 0 ? '+' : '') + m.diff;
    console.log(`${name}  ${stored}  ${a}   ${diffStr}`);
  }
  if (mismatches.length > 60) {
    console.log(`\n... and ${mismatches.length - 60} more`);
  }
}
