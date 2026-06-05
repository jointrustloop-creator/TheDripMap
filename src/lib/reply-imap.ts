/**
 * reply-imap.ts
 *
 * IMAP fetcher for inbound replies to info@thedripmap.com.
 *
 * Mirrors the connection + auth pattern from src/lib/draft-saver.ts so
 * we use the same SMTP_USER + SMTP_PASS Workspace Gmail App Password.
 *
 * Returns plain JS objects (no DB writes, no classification, no
 * matching). The cron is responsible for those steps and for advancing
 * the cursor row.
 *
 * mailparser dependency: NOT installed (would require adding it to
 * package.json). Instead we use imapflow's built-in bodyParts source +
 * a tiny RFC-5322-ish text/plain decoder that handles the 95% case:
 *   - Pulls the first text/plain part if multipart
 *   - Falls back to the raw body for single-part text
 *   - Quoted-printable + base64 decoded inline
 *   - HTML stripped to plain via tag removal (not perfect but enough
 *     for snippet + classifier purposes)
 *
 * If full MIME fidelity is ever needed (attachments, weird encodings),
 * add `mailparser` to package.json and swap parseBody() over.
 */

import { ImapFlow, type FetchMessageObject } from 'imapflow';

export interface ParsedReply {
  uid: number;
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  threadId: string | null;
  fromEmail: string;
  fromName: string | null;
  toEmail: string | null;
  subject: string;
  receivedAt: string; // ISO
  body: string;       // text/plain best-effort
  headers: Record<string, string>;
  gmailThreadUrl: string | null;
}

interface IMAPCreds {
  user: string;
  pass: string;
}

function readCreds(): IMAPCreds {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS env vars required');
  }
  return { user, pass };
}

