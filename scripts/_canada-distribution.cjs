/**
 * Live snapshot of Canadian provider distribution.
 * Groups by province + top cities so we know exactly where we're thin.
 */
require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

(async () => {
  // Pull all Canadian rows in one shot — PostgREST caps at 1000 default, raise it.
  const { data, error } = await sb
    .from('providers')
    .select('id, name, slug, city, state, type, category, is_hidden')
    .eq('country', 'Canada')
    .range(0, 1999);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Total Canadian providers (live): ' + data.length);
  console.log();

  // By province
  const byProv = {};
  for (const p of data) {
    const prov = p.state || '(no province)';
    byProv[prov] = (byProv[prov] || 0) + 1;
  }
  console.log('=== By province ===');
  for (const [prov, count] of Object.entries(byProv).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + prov.padEnd(28) + ' ' + count);
  }

  // By city
  const byCity = {};
  const byCityMobile = {};
  for (const p of data) {
    const city = p.city || '(no city)';
    byCity[city] = (byCity[city] || 0) + 1;
    if (p.type === 'Mobile' || p.type === 'Both') {
      byCityMobile[city] = (byCityMobile[city] || 0) + 1;
    }
  }
  console.log();
  console.log('=== By city (top 35) ===');
  console.log('  City                                Total   Mobile');
  for (const [city, count] of Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 35)) {
    const mob = byCityMobile[city] || 0;
    console.log('  ' + city.padEnd(34) + '  ' + String(count).padStart(4) + '   ' + String(mob).padStart(4));
  }

  // GTA roll-up
  const GTA_CITIES = [
    'Toronto', 'Mississauga', 'Brampton', 'Vaughan', 'Markham',
    'Richmond Hill', 'Oakville', 'Burlington', 'Hamilton', 'Pickering',
    'Whitby', 'Oshawa', 'Etobicoke', 'Scarborough', 'North York',
    'Aurora', 'Newmarket', 'Ajax', 'Milton', 'Halton Hills',
    'King City', 'Stouffville', 'Caledon', 'Concord', 'Thornhill',
  ];
  let gtaTotal = 0;
  let gtaMobile = 0;
  console.log();
  console.log('=== GTA breakdown ===');
  for (const city of GTA_CITIES) {
    const c = byCity[city] || 0;
    const m = byCityMobile[city] || 0;
    if (c > 0) {
      console.log('  ' + city.padEnd(20) + ' ' + String(c).padStart(3) + '   mobile: ' + m);
      gtaTotal += c;
      gtaMobile += m;
    }
  }
  console.log('  ' + '— GTA TOTAL —'.padEnd(20) + ' ' + String(gtaTotal).padStart(3) + '   mobile: ' + gtaMobile);

  // Greater Vancouver
  const GVR_CITIES = [
    'Vancouver', 'Burnaby', 'Richmond', 'Surrey', 'Coquitlam',
    'Port Coquitlam', 'Port Moody', 'New Westminster', 'North Vancouver',
    'West Vancouver', 'Delta', 'Langley', 'White Rock', 'Maple Ridge',
    'Pitt Meadows', 'Squamish',
  ];
  let gvrTotal = 0;
  console.log();
  console.log('=== Greater Vancouver breakdown ===');
  for (const city of GVR_CITIES) {
    const c = byCity[city] || 0;
    if (c > 0) {
      console.log('  ' + city.padEnd(20) + ' ' + String(c).padStart(3) + '   mobile: ' + (byCityMobile[city] || 0));
      gvrTotal += c;
    }
  }
  console.log('  ' + '— GVR TOTAL —'.padEnd(20) + ' ' + String(gvrTotal).padStart(3));

  // Hidden count
  const hidden = data.filter((p) => p.is_hidden).length;
  console.log();
  console.log('Currently hidden: ' + hidden);
})();
