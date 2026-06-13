// Populate Blue Cypress medical_team from the clinic's own stated founder
// (description: "founded by Mechelle Kelley RN"). SELECT first, count check,
// single-row scope. Real public info, no medical claims. Powers the new
// "Meet your provider" trust card (data-driven, generalizes to all claimed
// listings once their team is collected via onboarding).
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SLUG = 'blue-cypress-iv-and-wellness-georgetown';
const TEAM = [
  {
    name: 'Mechelle Kelley, RN',
    role: 'Founder & Registered Nurse',
    bio: 'A registered nurse and the founder of Blue Cypress IV and Wellness, Mechelle built a locally owned hydration lounge in the heart of downtown Georgetown, where care is personal and every guest is looked after by licensed clinical staff.',
  },
];

(async () => {
  const { data: row, error } = await sb
    .from('providers')
    .select('id, slug, name, medical_team')
    .eq('slug', SLUG)
    .maybeSingle();
  if (error) { console.error('ABORT select:', error.message); process.exit(1); }
  if (!row) { console.error('ABORT: no provider with slug', SLUG); process.exit(1); }
  console.log('Target:', row.name, '(' + row.id + ')');
  console.log('Existing medical_team:', JSON.stringify(row.medical_team));

  const { error: updErr, count } = await sb
    .from('providers')
    .update({ medical_team: TEAM }, { count: 'exact' })
    .eq('id', row.id);
  if (updErr) { console.error('ABORT update:', updErr.message); process.exit(1); }
  if (count !== 1) { console.error(`ABORT: update scope ${count}, expected 1`); process.exit(1); }
  console.log('Updated 1 row. medical_team set to:', JSON.stringify(TEAM));
})();
