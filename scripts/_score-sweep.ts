/**
 * Score sweep (2026-09-18, Hubert: "go through our providers especially in
 * Canada and make sure their score is correct, make a list of who else to
 * reach out to").
 *
 * Read-only unless --fix. For every active Canadian provider: recompute the
 * Transparency Score from the full row and compare with the stored value.
 * For every claimed one: list the unmet checks, whether a prescriber name and
 * number were supplied but never register-checked (an operator step), and the
 * contact state (touches, suppression, last reply). Writes
 * .audit-tmp/score-sweep-<date>.md and prints the headline numbers.
 *
 *   npx tsx scripts/_score-sweep.ts          report
 *   npx tsx scripts/_score-sweep.ts --fix    also rewrite stale stored scores
 */
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
import { computeTransparencyScore } from '../src/lib/transparency-score';

const FIX = process.argv.includes('--fix');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const day = new Date().toISOString().slice(0, 10);

(async () => {
  const rows: Record<string, any>[] = [];
  for (let off = 0; ; off += 1000) {
    const { data, error } = await s.from('providers').select('*').eq('country', 'Canada').eq('is_hidden', false).order('id').range(off, off + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const { data: sup1 } = await s.from('email_suppressions').select('email');
  const { data: sup2 } = await s.from('outreach_suppressions').select('email');
  const suppressed = new Set([...(sup1 || []), ...(sup2 || [])].map((r: any) => String(r.email || '').toLowerCase()));

  let stale = 0, fixed = 0;
  const staleLines: string[] = [];
  const claimedLines: string[] = [];
  const registerQueue: string[] = [];
  const outreach: { bucket: string; line: string }[] = [];

  for (const p of rows) {
    const t = computeTransparencyScore(p);
    if (t.score !== p.transparency_score) {
      stale++;
      staleLines.push(`- ${p.slug}: stored ${p.transparency_score ?? 'null'} -> computed ${t.score}${p.is_claimed ? ' (claimed)' : ''}`);
      if (FIX) {
        const { error } = await s.from('providers').update({ transparency_score: t.score, transparency_checks: t.checks, transparency_scored_at: new Date().toISOString() }).eq('id', p.id);
        if (!error) fixed++;
      }
    }
    const dd = (p.decision_drivers || {}) as Record<string, any>;
    const team = dd.manage?.team || {};
    const pv = dd.prescriber_verification;
    const hasNameNum = !!(team.prescriberName && team.prescriberRegNum);
    const email = String(p.email || '').toLowerCase();
    const isSup = email && suppressed.has(email);
    const touches = ['outreach_sent', 'followup_sent'].filter((k) => p[k]).length + ['warm_outreach', 'register_touch', 'personal_note', 'finish_nudge'].filter((k) => dd[k]).length;

    if (p.is_claimed) {
      const unmet = t.unmetLabels;
      claimedLines.push(`| ${p.name} (${p.city}) | ${t.score}/7 | ${unmet.join('; ') || 'none'} | ${pv?.verified ? 'verified' : hasNameNum ? `NOT CHECKED: ${team.prescriberName} #${team.prescriberRegNum}` : 'no name/number'} | ${p.safety_review_status || ''}${p.safety_verified ? ' (badge)' : ''} | ${isSup ? 'SUPPRESSED' : p.reply_category || ''} |`);
      if (hasNameNum && !pv?.verified) registerQueue.push(`- ${p.slug}: ${team.prescriberName}, ${team.prescriberCredential || ''} #${team.prescriberRegNum} (${p.state})`);
      const ownerAsk = unmet.filter((u) => !/regulator/.test(u));
      if (ownerAsk.length && !isSup) outreach.push({ bucket: 'A. Claimed, missing owner-answerable facts', line: `- ${p.name} (${p.city}): ${ownerAsk.join('; ')} | last reply: ${p.reply_category || 'none'} | touches ${touches}` });
    } else if (!isSup && email && !p.email_bounced) {
      const views = typeof dd.views_90d === 'number' ? dd.views_90d : null;
      if (dd.cono_premise || dd.discovery_source === 'cono_ivit_register') outreach.push({ bucket: 'B. Unclaimed, on a regulator register (warm first touch)', line: `- ${p.name} (${p.city}) touches ${touches}${dd.register_touch ? ' register_touch sent' : ''}` });
      else if (touches === 0) outreach.push({ bucket: 'C. Unclaimed, never contacted, has email', line: `- ${p.name} (${p.city}, ${p.state})${views ? ` views90d ${views}` : ''}` });
      else if (touches === 1) outreach.push({ bucket: 'D. Unclaimed, one touch so far (second touch allowed)', line: `- ${p.name} (${p.city}) reply: ${p.reply_category || 'none'}` });
    }
  }

  const buckets = new Map<string, string[]>();
  for (const o of outreach) { if (!buckets.has(o.bucket)) buckets.set(o.bucket, []); buckets.get(o.bucket)!.push(o.line); }

  const out: string[] = [];
  out.push(`# Score sweep, Canada, ${day}`, '', `Active Canadian providers: ${rows.length}. Claimed: ${rows.filter((r) => r.is_claimed).length}.`, `Stored score differs from computed: ${stale}${FIX ? ` (rewritten ${fixed})` : ''}.`, '');
  out.push('## Claimed clinics', '', '| Clinic | Score | Unmet | Prescriber | Badge status | Reply/suppression |', '|---|---|---|---|---|---|', ...claimedLines, '');
  out.push(`## Register checks waiting on us (${registerQueue.length})`, '', ...registerQueue, '');
  out.push(`## Stale stored scores (${stale})`, '', ...staleLines.slice(0, 80), stale > 80 ? `... and ${stale - 80} more` : '', '');
  out.push('## Outreach candidates', '');
  for (const [b, lines] of buckets) out.push(`### ${b} (${lines.length})`, '', ...lines.slice(0, 60), lines.length > 60 ? `... and ${lines.length - 60} more` : '', '');
  fs.mkdirSync('.audit-tmp', { recursive: true });
  fs.writeFileSync(`.audit-tmp/score-sweep-${day}.md`, out.join('\n'));
  console.log(out.slice(0, 4).join('\n'));
  console.log(`register queue ${registerQueue.length}; outreach buckets: ${[...buckets].map(([b, l]) => `${b.slice(0, 1)}=${l.length}`).join(', ')}`);
  console.log(`written .audit-tmp/score-sweep-${day}.md`);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
