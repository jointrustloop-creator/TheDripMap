import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url!, key!);

async function searchKeywords() {
  const keywords = ['NAD', 'Immune', 'Hangover', 'Weight', 'Beauty'];
  
  for (const kw of keywords) {
    const { count, error } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .or(`name.ilike.%${kw}%,category.ilike.%${kw}%`);
      
    console.log(`Keyword "${kw}": ${count} matches`);
  }
}

searchKeywords();
