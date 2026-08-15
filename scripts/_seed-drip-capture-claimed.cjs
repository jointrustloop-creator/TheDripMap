// Drip-capture seed: claimed clinics first (operator priority ruling).
// Converts each claimed clinic's /finish-selected services into clinic_drips
// rows with honest attribution: source_type='owner_finish_form',
// published_name = OUR template label (which is exactly what the owner
// selected — never presented as the clinic's website menu), formula_id from
// the vocabulary. Idempotent: skips a provider that already has rows.
// Tolerant: exits cleanly if clinic_drips is not created yet (SQL unpasted).
require('dotenv').config({ path: '.env.local', override: true });
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');

// Minimal formula matcher mirroring src/lib/drip-vocabulary.ts (kept in sync;
// the TS module is ESM-imported by the app, this CJS script inlines the map).
const FORMULA_SYNONYMS = [
  ['myers', ['myers']],
  ['hydration', ['hydration', 'saline']],
  ['hangover', ['hangover', 'recovery']],
  ['immune', ['immune', 'cold & flu', 'cold and flu']],
  ['high_dose_c', ['high-dose vitamin c', 'high dose vitamin c']],
  ['glutathione_push', ['glutathione']],
  ['nad_infusion', ['nad']],
  ['energy', ['energy', 'b12']],
  ['beauty', ['beauty', 'glow']],
  ['athletic', ['athletic']],
  ['iron_infusion', ['iron']],
  ['weight_loss', ['weight-loss', 'weight loss']],
];
function matchFormula(name) {
  const n = String(name || '').toLowerCase();
  let best = null, len = 0;
  for (const [id, syns] of FORMULA_SYNONYMS) for (const syn of syns) if (n.includes(syn) && syn.length > len) { best = id; len = syn.length; }
  return best;
}
function parsePrice(p) {
  if (!p) return null;
  const m = String(p).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

(async () => {
  // tolerate missing table. NOTE: a head-count probe FALSE-POSITIVES on missing
  // tables (returns no error) — use a real select, which errors correctly.
  const probe = await s.from('clinic_drips').select('id').limit(1);
  if (probe.error) { console.log('clinic_drips table not created yet (paste scripts/sql/create-drip-capture.sql). Nothing done.'); return; }

  const { data: claimed, error } = await s.from('providers')
    .select('id,slug,name,services')
    .eq('is_claimed', true).not('services', 'is', null);
  if (error) { console.log('ERR', error.message); return; }

  const today = new Date().toISOString().slice(0, 10);
  let inserted = 0, providersSeeded = 0, skipped = 0;
  for (const p of claimed || []) {
    const services = Array.isArray(p.services) ? p.services.filter((x) => x && typeof x === 'object' && x.source === 'finish_template') : [];
    if (!services.length) { skipped++; continue; }
    const { count } = await s.from('clinic_drips').select('id', { count: 'exact', head: true }).eq('provider_id', p.id);
    if (count && count > 0) { skipped++; continue; } // idempotent
    const rows = services.map((sv) => ({
      provider_id: p.id,
      published_name: String(sv.name).slice(0, 120),
      formula_id: matchFormula(sv.name),
      price_cad: parsePrice(sv.price),
      price_raw: sv.price ? String(sv.price) : null,
      duration_min: null,
      duration_raw: sv.duration ? String(sv.duration) : null,
      published_indication: null,
      source_type: 'owner_finish_form',
      source_url: `https://www.thedripmap.com/providers/${p.slug}`,
      captured_at: today,
      verbatim_snippet: 'Owner-selected from TheDripMap standard drip list via /finish.',
      is_active: true,
    }));
    if (DRY) { console.log(`[dry] ${p.slug}: ${rows.length} drips (${rows.filter(r=>r.formula_id).length} formula-matched, ${rows.filter(r=>r.price_cad).length} priced)`); providersSeeded++; inserted += rows.length; continue; }
    const ins = await s.from('clinic_drips').insert(rows);
    if (ins.error) { console.log(`ERR ${p.slug}: ${ins.error.message}`); continue; }
    providersSeeded++; inserted += rows.length;
    console.log(`OK ${p.slug}: ${rows.length} drips seeded`);
  }
  console.log(`\n${DRY ? 'DRY: would seed' : 'Seeded'} ${inserted} drips across ${providersSeeded} claimed clinics (${skipped} skipped).`);
})();
