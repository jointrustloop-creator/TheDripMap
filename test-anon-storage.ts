import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function tryAnonUpload() {
  try {
    console.log('Testing Anon Upload...');
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('test-anon', { public: true });
    console.log('Bucket Create (Anon):', { bucketData, error: bucketError?.message });

    const { data, error } = await supabase.storage.from('providers').upload('test.txt', Buffer.from('test'));
    console.log('Upload (Anon):', { data, error: error?.message });
  } catch (e) {
    console.error('Error:', e);
  }
}
tryAnonUpload();
