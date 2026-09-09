/**
 * Operator-side driver for POST /api/admin/finish-nudge (owner "finish your
 * listing" nudge). Runs against a deployment because the mail keys only exist
 * on Vercel; authenticates with ACTIVATION_RUN_TOKEN from .env.local.
 *
 *   npx tsx scripts/_finish-nudge.ts --base https://www.thedripmap.com --preview [--only a,b]
 *     -> writes scripts/_finish-nudge-preview-<date>.md (untracked; never commit)
 *   npx tsx scripts/_finish-nudge.ts --base ... --test [--slug drs-mobile-therapy-brampton]
 *     -> ONE [TEST] copy to info@ + operator cc
 *   npx tsx scripts/_finish-nudge.ts --base ... --send [--only a,b] [--limit N]
 *     -> the real send (asks the route for confirm: 'SEND')
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
  const r = await fetch(`${BASE}/api/admin/finish-nudge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* non-JSON error page */ }
  return { status: r.status, json, text };
}

async function main() {
  const only = val('only') ? String(val('only')).split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  if (flag('test')) {
    const r = await call({ mode: 'test', slug: val('slug') });
    console.log(r.status, JSON.stringify(r.json ?? r.text.slice(0, 300)));
    return;
  }
  if (flag('send')) {
    const r = await call({ mode: 'send', confirm: 'SEND', only, limit: Number(val('limit')) || undefined });
    console.log(r.status, JSON.stringify(r.json ?? r.text.slice(0, 300), null, 1));
    return;
  }
  const r = await call({ mode: 'preview', only });
  if (r.status !== 200 || !r.json) { console.error(r.status, r.text.slice(0, 500)); process.exit(1); }
  const data = r.json as { counts: Record<string, number>; candidates: Array<{ slug: string; name: string; to: string; ownerName: string | null; strength: number; stagedCount: number; subject: string; text: string }> };
  const date = new Date().toISOString().slice(0, 10);
  const out = path.join('scripts', `_finish-nudge-preview-${date}.md`);
  const lines: string[] = [`# Finish-your-listing nudge preview, ${date}`, '', `Counts: ${JSON.stringify(data.counts)}`, ''];
  for (const c of data.candidates) {
    lines.push(`## ${c.name}  (${c.slug})`, `To: ${c.to}  |  owner: ${c.ownerName || '(team)'}  |  strength ${c.strength}  |  staged ${c.stagedCount}`, `Subject: ${c.subject}`, '', c.text, '', '---', '');
  }
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`${data.candidates.length} eligible. Preview: ${out}`);
  for (const c of data.candidates) console.log(`- ${c.slug}: strength ${c.strength}, staged ${c.stagedCount}, owner ${c.ownerName || '(team)'}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
