/**
 * Insert 22 GTA satellite HIGH-confidence IV clinics (2026-06-07).
 * Particularly important: Etobicoke, Scarborough, North York clinics flagged
 * MEDIUM by agent (potential Toronto-DB overlap) — pre-flight will catch
 * any with shared website domains.
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
    source: 'agent_research_gta_satellites_2026_06_07',
    research_method: 'web_search + operator approval (HIGH-confidence only)',
    enriched_at: new Date().toISOString(),
  },
};

const CLINICS = [
  // ============ BRAMPTON (3) ============
  {
    slug: 'fleur-aesthetics-brampton',
    city: 'Brampton',
    name: 'Fleur Aesthetics',
    address: '11755 Bramalea Rd, Unit 4, Brampton, ON',
    postal_code: null,
    phone: null,
    website: 'https://www.fleuraesthetics.ca',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Drips', 'Medical Aesthetics'],
    description: 'Brampton Bramalea medical spa offering IV drip therapy administered by trained medical professionals.',
  },
  {
    slug: 'glamore-beauty-bar-skin-and-laser-clinic-brampton',
    city: 'Brampton',
    name: 'Glamore Beauty Bar Skin & Laser Clinic',
    address: '16 Main St S, Brampton, ON L6W 2C3',
    postal_code: 'L6W 2C3',
    phone: '647-983-6269',
    website: 'https://www.glamorebeautybar.com',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Drips', 'Microneedling', 'PRP', 'Medical Aesthetics'],
    description: 'Downtown Brampton luxury medical spa with regenerative aesthetics focus and IV vitamin therapy.',
  },
  {
    slug: 'natures-touch-naturopathic-clinic-brampton',
    city: 'Brampton',
    name: 'Nature\'s Touch Naturopathic Clinic',
    address: '50 Sunny Meadow Blvd, Suite #304, Brampton, ON L6R 0Y7',
    postal_code: 'L6R 0Y7',
    phone: '905-497-3200',
    website: 'https://www.naturestouchnd.ca',
    email: 'info@naturestouchnd.ca',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Injections', 'Naturopathic Medicine'],
    description: 'Established Brampton naturopathic clinic with dedicated IV suite.',
  },

  // ============ MARKHAM (2) ============
  {
    slug: 'ketamind-health-markham',
    city: 'Markham',
    name: 'Ketamind Health',
    address: 'Markham, ON',
    postal_code: null,
    phone: '416-343-0074',
    website: 'https://ketamindhealth.ca',
    email: 'hello@ketamindhealth.ca',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Glutathione', 'Myers Cocktail', 'Ketamine Infusion'],
    description: 'Markham-based ketamine and IV clinic serving GTA. Offers Myers Cocktail, NAD+, and glutathione alongside IV ketamine therapy.',
  },
  {
    slug: 'centre-for-advanced-medicine-markham',
    city: 'Markham',
    name: 'Centre for Advanced Medicine - Markham',
    address: '12 Main Street N., Markham, ON L3P 1X2',
    postal_code: 'L3P 1X2',
    phone: '905-655-7100',
    website: 'https://advancedmedicine.ca',
    email: 'info@advancedmedicine.ca',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Iron Infusion', 'Naturopathic Medicine', 'PRP'],
    description: 'Markham clinic with dedicated Infusion Lounge serving chronic-disease, immune-support, and longevity patients.',
  },

  // ============ RICHMOND HILL (3) ============
  {
    slug: 'grand-genesis-plastic-surgery-richmond-hill',
    city: 'Richmond Hill',
    name: 'Grand Genesis Plastic Surgery',
    address: '9080 Yonge St, 2nd Floor (South Wing) Unit 12, Richmond Hill, ON L4C 0Y7',
    postal_code: 'L4C 0Y7',
    phone: '289-597-7676',
    website: 'https://www.grandgenesisplasticsurgery.ca',
    email: 'info@grandgenesisplasticsurgery.ca',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Vitamin Infusions'],
    description: 'Self-described largest hospital-grade multidisciplinary plastic surgery centre in Ontario; offers NAD+ IV alongside surgical and aesthetic services.',
  },
  {
    slug: 'meridian-spine-and-sport-richmond-hill',
    city: 'Richmond Hill',
    name: 'Meridian Spine + Sport',
    address: '13321 Yonge Street, Unit 205, Richmond Hill, ON L4E 0K5',
    postal_code: 'L4E 0K5',
    phone: '905-773-5794',
    website: 'https://www.meridianspineandsport.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Chiropractic', 'Physiotherapy', 'Massage'],
    description: 'Multi-disciplinary clinic in north Richmond Hill (Yonge and Elgin Mills) with IV therapy delivered by naturopaths as part of complete treatment plans.',
  },
  {
    slug: 'dr-gabriella-chow-nd-richmond-hill',
    city: 'Richmond Hill',
    name: 'Dr. Gabriella Chow, ND',
    address: '469 16th Avenue, Richmond Hill, ON L4C 7A7',
    postal_code: 'L4C 7A7',
    phone: '905-597-1331',
    website: 'http://www.richmondhillnaturopath.com',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Parenteral Therapy', 'Naturopathic Medicine', 'Herbal Medicine'],
    description: 'Solo practice of Dr. Gabriella Chow ND with 10+ years of parenteral and IV experience. Involved with CCNM IV certification course.',
  },

  // ============ NORTH YORK (1) ============
  {
    slug: 'the-mom-loft-north-york',
    city: 'North York',
    name: 'The Mom Loft',
    address: '20 De Boers Drive, Suite 420, North York, ON M3J 0H1',
    postal_code: 'M3J 0H1',
    phone: '416-649-6650',
    website: 'https://themomloft.com',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Hydration', 'Postpartum Support', 'Vitamin Drips'],
    description: 'First-of-its-kind doctor-led maternal care centre in North York with full IV menu, postpartum support, and laser skin services.',
  },

  // ============ ETOBICOKE (7) ============
  {
    slug: 'atheria-wellness-etobicoke',
    city: 'Etobicoke',
    name: 'Atheria Wellness',
    address: '3074 Bloor Street West, Etobicoke, ON',
    postal_code: null,
    phone: '647-619-4766',
    website: 'https://www.atheriawellness.com',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Iron Infusion', 'Vitamin Injections', 'Pregnancy Support'],
    description: 'Etobicoke (Kingsway) clinic specialising in IV iron infusion and individualised IV vitamin/mineral regimens. Specifically serves pregnancy and postpartum iron-deficiency patients.',
  },
  {
    slug: 'care-clinic-on-albion-etobicoke',
    city: 'Etobicoke',
    name: 'Care Clinic on Albion',
    address: '1525 Albion Road, Unit 207, Etobicoke, ON M9V 5G5',
    postal_code: 'M9V 5G5',
    phone: '647-331-8343',
    website: 'https://carecliniconalbion.ca',
    email: 'info@carecliniconalbion.ca',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Infusions', 'Sclerotherapy', 'PRP', 'Microneedling'],
    description: 'Walk-in medical clinic in Albion (NW Etobicoke) with IV Nutrition Therapy service line. Family-medicine attached.',
  },
  {
    slug: 'foundation-health-etobicoke-medical-clinic-etobicoke',
    city: 'Etobicoke',
    name: 'Foundation Health - Etobicoke Medical Clinic',
    address: '600 The East Mall, Etobicoke, ON',
    postal_code: null,
    phone: '1-888-831-9116',
    website: 'https://foundationhealth.ca',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Hydration', 'Vitamin Infusions', 'Family Medicine'],
    description: 'Grand-opened November 2024. CPSO-certified family-doctor team adding IV therapy as a service.',
  },
  {
    slug: 'purete-medical-spa-etobicoke',
    city: 'Etobicoke',
    name: 'Purete Medical Spa',
    address: '2731 Lake Shore Boulevard West, Etobicoke, ON M8V 1G9',
    postal_code: 'M8V 1G9',
    phone: '416-887-5160',
    website: 'https://www.puretehealth.ca',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Hydration', 'Immune Support', 'PRP', 'Medical Aesthetics'],
    description: 'Lake Shore Blvd medical spa with dedicated Etobicoke IV menu (Purete Signature Infusions).',
  },
  {
    slug: 'skin-studio-toronto-etobicoke',
    city: 'Etobicoke',
    name: 'Skin Studio Toronto',
    address: '170 N Queen St, Suite 19 (Unit K), Etobicoke, ON M9C 1A8',
    postal_code: 'M9C 1A8',
    phone: '647-227-6377',
    website: 'https://www.skinstudiotoronto.ca',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Drips', 'Skin Rejuvenation'],
    description: 'Etobicoke (Queensway) medical spa with custom IV blends for energy, immune support, and wellness.',
  },
  {
    slug: 'vhmec-etobicoke',
    city: 'Etobicoke',
    name: 'Visionary Health Medical Educational Clinic (VHMEC)',
    address: '5359 Dundas Street West, Unit 108, Etobicoke, ON M9B 1B1',
    postal_code: 'M9B 1B1',
    phone: '647-478-9029',
    website: 'https://www.vhmec.com',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Acupuncture', 'Osteopathy'],
    description: 'Etobicoke (Kipling/Dundas) holistic wellness clinic with NP-administered IV therapy menu.',
  },
  {
    slug: 'the-borough-health-and-wellness-etobicoke',
    city: 'Etobicoke',
    name: 'The Borough Health & Wellness',
    address: '408 Brown\'s Line, Suite 114, Etobicoke, ON M8W 0C3',
    postal_code: 'M8W 0C3',
    phone: null,
    website: 'https://www.theborough.to',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Drips', 'Hydration', 'Recovery'],
    description: 'Long Branch / South Etobicoke wellness clinic with IV menu including hydration, recovery, and wellness drips.',
  },

  // ============ SCARBOROUGH (2) ============
  {
    slug: 'scarborough-naturopathic-clinic-scarborough',
    city: 'Scarborough',
    name: 'Scarborough Naturopathic Clinic',
    address: '716 Gordon Baker Road, Suite 100, Scarborough, ON',
    postal_code: null,
    phone: '647-287-1063',
    website: 'https://scarboroughnaturopathic.com',
    email: 'info@scarboroughnaturopathic.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin C', 'Glutathione', 'Naturopathic Medicine'],
    description: 'CONO-approved for IV therapy since October 2018. Naturopathic clinic at Victoria Park / Steeles.',
  },
  {
    slug: 'silk-aesthetic-skin-clinic-scarborough',
    city: 'Scarborough',
    name: 'Silk Aesthetic Skin Clinic',
    address: '1200 Markham Road, Suite 121, Scarborough, ON M1H 3C3',
    postal_code: 'M1H 3C3',
    phone: '647-514-7455',
    website: 'https://www.silkaestheticclinic.com',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Drips', 'Laser', 'Skin Treatments'],
    description: '4.9-star Filipino-owned skin clinic on Markham Rd with dedicated IV nutritional drips service line.',
  },

  // ============ VAUGHAN / CONCORD (3) ============
  {
    slug: 'centre-for-health-and-performance-vaughan',
    city: 'Vaughan',
    name: 'Centre for Health & Performance (CHP)',
    address: '2640 Rutherford Road, Suite 201, Vaughan, ON L4K 0H3',
    postal_code: 'L4K 0H3',
    phone: '905-553-4814',
    website: 'https://www.chperformance.ca',
    email: 'info@chperformance.ca',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Chiropractic', 'Physiotherapy', 'Massage'],
    description: 'Rutherford corridor multi-disciplinary clinic with naturopath-led IV nutrient therapy.',
  },
  {
    slug: 'venice-cosmetic-clinic-vaughan',
    city: 'Vaughan',
    name: 'Venice Cosmetic Clinic',
    address: '3530 Rutherford Road, Unit 77, Vaughan, ON L4H 3T8',
    postal_code: 'L4H 3T8',
    phone: '647-535-4990',
    website: 'https://venicecosmetic.com',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Glutathione', 'Vitamin Drips', 'PRP', 'Medical Aesthetics'],
    description: 'Custom IV drips by RNs in Vaughan. Established medical spa.',
  },
  {
    slug: 'beautify-skin-clinic-concord',
    city: 'Concord',
    name: 'Beautify Skin Clinic',
    address: '1600 Steeles Avenue West, Unit 26, Concord, ON L4K 4M2',
    postal_code: 'L4K 4M2',
    phone: '905-788-8008',
    website: 'https://beautifygroup.com',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Drips', 'Body Contouring', 'Medical Aesthetics'],
    description: 'Steeles/Vaughan medical spa with personalized IV vitamin drips.',
  },

  // ============ MOBILE (1) ============
  {
    slug: 'mobile-iv-canada-toronto',
    city: 'Toronto',
    name: 'Mobile IV Canada',
    address: 'Mobile service, Toronto + GTA',
    postal_code: null,
    phone: null,
    website: 'https://mobileivcanada.com',
    email: null,
    category: 'Mobile IV',
    type: 'Mobile',
    specialties: ['IV Therapy', 'Mobile IV', 'Hydration', 'Hangover Recovery', 'Immune Support'],
    description: 'RN-administered mobile IV across Toronto and GTA (Toronto, Oakville, Burlington, Hamilton, Barrie, Innisfil, Orangeville, Bowmanville, Oshawa).',
  },
];

function normDomain(url) { if (!url) return null; try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; } }

(async () => {
  const receipt = { phase: 'insert-gta-satellites-22', timestamp: new Date().toISOString(), inserted: [], skipped_slug_exists: [], skipped_domain_exists: [], errors: [] };
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
    console.log('+ ' + data.city.padEnd(14) + ' | ' + c.slug + mobile);
  }
  console.log();
  console.log('Inserted: ' + receipt.inserted.length + ' | Skipped slug: ' + receipt.skipped_slug_exists.length + ' | Skipped domain: ' + receipt.skipped_domain_exists.length + ' | Errors: ' + receipt.errors.length);
  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'insert-gta-satellites-22-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
