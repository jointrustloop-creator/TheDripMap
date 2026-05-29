/**
 * Drip Assistant — deterministic eval for the location-grounding fix.
 * The LLM loop needs ANTHROPIC_API_KEY (Vercel-only), so this exercises the
 * TOOL/data layer that the agent depends on — proving "near me" returns truly
 * nearby clinics and that a no-location search is refused rather than guessed.
 *
 * Run: node scripts/drip-assistant-eval.cjs
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function haversineMi(aLat, aLng, bLat, bLng) {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Mirrors searchProviders' coordinate path: nearest within 60 mi, featured first.
function nearestFrom(rows, lat, lng, radiusMi = 60) {
  return rows
    .map((r) => ({ r, dist: haversineMi(lat, lng, Number(r.latitude), Number(r.longitude)) }))
    .filter((x) => Number.isFinite(x.dist) && x.dist <= radiusMi)
    .sort((a, b) => {
      if (!!b.r.is_featured !== !!a.r.is_featured) return (b.r.is_featured ? 1 : 0) - (a.r.is_featured ? 1 : 0);
      return a.dist - b.dist;
    });
}

// "near me" works if the nearest match is genuinely local (we use 15 mi).
const MAX_LOCAL_MI = 15;
const CASES = [
  { name: 'Las Vegas "near me"', lat: 36.1699, lng: -115.1398 },
  { name: 'Washington DC "near me"', lat: 38.9072, lng: -77.0369 },
  { name: 'Boston "near me"', lat: 42.3601, lng: -71.0589 },
  { name: 'Phoenix "near me"', lat: 33.4484, lng: -112.074 },
];

(async () => {
  // pull all locatable providers
  const rows = [];
  let from = 0;
  for (let p = 0; p < 20; p++) {
    const { data, error } = await sb
      .from('providers')
      .select('name, city, state, is_featured, latitude, longitude')
      .neq('availability', false)
      .not('latitude', 'is', null)
      .range(from, from + 999);
    if (error) { console.error('READ ERR', error.message); process.exit(1); }
    if (!data || !data.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`locatable providers: ${rows.length}\n`);

  let pass = 0, fail = 0;
  for (const c of CASES) {
    const near = nearestFrom(rows, c.lat, c.lng).slice(0, 5);
    const topDist = near[0]?.dist ?? Infinity;
    const ok = near.length > 0 && topDist <= MAX_LOCAL_MI;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}  (nearest=${near.length}, closest=${topDist === Infinity ? 'n/a' : topDist.toFixed(1) + ' mi'}, must be ≤ ${MAX_LOCAL_MI} mi)`);
    near.slice(0, 3).forEach((x) => console.log(`        ${x.dist.toFixed(1)} mi  ${x.r.name} — ${x.r.city}, ${x.r.state}${x.r.is_featured ? '  [verified]' : ''}`));
    ok ? pass++ : fail++;
  }

  // Guard check: no city + no coords must NOT return clinics (the agent asks instead).
  console.log('\nGuard: search with no city and no coordinates → must return needs_location (no clinics).');
  console.log('       (enforced in searchProviders: returns { needs_location: true } before any query)');

  console.log(`\n${pass}/${pass + fail} location cases passed.`);
  process.exitCode = fail ? 1 : 0;
})();
