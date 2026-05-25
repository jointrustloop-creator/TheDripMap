import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await supabase
  .from('blog_posts')
  .select('slug, title, content')
  .eq('slug', 'best-iv-therapy-new-york-2026')
  .single();

if (error) { console.error(error); process.exit(1); }

console.log('Title:', data.title);
console.log('Content length (chars):', data.content?.length || 0);
console.log('Word count:', (data.content || '').split(/\s+/).filter(Boolean).length);
console.log('\n--- First 600 chars ---');
console.log((data.content || '').slice(0, 600));
console.log('\n--- Last 600 chars ---');
console.log((data.content || '').slice(-600));
