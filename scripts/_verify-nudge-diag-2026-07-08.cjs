// Diagnostic for the Safety Verified nudge campaign (2026-07-08).
// Buckets the claimed-but-unverified clinics so we nudge the right ones with a
// CORRECT live /finish link (the manage_token race that broke Janna's link is
// fixed, but we still read each token fresh from the DB). Sends nothing.
//  - Bucket SUBMITTED: owner already did the questionnaire -> waiting on operator
//    review at /admin/onboarding (NO email).
//  - Bucket NUDGE: onboarding sent but not submitted -> nudge draft.
//  - Bucket FIRST: claimed, no onboarding row / never invited -> first invite draft.
// Excludes bounced + suppressed (both tables, fail closed) and anyone with no token.
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const OUT = path.join(__dirname, '..', '.audit-tmp', '_verify-nudge-2026-07-08.json');

(async () => {
  const { data: provs, error } = await s.from('providers')
    .select('id,slug,name,city,state,country,is_claimed,safety_verified,email,email_bounced,manage_token,claimed_at')
    .eq('is_claimed', true).neq('safety_verified', true);
  if (error) { console.error('FATAL providers:', error.message); process.exit(1); }

  // suppression guard, fail closed, both tables
  const suppressed = new Set();
  for (const tbl of ['email_suppressions', 'outreach_suppressions']) {
    const { data, error: e2 } = await s.from(tbl).select('email').range(0, 4999);
    if (e2) { console.error(`FATAL ${tbl}: refusing to proceed. ${e2.message}`); process.exit(1); }
    for (const r of data || []) suppressed.add(String(r.email).toLowerCase().trim());
  }

  // onboarding_requests: status + owner_name + owner_email per provider
  const { data: onb } = await s.from('onboarding_requests').select('provider_id,owner_name,owner_email,status');
  const onbByProv = {};
  for (const o of onb || []) onbByProv[o.provider_id] = o;
  // claim_requests fallback for owner email
  const { data: crs } = await s.from('claim_requests').select('listing_id,email,status');
  const crByProv = {};
  for (const c of crs || []) if (c.status === 'verified' && !crByProv[c.listing_id]) crByProv[c.listing_id] = c;

  const rows = provs.map((p) => {
    const o = onbByProv[p.id] || {};
    const ownerEmail = (o.owner_email || (crByProv[p.id] && crByProv[p.id].email) || p.email || '').toLowerCase().trim();
    const status = o.status || 'none';
    const bounced = p.email_bounced === true;
    const supp = ownerEmail && suppressed.has(ownerEmail);
    const hasToken = typeof p.manage_token === 'string' && p.manage_token.length > 10;
    let bucket;
    if (status === 'submitted') bucket = 'SUBMITTED_awaiting_operator';
    else if (!ownerEmail) bucket = 'EXCLUDE_no_email';
    else if (bounced) bucket = 'EXCLUDE_bounced';
    else if (supp) bucket = 'EXCLUDE_suppressed';
    else if (!hasToken) bucket = 'EXCLUDE_no_token';
    else if (status === 'sent') bucket = 'NUDGE';
    else bucket = 'FIRST_invite';
    return {
      slug: p.slug, name: p.name, city: p.city, ownerName: o.owner_name || '', to: ownerEmail,
      status, bucket, claimed_at: p.claimed_at,
      finishLink: hasToken ? `https://www.thedripmap.com/finish/${p.id}.${p.manage_token}` : null,
    };
  });

  rows.sort((a, b) => a.bucket.localeCompare(b.bucket) || (a.claimed_at || '').localeCompare(b.claimed_at || ''));
  const byBucket = {};
  for (const r of rows) (byBucket[r.bucket] = byBucket[r.bucket] || []).push(r);
  console.log(`claimed & not verified: ${rows.length}`);
  for (const [b, list] of Object.entries(byBucket)) {
    console.log(`\n== ${b} (${list.length}) ==`);
    for (const r of list) console.log(`  ${r.name} | ${r.city} | ${r.to || '(no email)'} | owner=${r.ownerName || '?'} | onb=${r.status}`);
  }
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));
  console.log(`\nwrote ${OUT}`);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
