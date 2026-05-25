// For each city-guide blog post, inject a state-page internal link near the end
// of the content if the post's city falls within a state we have a /states/[slug] page for.
//
// State pages we have: florida, new-york, texas, california, virginia, ontario.

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Map a slug substring → state slug (must match a real /states/[slug] page).
// Specificity matters: longer/more-specific keys first.
const SLUG_TO_STATE = {
  // Ontario (Canadian)
  'toronto':          { slug: 'ontario', name: 'Ontario' },
  'mississauga':      { slug: 'ontario', name: 'Ontario' },
  'oakville':         { slug: 'ontario', name: 'Ontario' },
  'brampton':         { slug: 'ontario', name: 'Ontario' },
  'north-york':       { slug: 'ontario', name: 'Ontario' },
  'yorkville':        { slug: 'ontario', name: 'Ontario' },
  'greater-toronto':  { slug: 'ontario', name: 'Ontario' },
  'ottawa':           { slug: 'ontario', name: 'Ontario' },
  // New York (US)
  'manhattan':        { slug: 'new-york', name: 'New York' },
  'upper-east-side':  { slug: 'new-york', name: 'New York' },
  'brooklyn':         { slug: 'new-york', name: 'New York' },
  'new-york':         { slug: 'new-york', name: 'New York' }, // matches best-iv-therapy-new-york-2026 and similar
  'nyc':              { slug: 'new-york', name: 'New York' },
  // California
  'los-angeles':      { slug: 'california', name: 'California' },
  'san-francisco':    { slug: 'california', name: 'California' },
  'san-diego':        { slug: 'california', name: 'California' },
  'san-jose':         { slug: 'california', name: 'California' },
  'san-carlos':       { slug: 'california', name: 'California' },
  'san-ramon':        { slug: 'california', name: 'California' },
  'sacramento':       { slug: 'california', name: 'California' },
  'fresno':           { slug: 'california', name: 'California' },
  // Texas
  'houston':          { slug: 'texas', name: 'Texas' },
  'dallas':           { slug: 'texas', name: 'Texas' },
  'austin':           { slug: 'texas', name: 'Texas' },
  // Florida
  'miami':            { slug: 'florida', name: 'Florida' },
  'clearwater':       { slug: 'florida', name: 'Florida' },
  'tampa':            { slug: 'florida', name: 'Florida' },
  // Virginia
  'washington-dc':    { slug: 'virginia', name: 'Virginia' }, // DC posts cover the NoVA market
  'fairfax':          { slug: 'virginia', name: 'Virginia' },
  'arlington':        { slug: 'virginia', name: 'Virginia' },
  'manassas':         { slug: 'virginia', name: 'Virginia' },
};

// Slug patterns that should NEVER get a state link injection (broader posts)
const SKIP_SLUGS = new Set([
  'iv-therapy-canada-complete-guide-2026', // already has multi-province links
  'iv-therapy-insurance-coverage-canada',
  'iv-therapy-insurance-ontario',
]);

function pickStateForSlug(slug) {
  if (SKIP_SLUGS.has(slug)) return null;
  // Longest substring match wins
  const matches = Object.entries(SLUG_TO_STATE)
    .filter(([key]) => slug.includes(key))
    .sort((a, b) => b[0].length - a[0].length);
  return matches.length ? matches[0][1] : null;
}

const { data: posts } = await supabase.from('blog_posts').select('id, slug, title, content');
console.log(`Loaded ${posts.length} blog posts`);

const STATE_LINK_MARKER = '<!-- state-link:injected -->';
let updated = 0;
let skipped = 0;
let alreadyHas = 0;

for (const p of posts) {
  const state = pickStateForSlug(p.slug);
  if (!state) { skipped++; continue; }

  // Skip if we already injected (marker present) OR if content already has the same /states/ link
  if (p.content.includes(STATE_LINK_MARKER)) { alreadyHas++; continue; }
  if (p.content.includes(`/states/${state.slug}`)) { alreadyHas++; continue; }

  // Inject a state-page reference paragraph near the end of the content
  const insertion = `\n\n${STATE_LINK_MARKER}\n## Explore more IV therapy in ${state.name}\n\n` +
    `For the full ${state.name} clinic directory — including every city we cover across the state — see our ` +
    `[${state.name} IV therapy directory](/states/${state.slug}).`;

  // If the content ends with the "Ready to find a clinic" or similar CTA section,
  // place the link BEFORE that CTA so it flows naturally. Otherwise append.
  let newContent;
  const ctaMatch = p.content.match(/\n##\s+Ready to find/i);
  if (ctaMatch && ctaMatch.index !== undefined) {
    newContent = p.content.slice(0, ctaMatch.index) + insertion + p.content.slice(ctaMatch.index);
  } else {
    newContent = p.content + insertion;
  }

  const { error } = await supabase.from('blog_posts').update({ content: newContent }).eq('id', p.id);
  if (error) {
    console.log(`  ⚠ ${p.slug}: ${error.message}`);
    continue;
  }
  updated++;
  console.log(`  ✓ ${p.slug.padEnd(45)} → /states/${state.slug}`);
}

console.log(`\nUpdated:       ${updated}`);
console.log(`Already had:   ${alreadyHas}`);
console.log(`Skipped (no state match): ${skipped}`);
