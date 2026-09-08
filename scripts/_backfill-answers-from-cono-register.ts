/**
 * Backfill safety answers for Ontario ND clinics from CONO register evidence.
 *
 * WHY. These clinics claimed their listing but never filled /finish and never
 * emailed answers (two independent Gmail searches, 2026-09-08). Yet on
 * 2026-08-14 an operator-delegated register pass read each one on the CONO
 * IVIT Premises Register and stored the result in decision_drivers.safety_evidence
 * and decision_drivers.premises — including the named ND prescriber and their
 * CONO registration number. That is stronger than a self-declared form answer
 * (badge-standard.md L2: register-checked beats self-declared), but the badge
 * gate isSafetyComplete() only reads decision_drivers.manage, which was empty.
 * Same plumbing bug as Signature Beauty, same fix.
 *
 * WHAT IT WRITES. decision_drivers.manage (merge-preserving) built ONLY from the
 * register-read fields below, decision_drivers.prescriber_verification in the
 * exact shape the operator panel writes, safety_review_status='pending', and the
 * recomputed transparency score. It never touches description, services,
 * price_range, offers or photos (the /finish route would, which is why this is
 * not routed through it).
 *
 * WHAT IT DOES NOT DO. Grant the badge. Every clinic lands in /admin/badge-reviews
 * for a human decision. sourcing is left EMPTY: the register says nothing about
 * it and we do not invent answers.
 *
 * Refuses to run for a clinic if: manage already exists, premises is not
 * 'authorized', or the register evidence text does not contain the registrant's
 * name and number exactly as configured (guards against config drift).
 *
 * Run: npx tsx scripts/_backfill-answers-from-cono-register.ts          (dry run)
 *      npx tsx scripts/_backfill-answers-from-cono-register.ts --write  (writes)
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
import { isSafetyComplete } from '../src/lib/safety';
import { computeTransparencyScore } from '../src/lib/transparency-score';

const WRITE = process.argv.includes('--write');

// Each entry is transcribed from decision_drivers.safety_evidence (the 2026-08-14
// CONO register read). The script verifies name + number appear verbatim in that
// stored evidence before writing anything.
const CLINICS: Array<{ slug: string; nd: string; regNum: string; premise: string; caveat?: string }> = [
  { slug: 'insight-naturopathic-clinic-toronto', nd: 'Dr. Leslie Jill Shainhouse', regNum: '1265', premise: '4181' },
  { slug: 'natures-touch-naturopathic-clinic-brampton', nd: 'Dr. Maria Melissa Papasodaro-Engineer', regNum: '1554', premise: '3860',
    caveat: 'Register header showed "Inspection status: Report under review" on 2026-08-14 (newer report in process); registration Active. Re-check at next quarterly pass.' },
  { slug: 'soma-and-soul-wellness-toronto', nd: 'Dr. Mary Lynn Eun Jung Choi', regNum: '1630', premise: '3836' },
];

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  for (const c of CLINICS) {
    const { data: p, error } = await s.from('providers').select('*').eq('slug', c.slug).maybeSingle();
    if (error || !p) { console.error(`SKIP ${c.slug}: ${error?.message || 'not found'}`); continue; }
    const dd = (p.decision_drivers && typeof p.decision_drivers === 'object') ? (p.decision_drivers as Record<string, unknown>) : {};
    const evidence = JSON.stringify(dd.safety_evidence || '');
    const premises = (dd.premises || {}) as { status?: string; checked_at?: string; url?: string };

    console.log(`\n=== ${p.name} (${c.slug}) ===`);
    if (dd.manage && Object.keys(dd.manage as object).length) { console.error('  REFUSE: manage already present.'); continue; }
    if (premises.status !== 'authorized') { console.error(`  REFUSE: premises.status=${premises.status}, not authorized.`); continue; }
    if (!evidence.includes(c.nd) || !evidence.includes(`#${c.regNum}`) || !evidence.includes(`#${c.premise}`)) {
      console.error('  REFUSE: configured registrant/number/premise not found verbatim in stored register evidence.'); continue;
    }

    const note =
      `Recorded by operator from the CONO IVIT Premises Register read of ${premises.checked_at || '2026-08-14'} `
      + `(decision_drivers.safety_evidence): Premise #${c.premise} Active, designated/premise registrant ${c.nd} ND #${c.regNum}. `
      + `Owner never filled /finish and never emailed answers (Gmail checked 2026-09-08); sourcing deliberately left blank.`
      + (c.caveat ? ` CAVEAT: ${c.caveat}` : '');

    const manage = {
      team: {
        whoPlaces: ['ND'],
        prescriberName: c.nd,
        prescriberCredential: 'CONO-authorized ND (IVIT)',
        prescriberRegNum: c.regNum,
        prescriberNdIvit: true,
        leadName: c.nd,
      },
      recordedVia: 'operator',
      recordedNote: note,
      recordedAt: new Date().toISOString(),
    };
    const prescriber_verification = {
      name: c.nd, reg_num: c.regNum, credential: 'ND', verified: true,
      verified_at: new Date().toISOString(), verified_by: 'operator_delegate_agent',
      register: 'CONO IVIT Premises Register', register_checked_at: premises.checked_at || '2026-08-14',
    };

    const complete = isSafetyComplete(manage);
    console.log(`  prescriber       : ${c.nd} ND #${c.regNum} | premise #${c.premise} ${premises.status}`);
    console.log(`  isSafetyComplete : ${complete}`);
    console.log(`  status           : ${p.safety_review_status} -> pending (human review)`);
    if (c.caveat) console.log(`  caveat           : ${c.caveat}`);
    if (!complete) { console.error('  REFUSE: would not satisfy the standard.'); continue; }

    const merged = { ...p, decision_drivers: { ...dd, manage, prescriber_verification } };
    const t = computeTransparencyScore(merged);
    console.log(`  transparency     : ${p.transparency_score} -> ${t.score}/7`);
    if (!WRITE) { console.log('  DRY RUN, nothing written.'); continue; }

    const { error: uErr } = await s.from('providers').update({
      decision_drivers: { ...dd, manage, prescriber_verification },
      safety_review_status: 'pending',
      transparency_score: t.score, transparency_checks: t.checks, transparency_scored_at: new Date().toISOString(),
    }).eq('id', p.id);
    console.log(uErr ? `  WRITE FAILED: ${uErr.message}` : '  WRITTEN (queued for badge review)');
  }
  console.log(WRITE ? '\nDone. Review at /admin/badge-reviews.' : '\nDry run. Re-run with --write to apply.');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
