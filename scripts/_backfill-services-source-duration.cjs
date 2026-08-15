// Drip-capture backfill (2026-08-15, operator-approved data model):
//  1. Flag every services[] entry that came from the /finish template with
//     source='finish_template' (attribution rule: never display as the
//     clinic's own published menu).
//  2. RECOVER dropped durations: /finish stored the full answers at
//     decision_drivers.manage.drips (incl. duration) even while the services
//     mapping discarded it — so historical durations are recoverable.
// Detection: a provider whose decision_drivers.manage.drips exists and whose
// services[] names are drawn from it came through /finish. Single-row scoped
// updates; --dry previews.
require('dotenv').config({ path: '.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');

(async () => {
  let P = [], f = 0;
  for (;;) {
    const { data, error } = await s.from('providers').select('id,slug,services,decision_drivers').not('services', 'is', null).range(f, f + 999);
    if (error) { console.log('ERR', error.message); return; }
    if (!data || !data.length) break;
    P = P.concat(data); if (data.length < 1000) break; f += 1000;
  }
  let flagged = 0, durationsRecovered = 0, skipped = 0;
  for (const p of P) {
    const services = Array.isArray(p.services) ? p.services : null;
    if (!services || !services.length) { skipped++; continue; }
    const manageDrips = p.decision_drivers && p.decision_drivers.manage && Array.isArray(p.decision_drivers.manage.drips)
      ? p.decision_drivers.manage.drips : null;
    if (!manageDrips) { skipped++; continue; } // not finish-sourced (or legacy string array)
    const byName = new Map();
    for (const d of manageDrips) if (d && typeof d.name === 'string') byName.set(d.name.trim().toLowerCase(), d);
    let changed = false, recovered = 0;
    const next = services.map((sv) => {
      // legacy string-array services (e.g. UNITY) stay untouched — they are not
      // objects and did not come from the current finish mapping
      if (!sv || typeof sv !== 'object') return sv;
      const out = { ...sv };
      if (out.source !== 'finish_template') { out.source = 'finish_template'; changed = true; }
      const m = byName.get(String(out.name || '').trim().toLowerCase());
      if (m && typeof m.duration === 'string' && m.duration.trim() && !out.duration) {
        out.duration = m.duration.trim().slice(0, 30); changed = true; recovered++;
      }
      return out;
    });
    if (!changed) { skipped++; continue; }
    if (DRY) {
      console.log(`[dry] ${p.slug}: flag ${next.filter(x=>x&&typeof x==='object').length} services, recover ${recovered} durations`);
      flagged++; durationsRecovered += recovered; continue;
    }
    const { error, count } = await s.from('providers').update({ services: next }, { count: 'exact' }).eq('id', p.id);
    if (error || count !== 1) { console.log(`ERR ${p.slug}: ${error ? error.message : 'count=' + count}`); continue; }
    flagged++; durationsRecovered += recovered;
    console.log(`OK ${p.slug}: flagged${recovered ? `, ${recovered} durations recovered` : ''}`);
  }
  console.log(`\n${DRY ? 'DRY: would flag' : 'Flagged'} ${flagged} providers, recovered ${durationsRecovered} durations, ${skipped} skipped (no finish answers / already done / legacy shape)`);
})();
