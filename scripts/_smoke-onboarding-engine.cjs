// Smoke test for the W1 onboarding engine. Read-only against the DB.
// Checks:
//   1. ONBOARDING_AUTOSEND gate is FALSE in src/lib/onboarding.ts
//   2. Templates contain no em-dash or en-dash characters
//   3. Template includes the 5 questions + logo/photos ask
//   4. onboarding_requests table exists and is selectable (post-migration)
//   5. verify-claim wiring imports enqueueOnboarding
//   6. vercel.json contains the onboarding-nudge cron with a valid schedule
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

let failures = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) failures++;
}

const root = path.join(__dirname, '..');
const onboardingSrc = fs.readFileSync(path.join(root, 'src/lib/onboarding.ts'), 'utf8');
const verifySrc = fs.readFileSync(path.join(root, 'app/verify-claim/page.tsx'), 'utf8');
const vercelJson = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

check('gate is closed', /export const ONBOARDING_AUTOSEND = false/.test(onboardingSrc));
check('no em/en dashes in onboarding.ts', !/[–—]/.test(onboardingSrc));
check('5 questions present', ['Who will patients meet', 'three most popular drips', 'first visit look like', 'ingredients come from', 'How do patients pay'].every(q => onboardingSrc.includes(q)));
check('logo + photos ask present', onboardingSrc.includes('Your logo') && onboardingSrc.includes('Two or three photos'));
check('nudge template present', onboardingSrc.includes('Quick nudge on the five questions'));
check('verify-claim wired', verifySrc.includes('enqueueOnboarding'));
const nudgeCron = (vercelJson.crons || []).find(c => c.path === '/api/cron/onboarding-nudge');
check('vercel.json nudge cron', !!nudgeCron && /^[\d*\/, -]+$/.test(nudgeCron.schedule));

(async () => {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await sb.from('onboarding_requests').select('id').limit(1);
  check('onboarding_requests table exists', !error, error ? error.message : undefined);
  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
})();
