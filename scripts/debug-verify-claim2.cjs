require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SITE = 'https://www.thedripmap.com';

(async () => {
  // Insert fresh test
  const token = crypto.randomUUID();
  const { data: candidates } = await s.from('providers').select('id, slug, name')
    .eq('is_featured', false).neq('outreach_sent', true).or('rating.is.null,rating.lt.4.0').limit(1);
  const tp = candidates[0];
  console.log('Provider:', tp.name, '/', tp.slug);

  await s.from('claim_requests').insert({
    listing_id: tp.id, email: 'test@thedripmap.com',
    owner_name: 'E2E', owner_phone: '5555550100',
    token, expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    created_at: new Date().toISOString(),
  });
  console.log('Token:', token);

  // Hit verify-claim with the valid token
  const r = await fetch(`${SITE}/verify-claim?token=${encodeURIComponent(token)}`);
  const html = await r.text();
  console.log('HTTP', r.status);

  // Extract <h1> content
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  console.log('H1 content:', h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim().slice(0, 200) : '(no h1)');

  // Extract <p> after h1 (success/error body text)
  const allP = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
  console.log('\nFirst 3 <p> texts:');
  allP.slice(0, 5).forEach((m, i) => {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 10 && text.length < 400) console.log(`  [p${i}]`, text.slice(0, 250));
  });

  // Check DB state
  const { data: claimAfter } = await s.from('claim_requests').select('status, verified_at').eq('token', token).maybeSingle();
  const { data: provAfter } = await s.from('providers').select('is_claimed, is_featured').eq('id', tp.id).maybeSingle();
  console.log('\nDB after verify hit:');
  console.log('  claim_requests.status:', claimAfter?.status, '/ verified_at:', claimAfter?.verified_at);
  console.log('  providers.is_claimed:', provAfter?.is_claimed, '/ is_featured:', provAfter?.is_featured);

  // Cleanup
  await s.from('claim_requests').delete().eq('token', token);
  await s.from('providers').update({ is_claimed: false, is_featured: false }).eq('id', tp.id);
  console.log('\n✓ Rolled back');
})();
