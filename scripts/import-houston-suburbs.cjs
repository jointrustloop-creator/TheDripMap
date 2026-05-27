require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
function slugify(str) { return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''); }

const STATE = 'Texas';
const COUNTRY = 'United States';

// city tied to each provider
const PROVIDERS = [
  // ──── Katy ────
  { city: 'Katy', name: 'Restore Hyper Wellness - Katy', address: '23116 Cinco Ranch Boulevard, Katy, TX 77494', phone: null, website: 'https://www.restore.com/locations/tx-katy-tx014', type: 'In-Clinic' },
  { city: 'Katy', name: 'The DRIPBaR Cinco Ranch', address: 'Cinco Ranch, Katy, TX', phone: null, website: 'https://cinco-ranch-stableside.thedripbar.com/', type: 'In-Clinic' },
  { city: 'Katy', name: 'Total Wellness Drip Spa Katy', address: 'Katy, TX', phone: null, website: 'https://totalwellnessdripspa.com/katy-tx-drip-spa/iv-hydration-cinco-ranch-tx/', type: 'In-Clinic' },
  { city: 'Katy', name: 'Bounce Hydration Katy', address: 'Mobile service across Katy, TX', phone: null, website: 'https://www.bouncehydration.com/locations/katy', type: 'Mobile' },
  { city: 'Katy', name: 'Memorial Health Urgent Care and Infusions Katy', address: 'Katy, TX', phone: null, website: 'https://memorialhealthuci.com/iv-therapy', type: 'In-Clinic' },
  { city: 'Katy', name: 'INTRA-V Katy', address: 'Cinco Ranch area, Katy, TX', phone: null, website: 'https://www.intra-v.com/houston-local-vitamin-iv-infusions-intra-v', type: 'In-Clinic' },
  { city: 'Katy', name: 'Mobile IV Medics Katy', address: 'Mobile service across Katy, TX', phone: null, website: 'https://mobileivmedics.com/service-areas/texas/katy/', type: 'Mobile' },
  { city: 'Katy', name: 'The Drip Dose Katy', address: 'Villagio Shopping Center, Cinco Ranch, Katy, TX', phone: null, website: 'https://www.thedripdose.com/locations/katy/', type: 'In-Clinic' },

  // ──── Sugar Land ────
  { city: 'Sugar Land', name: 'PRIME IV Hydration & Wellness - Sugar Land', address: '13574 University Blvd Ste 950, Sugar Land, TX 77479', phone: null, website: 'https://www.yelp.com/biz/prime-iv-hydration-and-wellness-sugar-land-sugar-land', type: 'In-Clinic' },
  { city: 'Sugar Land', name: 'Mobile IV Medics Sugar Land', address: 'Mobile service across Sugar Land, TX', phone: null, website: 'https://mobileivmedics.com/service-areas/texas/sugar-land/', type: 'Mobile' },
  { city: 'Sugar Land', name: 'Restore Hyper Wellness - Sugar Land', address: 'Sugar Land, TX', phone: null, website: 'https://www.restore.com/local/iv-drip-therapy-tx-sugar-land-tx004', type: 'In-Clinic' },
  { city: 'Sugar Land', name: 'Sugar Land Medical Spa', address: 'Sugar Land, TX', phone: null, website: 'https://sugarlandmedspa.com/services/iv-therapy-houston/', type: 'In-Clinic' },
  { city: 'Sugar Land', name: 'IV Therapy 2Go Sugar Land', address: 'Sugar Land, TX', phone: null, website: 'https://www.ivtherapy2go.com/Locations/SugarLand', type: 'Mobile' },
  { city: 'Sugar Land', name: 'Luminance Health & Beauty Clinic Sugar Land', address: 'Sugar Land, TX', phone: null, website: 'https://www.luminancehbc.com/iv-therapy-sugar-land-tx', type: 'In-Clinic' },
  { city: 'Sugar Land', name: 'Elite Doc Health and Beauty Sugar Land', address: 'Sugar Land, TX', phone: null, website: 'https://www.elitedochealthandbeauty.com/iv-nutrition-therapy/', type: 'In-Clinic' },
  { city: 'Sugar Land', name: 'CLS Health Infusion Center Sugar Land', address: 'Sugar Creek, Sugar Land, TX', phone: null, website: 'https://cls.health/locations/infusion-center-sugar-land-sugar-creek', type: 'In-Clinic' },

  // ──── Pearland ────
  { city: 'Pearland', name: 'REGAIN MedSpa Pearland', address: '11200 Broadway St #1410 Unit 6, Pearland, TX 77584', phone: null, website: 'https://regainmedspa.com/services/wellness-rejuvenation-services/iv-hydration-150487507', type: 'In-Clinic' },
  { city: 'Pearland', name: 'IV Solutions Spa & Wellness Pearland', address: '1607 N Main St, Pearland, TX 77581', phone: null, website: 'https://www.yelp.com/biz/iv-solutions-spa-and-wellness-pearland', type: 'In-Clinic' },
  { city: 'Pearland', name: 'Pearland Healthcare Center IV Infusion', address: 'Pearland, TX', phone: null, website: 'https://pearlandhealthcare.org/iv-infusion-therapy-in-pearland/', type: 'In-Clinic' },
  { city: 'Pearland', name: 'Dr. Shel Wellness Pearland', address: 'Pearland, TX', phone: '+1 281-313-7435', website: 'https://drshel.com/locations/pearland-city/iv-therapy-tx/', type: 'In-Clinic' },
  { city: 'Pearland', name: 'IV Therapy 2Go Pearland', address: 'Pearland, TX', phone: null, website: 'https://ivtherapy2go.com/Locations/Pearland', type: 'Mobile' },

  // ──── Friendswood ────
  { city: 'Friendswood', name: 'Health Fusion Drip Spa Friendswood', address: 'Friendswood, TX', phone: null, website: 'https://www.healthfusiondripspa.com/', type: 'In-Clinic' },
  { city: 'Friendswood', name: 'Dr. T Med Spa Friendswood', address: 'Friendswood, TX', phone: null, website: 'https://drtmedspa.com/services/wellness/iv-hydration-therapy/', type: 'In-Clinic' },
  { city: 'Friendswood', name: 'Ageless by Ezzo Friendswood', address: 'Friendswood, TX', phone: null, website: 'https://agelessezzo.com/iv-therapy/', type: 'In-Clinic' },

  // ──── League City / Clear Lake / Webster ────
  { city: 'League City', name: 'Restore Hyper Wellness - League City', address: 'League City, TX', phone: null, website: 'https://www.restore.com/locations/tx-league-city-tx048', type: 'In-Clinic' },
  { city: 'League City', name: 'Thrive Drip Spa Clear Lake', address: 'Clear Lake, TX', phone: null, website: 'https://thrivedripspa.com/clear-lake/', type: 'In-Clinic' },
  { city: 'League City', name: 'Premier Wellness And Aesthetics Of Clear Lake', address: 'Webster, TX', phone: null, website: 'https://premierwellnessclearlake.com/iv-infusion/', type: 'In-Clinic' },
  { city: 'League City', name: 'Clear Lake Medical Spa', address: 'Clear Lake, TX', phone: null, website: 'https://clmedspa.com/iv-drip/', type: 'In-Clinic' },
  { city: 'League City', name: 'Luxe Wellness and Aesthetics Spa', address: 'Texas City, TX (near League City)', phone: null, website: 'https://luxewellnessmedspa.com/iv-drip-therapy/', type: 'In-Clinic' },

  // ──── Missouri City ────
  { city: 'Missouri City', name: 'Luminance Health & Beauty Clinic Missouri City', address: 'Missouri City, TX', phone: null, website: 'https://www.luminancehbc.com/iv-therapy', type: 'In-Clinic' },
];

