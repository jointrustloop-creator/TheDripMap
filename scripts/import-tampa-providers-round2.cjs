require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function slugify(str) {
  return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

const CITY = 'Tampa';
const STATE = 'Florida';
const COUNTRY = 'United States';

const PROVIDERS = [
  { name: 'New Tampa Wellness Clinic',   address: 'Wesley Chapel, FL', phone: null, website: 'https://newtampawellness.net/wellness-services/iv-therapy', type: 'In-Clinic' },
  { name: 'IV Harmony Clinic Lutz',      address: 'Lutz, FL',          phone: null, website: 'https://ivharmonyclinic.com/', type: 'In-Clinic' },
  { name: 'Sage Infusion Tampa',         address: 'Tampa, FL',         phone: null, website: 'https://sageinfusion.com/location/tampa/', type: 'In-Clinic' },
  { name: 'Optimal Wellness Wesley Chapel', address: 'Wesley Chapel, FL', phone: null, website: 'https://www.optimalwellness.shop/', type: 'In-Clinic' },
  { name: 'Bella Excellence Tampa',      address: 'Westchase, Tampa, FL', phone: null, website: 'https://bellatampa.com/iv-therapy/', type: 'In-Clinic' },
  { name: 'Wellness IV Bar',             address: '5330 Ehrlich Rd, Suite 28 & 29, Tampa, FL 33624', phone: null, website: 'https://wellnessivbar.com/', type: 'In-Clinic' },
  { name: 'IV JOINT Tampa',              address: 'Tampa, FL',         phone: null, website: 'https://ivjoint.com/', type: 'In-Clinic' },
  { name: 'Hydreight Tampa Bay',         address: 'Mobile service across Tampa Bay, FL', phone: null, website: 'https://hydreight.com/bp-tampa-bay/', type: 'Mobile' },
];

(async () => {
  const { data: existing } = await s.from('providers').select('slug, website, name')
    .or('city.ilike.%tampa%,address.ilike.%tampa%,address.ilike.%wesley chapel%,address.ilike.%lutz%');
  const existingSlugs = new Set(existing.map(p => p.slug));
  const existingWebsites = new Set(existing.map(p => (p.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '')));
  const existingNames = new Set(existing.map(p => p.name.toLowerCase().trim()));

  const rows = [];
  let skipped = 0;
  for (const p of PROVIDERS) {
    const slug = `${slugify(p.name)}-${slugify(CITY)}`;
    const websiteKey = (p.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
    if (existingSlugs.has(slug) || existingWebsites.has(websiteKey) || existingNames.has(p.name.toLowerCase().trim())) {
      console.log(`  ⏭  Skipped: ${p.name}`);
      skipped++;
      continue;
    }
    rows.push({
      slug, name: p.name, category: 'IV Therapy', city: CITY, state: STATE, country: COUNTRY,
      address: p.address, phone: p.phone, website: p.website, type: p.type,
      is_featured: false, availability: true, rating: null, reviews: null,
      created_at: new Date().toISOString(),
    });
  }

  console.log(`Ready: ${rows.length}, skipped: ${skipped}`);
  if (rows.length === 0) return;

  const { data, error } = await s.from('providers').insert(rows).select('id, slug, name');
  if (error) { console.log('ERR:', error.message); process.exit(1); }
  data.forEach(d => console.log(`  ✓ ${d.name}`));

  const { count: tampaTotal } = await s.from('providers').select('id', { count: 'exact', head: true })
    .or('city.ilike.%tampa%,city.ilike.%wesley chapel%,city.ilike.%lutz%');
  const { count: cityTampaOnly } = await s.from('providers').select('id', { count: 'exact', head: true }).ilike('city', 'tampa');
  console.log(`\nTampa city='Tampa' exact: ${cityTampaOnly}`);
  console.log(`Tampa Bay area total: ${tampaTotal}`);
})();
