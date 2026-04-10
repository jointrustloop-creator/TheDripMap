import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url!, key!);

async function checkSF() {
  const { count, error } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .ilike('city', 'San Francisco');
    
  console.log(`San Francisco count: ${count}`);
  
  const { data } = await supabase
    .from('providers')
    .select('city')
    .limit(10);
  console.log('Sample cities:', data?.map(d => d.city));
}

checkSF();
