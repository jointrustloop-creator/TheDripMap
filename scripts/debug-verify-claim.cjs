require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get the ANON KEY from .env.local — fallback to fetching the public env from the deployed page
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('ANON_KEY in .env.local?', ANON_KEY ? 'YES' : 'NO — that explains it if missing');

const SITE = 'https://www.thedripmap.com';

(async () => {
  // Step A: Check if the new verify-claim code is live by hitting it with a missing token
  console.log('\n[A] Check live verify-claim code version (no token):');
  const r1 = await fetch(`${SITE}/verify-claim`);
  const html1 = await r1.text();
  const hasNewHeadline = html1.includes('Your listing is now live');
  const hasNewExpiredCopy = html1.includes('Request a new verification link');
  console.log(`  Has "Your listing is now live" string anywhere in HTML: ${hasNewHeadline ? '✓ NEW' : '✗ old'}`);
  console.log(`  Has "Request a new verification link" string: ${hasNewExpiredCopy ? '✓ NEW' : '✗ old'}`);

  // Step B: Insert a fresh test claim using SERVICE key
  console.log('\n[B] Insert fresh test claim with SERVICE key...');
  const token = crypto.randomUUID();
  const { data: candidates } = await serviceClient.from('providers')
    .select('id, slug, name')
    .eq('is_featured', false)
    .neq('outreach_sent', true)
    .or('rating.is.null,rating.lt.4.0')
    .limit(1);
  const tp = candidates[0];
  console.log(`  Provider: ${tp.name} (${tp.slug})`);
  await serviceClient.from('claim_requests').insert({
    listing_id: tp.id,
    email: 'test@thedripmap.com',
    owner_name: 'E2E Debug',
    owner_phone: '5555550100',
    token,
    expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    created_at: new Date().toISOString(),
  });

  // Step C: Try reading the row with ANON KEY (what verify-claim page uses)
  console.log('\n[C] Read with ANON key (verify-claim page uses this):');
  const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, ANON_KEY);
  const { data: anonRead, error: anonErr } = await anonClient.from('claim_requests').select('id, email, status').eq('token', token).maybeSingle();
  console.log(`  Anon SELECT result: ${anonErr ? '✗ ' + anonErr.message : (anonRead ? `✓ ${JSON.stringify(anonRead)}` : '✗ row not found (likely RLS)')}`);

  // Step D: Try the update with ANON key
  console.log('\n[D] Try UPDATE providers.is_claimed=true with ANON key:');
  const { data: updRes, error: updErr } = await anonClient.from('providers')
    .update({ is_claimed: true, is_featured: true })
    .eq('id', tp.id)
    .select('id');
  console.log(`  Anon UPDATE result: ${updErr ? '✗ ' + updErr.message : (updRes && updRes.length > 0 ? `✓ ${updRes.length} row updated` : '✗ 0 rows updated (likely RLS)')}`);

  // Step E: Fetch the verify-claim page with the test token and see what state renders
  console.log('\n[E] Fetch verify-claim page with valid token + capture state:');
  const r2 = await fetch(`${SITE}/verify-claim?token=${encodeURIComponent(token)}`);
  const html2 = await r2.text();
  // Look for known state markers
  const markers = {
    'Success: "Your listing is now live"': html2.includes('Your listing is now live'),
    'Success: "Claim verified!" (OLD copy)': html2.includes('Claim verified!'),
    'Error: Missing verification link': html2.includes('Missing verification link'),
    'Error: Invalid verification link': html2.includes('Invalid verification link'),
    'Error: Already verified': html2.includes('Already verified'),
    'Error: Link expired': html2.includes('Link expired'),
    'Error: Something went wrong': html2.includes('Something went wrong'),
  };
  Object.entries(markers).forEach(([k, v]) => console.log(`  ${v ? '✓' : '✗'} ${k}`));

  // Step F: Cleanup
  console.log('\n[F] Cleanup:');
  await serviceClient.from('claim_requests').delete().eq('token', token);
  await serviceClient.from('providers').update({ is_claimed: false, is_featured: false }).eq('id', tp.id);
  console.log('  Rolled back');
})();
