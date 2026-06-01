/**
 * Find every draft in Gmail's [Gmail]/Drafts folder whose body contains the
 * literal '[MAILING ADDRESS]' line, append a cleaned copy (with the entire
 * "TheDripMap · info@thedripmap.com · [MAILING ADDRESS]" identification line
 * removed), and flag the original as \Deleted (Gmail auto-expunges on close).
 *
 * Idempotent. Reports the count touched.
 */
require('dotenv').config({ path: '.env.local' });
const { ImapFlow } = require('imapflow');

const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
if (!USER || !PASS) {
  console.error('SMTP_USER / SMTP_PASS required');
  process.exit(1);
}

// Match the original footer line we shipped on 2026-06-01.
// Some Gmail draft round-tripping may rewrap or normalise whitespace, so the
// regex is forgiving on surrounding whitespace but precise on the content.
const OLD_LINE_RE = /[ \t]*TheDripMap[ \t]*·[ \t]*info@thedripmap\.com[ \t]*·[ \t]*\[MAILING ADDRESS\][ \t]*\r?\n?/g;
// Belt-and-suspenders: also strip a bare "[MAILING ADDRESS]" line that
// might have survived in some early variant.
const BARE_PLACEHOLDER_RE = /^[ \t]*\[MAILING ADDRESS\][ \t]*\r?\n?$/gm;

function parseRfc822(raw) {
  // Split headers / body on the first blank line. Gmail returns CRLF.
  const sep = raw.indexOf('\r\n\r\n');
  if (sep === -1) return { headers: {}, body: raw };
  const head = raw.slice(0, sep);
  const body = raw.slice(sep + 4);
  const headers = {};
  let last = null;
  for (const lineRaw of head.split(/\r?\n/)) {
    if (/^[ \t]/.test(lineRaw) && last) {
      headers[last] += ' ' + lineRaw.trim();
      continue;
    }
    const m = lineRaw.match(/^([^:]+):\s*(.*)$/);
    if (m) {
      last = m[1].toLowerCase();
      headers[last] = m[2];
    }
  }
  return { headers, body };
}

function buildCleanRfc822({ from, to, replyTo, subject, body }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
  ];
  return headers.join('\r\n') + '\r\n\r\n' + body;
}

(async () => {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: USER, pass: PASS },
    logger: false,
  });
  await client.connect();

  let touched = 0;
  let skippedNoMatch = 0;
  let appendErrors = 0;
  let flagErrors = 0;
  const samples = [];

  try {
    const mb = await client.mailboxOpen('[Gmail]/Drafts');
    console.log('Drafts folder size:', mb.exists);

    // Search for messages whose body contains the literal '[MAILING ADDRESS]'.
    // ImapFlow's `body` search is server-side TEXT search; Gmail IMAP supports this.
    const uids = await client.search({ body: '[MAILING ADDRESS]' }, { uid: true });
    const list = Array.isArray(uids) ? uids : [];
    console.log('Drafts containing "[MAILING ADDRESS]":', list.length);

    if (list.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    // Process one at a time — small batches, no parallelism (the project hit a
    // 522 last night when many concurrent processes ran).
    for (const uid of list) {
      let envelope = null;
      let raw = null;
      try {
        // Fetch envelope + full RFC822 source
        for await (const msg of client.fetch(
          uid,
          { envelope: true, source: true },
          { uid: true }
        )) {
          envelope = msg.envelope;
          raw = msg.source ? msg.source.toString('utf8') : null;
        }
        if (!raw || !envelope) {
          appendErrors++;
          continue;
        }

        const { body } = parseRfc822(raw);
        if (!OLD_LINE_RE.test(body) && !BARE_PLACEHOLDER_RE.test(body)) {
          // False positive from the IMAP search — the substring lives in
          // headers or quoted-printable encoding, not in the visible body.
          skippedNoMatch++;
          continue;
        }
        // Reset regex lastIndex before replace (the .test() advances it on /g).
        OLD_LINE_RE.lastIndex = 0;
        BARE_PLACEHOLDER_RE.lastIndex = 0;
        const cleanBody = body
          .replace(OLD_LINE_RE, '')
          .replace(BARE_PLACEHOLDER_RE, '');

        const from = envelope.from?.[0]
          ? `${envelope.from[0].name ? envelope.from[0].name + ' ' : ''}<${envelope.from[0].address}>`
          : 'TheDripMap <info@thedripmap.com>';
        const to = envelope.to?.[0]?.address || '';
        const replyTo = envelope.replyTo?.[0]?.address || 'info@thedripmap.com';
        const subject = envelope.subject || '';
        if (!to || !subject) {
          appendErrors++;
          continue;
        }

        const cleanRfc822 = buildCleanRfc822({
          from,
          to,
          replyTo,
          subject,
          body: cleanBody,
        });

        // Append the cleaned draft.
        await client.append('[Gmail]/Drafts', cleanRfc822, ['\\Draft']);

        // Flag the original as \Deleted. Gmail auto-expunges on mailbox close.
        try {
          await client.messageFlagsAdd([uid], ['\\Deleted'], { uid: true });
        } catch (flagErr) {
          flagErrors++;
        }

        touched++;
        if (samples.length < 5) {
          samples.push({ to, subject: subject.slice(0, 70) });
        }
      } catch (err) {
        appendErrors++;
        console.error('  ✗ uid=' + uid + ' err=' + err.message);
      }
    }
  } finally {
    await client.logout();
  }

  console.log('\n=== STRIP SUMMARY ===');
  console.log('Drafts rewritten (clean copy appended, original \\Deleted): ' + touched);
  console.log('False-positive matches (placeholder absent from visible body): ' + skippedNoMatch);
  console.log('Append errors: ' + appendErrors);
  console.log('Flag errors: ' + flagErrors);
  if (samples.length) {
    console.log('\nSample touched drafts:');
    for (const s of samples) console.log('  ✓ ' + s.to + ' — ' + s.subject);
  }
})();
