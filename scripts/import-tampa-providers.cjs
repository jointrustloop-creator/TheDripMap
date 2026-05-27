// Imports Tampa-area IV therapy providers from research.
// Skips duplicates by slug or by website URL.

require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CITY = 'Tampa';
const STATE = 'Florida';
const COUNTRY = 'United States';

// 11 confirmed physical clinics with full data + 11 mobile services serving Tampa
const PROVIDERS = [
  // ──── Physical clinics with verified address (from WebFetch) ────
  {
    name: 'Restore Hyper Wellness - Westchase',
    address: '10718 Countryway Blvd, Tampa, FL 33626',
    phone: '+1 813-510-3104',
    website: 'https://www.restore.com/locations/fl-tampa-westchase-fl012',
    type: 'In-Clinic',
    mobile_service: false,
  },
  {
    name: 'The DRIPBaR Tampa New Tampa',
    address: '18059 Highwoods Preserve Pkwy, Tampa, FL 33647',
    phone: '+1 813-437-9872',
    website: 'https://thedripbarnewtampa.com',
    type: 'In-Clinic',
    mobile_service: false,
  },
  {
    name: 'The DRIPBaR Carrollwood',
    address: 'Carrollwood, Tampa, FL',
    phone: null,
    website: 'https://thedripbar.com/carrollwood/',
    type: 'In-Clinic',
    mobile_service: false,
  },
  {
    name: 'Tampa Urgent Care - Westchase IV Hydration',
    address: '12950 Race Track Rd, Tampa, FL 33626',
    phone: '+1 813-616-8810',
    website: 'https://www.tampauc.com/iv-hydration',
    type: 'In-Clinic',
    mobile_service: false,
  },
  {
    name: 'Tampa Urgent Care - Brandon IV Hydration',
    address: '1236 Kingsway Rd, Brandon, FL 33510',
    phone: '+1 813-616-8810',
    website: 'https://www.tampauc.com/iv-hydration',
    type: 'In-Clinic',
    mobile_service: false,
  },
  {
    name: 'VIVIFY Plastic Surgery & Med Spa',
    address: '1000 W Kennedy Blvd #202, Tampa, FL 33606',
    phone: '+1 813-588-5150',
    website: 'https://www.vivifyps.com/vivify-medspa/health-and-wellness/iv-therapy/',
    type: 'In-Clinic',
    mobile_service: false,
  },
  {
    name: 'Ageless Vitality Center',
    address: '4730 N Habana Ave Ste 101, Tampa, FL 33614',
    phone: '+1 813-955-4289',
    website: 'https://www.agelessvitalitycenter.net/services/iv-infusions',
    type: 'In-Clinic',
    mobile_service: false,
  },
  {
    name: 'Dr. Fig Med Spa',
    address: '4104 W Linebaugh Ave, Tampa, FL 33624',
    phone: '+1 813-565-7705',
    website: 'https://drfigmedspa.com/iv-therapy/',
    type: 'In-Clinic',
    mobile_service: false,
  },
  {
    name: 'Health + Glow Tampa',
    address: '4331 S Manhattan Ave, Tampa, FL 33611',
    phone: '+1 813-832-4569',
    website: 'https://myhealthandglow.com/',
    type: 'In-Clinic',
    mobile_service: false,
  },
  {
    name: 'Medspa of Tampa',
    address: 'Tampa, FL',
    phone: null,
    website: 'https://medspaoftampa.com/tampa-myers-cocktail-plenish-iv-therapy/',
    type: 'In-Clinic',
    mobile_service: false,
  },

  // ──── Local mobile services that primarily serve Tampa Bay ────
  {
    name: 'Intravene Wellness Therapies Tampa',
    address: 'Mobile service across Tampa Bay, FL',
    phone: null,
    website: 'https://intravenewellnesstherapies.com/iv-therapy-tampa/',
    type: 'Mobile',
    mobile_service: true,
  },
  {
    name: 'Hydralive Therapy Tampa',
    address: 'Tampa, FL',
    phone: null,
    website: 'https://hydralivetherapy.com/location/tampa/',
    type: 'In-Clinic',
    mobile_service: false,
  },
  {
    name: 'The Nectar Remedy',
    address: 'Mobile service across Tampa Bay, FL',
    phone: null,
    website: 'https://thenectarremedy.com/',
    type: 'Mobile',
    mobile_service: true,
  },
  {
    name: 'IV Hydration Tampa',
    address: 'Tampa, FL',
    phone: null,
    website: 'https://ivhydrationtampa.com/',
    type: 'Mobile',
    mobile_service: true,
  },

  // ──── National mobile services with Tampa coverage ────
  {
    name: 'Drip Hydration - Mobile IV Therapy - Tampa',
    address: 'Mobile service across Tampa Bay, FL',
    phone: null,
    website: 'https://driphydration.com/coverage-areas/tampa/',
    type: 'Mobile',
    mobile_service: true,
  },
  {
    name: 'Mobile IV Nurses Tampa',
    address: 'Mobile service across Tampa Bay, FL',
    phone: null,
    website: 'https://mobileivnurses.com/areas-we-serve/florida/iv-therapy-in-tampa-fl/',
    type: 'Mobile',
    mobile_service: true,
  },
  {
    name: 'HydraMed Tampa',
    address: 'Mobile service across Tampa Bay, FL',
    phone: null,
    website: 'https://hydramed.com/areas-served/florida/tampa',
    type: 'Mobile',
    mobile_service: true,
  },
  {
    name: 'The IV Doc Tampa',
    address: 'Mobile service across Tampa Bay, FL',
    phone: null,
    website: 'https://www.theivdoc.com/mobile-iv-therapy-tampa',
    type: 'Mobile',
    mobile_service: true,
  },
  {
    name: 'Mobile IV Medics Tampa',
    address: 'Mobile service across Tampa Bay, FL',
    phone: null,
    website: 'https://mobileivmedics.com/service-areas/florida/tampa/',
    type: 'Mobile',
    mobile_service: true,
  },
  {
    name: 'The Drip IV Therapy Tampa',
    address: 'Mobile service across Tampa Bay, FL',
    phone: null,
    website: 'https://thedripivtherapy.com/mobile-iv-therapy-tampa-florida/',
    type: 'Mobile',
    mobile_service: true,
  },
  {
    name: 'LetsBatch IV Therapy Tampa',
    address: 'Mobile service across Tampa Bay, FL',
    phone: null,
    website: 'https://letsbatch.com/experiences/9d9e3cdd-502c-4c2c-bdbe-1a604ef304fd',
    type: 'Mobile',
    mobile_service: true,
  },
];

