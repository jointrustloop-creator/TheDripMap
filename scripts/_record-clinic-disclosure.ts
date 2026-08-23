/**
 * Record a disclosure a clinic made to us directly (email reply, phone call),
 * as distinct from a /finish submission or an operator register check.
 *
 * WHY A SEPARATE PATH: clinics answer our questions in the reply body far more
 * often than they log in and fill the form. Those answers are still the
 * clinic's own attributable statement, so they legitimately earn the
 * disclosure checks, but they must be recorded with the source and date so we
 * can always show where a fact came from. Nothing here can set
 * prescriber_verification, which stays operator-only (see transparency-score.ts).
 *
 * Writes decision_drivers.manage.team.whoPlaces and/or .firstVisit.consult,
 * appends a dated provenance line to decision_drivers.disclosures, then
 * recomputes the stored Transparency Score from the FULL row.
 *
 * Run: npx tsx scripts/_record-clinic-disclosure.ts <slug> '<json>'
 *   json: { whoPlaces?: string[], consult?: string, source: string }
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
import { computeTransparencyScore } from '../src/lib/transparency-score';

const [slug, payloadRaw] = process.argv.slice(2);
if (!slug || !payloadRaw) {
  console.error("usage: tsx scripts/_record-clinic-disclosure.ts <slug> '<json>'");
  process.exit(1);
}
const payload = JSON.parse(payloadRaw) as {
  whoPlaces?: string[];
  consult?: string;
  source: string;
};
if (!payload.source) { console.error('payload.source is required (who told us, and when)'); process.exit(1); }

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  const { data: p, error } = await s.from('providers').select('*').eq('slug', slug).single();
  if (error || !p) { console.error('FETCH FAIL', slug, error?.message); process.exit(1); }

  const dd = (p.decision_drivers && typeof p.decision_drivers === 'object'
    ? p.decision_drivers : {}) as Record<string, any>;
  const manage = (dd.manage && typeof dd.manage === 'object' ? dd.manage : {}) as Record<string, any>;
  const team = (manage.team && typeof manage.team === 'object' ? manage.team : {}) as Record<string, any>;
  const firstVisit = (manage.firstVisit && typeof manage.firstVisit === 'object'
    ? manage.firstVisit : {}) as Record<string, any>;

  const before = computeTransparencyScore(p as Record<string, unknown>);
  const nowIso = new Date().toISOString();

  const nextManage = {
    ...manage,
    team: payload.whoPlaces ? { ...team, whoPlaces: payload.whoPlaces } : team,
    firstVisit: payload.consult ? { ...firstVisit, consult: payload.consult } : firstVisit,
  };
  const prior = Array.isArray(dd.disclosures) ? dd.disclosures : [];
  const nextDD = {
    ...dd,
    manage: nextManage,
    disclosures: [
      ...prior,
      {
        at: nowIso,
        source: payload.source,
        recorded: {
          ...(payload.whoPlaces ? { whoPlaces: payload.whoPlaces } : {}),
          ...(payload.consult ? { consult: payload.consult } : {}),
        },
      },
    ],
  };

  const t = computeTransparencyScore({ ...(p as Record<string, unknown>), decision_drivers: nextDD });
  const { error: ue, count } = await s
    .from('providers')
    .update(
      { decision_drivers: nextDD, transparency_score: t.score, transparency_checks: t.checks, transparency_scored_at: nowIso },
      { count: 'exact' },
    )
    .eq('id', p.id);
  if (ue) { console.error('UPDATE FAIL', ue.message); process.exit(1); }
  if (count !== null && count !== 1) { console.error('SCOPE FAIL', count); process.exit(1); }

  console.log(`${slug}: ${before.score}/7 -> ${t.score}/7`);
  console.log('still unmet:', t.unmetLabels.join(' | ') || 'none');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
