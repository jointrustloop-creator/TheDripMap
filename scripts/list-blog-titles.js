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
  .select('slug, title, category')
  .order('category', { ascending: true })
  .order('slug', { ascending: true });

if (error) { console.error(error); process.exit(1); }

console.log(`Total: ${data.length}\n`);
for (const r of data) {
  console.log(`[${(r.category || '?').padEnd(22)}] ${r.slug.padEnd(50)} ${r.title || ''}`);
}
