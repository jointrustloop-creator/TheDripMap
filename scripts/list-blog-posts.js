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
  .select('slug, category, date')
  .order('date', { ascending: false });

if (error) { console.error(error); process.exit(1); }

console.log(`Total: ${data.length}\n`);

const byCat = {};
for (const r of data) {
  (byCat[r.category || '(no category)'] ||= []).push(r.slug);
}

for (const cat of Object.keys(byCat).sort()) {
  console.log(`[${cat}] (${byCat[cat].length})`);
  byCat[cat].forEach((s) => console.log(`  ${s}`));
  console.log();
}
