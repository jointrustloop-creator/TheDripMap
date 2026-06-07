/**
 * Insert 6 North Vancouver IV therapy clinics (2026-06-07) that the
 * first sourcing agent over-deduped (incorrectly claimed already in
 * directory). Re-verified by a second agent pass and all confirmed
 * as real, currently-operating BC IV clinics.
 *
 * Operator approved inserting all 6, deferring Edgemont's low rating
 * (3.4) to a manual Google Maps check later.
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
  city: 'North Vancouver',
  is_hidden: false,
  is_claimed: false,
  is_featured: false,
  availability: true,
  decision_drivers: {
    source: 'manual_vancouver_research_2026_06_07_pass2',
    research_method: 'agent re-verify of 6 over-deduped candidates + operator approval',
    enriched_at: new Date().toISOString(),
  },
};

const CLINICS = [
  {
    slug: 'celebrity-laser-and-skin-care-north-vancouver',
    name: 'Celebrity Laser & Skin Care',
    address: '402-850 Harbourside Drive, North Vancouver, BC V7P 0A3',
    postal_code: 'V7P 0A3',
    phone: '604-912-0220',
    website: 'https://celebritylasercare.ca',
    email: 'info@celebritylasercare.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Hydration', 'Immune Support', 'Energy Boost', 'Beauty Glow'],
    description: 'North Vancouver medical spa offering a full IV drip menu: Hydration, Energy, Immunity, Glow, Anti-Aging, and Recovery protocols.',
    rating: 4.9,
    reviews: '435',
  },
  {
    slug: 'parsa-wellness-clinic-north-vancouver',
    name: 'Parsa Wellness Clinic',
    address: '1631 Capilano Rd, North Vancouver, BC V7P 3B4',
    postal_code: 'V7P 3B4',
    phone: '604-770-4816',
    website: 'https://parsawellness.com',
    email: 'info@parsawellness.com',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Iron Infusion', 'Immune Support', 'Hydration'],
    description: 'North Vancouver wellness clinic on Capilano Rd offering IV vitamin therapy, NAD+ IV, iron infusion, immunity IV, and energy and hydration protocols.',
    rating: 4.8,
    reviews: '148',
  },
  {
    slug: 'deva-med-spa-and-body-contouring-north-vancouver',
    name: 'Deva Med Spa and Body Contouring',
    address: '3077 Woodbine Drive, North Vancouver, BC V7R 2S3',
    postal_code: 'V7R 2S3',
    phone: '604-649-1234',
    website: 'https://devamedspa.com',
    email: 'info.devamedspa@gmail.com',
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Myers Cocktail', 'Immune Support', 'Hydration', 'Vitamin Injections'],
    description: 'North Vancouver medical spa offering Myers Cocktail, immunity IV drip, digestive IV drip, hydration/vitamin infusion, and custom blends.',
    rating: 4.7,
    reviews: '194',
  },
  {
    slug: 'aspire-naturopathic-health-centre-north-vancouver',
    name: 'Aspire Naturopathic Health Centre',
    address: '#210-3650 Mt. Seymour Parkway, North Vancouver, BC V7H 2Y5',
    postal_code: 'V7H 2Y5',
    phone: '604-990-9569',
    website: 'https://aspirenaturopathic.ca',
    email: 'info@aspirenaturopathic.ca',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Immune Support', 'Hydration', 'Naturopathic Medicine'],
    description: 'North Vancouver naturopathic health centre on Mt. Seymour Parkway offering restorative IV therapy, immune support, electrolyte and hydration IV, stress recovery, and vitamin IV protocols.',
    rating: 4.3,
    reviews: '8',
  },
  {
    slug: 'edgemont-naturopathic-clinic-north-vancouver',
    name: 'Edgemont Naturopathic Clinic',
    address: '#105-3246 Connaught Crescent, North Vancouver, BC V7R 0A7',
    postal_code: 'V7R 0A7',
    phone: '604-929-5772',
    website: 'https://edgemontnaturopathic.com',
    email: 'info@edgemontnaturopathic.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin C', 'Iron Infusion', 'Immune Support', 'Naturopathic Medicine'],
    description: 'Edgemont Village naturopathic clinic in North Vancouver offering vitamin IV therapy (high-dose vitamin C, B complex, magnesium, zinc), iron infusion, immune support IV, and custom naturopathic IV.',
    rating: 3.4,
    reviews: '20',
  },
  {
    slug: 'dr-alexa-chichak-nd-north-vancouver',
    name: 'Dr. Alexa Chichak, ND',
    address: '#540-224 Esplanade W, North Vancouver, BC V7M 1A4',
    postal_code: 'V7M 1A4',
    phone: '604-737-1177',
    website: 'https://doctorchichak.com',
    email: 'info@doctorchichak.com',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Iron Infusion', 'Vitamin Injections', 'Naturopathic Medicine'],
    description: 'Lower Lonsdale naturopathic doctor offering customized IV vitamin therapy (vitamin C, B-vitamins, magnesium, zinc, selenium, amino acids), iron infusion, ozone therapy, and injection therapies.',
    rating: 5.0,
    reviews: '2',
  },
];

(async () => {
  const receipt = {
    phase: 'insert-vancouver-6-northshore',
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
    const { data, error } = await sb.from('providers').insert(payload).select('id, slug').single();
    if (error) {
      console.log('! ' + c.slug + ' failed: ' + error.message);
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
  const outPath = path.join('scripts/_receipts', 'insert-vancouver-6-northshore-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt:', outPath);
})();
