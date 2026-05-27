require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const todayUTC = new Date().toISOString().slice(0,10);

  // Counts
  const { count: totalProviders } = await s.from('providers').select('id', { count:'exact', head:true });
  const { count: claimed } = await s.from('providers').select('id', { count:'exact', head:true }).eq('is_featured', true);
  const { count: blogPosts } = await s.from('blog_posts').select('id', { count:'exact', head:true });
  const { count: outreachSent } = await s.from('providers').select('id', { count:'exact', head:true }).eq('outreach_sent', true);
  const { count: bounced } = await s.from('providers').select('id', { count:'exact', head:true }).eq('email_bounced', true);
  const { count: claimRequests } = await s.from('claim_requests').select('id', { count:'exact', head:true });
  const { count: pendingClaims } = await s.from('claim_requests').select('id', { count:'exact', head:true }).eq('status', 'pending');

  // Eligible pipeline (same filter the cron uses)
  const { data: poolRaw } = await s.from('providers')
    .select('rating, reviews')
    .neq('availability', false).eq('is_featured', false)
    .neq('outreach_sent', true).neq('email_bounced', true)
    .or('rating.gte.4.5,rating.is.null')
    .not('email', 'is', null).neq('email','');
  const eligible = (poolRaw || []).filter(p => !p.rating || (Number(p.reviews) >= 10 && Number(p.rating) >= 4.5)).length;

  // Follow-up pipeline — 7+ days since outreach, not claimed, not followed up
  const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();
  const { count: followupEligible } = await s.from('providers').select('id', { count:'exact', head:true })
    .eq('is_featured', false).eq('outreach_sent', true).neq('followup_sent', true).neq('email_bounced', true)
    .lte('outreach_sent_at', sevenDaysAgo)
    .not('email','is',null).neq('email','');

  // Claimed today (Kia)
  const { count: sentToday } = await s.from('providers').select('id', { count:'exact', head:true })
    .gte('outreach_sent_at', `${todayUTC}T00:00:00Z`);

  // Snake_case migration: check if camelCase columns still have differing data from snake_case
  const { data: sampleProv } = await s.from('providers').select('imageUrl, image_url').limit(5);
  const camelStillHasData = sampleProv?.some(p => p.imageUrl && p.imageUrl !== p.image_url);
  const { count: camelOnly } = await s.from('providers').select('id', { count:'exact', head:true })
    .not('imageUrl', 'is', null).is('image_url', null);

  console.log(JSON.stringify({
    totalProviders, claimed, blogPosts,
    outreachSent, bounced,
    claimRequests, pendingClaims,
    eligibleForNextCron: eligible,
    followupEligibleNow: followupEligible,
    sentToday,
    snake_case_migration: {
      camelStillHasData_in_sample: camelStillHasData,
      providersWith_camelImageUrl_only_no_snake: camelOnly,
    },
  }, null, 2));
})();
