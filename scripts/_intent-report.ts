/**
 * Demand Pulse phase 0: read back the intent events and summarize them.
 *   npx tsx scripts/_intent-report.ts [--days 7]
 * Decodes the "i:" tokens carried in listing_events (see src/lib/intent.ts).
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import { createClient } from '@supabase/supabase-js';
import { decodeIntent, INTENT_CARRIER_EVENT } from '../src/lib/intent';

const days = (() => { const i = process.argv.indexOf('--days'); return i > -1 ? Number(process.argv[i + 1]) : 7; })();
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const rows: Array<{ provider_id: string; referrer: string | null; created_at: string }> = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from('listing_events').select('provider_id,referrer,created_at').eq('event_type', INTENT_CARRIER_EVENT).like('referrer', 'i:%').gte('created_at', since).range(f, f + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const byKind: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  const byTreatment: Record<string, number> = {};
  const bySrc: Record<string, number> = {};
  const byTopic: Record<string, number> = {};
  const sessions = new Set<string>();
  for (const r of rows) {
    const d = decodeIntent(r.referrer);
    if (!d) continue;
    byKind[d.kind] = (byKind[d.kind] || 0) + 1;
    if (d.s) sessions.add(d.s);
    if (d.kind === 'impression' || d.kind === 'quiz_match') {
      if (d.c) byCity[d.c] = (byCity[d.c] || 0) + 1;
      if (d.t) byTreatment[d.t] = (byTreatment[d.t] || 0) + 1;
    }
    if (d.kind === 'view_src' && d.src) bySrc[d.src] = (bySrc[d.src] || 0) + 1;
    if (d.kind === 'message_topic' && d.k) byTopic[d.k] = (byTopic[d.k] || 0) + 1;
  }
  const top = (o: Record<string, number>, n = 10) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${v}`).join(', ') || 'none';
  console.log(`Intent events, last ${days} days: ${rows.length} rows, ${sessions.size} sessions`);
  console.log('by kind:', top(byKind, 20));
  console.log('impressions by city:', top(byCity));
  console.log('impressions by treatment:', top(byTreatment));
  console.log('listing views by internal source:', top(bySrc));
  console.log('message topics:', top(byTopic));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
