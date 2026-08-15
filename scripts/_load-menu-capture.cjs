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
  let drips = 0, ings = 0, clinics = 0, skipped = 0;
  for (const c of staging) {
    if (ONLY && c.slug !== ONLY) continue;
    const high = (c.drips || []).filter((d) => d.confidence === 'high');
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
