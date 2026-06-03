/**
 * Audit: list every claimed clinic and report which key fields are populated
 * vs empty. Read-only. Use to drive the enrichment work that follows.
 *
 * Also surfaces:
 *   - Any clinic with name matching /insight/i (the duplicate hunt)
 *   - Any clinic with name matching /tri.?health/i
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const FIELDS = [
  'id', 'name', 'slug', 'is_claimed', 'is_featured', 'created_at', 'email',
  'website', 'phone', 'address', 'city', 'state', 'country', 'postal_code',
  'latitude', 'longitude', 'working_hours', 'photos', 'specialties',
  'services', 'online_booking_url', 'description', 'regulator_override',
  'decision_drivers', 'image_url', 'imageUrl',
];

function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === 'object' && !Array.isArray(v)) {
    return Object.keys(v).length === 0;
  }
  return false;
}

function gaps(row) {
  const checkFields = [
    'website', 'phone', 'address', 'latitude', 'longitude', 'working_hours',
    'photos', 'specialties', 'services', 'online_booking_url', 'description',
    'regulator_override', 'decision_drivers', 'image_url',
  ];
  return checkFields.filter((f) => isEmpty(row[f]));
}

(async () => {
  console.log('===== CLAIMED CLINIC AUDIT =====\n');

  const { data: claimed, error } = await sb
    .from('providers')
    .select(FIELDS.join(','))
    .eq('is_claimed', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('SELECT failed:', error.message);
    process.exit(1);
  }

  console.log(`Total claimed: ${claimed.length}\n`);

  for (const row of claimed) {
    console.log(`--- ${row.name} ---`);
    console.log(`  id:          ${row.id}`);
    console.log(`  slug:        ${row.slug}`);
    console.log(`  city/state:  ${row.city || '(null)'} / ${row.state || '(null)'}`);
    console.log(`  is_claimed:  ${row.is_claimed}  is_featured: ${row.is_featured}`);
    console.log(`  created_at:  ${row.created_at}`);
    console.log(`  email:       ${row.email || '(null)'}`);
    console.log(`  website:     ${row.website || '(empty)'}`);
    console.log(`  phone:       ${row.phone || '(empty)'}`);
    console.log(`  address:     ${row.address || '(empty)'}`);
    console.log(`  lat,lng:     ${row.latitude || '(null)'}, ${row.longitude || '(null)'}`);
    console.log(`  working_hours: ${row.working_hours ? Object.keys(row.working_hours).length + ' days' : '(empty)'}`);
    console.log(`  specialties: ${Array.isArray(row.specialties) ? row.specialties.length + ' items' : '(empty)'}`);
    console.log(`  services:    ${Array.isArray(row.services) ? row.services.length + ' items' : '(empty)'}`);
    console.log(`  photos:      ${Array.isArray(row.photos) ? row.photos.length + ' items' : '(empty)'}`);
    console.log(`  online_booking_url: ${row.online_booking_url || '(empty)'}`);
    console.log(`  description: ${row.description ? row.description.length + ' chars' : '(empty)'}`);
    console.log(`  regulator_override: ${row.regulator_override || '(empty)'}`);
    console.log(`  image_url:   ${row.image_url ? row.image_url.slice(0, 70) : '(empty)'}`);
    console.log(`  decision_drivers: ${JSON.stringify(row.decision_drivers) || '(null)'}`);
    console.log(`  GAPS:        ${gaps(row).join(', ') || '(none)'}\n`);
  }

  // Insight hunt — claimed AND unclaimed both, so we find stubs
  console.log('===== INSIGHT NAME SEARCH (all rows) =====\n');
  const { data: insights } = await sb
    .from('providers')
    .select('id, name, slug, is_claimed, is_featured, created_at, email, phone, address, website, working_hours, specialties, photos, description, decision_drivers, regulator_override')
    .ilike('name', '%insight%')
    .order('created_at', { ascending: true });
  for (const row of insights || []) {
    console.log(`  id=${row.id} slug=${row.slug} is_claimed=${row.is_claimed} created=${row.created_at}`);
    console.log(`    name: ${row.name}`);
    console.log(`    email: ${row.email || '(null)'}  phone: ${row.phone || '(null)'}`);
    console.log(`    website: ${row.website || '(null)'}  desc: ${row.description ? row.description.length + ' chars' : '(none)'}`);
    console.log(`    address: ${row.address || '(null)'}`);
    console.log(`    decision_drivers: ${JSON.stringify(row.decision_drivers) || '(null)'}`);
    console.log(`    regulator_override: ${row.regulator_override || '(null)'}\n`);
  }

  // Tri-Health
  console.log('===== TRI-HEALTH NAME SEARCH (all rows) =====\n');
  const { data: triH } = await sb
    .from('providers')
    .select('id, name, slug, is_claimed, is_featured, created_at, email, phone, address, website, working_hours, specialties, photos, description, decision_drivers, regulator_override, online_booking_url, latitude, longitude')
    .ilike('name', '%tri%health%')
    .order('created_at', { ascending: true });
  for (const row of triH || []) {
    console.log(`  id=${row.id} slug=${row.slug} is_claimed=${row.is_claimed} created=${row.created_at}`);
    console.log(`    name: ${row.name}`);
    console.log(`    email: ${row.email || '(null)'}  phone: ${row.phone || '(null)'}`);
    console.log(`    website: ${row.website || '(null)'}  booking: ${row.online_booking_url || '(null)'}`);
    console.log(`    address: ${row.address || '(null)'}`);
    console.log(`    lat,lng: ${row.latitude}, ${row.longitude}`);
    console.log(`    working_hours: ${row.working_hours ? Object.keys(row.working_hours).length + ' days' : '(none)'}`);
    console.log(`    specialties: ${Array.isArray(row.specialties) ? row.specialties.length + ' items' : '(none)'}`);
    console.log(`    photos: ${Array.isArray(row.photos) ? row.photos.length : '(none)'}`);
    console.log(`    desc: ${row.description ? row.description.length + ' chars' : '(none)'}`);
    console.log(`    decision_drivers: ${JSON.stringify(row.decision_drivers) || '(null)'}`);
    console.log(`    regulator_override: ${row.regulator_override || '(null)'}\n`);
  }
})();
