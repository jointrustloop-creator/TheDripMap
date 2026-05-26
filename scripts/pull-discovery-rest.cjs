require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // All discovery candidates regardless of rating/reviews
  const { data, error } = await s.from('providers')
    .select('slug, name, website, rating, reviews, city, state')
    .eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true)
    .or('email.is.null,email.eq.')
    .not('website', 'is', null).neq('website', '')
    .order('rating', { ascending: false, nullsFirst: false })
    .order('reviews', { ascending: false, nullsFirst: false });
  if (error) { console.error(error); process.exit(1); }

  const clean = (u) => u.replace(/%3F.*$/, '').replace(/\?.*$/, '');
  const rows = data.map((r) => ({ ...r, website: clean(r.website) }));
  fs.writeFileSync('C:/Users/Dell/Desktop/TheDripMap/scripts/email-discovery-batch.json', JSON.stringify(rows, null, 2));
  console.log(`Wrote ${rows.length} remaining candidates`);
})();
