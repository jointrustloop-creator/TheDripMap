/**
 * Alberta register harvest, phase 1 (2026-09-18): enumerate every registrant
 * on the College of Naturopathic Doctors of Alberta public directory
 * (cnda.alinityapp.com, Alinity, same platform as CONO).
 *
 * The directory has no list-all and no city field. TextOptionB is last name
 * and needs at least two characters, so we walk every two-letter prefix.
 * Writes .audit-tmp/cnda-registrants.json (resumable) for phase 2, which reads
 * each detail page for the IV special authorization and practice location.
 *
 *   npx tsx scripts/_cnda-harvest.ts            enumerate (resumes)
 *   npx tsx scripts/_cnda-harvest.ts --detail   phase 2 (after enumeration)
 *
 * Polite: one request per ~700 ms, a named UA with our contact address.
 */
import * as fs from 'fs';

const BASE = 'https://cnda.alinityapp.com';
const OUT = '.audit-tmp/cnda-registrants.json';
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TheDripMap register reader (info@thedripmap.com)' };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Rec { rg: string; rl: string; ps: string; ef: string; ex: string; sid: number; irc: boolean }
interface Store { done: string[]; registrants: Record<string, Rec>; started: string; detail?: Record<string, unknown> }

let cookie = '';
async function warm() {
  const pre = await fetch(`${BASE}/client/publicdirectory`, { headers: UA });
  cookie = (pre.headers.get('set-cookie') || '').split(/,(?=[^ ])/).map((c) => c.split(';')[0]).join('; ');
}
async function search(lastNamePrefix: string): Promise<Rec[]> {
  const ids = ['TextOptionA', 'TextOptionB', 'TextOptionC', 'TextOptionD', 'TextOptionE', 'DefaultProvinceCitySID'];
  const params = { Parameter: ids.map((ID) => ({ ID, Value: ID === 'TextOptionB' ? lastNamePrefix : '', ValueLabel: '[not entered]' })) };
  const body = 'queryParameters=' + encodeURIComponent(JSON.stringify(params)) + '&querySID=1000584';
  const r = await fetch(`${BASE}/client/PublicDirectory/Registrants`, { method: 'POST', headers: { ...UA, cookie, 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${lastNamePrefix}`);
  const j = await r.json();
  return Array.isArray(j.Records) ? j.Records : [];
}

function load(): Store {
  if (fs.existsSync(OUT)) return JSON.parse(fs.readFileSync(OUT, 'utf8'));
  return { done: [], registrants: {}, started: new Date().toISOString() };
}
function save(s: Store) { fs.mkdirSync('.audit-tmp', { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(s)); }

async function enumerate() {
  const s = load();
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const prefixes: string[] = [];
  for (const a of letters) for (const b of letters) prefixes.push(a + b);
  // Names like O'Brien, Mc, De La: cover apostrophe and space second chars too.
  for (const a of letters) { prefixes.push(a + "'"); prefixes.push(a + ' '); }
  const todo = prefixes.filter((p) => !s.done.includes(p));
  console.log(`prefixes total ${prefixes.length}, remaining ${todo.length}, registrants so far ${Object.keys(s.registrants).length}`);
  await warm();
  let n = 0;
  for (const p of todo) {
    try {
      const recs = await search(p);
      for (const r of recs) s.registrants[r.rg] = r;
      s.done.push(p);
      // A prefix that returns exactly 25 is probably capped (CONO capped at 25);
      // flag it so phase 1b can split it into three-letter prefixes.
      if (recs.length >= 25) console.log(`  CAP? ${p}: ${recs.length}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  ${p}: ${msg}`);
      // The directory returns 403 to bursts (first run: 108 of 121 requests at
      // 700 ms spacing). Back off a full minute, re-warm the session, and
      // retry the same prefix rather than skipping it.
      await sleep(msg.includes('403') ? 60000 : 5000); await warm();
      todo.push(p);
      continue;
    }
    if (++n % 25 === 0) { save(s); console.log(`  ${n}/${todo.length} prefixes, ${Object.keys(s.registrants).length} registrants`); }
    await sleep(3000);
  }
  save(s);
  console.log(`done: ${Object.keys(s.registrants).length} registrants`);
}

/**
 * Phase 2: read each registrant's detail page. The page embeds a JSON literal
 * (fwkParseStringTemplate(..., {...})) with rn (registration number), rl
 * (name), pr (register + standing), sp (special authorizations as an HTML
 * list; "IV Therapy" is the one we want), pdcv (practice details visibility)
 * and, when practice details are public, a MoreInfo call for the location.
 * Writes detail into the same store, resumable.
 */
interface Detail { rn: string; name: string; standing: string; sp: string[]; iv: boolean; pdcv: string; location: string | null; fetchedAt: string }

function parseDetail(html: string): Omit<Detail, 'location' | 'fetchedAt'> | null {
  const m = html.match(/fwkParseStringTemplate\(\$\("#detailtemplate"\)\.html\(\),\s*(\{[\s\S]*?\})\s*\)/);
  if (!m) return null;
  let j: Record<string, string>;
  try { j = JSON.parse(m[1]); } catch { return null; }
  const spList = String(j.sp || '').replace(/<\/li>/g, '\n').replace(/<[^>]+>/g, '').split('\n').map((s) => s.trim()).filter(Boolean);
  return {
    rn: String(j.rn || ''), name: String(j.fun || j.rl || ''), standing: String(j.pr || ''),
    sp: spList, iv: spList.some((s) => /\bIV Therapy\b/i.test(s)), pdcv: String(j.pdcv || ''),
  };
}

async function detail() {
  const s = load();
  s.detail = s.detail || {};
  const ids = Object.keys(s.registrants).filter((rg) => !(s.detail as Record<string, unknown>)[rg]);
  console.log(`registrants ${Object.keys(s.registrants).length}, detail remaining ${ids.length}`);
  await warm();
  let n = 0;
  for (const rg of ids) {
    try {
      const r = await fetch(`${BASE}/Client/PublicDirectory/Registrant/${rg}`, { headers: { ...UA, cookie } });
      if (r.status === 403) { console.log(`  ${rg}: 403, backing off 60s`); await sleep(60000); await warm(); ids.push(rg); continue; }
      const html = await r.text();
      const d = parseDetail(html);
      if (!d) { (s.detail as Record<string, unknown>)[rg] = { error: 'unparsed', fetchedAt: new Date().toISOString() }; }
      else {
        let location: string | null = null;
        if (d.pdcv !== 'hidden') {
          try {
            const mi = await fetch(`${BASE}/Client/PublicDirectory/MoreInfo/${rg}`, { method: 'POST', headers: { ...UA, cookie, 'X-Requested-With': 'XMLHttpRequest', referer: `${BASE}/Client/PublicDirectory/Registrant/${rg}` } });
            if (mi.ok) location = (await mi.text()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400) || null;
          } catch { /* location is a bonus, not a requirement */ }
        }
        (s.detail as Record<string, unknown>)[rg] = { ...d, location, fetchedAt: new Date().toISOString() } as Detail;
      }
    } catch (e) {
      console.log(`  ${rg}: ${e instanceof Error ? e.message : e}`); await sleep(5000); await warm();
    }
    if (++n % 20 === 0) { save(s); const iv = Object.values(s.detail as Record<string, Detail>).filter((d) => d && d.iv).length; console.log(`  ${n}/${ids.length} detail pages, IV-authorized so far ${iv}`); }
    await sleep(3000);
  }
  save(s);
  const all = Object.values(s.detail as Record<string, Detail>);
  console.log(`done: ${all.length} detail pages, ${all.filter((d) => d && d.iv).length} with IV Therapy authorization, ${all.filter((d) => d && d.location).length} with a public practice location`);
}

const args = process.argv.slice(2);
(args.includes('--detail') ? detail() : enumerate()).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
