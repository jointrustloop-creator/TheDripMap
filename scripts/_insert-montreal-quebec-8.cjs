/**
 * Insert 8 Montreal + Laval + South Shore + Gatineau HIGH-confidence IV
 * clinics (2026-06-07). GTR Santé sub-locations limited to the 2 with
 * verified street addresses (Downtown + Saint-Laurent); Laval/DDO/Brossard
 * deferred until address confirmation.
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
  state: 'Quebec',
  is_hidden: false,
  is_claimed: false,
  is_featured: false,
  availability: true,
  decision_drivers: {
    source: 'agent_research_montreal_quebec_2026_06_07',
    research_method: 'web_search + operator approval (HIGH-confidence only)',
    enriched_at: new Date().toISOString(),
  },
};

const CLINICS = [
  // ============ MONTREAL (3) ============
  {
    slug: 'xyd-lab-montreal',
    city: 'Montreal',
    name: 'XYd lab',
    address: '370 Guy Street, Suite 207, Montreal, QC',
    postal_code: null,
    phone: '514-552-9646',
    website: 'https://www.xydlab.com',
    email: 'info@xydlab.com',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'NAD+', 'Vitamin C', 'Hydration', 'Vitamin Injections'],
    description: 'Medical laboratory and infusion clinic in downtown Montreal offering a Vitamin IV Therapy Healing Collection menu including high-dose vitamin C, NAD+ Booster, and proprietary IV drips.',
  },
  {
    slug: 'gtr-sante-downtown-montreal',
    city: 'Montreal',
    name: 'GTR Sante (Downtown Montreal)',
    address: '1440 Rue Sainte-Catherine O, Suite 301, Montreal, QC H3G 1R8',
    postal_code: 'H3G 1R8',
    phone: '514-733-1231',
    website: 'https://www.gtrsante.com',
    email: null,
    category: 'IV Therapy',
    type: 'Both',
    specialties: ['IV Therapy', 'NAD+', 'Hydration', 'Vitamin Injections', 'Mobile IV'],
    description: 'Multi-location private nursing and diagnostic chain offering in-clinic and at-home NAD+ IV drip and other IV therapy products, delivered by registered nurses.',
  },
  {
    slug: 'telus-health-montreal-downtown-montreal',
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
    description: 'TELUS Health downtown Montreal Care Centre offering IV Infusion Therapy program (vitamin infusions and iron specialty infusions).',
  },

  // ============ SAINT-LAURENT (1) ============
  {
    slug: 'gtr-sante-saint-laurent-montreal',
    city: 'Saint-Laurent',
    name: 'GTR Sante (Saint-Laurent)',
    address: '1280 Boulevard Marcel-Laurin, Suite A, Saint-Laurent, QC H4R 1J9',
    postal_code: 'H4R 1J9',
    phone: '514-733-1231',
    website: 'https://www.gtrsante.com/locations/saint-laurent',
    email: null,
    category: 'IV Therapy',
    type: 'Both',
    specialties: ['IV Therapy', 'NAD+', 'Hydration', 'Vitamin Injections', 'Mobile IV'],
    description: 'Saint-Laurent branch of GTR Sante offering NAD+ IV drip and other IV therapy products in-clinic and at-home.',
  },

  // ============ LAVAL (1) ============
  {
    slug: 'clinique-nord-laval',
    city: 'Laval',
    name: 'Clinique Nord',
    address: '3330 100e Avenue, Laval, QC H7T 0J7',
    postal_code: 'H7T 0J7',
    phone: '450-233-2287',
    website: 'https://cliniquenord.com',
    email: 'info@cliniquenord.com',
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Hydration', 'Vitamin Infusions', 'Medical Spa', 'Medical Aesthetics'],
    description: 'Per La Presse coverage, the first medical clinic to offer IV therapy in Quebec (launched June 2021). Mixed medispa and medical clinic with online booking.',
  },

  // ============ SOUTH SHORE (2) ============
  {
    slug: 'mybest-clinic-longueuil-longueuil',
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
    description: 'MyBest South Shore clinic, REVIV franchisee with full REVIV menu (Hydromax, Vitaglow, Ultraviv, Royal Flush) plus NAD+ and Myers Cocktail.',
  },
  {
    slug: 'icryo-brossard-brossard',
    city: 'Brossard',
    name: 'iCRYO Brossard',
    address: '7845 Boulevard Taschereau, Suite 103, Brossard, QC J4Y 1A4',
    postal_code: 'J4Y 1A4',
    phone: '450-445-6066',
    website: 'https://icryocanada.com',
    email: null,
    category: 'IV Therapy',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin Injections', 'Cryotherapy', 'Red Light Therapy', 'Compression Therapy'],
    description: 'Canadian HQ of iCRYO franchise in Brossard. IV and IM treatments delivered by clinical nurses with pre-treatment medical assessment. Wellness-focused (cryo, IV, red light, body sculpting).',
  },

  // ============ GATINEAU (1) ============
  {
    slug: 'medispa-victoria-park-gatineau-gatineau',
    city: 'Gatineau',
    name: 'Medispa Victoria Park - Gatineau',
    address: '200 Rue Montcalm, Bureau 302, Gatineau, QC J8Y 3B5',
    postal_code: 'J8Y 3B5',
    phone: '514-488-8668',
    website: 'https://vicpark.com/clinics/gatineau',
    email: null,
    category: 'Medical Spa',
    type: 'Clinic',
    specialties: ['IV Therapy', 'Vitamin C', 'Hydration', 'Medical Aesthetics'],
    description: 'Gatineau outpost of Victoria Park Medispa network. IV Therapy with hydration, vitamins, amino acids, and nutrients, administered by their medical team in 45 to 60 minute sessions.',
  },
];

function normDomain(url) { if (!url) return null; try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; } }

(async () => {
  const receipt = { phase: 'insert-montreal-quebec-8', timestamp: new Date().toISOString(), inserted: [], skipped_slug_exists: [], skipped_domain_exists: [], errors: [] };
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
  const outPath = path.join('scripts/_receipts', 'insert-montreal-quebec-8-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
