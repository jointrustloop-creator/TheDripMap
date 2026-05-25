// Upload the 6 ChatGPT-generated clinic images to Supabase blog-images bucket
// with SEO-friendly filenames, then swap them into the 6 best-fit blog posts.

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'blog-images';
const SOURCE_DIR = 'new images';
const PUBLIC_BASE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';

// Map source file → new SEO-friendly name → target blog slug
const MAPPING = [
  {
    src: 'ChatGPT Image May 24, 2026, 09_52_55 PM.png',
    dst: 'iv-therapy-modern-clinic-recliners.jpg',
    blogSlug: 'iv-therapy-canada-complete-guide-2026',
    contentType: 'image/png',
  },
  {
    src: 'ChatGPT Image May 24, 2026, 09_56_33 PM.png',
    dst: 'iv-therapy-nad-iv-bag-closeup.jpg',
    blogSlug: 'nad-plus-iv-therapy-cellular-longevity-guide',
    contentType: 'image/png',
  },
  {
    src: 'ChatGPT Image May 24, 2026, 09_56_44 PM.png',
    dst: 'iv-therapy-beauty-glow-pink-lounge.jpg',
    blogSlug: 'best-iv-therapy-montreal-2026',
    contentType: 'image/png',
  },
  {
    src: 'ChatGPT Image May 24, 2026, 09_56_55 PM.png',
    dst: 'iv-therapy-spa-reception-recliners.jpg',
    blogSlug: 'best-iv-therapy-vancouver-2026',
    contentType: 'image/png',
  },
  {
    src: 'ChatGPT Image May 24, 2026, 09_57_04 PM.png',
    dst: 'mobile-iv-therapy-kit-home-delivery.jpg',
    blogSlug: 'mobile-iv-therapy-near-me',
    contentType: 'image/png',
  },
  {
    src: 'ChatGPT Image May 24, 2026, 09_57_13 PM.png',
    dst: 'iv-therapy-clinical-medical-setting.jpg',
    blogSlug: 'iv-therapy-safety-side-effects-guide',
    contentType: 'image/png',
  },
];

// === Step 1: Upload each file ===
console.log('=== Step 1: Uploading 6 images to blog-images bucket ===');
for (const m of MAPPING) {
  const srcPath = path.join(SOURCE_DIR, m.src);
  if (!fs.existsSync(srcPath)) {
    console.log(`  ✗ MISSING: ${srcPath}`);
    continue;
  }
  const buffer = fs.readFileSync(srcPath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(m.dst, buffer, {
      contentType: m.contentType,
      upsert: true, // safe to re-run
    });
  if (error) {
    console.log(`  ✗ ${m.dst}: ${error.message}`);
  } else {
    const size = (buffer.length / 1024).toFixed(0);
    console.log(`  ✓ ${m.dst.padEnd(50)} (${size} KB)`);
  }
}

// === Step 2: Verify uploads are accessible (HEAD-style fetch) ===
console.log('\n=== Step 2: Verifying public URLs (HTTP HEAD) ===');
for (const m of MAPPING) {
  const url = PUBLIC_BASE + m.dst;
  try {
    const r = await fetch(url, { method: 'HEAD' });
    console.log(`  ${r.status === 200 ? '✓' : '✗'} HTTP ${r.status}  ${url}`);
  } catch (e) {
    console.log(`  ✗ err  ${url}  ${e.message}`);
  }
}

// === Step 3: Update blog_posts.image_url for each target slug ===
console.log('\n=== Step 3: Updating blog_posts.image_url ===');
for (const m of MAPPING) {
  const newUrl = PUBLIC_BASE + m.dst;
  const { data: before } = await supabase.from('blog_posts').select('image_url').eq('slug', m.blogSlug).maybeSingle();
  if (!before) {
    console.log(`  ✗ Blog post not found: ${m.blogSlug}`);
    continue;
  }
  const { error } = await supabase.from('blog_posts').update({ image_url: newUrl }).eq('slug', m.blogSlug);
  if (error) {
    console.log(`  ✗ ${m.blogSlug}: ${error.message}`);
  } else {
    console.log(`  ✓ ${m.blogSlug.padEnd(45)}`);
    console.log(`    was: ${before.image_url}`);
    console.log(`    now: ${newUrl}`);
  }
}

console.log('\nDone.');
