require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const JUNK_PATTERNS = [
  /@mysite\.com$/i, /@example\.(com|org|net)$/i, /@mailservice\.com$/i,
  /@domain\.com$/i, /@doe\.com$/i, /@yourwebsite\.com$/i, /@youremail\.com$/i,
  /@yourcompany\.com$/i, /@yoursite\.com$/i, /@yourdomain\.com$/i,
  /@sentry\.io$/i, /@wixpress\.com$/i, /@squarespace\.com$/i,
  /@godaddy\.com$/i, /@growth99\.com$/i, /@gmail-smtp/i, /@test\.com$/i,
  /@email\.com$/i, /^email@/i, /^test@/i, /^mymail@/i, /^user@/i,
  /^name@/i, /^john@/i, /^jane@/i, /^foo@/i, /^bar@/i,
  /noreply@|no-reply@|donotreply@|do-not-reply@/i,
  /@gibsonwhirl\.com$/i, /@buybuilder/i,
];

(async () => {
  // Pull every provider with an email and find junk ones
  const { data, error } = await s.from('providers').select('slug, name, email')
    .not('email', 'is', null).neq('email', '');
  if (error) { console.error(error); process.exit(1); }

  const junk = data.filter((r) => JUNK_PATTERNS.some((re) => re.test(r.email)));
  console.log(`Found ${junk.length} junk email rows (out of ${data.length})`);
  junk.forEach((j) => console.log(`  ✗ ${j.email} — ${j.name}`));

  if (junk.length === 0) return;

  const { error: upErr } = await s.from('providers')
    .update({ email: null })
    .in('slug', junk.map((j) => j.slug));
  if (upErr) { console.error('Update error:', upErr); process.exit(1); }
  console.log(`\n✓ Cleared ${junk.length} junk emails`);
})();
