/**
 * One-off backfill: record Signature Beauty Lounge's safety answers.
 *
 * WHY. Eva answered our three verification questions in full on 2026-05-28
 * ("All 3 questions are YES", one reply per location, in the info@thedripmap.com
 * thread). Those answers were never written to the database. Separately, on
 * 2026-08-23 an operator-delegated agent verified her prescriber against the
 * CPSO register and stored that under decision_drivers.prescriber_verification.
 * The badge gate isSafetyComplete() reads decision_drivers.manage.team.* — a
 * third location that was empty — so both listings read "incomplete" while we
 * held register-verified evidence that they qualify.
 *
 * WHAT THIS WRITES. Only decision_drivers.manage (merge-preserving) and
 * safety_review_status. Deliberately NOT the /finish form path: that route
 * recomposes description and clears special_offers, which would DEGRADE a
 * listing that already has content. Answer-only recording must never rewrite
 * a clinic's page.
 *
 * WHAT IT DOES NOT DO. It does not grant the badge. safety_review_status goes
 * to 'pending', so both locations surface in /admin/badge-reviews for a human
 * decision. isSafetyVerified() still requires status='approved'.
 *
 * EVERY FIELD IS EVIDENCE-BACKED (no inference beyond what is cited):
 *   whoPlaces ['RN']        <- our 2026-05-28 email states the RN-led practice
 *                              credentials, and Eva confirmed CNO registration.
 *   prescriber*             <- decision_drivers.prescriber_verification, read
 *                              from the CPSO register 2026-08-23 (ACTIVE).
 *   sourcing                <- Eva's YES to "licensed compounding pharmacy".
 *   liabilityInsurance      <- Eva's YES to "carry liability insurance".
 *
 * Run: npx tsx scripts/_backfill-signature-beauty-answers.ts          (dry run)
 *      npx tsx scripts/_backfill-signature-beauty-answers.ts --write  (writes)
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
import { isSafetyComplete } from '../src/lib/safety';

const WRITE = process.argv.includes('--write');
const SLUGS = ['signature-beauty-lounge-richmond-hill', 'signature-beauty-lounge-downtown-toronto'];

const PROVENANCE =
  'Recorded by operator from the owner\'s own email reply of 2026-05-28 '
  + '("All 3 questions are YES", one per location, thread in info@thedripmap.com). '
  + 'Prescriber fields carried from the CPSO register verification of 2026-08-23 '
  + '(decision_drivers.prescriber_verification), not self-declared.';

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  for (const slug of SLUGS) {
    const { data: p, error } = await s
      .from('providers')
      .select('id, slug, name, decision_drivers, safety_verified, safety_review_status')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !p) { console.error(`SKIP ${slug}: ${error?.message || 'not found'}`); continue; }

    const dd = (p.decision_drivers && typeof p.decision_drivers === 'object')
      ? (p.decision_drivers as Record<string, unknown>) : {};
    const pv = dd.prescriber_verification as
      { name?: string; reg_num?: string; credential?: string; verified?: boolean } | undefined;

    // Fail closed: never fabricate a prescriber. If the verified record is not
    // there, this clinic is not eligible for this backfill.
    if (!pv || pv.verified !== true || !pv.name || !pv.reg_num) {
      console.error(`SKIP ${slug}: no verified prescriber_verification on file.`);
      continue;
    }
    if (dd.manage && Object.keys(dd.manage as object).length > 0) {
      console.error(`SKIP ${slug}: decision_drivers.manage already present, refusing to overwrite.`);
      continue;
    }

    const manage = {
      team: {
        whoPlaces: ['RN'],
        prescriberName: pv.name,
        // The form's credential vocabulary (see FinishListingForm PRESCRIBER_CREDS).
        prescriberCredential: 'Physician (MD/DO)',
        prescriberRegNum: String(pv.reg_num),
        leadName: pv.name,
      },
      sourcing: ['Licensed compounding pharmacy'],
      liabilityInsurance: true,
      recordedVia: 'operator',
      recordedNote: PROVENANCE,
      recordedAt: new Date().toISOString(),
    };

    const complete = isSafetyComplete(manage);
    console.log(`\n=== ${p.name} (${slug}) ===`);
    console.log(`  prescriber        : ${pv.name} ${pv.credential} #${pv.reg_num} (register-verified)`);
    console.log(`  isSafetyComplete  : ${complete}`);
    console.log(`  status            : ${p.safety_review_status} -> pending (for human review)`);
    if (!complete) { console.error('  REFUSING: answers would still not satisfy the standard.'); continue; }

    if (!WRITE) { console.log('  DRY RUN, nothing written.'); continue; }

    const { error: uErr } = await s.from('providers').update({
      decision_drivers: { ...dd, manage },
      safety_review_status: 'pending',
    }).eq('id', p.id);
    console.log(uErr ? `  WRITE FAILED: ${uErr.message}` : '  WRITTEN (queued for badge review)');
  }
  console.log(WRITE ? '\nDone. Review both at /admin/badge-reviews.' : '\nDry run. Re-run with --write to apply.');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
