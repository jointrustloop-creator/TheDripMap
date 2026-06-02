// Probe operator_profiles for the Tri-Health submission, plus inspect schema.
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data, error } = await s.from('operator_profiles')
    .select('*')
    .eq('email', 'admin@trihealth.ca');
  console.log('operator_profiles for admin@trihealth.ca:');
  console.log(JSON.stringify({ data, error: error?.message }, null, 2));

  // Yesterday's profiles
  const since = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await s.from('operator_profiles')
    .select('id, email, owner_name, clinic_id, created_at, profile_data')
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  console.log('\noperator_profiles created in last 36h:');
  for (const r of recent || []) {
    console.log(' -', r.created_at, r.email, '|', r.owner_name, '| clinic_id=' + r.clinic_id,
      '| clinicName=' + (r.profile_data?.clinicName || ''));
  }
})();
