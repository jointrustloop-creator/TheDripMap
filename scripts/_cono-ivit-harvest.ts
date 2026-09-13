/**
 * September Sprint move 1: harvest the CONO IVIT Premises Register (every
 * Ontario location registered for IV infusion therapy) and diff it against
 * providers. Writes scratch JSON + a report; --insert adds the missing ACTIVE
 * (authorized) premises as curated Canadian listings.
 *
 *   npx tsx scripts/_cono-ivit-harvest.ts            enumerate + diff (report only)
 *   npx tsx scripts/_cono-ivit-harvest.ts --insert   also insert missing active premises
 *
 * Enumeration: the register's JSON search caps at 25 rows per query, so we
 * walk Ontario postal-code prefixes (K, L, M, N, P + digit) and recurse one
 * more character whenever a prefix returns the cap. Sequential, 500 ms apart.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import { createClient } from '@supabase/supabase-js';

const INSERT = process.argv.includes('--insert');
const BASE = 'https://cono.alinityapp.com';
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; TheDripMapBot/1.0; +https://www.thedripmap.com)', 'x-requested-with': 'XMLHttpRequest' };
const OUT_DIR = path.join(process.env.TEMP || '.', 'cono-ivit');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Rec { rg: string; ci: string; cto: string; on: string; cn: string; cr: string; crs: string }
let cookie = '';

async function search(E: string): Promise<Rec[]> {
  const params = { Parameter: [['TextOptionD', ''], ['TextOptionC', ''], ['DefaultProvinceCitySID', ''], ['TextOptionA', ''], ['TextOptionE', E], ['TextOptionB', '']].map(([ID, Value]) => ({ ID, Value, ValueLabel: '[not entered]' })) };
  const body = 'queryParameters=' + encodeURIComponent(JSON.stringify(params)) + '&querySID=1000480';
  const r = await fetch(`${BASE}/client/FindCorporationDirectory/Corporations`, { method: 'POST', headers: { ...UA, cookie, 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body });
  const j = await r.json().catch(() => null);
  return (j?.Records || []) as Rec[];
}

async function enumerate(): Promise<Map<string, Rec>> {
  const found = new Map<string, Rec>();
  const queue: string[] = [];
  for (const L of ['K', 'L', 'M', 'N', 'P']) for (let d = 0; d <= 9; d++) queue.push(`${L}${d}`);
  let calls = 0;
  while (queue.length) {
    const p = queue.shift()!;
    const recs = await search(p); calls++;
    for (const r of recs) found.set(r.rg, r);
    process.stdout.write(`${p}:${recs.length} `);
    if (recs.length >= 25 && p.length < 3) for (const c of 'ABCDEFGHJKLMNPRSTVWXYZ') queue.push(p + c);
    await sleep(500);
  }
  console.log(`\n${calls} queries, ${found.size} distinct premises`);
  return found;
}

const norm = (s: string) => s.toLowerCase().replace(/\s*-\s*\d{3,5}\s*$/, '').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\b(the|inc|ltd|clinic|clinics|centre|center|naturopathic|naturopath|health|and|wellness|medical|integrative|natural|medicine|therapy)\b/g, ' ').replace(/\s+/g, ' ').trim();

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const pre = await fetch(`${BASE}/client/findcorporationdirectory`, { headers: UA });
  cookie = (pre.headers.get('set-cookie') || '').split(/,(?=[^ ])/).map((c) => c.split(';')[0]).join('; ');
  const all = await enumerate();
  const recs = [...all.values()];
  fs.writeFileSync(path.join(OUT_DIR, 'premises.json'), JSON.stringify(recs, null, 1));
  const active = recs.filter((r) => r.crs === 'Active');
  console.log(`active (authorized) ${active.length} | inactive ${recs.length - active.length}`);

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const P: Array<{ id: string; name: string; city: string; slug: string }> = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from('providers').select('id,name,city,slug').eq('country', 'Canada').range(f, f + 999); if (!data?.length) break; P.push(...(data as typeof P)); if (data.length < 1000) break; }
  const keys = P.map((p) => ({ p, k: norm(p.name) })).filter((x) => x.k.length > 2);
  const matched: string[] = []; const missing: Rec[] = [];
  for (const r of active) {
    const k = norm(r.on);
    const hit = k.length > 2 ? keys.find((x) => x.k === k || x.k.includes(k) || k.includes(x.k)) : undefined;
    if (hit) matched.push(`${r.on} = ${hit.p.slug}`); else missing.push(r);
  }
  const byCity: Record<string, number> = {}; for (const r of missing) byCity[r.cn] = (byCity[r.cn] || 0) + 1;
  const report = [`# CONO IVIT register harvest ${new Date().toISOString().slice(0, 16)}Z`, '', `premises ${recs.length}, active ${active.length}, already listed ${matched.length}, MISSING ${missing.length}`, '', 'Missing by city: ' + Object.entries(byCity).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(', '), '', '## Missing active premises', ...missing.map((r) => `- ${r.on} | ${r.cn} | ${r.rg}`), '', '## Matched', ...matched.map((m) => `- ${m}`)];
  fs.writeFileSync(path.join(OUT_DIR, 'report.md'), report.join('\n'));
  console.log(`already listed ${matched.length} | MISSING active ${missing.length} | report ${path.join(OUT_DIR, 'report.md')}`);
  // Detail pages: the data is embedded as a JSON literal passed to the page's
  // template renderer (fwkParseStringTemplate). Pull email, phone, address and
  // the registrants performing IVIT for every missing active premise.
  const details: Array<Rec & { email: string | null; phone: string | null; address: string | null; postal: string | null; registrants: string[]; inspection: string | null }> = [];
  for (const [i, r] of missing.entries()) {
    if (/^test premise/i.test(r.on)) continue;
    process.stdout.write(`[${i + 1}/${missing.length}] ${r.on} ... `);
    try {
      const h = await (await fetch(`${BASE}/Client/FindCorporationDirectory/Corporation/${r.rg}`, { headers: { ...UA, cookie } })).text();
      // The template data is a JSON literal whose string fields themselves
      // contain braces and nested JSON (registrants), so a lazy {...} match
      // cuts it short. Read the fields directly instead.
      const start = h.indexOf('fwkParseStringTemplate($("#detailtemplate").html(),');
      const blob = start > -1 ? h.slice(start, h.indexOf('</script>', start)) : '';
      const field = (k: string) => { const mm = blob.match(new RegExp(`"${k}":"((?:[^"\\\\]|\\\\.)*)"`)); return mm ? JSON.parse(`"${mm[1]}"`) as string : ''; };
      const j = blob ? { ea: field('ea'), ph: field('ph'), ha: field('ha'), sh: field('sh'), is: field('is') || field('ist') } : null;
      const ha = String(j?.ha || '').replace(/<br\/?>/g, ', ').replace(/\r?\n/g, ' ').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').replace(/,\s*CAN$/, '').trim();
      const postal = (ha.match(/[A-Z]\d[A-Z]\s?\d[A-Z]\d/) || [])[0] || null;
      let registrants: string[] = [];
      for (const mm of String(j?.sh || '').matchAll(/"rn":\s*"(\d+)"[\s\S]*?<a[^>]*>([^<]+)<\/a>/g)) registrants.push(`${mm[2].trim()} (#${mm[1]})`);
      details.push({ ...r, email: j?.ea || null, phone: j?.ph || null, address: ha || null, postal, registrants, inspection: j?.is || null });
      console.log(j?.ea || 'no email', '|', ha.slice(0, 60));
    } catch (e) { console.log('failed', (e as Error).message); }
    await sleep(600);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'missing-details.json'), JSON.stringify(details, null, 1));
  console.log(`details for ${details.length} missing premises -> ${path.join(OUT_DIR, 'missing-details.json')}`);
  if (!INSERT) return;
  console.log('(insert step runs from scripts/_cono-ivit-insert.ts after review)');
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
