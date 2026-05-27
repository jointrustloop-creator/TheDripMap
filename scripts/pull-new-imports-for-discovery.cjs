require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Pull all providers created today (the 121 new imports) that have website but no email
  const today = new Date().toISOString().slice(0,10);
  const { data, error } = await s.from('providers')
    .select('slug, name, website, city, state')
    .gte('created_at', `${today}T00:00:00Z`)
    .or('email.is.null,email.eq.')
    .not('website', 'is', null).neq('website','')
    .order('city');
  if (error) { console.error(error); process.exit(1); }

  // Clean URL — strip trailing query params for cleaner fetches
  const clean = (u) => u.replace(/\?.*$/, '').replace(/#.*$/, '');
  const rows = data.map(r => ({ ...r, website: clean(r.website) }));

  fs.writeFileSync('C:/Users/Dell/Desktop/TheDripMap/scripts/email-discovery-batch.json', JSON.stringify(rows, null, 2));
  console.log(`Wrote ${rows.length} new-import candidates to email-discovery-batch.json`);
})();
