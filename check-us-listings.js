import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function checkUSListings() {
  const { data, error, count } = await supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('state_abbr', 'us');
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Found US records in listings:', count);
  }
}

checkUSListings();
