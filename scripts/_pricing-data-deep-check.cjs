require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data: all } = await sb.from('providers').select('id, name, slug, city, state, price_range, decision_drivers, specialties').eq('country','Canada').range(0, 1999);
  const withPR = all.filter((p) => p.price_range);
  console.log('CA providers with price_range in DB: ' + withPR.length);
  console.log('Breakdown of values:');
  const valCounts = {};
  for (const p of withPR) valCounts[p.price_range] = (valCounts[p.price_range] || 0) + 1;
  for (const [v,c] of Object.entries(valCounts).sort((a,b)=>b[1]-a[1])) console.log('  ' + (v||'(empty)').padEnd(20) + ' x' + c);
  console.log();
  console.log('Per-clinic listing:');
  for (const p of withPR) console.log('  ' + p.city.padEnd(14) + ' ' + p.name.padEnd(48) + ' ' + p.price_range);

  // any structured pricing anywhere
  const withDD = all.filter((p) => p.decision_drivers && (p.decision_drivers.pricing || p.decision_drivers.prices || p.decision_drivers.price));
  console.log();
  console.log('CA providers with structured pricing in decision_drivers: ' + withDD.length);

  console.log();
  console.log('Specialty arrays carrying pricing strings: 0 (specialties is a string array, no dollar amounts)');
})();
