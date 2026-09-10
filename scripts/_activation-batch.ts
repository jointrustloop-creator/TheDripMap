/**
 * Activation Engine batch runner (operator-side, REMOTE).
 *
 * Drives POST /api/admin/activation-run on a deployed environment, because
 * extraction needs ANTHROPIC_API_KEY, which only exists on Vercel. Auth is the
 * machine token ACTIVATION_RUN_TOKEN (local .env.local + Vercel env), never
 * the admin password.
 *
 * Default is a DRY RUN: the deployed engine reads each site and extracts, but
 * writes NOTHING; this script turns the results into a Markdown preview the
 * operator reviews first. --write applies (auto-fill empty phone/booking/hours
 * with provenance, stage treatments/prices/practitioners for owner review).
 *
 * Sequential with a polite delay (Windows + Node v24 kills concurrent HTTPS
 * workers silently); the preview is rewritten after EVERY clinic so a death
 * mid-run leaves a usable file.
 *
 * Usage:
 *   npx tsx scripts/_activation-batch.ts --base https://<deployment>            dry run, all incomplete
 *   npx tsx scripts/_activation-batch.ts --base https://... --limit 3
 *   npx tsx scripts/_activation-batch.ts --base https://... --only slug-a,slug-b
 *   npx tsx scripts/_activation-batch.ts --base https://... --write             apply (after review)
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { assessCompleteness, type CompletenessRow } from '../src/lib/display-complete';
import type { ExtractedFacts } from '../src/lib/activation-engine';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined; };
const WRITE = process.argv.includes('--write');
const BASE = (arg('--base') || process.env.ACTIVATION_BASE_URL || '').replace(/\/$/, '');
const LIMIT = arg('--limit') ? Number(arg('--limit')) : Infinity;
const ONLY = arg('--only') ? new Set(arg('--only')!.split(',').map((x) => x.trim())) : null;
const TOKEN = process.env.ACTIVATION_RUN_TOKEN || '';
// --unclaimed: warm-outreach mode (step 5). Targets the UNCLAIMED slugs given
// with --only (required), so their profile is built before we write to them.
const UNCLAIMED = process.argv.includes('--unclaimed');
const DELAY_MS = 1500;
const OUT = path.join(process.cwd(), 'scripts', `_activation-preview-${new Date().toISOString().slice(0, 10)}${UNCLAIMED ? '-unclaimed' : ''}${WRITE ? '-WRITE' : ''}.md`);

type RemoteResult = {
  ok: boolean; sourceUrl: string | null; pagesRead: string[]; autoApplied: string[];
  staged: { treatments: number; practitioners: number }; errors: string[];
  facts?: ExtractedFacts; wouldApply?: Record<string, unknown>;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  if (!BASE || !TOKEN) { console.error('Need --base <deployment url> and ACTIVATION_RUN_TOKEN in .env.local'); process.exit(1); }
  if (UNCLAIMED && !ONLY) { console.error('--unclaimed needs --only <slugs>: warm outreach is a chosen list, never every unclaimed clinic'); process.exit(1); }
  const { data } = await s.from('providers').select('*').eq('country', 'Canada').eq('is_claimed', !UNCLAIMED).eq('is_hidden', false).order('name');
  const rows = (data || []) as Array<Record<string, unknown> & { id: string; slug: string; name: string; website?: string | null }>;
  const { data: profs } = await s.from('operator_profiles').select('clinic_id, owner_name, profile_data').in('clinic_id', rows.map((r) => r.id));
  const profBy = new Map((profs || []).map((p) => [p.clinic_id as string, p]));
  let targets = UNCLAIMED ? rows : rows.filter((r) => !assessCompleteness({ ...(r as unknown as CompletenessRow), operator_profile: profBy.get(r.id) || null }).complete);
  if (ONLY) targets = targets.filter((r) => ONLY.has(r.slug));
  targets = targets.slice(0, LIMIT);

  const lines: string[] = [
    `# Activation ${WRITE ? 'RUN (written)' : 'PREVIEW (dry run, nothing written)'} — ${new Date().toISOString().slice(0, 16)}Z — ${BASE}`,
    '',
    `${targets.length} ${UNCLAIMED ? 'UNCLAIMED (warm outreach)' : 'incomplete claimed'} Canadian clinic(s). Auto-apply only fills EMPTY phone / booking link / hours; treatments, prices and practitioners are staged for the OWNER to confirm. Safety answers are never touched.`,
    '',
  ];
  const flush = () => fs.writeFileSync(OUT, lines.join('\n'));
  flush();

  for (const [i, r] of targets.entries()) {
    process.stdout.write(`[${i + 1}/${targets.length}] ${r.slug} ... `);
    let res: RemoteResult | null = null;
    try {
      const resp = await fetch(`${BASE}/api/admin/activation-run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: r.id, dry_run: !WRITE, ...(UNCLAIMED ? { allow_unclaimed: true } : {}) }),
        signal: AbortSignal.timeout(150_000),
      });
      const j = await resp.json().catch(() => null);
      if (!resp.ok || !j) {
        const why = j?.error || (Array.isArray(j?.errors) ? j.errors.join('; ') : '') || 'no body';
        lines.push(`## ${r.name}  (${r.slug})`, `**HTTP ${resp.status}:** ${why}`, ''); console.log(`HTTP ${resp.status}: ${why}`); flush(); await sleep(DELAY_MS); continue;
      }
      res = j as RemoteResult;
    } catch (e) {
      lines.push(`## ${r.name}  (${r.slug})`, `**request failed:** ${e instanceof Error ? e.message : String(e)}`, ''); console.log('failed'); flush(); await sleep(DELAY_MS); continue;
    }
    console.log(res.ok ? `ok, ${res.pagesRead.length} pages, ${res.staged.treatments} treatments` : `FAILED ${res.errors.join('; ')}`);
    lines.push(`## ${r.name}  (${r.slug})`, `Site: ${res.sourceUrl || r.website || '-'}  |  pages read: ${res.pagesRead.length}`);
    if (!res.ok) { lines.push(`**FAILED:** ${res.errors.join('; ')}`, ''); flush(); await sleep(DELAY_MS); continue; }
    const f = res.facts;
    const applied = WRITE ? res.autoApplied : Object.keys(res.wouldApply || {});
    lines.push(`${WRITE ? 'Auto-applied' : 'Would auto-apply'} (empty fields only): ${applied.length ? applied.join(', ') : 'nothing'}`);
    if (f) {
      if (Object.keys(f.hours).length) lines.push(`Hours read (${Object.keys(f.hours).length} days): ${Object.entries(f.hours).map(([d, h]) => `${d} ${h}`).join('; ')}`);
      if (f.phone) lines.push(`Phone: ${f.phone}`);
      if (f.booking_url) lines.push(`Booking: ${f.booking_url}`);
      if (f.mobile_service !== null) lines.push(`Mobile service: ${f.mobile_service}`);
      lines.push('', `**Treatments found (${f.treatments.length}) — staged for owner confirmation:**`);
      if (!f.treatments.length) lines.push('_none with evidence_');
      for (const t of f.treatments) lines.push(`- ${t.raw}${t.canonical ? ` → ${t.canonical}` : ' → (no canonical match)'}${t.price ? `  **${t.price}**` : '  (no price)'}${t.duration ? `  ${t.duration}` : ''}  \n  evidence: "${t.evidence}"`);
      lines.push('', `**Practitioners found (${f.practitioners.length}) — staged, never auto-applied:**`);
      if (!f.practitioners.length) lines.push('_none_');
      for (const p of f.practitioners) lines.push(`- ${p.name}${p.credential ? `, ${p.credential}` : ''}${p.role ? ` (${p.role})` : ''}  \n  evidence: "${p.evidence}"`);
      if (f.notes.length) lines.push('', `Reviewer notes: ${f.notes.join(' | ')}`);
    }
    lines.push('');
    flush();
    await sleep(DELAY_MS);
  }
  console.log(`\n${WRITE ? 'Applied.' : 'Dry run complete.'} Preview: ${OUT}`);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
