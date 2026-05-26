require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { count: total } = await s.from('providers').select('id', { count: 'exact', head: true });
  const { count: withEmail } = await s.from('providers').select('id', { count: 'exact', head: true }).not('email', 'is', null).neq('email', '');
  const { count: unclaimedWithEmail } = await s.from('providers').select('id', { count: 'exact', head: true }).eq('is_featured', false).not('email', 'is', null).neq('email', '');
  const { count: alreadySent } = await s.from('providers').select('id', { count: 'exact', head: true }).eq('outreach_sent', true);
  const { count: eligibleNext } = await s.from('providers').select('id', { count: 'exact', head: true })
    .eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true)
    .gte('rating', 4.5).gte('reviews', 10).not('email', 'is', null).neq('email', '');
  const { count: noEmailRemaining } = await s.from('providers').select('id', { count: 'exact', head: true })
    .eq('is_featured', false).neq('outreach_sent', true)
    .or('email.is.null,email.eq.');

  console.log('=== FINAL POOL STATUS ===');
  console.log(`Total providers in DB:                 ${total}`);
  console.log(`Providers with email:                  ${withEmail}`);
  console.log(`Unclaimed providers with email:        ${unclaimedWithEmail}`);
  console.log(`Already outreached (skip):             ${alreadySent}`);
  console.log(`Eligible for next cron run:            ${eligibleNext}`);
  console.log(`Unclaimed STILL missing email:         ${noEmailRemaining}`);
  console.log('');
  console.log(`Pipeline at 19/day: ${Math.ceil(eligibleNext / 19)} days (${eligibleNext} emails)`);
})();
