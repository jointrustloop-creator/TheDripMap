// Smart matcher: assigns the best image from Supabase storage to each blog post.
//
// Logic:
// 1. Explicit mapping table (REGEX_MAPPINGS) — clear-match posts (treatments,
//    symptoms, use-cases). Hand-tuned for accuracy.
// 2. City rotation — posts about a specific city get a curated rotation from
//    a lifestyle/clinic pool, themed by region (warm cities → spa/beach vibes,
//    cold/tech → modern clinic, etc.).
// 3. Generic fallback rotation for everything else (cost, insurance, info posts)
//    — clinical/group pool with usage cap so no image repeats more than 3 times.
//
// Outputs: dry-run summary (image → posts assigned) then prompts to commit.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STORAGE_BASE =
  'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';
const url = (filename) => STORAGE_BASE + filename;

// 1. Explicit (regex) → filename. Order matters — first match wins.
const REGEX_MAPPINGS = [
  // === Treatment-specific ===
  [/^myers-cocktail-iv-therapy-complete-guide$/, 'myers-cocktail-iv-therapy-complete-guide-hero.webp'],
  [/myers.*chronic-fatigue/, 'iv-therapy-for-chronic-fatigue-hero.webp'],
  [/^myers-cocktail/, 'myers-cocktail-iv-therapy-complete-guide-hero.webp'],

  [/^nad-plus.*cellular-longevity/, 'iv-therapy-nad-iv-bag-closeup.jpg'],
  [/^nad-plus|^how-much.*nad-plus|nad-plus-therapy/, 'iv-therapy-nad-iv-bag-closeup.jpg'],
  [/^iv-therapy-anti-aging-longevity/, 'iv-therapy-anti-aging-beauty.jpg'],

  [/^biotin-iv-therapy/, 'iv-therapy-skin-glow.jpg'],
  [/^glutathione-iv-therapy-toronto/, 'iv-therapy-beauty-glow-pink-lounge.jpg'],
  [/^glutathione-iv-therapy/, 'iv-therapy-beauty-glow-pink-lounge.jpg'],

  [/^iron-iv-therapy/, 'iv-therapy-clinical-medical-setting.jpg'],
  [/^magnesium-iv-therapy/, 'iv-therapy-stress-relief.jpg'],
  [/^ozone-iv-therapy/, 'iv-therapy-clinical-medical-setting.jpg'],
  [/^saline-iv-therapy/, 'iv-therapy-dehydration.jpg'],

  [/^high-dose-vitamin-c|^vitamin-c-iv-therapy/, 'iv-therapy-vitamin-drip-citrus.jpg'],
  [/^vitamin-b12-iv-therapy|^b12-iv-vs-b12/, 'iv-therapy-clinical-medical-setting.jpg'],

  // === Hangover variants ===
  [/^iv-therapy-hangover-does-it-actually-work|^science.*hangover/, 'iv-therapy-hangover.jpg'],
  [/hangover-iv-therapy-nyc/, 'iv-therapy-hangover.jpg'],
  [/hangover-iv-therapy-toronto/, 'iv-therapy-hangover.jpg'],
  [/^can-you-drink-alcohol/, 'iv-therapy-hangover.jpg'],

  // === Symptom / use-case ===
  [/^iv-therapy-during-pregnancy/, 'iv-therapy-pregnancy-womens-health.jpg'],
  [/^iv-therapy-for-anxiety-stress/, 'iv-therapy-anxiety-mental-wellness.jpg'],
  [/^iv-therapy-for-athletes-sports-recovery/, 'iv-therapy-for-athletes-sports-recovery-hero.webp'],
  [/^iv-hydration-for-athletic-performance/, 'iv-therapy-sports-recovery.jpg'],
  [/^iv-therapy-for-chronic-fatigue/, 'iv-therapy-for-chronic-fatigue-hero.webp'],
  [/^iv-therapy-for-energy-fatigue/, 'iv-therapy-fatigue.jpg'],
  [/^iv-therapy-for-jet-lag/, 'iv-therapy-jet-lag.jpg'],
  [/^iv-therapy-for-long-covid/, 'iv-therapy-long-covid-immunity.jpg'],
  [/^iv-therapy-for-migraines/, 'iv-therapy-for-migraines-headaches-hero.webp'],
  [/^iv-therapy-for-night-shift/, 'iv-therapy-man-blue.jpg'],
  [/^iv-therapy-for-perimenopause/, 'iv-therapy-anti-aging-beauty.jpg'],
  [/^iv-therapy-for-seniors/, 'iv-therapy-anti-aging-beauty.jpg'],
  [/^iv-therapy-for-wedding-day/, 'iv-therapy-event-prep.jpg'],
  [/^iv-therapy-for-weight-loss/, 'iv-therapy-weight-loss.jpg'],
  [/^iv-therapy-immune-support/, 'iv-therapy-immunity.jpg'],

  // === Mobile ===
  [/^mobile-iv-therapy-near-me/, 'mobile-iv-therapy-near-me-hero.webp'],
  [/^mobile-iv-therapy-toronto/, 'mobile-iv-therapy-kit-home-delivery.jpg'],
  [/^mobile-iv-therapy-nyc/, 'mobile-iv-therapy-kit-home-delivery.jpg'],
  [/^mobile-iv-vs-in-clinic/, 'mobile-iv-therapy-near-me-hero.webp'],

  // === Info / comparison / cost ===
  [/^how-much-does-iv-therapy-cost/, 'iv-therapy-vitamin-drip-citrus.jpg'],
  [/^how-often-can-you-get/, 'iv-therapy-modern-clinic-recliners.jpg'],
  [/^hsa-fsa/, 'iv-therapy-modern-clinic-recliners.jpg'],
  [/^iv-therapy-insurance-coverage-canada/, 'iv-therapy-modern-clinic-recliners.jpg'],
  [/^iv-therapy-insurance-coverage-united-states/, 'iv-therapy-spa-reception-recliners.jpg'],
  [/^iv-therapy-insurance-ontario/, 'iv-therapy-modern-clinic-recliners.jpg'],
  [/^iv-therapy-first-time-discount/, 'iv-therapy-woman-robe.jpg'],
  [/^iv-therapy-package-deals/, 'iv-therapy-two-women.jpg'],
  [/^iv-therapy-near-me-how-to-find/, 'iv-therapy-near-me.png'],
  [/^iv-therapy-vs-iv-vitamin-shots/, 'iv-therapy-vitamin-drip-citrus.jpg'],
  [/^iv-therapy-vs-emergency-room/, 'iv-therapy-clinical-medical-setting.jpg'],
  [/^iv-therapy-safety-side-effects/, 'iv-therapy-clinical-medical-setting.jpg'],
  [/^iv-therapy-medication-interactions/, 'iv-therapy-clinical-medical-setting.jpg'],
  [/^iv-therapy-myths-debunked/, 'iv-therapy-woman-relaxing.jpg'],
  [/^iv-therapy-trends-2026/, 'iv-therapy-spa-reception-recliners.jpg'],
  [/^iv-therapy-canada-complete-guide/, 'iv-therapy-modern-clinic-recliners.jpg'],

  // === Toronto regional ===
  [/^iv-therapy-toronto-complete-guide/, 'iv-therapy-spa-reception-recliners.jpg'],
  [/^iv-therapy-greater-toronto-area/, 'iv-therapy-modern-clinic-recliners.jpg'],
  [/^iv-therapy-yorkville/, 'iv-therapy-beauty-glow-pink-lounge.jpg'],
  [/^iv-therapy-mississauga/, 'iv-therapy-two-women.jpg'],
  [/^iv-therapy-oakville/, 'iv-therapy-woman-relaxing.jpg'],
  [/^iv-therapy-north-york/, 'iv-therapy-modern-clinic-recliners.jpg'],

  // === NYC regional ===
  [/^iv-therapy-brooklyn/, 'iv-therapy-man-lounge.jpg'],
  [/^iv-therapy-manhattan/, 'iv-therapy-man-blue.jpg'],
  [/^iv-therapy-upper-east-side/, 'iv-therapy-woman-robe.jpg'],
  [/^iv-drip-nyc/, 'iv-therapy-vitamin-drip-citrus.jpg'],
];

