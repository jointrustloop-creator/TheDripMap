/**
 * Insert 10 Ottawa-area HIGH-confidence IV clinics (2026-06-07).
 * Pre-flights slug + domain across all CA providers.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const COMMON = {
  country: 'Canada',
  state: 'Ontario',
  is_hidden: false,
  is_claimed: false,
  is_featured: false,
  availability: true,
  decision_drivers: {
    source: 'agent_research_ottawa_2026_06_07',
    research_method: 'web_search + operator approval (HIGH-confidence only)',
    enriched_at: new Date().toISOString(),
  },
};

const CLINICS = [
  {
    slug: 'iv-alchemy-ottawa',
    city: 'Ottawa',
    name: 'IV Alchemy',
    address: 'Mobile service area, Ottawa, ON',
    postal_code: null,
    phone: null,
    website: 'https://www.ivalchemy.ca',
    email: null,
    category: 'Mobile IV',
    type: 'Mobile',
    specialties: ['IV Therapy', 'Mobile IV', 'NAD+', 'Myers Cocktail', 'Glutathione', 'Vitamin Injections'],
    description: 'Ottawa-based mobile IV and injection therapy service providing nurse-led infusions at home, office, hotel, cottage, or events. NAD+ and longevity focus.',
  },
  {
    slug: 'thrive-wellness-and-aesthetics-manotick-ottawa',
    city: 'Ottawa',
    name: 'Thrive Wellness and Aesthetics (Manotick)',
    address: '1130 Mill St, Manotick, Ottawa, ON',
    postal_code: null,
    phone: null,
    website: 'https://thrivewellnessandaesthetics.ca',
    email: null,
    category: 'IV Therapy',
    type: 'Both',
    specialties: ['IV Therapy', 'Mobile IV', 'Iron Infusion', 'Vitamin Infusions'],
    description: 'Nurse-led practice in Manotick offering in-clinic IV vitamin and iron infusions plus a mobile IV arm. Owned by Cara Stevenson RN.',
  },
  {
    slug: 'the-aesthetic-lounge-ottawa',
    city: 'Ottawa',
    name: 'The Aesthetic Lounge',
    address: '1079 Somerset St W, Ottawa, ON K1Y 3C6',
    postal_code: 'K1Y 3C6',
    phone: '613-729-8086',
    website: 'https://theaestheticlounge.ca',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Infusions', 'Medical Aesthetics'],
    description: 'Hintonburg medical spa with anti-aging focus and an IV drip menu including IV nutrient infusions.',
  },
  {
    slug: 'sculpted-clinic-ottawa',
    city: 'Ottawa',
    name: 'Sculpted Clinic',
    address: '1320 Carling Ave, Suite 200, Ottawa, ON K1Z 7K8',
    postal_code: 'K1Z 7K8',
    phone: '613-729-9777',
    website: 'https://www.sculptedclinic.com',
    email: 'info@sculptedclinic.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Drips', 'Medical Aesthetics', 'PRP'],
    description: 'Cosmetic nurse-injector clinic on Carling Ave with IV drip therapy as a published service alongside injectables.',
  },
  {
    slug: 'inskinity-aesthetic-clinic-ottawa',
    city: 'Ottawa',
    name: 'Inskinity Aesthetic Clinic',
    address: '180 Preston St, 3rd floor, Ottawa, ON K1R 7P9',
    postal_code: 'K1R 7P9',
    phone: '613-262-5848',
    website: 'https://inskinity.ca',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Drips', 'HydraFacial', 'Medical Aesthetics'],
    description: 'Little Italy medical spa with a dedicated IV vitamins service page; open six days per week.',
  },
  {
    slug: 'rocaderm-clinic-ottawa',
    city: 'Ottawa',
    name: 'Rocaderm Clinic',
    address: '2500 St. Laurent Blvd, Unit 105, Ottawa, ON K1H 1B1',
    postal_code: 'K1H 1B1',
    phone: '613-298-5612',
    website: 'https://www.rocadermclinic.com',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Infusions', 'Medical Aesthetics'],
    description: 'Ottawa east-end medical aesthetics clinic with a published Wellness Services section that includes IV vitamin therapy.',
  },
  {
    slug: 'the-cosmetic-clinic-barrhaven-ottawa',
    city: 'Ottawa',
    name: 'The Cosmetic Clinic (Barrhaven)',
    address: '900 Greenbank Rd, Suite 204, Ottawa, ON',
    postal_code: null,
    phone: '613-913-2248',
    website: 'https://www.thecosmeticclinic.ca',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Drips', 'Medical Aesthetics'],
    description: 'Barrhaven cosmetic clinic with a published IV therapy page describing direct-to-bloodstream vitamin and mineral drips.',
  },
  {
    slug: 'stittsville-health-and-wellness-ottawa',
    city: 'Ottawa',
    name: 'Stittsville Health and Wellness',
    address: '1501 Stittsville Main St, 2nd floor, Stittsville, Ottawa, ON',
    postal_code: null,
    phone: '613-791-7429',
    website: 'https://www.stittsvillehealth.com',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Vitamin C', 'Glutathione', 'Naturopathic Medicine'],
    description: 'Naturopathic clinic led by Dr. Karim Alami ND with a full IV menu including Myers Cocktail, high-dose vitamin C, glutathione, and custom IV blends.',
  },
  {
    slug: 'panorama-aesthetics-kanata-ottawa',
    city: 'Ottawa',
    name: 'Panorama Aesthetics (Kanata)',
    address: '1380 Upper Canada St, Suite 104, Kanata, Ottawa, ON K2T 0N7',
    postal_code: 'K2T 0N7',
    phone: '613-327-7457',
    website: 'https://www.panoramaesthetics.com',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Infusions', 'Medical Aesthetics'],
    description: 'RN-owned aesthetic clinic in Kanata with vitamin IV therapy explicitly in its core menu.',
  },
  {
    slug: 'bci-clinic-nepean-ottawa',
    city: 'Ottawa',
    name: 'BCI Clinic (Beauty Cosmetic Injectors)',
    address: '1530 Merivale Rd, #208, Nepean, Ottawa, ON K2G 3J7',
    postal_code: 'K2G 3J7',
    phone: '613-818-9952',
    website: 'https://bciclinic.ca',
    email: 'bciclinic.inc@gmail.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Drips', 'Medical Aesthetics'],
    description: 'Merivale Rd injector-led clinic with a published IV therapy page.',
  },
];

function normDomain(url) {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; }
}

(async () => {
  const receipt = { phase: 'insert-ottawa-10', timestamp: new Date().toISOString(), inserted: [], skipped_slug_exists: [], skipped_domain_exists: [], errors: [] };
  const { data: existing } = await sb.from('providers').select('id, slug, website, city').eq('country', 'Canada').range(0, 1999);
  const existingSlugs = new Set(existing.map((p) => p.slug));
  const existingDomainMap = new Map();
  for (const p of existing) { const d = normDomain(p.website); if (d) existingDomainMap.set(d, { slug: p.slug, city: p.city }); }
  console.log('Pre-flight: ' + existing.length + ' existing CA providers, ' + existingDomainMap.size + ' unique domains.');
  console.log();

  for (const c of CLINICS) {
    if (existingSlugs.has(c.slug)) { console.log('= [slug exists] ' + c.slug); receipt.skipped_slug_exists.push({ slug: c.slug }); continue; }
    const candDomain = normDomain(c.website);
    if (candDomain && existingDomainMap.has(candDomain)) {
      const dup = existingDomainMap.get(candDomain);
      console.log('= [domain exists ' + candDomain + ' -> ' + dup.slug + ' in ' + dup.city + '] ' + c.slug);
      receipt.skipped_domain_exists.push({ candidate: c.slug, existing_slug: dup.slug, existing_city: dup.city, domain: candDomain });
      continue;
    }
    const payload = { ...COMMON, slug: c.slug, name: c.name, city: c.city, address: c.address, postal_code: c.postal_code, phone: c.phone, website: c.website, email: c.email, email_quality: c.email ? 'medium' : null, category: c.category, type: c.type, specialties: c.specialties, description: c.description, rating: null, reviews: null };
    const { data, error } = await sb.from('providers').insert(payload).select('id, slug, city, type').single();
    if (error) { console.log('! ' + c.slug + ' failed: ' + error.message); receipt.errors.push({ slug: c.slug, error: error.message }); continue; }
    const mobile = (data.type === 'Mobile' || data.type === 'Both') ? ' [MOBILE]' : '';
    receipt.inserted.push({ id: data.id, slug: data.slug, city: data.city, type: data.type });
    console.log('+ ' + data.city.padEnd(10) + ' | ' + c.slug + mobile);
  }
  console.log();
  console.log('Inserted: ' + receipt.inserted.length + ' | Skipped slug: ' + receipt.skipped_slug_exists.length + ' | Skipped domain: ' + receipt.skipped_domain_exists.length + ' | Errors: ' + receipt.errors.length);
  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'insert-ottawa-10-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
