import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function checkCityColumns() {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Columns in cities:', Object.keys(data[0]));
  }
}

checkCityColumns();
