import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function cleanup() {
  console.log('Cleaning up invalid records (state_code/state_abbr = "US")...');
  
  // 1. Cities
  const { count: citiesCount, error: citiesError } = await supabase
    .from('cities')
    .delete({ count: 'exact' })
    .ilike('state_code', 'us');
    
  if (citiesError) console.error('Cities delete error:', citiesError.message);
  else console.log(`Deleted ${citiesCount} cities.`);

  // 2. Listings
  const { count: listingsCount, error: listingsError } = await supabase
    .from('listings')
    .delete({ count: 'exact' })
    .ilike('state_abbr', 'us');
    
  if (listingsError) console.error('Listings delete error:', listingsError.message);
  else console.log(`Deleted ${listingsCount} listings.`);

  // 3. Providers
  const { count: providersCount, error: providersError } = await supabase
    .from('providers')
    .delete({ count: 'exact' })
    .ilike('state', 'us');
    
  if (providersError) console.error('Providers delete error:', providersError.message);
  else console.log(`Deleted ${providersCount} providers.`);

  console.log('Cleanup complete.');
}

cleanup();
