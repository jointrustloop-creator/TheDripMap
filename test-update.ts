import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function testUpdate() {
  const { data, error } = await supabase.from('providers').update({ rating: 4.9 }).eq('slug', 'blue-cypress-iv-and-wellness-georgetown').select();
  console.log('Update Result:', { data, error });
}
testUpdate();