(async () => {
  console.log(`Importing ${PROVIDERS.length} Tampa providers...\n`);

  // Pre-check: existing Tampa slugs + websites to skip duplicates
  const { data: existing } = await s.from('providers')
    .select('slug, website, name')
    .or('city.ilike.%tampa%,address.ilike.%tampa%');
  const existingSlugs = new Set(existing.map(p => p.slug));
  const existingWebsites = new Set(existing.map(p => (p.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '')));
  const existingNames = new Set(existing.map(p => p.name.toLowerCase().trim()));

  const rows = [];
  let skipped = 0;
  for (const p of PROVIDERS) {
    const slug = `${slugify(p.name)}-${slugify(CITY)}`;
    const websiteKey = (p.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
    const nameKey = p.name.toLowerCase().trim();

    if (existingSlugs.has(slug) || (websiteKey && existingWebsites.has(websiteKey)) || existingNames.has(nameKey)) {
      console.log(`  ⏭  Skipped (duplicate): ${p.name}`);
      skipped++;
      continue;
    }

    rows.push({
      slug,
      name: p.name,
      category: 'IV Therapy',
      city: CITY,
      state: STATE,
      country: COUNTRY,
      address: p.address,
      phone: p.phone,
      website: p.website,
      type: p.type,
      is_featured: false,
      availability: true,
      rating: null,
      reviews: null,
      created_at: new Date().toISOString(),
    });
  }

  console.log(`\nReady to insert: ${rows.length}, skipped: ${skipped}\n`);
  if (rows.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  // Insert in batches of 10 to avoid request size limits
  let inserted = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += 10) {
    const batch = rows.slice(i, i + 10);
    const { data, error } = await s.from('providers').insert(batch).select('id, slug, name');
    if (error) {
      console.log(`  ✗ Batch ${i / 10 + 1} failed: ${error.message}`);
      failed += batch.length;
    } else {
      data.forEach(d => console.log(`  ✓ Inserted: ${d.name}  (${d.slug})`));
      inserted += data.length;
    }
  }

  console.log(`\n=== RESULT ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Failed: ${failed}`);

  // Final count
  const { count: tampaTotal } = await s.from('providers')
    .select('id', { count: 'exact', head: true })
    .or('city.ilike.%tampa%,address.ilike.%tampa%');
  console.log(`\nTotal Tampa-area providers in DB now: ${tampaTotal}`);

  // Update cities table count if there's a row for Tampa
  const { data: cityRow } = await s.from('cities').select('*').ilike('slug', 'tampa').maybeSingle();
  if (cityRow) {
    const { count: exactCount } = await s.from('providers').select('id', { count: 'exact', head: true }).ilike('city', 'tampa');
    await s.from('cities').update({ listing_count: exactCount }).eq('slug', cityRow.slug);
    console.log(`Updated cities.listing_count for tampa → ${exactCount}`);
  }
})();
