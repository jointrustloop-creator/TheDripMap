/**
 * Alberta register harvest, phase 3 (2026-09-18): match the IV-authorized NDs
 * from .audit-tmp/cnda-registrants.json against our Alberta providers.
 * Read-only. Prints matches (registrant -> clinic) and the unmatched list, and
 * writes .audit-tmp/cnda-matches.json for the outreach step.
 *
 *   npx tsx scripts/_cnda-match.ts
 */
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

interface Detail { rn: string; name: string; standing: string; iv: boolean }
const store = JSON.parse(fs.readFileSync('.audit-tmp/cnda-registrants.json', 'utf8'));
const ivs = Object.entries(store.detail as Record<string, Detail>)
  .filter(([, d]) => d && d.iv)
  .map(([rg, d]) => ({ rg, ...d }));

const norm = (s: string) => s.toLowerCase().replace(/^dr\.?\s+/, '').replace(/[^a-z\s-]/g, ' ').replace(/\s+/g, ' ').trim();

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const rows: Record<string, unknown>[] = [];
  for (let off = 0; ; off += 1000) {
    const { data, error } = await sb.from('providers').select('id, slug, name, city, state, email, website, description, medical_team, is_claimed, is_hidden, outreach_sent, decision_drivers')
      .eq('country', 'Canada').or('state.ilike.AB,state.ilike.Alberta').range(off, off + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const active = rows.filter((r) => !r.is_hidden);
  console.log(`Alberta providers: ${rows.length} (${active.length} active); IV-authorized registrants: ${ivs.length}`);

  const hay = active.map((r) => ({ r, text: norm(JSON.stringify([r.name, r.description, r.medical_team, r.decision_drivers])) }));
  const matches: { registrant: string; rn: string; standing: string; clinic: string; slug: string; city: string; claimed: boolean; how: string }[] = [];
  const unmatched: string[] = [];
  for (const iv of ivs) {
    const full = norm(iv.name);
    const parts = full.split(' ').filter((p) => p.length > 1);
    const last = parts[parts.length - 1];
    const first = parts[0];
    let hit = false;
    for (const h of hay) {
      const how = h.text.includes(full) ? 'full name'
        : (last && last.length > 3 && h.text.includes(last) && first && h.text.includes(first)) ? 'first+last'
        : (last && last.length > 5 && norm(String(h.r.name)).includes(last)) ? 'last name in clinic name'
        : '';
      if (!how) continue;
      hit = true;
      matches.push({ registrant: iv.name, rn: iv.rn, standing: iv.standing, clinic: String(h.r.name), slug: String(h.r.slug), city: String(h.r.city), claimed: !!h.r.is_claimed, how });
    }
    if (!hit) unmatched.push(`${iv.name} (${iv.standing})`);
  }
  fs.writeFileSync('.audit-tmp/cnda-matches.json', JSON.stringify({ matches, unmatched, generated: new Date().toISOString() }, null, 2));
  console.log(`\nMATCHED ${matches.length} registrant/clinic pairs:`);
  for (const m of matches) console.log(`  ${m.registrant} -> ${m.clinic} [${m.city}]${m.claimed ? ' CLAIMED' : ''} (${m.how})`);
  console.log(`\nUNMATCHED ${unmatched.length} (IV-authorized NDs we have no clinic for):`);
  for (const u of unmatched) console.log(`  ${u}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
