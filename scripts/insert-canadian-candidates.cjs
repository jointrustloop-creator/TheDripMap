// Inserts the 184 ready-to-insert Canadian candidates from
// scripts/_canadian-candidates-ready-to-insert.json (which was produced by
// scripts/dedup-canadian-candidates-dry-run.cjs).
//
// Uses the same row shape as scripts/import-canada-clinics.cjs so the new rows
// look identical to the previous Canadian import.

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const slugify = (s) =>
  (s || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const IV_TOKENS = ['iv therapy', 'hydration', 'hangover', 'nad', 'vitamin', 'myers', 'mobile iv', 'immune', 'recovery', 'iron', 'glutathione'];
const PEPTIDE_TOKENS = ['peptide'];
const WL_TOKENS = ['semaglutide', 'tirzepatide', 'weight loss', 'glp'];
function pickCategory(services) {
  const lower = (services || []).map((s) => (s || '').toLowerCase());
  const has = (toks) => lower.some((s) => toks.some((t) => s.includes(t)));
  if (has(IV_TOKENS)) return 'IV Therapy';
  if (has(PEPTIDE_TOKENS)) return 'Peptide Therapy';
  if (has(WL_TOKENS)) return 'Medical Weight Loss';
  return 'IV Therapy';
}

(async () => {
  const candidates = JSON.parse(
    fs.readFileSync('scripts/_canadian-candidates-ready-to-insert.json', 'utf8')
  );
  console.log('Candidates to insert:', candidates.length);

  // Refresh slug index so we never collide
  const { data: existingSlugs } = await sb.from('providers').select('slug');
  const slugSet = new Set((existingSlugs || []).map((r) => r.slug).filter(Boolean));

  const byProvince = {};
  const failures = [];
  let inserted = 0;
  for (const c of candidates) {
    let slug = slugify(`${c.name}-${c.city}`);
    while (slugSet.has(slug)) slug = slug + '-x';
    slugSet.add(slug);

    const specialties = Array.from(new Set(c.services || []));
    const category = pickCategory(specialties);
    const description = `${c.name} is a ${c.city}, ${c.state} provider offering ${category.toLowerCase()}. Advertised services include ${specialties.join(', ')}. Confirm current treatments, pricing, and availability directly with the clinic.`;

    const row = {
      name: c.name,
      city: c.city,
      state: c.state,
      country: c.country,
      website: c.website || null,
      phone: c.phone || null,
      address: c.address || null,
      specialties,
      description,
      category,
      type: 'Clinic',
      slug,
      is_featured: false,
      availability: true,
      created_at: new Date().toISOString(),
    };

    const { error } = await sb.from('providers').insert(row);
    if (error) {
      failures.push({ name: c.name, city: c.city, error: error.message });
      continue;
    }
    inserted++;
    byProvince[c.state] = (byProvince[c.state] || 0) + 1;
    if (inserted % 25 === 0) console.log('  ...inserted', inserted);
  }

  console.log('\n--- Summary ---');
  console.log('Inserted:', inserted, '/', candidates.length);
  console.log('Per province:');
  Object.entries(byProvince).forEach(([k, v]) => console.log('  ' + k + ': +' + v));
  console.log('Failures:', failures.length);
  failures.slice(0, 10).forEach((f) => console.log('  ✗', f.name, '(' + f.city + ') —', f.error));
  if (failures.length > 10) console.log('  (and', failures.length - 10, 'more)');

  // Updated totals so we can report fresh
  const { count: onTotal } = await sb.from('providers').select('id', { count: 'exact', head: true }).eq('state', 'Ontario');
  const { count: bcTotal } = await sb.from('providers').select('id', { count: 'exact', head: true }).eq('state', 'British Columbia');
  const { count: totalProv } = await sb.from('providers').select('id', { count: 'exact', head: true });
  console.log('\nLive totals after insert:');
  console.log('  Ontario:', onTotal);
  console.log('  British Columbia:', bcTotal);
  console.log('  Total providers:', totalProv);
})();
