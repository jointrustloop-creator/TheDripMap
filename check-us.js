import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function checkUS() {
  const { data, error, count } = await supabase
    .from('providers')
    .select('*', { count: 'exact' })
    .or('state.eq.us,State.eq.us');
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Found US records in providers:', count);
  }
  
  const { data: cities, count: cityCount } = await supabase
    .from('cities')
    .select('*', { count: 'exact' })
    .eq('state_code', 'us');
    
  console.log('Found US records in cities:', cityCount);
}

checkUS();
