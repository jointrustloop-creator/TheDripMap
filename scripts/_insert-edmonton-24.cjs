/**
 * Insert 24 Edmonton-area IV clinics (2026-06-07) from agent's HIGH-confidence
 * research pass. Pre-flights against both slug AND website domain to catch
 * sneaky duplicates (slight name variations on same brand).
 *
 * MEDIUM/LOW candidates from the research report deliberately excluded —
 * those need a human verification pass before insertion.
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
  state: 'Alberta',
  is_hidden: false,
  is_claimed: false,
  is_featured: false,
  availability: true,
  decision_drivers: {
    source: 'agent_research_edmonton_2026_06_07',
    research_method: 'web_search + operator approval (HIGH-confidence only)',
    enriched_at: new Date().toISOString(),
  },
};

const CLINICS = [
  // ============ EDMONTON (18 HIGH) ============
  {
    slug: 'west-edmonton-naturopathic-wellness-centre-edmonton',
    city: 'Edmonton',
    name: 'West Edmonton Naturopathic Wellness Centre',
    address: '11356 119 St NW, Edmonton, AB T5G 2X4',
    postal_code: 'T5G 2X4',
    phone: '780-761-2889',
    website: 'https://westedmontonnaturopathic.com',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Myers Cocktail', 'Hydration', 'Glutathione', 'Vitamin C', 'Vitamin Injections'],
    description: 'Naturopathic clinic with a dedicated IV menu including Myers Push, Myers IV Drip, NAD+, glutathione IV, and vitamin C IV. ND-run with a full IM/IV booster program.',
  },
  {
    slug: 'the-genomic-clinic-edmonton',
    city: 'Edmonton',
    name: 'The Genomic Clinic',
    address: '16923 127 St, Edmonton, AB T6V 0T1',
    postal_code: 'T6V 0T1',
    phone: '780-476-5637',
    website: 'https://www.thegenomicclinic.com',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Infusions', 'Functional Medicine', 'Anti-Aging'],
    description: 'Functional and anti-aging clinic founded by Dr. Harvey Rao MD, with a dedicated IV vitamin lounge and physician-supervised micronutrient infusions.',
  },
  {
    slug: 'naturally-inclined-health-edmonton',
    city: 'Edmonton',
    name: 'Naturally Inclined Health',
    address: 'Suite 300, 8225 105 St NW, Edmonton, AB',
    postal_code: null,
    phone: '780-757-7700',
    website: 'https://www.naturallyinclinedhealth.com',
    email: 'info@naturallyinclinedhealth.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Functional Medicine'],
    description: 'Integrated medical clinic offering prescription-based custom IV formulas; intake appointment required.',
  },
  {
    slug: 'smrt-health-edmonton',
    city: 'Edmonton',
    name: 'SMRT Health',
    address: '14256 23 Ave NW, Edmonton, AB',
    postal_code: null,
    phone: null,
    website: 'https://smrthealth.com',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Acupuncture', 'Clinical Nutrition', 'Anti-Aging'],
    description: 'Multidisciplinary naturopathic clinic in southwest Edmonton with IV therapy alongside lab testing, acupuncture, and hormone and anti-aging programs.',
  },
  {
    slug: 'flow-functional-health-care-edmonton',
    city: 'Edmonton',
    name: 'Flow Functional Health Care',
    address: 'Unit 101, 6915 109 St NW, Edmonton, AB',
    postal_code: null,
    phone: '780-760-3569',
    website: 'https://www.flowyeg.ca',
    email: 'admin@flowyeg.ca',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Injections', 'Naturopathic Medicine', 'Functional Medicine'],
    description: 'Multidisciplinary functional and naturopathic clinic with a dedicated IV therapy service; high-dose vitamins and minerals via IV.',
  },
  {
    slug: 'edmonton-iron-clinic-edmonton',
    city: 'Edmonton',
    name: 'Edmonton Iron Clinic',
    address: '#101, 3204 Parsons Rd NW, Edmonton, AB',
    postal_code: null,
    phone: '587-454-2413',
    website: 'https://www.edmontonironclinic.ca',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['Iron Infusion', 'IV Therapy'],
    description: 'Dedicated private iron-infusion clinic with an RN-led infusion team; short wait times and 15+ years of infusion experience.',
  },
  {
    slug: 'infuse-health-inc-edmonton',
    city: 'Edmonton',
    name: 'Infuse Health Inc.',
    address: '6019 199 St NW, Edmonton, AB',
    postal_code: null,
    phone: '780-720-9229',
    website: 'https://www.infusehealthinc.com',
    email: 'infusehealthiv@gmail.com',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Iron Infusion', 'Vitamin Injections', 'MPS Therapy'],
    description: 'Private nurse-led IV clinic on Edmonton west side offering vitamin IV drips, vitamin injections, iron infusions, and MPS therapy.',
  },
  {
    slug: 'solis-medical-clinic-edmonton',
    city: 'Edmonton',
    name: 'Solis Medical Clinic',
    address: '16534 118 Ave NW, Edmonton, AB T5V 1P1',
    postal_code: 'T5V 1P1',
    phone: '780-896-0405',
    website: 'https://www.solismedclinic.com',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Iron Infusion', 'Vitamin Infusions', 'Migraine Infusions'],
    description: 'Multidisciplinary chronic-pain clinic with an in-house IV infusion centre offering prescription iron infusions, migraine infusions, and a vitamin infusion menu under physician supervision.',
  },
  {
    slug: 'nutridrip-and-wellness-edmonton',
    city: 'Edmonton',
    name: 'NutriDrip & Wellness Inc.',
    address: '19643 26 Ave, Edmonton, AB',
    postal_code: null,
    phone: null,
    website: 'https://nutridripwellness.ca',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Glutathione', 'Iron Infusion', 'Vitamin Injections'],
    description: 'IV therapy clinic in southwest Edmonton using pre-compounded FARSK Health Canadian-manufactured IV bags; glutathione, admixture injections, and iron infusion therapy.',
  },
  {
    slug: 'alpine-health-naturopathic-clinic-edmonton',
    city: 'Edmonton',
    name: 'Alpine Health Naturopathic Clinic',
    address: '1547 Hector Rd NW, Edmonton, AB',
    postal_code: null,
    phone: '780-628-2991',
    website: 'https://www.alpinehealth.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'IV Chelation', 'Ozone Therapy', 'Naturopathic Medicine'],
    description: 'Solo-ND clinic offering custom IV therapy plus IV chelation, ozone therapy, and complementary oncology support.',
  },
  {
    slug: 'rejuvaderm-cosmetic-dermatology-edmonton',
    city: 'Edmonton',
    name: 'Rejuvaderm Cosmetic Dermatology & Laser',
    address: '201A, 14101 West Block Dr NW, Edmonton, AB T5N 1L5',
    postal_code: 'T5N 1L5',
    phone: '780-665-4646',
    website: 'https://www.rejuvaderm.ca',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Infusions', 'Cosmetic Dermatology'],
    description: 'Established cosmetic dermatology and laser group with a signature IV infusion and vitamin therapy menu for energy, hydration, and rejuvenation.',
  },
  {
    slug: 'true-movement-edmonton-edmonton',
    city: 'Edmonton',
    name: 'True Movement Edmonton',
    address: '11204 178 St NW, Edmonton, AB T5S 1P2',
    postal_code: 'T5S 1P2',
    phone: null,
    website: 'https://truemovement.ca',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Infusions', 'Recovery', 'Hydration'],
    description: 'Movement and training studio in west Edmonton with a clinically-led IV vitamin therapy program for hydration, detox, immune support, and recovery.',
  },
  {
    slug: 'cove-chiropractic-and-wellness-edmonton',
    city: 'Edmonton',
    name: 'Cove Chiropractic & Wellness',
    address: '316 Windermere Rd NW #306, Edmonton, AB T6W 2Z8',
    postal_code: 'T6W 2Z8',
    phone: '780-498-1880',
    website: 'https://www.covechirowellness.com',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Injections', 'Hydration'],
    description: 'Windermere chiropractic and wellness clinic offering customized IV drip and IM booster services in partnership with LivWell; 45 to 60 minute sessions in-clinic.',
  },

  // ============ ST. ALBERT (3 HIGH) ============
  {
    slug: 'st-albert-naturopathic-clinic-st-albert',
    city: 'St. Albert',
    name: 'St. Albert Naturopathic Clinic',
    address: '11 Perron St, St. Albert, AB T8N 1E3',
    postal_code: 'T8N 1E3',
    phone: '780-459-5601',
    website: 'https://www.npath.com',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Vitamin C', 'Chelation', 'Vitamin Injections'],
    description: 'Long-established downtown St. Albert naturopathic clinic with two dedicated IV-suite RNs; therapeutic injections, IV vitamin C, chelation, and IV nutrient program.',
  },
  {
    slug: 'wellness-within-st-albert',
    city: 'St. Albert',
    name: 'Wellness Within',
    address: '101 Riel Dr, St. Albert, AB T8N 3X4',
    postal_code: 'T8N 3X4',
    phone: '780-651-7365',
    website: 'https://www.wellness-within.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Vitamin Infusions'],
    description: 'Multidisciplinary wellness clinic inside the Enjoy Centre; ND-formulated IV infusions for energy, immune support, and nutrient absorption.',
  },
  {
    slug: 'rn-and-co-infusion-lounge-st-albert',
    city: 'St. Albert',
    name: 'RN & Co. Infusion Lounge',
    address: '101 Riel Dr, Upper Level, St. Albert, AB T8N 3X4',
    postal_code: 'T8N 3X4',
    phone: '780-903-5776',
    website: 'https://www.rninfusionlounge.ca',
    email: null,
    category: 'IV Therapy',
    type: 'Both',
    specialties: ['IV Therapy', 'NAD+', 'Vitamin Injections', 'Mobile IV'],
    description: 'RN-led infusion lounge serving Edmonton, St. Albert, and Sherwood Park both in-office and in-home; NAD+, custom vitamin drips, and first-time IV consults.',
  },

  // ============ SHERWOOD PARK (5 HIGH) ============
  {
    slug: 'excellence-medical-and-skin-care-clinic-sherwood-park',
    city: 'Sherwood Park',
    name: 'Excellence Medical & Skin Care Clinic',
    address: '76-80 Chippewa Rd, Sherwood Park, AB T8A 4W6',
    postal_code: 'T8A 4W6',
    phone: '780-570-5855',
    website: 'https://excellencemedicalandskincareclinic.com',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Hydration', 'Vitamin Infusions', 'Medical Aesthetics'],
    description: 'Physician-led skin and medical clinic in Sherwood Park with a dedicated IV therapy program for hydration, cellular nourishment, and wellness.',
  },
  {
    slug: 'relief-medical-centre-sherwood-park',
    city: 'Sherwood Park',
    name: 'Relief Medical Centre',
    address: '104 - 160 Broadway Blvd, Sherwood Park, AB T8B 2A3',
    postal_code: 'T8B 2A3',
    phone: '780-439-4417',
    website: 'https://www.reliefmedical.ca',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Iron Infusion', 'Hydration'],
    description: 'Walk-in and family clinic with in-house infusion services offering iron infusions, hydration therapy, and other IV infusions.',
  },
  {
    slug: 'body-and-mind-naturopathic-medicine-sherwood-park',
    city: 'Sherwood Park',
    name: 'Body & Mind Naturopathic Medicine (Dr. Kim Gowetor, ND)',
    address: '136, 11 Athabascan Ave, Sherwood Park, AB T8A 6H2',
    postal_code: 'T8A 6H2',
    phone: '780-328-9088',
    website: 'https://drkimnaturopath.ca',
    email: 'drkim@drkimnaturopath.ca',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'IM Injections', 'Naturopathic Medicine', 'Hormone Therapy'],
    description: 'Sherwood Park ND practice (CNDA-registered) offering IV and IM therapy alongside acupuncture, hormone, and chronic-condition care.',
  },
  {
    slug: 'luna-integrated-health-sherwood-park',
    city: 'Sherwood Park',
    name: 'Luna Integrated Health',
    address: '136, 2755 Broadmoor Blvd, Sherwood Park, AB T8H 2W7',
    postal_code: 'T8H 2W7',
    phone: '780-467-0522',
    website: 'https://lunahealth.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Vitamin Injections', 'Acupuncture'],
    description: 'Multidisciplinary integrated clinic in Sherwood Park; naturopathic care, injection therapies, and IV therapy alongside chiro, massage, osteopathy, and nutrition.',
  },
  {
    slug: 'enhanced-wellness-and-functional-medicine-sherwood-park',
    city: 'Sherwood Park',
    name: 'Enhanced Wellness & Functional Medicine',
    address: '895 Pembina Rd #170, Sherwood Park, AB T8H 3A5',
    postal_code: 'T8H 3A5',
    phone: '825-526-1499',
    website: 'https://enhancedaesthetics.ca',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Iron Infusion', 'Vitamin Infusions', 'Functional Medicine'],
    description: 'Functional medicine arm of Enhanced Aesthetics group offering IV vitamin infusions and iron infusions out of Sherwood Park (also a St. Albert location).',
  },

  // ============ SPRUCE GROVE (1 HIGH) ============
  {
    slug: 'vita-sana-naturopathic-wellness-clinic-spruce-grove',
    city: 'Spruce Grove',
    name: 'Vita Sana Naturopathic Wellness Clinic',
    address: '110, 5 Spruce Village Way, Spruce Grove, AB T7X 0B2',
    postal_code: 'T7X 0B2',
    phone: '780-948-0550',
    website: 'https://www.vitasanaclinic.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'IM Injections', 'Mesotherapy', 'Acupuncture'],
    description: 'Multidisciplinary naturopathic clinic serving Spruce Grove, Stony Plain, and west Edmonton; IV therapy and naturopathic injection therapies.',
  },

  // ============ LEDUC + BEAUMONT (2 HIGH) ============
  {
    slug: 'leduc-naturopathic-clinic-leduc',
    city: 'Leduc',
    name: 'Leduc Naturopathic Clinic',
    address: '201, 5306 50 St, Leduc, AB T9E 6Z6',
    postal_code: 'T9E 6Z6',
    phone: '780-986-1025',
    website: 'https://www.leducnaturopathic.com',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Infusions', 'Naturopathic Medicine'],
    description: 'Established naturopathic clinic in downtown Leduc offering IV vitamins and minerals as part of its naturopathic service menu.',
  },
  {
    slug: 'naturopathie-integrative-clinic-beaumont',
    city: 'Beaumont',
    name: 'Naturopathie Integrative Clinic',
    address: '4902 50 St, Beaumont, AB T4X 1E4',
    postal_code: 'T4X 1E4',
    phone: '780-737-0421',
    website: 'https://www.naturopathiend.com',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Naturopathic Injections'],
    description: 'Integrative naturopathic clinic in Beaumont with an additional Sylvan Lake location; IV therapy, naturopathic injections, massage, and nutritional counselling.',
  },
];

function normDomain(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

(async () => {
  const receipt = {
    phase: 'insert-edmonton-24',
    timestamp: new Date().toISOString(),
    inserted: [],
    skipped_slug_exists: [],
    skipped_domain_exists: [],
    errors: [],
  };

  // Pre-flight: load existing slugs + domains across ALL Canada (catches Toronto-domain dupes too)
  const { data: existing } = await sb
    .from('providers')
    .select('id, slug, website, city')
    .eq('country', 'Canada')
    .range(0, 1999);
  const existingSlugs = new Set(existing.map((p) => p.slug));
  const existingDomainMap = new Map();
  for (const p of existing) {
    const d = normDomain(p.website);
    if (d) existingDomainMap.set(d, { slug: p.slug, city: p.city });
  }
  console.log('Pre-flight: ' + existing.length + ' existing CA providers, ' + existingDomainMap.size + ' unique domains.');
  console.log();

  for (const c of CLINICS) {
    if (existingSlugs.has(c.slug)) {
      console.log('= [slug exists] ' + c.slug);
      receipt.skipped_slug_exists.push({ slug: c.slug });
      continue;
    }
    const candDomain = normDomain(c.website);
    if (candDomain && existingDomainMap.has(candDomain)) {
      const dup = existingDomainMap.get(candDomain);
      console.log('= [domain exists ' + candDomain + ' -> ' + dup.slug + ' in ' + dup.city + '] ' + c.slug);
      receipt.skipped_domain_exists.push({ candidate: c.slug, existing_slug: dup.slug, existing_city: dup.city, domain: candDomain });
      continue;
    }

    const payload = {
      ...COMMON,
      slug: c.slug,
      name: c.name,
      city: c.city,
      address: c.address,
      postal_code: c.postal_code,
      phone: c.phone,
      website: c.website,
      email: c.email,
      email_quality: c.email ? 'medium' : null,
      category: c.category,
      type: c.type,
      specialties: c.specialties,
      description: c.description,
      rating: null,
      reviews: null,
    };
    const { data, error } = await sb.from('providers').insert(payload).select('id, slug, city, type').single();
    if (error) {
      console.log('! ' + c.slug + ' failed: ' + error.message);
      receipt.errors.push({ slug: c.slug, error: error.message });
      continue;
    }
    const mobile = (data.type === 'Mobile' || data.type === 'Both') ? ' [MOBILE]' : '';
    receipt.inserted.push({ id: data.id, slug: data.slug, city: data.city, type: data.type, email: c.email });
    console.log('+ ' + data.city.padEnd(14) + ' | ' + c.slug + mobile);
  }

  console.log();
  console.log('Inserted:              ' + receipt.inserted.length);
  console.log('Skipped (slug exists): ' + receipt.skipped_slug_exists.length);
  console.log('Skipped (domain exists): ' + receipt.skipped_domain_exists.length);
  console.log('Errors:                ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'insert-edmonton-24-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
