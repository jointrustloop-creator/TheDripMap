// Geocode all providers in Supabase that have an address but no lat/lng.
// Uses OpenStreetMap Nominatim — free, no key required, 1 req/sec rate limit.
// Run: node scripts/geocode-missing-coords.js [--dry] [--limit=N]
//
// 335 providers missing coords at time of writing → ~6 min total at 1.1 req/sec.

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const DRY = process.argv.includes('--dry');
const limitMatch = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitMatch ? Number(limitMatch.split('=')[1]) : Infinity;
const POLITE_DELAY_MS = 1100; // Nominatim policy: ≤ 1 req/sec

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      // Nominatim TOS requires a descriptive User-Agent with contact info
      'User-Agent': 'TheDripMap-Geocoder/1.0 (info@thedripmap.com)',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = Number(data[0].lat);
  const lng = Number(data[0].lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

// Build a geocoding query from the provider's fields. Falls back from most-
// specific (full address) to least (city + state) so we still get a city-center
// pin even when the street address is malformed or missing.
function buildQuery(p) {
  const parts = [];
  if (p.address) parts.push(p.address);
  if (p.city) parts.push(p.city);
  if (p.state) parts.push(p.state);
  if (p.postal_code) parts.push(p.postal_code);
  if (p.country) parts.push(p.country);
  return parts.filter(Boolean).join(', ');
}

// Fetch all providers missing one or both coordinates
const { data: missing, error } = await supabase
  .from('providers')
  .select('id, name, address, city, state, postal_code, country, latitude, longitude')
  .or('latitude.is.null,longitude.is.null')
  .limit(10000);

if (error) { console.error('Load failed:', error); process.exit(1); }
console.log(`Found ${missing.length} providers missing lat/lng`);
console.log(`Mode: ${DRY ? 'DRY (no writes)' : 'APPLY'}`);
console.log(`Limit: ${LIMIT === Infinity ? 'none' : LIMIT}`);
console.log('');

const target = missing.slice(0, Math.min(LIMIT, missing.length));

const results = { ok: 0, fail: 0, skipped: 0 };
const failures = [];

for (let i = 0; i < target.length; i++) {
  const p = target[i];
  const q = buildQuery(p);
  if (!q || q.length < 5) {
    results.skipped++;
    failures.push({ name: p.name, reason: 'no query (missing address/city)' });
    continue;
  }
  process.stdout.write(`[${String(i + 1).padStart(3)}/${target.length}] ${p.name.slice(0, 40).padEnd(40)}  `);
  try {
    const coords = await geocode(q);
    if (!coords) {
      // Fallback: city + state + country only
      const fallback = [p.city, p.state, p.country].filter(Boolean).join(', ');
      if (fallback && fallback !== q) {
        await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
        const fb = await geocode(fallback);
        if (fb) {
          console.log(`✓ (fallback city-center) ${fb.lat.toFixed(4)},${fb.lng.toFixed(4)}`);
          if (!DRY) {
            const { error: uErr } = await supabase.from('providers').update({ latitude: fb.lat, longitude: fb.lng }).eq('id', p.id);
            if (uErr) { console.log('  ⚠ update failed:', uErr.message); results.fail++; continue; }
          }
          results.ok++;
          await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
          continue;
        }
      }
      console.log('✗ no result');
      results.fail++;
      failures.push({ name: p.name, reason: 'no geocode result for ' + q.slice(0, 80) });
      await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
      continue;
    }
    console.log(`✓ ${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`);
    if (!DRY) {
      const { error: uErr } = await supabase.from('providers').update({ latitude: coords.lat, longitude: coords.lng }).eq('id', p.id);
      if (uErr) { console.log('  ⚠ update failed:', uErr.message); results.fail++; continue; }
    }
    results.ok++;
  } catch (e) {
    console.log('✗ err:', e.message);
    results.fail++;
    failures.push({ name: p.name, reason: e.message });
  }
  await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
}

console.log('\n=== Final ===');
console.log(`  Geocoded:  ${results.ok}`);
console.log(`  Failed:    ${results.fail}`);
console.log(`  Skipped:   ${results.skipped}`);
if (failures.length > 0 && failures.length <= 30) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f.name}: ${f.reason}`);
}
