// Insert 8 Richmond Hill IV therapy clinics from agent research 2026-06-12.
// Per lockdown rules: pre-check each slug, insert, verify count=1 each.
// Tagged with decision_drivers.source = 'agent_research_richmond_hill_2026_06_12_priority'
// so a future /admin/tools button can queue these as priority outreach drafts.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SOURCE_TAG = 'agent_research_richmond_hill_2026_06_12_priority';
const RESEARCHED_AT = new Date().toISOString();

const CLINICS = [
  {
    name: 'NewM Clinic Richmond Hill',
    slug: 'newm-clinic-richmond-hill',
    address: '21 Charles Street, Richmond Hill, ON',
    phone: '(647) 846-4611',
    website: 'https://newmclinic.com',
    email: 'info@newmclinic.com',
    email_quality: 'medium',
    specialties: ['IV Therapy', 'NAD+', 'Myers Cocktail', 'Glutathione', 'Mobile IV', 'Med Spa'],
    mobile_service: true,
    type: 'Mobile',
    description: 'Richmond Hill location of NewM Clinic, offering in-clinic and at-home mobile IV therapy across the GTA. Cocktails include NAD+, Myers, glutathione, anti-aging, immune boost, multi-vitamin, plus IM shots (B12, Biotin, Vitamin D3).',
  },
  {
    name: 'Skin Vitality Medical Clinic Richmond Hill',
    slug: 'skin-vitality-medical-clinic-richmond-hill',
    address: '8865 Yonge St Unit B-6, Richmond Hill, ON L4C 6Z1',
    phone: null,
    website: 'https://www.skinvitality.ca/richmond-hill/',
    email: null,
    email_quality: null,
    specialties: ['Vitamin IV Drip', 'Myers Cocktail', 'Botox', 'Fillers', 'Body Contouring', 'PRP'],
    mobile_service: false,
    type: 'In-Clinic',
    description: 'Richmond Hill location of Skin Vitality, Canada\'s large non-surgical medical aesthetics chain. Vitamin IV Drip Therapy including Myers Cocktail is part of the menu alongside Botox, fillers, laser treatments, and body contouring.',
  },
  {
    name: 'Fantazia IV Boost',
    slug: 'fantazia-iv-boost-richmond-hill',
    address: '202-9955 Yonge St, Richmond Hill, ON L4C 1T9',
    phone: '(416) 301-1497',
    website: 'https://ivboost.ca',
    email: null,
    email_quality: null,
    specialties: ['IV Hydration', 'NAD+', 'Myers Cocktail', 'Glutathione', 'Beauty Glow', 'Hangover Rescue', 'Athletic Recovery', 'Immunity Boost'],
    mobile_service: false,
    type: 'In-Clinic',
    description: 'Dedicated IV drip lounge in central Richmond Hill (Yonge and 16th). Pre-booked appointments only. Menu includes NAD+, Myers Cocktail, glutathione, hydration drips, plus targeted drips for hangover rescue, energy, beauty glow, athletic recovery, and immunity.',
  },
  {
    name: 'Genesis Medi Clinic',
    slug: 'genesis-medi-clinic-richmond-hill',
    address: '324 Highway 7 East, Unit 2, Richmond Hill, ON L4B 1A6',
    phone: '(289) 597-1383',
    website: 'https://www.genesismediclinic.com',
    email: null,
    email_quality: null,
    specialties: ['IV Booster Therapy', 'Myers Cocktail', 'Slim/Weight Loss IV', 'Liver Detox IV', 'Energy Repair IV', 'Anti-Aging IV', 'Hangover Relief IV', 'Cosmetic Injections'],
    mobile_service: false,
    type: 'In-Clinic',
    description: 'Bilingual English and Chinese medi clinic on Highway 7 East. IV Booster Therapy is administered by RN, NP, or MD with phlebotomy certification. Menu includes Myers Cocktail, brightening/whitening IV, slim IV, liver protection IV, energy repair, anti-aging, and hangover relief.',
  },
  {
    name: 'Limitless Health Clinic',
    slug: 'limitless-health-clinic-richmond-hill',
    address: '350 Hwy 7 Suite 211, Richmond Hill, ON L4B 3N2',
    phone: '(905) 889-3640',
    website: 'https://limitlesshealthclinic.com',
    email: 'reception@limitlesshealthclinic.com',
    email_quality: 'medium',
    specialties: ['IV Therapy', 'Naturopathic Medicine', 'Homeopathy', 'Osteopathic Medicine', 'Oncology Patient Support'],
    mobile_service: false,
    type: 'In-Clinic',
    description: 'Multidisciplinary wellness clinic offering IV therapy alongside naturopathic medicine, homeopathy, and osteopathic care. Deborah Berg ND practices here and provides IV Nutrient and Infusion Therapy. Patient support for oncology care is part of the practice.',
  },
  {
    name: 'Beauty Med',
    slug: 'beauty-med-richmond-hill',
    address: '10593 Yonge St Unit 5, Richmond Hill, ON L4C 3C5',
    phone: '(905) 237-5034',
    website: 'https://www.beautymed.ca',
    email: 'info@beautymed.ca',
    email_quality: 'medium',
    specialties: ['IV Vitamin Therapy', 'Botox', 'Fillers', 'Microneedling', 'Morpheus8', 'Body Contouring', 'PRP/PRF'],
    mobile_service: false,
    type: 'In-Clinic',
    description: 'Richmond Hill med spa and laser clinic. Intravenous Vitamin Therapy menu lists three cocktails: Immune Booster, Fountain of Youth, and Hang-Over Cure, plus a broad cosmetic medicine offering (Botox, fillers, lasers, Morpheus8, body contouring).',
  },
  {
    name: 'Vitalchecks',
    slug: 'vitalchecks-richmond-hill',
    address: '204-22 Richmond Street, Richmond Hill, ON L4C 3Y1',
    phone: '(905) 237-7031',
    website: null,
    email: 'angela.lee@vitalchecks.ca',
    email_quality: 'low',
    specialties: ['IV Nutrient Therapy', 'Infusion Therapy', 'Acupuncture', 'Botanical Medicine', 'Mesotherapy', 'Prolotherapy', 'Lyme Disease Care'],
    mobile_service: false,
    type: 'In-Clinic',
    description: 'Dr. Angela Lee ND, a Lyme Ontario board member, offers IV Nutrient Therapy and Infusion Therapy alongside acupuncture, botanical medicine, clinical nutrition, and hormonal therapy. Lyme disease and chronic disease care is a stated specialty.',
  },
  {
    name: 'Four Seasons Naturopathic Wellness',
    slug: 'four-seasons-naturopathic-wellness-richmond-hill',
    address: '305 Carrville Rd, Richmond Hill, ON L4C 6E4',
    phone: '(905) 597-7201',
    website: 'https://familynaturopath.ca',
    email: null,
    email_quality: null,
    specialties: ['IV/Injection Micronutrient Therapy', 'Acupuncture', 'Clinical Nutrition', 'Herbal Medicine', 'Colon Hydrotherapy', 'Far-Infrared Sauna'],
    mobile_service: false,
    type: 'In-Clinic',
    description: 'Naturopathic and wellness clinic with Dr. Rahim Habib ND. IV and injection micronutrient therapies sit alongside acupuncture, clinical nutrition, herbal medicine, homeopathy, colon hydrotherapy, and far-infrared sauna. By-appointment only.',
  },
];

