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
      console.log(`  ${p}: ${e instanceof Error ? e.message : e}`);
      await sleep(5000); await warm();
    }
    if (++n % 25 === 0) { save(s); console.log(`  ${n}/${todo.length} prefixes, ${Object.keys(s.registrants).length} registrants`); }
    await sleep(700);
  }
  save(s);
  console.log(`done: ${Object.keys(s.registrants).length} registrants`);
}

const args = process.argv.slice(2);
if (args.includes('--detail')) {
  console.log('phase 2 not implemented yet: run enumeration first, then extend this script with the detail-page parser');
  process.exit(1);
}
enumerate().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
