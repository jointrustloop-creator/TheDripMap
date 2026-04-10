import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkCount() {
  const { count, error } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error fetching count:', error);
  } else {
    console.log('Total providers in Supabase:', count);
  }
}

checkCount();
