require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

(async () => {
  const { count: total } = await sb.from('providers').select('id', { count: 'exact', head: true });
  const { count: canada } = await sb.from('providers').select('id', { count: 'exact', head: true }).eq('country', 'Canada');
  const { count: us } = await sb.from('providers').select('id', { count: 'exact', head: true }).eq('country', 'United States');
  const { count: calgary } = await sb.from('providers').select('id', { count: 'exact', head: true }).eq('city', 'Calgary');
  const { count: calgaryMobile } = await sb.from('providers').select('id', { count: 'exact', head: true }).eq('city', 'Calgary').in('type', ['Mobile', 'Both']);
  const { count: airdrie } = await sb.from('providers').select('id', { count: 'exact', head: true }).eq('city', 'Airdrie');
  const { count: okotoks } = await sb.from('providers').select('id', { count: 'exact', head: true }).eq('city', 'Okotoks');
  const { count: pool } = await sb.from('providers').select('id', { count: 'exact', head: true })
    .eq('country', 'Canada').eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true)
    .in('email_quality', ['high', 'medium']).not('email', 'is', null).neq('email', '');

  console.log('=== LIVE STATUS 2026-06-07 (after Calgary 17 insert) ===');
  console.log('Total providers:        ' + total);
  console.log('  Canada:               ' + canada);
  console.log('  United States:        ' + us);
  console.log('Calgary providers:      ' + calgary + '  (Calgary mobile: ' + calgaryMobile + ')');
  console.log('Airdrie:                ' + airdrie);
  console.log('Okotoks:                ' + okotoks);
  console.log('Canada outreach pool:   ' + pool);
})();
