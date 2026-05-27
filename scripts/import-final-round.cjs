require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
function slugify(str) { return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''); }

const PROVIDERS = [
  // ──── Peninsula CA additions ────
  { city: 'Burlingame', state: 'California', name: 'Serenity Aesthetics & Wellness Burlingame', address: 'Burlingame, CA', phone: null, website: 'https://serenityaestheticsandwellness.com/', type: 'In-Clinic' },
  { city: 'Foster City', state: 'California', name: 'Silicon Valley Aesthetic Dermatology', address: 'Foster City, CA', phone: null, website: 'https://svaestheticderm.com/medical-spa/', type: 'In-Clinic' },
  { city: 'Mountain View', state: 'California', name: 'Ethereal Glow Aesthetics Mountain View', address: 'Mountain View, CA', phone: null, website: 'https://etherealglowaesthetics.com/iv-hydration', type: 'In-Clinic' },
  { city: 'Menlo Park', state: 'California', name: 'The IV Doc Menlo Park', address: 'Mobile - Menlo Park, CA', phone: null, website: 'https://www.theivdoc.com/mobile-iv-therapy-menlo-park-ca', type: 'Mobile' },
  { city: 'San Mateo', state: 'California', name: 'Ever IV San Mateo', address: 'Mobile - San Mateo Peninsula, CA', phone: '+1 650-513-0773', website: 'https://www.everiv.com/contact-us', type: 'Mobile' },

  // ──── Miami additions ────
  { city: 'Miami', state: 'Florida', name: 'Wellness IV Infusion Therapy Miami', address: 'Mobile - South Florida (Kendall, Pinecrest, South Miami, Sunny Isles, Hialeah)', phone: null, website: 'https://wellnessivinfusiontherapy.com/', type: 'Mobile' },
  { city: 'Miami', state: 'Florida', name: 'Vive Ageless Weight Loss IV Therapy', address: 'Coral Gables and Pinecrest, FL', phone: null, website: 'https://www.viveagelessweightloss.com/iv-therapy-clinic', type: 'In-Clinic' },
  { city: 'Miami Beach', state: 'Florida', name: 'The IV Doc Miami Beach', address: 'Mobile - Miami Beach, FL', phone: null, website: 'https://www.theivdoc.com/mobile-iv-therapy-miami-beach-florida', type: 'Mobile' },
  { city: 'Miami', state: 'Florida', name: 'IV Concierge Miami', address: 'Mobile - Hialeah, Kendall, Pinecrest, South Beach, Sunny Isles', phone: null, website: 'https://ivconcierge.com/coverage-areas/miami/', type: 'Mobile' },
  { city: 'Miami', state: 'Florida', name: 'First Choice Neurology Miami Infusion Center', address: '9085 SW 87 Ave Suite 200, Miami, FL 33176', phone: null, website: 'https://www.fcneurology.net/services/infusion-centers/miami-infusion-center/', type: 'In-Clinic' },
  { city: 'Miami', state: 'Florida', name: 'Mobile IV Medics Miami', address: 'Mobile - Miami, FL', phone: null, website: 'https://mobileivmedics.com/service-areas/florida/miami/', type: 'Mobile' },
  { city: 'Miami', state: 'Florida', name: 'Drip Hydration Miami (concierge)', address: 'Mobile - Greater Miami, FL', phone: null, website: 'https://driphydration.com/coverage-areas/miami/', type: 'Mobile' },

  // ──── Austin additions ────
  { city: 'Austin', state: 'Texas', name: 'Fluid Revival Austin', address: 'Mobile - Austin and surrounding, TX', phone: '+1 512-337-3561', website: 'https://fluidrevival.com/', type: 'Mobile' },
  { city: 'Bee Cave', state: 'Texas', name: 'Fluid Revival Bee Cave', address: 'Bee Cave, TX', phone: '+1 512-337-3561', website: 'https://fluidrevival.com/bee-cave/', type: 'Mobile' },
  { city: 'Lakeway', state: 'Texas', name: 'Fluid Revival Lakeway', address: 'Lakeway, TX', phone: '+1 512-337-3561', website: 'https://fluidrevival.com/lakeway/', type: 'Mobile' },
  { city: 'Lakeway', state: 'Texas', name: 'Austin Cosmetic Surgery Lakeway IV', address: 'Lakeway, TX', phone: null, website: 'https://www.austincosmeticsurgery.com/health-and-wellness/iv-therapy/', type: 'In-Clinic' },
  { city: 'Leander', state: 'Texas', name: 'Fluid Revival Leander', address: 'Leander, TX', phone: '+1 512-337-3561', website: 'https://fluidrevival.com/leander/', type: 'Mobile' },
  { city: 'Dripping Springs', state: 'Texas', name: 'Fluid Revival Dripping Springs', address: 'Dripping Springs, TX', phone: '+1 512-337-3561', website: 'https://fluidrevival.com/dripping-springs/', type: 'Mobile' },
  { city: 'Austin', state: 'Texas', name: 'IVTherapy2Go Austin', address: 'Mobile - Austin, TX', phone: null, website: 'https://ivtherapy2go.com/Locations/Austin', type: 'Mobile' },
  { city: 'Bee Cave', state: 'Texas', name: 'Alive and Well Bee Cave', address: 'Bee Cave, TX', phone: null, website: 'https://aliveandwell.health/iv-therapy-bee-cave/', type: 'In-Clinic' },
  { city: 'Austin', state: 'Texas', name: 'WAYDS Mobile IV Therapy Austin', address: 'Mobile - Austin, TX', phone: null, website: 'https://www.wayds.org/austintx/', type: 'Mobile' },
];

(async () => {
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
      console.log(`  ⏭  ${p.name}`);
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

  console.log(`Ready: ${rows.length}, skipped: ${skipped}`);
  if (rows.length === 0) return;

  const { data, error } = await s.from('providers').insert(rows).select('city, name');
  if (error) { console.log('ERR:', error.message); process.exit(1); }
  data.forEach(d => console.log(`  ✓ [${d.city}] ${d.name}`));

  // ════════════ FINAL SESSION SUMMARY ════════════
  console.log(`\n════════════ FINAL SESSION SUMMARY ════════════`);
  const groups = {
    'Tampa metro':           ['tampa', 'wesley chapel', 'lutz', 'brandon', 'oldsmar'],
    'Houston suburbs':       ['katy', 'sugar land', 'pearland', 'friendswood', 'league city', 'missouri city'],
    'Peninsula CA':          ['san carlos', 'palo alto', 'los altos', 'menlo park', 'mountain view', 'san mateo', 'foster city', 'burlingame', 'redwood city', 'belmont'],
    'Miami metro':           ['miami', 'miami beach', 'coconut grove', 'doral', 'aventura', 'coral gables', 'kendall', 'pinecrest', 'hialeah'],
    'Austin metro':          ['austin', 'round rock', 'cedar park', 'bee cave', 'lakeway', 'leander', 'dripping springs', 'pflugerville', 'georgetown'],
  };

  for (const [group, cities] of Object.entries(groups)) {
    let total = 0;
    for (const c of cities) {
      const { count } = await s.from('providers').select('id', { count: 'exact', head: true }).ilike('city', c);
      total += count;
    }
    console.log(`  ${group.padEnd(20)} ${total} providers`);
  }

  const { count: grandTotal } = await s.from('providers').select('id', { count: 'exact', head: true });
  console.log(`\n  GRAND TOTAL providers in DB: ${grandTotal}`);
})();
