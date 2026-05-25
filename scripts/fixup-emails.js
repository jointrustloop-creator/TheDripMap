// Fix the email lookup pass:
// 1. Remove garbage emails (placeholder, filename-extracted) from Supabase
// 2. Update outreach-drafts.md using slug-based matching (more reliable than name)

import dotenv from 'dotenv';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Garbage emails found in the previous pass — invalid (placeholder text, parsed from image filenames)
const GARBAGE = [
  'mymail@mailservice.com', // template placeholder on Hangover IV's site
  // Filename-extracted garbage: replenish360 had no clean email; entire string is junk
  'who-needs-iv-therapy-replenish-360-yourcprmd.comreplenish360-replenish360ivtherapy@gmail.com-760-832-4277-177x142.jpg',
];

// Real emails to apply, keyed by slug (more reliable than name matching)
const REAL_EMAILS = {
  'revitalize-iv-solutions-medspa-iv-hydration-therapy-and-wellness-services-chicago': 'info@myrivs.com',
  'sage-health-wellness': 'info@sagehwc.com',
  'blissfusion-l-san-francisco-bay-area': 'info@blissfusionsf.com',
  'diba-med-spa': 'diba@dibamedspa.com',
  'immunity-center-burbank': 'info@immunitycenter.io',
  'ever-iv': 'hello@everiv.com',
  'infinite-health-zone-integrative-medicine-san-francisco': 'contact@infinitehealthzone.com',
  'iv-drip-2-u-mobile-iv-therapy-las-vegas': 'info@ivdrip2u.com',
  'hydrovita-infusion-lounge': 'hello@hydrovitalounge.com',
  'hydroinfusion-mobile-iv-therapy-chicago': 'info@ivhydroinfusion.com',
  'the-beauty-lounge-of-peoria': 'thebeautyloungeofpeoria@gmail.com',
};

// Step 1: Clean up the 2 garbage emails (set back to null)
console.log('=== Step 1: Removing garbage emails from Supabase ===');
for (const bad of GARBAGE) {
  const { data, error } = await supabase
    .from('providers')
    .update({ email: null })
    .eq('email', bad)
    .select('id, name');
  if (error) { console.log(`  ⚠ ${bad}: ${error.message}`); continue; }
  console.log(`  ✓ Cleared ${data.length} provider(s) for: ${bad.slice(0, 60)}...`);
}

// Step 2: Look up actual slugs from DB for each of the REAL_EMAILS keys
// (because the slug I used as key might differ from the DB slug — verify)
console.log('\n=== Step 2: Verifying slugs and re-applying real emails ===');
for (const [slugAttempt, email] of Object.entries(REAL_EMAILS)) {
  // First try exact slug match
  let { data } = await supabase
    .from('providers')
    .select('id, slug, email, name')
    .eq('slug', slugAttempt)
    .maybeSingle();
  if (!data) {
    // Try with the email already set (we know we set it earlier)
    const { data: byEmail } = await supabase
      .from('providers')
      .select('id, slug, email, name')
      .eq('email', email)
      .maybeSingle();
    data = byEmail;
  }
  if (!data) {
    console.log(`  ⚠ Could not find provider for ${email} (tried slug: ${slugAttempt})`);
    continue;
  }
  console.log(`  ✓ ${email.padEnd(40)} → ${data.slug}`);
}

// Step 3: Update outreach-drafts.md using slug-in-URL matching
console.log('\n=== Step 3: Updating outreach-drafts.md by slug ===');
const draftsPath = 'scripts/outreach-drafts.md';
let drafts = fs.readFileSync(draftsPath, 'utf8');

// Get fresh email map keyed by slug (in case the slugs in REAL_EMAILS were wrong)
const { data: allFound } = await supabase
  .from('providers')
  .select('slug, email')
  .not('email', 'is', null)
  .in('slug', [
    ...Object.keys(REAL_EMAILS),
    // Plus search by all the emails we set
  ]);

// Build a map: slug → email
const slugToEmail = {};
for (const r of allFound || []) {
  slugToEmail[r.slug] = r.email;
}

// Also include the slug-attempts in case the DB has them
for (const [slug, email] of Object.entries(REAL_EMAILS)) {
  if (!slugToEmail[slug]) slugToEmail[slug] = email;
}

let updated = 0;
for (const [slug, email] of Object.entries(slugToEmail)) {
  // Pattern: find the email block where the Claim URL contains this slug.
  // The structure is:
  //   ## Email N — Name (City)
  //   **To:** no email on file — find one manually
  //   **Subject:** ...
  //   ...body...
  //   https://www.thedripmap.com/providers/<slug>
  //   ---
  // We match the email block by looking for the slug URL, then walk backwards to the To: line.

  // Simpler approach: split by --- separator into blocks, then for each block, check if it
  // contains the slug. If yes, replace its "no email on file" line.
  const blocks = drafts.split(/\n---\n/);
  let blockChanged = false;
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].includes(`/providers/${slug}`)) {
      if (blocks[i].includes('**To:** no email on file')) {
        blocks[i] = blocks[i].replace(
          '**To:** no email on file — find one manually',
          `**To:** ${email}`
        );
        blockChanged = true;
      }
      break;
    }
  }
  if (blockChanged) {
    drafts = blocks.join('\n---\n');
    updated++;
    console.log(`  ✓ ${email.padEnd(40)} (${slug})`);
  } else {
    console.log(`  ⚠ Could not locate block for slug: ${slug}`);
  }
}
fs.writeFileSync(draftsPath, drafts);
console.log(`\nReplaced ${updated} 'no email on file' lines in outreach-drafts.md`);

// Final state report
console.log('\n=== Final state ===');
const { data: stillMissing } = await supabase
  .from('providers')
  .select('name, city, website')
  .in('id', [
    // Get the 20 IDs from top20.json
  ])
  .is('email', null);

// Recount what we have
const { data: allUpdated, count } = await supabase
  .from('providers')
  .select('name, city, email', { count: 'exact' })
  .not('email', 'is', null);
console.log(`Total providers with email set: ${count} (across the whole table)`);

// Show our 20 specifically
const top20 = JSON.parse(fs.readFileSync('scripts/top20.json', 'utf8'));
const top20Ids = top20.map(p => p.id);
const { data: ourTop20 } = await supabase
  .from('providers')
  .select('name, city, email')
  .in('id', top20Ids);
const top20WithEmail = ourTop20.filter(p => p.email);
const top20Without = ourTop20.filter(p => !p.email);
console.log(`Top 20 with email set: ${top20WithEmail.length}/20`);
console.log(`Top 20 without email: ${top20Without.length}/20`);
if (top20Without.length) {
  console.log('\nStill missing email (need manual lookup):');
  top20Without.forEach(p => console.log(`  ${p.name.padEnd(50)} (${p.city})`));
}
