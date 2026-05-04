import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

function clean(key) {
  if (!key) return '';
  let k = key.trim();
  if (k.includes('=')) k = k.split('=')[1];
  return k;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('providers').select('id').limit(1);
  console.log('Result:', { success: !!data, error: error?.message });
}
test();