(async () => {
  console.log(`Importing ${PROVIDERS.length} Houston-suburb providers...\n`);

  const { data: existing } = await s.from('providers').select('slug, website, name').eq('state', STATE);
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
      city: p.city, state: STATE, country: COUNTRY,
      address: p.address, phone: p.phone, website: p.website, type: p.type,
      is_featured: false, availability: true, rating: null, reviews: null,
      created_at: new Date().toISOString(),
    });
  }

  console.log(`Ready to insert: ${rows.length}, skipped: ${skipped}\n`);
  if (rows.length === 0) return;

  let inserted = 0, failed = 0;
  for (let i = 0; i < rows.length; i += 10) {
    const batch = rows.slice(i, i + 10);
    const { data, error } = await s.from('providers').insert(batch).select('city, name');
    if (error) { console.log(`  ✗ Batch failed: ${error.message}`); failed += batch.length; }
    else { data.forEach(d => console.log(`  ✓ [${d.city}] ${d.name}`)); inserted += data.length; }
  }

  console.log(`\n=== Houston Suburbs ===\nInserted: ${inserted}\nSkipped: ${skipped}\nFailed: ${failed}\n`);

  // Per-suburb count
  for (const city of ['Katy', 'Sugar Land', 'Pearland', 'Friendswood', 'League City', 'Missouri City']) {
    const { count } = await s.from('providers').select('id', { count: 'exact', head: true }).ilike('city', city);
    console.log(`  ${city.padEnd(15)} total: ${count}`);
  }
})();
