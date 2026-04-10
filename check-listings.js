import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function checkListings() {
  const { data, error, count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.log('Listings table error:', error.message);
  } else {
    console.log('Listings table exists. Count:', count);
  }
}

checkListings();
