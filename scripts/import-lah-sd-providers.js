// Import the 60+ providers found by the LA / Houston / San Diego research agents.
// Same flow as the Canadian batch: parse JSON files, upsert via supabase-js with
// ignoreDuplicates on slug, then re-sync the affected cities.listings_count.

import dotenv from 'dotenv';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[''""]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

const SOURCES = [
  { city: 'Los Angeles', file: 'scripts/la-providers-new.json',         expectedState: 'California' },
  { city: 'Houston',     file: 'scripts/houston-providers-new.json',    expectedState: 'Texas' },
  { city: 'San Diego',   file: 'scripts/sandiego-providers-new.json',   expectedState: 'California' },
];

const allRows = [];
for (const s of SOURCES) {
  if (!fs.existsSync(s.file)) {
    console.log(`  ⚠ MISSING: ${s.file}`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(s.file, 'utf8'));
  console.log(`${s.city.padEnd(15)} ${String(data.length).padStart(3)} rows from ${s.file}`);
  for (const r of data) {
    allRows.push({
      name: r.name,
      slug: slugify(`${r.name}-${r.city}`),
      city: r.city,
      state: r.state,
      country: r.country || 'United States',
      address: r.address || null,
      phone: r.phone || null,
      website: r.website || null,
      rating: typeof r.rating === 'number' ? r.rating : null,
      reviews: typeof r.reviews === 'number' ? r.reviews : null,
      category: 'IV Therapy',
      is_featured: false,
    });
  }
}

console.log(`\nTotal new provider rows to upsert: ${allRows.length}`);

// Sanity: detect duplicate slugs within the input batch
const slugSet = new Set();
const dups = [];
for (const p of allRows) {
  if (slugSet.has(p.slug)) dups.push(p.slug);
  slugSet.add(p.slug);
}
if (dups.length) console.log(`  ⚠ Duplicate slugs in input batch: ${dups.join(', ')}`);

// Pre-count
const { count: providersBefore } = await supabase
  .from('providers')
  .select('*', { count: 'exact', head: true });
console.log(`\nproviders BEFORE: ${providersBefore}`);

// Upsert
console.log('Upserting (ignoreDuplicates on slug)...');
const { error } = await supabase
  .from('providers')
  .upsert(allRows, { onConflict: 'slug', ignoreDuplicates: true });
if (error) {
  console.error('Provider upsert failed:', error);
  process.exit(1);
}

// Post-count
const { count: providersAfter } = await supabase
  .from('providers')
  .select('*', { count: 'exact', head: true });
console.log(`providers AFTER:  ${providersAfter}`);
console.log(`Net new:          ${providersAfter - providersBefore}`);

// Sync cities.listings_count for the 3 affected cities
console.log('\nSyncing cities.listings_count for Los Angeles, Houston, San Diego...');
const GTA_CITIES = ['Toronto','Ajax','Brampton','Mississauga','Oakville','Richmond Hill','Vaughan'];

async function countListingsForCityPage(cityName, stateName) {
  // Mirror getListingsByCity logic (substring city + state full-or-abbr + country=United States)
  const abbrMap = { California: 'CA', Texas: 'TX', Florida: 'FL', 'New York': 'NY', Ontario: 'ON' };
  const abbr = abbrMap[stateName] || stateName;
  let q = supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .ilike('city', `%${cityName}%`)
    .or(`state.ilike.${stateName},state.ilike.${abbr}`)
    .eq('country', 'United States');
  const { count } = await q;
  return count ?? 0;
}

for (const { city, expectedState } of SOURCES) {
  const liveCount = await countListingsForCityPage(city, expectedState);
  const { error: uErr } = await supabase
    .from('cities')
    .update({ listings_count: liveCount, listing_count: liveCount })
    .eq('slug', city.toLowerCase().replace(/ /g, '-'));
  if (uErr) console.log(`  ⚠ ${city}: ${uErr.message}`);
  else console.log(`  ✓ ${city.padEnd(15)} listings_count=${liveCount}`);
}

// Per-city verification
console.log('\n=== Per-city verification (exact city match counts) ===');
for (const { city } of SOURCES) {
  const { count } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .eq('city', city);
  console.log(`  ${city.padEnd(15)} ${count} providers (exact city match)`);
}

console.log('\nDone.');
