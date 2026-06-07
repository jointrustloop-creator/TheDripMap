/**
 * Export existing Canadian clinic names + addresses grouped by metro
 * so research agents can dedupe pre-flight.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const METROS = {
  montreal: ['Montreal', 'Laval', 'Longueuil', 'Brossard', 'Pointe-Claire', 'Westmount', 'Dollard-des-Ormeaux', 'Dorval', 'Saint-Laurent', 'Mont-Royal', 'Outremont', 'Verdun', 'Lachine', 'LaSalle'],
  quebec_city: ['Quebec City', 'Quebec', 'Lévis', 'Sainte-Foy', 'Beauport', 'Charlesbourg'],
  edmonton: ['Edmonton', 'St. Albert', 'Sherwood Park', 'Spruce Grove', 'Leduc', 'Fort Saskatchewan', 'Beaumont'],
  ottawa: ['Ottawa', 'Gatineau', 'Kanata', 'Nepean', 'Orléans', 'Stittsville', 'Barrhaven'],
  winnipeg: ['Winnipeg'],
  gta_satellites: ['Brampton', 'Markham', 'Richmond Hill', 'North York', 'Etobicoke', 'Scarborough', 'Aurora', 'Newmarket', 'Stouffville', 'Whitchurch-Stouffville', 'King City', 'Concord', 'Thornhill'],
  hamilton_niagara: ['Hamilton', 'St. Catharines', 'Niagara Falls', 'Niagara-on-the-Lake', 'Welland', 'Grimsby', 'Stoney Creek', 'Ancaster', 'Dundas', 'Burlington'],
  halifax: ['Halifax', 'Dartmouth', 'Bedford', 'Sackville'],
};

(async () => {
  const { data, error } = await sb
    .from('providers')
    .select('id, name, slug, city, state, address, website, type')
    .eq('country', 'Canada')
    .range(0, 1999);

  if (error) {
    console.error(error);
    return;
  }

  const byMetro = {};
  for (const [metro, cities] of Object.entries(METROS)) {
    byMetro[metro] = data
      .filter((p) => cities.includes(p.city))
      .map((p) => ({
        name: p.name,
        slug: p.slug,
        city: p.city,
        address: p.address,
        website: p.website,
        type: p.type,
      }))
      .sort((a, b) => (a.city + a.name).localeCompare(b.city + b.name));
  }

  fs.writeFileSync('scripts/_ca-clinics-by-metro.json', JSON.stringify(byMetro, null, 2));
  for (const [metro, list] of Object.entries(byMetro)) {
    console.log(metro.padEnd(20) + ' ' + list.length + ' existing');
  }
  console.log();
  console.log('Saved: scripts/_ca-clinics-by-metro.json');
})();
