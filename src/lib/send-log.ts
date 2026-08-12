/**
 * Email send audit log helpers (operator-approved 2026-08-11 send-gate).
 *
 * Every Part B outreach and newsletter action writes one row via logSend; the
 * admin GET reads getLastSend to show "last batch sent" state before the operator
 * clicks. Both are TOLERANT of the email_send_log table being absent (pre-
 * migration) — logging must never break a send, and a missing table just yields
 * a null "last send" (the UI falls back to "no record").
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = any;

export interface SendLogInput {
  channel: 'partb' | 'newsletter';
  action: 'send' | 'test';
  actor?: string;
  recipients: string[];
  subject?: string;
  note?: string;
}

export interface LastSend {
  created_at: string;
  action: string;
  actor: string | null;
  recipient_count: number;
  recipients: string[] | null;
  subject: string | null;
}

export async function logSend(sb: Sb, input: SendLogInput): Promise<void> {
  try {
    await sb.from('email_send_log').insert({
      channel: input.channel,
      action: input.action,
      actor: input.actor || 'operator',
      recipient_count: input.recipients.length,
      recipients: input.recipients,
      subject: input.subject || null,
      note: input.note || null,
    });
  } catch {
    /* table may not exist yet; never block the send */
  }
}

/** The most recent 'send' (not 'test') for a channel, or null. */
export async function getLastSend(sb: Sb, channel: 'partb' | 'newsletter'): Promise<LastSend | null> {
  try {
    const { data, error } = await sb
      .from('email_send_log')
      .select('created_at, action, actor, recipient_count, recipients, subject')
      .eq('channel', channel)
      .eq('action', 'send')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data as LastSend;
  } catch {
    return null;
  }
}
