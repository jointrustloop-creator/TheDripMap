/**
 * Insert 9 Winnipeg + Halifax HIGH-confidence IV clinics (2026-06-07).
 * Includes PhysiGO Mobile Winnipeg (MEDIUM but real mobile gap-filler).
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
  is_hidden: false,
  is_claimed: false,
  is_featured: false,
  availability: true,
  decision_drivers: {
    source: 'agent_research_winnipeg_halifax_2026_06_07',
    research_method: 'web_search + operator approval (HIGH-confidence + 1 MEDIUM mobile)',
    enriched_at: new Date().toISOString(),
  },
};

const CLINICS = [
  // ============ WINNIPEG, MB (4) ============
  {
    slug: 'victoria-park-medispa-grosvenor-winnipeg',
    state: 'Manitoba',
    city: 'Winnipeg',
    name: 'Victoria Park Medispa (Grosvenor)',
    address: '932 Grosvenor Ave, Winnipeg, MB R3M 0N5',
    postal_code: 'R3M 0N5',
    phone: '204-957-7242',
    website: 'https://vicparkwpg.com',
    email: 'infowinnipeg@vicpark.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin C', 'Myers Cocktail', 'Hydration', 'Medical Aesthetics'],
    description: 'Established Winnipeg medical spa with IV wellness menu including a high-dose vitamin C drip, broad-spectrum executive infusion, and gut and stress balance drip.',
  },
  {
    slug: 'dr-andrew-bryk-nd-natural-essentials-winnipeg',
    state: 'Manitoba',
    city: 'Winnipeg',
    name: 'Dr. Andrew Bryk, ND - Natural Essentials',
    address: '667 Stafford St, Winnipeg, MB',
    postal_code: null,
    phone: '204-510-4003',
    website: 'https://www.drabryknd.com',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Advanced Injection Therapies', 'Ozone Therapy', 'Acupuncture', 'Naturopathic Medicine'],
    description: 'Solo naturopathic practice run by Dr. Andrew Bryk ND. MAND and CNDMB registered with IV Therapy, advanced injection, and oxidative therapy certifications.',
  },
  {
    slug: 'centre-for-natural-medicine-winnipeg',
    state: 'Manitoba',
    city: 'Winnipeg',
    name: 'Centre for Natural Medicine',
    address: '1218 Lorette Ave, Winnipeg, MB R3M 1W5',
    postal_code: 'R3M 1W5',
    phone: '204-488-6528',
    website: 'https://naturalmedicine.mb.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Digestive Health', 'Fertility', 'Pain Management'],
    description: 'Multi-doctor naturopathic clinic (6 NDs on staff) with a dedicated IV therapy service page. One of Winnipeg longest-standing naturopathic groups.',
  },
  {
    slug: 'physigo-mobile-winnipeg',
    state: 'Manitoba',
    city: 'Winnipeg',
    name: 'PhysiGO Mobile (Winnipeg)',
    address: 'Mobile service, Winnipeg + surrounding rural MB',
    postal_code: null,
    phone: '431-303-5050',
    website: 'https://physigomobile.com',
    email: 'info@physigomobile.com',
    category: 'Mobile IV',
    type: 'Mobile',
    specialties: ['IV Therapy', 'Mobile IV', 'Hydration', 'In-Home Therapy'],
    description: 'Mobile physiotherapy and wellness service that includes in-home IV saline and hydration. Serves Winnipeg plus Morris and Steinbach.',
  },

  // ============ HALIFAX, NS (3) ============
  {
    slug: 'optimal-wellbeing-clinic-halifax',
    state: 'Nova Scotia',
    city: 'Halifax',
    name: 'Optimal Wellbeing Clinic',
    address: '6140 Young St, Halifax, NS B3K 0G2',
    postal_code: 'B3K 0G2',
    phone: '902-406-4424',
    website: 'https://optimalwellbeing.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Vitamin C', 'NAD+', 'Glutathione', 'Ozone Therapy', 'Naturopathic Medicine'],
    description: 'Naturopathic and integrative clinic on Young St owned by Joann Osbourne ND. Strong IV menu (Myers, high-dose C, NAD+, glutathione) plus EBOO and ozone.',
  },
  {
    slug: 'tbt-medical-halifax-halifax',
    state: 'Nova Scotia',
    city: 'Halifax',
    name: 'TBT Medical Halifax',
    address: '1959 Upper Water St, Suite 1301, Tower 1, Halifax, NS B3J 3N2',
    postal_code: 'B3J 3N2',
    phone: '902-484-2116',
    website: 'https://tbtmedicalhalifax.com',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['NAD+', 'IV Therapy', 'Hormone Therapy', 'Functional Medicine', 'Weight Loss'],
    description: 'Nurse-practitioner-led (Tanya Zboril NP) functional medicine clinic in downtown Halifax with a dedicated NAD+ IV page.',
  },
  {
    slug: 'luminate-co-wellness-centre-halifax',
    state: 'Nova Scotia',
    city: 'Halifax',
    name: 'Luminate Co Wellness Centre',
    address: '486 Starboard Dr, Halifax, NS B3M 0N6',
    postal_code: 'B3M 0N6',
    phone: '902-835-9319',
    website: 'https://luminateco.ca',
    email: 'Clinic@Luminateco.ca',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Glutathione', 'Naturopathic Medicine', 'Acupuncture', 'Massage'],
    description: 'Multi-practitioner wellness centre with on-site supplement store and a dedicated naturopathic IV menu (nutrient mix, glutathione, phosphatidylcholine).',
  },

  // ============ DARTMOUTH, NS (1) ============
  {
    slug: 'dermedical-esthetics-dartmouth',
    state: 'Nova Scotia',
    city: 'Dartmouth',
    name: 'DerMedical Esthetics',
    address: '250 Baker Dr, Suite 223, Dartmouth, NS B2W 6L4',
    postal_code: 'B2W 6L4',
    phone: '902-435-8614',
    website: 'https://www.dermedicalesthetics.ca',
    email: 'dermedicalesthetics.reception@gmail.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Injections', 'Medical Aesthetics'],
    description: 'Dartmouth medical spa with a dedicated vitamin therapy and IV therapy page (60 to 90 minute sessions).',
  },

  // ============ BEDFORD, NS (1) ============
  {
    slug: 'east-coast-naturopathic-clinic-bedford',
    state: 'Nova Scotia',
    city: 'Bedford',
    name: 'East Coast Naturopathic Clinic',
    address: '30 Damascus Rd, Suite 101, Bedford, NS B4A 0C1',
    postal_code: 'B4A 0C1',
    phone: '902-252-3080',
    website: 'https://eastcoastnaturopathic.com',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Chelation', 'Ozone Therapy', 'Naturopathic Medicine', 'Vitamin Injections'],
    description: 'Dr. Bryan Rade Bedford-based group practice with a wide IV and oxidative menu. One of the most advanced naturopathic IV programs in metro Halifax.',
  },
];

function normDomain(url) { if (!url) return null; try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; } }

(async () => {
  const receipt = { phase: 'insert-winnipeg-halifax-9', timestamp: new Date().toISOString(), inserted: [], skipped_slug_exists: [], skipped_domain_exists: [], errors: [] };
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
    const payload = { ...COMMON, state: c.state, slug: c.slug, name: c.name, city: c.city, address: c.address, postal_code: c.postal_code, phone: c.phone, website: c.website, email: c.email, email_quality: c.email ? 'medium' : null, category: c.category, type: c.type, specialties: c.specialties, description: c.description, rating: null, reviews: null };
    const { data, error } = await sb.from('providers').insert(payload).select('id, slug, city, type').single();
    if (error) { console.log('! ' + c.slug + ' failed: ' + error.message); receipt.errors.push({ slug: c.slug, error: error.message }); continue; }
    const mobile = (data.type === 'Mobile' || data.type === 'Both') ? ' [MOBILE]' : '';
    receipt.inserted.push({ id: data.id, slug: data.slug, city: data.city, type: data.type });
    console.log('+ ' + data.city.padEnd(10) + ' | ' + c.slug + mobile);
  }
  console.log();
  console.log('Inserted: ' + receipt.inserted.length + ' | Skipped slug: ' + receipt.skipped_slug_exists.length + ' | Skipped domain: ' + receipt.skipped_domain_exists.length + ' | Errors: ' + receipt.errors.length);
  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'insert-winnipeg-halifax-9-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
