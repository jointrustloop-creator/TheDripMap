require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await s.from('providers')
    .select('slug, name, website, rating, reviews, city, state')
    .eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true)
    .or('email.is.null,email.eq.')
    .not('website', 'is', null).neq('website', '')
    .gte('rating', 4.5).gte('reviews', 10)
    .order('rating', { ascending: false })
    .order('reviews', { ascending: false });
  if (error) { console.error(error); process.exit(1); }

  // Clean URLs of UTM noise
  const clean = (u) => u.replace(/%3F.*$/, '').replace(/\?.*$/, '');
  const rows = data.map((r) => ({ ...r, website: clean(r.website) }));

  fs.writeFileSync('C:/Users/Dell/Desktop/TheDripMap/scripts/email-discovery-batch.json', JSON.stringify(rows, null, 2));
  console.log(`Wrote ${rows.length} candidates to scripts/email-discovery-batch.json`);
})();
