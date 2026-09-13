/**
 * September Sprint move 4 helper: fill "named practitioner" from the regulator.
 *
 * CONO's IVIT Premises Register lists, per authorized premises, the
 * naturopathic doctor(s) performing IVIT there with their registration number.
 * For every Ontario listing we can match to a premises and that has no named
 * practitioner yet, write those NDs to medical_team with the register as the
 * source. Display-complete's "named practitioner" then passes on regulator
 * data, which is stronger than owner-typed text. Nothing else is touched;
 * Safety Verified is unaffected (that still needs the owner's answers + review).
 *
 *   npx tsx scripts/_cono-practitioners.ts            dry run (report)
 *   npx tsx scripts/_cono-practitioners.ts --write    apply
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');
const BASE = 'https://cono.alinityapp.com';
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; TheDripMapBot/1.0; +https://www.thedripmap.com)' };
const PREMISES = path.join(process.env.TEMP || '.', 'cono-ivit', 'premises.json');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// STRICT matching (the harvest's loose normalizer was fine for counting but
// cross-matched "Centre for Natural Medicine" with anything containing those
// words). A premises maps to a listing only by register id (the 57 we
// inserted) or by full-name equality after light cleanup AND the same city.
const mild = (s: string) => s.toLowerCase().replace(/\s*-\s*\d{3,5}\s*$/, '').replace(/\([^)]*\)/g, ' ').replace(/&/g, ' and ').replace(/[^a-z0-9 ]/g, ' ').replace(/\b(inc|ltd|incorporated)\b/g, ' ').replace(/\s+/g, ' ').trim();
const cityKey = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

interface Rec { rg: string; on: string; cn: string; crs: string }

async function registrantsFor(rg: string, cookie: string): Promise<Array<{ name: string; rn: string }>> {
  const h = await (await fetch(`${BASE}/Client/FindCorporationDirectory/Corporation/${rg}`, { headers: { ...UA, cookie } })).text();
  const start = h.indexOf('fwkParseStringTemplate($("#detailtemplate").html(),');
  const blob = start > -1 ? h.slice(start, h.indexOf('</script>', start)) : '';
  const mm = blob.match(/"sh":"((?:[^"\\]|\\.)*)"/);
  const sh = mm ? (JSON.parse(`"${mm[1]}"`) as string) : '';
  const out: Array<{ name: string; rn: string }> = [];
  for (const m of sh.matchAll(/"rn":\s*"(\d+)"[\s\S]*?<a[^>]*>(?:\s*<i[^>]*><\/i>)?\s*([^<]+)<\/a>/g)) {
    const name = m[2].replace(/\s+/g, ' ').trim();
    if (name) out.push({ name, rn: m[1] });
  }
  return out;
}

async function main() {
  const recs: Rec[] = JSON.parse(fs.readFileSync(PREMISES, 'utf8'));
  const active = recs.filter((r) => r.crs === 'Active' && !/^test premise/i.test(r.on));
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const P: any[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from('providers').select('id,slug,name,city,is_claimed,medical_team,decision_drivers').eq('country', 'Canada').eq('is_hidden', false).range(f, f + 999); if (!data?.length) break; P.push(...data); if (data.length < 1000) break; }
  const byRg = new Map<string, any>(); const byNameCity = new Map<string, any>();
  for (const p of P) { const rg = p.decision_drivers?.cono_premise?.rg; if (rg) byRg.set(rg, p); byNameCity.set(`${mild(p.name)}|${cityKey(p.city || '')}`, p); }
  const hasPractitioner = (p: any) => {
    const team = Array.isArray(p.medical_team) ? p.medical_team.filter((m: any) => m && String(m.name || '').trim()) : [];
    const t = p.decision_drivers?.manage?.team || {};
    return team.length > 0 || !!t.prescriberName || !!t.leadName || !!p.decision_drivers?.prescriber_verification?.name;
  };

  const pre = await fetch(`${BASE}/client/findcorporationdirectory`, { headers: UA });
  const cookie = (pre.headers.get('set-cookie') || '').split(/,(?=[^ ])/).map((c) => c.split(';')[0]).join('; ');
  let matched = 0, alreadyNamed = 0, filled = 0, noRegs = 0;
  const lines: string[] = [];
  for (const [i, r] of active.entries()) {
    const p = byRg.get(r.rg) || byNameCity.get(`${mild(r.on)}|${cityKey(r.cn)}`);
    if (!p) continue;
    matched++;
    if (hasPractitioner(p)) { alreadyNamed++; continue; }
    process.stdout.write(`[${i + 1}/${active.length}] ${r.on} -> ${p.slug} ... `);
    const regs = await registrantsFor(r.rg, cookie);
    await sleep(600);
    if (!regs.length) { noRegs++; console.log('no registrants listed'); continue; }
    console.log(regs.map((x) => `${x.name} (#${x.rn})`).join('; '));
    lines.push(`- ${p.slug}${p.is_claimed ? ' (CLAIMED)' : ''}: ${regs.map((x) => `${x.name} #${x.rn}`).join('; ')}`);
    if (WRITE) {
      const team = regs.map((x) => ({ name: x.name, title: 'ND', registration: `CONO #${x.rn}`, source: 'CONO IVIT Premises Register' }));
      const dd = (p.decision_drivers && typeof p.decision_drivers === 'object') ? p.decision_drivers : {};
      const { error } = await sb.from('providers').update({ medical_team: team, decision_drivers: { ...dd, practitioner_source: `CONO IVIT Premises Register ${new Date().toISOString().slice(0, 10)} (premises ${r.rg})` } }).eq('id', p.id);
      if (error) console.log('   WRITE ERR', error.message); else filled++;
    }
  }
  console.log(`\nmatched premises ${matched} | already had a practitioner ${alreadyNamed} | no registrants listed ${noRegs} | ${WRITE ? 'filled' : 'would fill'} ${WRITE ? filled : lines.length}`);
  console.log(lines.join('\n'));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
