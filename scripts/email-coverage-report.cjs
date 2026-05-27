require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const today = new Date().toISOString().slice(0,10);

  // Today's new imports
  const { data: newImports } = await s.from('providers')
    .select('id, email')
    .gte('created_at', `${today}T00:00:00Z`);

  const withEmail = newImports.filter(p => p.email && p.email.trim()).length;
  const without = newImports.length - withEmail;
  console.log(`New imports today: ${newImports.length}`);
  console.log(`  ✓ Have email: ${withEmail}`);
  console.log(`  ✗ Still no email: ${without}`);
  console.log(`  Hit rate: ${((withEmail/newImports.length)*100).toFixed(0)}%`);

  // How many of new imports are now cron-eligible
  const { count: eligibleNow } = await s.from('providers').select('id', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00Z`)
    .eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true)
    .not('email', 'is', null).neq('email','');
  console.log(`\nNew-import providers now eligible for daily-outreach cron: ${eligibleNow}`);

  // Total cron-eligible pool now
  const { count: totalEligible } = await s.from('providers').select('id', { count: 'exact', head: true })
    .neq('availability', false).eq('is_featured', false)
    .neq('outreach_sent', true).neq('email_bounced', true)
    .or('rating.gte.4.5,rating.is.null')
    .not('email', 'is', null).neq('email','');
  console.log(`Total cron-eligible pool: ${totalEligible} (~${Math.ceil(totalEligible/19)} days at 19/day)`);
})();
