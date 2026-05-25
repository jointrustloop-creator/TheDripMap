// Swap blog_posts.image_url from Unsplash/og-image.png placeholders to thematic
// Supabase storage images from the blog-images bucket.
// Only updates posts whose image is NOT already on Supabase storage.

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';

// City-guide rotation pool — assigned deterministically by slug hash so each city
// gets a different but reproducible image.
const CITY_ROTATION = [
  'iv-therapy-two-women.jpg',
  'iv-therapy-man-lounge.jpg',
  'iv-therapy-woman-yacht.jpg',
  'iv-therapy-man-blue.jpg',
  'iv-therapy-woman-robe.jpg',
  'iv-therapy-vitamin-drip-citrus.jpg',
  'iv-therapy-woman-relaxing.jpg',
  'iv-therapy-group-clinic.jpg',
];

function hashSlug(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Per-slug explicit overrides (highest priority)
const OVERRIDES = {
  'best-iv-therapy-new-york-2026':       'best-iv-therapy-new-york-hero.webp',
  // Canadian city guides — assign thematic images
  'best-iv-therapy-vancouver-2026':      'iv-therapy-two-women.jpg',
  'best-iv-therapy-calgary-2026':        'iv-therapy-for-athletes-sports-recovery-hero.webp',
  'best-iv-therapy-ottawa-2026':         'iv-therapy-group-clinic.jpg',
  'best-iv-therapy-montreal-2026':       'iv-therapy-skin-glow.jpg',
  'best-iv-therapy-edmonton-2026':       'iv-therapy-immunity.jpg',
  'iv-therapy-canada-complete-guide-2026': 'iv-therapy-vitamin-drip-citrus.jpg',
};

// Theme keyword → file (first match wins; city-guide check is separate below)
const THEME_RULES = [
  // pregnancy / morning sickness / women's-specific symptoms
  [/pregnancy|morning-sickness/, 'iv-therapy-pregnancy-womens-health.jpg'],
  [/perimenopause|menopause/, 'iv-therapy-pregnancy-womens-health.jpg'],
  [/wedding/, 'iv-therapy-skin-glow.jpg'],
  // hangover
  [/hangover/, 'iv-therapy-hangover.jpg'],
  // migraine / headache
  [/migraine|headache/, 'iv-therapy-for-migraines-headaches-hero.webp'],
  // athletes / sports / athletic
  [/athlete|athletic|sports-recovery|sports/, 'iv-therapy-for-athletes-sports-recovery-hero.webp'],
  // jet lag
  [/jet-lag/, 'iv-therapy-jet-lag.jpg'],
  // immune / long-covid / cold/flu
  [/immune|long-covid|covid|cold|flu/, 'iv-therapy-immunity.jpg'],
  // myers cocktail
  [/myers/, 'myers-cocktail-iv-therapy-complete-guide-hero.webp'],
  // NAD+ / longevity / anti-aging / cellular
  [/nad|longevity|anti-aging|cellular/, 'iv-therapy-anti-aging-beauty.jpg'],
  // fatigue / energy / chronic-fatigue
  [/chronic-fatigue|fatigue|energy/, 'iv-therapy-for-chronic-fatigue-hero.webp'],
  // mobile / at-home / near-me / in-home
  [/mobile|at-home|near-me|in-home/, 'mobile-iv-therapy-near-me-hero.webp'],
  // weight loss
  [/weight-loss/, 'iv-therapy-weight-loss.jpg'],
  // beauty / glow / glutathione / biotin / skin
  [/skin-glow|glutathione|biotin|beauty|glow/, 'iv-therapy-skin-glow.jpg'],
  // stress / anxiety / night-shift
  [/stress|anxiety|night-shift/, 'iv-therapy-stress-relief.jpg'],
  // brain fog / clarity
  [/brain-fog|clarity|focus/, 'iv-therapy-brain-fog.jpg'],
  // dehydration
  [/dehydration|hydration|saline/, 'iv-therapy-dehydration.jpg'],
  // event prep / first-time / wedding (catch-all already above)
  [/event-prep|first-time/, 'iv-therapy-event-prep.jpg'],
  // vitamin-specific (B12, iron, magnesium, vit C, ozone)
  [/vitamin-c|high-dose-vitamin|vitamin-b12|b12|iron-iv|magnesium|ozone/, 'iv-therapy-vitamin-drip-citrus.jpg'],
  // senior / older adults
  [/senior|65-plus/, 'iv-therapy-man-lounge.jpg'],
  // insurance / cost / pricing / hsa / fsa / package / discount / reimbursement
  [/insurance|cost|pricing|hsa|fsa|package|discount|reimbursement|membership/, 'iv-therapy-group-clinic.jpg'],
  // emergency / ER / safety / side-effects / interactions
  [/emergency|side-effect|safety|interaction|alcohol/, 'iv-therapy-group-clinic.jpg'],
  // myths / vs / comparison / trends / science / how-often
  [/myth|vs|comparison|trends|science|how-often|explained/, 'iv-therapy-vitamin-drip-citrus.jpg'],
];

function pickImage(slug) {
  if (OVERRIDES[slug]) return OVERRIDES[slug];
  // City guide: best-iv-therapy-[city]-YYYY
  if (/^best-iv-therapy-.+-(20\d\d)$/.test(slug)) {
    return CITY_ROTATION[hashSlug(slug) % CITY_ROTATION.length];
  }
  // Theme rules
  for (const [pattern, file] of THEME_RULES) {
    if (pattern.test(slug)) return file;
  }
  // Default fallback
  return 'iv-therapy-vitamin-drip-citrus.jpg';
}

// === Load all posts ===
const { data: posts } = await supabase
  .from('blog_posts')
  .select('id, slug, image_url, title')
  .order('slug');

console.log(`Loaded ${posts.length} posts`);

// === Determine swaps ===
const swaps = [];
const skipped = [];
for (const p of posts) {
  const targetFile = pickImage(p.slug);
  const targetUrl = BUCKET + encodeURIComponent(targetFile);
  // Only swap if currently NOT on supabase storage, OR if currently a placeholder
  const isOnStorage = p.image_url && p.image_url.includes('/storage/v1/object/public/blog-images/');
  const isPlaceholder =
    !p.image_url ||
    p.image_url.includes('unsplash') ||
    p.image_url.includes('og-image.png');
  if (isOnStorage && !isPlaceholder) {
    // Already on storage with a non-placeholder file — leave alone
    skipped.push({ slug: p.slug, reason: 'already on storage', current: p.image_url });
    continue;
  }
  swaps.push({ id: p.id, slug: p.slug, oldUrl: p.image_url, newUrl: targetUrl, newFile: targetFile });
}

console.log(`\nPlanned swaps: ${swaps.length}`);
console.log(`Skipped (already on storage): ${skipped.length}`);

// === Show distribution of files chosen ===
const byFile = {};
for (const s of swaps) byFile[s.newFile] = (byFile[s.newFile] || 0) + 1;
console.log('\nNew image distribution:');
for (const [f, n] of Object.entries(byFile).sort((a,b) => b[1] - a[1])) {
  console.log(`  ${f.padEnd(60)} ${n}`);
}

// === Apply swaps ===
console.log('\nApplying swaps...');
let updated = 0;
for (const s of swaps) {
  const { error } = await supabase.from('blog_posts').update({ image_url: s.newUrl }).eq('id', s.id);
  if (error) {
    console.log(`  ⚠ ${s.slug}: ${error.message}`);
    continue;
  }
  updated++;
}
console.log(`\n✓ Updated ${updated}/${swaps.length} posts`);

// === Verify final state ===
const { data: after } = await supabase.from('blog_posts').select('image_url');
const finalByHost = {};
for (const p of after || []) {
  const host = p.image_url ? new URL(p.image_url).hostname : 'NULL';
  finalByHost[host] = (finalByHost[host] || 0) + 1;
}
console.log('\nFinal image_url distribution:');
for (const [h, n] of Object.entries(finalByHost).sort((a,b) => b[1] - a[1])) {
  console.log(`  ${h.padEnd(50)} ${n}`);
}
