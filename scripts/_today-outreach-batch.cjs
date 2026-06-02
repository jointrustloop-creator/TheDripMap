// One-off: list providers marked outreach_sent_at >= start of UTC today.
// These are the morning drafts created by /api/cron/daily-outreach that the
// operator wants to actually send through SMTP today. Read-only.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supa
    .from('providers')
    .select('id, name, slug, city, state, country, email, rating, reviews, outreach_sent, outreach_sent_at, email_bounced, is_featured')
    .gte('outreach_sent_at', start.toISOString())
    .order('outreach_sent_at', { ascending: true });

  if (error) {
    console.error(error);
    process.exit(1);
  }

  // Group by email so the "draft count" matches what was actually saved (1 draft per shared email)
  const byEmail = new Map();
  for (const p of data) {
    const k = (p.email || '').trim().toLowerCase();
    if (!byEmail.has(k)) byEmail.set(k, []);
    byEmail.get(k).push(p);
  }

  console.log(`Total provider rows marked outreach_sent_at >= ${start.toISOString()}: ${data.length}`);
  console.log(`Unique recipient emails (= drafts): ${byEmail.size}`);
  console.log('');
  let i = 1;
  for (const [email, providers] of byEmail.entries()) {
    const a = providers[0];
    const tag = (a.country || '').toLowerCase() === 'canada' ? 'CA' : 'US';
    const where = [a.city, a.state].filter(Boolean).join(', ');
    const extra = providers.length > 1 ? ` (+${providers.length - 1} more locations)` : '';
    const flags = [];
    if (a.is_featured) flags.push('FEATURED');
    if (a.email_bounced) flags.push('BOUNCED');
    const flagStr = flags.length ? ` [${flags.join(',')}]` : '';
    console.log(`${i.toString().padStart(2)}. [${tag}] ${a.name} - ${where} - ${email}${extra}${flagStr}`);
    i++;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
