/**
 * Insert 4 chain-sister locations that the earlier batches' domain dedup
 * correctly flagged but are real, separate physical clinics. Slug-only
 * check (no domain check) since the chain shares one website.
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
    source: 'agent_research_2026_06_07_chain_sister_override',
    research_method: 'web_search + operator approval; domain dedup intentionally bypassed for real sibling locations',
    enriched_at: new Date().toISOString(),
  },
};

const CLINICS = [
  {
    slug: 'telus-health-montreal-downtown-montreal',
    state: 'Quebec',
    city: 'Montreal',
    name: 'TELUS Health Care Centre - Montreal Downtown',
    address: '600 de Maisonneuve Blvd West, 21st Floor, Montreal, QC H3A 3J2',
    postal_code: 'H3A 3J2',
    phone: null,
    website: 'https://www.telus.com/en/health/care-centres/locations/montreal-downtown',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Infusions', 'Iron Infusion', 'NAD+'],
    description: 'TELUS Health downtown Montreal Care Centre offering IV Infusion Therapy program (vitamin infusions and iron specialty infusions). Sibling location to TELUS Quebec City.',
  },
  {
    slug: 'mybest-clinic-longueuil-longueuil',
    state: 'Quebec',
    city: 'Longueuil',
    name: 'MyBest Clinic (Longueuil)',
    address: '223 Rue de Gentilly Ouest, Longueuil, QC J4H 1Z5',
    postal_code: 'J4H 1Z5',
    phone: '833-697-3848',
    website: 'https://mybestclinic.com/location-longueuil',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Myers Cocktail', 'Glutathione', 'Vitamin Injections'],
    description: 'MyBest South Shore clinic, REVIV franchisee with full REVIV menu (Hydromax, Vitaglow, Ultraviv, Royal Flush) plus NAD+ and Myers Cocktail. Sibling to MyBest Montreal McGill.',
  },
  {
    slug: 'centre-for-advanced-medicine-markham',
    state: 'Ontario',
    city: 'Markham',
    name: 'Centre for Advanced Medicine - Markham',
    address: '12 Main Street N., Markham, ON L3P 1X2',
    postal_code: 'L3P 1X2',
    phone: '905-655-7100',
    website: 'https://advancedmedicine.ca/markham',
    email: 'info@advancedmedicine.ca',
    category: 'Naturopathic Medicine',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Iron Infusion', 'Naturopathic Medicine', 'PRP'],
    description: 'Markham clinic with dedicated Infusion Lounge serving chronic-disease, immune-support, and longevity patients. Sibling to Whitby location.',
  },
  {
    slug: 'beautify-skin-clinic-concord',
    state: 'Ontario',
    city: 'Concord',
    name: 'Beautify Skin Clinic (Concord)',
    address: '1600 Steeles Avenue West, Unit 26, Concord, ON L4K 4M2',
    postal_code: 'L4K 4M2',
    phone: '905-788-8008',
    website: 'https://beautifygroup.com/concord',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Drips', 'Body Contouring', 'Medical Aesthetics'],
    description: 'Steeles/Vaughan medical spa with personalized IV vitamin drips. Sibling to Beautify Vaughan.',
  },
];

(async () => {
  const receipt = { phase: 'insert-chain-sisters-4', timestamp: new Date().toISOString(), inserted: [], skipped: [], errors: [] };

  for (const c of CLINICS) {
    const { data: existing } = await sb.from('providers').select('id, slug').eq('slug', c.slug).maybeSingle();
    if (existing) {
      console.log('= [slug exists] ' + c.slug);
      receipt.skipped.push({ slug: c.slug });
      continue;
    }
    const payload = { ...COMMON, state: c.state, slug: c.slug, name: c.name, city: c.city, address: c.address, postal_code: c.postal_code, phone: c.phone, website: c.website, email: c.email, email_quality: c.email ? 'medium' : null, category: c.category, type: c.type, specialties: c.specialties, description: c.description, rating: null, reviews: null };
    const { data, error } = await sb.from('providers').insert(payload).select('id, slug, city').single();
    if (error) {
      console.log('! ' + c.slug + ' failed: ' + error.message);
      receipt.errors.push({ slug: c.slug, error: error.message });
      continue;
    }
    receipt.inserted.push({ id: data.id, slug: data.slug, city: data.city });
    console.log('+ ' + data.city.padEnd(12) + ' | ' + c.slug);
  }

  console.log();
  console.log('Inserted: ' + receipt.inserted.length + ' | Skipped: ' + receipt.skipped.length + ' | Errors: ' + receipt.errors.length);
  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'insert-chain-sisters-4-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
