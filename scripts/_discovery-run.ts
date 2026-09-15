/**
 * On-demand clinic discovery (2026-09-15). The cron route needs CRON_SECRET,
 * which the operator machine does not have, so this drives the same
 * src/lib/discovery-run logic directly with FIRECRAWL_API_KEY.
 *
 *   npx tsx scripts/_discovery-run.ts --cities "Guelph,Oshawa,Kelowna" [--dry]
 *   npx tsx scripts/_discovery-run.ts --next 6            next 6 rotation cities
 *
 * Every insert lands flagged firecrawl_needs_review and is excluded from
 * outreach until a human confirms the name. Nothing is ever deleted.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import { createClient } from '@supabase/supabase-js';
import { runFirecrawl, PROVINCE } from '../src/lib/discovery-run';
import { DISCOVERY_CITIES } from '../src/lib/discovery';

const args = process.argv.slice(2);
const val = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const dry = args.includes('--dry');

async function main() {
  const fcKey = (process.env.FIRECRAWL_API_KEY || '').trim();
  if (!fcKey) { console.error('FIRECRAWL_API_KEY missing'); process.exit(1); }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

  let cities: string[];
  if (val('cities')) {
    cities = String(val('cities')).split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    // Prefer cities we have never run, newest rotation entries first.
    const n = Number(val('next')) || 3;
    const { data: runs } = await sb.from('discovery_runs').select('city');
    const seen = new Map<string, number>();
    for (const r of runs || []) seen.set(r.city, (seen.get(r.city) || 0) + 1);
    cities = [...DISCOVERY_CITIES].sort((a, b) => (seen.get(a) || 0) - (seen.get(b) || 0)).slice(0, n);
  }
  console.log(`cities: ${cities.join(', ')}${dry ? ' (DRY)' : ''}`);

  let total = 0;
  for (const city of cities) {
    try {
      const res = await runFirecrawl(sb, fcKey, city, PROVINCE[city] || null, dry, { silent: true });
      total += res.created;
      console.log(`${city}: ${res.created} new | searches ${res.searches} | candidates ${res.candidates} | verified ${res.verified}${res.names.length ? ' -> ' + res.names.join(', ') : ''}`);
      if (res.notes.length) console.log(`  notes: ${res.notes.slice(0, 6).join(' | ')}`);
    } catch (e) {
      console.error(`${city}: FAILED ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`\ntotal new clinics: ${total}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
