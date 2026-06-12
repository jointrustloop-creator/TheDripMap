// W1 first run: enqueue the 6 already-verified clinics into
// onboarding_requests with status 'pending_send'. NO EMAILS ARE SENT by this
// script under any circumstances; sending happens via the operator's
// "Send onboarding email now" click on /admin/onboarding (after Template B
// approval).
//
// Safety: SELECT first, abort unless every target resolves to exactly one
// claimed provider, abort if any already has an onboarding row, count-check
// after insert. Re-runnable: refuses to double-insert.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 6 known slugs + VP Health resolved by name match below.
// vida-flow-penticton added 2026-06-12: claimed/verified the same day the
// engine merged, so neither the verify-claim trigger nor the original
// 6-clinic list covers it.
const KNOWN_SLUGS = [
  'purete-medical-spa-etobicoke',
  'the-lift-bar-medspa-nicholasville',
  'soma-and-soul-wellness-toronto',
  'natures-touch-naturopathic-clinic-brampton',
  'insight-naturopathic-clinic-toronto',
  'vida-flow-penticton',
];
const NAME_MATCHES = ['vp health']; // resolved case-insensitively, must be claimed

(async () => {
  const targets = [];

  for (const slug of KNOWN_SLUGS) {
    const { data, error } = await sb
      .from('providers')
      .select('id, name, slug, city, is_claimed')
      .eq('slug', slug);
    if (error) { console.error('ABORT: query error', slug, error.message); process.exit(1); }
    if (!data || data.length !== 1) { console.error(`ABORT: slug ${slug} resolved to ${data ? data.length : 0} rows, expected 1`); process.exit(1); }
    if (data[0].is_claimed !== true) { console.error(`ABORT: ${slug} is not claimed`); process.exit(1); }
    targets.push(data[0]);
  }

  for (const frag of NAME_MATCHES) {
    const { data, error } = await sb
      .from('providers')
      .select('id, name, slug, city, is_claimed')
      .ilike('name', `%${frag}%`)
      .eq('is_claimed', true);
    if (error) { console.error('ABORT: query error', frag, error.message); process.exit(1); }
    if (!data || data.length !== 1) {
      console.error(`ABORT: name match "${frag}" resolved to ${data ? data.length : 0} claimed rows, expected exactly 1.`);
      if (data) data.forEach(d => console.error('  candidate:', d.slug));
      process.exit(1);
    }
    targets.push(data[0]);
  }

  if (targets.length !== 7) { console.error(`ABORT: expected 7 targets, got ${targets.length}`); process.exit(1); }
  console.log('Resolved 7 targets:');
  targets.forEach(t => console.log(`  ${t.name} (${t.slug})`));

  // Owner email/name from the verified claim_requests row (newest verified).
  const rows = [];
  for (const t of targets) {
    const { data: claims } = await sb
      .from('claim_requests')
      .select('email, owner_name, status, verified_at')
      .eq('listing_id', t.id)
      .eq('status', 'verified')
      .order('verified_at', { ascending: false })
      .limit(1);
    const claim = (claims && claims[0]) || null;
    if (!claim) console.warn(`  WARN: no verified claim_request for ${t.slug}; owner email will be null (fill on /admin/onboarding before sending)`);
    rows.push({
      provider_id: t.id,
      owner_email: claim ? claim.email : null,
      owner_name: claim ? claim.owner_name : null,
      status: 'pending_send',
    });
  }

  // Refuse to double-insert.
  const { data: existing, error: exErr } = await sb
    .from('onboarding_requests')
    .select('provider_id')
    .in('provider_id', targets.map(t => t.id));
  if (exErr) { console.error('ABORT: onboarding_requests not readable (migration applied?)', exErr.message); process.exit(1); }
  if (existing && existing.length > 0) {
    console.error(`ABORT: ${existing.length} of the 7 already have onboarding rows. Nothing inserted.`);
    process.exit(1);
  }

  const { error: insErr, count } = await sb
    .from('onboarding_requests')
    .insert(rows, { count: 'exact' });
  if (insErr) { console.error('ABORT: insert failed', insErr.message); process.exit(1); }
  if (count !== 7) { console.error(`WARNING: expected insert count 7, got ${count}. Verify on /admin/onboarding.`); process.exit(1); }
  console.log('Inserted 7 onboarding_requests rows with status pending_send.');
  console.log('No emails were sent. Send from /admin/onboarding after Template B approval.');
})();
