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

/**
 * Count messages in a Gmail folder whose Subject contains `subjectContains`.
 * Used to verify outreach state (how many drafts left, how many sent).
 */
export async function countBySubject(folder: string, subjectContains: string): Promise<number> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error('SMTP_USER and SMTP_PASS env vars required');

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  let count = 0;
  await client.connect();
  try {
    await client.mailboxOpen(folder);
    const uids = (await client.search({ subject: subjectContains })) as number[];
    count = uids?.length || 0;
  } finally {
    await client.logout();
  }
  return count;
}

/**
 * Delete drafts in [Gmail]/Drafts whose Subject contains `subjectContains`.
 * Used to clear stale outreach drafts before re-queueing with updated copy.
 * Returns count deleted.
 */
export async function deleteDraftsBySubject(subjectContains: string): Promise<number> {
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

  let deleted = 0;
  await client.connect();
  try {
    await client.mailboxOpen('[Gmail]/Drafts');
    // ImapFlow search: find UIDs of messages whose subject matches
    const uids = (await client.search({ subject: subjectContains })) as number[];
    if (uids && uids.length > 0) {
      // \\Deleted + expunge actually removes from Drafts (Gmail-specific behavior)
      await client.messageFlagsAdd(uids, ['\\Deleted'], { uid: true });
      // Gmail auto-expunges \\Deleted on close for [Gmail]/Drafts
      deleted = uids.length;
    }
  } finally {
    await client.logout();
  }
  return deleted;
}
