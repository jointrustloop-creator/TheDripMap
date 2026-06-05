/**
 * Peptide removal Phase 1: strip tag from IV+peptide hybrid providers.
 *
 *   - Fetch all providers tagged with peptide (category or specialties)
 *   - Classify each as IV+peptide hybrid (KEEP, strip tag) or peptide-primary
 *     (handled by Phase 2)
 *   - For hybrids: remove 'Peptide Therapy' (and BPC-157, semaglutide, etc.
 *     when present as standalone specialties) from specialties, flip
 *     category from 'Peptide Therapy' to 'IV Therapy'
 *   - Write a JSON receipt with before/after for every modified row so the
 *     change is reversible
 *
 * Idempotent — re-running over already-cleaned rows is a no-op.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
  'HGH',
  'GLP-1',
  'GLP-1 Weight Loss',
]);

const IV_SIGNAL = /\b(iv therapy|iv hydration|iv infusion|iv drip|myers cocktail|nad\+|hangover|hydration drip|vitamin iv|wellness drip|wellness iv|vitamin injections|beauty glow)\b/i;

(async () => {
  const { data, error } = await sb
    .from('providers')
    .select('id, slug, name, city, country, category, specialties, description, is_claimed')
    .or('category.ilike.%peptide%,specialties.cs.{Peptide Therapy}');
  if (error) {
    console.error('Fetch failed:', error.message);
    process.exit(1);
  }
  console.log('Total peptide-tagged rows:', data.length);

  const receipt = { phase: 1, timestamp: new Date().toISOString(), modified: [], skipped_peptide_primary: [] };
  let mods = 0;

  for (const p of data) {
    const text = (
      (p.specialties || []).join(' ') + ' ' + (p.description || '') + ' ' + (p.category || '')
    ).toLowerCase();
    const isHybrid = IV_SIGNAL.test(text);

    if (!isHybrid) {
      // Phase 2 handles these (hide them, do not modify specialties here).
      receipt.skipped_peptide_primary.push({ id: p.id, slug: p.slug, country: p.country });
      continue;
    }

    // Hybrid: strip peptide tags from specialties, normalize category
    const before = {
      specialties: p.specialties ? [...p.specialties] : null,
      category: p.category,
    };
    const cleanedSpecs = (p.specialties || []).filter((s) => !PEPTIDE_TAGS.has(s));
    let newCategory = p.category;
    if (/peptide/i.test(p.category || '')) newCategory = 'IV Therapy';

    const specsChanged = JSON.stringify(cleanedSpecs) !== JSON.stringify(p.specialties || []);
    const catChanged = newCategory !== p.category;

    if (!specsChanged && !catChanged) {
      // Already clean (idempotent re-run).
      continue;
    }

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
    console.log('  ✓ stripped peptide from', p.slug, '(' + (p.country || '') + ')');
  }

  console.log();
  console.log('Modified:', mods);
  console.log('Skipped (peptide-primary, Phase 2 will hide):', receipt.skipped_peptide_primary.length);

  const outPath = path.join('scripts', '_receipts', `peptide-phase-1-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt written:', outPath);
})();
