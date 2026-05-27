// Peninsula CA + Miami + Austin combined import
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
function slugify(str) { return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''); }

const PROVIDERS = [
  // ══════════ PENINSULA CALIFORNIA ══════════
  { city: 'San Carlos',  state: 'California', name: 'San Carlos IV Bar',                    address: 'San Carlos, CA',          phone: null, website: 'https://sancarlosivbar.com/', type: 'In-Clinic' },
  { city: 'San Carlos',  state: 'California', name: 'Good Living Health San Carlos',        address: 'San Carlos, CA',          phone: null, website: 'https://goodlivinghealth.com/iv-nutrition/', type: 'In-Clinic' },
  { city: 'San Carlos',  state: 'California', name: 'Drip IV Peninsula',                    address: 'Mobile - San Mateo County, CA', phone: null, website: 'https://dripivtherapy.com/service-areas/mobile-iv-therapy-bay-area-ca/', type: 'Mobile' },
  { city: 'San Carlos',  state: 'California', name: 'The Cure IV Bay Area',                 address: 'Mobile - Bay Area, CA',   phone: null, website: 'https://www.thecureiv.com/service-areas/bay-area/', type: 'Mobile' },
  { city: 'San Carlos',  state: 'California', name: 'Ever IV Peninsula',                    address: 'Mobile - SF Peninsula, CA', phone: null, website: 'https://www.everiv.com/', type: 'Mobile' },
  { city: 'San Carlos',  state: 'California', name: 'ASAP IVs Northern California',         address: 'Mobile - Bay Area, CA',   phone: null, website: 'https://www.asapivs.com/locations-northern-california', type: 'Mobile' },
  { city: 'Palo Alto',   state: 'California', name: 'Total Glow Palo Alto',                 address: 'Palo Alto, CA',           phone: null, website: 'https://www.totalglow.com/wellness/iv-therapy/', type: 'In-Clinic' },
  { city: 'Palo Alto',   state: 'California', name: 'The iO Clinic by L&P Aesthetics',      address: 'Palo Alto, CA',           phone: null, website: 'https://theioclinic.fortheface.com/services/iv-therapy/', type: 'In-Clinic' },
  { city: 'Palo Alto',   state: 'California', name: 'NexGen Health Palo Alto',              address: 'Palo Alto, CA',           phone: null, website: 'https://www.mynexgenhealth.com/palo-alto-iv-therapy', type: 'In-Clinic' },
  { city: 'Palo Alto',   state: 'California', name: 'Palo Alto Mind Body',                  address: '206 California Ave, Palo Alto, CA 94306', phone: '+1 650-681-2900', website: 'https://www.paloaltomindbody.com/services/iv-hydration-and-vitamin-infusion', type: 'In-Clinic' },
  { city: 'Palo Alto',   state: 'California', name: 'Drip Hydration - Palo Alto',           address: 'Mobile - Palo Alto, San Mateo, CA', phone: null, website: 'https://driphydration.com/coverage-areas/palo-alto/', type: 'Mobile' },
  { city: 'Los Altos',   state: 'California', name: 'Pacific Naturopathic IV Therapy',      address: 'Los Altos, CA',           phone: null, website: 'https://pacificnaturopathic.com/iv-therapy/', type: 'In-Clinic' },

  // ══════════ MIAMI ══════════
  { city: 'Miami',         state: 'Florida', name: 'Solea Brickell SPA',                  address: 'Brickell, Miami, FL',    phone: null, website: 'https://soleabrickellspa.com/iv-vitamin-drips', type: 'In-Clinic' },
  { city: 'Miami',         state: 'Florida', name: 'ELIXR IV Therapy & Wellness Miami',   address: 'Miami, FL',              phone: null, website: 'https://www.elixrme.com/', type: 'In-Clinic' },
  { city: 'Miami',         state: 'Florida', name: 'Novaskin Med Spa Brickell',           address: 'Brickell, Miami, FL',    phone: null, website: 'https://novaskinmedspa.com/services/nad-iv-therapy-miami', type: 'In-Clinic' },
  { city: 'Miami',         state: 'Florida', name: 'Liquivida Lounge Brickell',           address: '848 Brickell Ave Unit 617, Miami, FL 33131', phone: null, website: 'https://www.liquivida.com/brickell', type: 'In-Clinic' },
  { city: 'Miami',         state: 'Florida', name: 'DRIP Health & MedSpa Miami Lakes',    address: 'Miami Lakes, FL',        phone: null, website: 'https://driphealthandmedspa.com/', type: 'In-Clinic' },
  { city: 'Miami',         state: 'Florida', name: 'Drip Wellness IV Mobile Miami',       address: 'Mobile - Miami, FL',     phone: null, website: 'https://www.dripwellnessiv.com/', type: 'Mobile' },
  { city: 'Miami',         state: 'Florida', name: 'REVIV Wellness Brickell',             address: 'Brickell, Miami, FL',    phone: null, website: 'https://go.revivme.com/miami-brickell/', type: 'In-Clinic' },
  { city: 'Miami',         state: 'Florida', name: 'HydraMed Miami',                      address: 'Mobile - Miami, FL',     phone: null, website: 'https://hydramed.com/areas-served/florida/miami', type: 'Mobile' },
  { city: 'Miami Beach',   state: 'Florida', name: 'VitaSquad Miami Beach',               address: 'Miami Beach, FL',        phone: null, website: 'https://www.vitasquad.com/locations/', type: 'In-Clinic' },
  { city: 'Miami Beach',   state: 'Florida', name: 'Avabello Aesthetics Miami Beach',     address: 'Miami Beach, FL',        phone: null, website: 'https://avabello.com/iv-therapy/', type: 'In-Clinic' },
  { city: 'Miami Beach',   state: 'Florida', name: 'BODYWELLE IV Drip Miami Beach',       address: 'Miami Beach, FL',        phone: null, website: 'https://alonsomartinmd.com/wellness/iv-therapy/', type: 'In-Clinic' },
  { city: 'Coconut Grove', state: 'Florida', name: 'VitaSquad Coconut Grove',             address: 'Coconut Grove, Miami, FL', phone: null, website: 'https://www.vitasquad.com/locations/', type: 'In-Clinic' },
  { city: 'Doral',         state: 'Florida', name: 'NeoMedicine Institute Doral',         address: 'Doral, FL',              phone: null, website: 'https://neomedicineinstitute.com/iv-therapy-miami/', type: 'In-Clinic' },
  { city: 'Doral',         state: 'Florida', name: 'USA Sports Medicine Doral',           address: 'Doral, FL',              phone: null, website: 'https://usasportsmedicine.com/iv-therapy/', type: 'In-Clinic' },
  { city: 'Aventura',      state: 'Florida', name: 'USA Sports Medicine Aventura',        address: 'Aventura, FL',           phone: null, website: 'https://usasportsmedicine.com/iv-therapy/', type: 'In-Clinic' },
  { city: 'Aventura',      state: 'Florida', name: 'NeoMedicine Institute Aventura',      address: 'Aventura, FL',           phone: null, website: 'https://neomedicineinstitute.com/iv-therapy-miami/', type: 'In-Clinic' },
  { city: 'Miami',         state: 'Florida', name: 'The DRIPBaR South Miami',             address: 'South Miami on Sunset Drive, Miami, FL', phone: null, website: 'https://thedripbar.com/south-miami-sunset-drive/', type: 'In-Clinic' },
  { city: 'Miami',         state: 'Florida', name: 'Drip Hydration Miami',                address: 'Mobile - Miami, FL',     phone: null, website: 'https://driphydration.com/coverage-areas/miami/', type: 'Mobile' },
  { city: 'Miami',         state: 'Florida', name: 'Body Rx Miami Anti-Aging & MedSpa',   address: 'Coral Gables, Miami, FL', phone: null, website: 'https://www.bodyrx.com/', type: 'In-Clinic' },

  // ══════════ AUSTIN ══════════
  { city: 'Austin',      state: 'Texas', name: 'IVitamin Therapy Austin',                address: 'Austin, TX',                  phone: null, website: 'https://ivitamintherapy.com/', type: 'In-Clinic' },
  { city: 'Austin',      state: 'Texas', name: 'The Med Spa Austin - Westlake',          address: 'Westlake, Austin, TX',        phone: null, website: 'https://www.themedspaaustin.com/iv-therapy/', type: 'In-Clinic' },
  { city: 'Austin',      state: 'Texas', name: 'Drip Hydration Austin',                  address: 'Mobile - Austin, TX',         phone: null, website: 'https://driphydration.com/coverage-areas/austin/', type: 'Mobile' },
  { city: 'Austin',      state: 'Texas', name: 'Alive and Well Austin IV Therapy',       address: 'Austin, TX',                  phone: null, website: 'https://aliveandwell.health/iv-therapy-austin/', type: 'In-Clinic' },
  { city: 'Austin',      state: 'Texas', name: 'The DRIPBaR Austin The Domain',          address: 'The Domain, Austin, TX',      phone: null, website: 'https://thedripbar.com/austin-the-domain/', type: 'In-Clinic' },
  { city: 'Austin',      state: 'Texas', name: 'IV Nutrition Austin',                    address: 'Austin, TX',                  phone: null, website: 'https://ivnutrition.com/locations/austin-tx/', type: 'In-Clinic' },
  { city: 'Austin',      state: 'Texas', name: 'Drip Drop IV Vitamin Bar Austin',        address: 'Austin, TX',                  phone: null, website: 'https://dripdropiv.com/', type: 'In-Clinic' },
  { city: 'Austin',      state: 'Texas', name: 'Liquid Wellness IV Hydration Austin',    address: 'Mobile - Austin, TX',         phone: null, website: 'https://liquidmobileiv.com/service-area/austin/', type: 'Mobile' },
  { city: 'Austin',      state: 'Texas', name: 'Gonstead ATX IV Therapy',                address: 'Austin, TX',                  phone: null, website: 'https://gonstead-atx.com/iv-therapy/', type: 'In-Clinic' },
  { city: 'Austin',      state: 'Texas', name: 'HydraMed Austin',                        address: 'Mobile - Austin, TX',         phone: null, website: 'https://hydramed.com/areas-served/texas/austin', type: 'Mobile' },
  { city: 'Austin',      state: 'Texas', name: 'AustinMD Aesthetics & Wellness',         address: 'Austin, TX',                  phone: null, website: 'https://austinmdclinic.com/', type: 'In-Clinic' },
  { city: 'Austin',      state: 'Texas', name: 'Pure IV Austin',                         address: 'Mobile - Austin, TX',         phone: null, website: 'https://www.pureiv.com/tx/mobile-iv-therapy', type: 'Mobile' },
  { city: 'Round Rock',  state: 'Texas', name: 'IVTherapy2Go Round Rock',                address: 'Round Rock, TX',              phone: null, website: 'https://ivtherapy2go.com/Locations/RoundRock', type: 'Mobile' },
  { city: 'Round Rock',  state: 'Texas', name: 'Mobile IV Medics Round Rock',            address: 'Mobile - Round Rock, TX',     phone: null, website: 'https://mobileivmedics.com/service-areas/texas/round-rock/', type: 'Mobile' },
  { city: 'Round Rock',  state: 'Texas', name: 'Fluid Revival Round Rock',               address: 'Round Rock, TX',              phone: null, website: 'https://fluidrevival.com/round-rock/', type: 'Mobile' },
  { city: 'Cedar Park',  state: 'Texas', name: 'IVTherapy2Go Cedar Park',                address: 'Cedar Park, TX',              phone: null, website: 'https://ivtherapy2go.com/Locations/CedarPark', type: 'Mobile' },
  { city: 'Cedar Park',  state: 'Texas', name: 'Nepenthe Wellness Cedar Park',           address: 'Cedar Park, TX',              phone: null, website: 'https://www.nepenthewellness.com/vitamin-iv-therapy/', type: 'In-Clinic' },
  { city: 'Cedar Park',  state: 'Texas', name: 'PRIME IV Hydration Cedar Park',          address: 'Cedar Park, TX 78613',        phone: null, website: 'https://primeivhydration.com/locations/texas/cedar-park-78613/', type: 'In-Clinic' },
  { city: 'Cedar Park',  state: 'Texas', name: 'Lone Star IV Medics Cedar Park',         address: 'Cedar Park, TX',              phone: null, website: 'https://lonestarivmedics.com/locations/iv-therapy-cedar-park-tx/', type: 'Mobile' },
];

