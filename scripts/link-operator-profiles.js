// Backfill clinic_id for the 3 real operator_profiles, clone the Signature Beauty
// Lounge profile so both SBL locations get their data, then delete the 10 junk/test
// profiles that were left over from form testing.

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Profile IDs (from our earlier audit) and their target provider IDs
const MECHELLE_PROFILE_ID = '63f7dccf-fb5c-4066-ad43-d47393e861ac';
const EVA_SBL_PROFILE_ID = '56bf6b13-b855-4f71-8ced-c71144ba9ced';
const EVA_SCC_PROFILE_ID = '847328d7-4422-4882-a3a2-764244beab5c';

// Look up provider IDs by slug (more robust than hardcoding UUIDs)
async function providerId(slug) {
  const { data } = await supabase.from('providers').select('id').eq('slug', slug).single();
  return data?.id;
}

const blueCypressId      = await providerId('blue-cypress-iv-and-wellness-georgetown');
const sblDowntownId      = await providerId('signature-beauty-lounge-downtown-toronto');
const sblRichmondHillId  = await providerId('signature-beauty-lounge-richmond-hill');
const sccMidtownId       = await providerId('signature-cosmetic-clinic-midtown-toronto');

console.log('Target provider IDs:');
console.log('  Blue Cypress Georgetown:           ', blueCypressId);
console.log('  Signature Beauty Lounge Downtown:  ', sblDowntownId);
console.log('  Signature Beauty Lounge Richmond:  ', sblRichmondHillId);
console.log('  Signature Cosmetic Clinic Midtown: ', sccMidtownId);

// === Step 1: link Mechelle's profile to Blue Cypress ===
console.log('\n[1] Linking Mechelle → Blue Cypress Georgetown');
const { error: e1 } = await supabase
  .from('operator_profiles')
  .update({ clinic_id: blueCypressId })
  .eq('id', MECHELLE_PROFILE_ID);
if (e1) console.log('  ✗', e1.message); else console.log('  ✓ linked');

// === Step 2: link Eva's SBL profile to Downtown Toronto ===
console.log('\n[2] Linking Eva (SBL) → SBL Downtown Toronto');
const { error: e2 } = await supabase
  .from('operator_profiles')
  .update({ clinic_id: sblDowntownId })
  .eq('id', EVA_SBL_PROFILE_ID);
if (e2) console.log('  ✗', e2.message); else console.log('  ✓ linked');

// === Step 3: clone Eva's SBL profile so Richmond Hill gets the same data ===
console.log('\n[3] Cloning Eva (SBL) profile → SBL Richmond Hill');
const { data: existingSbl } = await supabase
  .from('operator_profiles')
  .select('owner_name, email, profile_data, user_id, email_sent')
  .eq('id', EVA_SBL_PROFILE_ID)
  .single();
if (!existingSbl) {
  console.log('  ✗ Original SBL profile not found, can\'t clone');
} else {
  // Check if already cloned (so re-runs are idempotent)
  const { data: existingClone } = await supabase
    .from('operator_profiles')
    .select('id')
    .eq('clinic_id', sblRichmondHillId)
    .eq('email', existingSbl.email)
    .maybeSingle();
  if (existingClone) {
    console.log('  ⚠ Already cloned (id ' + existingClone.id + ') — skipping');
  } else {
    const { error: e3 } = await supabase
      .from('operator_profiles')
      .insert({
        owner_name: existingSbl.owner_name,
        email: existingSbl.email,
        profile_data: existingSbl.profile_data,
        user_id: existingSbl.user_id,
        email_sent: existingSbl.email_sent,
        clinic_id: sblRichmondHillId,
      });
    if (e3) console.log('  ✗', e3.message); else console.log('  ✓ cloned + linked');
  }
}

// === Step 4: link Eva's SCC profile to Midtown Toronto (not featured, but data is ready) ===
console.log('\n[4] Linking Eva (SCC) → Signature Cosmetic Clinic Midtown');
const { error: e4 } = await supabase
  .from('operator_profiles')
  .update({ clinic_id: sccMidtownId })
  .eq('id', EVA_SCC_PROFILE_ID);
if (e4) console.log('  ✗', e4.message); else console.log('  ✓ linked (provider not yet featured — data will activate once claimed)');

// === Step 5: delete the 10 junk/test profiles ===
console.log('\n[5] Deleting junk/test profiles');
const JUNK_PROFILE_IDS = [
  '18440976-ad24-43c4-9f56-2b1efd46c4d5', // Abrakadabra
  '7eb692b7-68f8-4ad1-85f1-652fb0f322e9', // "Finall test"
  '143119cb-1e33-4a5b-92c5-cd30ea809737', // "tester"
  '9cfad591-1874-4f93-b4af-ecf63e84bdbe', // Hubert testing as "Zywy iv therapy"
  '128ba61e-7ae2-4844-be69-6420c034c507', // gdfsgfd
  'f6cf3689-fa26-484e-9312-548922c5bb83', // gfd bvcxcvbgfgfd
  '70de044d-315d-410d-9e66-ea8633f87272', // "1111"
  '3fc48152-4aa5-438a-9142-dadad3efbab9', // "HUBERT'S IV" (Hubert testing)
  'd43e73e3-ac19-4e8e-a122-25c7c4d6259e', // JOJOJO
  '3ec2336b-9ed8-4d9c-b3d6-23cc83361efe', // fdsafdsdfsa
];
const { error: e5, count: delCount } = await supabase
  .from('operator_profiles')
  .delete({ count: 'exact' })
  .in('id', JUNK_PROFILE_IDS);
if (e5) console.log('  ✗', e5.message); else console.log('  ✓ deleted ' + delCount + ' junk rows');

// === Final state ===
console.log('\n=== Final operator_profiles state ===');
const { data: final } = await supabase
  .from('operator_profiles')
  .select('id, owner_name, email, clinic_id, profile_data');
for (const p of final || []) {
  const clinicName = p.profile_data?.clinicName || '?';
  console.log('  ' + p.owner_name.padEnd(20) + ' | ' + clinicName.padEnd(30) + ' | clinic_id=' + (p.clinic_id || '(unlinked)'));
}
console.log('\nTotal profiles remaining: ' + (final?.length ?? 0));
