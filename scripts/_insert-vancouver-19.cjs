/**
 * Insert 19 sourced Vancouver / Lower Mainland IV therapy clinics
 * (2026-06-07). Operator-approved batch from the agent's first sourcing
 * pass.
 *
 * Skipped from agent's 21 candidates per operator decision:
 *   - East Van Integrated Health (thin footprint)
 *   - Downtown Health & Physiotherapy (IV is secondary to physio)
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
  state: 'British Columbia',
  is_hidden: false,
  is_claimed: false,
  is_featured: false,
  availability: true,
  decision_drivers: {
    source: 'manual_vancouver_research_2026_06_07',
    research_method: 'agent_web_research + operator approval',
    enriched_at: new Date().toISOString(),
  },
};

const CLINICS = [
  // ---- Vancouver proper (6) ----
  {
    slug: 'integrative-naturopathic-medical-centre-vancouver',
    city: 'Vancouver',
    name: 'Integrative Naturopathic Medical Centre',
    address: '730-1285 West Broadway, Vancouver, BC V6H 3X8',
    postal_code: 'V6H 3X8',
    phone: '604-738-1012',
    website: 'https://integrative.ca',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Iron Infusion', 'Vitamin Injections', 'Naturopathic Medicine'],
    description: 'West Broadway naturopathic medical centre with in-house compounding lab, offering IV nutrient therapy, iron infusion, heavy metal chelation, and B12 injections.',
    rating: 4.7,
    reviews: '232',
  },
  {
    slug: 'qi-integrated-health-vancouver',
    city: 'Vancouver',
    name: 'Qi Integrated Health',
    address: '1764 West 7th Avenue, Vancouver, BC V6J 5A3',
    postal_code: 'V6J 5A3',
    phone: '604-742-8383',
    website: 'https://qiintegratedhealth.com',
    email: null,
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Immune Support', 'Vitamin Injections'],
    description: 'Vancouver naturopathic clinic offering Myers Cocktail, immune boost, energy and endurance, detox IV protocols, and B12 and vitamin D injections.',
    rating: 4.8,
    reviews: '199',
  },
  {
    slug: 'tandem-clinic-vancouver',
    city: 'Vancouver',
    name: 'Tandem Clinic',
    address: '183 West 2nd Ave, Vancouver, BC V5Y 1B8',
    postal_code: 'V5Y 1B8',
    phone: '604-670-0590',
    website: 'https://tandemclinic.com',
    email: 'info@tandemclinic.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Glutathione', 'Vitamin C', 'Vitamin Injections'],
    description: 'Vancouver integrative clinic offering high-dose vitamin C IV, NAD+, glutathione IV, MAH, IV DCA, ALA, and B12 and vitamin D injections.',
    rating: 4.8,
    reviews: '78',
  },
  {
    slug: 'local-health-integrative-clinic-vancouver',
    city: 'Vancouver',
    name: 'Local Health Integrative Clinic',
    address: '#210 - 2285 Clark Drive, Vancouver, BC V5N 3G8',
    postal_code: 'V5N 3G8',
    phone: '604-568-7655',
    website: 'https://localhealthclinic.ca',
    email: 'info@localhealthco.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Hydration'],
    description: 'East Vancouver naturopathic clinic offering customized IV nutrient therapy with vitamins, minerals, and hydration support.',
    rating: 4.7,
    reviews: '73',
  },
  {
    slug: 'yaletown-integrative-clinic-vancouver',
    city: 'Vancouver',
    name: 'Yaletown Integrative Clinic',
    address: '487 Davie Street, Vancouver, BC V6B 2G2',
    postal_code: 'V6B 2G2',
    phone: '604-697-0397',
    website: 'https://yaletownintegrative.com',
    email: 'info@yaletownintegrative.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Glutathione', 'Vitamin Injections'],
    description: 'Yaletown integrative clinic offering IV nutrition therapy with vitamin, mineral, and amino-acid blends, Myers Cocktail, and glutathione protocols.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'first-ave-medical-spa-vancouver',
    city: 'Vancouver',
    name: 'First Ave Medical Spa',
    address: '#2-1864 West 1st Ave, Vancouver, BC V6J 1G5',
    postal_code: 'V6J 1G5',
    phone: '604-568-0558',
    website: 'https://firstavemedicalspa.com',
    email: 'info@firstavemedicalspa.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', "Myers Cocktail", 'Glutathione', 'Immune Support', 'Vitamin C'],
    description: 'Kitsilano medical spa offering Myers Cocktail, Immune Booster (glutathione, vitamin C, B-complex), and Skin Boost high-dose glutathione IV.',
    rating: null,
    reviews: null,
  },

  // ---- North Vancouver (2) ----
  {
    slug: 'pink-peony-wellness-centre-north-vancouver',
    city: 'North Vancouver',
    name: 'Pink Peony Wellness Centre',
    address: '#104-1575 Pemberton Ave, North Vancouver, BC V7P 2S3',
    postal_code: 'V7P 2S3',
    phone: '604-929-4492',
    website: 'https://pinkpeonywellness.ca',
    email: 'pinkpeonywellness@gmail.com',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Glutathione', 'Vitamin C', 'Immune Support', 'Athletic Recovery'],
    description: 'North Vancouver wellness centre with a 12-drip menu including Myers-style multi-vitamin, glutathione, vitamin C, immune, adrenal, anti-aging, detox, and athletic recovery protocols.',
    rating: null,
    reviews: null,
  },
  {
    slug: 'caremed-integrative-health-centre-north-vancouver',
    city: 'North Vancouver',
    name: 'CareMed Integrative Health Centre',
    address: '#102-88 Lonsdale Ave, North Vancouver, BC V7M 2E6',
    postal_code: 'V7M 2E6',
    phone: '604-969-7711',
    website: 'https://caremedhealth.com',
    email: 'hello@caremedhealth.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'NAD+', 'Glutathione', 'Vitamin Injections'],
    description: 'North Vancouver integrative health centre offering Myers Cocktail, NAD+ brain restoration, glutathione, phosphatidylcholine, DMPS/EDTA chelation, and B12/D3/CoQ10 injections.',
    rating: null,
    reviews: null,
  },

  // ---- Burnaby (8) ----
  {
    slug: 'soma-burnaby-wellness-burnaby',
    city: 'Burnaby',
    name: 'Soma Burnaby Wellness',
    address: '#218-3787 Canada Way, Burnaby, BC V5G 1G5',
    postal_code: 'V5G 1G5',
    phone: '604-568-0048',
    website: 'https://somaburnaby.com',
    email: 'info@somaburnaby.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Iron Infusion', 'Glutathione', 'NAD+', 'Myers Cocktail'],
    description: 'Burnaby wellness clinic offering custom nutrient IVs, iron infusion, glutathione, NAD+, and Myers-style hydration protocols.',
    rating: 4.8,
    reviews: '195',
  },
  {
    slug: 'panda-clinic-metrotown-burnaby',
    city: 'Burnaby',
    name: 'Panda Clinic Metrotown',
    address: '#510-4885 Kingsway, Burnaby, BC V5H 4T6',
    postal_code: 'V5H 4T6',
    phone: '888-843-2716',
    website: 'https://pandaclinic.ca',
    email: 'health@pandaclinic.ca',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'NAD+', 'Glutathione', 'Iron Infusion', 'Vitamin Injections'],
    description: 'Metrotown clinic offering Myers Cocktail, NAD+, glutathione, iron infusion, plus vitamin, slim, and hair shots.',
    rating: 4.5,
    reviews: '165',
  },
  {
    slug: 'everyoung-medical-aesthetics-burnaby',
    city: 'Burnaby',
    name: 'EverYoung Medical Aesthetics',
    address: '6200 Willingdon Ave, Burnaby, BC V5H 0Z3',
    postal_code: 'V5H 0Z3',
    phone: '604-305-2547',
    website: 'https://everyoungmed.com',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Hydration', 'Immune Support', 'Energy Boost'],
    description: 'Metrotown medical aesthetics clinic offering IV drip therapy for energy, hydration, and wellness, clinic-administered.',
    rating: 5.0,
    reviews: '128',
  },
  {
    slug: 'oak-integrative-health-burnaby',
    city: 'Burnaby',
    name: 'Oak Integrative Health',
    address: '#230-9600 Cameron Street, Burnaby, BC V3J 7N3',
    postal_code: 'V3J 7N3',
    phone: '604-227-9990',
    website: 'https://oakintegrative.com',
    email: 'office@oakintegrative.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'NAD+', 'Vitamin Injections'],
    description: 'Burnaby naturopathic clinic led by Dr. Andrea Gansner, ND, offering customized IV nutrient therapy, Myers-style IV push, and B12/D3/NAD+ injections.',
    rating: 4.9,
    reviews: '104',
  },
  {
    slug: 'bc-orchard-aesthetics-burnaby',
    city: 'Burnaby',
    name: 'BC Orchard Aesthetics',
    address: '#201-5481 Kingsway, Burnaby, BC V5H 2G1',
    postal_code: 'V5H 2G1',
    phone: '778-859-3932',
    website: 'https://bcorchardaesthetics.com',
    email: 'office@bcorchardaesthetics.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Glutathione', 'Hydration', 'Vitamin C'],
    description: 'Burnaby aesthetics clinic offering customized IV blends (vitamin C, B-complex, glutathione, selenium, magnesium), Skin Brightening drip, and hydration protocols.',
    rating: 4.9,
    reviews: '66',
  },
  {
    slug: 'gilmore-wellness-clinic-burnaby',
    city: 'Burnaby',
    name: 'Gilmore Wellness Clinic',
    address: '318 Gilmore Ave, Burnaby, BC V5C 4R1',
    postal_code: 'V5C 4R1',
    phone: '604-428-8682',
    website: 'https://gilmorewellnessclinic.com',
    email: 'office@gilmorewellnessclinic.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Iron Infusion', 'Vitamin C'],
    description: "Burnaby wellness clinic offering Myers' Cocktail (vitamin C, B-complex, magnesium, calcium), iron infusion, and custom IV vitamin therapy.",
    rating: 4.3,
    reviews: null,
  },
  {
    slug: 'skinart-md-burnaby',
    city: 'Burnaby',
    name: 'SkinArt MD',
    address: '#300-4388 Beresford St, Burnaby, BC V5H 2Y4',
    postal_code: 'V5H 2Y4',
    phone: '604-639-2581',
    website: 'https://skinartmd.ca',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Hangover Recovery', 'Immune Support', 'Athletic Recovery'],
    description: 'Burnaby medical spa offering Vita Glow, NAD+, Hangover Rescue, Liver Detox, Immune No.1, Performance Recovery, Hair & Skin Renew, and Recharge & Refresh IV protocols.',
    rating: 4.9,
    reviews: null,
  },
  {
    slug: 'amre-aesthetics-and-wellness-burnaby',
    city: 'Burnaby',
    name: 'AMRE Aesthetics & Wellness',
    address: '7330 Kingsway, Burnaby, BC V3N 3B5',
    postal_code: 'V3N 3B5',
    phone: '604-545-1278',
    website: 'https://amreaestheticswellness.com',
    email: 'info@amreaestheticswellness.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'NAD+', 'Glutathione', 'Vitamin C'],
    description: 'Burnaby aesthetics and wellness clinic (rebranded from Renew IV in 2024) offering Myers IV, NAD+ IV, glutathione IV, vitamin C IV, and hydration.',
    rating: null,
    reviews: null,
  },

  // ---- Richmond (1) ----
  {
    slug: 'richmond-laser-and-cosmetic-richmond',
    city: 'Richmond',
    name: 'Richmond Laser & Cosmetic',
    address: '#210-11300 No 5 Rd, Richmond, BC V7A 5J7',
    postal_code: 'V7A 5J7',
    phone: '778-960-7893',
    website: 'https://richmondcosmetic.ca',
    email: 'richmondcosmetic@gmail.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Glutathione', 'Hydration', 'NAD+', 'Vitamin C'],
    description: 'Richmond cosmetic clinic offering Skin Brightening IV (glutathione plus vitamin C), Multi-Vitamin Cocktail, Hydration IV, and NAD+ Anti-aging IV.',
    rating: null,
    reviews: null,
  },

  // ---- New Westminster (2) ----
  {
    slug: 'polo-health-and-longevity-centre-new-westminster',
    city: 'New Westminster',
    name: 'Polo Health + Longevity Centre',
    address: '711 Columbia Street, New Westminster, BC V3M 1B1',
    postal_code: 'V3M 1B1',
    phone: '604-544-7656',
    website: 'https://polohealth.com',
    email: 'info@polohealth.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Glutathione', 'Iron Infusion', 'Naturopathic Medicine'],
    description: 'New Westminster naturopath-led longevity centre offering NAD+ IV therapy, glutathione IV, and iron infusion.',
    rating: 4.5,
    reviews: '127',
  },
  {
    slug: 'catalyst-kinetics-new-westminster',
    city: 'New Westminster',
    name: 'Catalyst Kinetics (CKG New Westminster)',
    address: '822 12th St, New Westminster, BC V3M 4K3',
    postal_code: 'V3M 4K3',
    phone: '604-553-3098',
    website: 'https://catalystkinetics.com',
    email: 'newwest@catalystkinetics.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Iron Infusion', 'Glutathione', 'Vitamin Injections'],
    description: 'New Westminster integrative clinic offering IV nutrient therapy, iron infusions, glutathione, B12 and vitamin D injections, plus ozone and MAH protocols.',
    rating: 4.9,
    reviews: '380',
  },
];

(async () => {
  const receipt = {
    phase: 'insert-vancouver-19',
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
    const { data, error } = await sb.from('providers').insert(payload).select('id, slug, city').single();
    if (error) {
      console.log('! ' + c.slug + ' insert failed: ' + error.message);
      receipt.errors.push({ slug: c.slug, error: error.message });
      continue;
    }
    receipt.inserted.push({ id: data.id, slug: data.slug, city: data.city, name: c.name, email: c.email });
    console.log('✓ ' + data.city.padEnd(18) + ' | ' + c.slug);
  }

  console.log();
  console.log('Inserted: ' + receipt.inserted.length);
  console.log('Skipped (already exists): ' + receipt.skipped_existing.length);
  console.log('Errors: ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'insert-vancouver-19-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt:', outPath);
})();
