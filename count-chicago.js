import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function countChicago() {
  const { count, error } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .ilike('city', 'chicago');
    
  if (error) console.error(error);
  else console.log('Total Chicago providers in DB:', count);
}

countChicago();
