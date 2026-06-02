// One-off: probe which columns exist on `providers` so we know exactly
// what's safe to insert / select for the Tri-Health rescue.
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COLS = [
  'id', 'name', 'slug', 'address', 'city', 'state', 'postal_code',
  'country', 'latitude', 'longitude', 'phone', 'website', 'description',
  'rating', 'review_count', 'is_claimed', 'is_featured', 'specialties',
  'online_booking_url', 'email', 'photos', 'hours', 'price_range',
  'category', 'source', 'decision_drivers', 'regulator_override',
  'outreach_sent', 'created_at',
];

(async () => {
  for (const c of COLS) {
    const { error } = await s.from('providers').select(c).limit(1);
    console.log(`${c.padEnd(22)} ${error ? 'MISSING (' + error.message.slice(0, 80) + ')' : 'OK'}`);
  }

  // Look up tri-health by email or name to see if a stub already exists
  const { data: nameMatch } = await s.from('providers')
    .select('id, slug, name, email')
    .ilike('name', '%tri-health%');
  console.log('\nproviders matching tri-health by name:', JSON.stringify(nameMatch));

  const { data: emailMatch } = await s.from('providers')
    .select('id, slug, name, email')
    .eq('email', 'admin@trihealth.ca');
  console.log('providers matching admin@trihealth.ca by email:', JSON.stringify(emailMatch));

  // Look up the orphan claim_request
  const { data: claims } = await s.from('claim_requests')
    .select('id, listing_id, email, owner_name, owner_phone, token, status, expires_at, created_at')
    .eq('email', 'admin@trihealth.ca')
    .order('created_at', { ascending: false });
  console.log('\nclaim_requests for admin@trihealth.ca:', JSON.stringify(claims, null, 2));
})();
