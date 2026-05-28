/**
 * Flip a clinic's Trust & Credentials verification flags as owners confirm them.
 *
 *   node scripts/verify-clinic.cjs --slug <provider-slug> --flag <name>
 *   node scripts/verify-clinic.cjs --slug <provider-slug> --flag <name> --unset
 *   node scripts/verify-clinic.cjs --slug <provider-slug> --status
 *
 * Flag names (aliases accepted):
 *   compounding   → verifiedCompoundingPharmacy
 *   insurance     → verifiedLiabilityInsurance
 *   stateboard    → verifiedStateBoard
 *   director      → verifiedMedicalDirector
 *   clinician     → verifiedClinician
 *   all           → all five at once
 *
 * Examples:
 *   node scripts/verify-clinic.cjs --slug blue-cypress-iv-and-wellness-georgetown --flag compounding
 *   node scripts/verify-clinic.cjs --slug refresh-med-spa-la-los-angeles --flag insurance
 *   node scripts/verify-clinic.cjs --slug refresh-med-spa-la-los-angeles --status
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const FLAG_MAP = {
  compounding: 'verifiedCompoundingPharmacy',
  insurance:   'verifiedLiabilityInsurance',
  stateboard:  'verifiedStateBoard',
  director:    'verifiedMedicalDirector',
  clinician:   'verifiedClinician',
};
const ALL_FLAGS = Object.values(FLAG_MAP);
const FLAG_LABELS = {
  verifiedMedicalDirector:     'Medical director verified',
  verifiedClinician:           'RN / NP / MD administers',
  verifiedCompoundingPharmacy: 'Licensed compounding pharmacy',
  verifiedLiabilityInsurance:  'Liability insurance confirmed',
  verifiedStateBoard:          'State board compliant',
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--unset') args.unset = true;
    else if (a === '--status') args.status = true;
    else if (a === '--slug') args.slug = argv[++i];
    else if (a === '--flag') args.flag = (argv[++i] || '').toLowerCase();
  }
  return args;
}

function printStatus(pd) {
  let count = 0;
  for (const key of ALL_FLAGS) {
    const on = pd[key] === true;
    if (on) count++;
    console.log(`  ${on ? '✓' : '◌'}  ${FLAG_LABELS[key]}`);
  }
  console.log(`  ── ${count}/5 verified ${count === 5 ? '→ 🛡  SAFETY VERIFIED' : '→ Verification in progress'}`);
}

(async () => {
  const args = parseArgs(process.argv);

  if (!args.slug) {
    console.error('Usage: node scripts/verify-clinic.cjs --slug <provider-slug> --flag <compounding|insurance|stateboard|director|clinician|all> [--unset]');
    console.error('   or: node scripts/verify-clinic.cjs --slug <provider-slug> --status');
    process.exit(1);
  }

  // 1. Resolve provider by slug
  const { data: provider, error: provErr } = await sb
    .from('providers')
    .select('id, name, slug, is_featured')
    .eq('slug', args.slug)
    .maybeSingle();
  if (provErr) { console.error('DB error:', provErr.message); process.exit(1); }
  if (!provider) { console.error(`No provider found with slug "${args.slug}".`); process.exit(1); }

  // 2. Find its operator profile
  const { data: prof, error: profErr } = await sb
    .from('operator_profiles')
    .select('id, profile_data')
    .eq('clinic_id', provider.id)
    .maybeSingle();
  if (profErr) { console.error('DB error:', profErr.message); process.exit(1); }
  if (!prof) {
    console.error(`${provider.name} has no operator profile yet — the owner hasn't completed onboarding, so there's nothing to verify.`);
    process.exit(1);
  }

  const pd = prof.profile_data || {};

  // 3. Status-only mode
  if (args.status) {
    console.log(`\n${provider.name}  (${provider.slug})`);
    printStatus(pd);
    return;
  }

  // 4. Validate flag
  if (!args.flag) {
    console.error('Missing --flag. Use one of: compounding, insurance, stateboard, director, clinician, all');
    process.exit(1);
  }
  const value = !args.unset; // default sets true; --unset sets false
  const keysToSet = args.flag === 'all' ? ALL_FLAGS : [FLAG_MAP[args.flag]];
  if (keysToSet.includes(undefined)) {
    console.error(`Unknown flag "${args.flag}". Use one of: compounding, insurance, stateboard, director, clinician, all`);
    process.exit(1);
  }

  // 5. Apply + save
  const newPd = { ...pd };
  for (const k of keysToSet) newPd[k] = value;

  const { error: updErr } = await sb.from('operator_profiles').update({ profile_data: newPd }).eq('id', prof.id);
  if (updErr) { console.error('Update failed:', updErr.message); process.exit(1); }

  console.log(`\n${provider.name}  (${provider.slug})`);
  console.log(`${value ? 'Set' : 'Unset'}: ${keysToSet.map((k) => FLAG_LABELS[k]).join(', ')}\n`);
  printStatus(newPd);

  const nowAll = ALL_FLAGS.every((k) => newPd[k] === true);
  if (nowAll) {
    console.log('\n🎉 All 5 verified — this listing now shows the full green "Safety Verified" badge.');
  }
})();