function buildRow(c) {
  return {
    name: c.name,
    slug: c.slug,
    address: c.address,
    phone: c.phone,
    website: c.website,
    email: c.email,
    email_quality: c.email_quality,
    city: 'Richmond Hill',
    state: 'Ontario',
    country: 'Canada',
    specialties: c.specialties,
    type: c.type,
    description: c.description,
    is_claimed: false,
    is_featured: false,
    is_hidden: false,
    availability: true,
    outreach_sent: false,
    followup_sent: false,
    email_bounced: false,
    decision_drivers: {
      source: SOURCE_TAG,
      researched_at: RESEARCHED_AT,
    },
    created_at: RESEARCHED_AT,
  };
}

(async () => {
  console.log('=== Richmond Hill priority insert: 8 clinics ===');
  console.log('Source tag:', SOURCE_TAG);
  console.log('');

  // PRE: ensure none of these slugs already exist.
  const allSlugs = CLINICS.map((c) => c.slug);
  const { data: existing } = await supabase
    .from('providers')
    .select('slug')
    .in('slug', allSlugs);
  if (existing && existing.length > 0) {
    console.error('ABORT: one or more slugs already exist:', existing.map((r) => r.slug));
    process.exit(1);
  }
  console.log('PRE: 0 of 8 slugs already exist. Safe to insert.');
  console.log('');

  // Insert one at a time, verify each affected row.
  const results = [];
  for (const c of CLINICS) {
    const row = buildRow(c);
    const { data, error } = await supabase
      .from('providers')
      .insert(row)
      .select('id, name, slug, city, email, decision_drivers')
      .single();
    if (error) {
      console.error('  FAIL', c.name, '-', error.message);
      results.push({ name: c.name, ok: false, error: error.message });
      continue;
    }
    console.log('  OK', data.slug, '| id', data.id, '|', data.email || 'no-email');
    results.push({ name: c.name, slug: data.slug, id: data.id, ok: true });
  }

  // POST: verify total source-tagged count.
  const { count } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('decision_drivers->>source', SOURCE_TAG);
  console.log('');
  console.log('=== Summary ===');
  console.log(' Total clinics tagged with source =', SOURCE_TAG + ':', count);
  console.log(' Inserts OK:', results.filter((r) => r.ok).length, '/', CLINICS.length);
  for (const r of results) {
    console.log(' ', r.ok ? 'OK ' : 'ERR', r.name, r.ok ? '' : ('— ' + r.error));
  }
})();