function decodeQuotedPrintable(s: string): string {
  // =0A and =\n soft breaks; =XX hex
  return s
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function decodeBase64Safe(s: string): string {
  try {
    return Buffer.from(s.replace(/\s+/g, ''), 'base64').toString('utf8');
  } catch {
    return s;
  }
}

function stripHtml(s: string): string {
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

interface MimePart {
  contentType: string;
  encoding: string;
  body: string;
}

// Very small multipart splitter. Handles the common "multipart/alternative
// with boundary=..." shape and picks the first text/plain part. Falls back
// to the raw input on any parse hiccup.
function pickTextPlain(raw: string, topContentType: string): string {
  if (!raw) return '';
  const boundaryMatch = topContentType.match(/boundary="?([^";]+)"?/i);
  if (!boundaryMatch) {
    // Single-part. Decode by top-level CTE if specified, else as utf8.
    return raw;
  }
  const boundary = `--${boundaryMatch[1]}`;
  const parts = raw.split(boundary).map((p) => p.trim()).filter((p) => p && p !== '--');
  const decoded: MimePart[] = [];
  for (const part of parts) {
    const headerEnd = part.indexOf('\n\n');
    const altHeaderEnd = part.indexOf('\r\n\r\n');
    const splitAt = altHeaderEnd >= 0 ? altHeaderEnd : headerEnd;
    if (splitAt < 0) continue;
    const headerBlob = part.slice(0, splitAt).toLowerCase();
    const partBody = part.slice(splitAt + (altHeaderEnd >= 0 ? 4 : 2));
    const ct = (headerBlob.match(/content-type:\s*([^;\r\n]+)/) || [, ''])[1].trim();
    const enc = (headerBlob.match(/content-transfer-encoding:\s*([^;\r\n]+)/) || [, ''])[1].trim();
    decoded.push({ contentType: ct, encoding: enc, body: partBody });
  }
  // Prefer text/plain, fall back to text/html stripped.
  const plain = decoded.find((p) => p.contentType.startsWith('text/plain'));
  const html = decoded.find((p) => p.contentType.startsWith('text/html'));
  let chosen: MimePart | undefined = plain || html;
  if (!chosen) return raw;
  let body = chosen.body;
  if (chosen.encoding === 'quoted-printable') body = decodeQuotedPrintable(body);
  else if (chosen.encoding === 'base64') body = decodeBase64Safe(body);
  if (chosen.contentType.startsWith('text/html')) body = stripHtml(body);
  return body;
}

// imapflow's source param accepts buffer-as-Uint8Array; convert to string.
function bufToString(buf: Uint8Array | undefined): string {
  if (!buf) return '';
  return Buffer.from(buf).toString('utf8');
}

function parseAngleAddress(s: string | undefined): string {
  if (!s) return '';
  const m = s.match(/<([^>]+)>/);
  return (m ? m[1] : s).trim().toLowerCase();
}

function splitMessageIds(s: string | null | undefined): string[] {
  if (!s) return [];
  // Message-IDs are wrapped in <...> and space-separated in References:
  const out: string[] = [];
  const re = /<[^>]+>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out.push(m[0].trim());
  return out;
}

export interface FetchOptions {
  sinceUid?: number;       // exclusive lower bound; if undefined, last 7 days
  limit?: number;          // hard cap on number returned
  sinceDays?: number;      // used when sinceUid is undefined
}

export interface FetchResult {
  replies: ParsedReply[];
  highestUid: number | null;
}

/**
 * Fetch new inbound messages from INBOX. READ-ONLY (does not flag seen).
 * Returns parsed replies + the highest UID seen (caller writes to cursor).
 * If SMTP creds are absent, throws — the caller should catch + degrade.
 */
export async function fetchNewReplies(opts: FetchOptions = {}): Promise<FetchResult> {
  const { user, pass } = readCreds();
  const limit = opts.limit ?? 200;

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const replies: ParsedReply[] = [];
  let highestUid: number | null = null;

  await client.connect();
  try {
    await client.mailboxOpen('INBOX', { readOnly: true });

    // Build the search. UID > cursor when we have one, otherwise SINCE.
    let uids: number[];
    if (typeof opts.sinceUid === 'number' && opts.sinceUid > 0) {
      uids = (await client.search({ uid: `${opts.sinceUid + 1}:*` }, { uid: true })) as number[];
    } else {
      const sinceDays = opts.sinceDays ?? 7;
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
      uids = (await client.search({ since }, { uid: true })) as number[];
    }
    if (!uids || uids.length === 0) {
      return { replies: [], highestUid: opts.sinceUid ?? null };
    }
    // Newest first, cap to limit.
    const sortedUids = [...uids].sort((a, b) => b - a).slice(0, limit);

    for await (const msg of client.fetch(
      sortedUids,
      {
        envelope: true,
        source: true,
        threadId: true,
        flags: true,
        bodyStructure: true,
        headers: ['message-id', 'in-reply-to', 'references', 'auto-submitted',
                  'x-autoreply', 'x-autorespond', 'precedence', 'content-type',
                  'auto-response-suppress'],
      },
      { uid: true },
    )) {
      const m = msg as FetchMessageObject;
      const uid = m.uid as number;
      if (highestUid === null || uid > highestUid) highestUid = uid;

      const env = m.envelope;
      const from = env?.from?.[0];
      const fromEmail = (from?.address || '').toLowerCase();
      const fromName = from?.name || null;
      const toEmail = env?.to?.[0]?.address?.toLowerCase() || null;
      const subject = env?.subject || '';
      const receivedAt = (env?.date ? new Date(env.date) : new Date()).toISOString();

      // Headers come back as Buffer | Map | undefined depending on imapflow
      // version; the easiest robust path is to re-parse the raw source.
      const raw = bufToString(m.source as Uint8Array | undefined);
      const headerEndIdx = raw.indexOf('\r\n\r\n');
      const headerBlob = headerEndIdx > 0 ? raw.slice(0, headerEndIdx) : raw;
      const bodyBlob = headerEndIdx > 0 ? raw.slice(headerEndIdx + 4) : '';

      const headers: Record<string, string> = {};
      for (const line of headerBlob.split(/\r?\n/)) {
        const idx = line.indexOf(':');
        if (idx <= 0) continue;
        const k = line.slice(0, idx).trim().toLowerCase();
        const v = line.slice(idx + 1).trim();
        // Last-write-wins is fine for our purposes.
        if (k) headers[k] = v;
      }
      const messageId = (headers['message-id'] || '').trim() ||
        (env?.messageId ? String(env.messageId) : '') ||
        `<no-message-id-${uid}@thedripmap.local>`;
      const inReplyTo = (headers['in-reply-to'] || env?.inReplyTo || null) as string | null;
      const referencesRaw = headers['references'] || null;
      const references = splitMessageIds(referencesRaw);

      const topCt = headers['content-type'] || 'text/plain';
      let body = pickTextPlain(bodyBlob, topCt);

      // If top CTE is quoted-printable/base64 and there's no multipart,
      // decode the whole body.
      const topCte = (headers['content-transfer-encoding'] || '').toLowerCase();
      if (!topCt.toLowerCase().includes('multipart/')) {
        if (topCte === 'quoted-printable') body = decodeQuotedPrintable(body);
        else if (topCte === 'base64') body = decodeBase64Safe(body);
      }

      // Gmail X-GM-THRID can come through as bigint via imapflow.
      const threadId = m.threadId ? String(m.threadId) : null;
      const gmailThreadUrl = threadId
        ? `https://mail.google.com/mail/u/0/#inbox/${threadId}`
        : null;

      replies.push({
        uid,
        messageId,
        inReplyTo,
        references,
        threadId,
        fromEmail,
        fromName,
        toEmail,
        subject,
        receivedAt,
        body,
        headers,
        gmailThreadUrl,
      });
    }
  } finally {
    await client.logout();
  }

  return { replies, highestUid };
}
