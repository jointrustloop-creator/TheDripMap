import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url!, key!);

async function checkColumns() {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns in providers table:', Object.keys(data[0]));
    console.log('Sample city data:', data[0].city, data[0].City);
  }
}

checkColumns();
