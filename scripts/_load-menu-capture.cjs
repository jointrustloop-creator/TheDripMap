// Load reviewed menu-capture staging into clinic_drips + drip_ingredients.
// Loads ONLY confidence='high' rows (price + menu-like name); medium/low stay
// in staging for operator review. Idempotent per provider (skips providers
// that already have clinic_website rows). Tolerant if tables absent.
// --dry previews. --slug=<slug> loads one clinic only.
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');
const ONLY = (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || null;

(async () => {
  const probe = await s.from('clinic_drips').select('id').limit(1);
  if (probe.error) { console.log('clinic_drips not created yet (paste scripts/sql/create-drip-capture.sql). Nothing done.'); return; }

  const staging = JSON.parse(fs.readFileSync('.audit-tmp/_menu-capture.json', 'utf8'));
  // Canada-first: only load Canadian clinics (QA found a US clinic's referral
  // promo scored high-confidence — country filter removes that class entirely).
  const { data: caRows } = await s.from('providers').select('id').eq('country', 'Canada');
  const CA = new Set((caRows || []).map((r) => r.id));
  // Manual review exclusions (GTA sprint QA pass, 2026-08-16):
  // - upper-room-*: standing operator rule, never act on their published menu
  // - timeless-health-*: their "high" rows are ORAL supplements (LipoMicel,
  //   "Oral Liquid"), a retail store page, not an IV menu
  // - serene-cosmetic: $799 "long-lasting hydration" is a skin treatment
  const EXCLUDE_SLUGS = new Set([
    'upper-room-clinic-toronto', 'upper-room-clinic-oakville',
    'timeless-health-clinic-toronto', 'timeless-health-clinic-mississauga',
    'serene-cosmetic-clinic-markham',
  ]);
  // Row-level: promo lines and indication-list fragments that scored high but
  // are not a named drip with its price.
  const EXCLUDE_ROW = (slug, name) =>
    /receive \d+% off/i.test(name) ||
    (slug === 'clara-clinic-toronto' && /^key ingredients/i.test(name)) ||
    (slug === 'drip-club-toronto' && /^(cold & flu|hangovers, headaches)/i.test(name));

  let drips = 0, ings = 0, clinics = 0, skipped = 0;
  for (const c of staging) {
    if (ONLY && c.slug !== ONLY) continue;
    if (EXCLUDE_SLUGS.has(c.slug)) { skipped++; continue; }
    if (!CA.has(c.provider_id)) { skipped++; continue; }
    const high = (c.drips || []).filter((d) => d.confidence === 'high' && !EXCLUDE_ROW(c.slug, d.published_name || ''));
    if (!high.length) { skipped++; continue; }
    const { data: existing, error: exErr } = await s.from('clinic_drips').select('id').eq('provider_id', c.provider_id).eq('source_type', 'clinic_website').limit(1);
    if (exErr) { console.log(`ERR probe ${c.slug}: ${exErr.message}`); continue; }
    if (existing && existing.length) { skipped++; continue; }
    if (DRY) { console.log(`[dry] ${c.slug}: ${high.length} drips, ${high.reduce((a, d) => a + (d.ingredients || []).length, 0)} ingredient links`); clinics++; drips += high.length; continue; }
    for (const d of high) {
      const { data: inserted, error } = await s.from('clinic_drips').insert({
        provider_id: c.provider_id,
        published_name: d.published_name,
        formula_id: d.formula_id || null,
        price_cad: d.price_cad, price_raw: d.price_raw,
        duration_min: null, duration_raw: null,
        published_indication: null,
        source_type: 'clinic_website',
        source_url: d.source_url,
        captured_at: d.captured_at,
        verbatim_snippet: d.verbatim_snippet,
        is_active: true,
      }).select('id').single();
      if (error) { console.log(`ERR insert ${c.slug} "${d.published_name}": ${error.message}`); continue; }
      drips++;
      for (const ing of d.ingredients || []) {
        const r2 = await s.from('drip_ingredients').insert({
          clinic_drip_id: inserted.id, ingredient_id: ing,
          dose_raw: null, dose_value: null, dose_unit: null,
          source_url: d.source_url, captured_at: d.captured_at,
        });
        if (!r2.error) ings++;
      }
    }
    clinics++;
    console.log(`OK ${c.slug}: ${high.length} drips loaded`);
  }
  console.log(`\n${DRY ? 'DRY: would load' : 'Loaded'} ${drips} drips + ${ings} ingredient links across ${clinics} clinics (${skipped} skipped).`);
})();
