/**
 * Audit /iv-therapy/{treatment}/{city} matrix pages by provider count tier.
 *
 * Replicates the same matrix the app prebuilds:
 *   - 13 treatments (MATRIX_TREATMENTS in app/iv-therapy/[treatment]/[city]/page.tsx)
 *   - 16 Canada cities + top 20 US cities by provider count
 *
 * For each combo, runs the same Supabase filter the page uses
 * (getListingsByServiceAndCity logic, simplified) and buckets by:
 *   - 0 providers
 *   - 1 provider
 *   - 2 providers
 *   - 3+ providers
 *
 * Read-only. No DB writes.
 */
require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const MATRIX_TREATMENTS = [
  { slug: 'hydration', filter: 'Hydration' },
  { slug: 'nad-plus', filter: 'NAD+' },
  { slug: 'myers-cocktail', filter: 'Myers Cocktail' },
  { slug: 'hangover-recovery', filter: 'Hangover' },
  { slug: 'immune-support', filter: 'Immune Support' },
  { slug: 'beauty-glow', filter: 'Beauty Glow' },
  { slug: 'athletic-recovery', filter: 'Recovery' },
  { slug: 'mobile-iv', filter: 'Mobile' },
  { slug: 'weight-loss', filter: 'Weight Loss' },
  { slug: 'vitamin-c', filter: 'Vitamin C' },
  { slug: 'glutathione', filter: 'Glutathione' },
  { slug: 'glp-1-weight-loss', filter: 'Peptide' },
  { slug: 'iron-infusion', filter: 'Iron' },
];

const CANADA_CITIES = [
  'Toronto', 'Vancouver', 'Calgary', 'Ottawa',
  'Mississauga', 'Richmond Hill', 'North York', 'Oakville',
  'Edmonton', 'Montreal', 'Quebec City', 'Winnipeg',
  'Halifax', 'Victoria', 'Kelowna', 'Red Deer',
];

