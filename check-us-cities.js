import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function checkUSCities() {
  const { data, error, count } = await supabase
    .from('cities')
    .select('*', { count: 'exact' })
    .ilike('state_code', 'us');
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Found US records in cities:', count);
    if (count > 0) {
      console.log('Sample US city:', data[0]);
    }
  }
}

checkUSCities();
