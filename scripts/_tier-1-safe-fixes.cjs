/**
 * Tier 1 safe fixes — only the corrections we have explicit authority for:
 *
 *   1. Bay Wellness description: strip "peptide therapy, " per the
 *      2026-06-06 standing decision (peptides parked, no peptide
 *      positioning).
 *   2. Bay Wellness specialties + services: replace " — " (em-dash) with
 *      " - " (hyphen). 4 "Medical Aesthetics" entries each.
 *   3. Refresh Med Spa LA description: replace em-dash with " - ".
 *
 * JSON receipt with before/after written for reversibility.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const receipt = { phase: 'tier-1-safe-fixes', timestamp: new Date().toISOString(), changes: [] };

async function fixBayWellness() {
  const { data: p } = await sb
    .from('providers')
    .select('id, slug, description, specialties, services')
    .eq('slug', 'bay-wellness-centre-vancouver')
    .single();
  if (!p) return;

  const before = { description: p.description, specialties: [...(p.specialties || [])], services: JSON.parse(JSON.stringify(p.services || [])) };

  // 1. description: strip "peptide therapy, " (case-insensitive)
  let newDesc = p.description.replace(/peptide therapy,?\s*/i, '').replace(/\s{2,}/g, ' ').trim();

  // 2. specialties: replace em-dash with " - "
  const newSpecs = (p.specialties || []).map((s) => s.replace(/\s+[—–]\s+/g, ' - '));

  // 3. services: replace em-dash in service names
  const newServices = (p.services || []).map((s) => ({
    ...s,
    name: typeof s.name === 'string' ? s.name.replace(/\s+[—–]\s+/g, ' - ') : s.name,
    description: typeof s.description === 'string' ? s.description.replace(/\s+[—–]\s+/g, ' - ') : s.description,
  }));

  const { error } = await sb
    .from('providers')
    .update({ description: newDesc, specialties: newSpecs, services: newServices })
    .eq('id', p.id);
  if (error) {
    console.error('Bay Wellness update failed:', error.message);
    return;
  }
  receipt.changes.push({
    slug: 'bay-wellness-centre-vancouver',
    before,
    after: { description: newDesc, specialties: newSpecs, services: newServices },
  });
  console.log('✓ Bay Wellness: peptide removed from description, em-dashes -> hyphens (4 specialties + 4 services)');
}

async function fixRefreshMedSpa() {
  const { data: p } = await sb
    .from('providers')
    .select('id, slug, description')
    .eq('slug', 'refresh-med-spa-la-los-angeles')
    .single();
  if (!p) return;

  const before = { description: p.description };
  const newDesc = p.description.replace(/\s+[—–]\s+/g, ' - ');

  if (newDesc === p.description) {
    console.log('  Refresh Med Spa: no em-dash found, skipping');
    return;
  }

  const { error } = await sb
    .from('providers')
    .update({ description: newDesc })
    .eq('id', p.id);
  if (error) {
    console.error('Refresh Med Spa update failed:', error.message);
    return;
  }
  receipt.changes.push({
    slug: 'refresh-med-spa-la-los-angeles',
    before,
    after: { description: newDesc },
  });
  console.log('✓ Refresh Med Spa LA: em-dash -> hyphen in description');
}

(async () => {
  await fixBayWellness();
  await fixRefreshMedSpa();

  const dir = path.join('scripts', '_receipts');
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'tier-1-safe-fixes-' + Date.now() + '.json');
  fs.writeFileSync(out, JSON.stringify(receipt, null, 2));
  console.log('Receipt:', out);
})();
