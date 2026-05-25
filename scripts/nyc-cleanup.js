import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const slugs = ['best-iv-therapy-new-york', 'best-iv-therapy-new-york-2026'];

const { data, error } = await supabase
  .from('blog_posts')
  .select('slug, title, date, content')
  .in('slug', slugs);

if (error) { console.error(error); process.exit(1); }

console.log('=== Both NYC posts ===');
for (const r of data) {
  const wordCount = (r.content || '').split(/\s+/).filter(Boolean).length;
  console.log(`\nSlug:   ${r.slug}`);
  console.log(`Title:  ${r.title}`);
  console.log(`Date:   ${r.date}`);
  console.log(`Words:  ${wordCount}`);
}