function slugify(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function topUSCities() {
  // Mimic sitemap.ts logic: cities with count > 0, excluding Canada cities, top 20.
  const { data } = await sb.from('providers').select('city, country').eq('country', 'United States').not('city', 'is', null);
  const counts = new Map();
  for (const r of (data || [])) {
    const c = (r.city || '').trim();
    if (!c) continue;
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([city]) => city);
}

// Service-filter logic mirroring src/lib/data.ts getServiceFilter (simplified
// for the matrix filter strings used by the [treatment]/[city] page).
function buildOrFilter(treatmentFilter) {
  const t = treatmentFilter.toLowerCase();
  if (t === 'hydration')        return ['name.ilike.%hydration%', 'description.ilike.%hydration%', 'specialties.cs.{"Hydration"}'];
  if (t === 'nad+')             return ['description.ilike.%nad%', 'specialties.cs.{"NAD+"}', 'specialties.cs.{"NAD+ Plus"}', 'name.ilike.%nad%'];
  if (t === 'myers cocktail')   return ['description.ilike.%myers%', 'specialties.cs.{"Myers Cocktail"}', 'name.ilike.%myers%'];
  if (t === 'hangover')         return ['name.ilike.%hangover%', 'description.ilike.%hangover%', 'specialties.cs.{"Hangover"}', 'specialties.cs.{"Hangover Recovery"}', 'specialties.cs.{"Hangover Relief"}'];
  if (t === 'immune support')   return ['description.ilike.%immune%', 'specialties.cs.{"Immune Support"}', 'specialties.cs.{"Immunity"}', 'name.ilike.%immune%'];
  if (t === 'beauty glow')      return ['description.ilike.%glow%', 'description.ilike.%beauty%', 'specialties.cs.{"Beauty Glow"}', 'specialties.cs.{"Beauty + glow"}', 'specialties.cs.{"Glow"}'];
  if (t === 'recovery')         return ['description.ilike.%recovery%', 'specialties.cs.{"Recovery"}', 'specialties.cs.{"Athletic Recovery"}'];
  if (t === 'mobile')           return ['name.ilike.%mobile%', 'description.ilike.%mobile%', 'description.ilike.%in-home%', 'description.ilike.%concierge%', 'specialties.cs.{"Mobile"}', 'specialties.cs.{"Mobile IV"}', 'mobile_service.eq.true'];
  if (t === 'weight loss')      return ['name.ilike.%weight%', 'description.ilike.%weight%', 'description.ilike.%slim%', 'name.ilike.%lipo%', 'description.ilike.%metabolism%'];
  if (t === 'vitamin c')        return ['description.ilike.%vitamin c%', 'specialties.cs.{"Vitamin C"}'];
  if (t === 'glutathione')      return ['description.ilike.%glutathione%', 'specialties.cs.{"Glutathione"}'];
  if (t === 'peptide')          return ['description.ilike.%semaglutide%', 'description.ilike.%tirzepatide%', 'description.ilike.%glp-1%', 'name.ilike.%peptide%'];
  if (t === 'iron')             return ['description.ilike.%iron%', 'specialties.cs.{"Iron Infusion"}', 'name.ilike.%iron%'];
  return ['name.ilike.%' + t + '%', 'description.ilike.%' + t + '%'];
}

async function countProviders(treatmentFilter, city) {
  const or = buildOrFilter(treatmentFilter).join(',');
  const { count } = await sb
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .ilike('city', '%' + city + '%')
    .eq('is_hidden', false)
    .or(or);
  return count || 0;
}

(async () => {
  const us = await topUSCities();
  const allCities = [...CANADA_CITIES, ...us];
  console.log('Matrix cities:', allCities.length, '(' + CANADA_CITIES.length + ' Canada + ' + us.length + ' US)');
  console.log('Matrix treatments:', MATRIX_TREATMENTS.length);
  console.log('Total combinations:', allCities.length * MATRIX_TREATMENTS.length);
  console.log();

  const buckets = { '0': 0, '1': 0, '2': 0, '3+': 0 };
  const detail = [];
  let processed = 0;
  for (const t of MATRIX_TREATMENTS) {
    for (const city of allCities) {
      const n = await countProviders(t.filter, city);
      const bucket = n >= 3 ? '3+' : String(n);
      buckets[bucket]++;
      detail.push({ treatment: t.slug, city, citySlug: slugify(city), count: n, country: CANADA_CITIES.includes(city) ? 'CA' : 'US' });
      processed++;
      if (processed % 50 === 0) process.stderr.write('.');
    }
  }
  process.stderr.write('\n');

  console.log('=== Bucket counts ===');
  console.log('  0 providers : ' + buckets['0']);
  console.log('  1 provider  : ' + buckets['1']);
  console.log('  2 providers : ' + buckets['2']);
  console.log('  3+ providers: ' + buckets['3+']);
  console.log('  Thin (<3)   : ' + (buckets['0'] + buckets['1'] + buckets['2']));
  console.log();

  // Break down thin by country
  const thinCA = detail.filter(d => d.count < 3 && d.country === 'CA');
  const thinUS = detail.filter(d => d.count < 3 && d.country === 'US');
  console.log('Thin Canada:', thinCA.length, '/ Thin US:', thinUS.length);

  // Sample thin pages
  console.log();
  console.log('=== Sample thin (<3) pages ===');
  for (const d of thinCA.slice(0, 20)) {
    console.log('  CA | /iv-therapy/' + d.treatment + '/' + d.citySlug + ' | ' + d.count + ' providers');
  }
  for (const d of thinUS.slice(0, 20)) {
    console.log('  US | /iv-therapy/' + d.treatment + '/' + d.citySlug + ' | ' + d.count + ' providers');
  }

  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync('scripts/_receipts', { recursive: true });
  fs.writeFileSync(path.join('scripts/_receipts', 'thin-matrix-audit-' + Date.now() + '.json'), JSON.stringify({ buckets, detail }, null, 2));
})();
