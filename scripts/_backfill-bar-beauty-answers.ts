/**
 * One-off backfill: Bar Beauty Medical (Toronto), RN-administered, MD-overseen.
 *
 * EVIDENCE (every field cited; nothing inferred beyond what is stated):
 *   whoPlaces ['RN']   <- barbeauty.ca/team: "Led by RN injectors with physician
 *                          oversight"; lead injector Jasmine Saggu, RN (CNO register).
 *   prescriber         <- CPSO Physician Register, register.cpso.on.ca
 *                          /physician-info/?cpsonum=95972, read 2026-09-08:
 *                          "Fudge, John David", CPSO# 95972, Member Status ACTIVE
 *                          (as of 30 Jun 2016), Independent Practice, Specialty
 *                          Psychiatry (Royal College, 2016). Professional
 *                          Corporation "John David Henneberry-Fudge Medicine
 *                          Professional Corporation" confirms the hyphenated name
 *                          the clinic uses. The number itself was published by the
 *                          clinic in its own schema.org data and then CONFIRMED on
 *                          the register (badge-standard §4: register beats site).
 *   sourcing           <- unknown; deliberately left blank.
 *
 * CAVEATS carried into the record for the reviewer: registered surname is Fudge;
 * specialty is Psychiatry (an MD's prescribing authority does not depend on
 * specialty, but the reviewer should see it); the professional corporation is
 * Inactive since 18 Nov 2024 (the individual licence is ACTIVE and that is what
 * the standard checks); Practice Conditions / Public Notifications were checked
 * separately at review time.
 *
 * Writes manage + prescriber_verification + status='pending' + recomputed
 * transparency. Never description/services/price/offers/photos. Does NOT grant the
 * badge. Refuses if manage already exists.
 *
 * POST-RUN REGISTER FINDINGS (2026-09-08, written into the DB record after this
 * script ran): Public Notifications: none (no current/past tribunal proceedings).
 * Practice Conditions: ONE, "may practise only in the areas of medicine in which
 * Dr. HENNEBERRY-FUDGE is educated and experienced" (specialty Psychiatry). The
 * reviewer decides whether medical direction of IV therapy sits within it.
 *
 * Run: npx tsx scripts/_backfill-bar-beauty-answers.ts          (dry run)
 *      npx tsx scripts/_backfill-bar-beauty-answers.ts --write  (writes)
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
import { isSafetyComplete } from '../src/lib/safety';
import { computeTransparencyScore } from '../src/lib/transparency-score';

const WRITE = process.argv.includes('--write');
const SLUG = 'bar-beauty-medical-toronto';
const MD = 'Dr. John David Henneberry-Fudge';
const CPSO = '95972';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  const { data: p, error } = await s.from('providers').select('*').eq('slug', SLUG).maybeSingle();
  if (error || !p) { console.error(`ABORT: ${error?.message || 'not found'}`); process.exit(1); }
  const dd = (p.decision_drivers && typeof p.decision_drivers === 'object') ? (p.decision_drivers as Record<string, unknown>) : {};
  if (dd.manage && Object.keys(dd.manage as object).length) { console.error('REFUSE: manage already present.'); process.exit(1); }
  // Guard against config drift: the MD must already be named on the stored row.
  const mt = JSON.stringify(p.medical_team || '');
  if (!mt.includes('Henneberry-Fudge')) { console.error('REFUSE: medical_team does not name Henneberry-Fudge.'); process.exit(1); }

  const note =
    `Recorded by operator 2026-09-08. Prescriber confirmed on the CPSO Physician Register `
    + `(register.cpso.on.ca/physician-info/?cpsonum=${CPSO}): "Fudge, John David", CPSO# ${CPSO}, Member Status ACTIVE `
    + `since 30 Jun 2016, Independent Practice, Specialty Psychiatry (Royal College). Professional Corporation `
    + `"John David Henneberry-Fudge Medicine Professional Corporation" (Inactive since 18 Nov 2024; individual licence ACTIVE) `
    + `confirms the hyphenated name. Number first published by the clinic in its own schema.org data, then confirmed on the register. `
    + `Who administers: RN, per barbeauty.ca/team ("Led by RN injectors with physician oversight"; lead injector Jasmine Saggu, RN). `
    + `Owner never filled /finish and never emailed answers (Gmail checked 2026-09-08). sourcing deliberately left blank. `
    + `REVIEWER: eyeball Practice Conditions / Public Notifications on the register page before approving.`;

  const manage = {
    team: { whoPlaces: ['RN'], prescriberName: MD, prescriberCredential: 'Physician (MD/DO)', prescriberRegNum: CPSO, leadName: MD },
    recordedVia: 'operator', recordedNote: note, recordedAt: new Date().toISOString(),
  };
  const prescriber_verification = {
    name: MD, reg_num: CPSO, credential: 'MD', verified: true,
    verified_at: new Date().toISOString(), verified_by: 'operator_delegate_agent',
    register: 'CPSO Physician Register', register_checked_at: '2026-09-08',
    register_name_as_listed: 'Fudge, John David', specialty: 'Psychiatry',
  };

  const complete = isSafetyComplete(manage);
  const t = computeTransparencyScore({ ...p, decision_drivers: { ...dd, manage, prescriber_verification } });
  console.log(`=== ${p.name} (${SLUG}) ===`);
  console.log(`  prescriber       : ${MD}, MD, CPSO #${CPSO} ACTIVE (register-verified 2026-09-08)`);
  console.log(`  who administers  : RN (clinic site)`);
  console.log(`  isSafetyComplete : ${complete}`);
  console.log(`  status           : ${p.safety_review_status} -> pending (human review)`);
  console.log(`  transparency     : ${p.transparency_score} -> ${t.score}/7`);
  if (!complete) { console.error('  REFUSE: would not satisfy the standard.'); process.exit(1); }
  if (!WRITE) { console.log('  DRY RUN, nothing written.'); return; }

  const { error: uErr } = await s.from('providers').update({
    decision_drivers: { ...dd, manage, prescriber_verification },
    safety_review_status: 'pending',
    transparency_score: t.score, transparency_checks: t.checks, transparency_scored_at: new Date().toISOString(),
  }).eq('id', p.id);
  console.log(uErr ? `  WRITE FAILED: ${uErr.message}` : '  WRITTEN (queued for badge review)');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
