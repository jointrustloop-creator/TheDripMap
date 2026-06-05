/**
 * Phase 1b: strip peptide tag from the 7 providers flipped from HIDE -> KEEP
 * during the 2026-06-05 re-audit (operator's "natura-med-spa-and-iv-bar-denver"
 * catch surfaced the broader miss).
 *
 * Same shape as Phase 1: remove peptide-family entries from specialties,
 * flip category from 'Peptide Therapy' to 'IV Therapy', write a JSON receipt
 * with before/after for reversibility. Idempotent.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SLUGS = [
  'natura-med-spa-and-iv-bar-denver',
  'evolv-wellness-medspa-denver',
  'thrive-health-solutions-englewood',
  'htx-urology-webster',
  'tribecamed-miami-beach',
  'omni-sculpt-md-dallas',
  'daniel-benhuri-md-beverly-hills',
];

const PEPTIDE_TAGS = new Set([
  'Peptide Therapy',
  'Peptides',
  'Semaglutide',
  'Tirzepatide',
  'Retatrutide',
  'BPC-157',
  'TB-500',
  'GHK-Cu',
  'Sermorelin',
  'Ipamorelin',
  'CJC-1295',
  'PT-141',
  'Tesamorelin',
  'Epitalon',
  'Epithalon',
  'Thymosin Alpha-1',
  'Thymosin Beta',
  'AOD-9604',
  'HGH',
  'GLP-1',
  'GLP-1 Weight Loss',
]);

(async () => {
  const { data, error } = await sb
    .from('providers')
    .select('id, slug, name, city, country, category, specialties, is_claimed')
    .in('slug', SLUGS);
  if (error) {
    console.error('Fetch failed:', error.message);
    process.exit(1);
  }
  console.log('Audited:', data.length, 'of', SLUGS.length, 'slugs');

  const receipt = { phase: '1b', timestamp: new Date().toISOString(), modified: [] };
  let mods = 0;

  for (const p of data) {
    const before = {
      specialties: p.specialties ? [...p.specialties] : null,
      category: p.category,
    };
    const cleanedSpecs = (p.specialties || []).filter((s) => !PEPTIDE_TAGS.has(s));
    let newCategory = p.category;
    if (/peptide/i.test(p.category || '')) newCategory = 'IV Therapy';

    const specsChanged = JSON.stringify(cleanedSpecs) !== JSON.stringify(p.specialties || []);
    const catChanged = newCategory !== p.category;

    if (!specsChanged && !catChanged) continue;

    const { error: updErr } = await sb
      .from('providers')
      .update({ specialties: cleanedSpecs, category: newCategory })
      .eq('id', p.id);
    if (updErr) {
      console.error('Update failed for', p.slug, ':', updErr.message);
      receipt.modified.push({ id: p.id, slug: p.slug, error: updErr.message });
      continue;
    }
    mods++;
    receipt.modified.push({
      id: p.id,
      slug: p.slug,
      city: p.city,
      country: p.country,
      before,
      after: { specialties: cleanedSpecs, category: newCategory },
    });
    console.log('  ✓ stripped peptide from', p.slug);
  }

  console.log();
  console.log('Modified:', mods);
  const outPath = path.join('scripts', '_receipts', `peptide-phase-1b-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt written:', outPath);
})();
