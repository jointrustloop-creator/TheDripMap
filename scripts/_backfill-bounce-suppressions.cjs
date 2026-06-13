// Backfill outreach_suppressions from providers flagged email_bounced=true.
// Protective only (prevents re-contacting bouncers). SELECT first, insert
// missing ones, count-checked. Safe to re-run (idempotent on email).
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: bounced, error } = await sb
    .from('providers')
    .select('email')
    .eq('email_bounced', true)
    .not('email', 'is', null);
  if (error) { console.error('ABORT select providers:', error.message); process.exit(1); }
  const emails = [...new Set(bounced.map((p) => (p.email || '').trim().toLowerCase()).filter(Boolean))];
  console.log('bounced emails:', emails.length);

  let existing = new Set();
  try {
    const { data: sup } = await sb.from('outreach_suppressions').select('email');
    (sup || []).forEach((r) => r.email && existing.add(r.email.toLowerCase()));
  } catch (e) {
    console.error('ABORT: outreach_suppressions not readable:', e.message); process.exit(1);
  }
  const toAdd = emails.filter((e) => !existing.has(e));
  console.log('already suppressed:', existing.size, '| to add:', toAdd.length);
  if (toAdd.length === 0) { console.log('Nothing to add. Done.'); return; }

  const rows = toAdd.map((email) => ({ email, reason: 'hard_bounce', source: 'backfill_2026-06-13' }));
  // Try with reason/source; fall back to email-only if columns differ.
  let inserted = 0;
  let { error: insErr, count } = await sb.from('outreach_suppressions').insert(rows, { count: 'exact' });
  if (insErr) {
    console.log('insert with reason/source failed (' + insErr.message + '), retrying email-only...');
    const r2 = await sb.from('outreach_suppressions').insert(toAdd.map((email) => ({ email })), { count: 'exact' });
    if (r2.error) { console.error('ABORT insert:', r2.error.message); process.exit(1); }
    inserted = r2.count ?? toAdd.length;
  } else {
    inserted = count ?? toAdd.length;
  }
  if (inserted !== toAdd.length) { console.error(`WARN: inserted ${inserted}, expected ${toAdd.length}`); }
  console.log(`Inserted ${inserted} suppression rows.`);
})();
