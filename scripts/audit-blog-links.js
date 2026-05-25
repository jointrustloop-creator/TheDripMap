// Audit blog post content for internal links pointing at non-existent targets.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: posts } = await supabase.from('blog_posts').select('slug, content');
const { data: providers } = await supabase
  .from('providers')
  .select('slug')
  .neq('availability', false);
const { data: cities } = await supabase.from('cities').select('slug');

const validProviders = new Set(providers.map((p) => p.slug).filter(Boolean));
const validCities = new Set(cities.map((c) => c.slug).filter(Boolean));
const validBlogs = new Set(posts.map((p) => p.slug).filter(Boolean));
const validTreatments = new Set([
  'nad-plus', 'hangover', 'immune-support', 'beauty-glow', 'weight-loss',
  'hydration', 'recovery', 'myers-cocktail', 'jet-lag', 'energy-boost',
  'nad-plus-therapy', 'hangover-recovery', 'athletic-recovery', 'nad',
]);
const validGuides = new Set([
  'how-to-choose-iv-therapy-clinic', 'iv-therapy-cost-guide',
  'iv-therapy-vs-oral-supplements', 'first-time-iv-therapy-what-to-expect',
  'mobile-iv-therapy-vs-clinic',
]);
const validStates = new Set([
  'florida', 'new-york', 'texas', 'california', 'virginia', 'ontario',
]);

const broken = { providers: [], cities: [], blog: [], treatments: [], guide: [], states: [] };

const RE = /(?:\]\(|href=")(\/(providers|cities|blog|treatments|guide|states)\/([a-z0-9-]+))/g;

for (const post of posts) {
  const content = post.content || '';
  for (const match of content.matchAll(RE)) {
    const [, , kind, slug] = match;
    let ok = false;
    if (kind === 'providers') ok = validProviders.has(slug);
    else if (kind === 'cities') ok = validCities.has(slug);
    else if (kind === 'blog') ok = validBlogs.has(slug);
    else if (kind === 'treatments') ok = validTreatments.has(slug);
    else if (kind === 'guide') ok = validGuides.has(slug);
    else if (kind === 'states') ok = validStates.has(slug);
    if (!ok) broken[kind].push({ post: post.slug, slug });
  }
}

console.log('Scanned', posts.length, 'posts.');
let total = 0;
for (const [kind, list] of Object.entries(broken)) {
  total += list.length;
  console.log(`${kind}: ${list.length} broken`);
  for (const b of list.slice(0, 10)) {
    console.log(`  /${kind}/${b.slug}  (in: ${b.post})`);
  }
}
console.log(total === 0 ? '\nALL CLEAN ✓' : `\n${total} broken links remain`);
