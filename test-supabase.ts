import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  console.log('Testing Anon Key...');
  const supabaseAnon = createClient(url, anon);
  const { data: dataA, error: errA } = await supabaseAnon.from('providers').select('id').limit(1);
  console.log('Anon Result:', { success: !!dataA, error: errA?.message });

  console.log('Testing Service Key...');
  const supabaseService = createClient(url, service);
  const { data: dataS, error: errS } = await supabaseService.from('providers').select('id').limit(1);
  console.log('Service Result:', { success: !!dataS, error: errS?.message });
}
test();
