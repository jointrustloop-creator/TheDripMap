// Saves an email as a draft in the info@thedripmap.com Gmail mailbox via IMAP.
// Uses the same SMTP_USER + SMTP_PASS App Password we already have set up.
//
// Why: lets us pre-stage outreach emails so Hubert reviews + sends manually
// from his Gmail inbox instead of firing 20 sends programmatically.

import { ImapFlow } from 'imapflow';

export interface DraftPayload {
  from: string; // e.g. 'TheDripMap <info@thedripmap.com>'
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
}

export interface DraftResult {
  ok: boolean;
  to: string;
  error?: string;
}

function buildRfc822(payload: DraftPayload): string {
  // Minimal MIME message — Gmail accepts plain RFC822 just fine for drafts.
  const headers: string[] = [
    `From: ${payload.from}`,
    `To: ${payload.to}`,
    ...(payload.replyTo ? [`Reply-To: ${payload.replyTo}`] : []),
    `Subject: ${payload.subject}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
  ];
  return headers.join('\r\n') + '\r\n\r\n' + payload.text;
}

// Batched saver: open one IMAP connection, save N drafts, close.
// Much faster than connecting per-draft when sending 20.
export async function saveDrafts(payloads: DraftPayload[]): Promise<DraftResult[]> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS env vars required');
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const results: DraftResult[] = [];
  await client.connect();

  try {
    // Gmail's Drafts folder special name
    await client.mailboxOpen('[Gmail]/Drafts');

    for (const payload of payloads) {
      try {
        const rfc822 = buildRfc822(payload);
        // The 4th arg can include flags — \\Draft is what Gmail expects
        await client.append('[Gmail]/Drafts', rfc822, ['\\Draft']);
        results.push({ ok: true, to: payload.to });
      } catch (err) {
        results.push({
          ok: false,
          to: payload.to,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } finally {
    await client.logout();
  }

  return results;
}