(async () => {
  console.log(`Importing ${PROVIDERS.length} providers across 3 cities...\n`);

  const { data: existing } = await s.from('providers').select('slug, website, name');
  const existingSlugs = new Set(existing.map(p => p.slug));
  const existingWebsites = new Set(existing.map(p => (p.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '')));
  const existingNames = new Set(existing.map(p => p.name.toLowerCase().trim()));

  const rows = [];
  let skipped = 0;
  for (const p of PROVIDERS) {
    const slug = `${slugify(p.name)}-${slugify(p.city)}`;
    const websiteKey = (p.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
    if (existingSlugs.has(slug) || existingWebsites.has(websiteKey) || existingNames.has(p.name.toLowerCase().trim())) {
      console.log(`  ⏭  Skipped: ${p.name}`);
      skipped++;
      continue;
    }
    rows.push({
      slug, name: p.name, category: 'IV Therapy',
      city: p.city, state: p.state, country: 'United States',
      address: p.address, phone: p.phone, website: p.website, type: p.type,
      is_featured: false, availability: true, rating: null, reviews: null,
      created_at: new Date().toISOString(),
    });
  }

  console.log(`Ready: ${rows.length}, skipped: ${skipped}\n`);
  if (rows.length === 0) return;

  let inserted = 0, failed = 0;
  for (let i = 0; i < rows.length; i += 15) {
    const batch = rows.slice(i, i + 15);
    const { data, error } = await s.from('providers').insert(batch).select('city, name');
    if (error) { console.log(`  ✗ Batch failed: ${error.message}`); failed += batch.length; }
    else { data.forEach(d => console.log(`  ✓ [${d.city}] ${d.name}`)); inserted += data.length; }
  }

  console.log(`\n=== RESULT ===\nInserted: ${inserted}\nSkipped: ${skipped}\nFailed: ${failed}\n`);

  // Final counts
  console.log('Final counts:');
  for (const city of ['San Carlos', 'Palo Alto', 'Los Altos', 'Miami', 'Miami Beach', 'Coconut Grove', 'Doral', 'Aventura', 'Austin', 'Round Rock', 'Cedar Park']) {
    const { count } = await s.from('providers').select('id', { count: 'exact', head: true }).ilike('city', city);
    console.log(`  ${city.padEnd(15)} ${count}`);
  }
})();
