/**
 * Record an operator-delegated prescriber verification. Mirrors the
 * record_prescriber admin action exactly: full-row read, merge into
 * decision_drivers, recompute the stored Transparency Score from the full row
 * (same computeTransparencyScore the app uses), single-row scoped update.
 *
 * Authority: operator takeover mandate 2026-08-23 ("admin badge reviews...
 * you handle this, whatever it takes"). The register is read by a real
 * browser session; the evidence string records exactly what the register
 * showed and when.
 *
 * Run: npx tsx scripts/_record-prescriber.ts <slug> <name> <credential> <regNum> "<evidence>"
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
import { computeTransparencyScore } from '../src/lib/transparency-score';

const [slug, name, credential, regNum, evidence] = process.argv.slice(2);
if (!slug || !name || !credential || !regNum || !evidence) {
  console.error('usage: tsx scripts/_record-prescriber.ts <slug> <name> <credential> <regNum> "<evidence>"');
  process.exit(1);
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  const { data: p, error } = await s.from('providers').select('*').eq('slug', slug).single();
  if (error || !p) { console.error('FETCH FAIL', slug, error?.message); process.exit(1); }
  const dd = (p.decision_drivers && typeof p.decision_drivers === 'object') ? (p.decision_drivers as Record<string, unknown>) : {};
  const prevEv = Array.isArray(dd.safety_evidence) ? (dd.safety_evidence as unknown[]) : dd.safety_evidence ? [dd.safety_evidence] : [];
  const nowIso = new Date().toISOString();
  const nextDD = {
    ...dd,
    prescriber_verification: { name, credential, reg_num: regNum, verified: true, verified_at: nowIso, verified_by: 'operator_delegate_agent' },
    safety_evidence: [...prevEv, `Prescriber VERIFIED ${nowIso.slice(0, 10)} (register read via browser, operator-delegated): ${evidence}`],
  };
  const t = computeTransparencyScore({ ...(p as Record<string, unknown>), decision_drivers: nextDD });
  const { error: ue, count } = await s
    .from('providers')
    .update({ decision_drivers: nextDD, transparency_score: t.score, transparency_checks: t.checks, transparency_scored_at: nowIso }, { count: 'exact' })
    .eq('id', p.id);
  if (ue) { console.error('UPDATE FAIL', ue.message); process.exit(1); }
  if (count !== null && count !== 1) { console.error('SCOPE FAIL', count); process.exit(1); }
  console.log(`${slug}: VERIFIED ${name} (${credential}) #${regNum} -> transparency ${t.score}/7`);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
