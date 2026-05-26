require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const today = new Date().toISOString().slice(0,10);

  const { count: total } = await s.from('providers').select('id', { count: 'exact', head: true });
  const { count: featured } = await s.from('providers').select('id', { count: 'exact', head: true }).eq('is_featured', true);
  const { count: sentToday } = await s.from('providers').select('id', { count: 'exact', head: true }).gte('outreach_sent_at', `${today}T00:00:00Z`);
  const { count: sentTotal } = await s.from('providers').select('id', { count: 'exact', head: true }).eq('outreach_sent', true);
  const { count: bouncedTotal } = await s.from('providers').select('id', { count: 'exact', head: true }).eq('email_bounced', true);

  // Eligible pool — exact same filter as cron
  const { data: poolRaw } = await s.from('providers')
    .select('rating, reviews', { count: 'exact' })
    .neq('availability', false).eq('is_featured', false)
    .neq('outreach_sent', true).neq('email_bounced', true)
    .or('rating.gte.4.5,rating.is.null')
    .not('email', 'is', null).neq('email', '');
  const eligible = (poolRaw || []).filter(p => !p.rating || (Number(p.reviews) >= 10 && Number(p.rating) >= 4.5)).length;

  const { count: noEmail } = await s.from('providers').select('id', { count: 'exact', head: true })
    .eq('is_featured', false).neq('outreach_sent', true)
    .or('email.is.null,email.eq.');
  const { count: noEmailHasWebsite } = await s.from('providers').select('id', { count: 'exact', head: true })
    .eq('is_featured', false).neq('outreach_sent', true)
    .or('email.is.null,email.eq.').not('website', 'is', null).neq('website', '');
  const { count: claimRequests } = await s.from('claim_requests').select('id', { count: 'exact', head: true });

  console.log(JSON.stringify({
    total, featured, sentToday, sentTotal, bouncedTotal,
    eligible, daysAt19: Math.ceil(eligible / 19),
    noEmail, noEmailHasWebsite, claimRequests
  }, null, 2));
})();
