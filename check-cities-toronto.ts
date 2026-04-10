import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url!, key!);

async function checkCitiesTable() {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .ilike('name', 'Toronto');
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Toronto in cities table:', data);
  }
}

checkCitiesTable();
