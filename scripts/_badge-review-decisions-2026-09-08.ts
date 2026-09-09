/**
 * Badge review decisions of 2026-09-08, executed by the operator's delegate.
 *
 * The operator (Hubert) explicitly delegated these four Safety Verified badge
 * decisions ("i would rather you handle this for me"). Each APPROVE below
 * replicates /api/admin/badge-review-action `approve` EXACTLY: same two guards
 * (is_claimed, isSafetyComplete), same fields (safety_verified, status,
 * reviewed_at/by, review_reason cleared, safety_review_expires_at +365d). The
 * route sends no email and busts no cache on approve, so neither does this.
 * safety_reviewed_by records the delegation honestly, matching the precedent
 * already in the DB for prescriber_verification.verified_by.
 *
 * HOLD leaves status='pending' and writes safety_review_reason so anyone opening
 * /admin/badge-reviews sees why it is parked. It never touches safety_verified.
 *
 * Decisions and the evidence each rests on are in the DECISIONS table. Run with
 * no flag for a dry run; --write applies. Idempotent: re-running skips rows
 * already in the target state.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
import { isSafetyComplete } from '../src/lib/safety';

const WRITE = process.argv.includes('--write');
const REVIEWED_BY = 'operator_delegate_agent';

type Decision = { slug: string; action: 'approve' | 'hold'; basis: string };
const DECISIONS: Decision[] = [
  { slug: 'insight-naturopathic-clinic-toronto', action: 'approve',
    basis: 'CONO IVIT Premise #4181 Active, inspections Passed with no conditions (register read 2026-08-14); designated registrant Dr. Leslie Jill Shainhouse ND #1265 performs IVIT. Satisfies badge-standard §3 (CONO-authorized ND prescriber) and §4.5 (IVIT premises).' },
  { slug: 'soma-and-soul-wellness-toronto', action: 'approve',
    basis: 'CONO IVIT Premise #3836 Active, 5-year re-inspection final outcome Pass 2024-09-19 (register read 2026-08-14); designated registrant Dr. Mary Lynn Eun Jung Choi ND #1630. Satisfies §3 and §4.5.' },
  // Nature's Touch is decided after a FRESH CONO register read (its 2026-08-14 read
  // showed a newer inspection report "under review"); appended via NATURES_TOUCH env
  // once that read is in: NATURES_TOUCH=approve|hold.
  { slug: 'bar-beauty-medical-toronto', action: 'hold',
    basis: 'Prescriber Dr. John David Henneberry-Fudge, CPSO #95972, ACTIVE, no tribunal history (register read 2026-09-08), BUT the licence carries a practice condition limiting practice to areas in which he is educated and experienced, and his specialty is Psychiatry. Whether medical direction of IV therapy sits within that condition is unresolved. Fail closed: no badge until the clinic confirms the overseeing physician\'s IV-therapy competency or names a prescriber whose scope clearly covers it. The clinic never requested the badge, so holding costs them nothing.' },
];
const nt = (process.env.NATURES_TOUCH || '').toLowerCase();
if (nt === 'approve' || nt === 'hold') {
  DECISIONS.push({ slug: 'natures-touch-naturopathic-clinic-brampton', action: nt,
    basis: nt === 'approve'
      ? 'CONO IVIT Premise #3860 re-read on the register 2026-09-08 (see safety_evidence): Authorised/Active; the report that was "under review" on 2026-08-14 did not produce an adverse outcome. Designated registrant Dr. Maria Melissa Papasodaro-Engineer ND #1554. Satisfies §3 and §4.5.'
      : 'CONO IVIT Premise #3860 re-read on the register 2026-09-08: status not confirmed Authorised/Active (see safety_evidence). Fail closed until the register shows a clean current outcome.' });
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  for (const d of DECISIONS) {
    const { data: p, error } = await s.from('providers').select('*').eq('slug', d.slug).maybeSingle();
    if (error || !p) { console.error(`SKIP ${d.slug}: ${error?.message || 'not found'}`); continue; }
    const dd = (p.decision_drivers && typeof p.decision_drivers === 'object') ? (p.decision_drivers as Record<string, unknown>) : {};
    console.log(`\n=== ${d.action.toUpperCase()}  ${p.name} (${d.slug}) ===`);
    console.log(`  current: safety_verified=${p.safety_verified} status=${p.safety_review_status}`);

    if (d.action === 'approve') {
      if (p.is_claimed !== true) { console.error('  REFUSE: not claimed.'); continue; }
      if (!isSafetyComplete(dd.manage)) { console.error('  REFUSE: safety questionnaire incomplete.'); continue; }
      if (p.safety_verified === true && p.safety_review_status === 'approved') { console.log('  already approved, skipping.'); continue; }
      const nowIso = new Date().toISOString();
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      console.log(`  -> safety_verified=true, status=approved, reviewed_by=${REVIEWED_BY}, expires=${expires.slice(0,10)}`);
      console.log(`  basis: ${d.basis}`);
      if (!WRITE) { console.log('  DRY RUN.'); continue; }
      const { error: uErr, count } = await s.from('providers').update({
        safety_verified: true, safety_review_status: 'approved', safety_reviewed_at: nowIso,
        safety_reviewed_by: REVIEWED_BY, safety_review_reason: null,
        decision_drivers: { ...dd, safety_review_expires_at: expires,
          safety_evidence: [ ...(Array.isArray(dd.safety_evidence) ? dd.safety_evidence as unknown[] : []),
            `Badge APPROVED ${nowIso.slice(0,10)} by ${REVIEWED_BY} (operator-delegated). Basis: ${d.basis}` ] },
      }, { count: 'exact' }).eq('id', p.id);
      console.log(uErr ? `  WRITE FAILED: ${uErr.message}` : `  APPROVED (${count} row)`);
    } else {
      if (p.safety_review_status !== 'pending') { console.log(`  status is ${p.safety_review_status}, leaving as is.`); continue; }
      console.log(`  -> stays pending; safety_review_reason written. basis: ${d.basis}`);
      if (!WRITE) { console.log('  DRY RUN.'); continue; }
      const { error: uErr } = await s.from('providers').update({
        safety_review_reason: `HOLD ${new Date().toISOString().slice(0,10)} by ${REVIEWED_BY}: ${d.basis}`,
      }).eq('id', p.id);
      console.log(uErr ? `  WRITE FAILED: ${uErr.message}` : '  HELD (pending, reason recorded)');
    }
  }
  console.log(WRITE ? '\nDone.' : '\nDry run. Re-run with --write to apply.');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
