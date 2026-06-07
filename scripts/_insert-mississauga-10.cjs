/**
 * Insert 10 sourced Mississauga IV therapy clinics (2026-06-07).
 *
 * Operator-approved batch from the agent-sourced candidate list. Skips:
 *   - #1 Aafiyat (existing duplicate at aafiyat-aesthetics-mississauga)
 *   - #2 NewM (existing in DB tagged to Newmarket HQ)
 *   - Pattented + Revitalise (low public footprint, hold for manual verify)
 *
 * Idempotent: re-running checks slug before insert. JSON receipt with row
 * IDs written for reversibility.
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
  city: 'Mississauga',
  is_hidden: false,
  is_claimed: false,
  is_featured: false,
  availability: true,
  decision_drivers: {
    source: 'manual_mississauga_research_2026_06_07',
    research_method: 'agent_web_research + operator approval',
    enriched_at: new Date().toISOString(),
  },
};

const CLINICS = [
  {
    slug: 'erin-mills-optimum-health-mississauga',
    name: 'Erin Mills Optimum Health',
    address: '3105 Glen Erin Dr #5, Mississauga, ON L5L 1J3',
    postal_code: 'L5L 1J3',
    phone: '905-828-2014',
    website: 'https://erinmillshealth.com',
    email: null,
    category: 'Chiropractic Clinic',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin C', 'Naturopathic Medicine', 'Chiropractic'],
    description: 'Erin Mills Optimum Health is a multidisciplinary clinic in west Mississauga offering naturopath-supervised custom IV nutrient therapy with vitamins, minerals, and amino acids, alongside chiropractic and physical rehab services.',
    rating: 4.6,
    reviews: 113,
  },
  {
    slug: 'mindful-healing-naturopathic-clinic-mississauga',
    name: 'Mindful Healing Naturopathic Clinic',
    address: '251 Queen St S, Unit 4, Mississauga, ON L5M 1L7',
    postal_code: 'L5M 1L7',
    phone: '905-819-8200',
    website: 'https://mindfulclinic.ca',
    email: 'info@mindfulclinic.ca',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin C', 'Myers Cocktail', 'Naturopathic Medicine'],
    description: 'Naturopathic clinic in Streetsville offering ND-administered IV nutrient therapy with B vitamins, vitamin C, and magnesium as part of broader naturopathic care.',
    rating: 4.8,
    reviews: null,
  },
  {
    slug: 'revive-skin-medical-spa-mississauga',
    name: 'Revive Skin Medical Spa',
    address: '30 Eglinton Ave W, Unit 400, Mississauga, ON L5R 3E7',
    postal_code: 'L5R 3E7',
    phone: '647-615-7845',
    website: 'https://reviveskinmedicalspa.com',
    email: 'info@reviveskinmedicalspa.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Glutathione', 'Vitamin Injections'],
    description: 'Mississauga medical spa offering IV vitamin therapy, premium NAD+ IV protocols, and glutathione skin lightening IV alongside aesthetic services.',
    rating: 4.7,
    reviews: 57,
  },
  {
    slug: 'reforme-lab-mississauga',
    name: 'Reforme Lab',
    address: '1 Main St, Mississauga, ON L5M 1X4',
    postal_code: 'L5M 1X4',
    phone: '416-901-3133',
    website: 'https://reformelab.com',
    email: 'info@reformelab.com',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Glutathione', 'Vitamin C', 'Vitamin Injections'],
    description: 'Streetsville wellness lab offering vitamin and nutrient IV drips (B-complex, B12, magnesium, calcium) plus booster shots including biotin, vitamin D, CoQ10, L-carnitine, glutathione, and vitamin C.',
    rating: 4.9,
    reviews: 54,
  },
  {
    slug: 'kaizen-medspa-mississauga',
    name: 'Kaizen Medspa',
    address: '190 Robert Speck Pkwy, Unit 200, Mississauga, ON L4Z 3K3',
    postal_code: 'L4Z 3K3',
    phone: '905-607-2461',
    website: 'https://kaizenmedspa.ca',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Glutathione', 'Immune Support', 'Vitamin C'],
    description: 'Mississauga laser clinic and medspa near Square One offering glutathione, energy-booster, and immunity IV treatments (vitamin C and glutathione packages).',
    rating: 4.8,
    reviews: 46,
  },
  {
    slug: 'medcaire-health-mississauga',
    name: 'MedCAiRE Health',
    address: '405 Britannia Rd E, Suite 115, Mississauga, ON L4Z 3E6',
    postal_code: 'L4Z 3E6',
    phone: '905-848-3010',
    website: 'https://medcaire.ca',
    email: 'Filipe@MedCAiRE.ca',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Glutathione', 'Iron Infusion', 'Vitamin Injections'],
    description: 'Mississauga clinic offering IV infusion therapy including NAD+, glutathione, IV iron, and vitamin B12 and D injections.',
    rating: 5.0,
    reviews: 24,
  },
  {
    slug: 'health-globe-wellness-clinic-mississauga',
    name: 'Health Globe Wellness Clinic',
    address: '3450 Platinum Dr, Unit 3, Mississauga, ON',
    postal_code: null,
    phone: '905-277-6702',
    website: 'https://healthglobe.ca',
    email: 'info@healthglobe.ca',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Glutathione', 'Vitamin C', 'Iron Infusion'],
    description: 'Mississauga wellness clinic and IV lounge offering vitamin IV drips, NAD+ IV, glutathione IV, high-dose vitamin C IV, and iron infusion.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'youthful-derma-mississauga',
    name: 'Youthful Derma',
    address: '47 Lakeshore Rd E, Unit 100, Mississauga, ON L5G 1C9',
    postal_code: 'L5G 1C9',
    phone: '647-233-1202',
    website: 'https://youthfulderma.ca',
    email: 'shahnaz@youthfulderma.ca',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Glutathione', 'Vitamin C', 'Immune Support', 'Energy Boost'],
    description: 'RN-owned Mississauga clinic offering a full IV drip menu: NAD+, glutathione (Glut Glow), high-dose vitamin C, NRG energy, M-UNE immune, and Radiance protocols.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'purebalance-wellness-mississauga',
    name: 'pureBalance Wellness',
    address: '219 Lakeshore Rd E, Mississauga, ON L5G 1G5',
    postal_code: 'L5G 1G5',
    phone: '905-891-3865',
    website: 'https://mypurebalance.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Naturopathic Medicine', 'Vitamin C'],
    description: 'Port Credit naturopathic clinic offering ND-administered IV nutrient therapy for energy, liver support, athletic recovery, adrenal support, fertility, and Myers-style infusions.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'ageless-elegance-med-spa-mississauga',
    name: 'Ageless Elegance Med Spa',
    address: '5602 Tenth Line W, Unit 117, Mississauga, ON',
    postal_code: null,
    phone: '647-496-4911',
    website: 'https://agelesselegancemedspa.com',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Hydration', 'Immune Support', 'Vitamin Injections'],
    description: 'Mississauga medical spa offering IV drip bags (Radiance, Energy, Immunity, Hydration) and vitamin and wellness injections.',
    rating: null,
    reviews: null,
  },
];

(async () => {
  const receipt = {
    phase: 'insert-mississauga-10',
    timestamp: new Date().toISOString(),
    inserted: [],
    skipped_existing: [],
    errors: [],
  };

  for (const c of CLINICS) {
    // Check existing slug
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
      reviews: c.reviews != null ? String(c.reviews) : null,
    };
    const { data, error } = await sb.from('providers').insert(payload).select('id, slug').single();
    if (error) {
      console.log('! ' + c.slug + ' insert failed: ' + error.message);
      receipt.errors.push({ slug: c.slug, error: error.message });
      continue;
    }
    receipt.inserted.push({ id: data.id, slug: data.slug, name: c.name, email: c.email });
    console.log('✓ ' + c.slug);
  }

  console.log();
  console.log('Inserted: ' + receipt.inserted.length);
  console.log('Skipped (already exists): ' + receipt.skipped_existing.length);
  console.log('Errors: ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'insert-mississauga-10-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt:', outPath);
})();
