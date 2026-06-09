const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1];
const SB = get('NEXT_PUBLIC_SUPABASE_URL');
const KEY = get('SUPABASE_SERVICE_ROLE_KEY');

async function q(path) {
  const r = await fetch(SB + '/rest/v1/' + path, {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
  });
  if (!r.ok) return { error: r.status + ' ' + (await r.text()).slice(0, 200) };
  return r.json();
}

(async () => {
  const names = ['insight naturopathic', 'soma and soul', "nature's touch", 'bay wellness'];
  const found = [];
  for (const n of names) {
    const r = await q(
      'providers?name=ilike.' + encodeURIComponent('%' + n + '%') + '&select=id,slug,name,address,city,state,country,phone,website,services,specialties,working_hours,is_claimed,email,description,reply_status'
    );
    console.log('=== Search:', n, '===');
    if (!Array.isArray(r)) {
      console.log('  error:', r);
      continue;
    }
    for (const p of r) {
      console.log('  ' + (p.is_claimed ? '[CLAIMED] ' : '') + p.slug + '  |  ' + p.name);
      console.log('    address: ' + p.address);
      console.log('    city: ' + p.city + ', ' + p.state + ', ' + p.country);
      console.log('    phone: ' + p.phone);
      console.log('    website: ' + p.website);
      console.log('    email: ' + p.email);
      if (Array.isArray(p.services) && p.services.length) console.log('    services: ' + p.services.slice(0, 5).join(' / '));
      if (Array.isArray(p.specialties) && p.specialties.length) console.log('    specialties: ' + p.specialties.slice(0, 5).join(' / '));
      if (p.working_hours) console.log('    has working_hours: yes');
      if (p.is_claimed || (p.reply_status && p.reply_status !== 'none')) found.push(p);
    }
  }
  fs.writeFileSync('./.tmp-4clinic.json', JSON.stringify(found, null, 2));
  console.log('\nWrote ' + found.length + ' provider records to .tmp-4clinic.json');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
