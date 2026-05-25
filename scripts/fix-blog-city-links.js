// One-shot: replace broken /cities/<slug> links in blog posts with /search?city=<City>.
// The target cities have no /cities/<slug> page (no row in cities table), so the link 404s.
// Search page renders fine even for cities with 0 providers.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REPLACEMENTS = [
  { from: '/cities/seattle', to: '/search?city=Seattle' },
  { from: '/cities/phoenix', to: '/search?city=Phoenix' },
  { from: '/cities/atlanta', to: '/search?city=Atlanta' },
  { from: '/cities/dallas', to: '/search?city=Dallas' },
  { from: '/cities/philadelphia', to: '/search?city=Philadelphia' },
];

const TARGET_POSTS = [
  'best-iv-therapy-seattle-2026',
  'best-iv-therapy-phoenix-2026',
  'best-iv-therapy-atlanta-2026',
  'best-iv-therapy-dallas-2026',
  'best-iv-therapy-philadelphia-2026',
];

const { data: posts } = await supabase
  .from('blog_posts')
  .select('slug, content')
  .in('slug', TARGET_POSTS);

for (const post of posts || []) {
  let newContent = post.content;
  let edits = 0;
  for (const r of REPLACEMENTS) {
    // Use split/join to avoid regex special-char headaches
    const parts = newContent.split(r.from);
    if (parts.length > 1) {
      edits += parts.length - 1;
      newContent = parts.join(r.to);
    }
  }
  if (edits > 0) {
    const { error } = await supabase
      .from('blog_posts')
      .update({ content: newContent })
      .eq('slug', post.slug);
    console.log(
      `${post.slug} → ${edits} link(s) replaced (${post.content.length} → ${newContent.length} chars), ${error ? 'FAILED: ' + error.message : 'OK'}`
    );
  } else {
    console.log(`${post.slug} → no matching links found`);
  }
}
