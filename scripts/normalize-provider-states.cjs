/**
 * Normalize 2-letter state/province codes (NV, TX, ON, BC, DC...) to full names
 * so the providers table is consistent with the dominant convention used across
 * the directory (e.g. "Nevada", "Ontario", "District Of Columbia").
 * Run: node scripts/normalize-provider-states.cjs [--dry]
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');

// "District Of Columbia" casing intentionally matches the existing DB rows.
const MAP = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District Of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  // Canada
  ON: 'Ontario', BC: 'British Columbia', AB: 'Alberta', QC: 'Quebec',
  MB: 'Manitoba', SK: 'Saskatchewan', NS: 'Nova Scotia', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', PE: 'Prince Edward Island',
  NT: 'Northwest Territories', YT: 'Yukon', NU: 'Nunavut',
};

(async () => {
  const rows = [];
  let from = 0;
  for (let p = 0; p < 20; p++) {
    const { data, error } = await sb.from('providers').select('id, state').range(from, from + 999);
    if (error) { console.error('READ ERR', error.message); process.exitCode = 1; return; }
    if (!data || !data.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  const targets = rows.filter((r) => typeof r.state === 'string' && /^[A-Za-z]{2}$/.test(r.state.trim()));
  const byCode = {};
  let updated = 0, unmapped = 0;
  for (const r of targets) {
    const code = r.state.trim().toUpperCase();
    const full = MAP[code];
    if (!full) { unmapped++; byCode[code] = (byCode[code] || 0) + ' (UNMAPPED)'; continue; }
    byCode[code] = (typeof byCode[code] === 'number' ? byCode[code] : 0) + 1;
    if (!DRY) {
      const { error } = await sb.from('providers').update({ state: full }).eq('id', r.id);
      if (error) { console.error('UPDATE FAIL', r.id, error.message); continue; }
    }
    updated++;
  }

  console.log(`${DRY ? '[DRY RUN] ' : ''}coded rows found: ${targets.length}`);
  console.log(`${DRY ? 'would update' : 'updated'}: ${updated}`);
  if (unmapped) console.log(`UNMAPPED codes (left untouched): ${unmapped}`);
  console.log('by code:');
  Object.entries(byCode).sort((a, b) => (b[1] || 0) - (a[1] || 0)).forEach(([c, n]) => console.log(`  ${c} -> ${MAP[c] || '???'}  (${n})`));
})();
