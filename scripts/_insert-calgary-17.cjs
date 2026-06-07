/**
 * Insert 17 sourced Calgary-area IV therapy clinics (2026-06-07).
 *
 * Highlights:
 *   - 5 mobile-capable providers (Vena Airdrie, Flow IV, Viva Wellness
 *     Drip, Unity Collective Okotoks, PhysiGO) directly fill the
 *     zero-mobile gap the operator flagged.
 *   - 12 in-clinic including New Skin YYC (5.0 / 533+ reviews) and 3
 *     Essence Wellness chain locations beyond the already-listed
 *     Marda Loop branch.
 *
 * Idempotent: skip if slug exists. JSON receipt with row IDs.
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
    source: 'manual_calgary_research_2026_06_07',
    research_method: 'agent_web_research + operator approval',
    enriched_at: new Date().toISOString(),
  },
};

const CLINICS = [
  // ============ MOBILE-CAPABLE (5) — filling the priority gap ============
  {
    slug: 'vena-mobile-health-airdrie',
    city: 'Airdrie',
    name: 'Vena Mobile Health',
    address: '117 1 St NW, Airdrie, AB T4B 0R4',
    postal_code: 'T4B 0R4',
    phone: '403-850-1617',
    website: 'https://venamobilehealth.com',
    email: 'info@venamobilehealth.com',
    category: 'Mobile IV',
    type: 'Mobile',
    specialties: ['IV Therapy', 'Mobile IV', 'Hydration', 'Vitamin Injections', 'Hormone Therapy'],
    description: 'Mobile IV therapy and wellness service based in Airdrie, serving Calgary and Cochrane. Offers IV nutrient therapy, hydration, vitamin injections, hormone therapy, and lab collection at home or office.',
    rating: 5.0,
    reviews: '23',
  },
  {
    slug: 'flow-iv-health-and-wellness-calgary',
    city: 'Calgary',
    name: 'Flow IV Health & Wellness',
    address: 'Calgary, AB',
    postal_code: null,
    phone: '403-836-1513',
    website: 'https://flowiv.ca',
    email: null,
    category: 'Mobile IV',
    type: 'Both',
    specialties: ['IV Therapy', 'Mobile IV', 'Iron Infusion', 'Vitamin C', 'Hydration'],
    description: 'Mobile and in-clinic IV therapy serving Calgary, Airdrie, Chestermere, and Strathmore. Offers nutrient IV therapy, iron infusions, therapeutic phlebotomy, group IV sessions, and vitamin C, magnesium, B-complex, and iron drips.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'viva-wellness-drip-calgary-calgary',
    city: 'Calgary',
    name: 'Viva Wellness Drip Calgary',
    address: 'Calgary, AB',
    postal_code: null,
    phone: null,
    website: 'https://vivawellnessdrip.com/calgary',
    email: 'info@wwellness.co',
    category: 'Mobile IV',
    type: 'Mobile',
    specialties: ['IV Therapy', 'Mobile IV', 'Hydration', 'Hangover Recovery', 'Myers Cocktail', 'Immune Support'],
    description: 'Mobile-only IV therapy in Calgary offering Hydro Boost, Energy Boost, Hangover Recovery, Myers Cocktail, and Immune Boost protocols delivered to home, hotel, or office.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'unity-collective-studios-mobile-iv-okotoks',
    city: 'Okotoks',
    name: 'Unity Collective Studios (Mobile IV)',
    address: '49 Elma St W #101, Okotoks, AB T1S 1J6',
    postal_code: 'T1S 1J6',
    phone: '403-992-0939',
    website: 'https://unitycollectivestudios.com/mobile-iv',
    email: 'unitycollectivestudios@gmail.com',
    category: 'Mobile IV',
    type: 'Both',
    specialties: ['IV Therapy', 'Mobile IV', 'NAD+', 'Myers Cocktail', 'Hydration'],
    description: 'Okotoks-based clinic with mobile IV service for south Calgary. Offers mobile IV, IV parties, NAD+, Myers Cocktail, hydration, and vitamin drips.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'physigo-mobile-calgary',
    city: 'Calgary',
    name: 'PhysiGO Mobile',
    address: 'Calgary, AB',
    postal_code: null,
    phone: '587-205-6686',
    website: 'https://physigomobile.com',
    email: 'info@physigomobile.com',
    category: 'Mobile IV',
    type: 'Mobile',
    specialties: ['IV Therapy', 'Mobile IV', 'Hydration', 'Immune Support', 'Athletic Recovery'],
    description: 'Mobile-only IV therapy in Calgary offering in-home saline and hydration IVs, vitamin drips, recovery, and immunity protocols.',
    rating: null,
    reviews: null,
  },

  // ============ IN-CLINIC (12) ============
  {
    slug: 'new-skin-yyc-calgary',
    city: 'Calgary',
    name: 'New Skin YYC',
    address: '5116 Elbow Dr SW, Calgary, AB T2V 1H1',
    postal_code: 'T2V 1H1',
    phone: '587-857-5407',
    website: 'https://newskinyyc.ca',
    email: 'info@newskinyyc.ca',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Hydration', 'Hangover Recovery', 'Immune Support', 'Glutathione'],
    description: 'Calgary medical spa offering IV hydration, hangover IV, vitamin and immunity drips, and glutathione IV. Standout patient reviews on Google.',
    rating: 5.0,
    reviews: '533',
  },
  {
    slug: 'yhvh-medical-and-aesthetic-clinic-calgary',
    city: 'Calgary',
    name: 'YHVH Medical & Aesthetic Clinic',
    address: 'Unit #335, 10980 38 St NE, Calgary, AB T3N 1Z2',
    postal_code: 'T3N 1Z2',
    phone: '587-468-8601',
    website: 'https://yhvhclinic.ca',
    email: 'admin@yhvhclinic.ca',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Hydration', 'Immune Support', 'Energy Boost'],
    description: 'Calgary medical and aesthetic clinic offering Farsk-branded IV drips including hydration, immune, detox, energy, and performance protocols.',
    rating: 4.6,
    reviews: '222',
  },
  {
    slug: 'zulu-medical-cosmetics-calgary',
    city: 'Calgary',
    name: 'Zulu Medical Cosmetics',
    address: '324 58 Ave SE #1110, Calgary, AB T2H 0P1',
    postal_code: 'T2H 0P1',
    phone: '403-692-9858',
    website: 'https://zulumedicalcosmetics.com',
    email: 'care@zulumc.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Hydration', 'Vitamin Injections'],
    description: 'Calgary medical cosmetics clinic offering NAD+ IV, REVIV-branded IV therapy, vitamin boosters, hydration, and hormone optimization.',
    rating: 4.5,
    reviews: '93',
  },
  {
    slug: 'calgary-integrative-medicine-calgary',
    city: 'Calgary',
    name: 'Calgary Integrative Medicine',
    address: '230, 4525 Monterey Ave NW, Calgary, AB T3B 0L4',
    postal_code: 'T3B 0L4',
    phone: '403-202-7272',
    website: 'https://calgaryintegrativemedicine.ca',
    email: 'info@calgarymed.ca',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Glutathione', 'NAD+', 'Naturopathic Medicine'],
    description: 'Calgary integrative medicine clinic offering custom IV nutrient therapy, Myers Cocktail, hydration, glutathione, and NAD+ infusions.',
    rating: 4.9,
    reviews: '39',
  },
  {
    slug: 'healthflow-naturopathic-clinic-calgary',
    city: 'Calgary',
    name: 'Healthflow Naturopathic Clinic',
    address: '118M-2204 2 St SW, Calgary, AB T2S 3C2',
    postal_code: 'T2S 3C2',
    phone: '403-313-4354',
    website: 'https://healthflow.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Hydration', 'Naturopathic Medicine'],
    description: 'Calgary naturopathic clinic offering Myers Cocktail, IV vitamin therapy, hydration, and root-cause IV protocols.',
    rating: 4.9,
    reviews: '55',
  },
  {
    slug: 'paradigm-health-group-dr-schlee-calgary',
    city: 'Calgary',
    name: "Dr. Schlee / Paradigm Health Group",
    address: '10333 Southport Rd SW, Calgary, AB T2W 3X6',
    postal_code: 'T2W 3X6',
    phone: '403-301-7406',
    website: 'https://drschlee.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'NAD+', 'Glutathione'],
    description: 'Calgary naturopathic clinic offering Myers Cocktail, NAD+, nutrient infusion, vitamin and mineral IV, ozone IV, and glutathione protocols.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'aisthetikos-wellness-calgary',
    city: 'Calgary',
    name: 'Aisthetikos Wellness & Advanced Medical Aesthetics',
    address: '201-2040 34 Ave SW, Calgary, AB T2T 2C3',
    postal_code: 'T2T 2C3',
    phone: '587-714-2545',
    website: 'https://aisthetikos.ca',
    email: 'hello@aisthetikos.ca',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Hydration', 'Immune Support', 'Vitamin Injections'],
    description: 'Calgary aesthetics and wellness clinic offering RN-administered IV vitamin therapy, hydration, performance, immune, and mental clarity drips.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'aeon-future-health-calgary',
    city: 'Calgary',
    name: 'Aeon Future Health',
    address: '200-903 10 Ave SW, Calgary, AB T2R 0B5',
    postal_code: 'T2R 0B5',
    phone: '403-389-1126',
    website: 'https://aeonfuturehealth.com',
    email: 'susan@aeonfuturehealth.com',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Iron Infusion', 'Hormone Therapy'],
    description: 'Calgary longevity and IV clinic offering NAD+ IV, longevity drips, iron infusions, and hormone/longevity IV protocols.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'pro-motion-calgary-calgary',
    city: 'Calgary',
    name: 'Pro Motion Calgary',
    address: '403-11012 Macleod Trail SE, Calgary, AB T2J 6A5',
    postal_code: 'T2J 6A5',
    phone: '403-452-5450',
    website: 'https://promotioncalgary.com',
    email: 'info@promotioncalgary.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Athletic Recovery', 'Vitamin Injections'],
    description: 'Calgary clinic offering custom naturopathic-doctor-formulated IV vitamin therapy, Myers Cocktail, and energy and recovery drips.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'essence-wellness-sage-hill-calgary',
    city: 'Calgary',
    name: 'Essence Wellness - Sage Hill',
    address: '111-60 Sage Hill Plaza NW, Calgary, AB T3R 0S4',
    postal_code: 'T3R 0S4',
    phone: '403-383-2338',
    website: 'https://essencewellness.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'NAD+', 'Glutathione', 'Hydration'],
    description: 'Sage Hill location of Essence Wellness. Offers Myers Cocktail, tiered NAD+ protocols (Boost, Enhanced, Supreme), IV saline, and glutathione drips.',
    rating: 4.9,
    reviews: null,
  },
  {
    slug: 'essence-wellness-willow-park-calgary',
    city: 'Calgary',
    name: 'Essence Wellness - Willow Park',
    address: '100-10816 Macleod Trail SE, Calgary, AB',
    postal_code: null,
    phone: '403-891-1941',
    website: 'https://essencewellness.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'NAD+', 'Glutathione', 'Hydration'],
    description: 'Willow Park location of Essence Wellness. Offers Myers Cocktail, tiered NAD+ protocols, IV saline, and glutathione drips.',
    rating: 4.9,
    reviews: null,
  },
  {
    slug: 'essence-wellness-mahogany-calgary',
    city: 'Calgary',
    name: 'Essence Wellness - Mahogany',
    address: 'Mahogany, Calgary, AB',
    postal_code: null,
    phone: '403-891-1901',
    website: 'https://essencewellness.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'NAD+', 'Glutathione', 'Hydration'],
    description: 'Mahogany location of Essence Wellness. Offers Myers Cocktail, NAD+ protocols, glutathione, and IV hydration.',
    rating: 4.9,
    reviews: null,
  },
];

(async () => {
  const receipt = {
    phase: 'insert-calgary-17',
    timestamp: new Date().toISOString(),
    inserted: [],
    skipped_existing: [],
    errors: [],
  };

  for (const c of CLINICS) {
    const { data: existing } = await sb.from('providers').select('id, slug').eq('slug', c.slug).maybeSingle();
    if (existing) {
      console.log('= ' + c.slug + ' already exists, skipping');
      receipt.skipped_existing.push({ slug: c.slug, existing_id: existing.id });
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
      rating: c.rating,
      reviews: c.reviews,
    };
    const { data, error } = await sb.from('providers').insert(payload).select('id, slug, city, type').single();
    if (error) {
      console.log('! ' + c.slug + ' failed: ' + error.message);
      receipt.errors.push({ slug: c.slug, error: error.message });
      continue;
    }
    const mobile = (data.type === 'Mobile' || data.type === 'Both') ? ' [MOBILE]' : '';
    receipt.inserted.push({ id: data.id, slug: data.slug, city: data.city, type: data.type, name: c.name, email: c.email });
    console.log('✓ ' + data.city.padEnd(10) + ' | ' + c.slug + mobile);
  }

  console.log();
  console.log('Inserted: ' + receipt.inserted.length);
  console.log('Skipped (already exists): ' + receipt.skipped_existing.length);
  console.log('Errors: ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'insert-calgary-17-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt:', outPath);
})();