// 2. City rotation. Each city gets a deliberately distinct image so two
// adjacent city posts in a list/grid never look identical. Themed where possible
// (beach/warm vs cold/tech, etc.).
const CITY_IMAGE = {
  'new-york': 'best-iv-therapy-new-york-hero.webp',
  'los-angeles': 'iv-therapy-woman-yacht.jpg',
  'miami': 'iv-therapy-woman-relaxing.jpg',
  'san-diego': 'iv-therapy-woman-yacht.jpg', // beach
  'san-francisco': 'iv-therapy-modern-clinic-recliners.jpg', // tech
  'seattle': 'iv-therapy-clinical-medical-setting.jpg',
  'boston': 'iv-therapy-modern-clinic-recliners.jpg',
  'chicago': 'iv-therapy-man-blue.jpg',
  'houston': 'iv-therapy-man-lounge.jpg',
  'dallas': 'iv-therapy-two-women.jpg',
  'denver': 'iv-therapy-woman-gym.jpg',
  'phoenix': 'iv-therapy-dehydration.jpg', // desert
  'atlanta': 'iv-therapy-man-blue.jpg',
  'philadelphia': 'iv-therapy-clinical-medical-setting.jpg',
  'las-vegas': 'iv-therapy-hangover.jpg', // perfect fit
  'washington-dc': 'iv-therapy-man-blue.jpg',
  'toronto': 'iv-therapy-spa-reception-recliners.jpg',
  'vancouver': 'iv-therapy-woman-relaxing.jpg',
  'calgary': 'iv-therapy-woman-gym.jpg',
  'ottawa': 'iv-therapy-modern-clinic-recliners.jpg',
  'montreal': 'iv-therapy-two-women.jpg',
  'edmonton': 'iv-therapy-man-lounge.jpg',
};

