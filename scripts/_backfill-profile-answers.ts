/**
 * 2026-09-20: grandfathered claims answered the OLD questionnaire
 * (operator_profiles.profile_data.administerType etc.). The Transparency Score
 * reads decision_drivers.manage only, so those clinics scored low for facts
 * they had given us (Blue Cypress showed 4/7). Copy administerType into
 * manage.team.whoPlaces with provenance when whoPlaces is empty. Read-only
 * unless --write.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
import { computeTransparencyScore } from '../src/lib/transparency-score';
const WRITE = process.argv.includes('--write');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const mapWho = (t: string): string[] => {
  const out: string[] = [];
  if (/nurse practitioner|\bNP\b/i.test(t)) out.push('NP');
  if (/registered nurse|\bRN\b/i.test(t)) out.push('RN');
  if (/\bMD\b|physician|doctor \(MD/i.test(t)) out.push('MD / DO');
  if (/naturopath|\bND\b/i.test(t)) out.push('ND');
  if (/paramedic|LPN|RPN|practical nurse/i.test(t)) out.push('LPN / RPN');
  return out;
};
(async () => {
  const { data: profs } = await s.from('operator_profiles').select('clinic_id, profile_data');
  const byId = new Map((profs || []).map((p: any) => [p.clinic_id, p.profile_data || {}]));
  const { data: rows } = await s.from('providers').select('*').eq('is_claimed', true).eq('is_hidden', false);
  for (const p of rows || []) {
    const pd = byId.get(p.id) as Record<string, any> | undefined; if (!pd) continue;
    const dd = (p.decision_drivers || {}) as Record<string, any>; const manage = dd.manage || {}; const team = manage.team || {};
    const has = Array.isArray(team.whoPlaces) && team.whoPlaces.length;
    const who = typeof pd.administerType === 'string' ? mapWho(pd.administerType) : [];
    if (has || !who.length) continue;
    const before = computeTransparencyScore(p).score;
    const nextDD = { ...dd, manage: { ...manage, team: { ...team, whoPlaces: who } }, disclosures: [...(dd.disclosures || []), { at: new Date().toISOString(), source: `owner questionnaire (operator_profiles.administerType = "${pd.administerType}", answered at claim)`, recorded: { whoPlaces: who } }] };
    const t = computeTransparencyScore({ ...p, decision_drivers: nextDD });
    console.log(`${p.slug}: administerType "${pd.administerType}" -> whoPlaces ${JSON.stringify(who)}; ${before}/7 -> ${t.score}/7${WRITE ? '' : ' (dry)'}`);
    if (WRITE) { const r = await s.from('providers').update({ decision_drivers: nextDD, transparency_score: t.score, transparency_checks: t.checks, transparency_scored_at: new Date().toISOString() }).eq('id', p.id); if (r.error) console.log('  ERR', r.error.message); }
  }
})();
