/**
 * Operator-side driver for POST /api/admin/warm-outreach (step 5, give first).
 * Same shape as scripts/_finish-nudge.ts; authenticates with ACTIVATION_RUN_TOKEN.
 *
 *   npx tsx scripts/_warm-outreach.ts --base https://www.thedripmap.com --preview [--third-touch] [--only a,b]
 *   npx tsx scripts/_warm-outreach.ts --base ... --test [--slug x]
 *   npx tsx scripts/_warm-outreach.ts --base ... --send [--third-touch] [--only a,b] [--limit N]
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const val = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const BASE = (val('base') || '').replace(/\/$/, '');
const TOKEN = (process.env.ACTIVATION_RUN_TOKEN || '').trim();
if (!BASE || !TOKEN) { console.error('Need --base <deployment url> and ACTIVATION_RUN_TOKEN in .env.local'); process.exit(1); }

async function call(body: Record<string, unknown>) {
  const r = await fetch(`${BASE}/api/admin/warm-outreach`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(body) });
  const text = await r.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: r.status, json, text };
}

async function main() {
  const only = val('only') ? String(val('only')).split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  const allow_third_touch = flag('third-touch');
  if (flag('test')) { const r = await call({ mode: 'test', slug: val('slug') }); console.log(r.status, JSON.stringify(r.json ?? r.text.slice(0, 300))); return; }
  if (flag('send')) { const r = await call({ mode: 'send', confirm: 'SEND', only, allow_third_touch, limit: Number(val('limit')) || undefined }); console.log(r.status, JSON.stringify(r.json ?? r.text.slice(0, 300), null, 1)); return; }
  const r = await call({ mode: 'preview', only, allow_third_touch });
  if (r.status !== 200 || !r.json) { console.error(r.status, r.text.slice(0, 500)); process.exit(1); }
  const data = r.json as { counts: Record<string, number>; candidates: Array<{ slug: string; name: string; to: string; views90d: number; gscImpressions: number | null; priorTouches: number; found: Record<string, unknown>; subject: string; text: string }> };
  const date = new Date().toISOString().slice(0, 10);
  const out = path.join('scripts', `_warm-outreach-preview-${date}.md`);
  const lines = [`# Warm outreach preview, ${date}`, '', `Counts: ${JSON.stringify(data.counts)}`, ''];
  for (const c of data.candidates) lines.push(`## ${c.name}  (${c.slug})`, `To: ${c.to}  |  views90d ${c.views90d}  |  gsc ${c.gscImpressions ?? '-'}  |  prior touches ${c.priorTouches}  |  found ${JSON.stringify(c.found)}`, `Subject: ${c.subject}`, '', c.text, '', '---', '');
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`Counts: ${JSON.stringify(data.counts)}\n${data.candidates.length} eligible. Preview: ${out}`);
  for (const c of data.candidates) console.log(`- ${c.slug}: views ${c.views90d}, gsc ${c.gscImpressions ?? '-'}, touches ${c.priorTouches}, found ${JSON.stringify(c.found)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
