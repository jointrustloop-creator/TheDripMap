/**
 * One-time backfill for the 2026-06-19 badge rule:
 *   Safety Verified <- the safety questionnaire is completed.
 *
 * Sets providers.safety_verified = true for every CLAIMED clinic that already
 * completed the safety questionnaire, via EITHER:
 *   (a) the /finish form safety section (decision_drivers.manage.team.whoPlaces
 *       + oversight) -> derive the attestation flags into operator_profiles, or
 *   (b) an operator-recorded attestation already in operator_profiles.profile_data.
 *
 * Mirrors the logic in src/lib/safety.ts (isSafetyComplete / deriveSafetyFlags)
 * so the cron/API path and this backfill agree. Idempotent: re-running is a
 * no-op for rows already set. Read-modify-write; never clears a flag.
 *
 * Run: node scripts/backfill-safety-verified.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const FLAGS = ['verifiedMedicalDirector','verifiedClinician','verifiedCompoundingPharmacy','verifiedLiabilityInsurance','verifiedStateBoard'];

function isSafetyComplete(manage) {
  const t = (manage && manage.team) || {};
  const who = Array.isArray(t.whoPlaces) ? t.whoPlaces : [];
  return who.length > 0 && typeof t.oversight === 'string' && t.oversight.trim().length > 0;
}
function deriveSafetyFlags(manage) {
  const t = (manage && manage.team) || {};
  const who = Array.isArray(t.whoPlaces) ? t.whoPlaces : [];
  const oversight = typeof t.oversight === 'string' ? t.oversight : '';
  const sourcing = Array.isArray(manage && manage.sourcing) ? manage.sourcing : [];
  const out = {};
  if (who.length) { out.verifiedClinician = true; out.administerType = who.join(', '); }
  if (oversight) out.verifiedMedicalDirector = true;
  if (sourcing.some((x) => /compounding pharmacy|503B/i.test(String(x)))) out.verifiedCompoundingPharmacy = true;
  return out;
}

(async () => {
  const { data: provs } = await s.from('providers')
    .select('id,name,is_claimed,safety_verified,decision_drivers').or('is_claimed.eq.true,safety_verified.eq.true');
  const ids = provs.map((p) => p.id);
  const profByClinic = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const { data: ops } = await s.from('operator_profiles').select('id,clinic_id,profile_data').in('clinic_id', ids.slice(i, i + 50));
    for (const o of (ops || [])) profByClinic.set(o.clinic_id, o);
  }
  const before = provs.filter((p) => p.safety_verified === true).length;
  let set = 0, derived = 0;
  for (const p of provs) {
    const dd = p.decision_drivers && typeof p.decision_drivers === 'object' ? p.decision_drivers : {};
    const manage = dd.manage && typeof dd.manage === 'object' ? dd.manage : null;
    const profRow = profByClinic.get(p.id);
    const pd = (profRow && profRow.profile_data) || {};
    const hasFlags = FLAGS.some((f) => pd[f] === true);
    const fc = manage ? isSafetyComplete(manage) : false;
    if (!hasFlags && !fc) continue; // not completed -> no badge
    if (!hasFlags && fc) {
      const newPd = { ...pd, ...deriveSafetyFlags(manage) };
      if (profRow) await s.from('operator_profiles').update({ profile_data: newPd }).eq('id', profRow.id);
      else await s.from('operator_profiles').insert({ clinic_id: p.id, profile_data: newPd });
      derived++;
    }
    if (p.safety_verified !== true) { await s.from('providers').update({ safety_verified: true }).eq('id', p.id); set++; console.log('  + safety_verified:', p.name); }
  }
  const { count: after } = await s.from('providers').select('id', { count: 'exact', head: true }).eq('safety_verified', true);
  console.log(`\nsafety_verified: ${before} -> ${after}  (newly set ${set}, flags derived from form ${derived})`);
  process.exit(0);
})().catch((e) => { console.log('FATAL', e.message); process.exit(1); });
