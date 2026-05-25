// Add 9 missing cities to the cities table (Sacramento already exists).

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const NEW_CITIES = [
  { name: 'Miami',          slug: 'miami',          state: 'Florida',        state_code: 'FL', listings_count: 6 },
  { name: 'Austin',         slug: 'austin',         state: 'Texas',          state_code: 'TX', listings_count: 6 },
  { name: 'Denver',         slug: 'denver',         state: 'Colorado',       state_code: 'CO', listings_count: 6 },
  { name: 'Nashville',      slug: 'nashville',      state: 'Tennessee',      state_code: 'TN', listings_count: 5 },
  { name: 'Charlotte',      slug: 'charlotte',      state: 'North Carolina', state_code: 'NC', listings_count: 6 },
  { name: 'Indianapolis',   slug: 'indianapolis',   state: 'Indiana',        state_code: 'IN', listings_count: 5 },
  { name: 'Columbus',       slug: 'columbus',       state: 'Ohio',           state_code: 'OH', listings_count: 5 },
  { name: 'Portland',       slug: 'portland',       state: 'Oregon',         state_code: 'OR', listings_count: 6 },
  { name: 'Salt Lake City', slug: 'salt-lake-city', state: 'Utah',           state_code: 'UT', listings_count: 6 },
];

const { count: beforeCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
console.log(`cities BEFORE: ${beforeCount} rows`);

console.log('\nInserting (with upsert on slug, ignoring duplicates)...');
const { error } = await supabase
  .from('cities')
  .upsert(NEW_CITIES, { onConflict: 'slug', ignoreDuplicates: true });

if (error) {
  console.error('Failed:', error);
  process.exit(1);
}

const { count: afterCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
console.log(`cities AFTER:  ${afterCount} rows`);
console.log(`Net new:       ${afterCount - beforeCount}`);

console.log('\nVerification — fetching the 10 target cities:');
const { data } = await supabase
  .from('cities')
  .select('name, slug, state, state_code, listings_count')
  .in('slug', [
    'miami', 'austin', 'denver', 'nashville', 'charlotte',
    'indianapolis', 'columbus', 'portland', 'sacramento', 'salt-lake-city'
  ])
  .order('name');

for (const c of data) {
  console.log(`  ✓ ${c.name.padEnd(20)} slug:${c.slug.padEnd(18)} state:${c.state_code} (${c.state}), listings_count:${c.listings_count}`);
}
