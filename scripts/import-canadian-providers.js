// Import 72 Canadian IV-therapy providers across 6 cities.
// Steps:
//  1. Parse the 6 city JSON files
//  2. Add slugs, categories
//  3. Upsert providers (ignoreDuplicates on slug — safe to re-run)
//  4. Add the 6 new cities to cities table (Vancouver, Calgary, Ottawa, Montreal, Edmonton, Winnipeg)
//  5. Sync cities.listings_count to actual counts

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
  return s.toLowerCase()
    .replace(/[''""]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

const CITIES_META = [
  { name: 'Vancouver',     slug: 'vancouver',     state: 'British Columbia', state_code: 'BC' },
  { name: 'Calgary',       slug: 'calgary',       state: 'Alberta',          state_code: 'AB' },
  { name: 'Ottawa',        slug: 'ottawa',        state: 'Ontario',          state_code: 'ON' },
  { name: 'Montreal',      slug: 'montreal',      state: 'Quebec',           state_code: 'QC' },
  { name: 'Edmonton',      slug: 'edmonton',      state: 'Alberta',          state_code: 'AB' },
  { name: 'Winnipeg',      slug: 'winnipeg',      state: 'Manitoba',         state_code: 'MB' },
];

// === Step 1: Parse provider JSON files ===
const allProviders = [];
for (const c of CITIES_META) {
  const path = `scripts/canada-providers-${c.slug}.json`;
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  for (const r of data) {
    allProviders.push({
      name: r.name,
      slug: slugify(r.name + '-' + r.city),
      city: r.city,
      state: r.state,
      country: 'Canada',
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
console.log(`Parsed ${allProviders.length} providers across ${CITIES_META.length} cities`);

// Sanity: any duplicate slugs in the import batch?
const slugSet = new Set();
const dups = [];
for (const p of allProviders) {
  if (slugSet.has(p.slug)) dups.push(p.slug);
  slugSet.add(p.slug);
}
if (dups.length) console.log('  ⚠ duplicate slugs in input batch:', dups);

// === Step 2: Pre-count providers + cities ===
const { count: providersBefore } = await supabase.from('providers').select('*', { count: 'exact', head: true });
const { count: citiesBefore } = await supabase.from('cities').select('*', { count: 'exact', head: true });
console.log(`\nBEFORE: providers=${providersBefore}, cities=${citiesBefore}`);

// === Step 3: Upsert providers ===
console.log('\nInserting providers (upsert ignoreDuplicates on slug)...');
const { error: pErr } = await supabase
  .from('providers')
  .upsert(allProviders, { onConflict: 'slug', ignoreDuplicates: true });
if (pErr) { console.error('Provider insert failed:', pErr); process.exit(1); }

// === Step 4: Add cities table rows for any new cities ===
console.log('\nUpserting cities (Vancouver, Calgary, Ottawa, Montreal, Edmonton, Winnipeg)...');
const cityRows = CITIES_META.map((c) => ({
  name: c.name,
  slug: c.slug,
  state: c.state,
  state_code: c.state_code,
  listings_count: 0, // will be synced in step 5
}));
const { error: cErr } = await supabase
  .from('cities')
  .upsert(cityRows, { onConflict: 'slug', ignoreDuplicates: true });
if (cErr) { console.error('Cities upsert failed:', cErr); process.exit(1); }

// === Step 5: Sync listings_count to actual counts for the 6 cities ===
console.log('\nSyncing cities.listings_count from actual provider counts...');
for (const c of CITIES_META) {
  const { count } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .eq('city', c.name);
  const { error } = await supabase
    .from('cities')
    .update({ listings_count: count, listing_count: count })
    .eq('slug', c.slug);
  if (error) console.log(`  ⚠ ${c.name}: ${error.message}`);
  else console.log(`  ✓ ${c.name.padEnd(12)} listings_count=${count}`);
}

// === Final report ===
const { count: providersAfter } = await supabase.from('providers').select('*', { count: 'exact', head: true });
const { count: citiesAfter } = await supabase.from('cities').select('*', { count: 'exact', head: true });
console.log(`\nAFTER:  providers=${providersAfter}, cities=${citiesAfter}`);
console.log(`Net new providers: ${providersAfter - providersBefore}`);
console.log(`Net new cities:    ${citiesAfter - citiesBefore}`);
