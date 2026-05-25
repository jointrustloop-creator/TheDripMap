// blog_posts table has duplicate snake_case + camelCase columns
// (image_url + imageUrl, meta_title + metaTitle, meta_description + metaDescription).
// Most page-level reads use the camelCase columns; most insert/update scripts
// write the snake_case columns. This script copies snake_case → camelCase so
// they stay in sync after any data edit.
//
// Run any time you've updated image_url, meta_title, or meta_description on blog_posts.

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: posts } = await supabase
  .from('blog_posts')
  .select('id, slug, image_url, imageUrl, meta_title, metaTitle, meta_description, metaDescription');

console.log(`Loaded ${posts.length} posts`);

let updated = 0, skipped = 0;
for (const p of posts) {
  const update = {};
  if (p.image_url && p.image_url !== p.imageUrl) update.imageUrl = p.image_url;
  if (p.meta_title && p.meta_title !== p.metaTitle) update.metaTitle = p.meta_title;
  if (p.meta_description && p.meta_description !== p.metaDescription) update.metaDescription = p.meta_description;
  if (Object.keys(update).length === 0) { skipped++; continue; }
  const { error } = await supabase.from('blog_posts').update(update).eq('id', p.id);
  if (error) { console.log(`  ⚠ ${p.slug}: ${error.message}`); continue; }
  updated++;
}

console.log(`Updated: ${updated}    Skipped (already in sync): ${skipped}`);