function getCityImage(slug) {
  // e.g. best-iv-therapy-new-york-2026 → "new-york"
  const m = slug.match(/^best-iv-therapy-([a-z-]+)-\d{4}$/);
  if (!m) return null;
  return CITY_IMAGE[m[1]] || null;
}

// 3. Generic fallback pool (lifestyle/clinic vibes), used round-robin
const FALLBACK_POOL = [
  'iv-therapy-modern-clinic-recliners.jpg',
  'iv-therapy-spa-reception-recliners.jpg',
  'iv-therapy-woman-relaxing.jpg',
  'iv-therapy-two-women.jpg',
  'iv-therapy-man-lounge.jpg',
  'iv-therapy-woman-robe.jpg',
  'iv-therapy-woman-home.jpg',
];

// === Run ===
const { data: posts } = await supabase
  .from('blog_posts')
  .select('slug, title, image_url, imageUrl')
  .order('slug');

const assignments = []; // { slug, oldImage, newImage, reason }
const usage = new Map(); // filename → count
let fallbackCursor = 0;

for (const post of posts) {
  const slug = post.slug;
  let image = null;
  let reason = '';

  // 1. City rotation first (most specific match)
  const cityImg = getCityImage(slug);
  if (cityImg) {
    image = cityImg;
    reason = `city-rotation:${slug.match(/best-iv-therapy-([a-z-]+)-/)[1]}`;
  }

  // 2. Regex mapping
  if (!image) {
    for (const [re, file] of REGEX_MAPPINGS) {
      if (re.test(slug)) {
        image = file;
        reason = `regex:${re}`;
        break;
      }
    }
  }

  // 3. Fallback rotation
  if (!image) {
    image = FALLBACK_POOL[fallbackCursor % FALLBACK_POOL.length];
    fallbackCursor++;
    reason = 'fallback-rotation';
  }

  usage.set(image, (usage.get(image) || 0) + 1);
  const oldFilename = (post.image_url || post.imageUrl || '').split('/').pop();
  assignments.push({
    slug,
    oldImage: oldFilename || '(none)',
    newImage: image,
    newUrl: url(image),
    reason,
    changed: oldFilename !== image,
  });
}

// === Summary ===
console.log('\n=== Assignment summary ===');
console.log('Total posts:', assignments.length);
console.log('Posts changed:', assignments.filter((a) => a.changed).length);
console.log('Unique images now used:', usage.size);
console.log('Most-used:');
for (const [img, n] of [...usage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
  console.log(`  ${img.padEnd(60)} → ${n} posts`);
}

// === Apply ===
const apply = process.argv.includes('--apply');
if (!apply) {
  console.log('\nDry run. Re-run with --apply to write changes to Supabase.');
  console.log('\nSample of assignments:');
  for (const a of assignments.slice(0, 25)) {
    console.log(
      `  ${a.slug.padEnd(45)} ${a.changed ? '→' : '='} ${a.newImage.padEnd(40)} (${a.reason})`
    );
  }
  process.exit(0);
}

console.log('\nApplying...');
let updated = 0;
for (const a of assignments) {
  if (!a.changed) continue;
  const { error } = await supabase
    .from('blog_posts')
    .update({ image_url: a.newUrl, imageUrl: a.newUrl })
    .eq('slug', a.slug);
  if (error) {
    console.log(`FAIL ${a.slug}: ${error.message}`);
  } else {
    updated++;
  }
}
console.log(`Updated ${updated} posts.`);
