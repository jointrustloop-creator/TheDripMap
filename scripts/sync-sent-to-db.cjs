// One-shot: read Gmail Sent folder for outreach emails ("listing on TheDripMap"
// in subject), extract recipient addresses, and mark providers.outreach_sent=true
// for matching emails. Backfills tracking state from messages that went out before
// the cron system existed.
//
// Usage: node scripts/sync-sent-to-db.js
// Requires SMTP_USER, SMTP_PASS, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { ImapFlow } = require('imapflow');
const { createClient } = require('@supabase/supabase-js');

async function listSentRecipients() {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    logger: false,
  });
  const recipients = [];
  await client.connect();
  try {
    await client.mailboxOpen('[Gmail]/Sent Mail');
    const uids = await client.search({ subject: 'listing on TheDripMap' });
    if (uids && uids.length) {
      for await (const msg of client.fetch(uids, { envelope: true }, { uid: true })) {
        const to = msg.envelope?.to;
        if (to && to.length) {
          for (const a of to) if (a.address) recipients.push(a.address.toLowerCase());
        }
      }
    }
  } finally {
    await client.logout();
  }
  return recipients;
}

(async () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('Missing SMTP_USER / SMTP_PASS');
    process.exit(1);
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Scanning Gmail Sent for outreach emails...');
  const recipientsAll = await listSentRecipients();
  // Dedupe, drop our own address (test sends to hubertz... aren't clinic emails)
  const ourAddrs = new Set(['info@thedripmap.com', 'hubertzyworonek@gmail.com']);
  const recipients = [...new Set(recipientsAll)].filter((e) => !ourAddrs.has(e));
  console.log(`Found ${recipientsAll.length} sent messages → ${recipients.length} unique clinic recipients`);

  if (recipients.length === 0) {
    console.log('Nothing to mark.');
    return;
  }

  // Match by email in batches (.in() supports up to a few hundred values)
  const { data: matched, error: matchErr } = await supabase
    .from('providers')
    .select('slug, name, email, outreach_sent')
    .in('email', recipients);

  if (matchErr) {
    console.error('Match error:', matchErr.message);
    process.exit(1);
  }

  console.log(`Matched ${matched.length} provider rows in DB`);

  const unmatched = recipients.filter(
    (e) => !matched.find((m) => (m.email || '').toLowerCase() === e)
  );
  if (unmatched.length) {
    console.log('Sent emails with NO matching provider row:', unmatched);
  }

  const toUpdate = matched.filter((m) => !m.outreach_sent).map((m) => m.email);
  if (toUpdate.length === 0) {
    console.log('All matched providers already marked outreach_sent=true. Nothing to update.');
    return;
  }

  const { error: updErr } = await supabase
    .from('providers')
    .update({ outreach_sent: true, outreach_sent_at: new Date().toISOString() })
    .in('email', toUpdate);

  if (updErr) {
    console.error('Update error:', updErr.message);
    process.exit(1);
  }

  console.log(`✓ Marked ${toUpdate.length} providers as outreach_sent=true`);
  toUpdate.forEach((e) => console.log('  -', e));
})().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
