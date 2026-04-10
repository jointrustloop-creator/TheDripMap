import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url!, key!);

async function checkToronto() {
  const { data, error, count } = await supabase
    .from('providers')
    .select('*', { count: 'exact' })
    .ilike('city', 'Toronto');
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Toronto listings count in Supabase:', count);
    if (data && data.length > 0) {
      console.log('Sample Toronto listing:', data[0].name);
    }
  }
}

checkToronto();
