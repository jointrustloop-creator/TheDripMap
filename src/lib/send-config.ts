/**
 * Kill-switches for bulk email send routes (operator-approved 2026-08-11).
 *
 * Both DEFAULT TO PAUSED. Sending requires an explicit env opt-in, so that an
 * accidental click, an agent holding the admin cookie, or a forgotten tab can
 * never release a batch on its own. To allow sends, set the matching env to the
 * exact string 'true' in Vercel; anything else (including unset) means paused.
 *
 * This is the enforcement side of the send-gate; the admin UI additionally shows
 * "what already went out" (see src/lib/send-log.ts) so the operator can see state
 * before confirming.
 */
export const OUTREACH_SEND_PAUSED = process.env.OUTREACH_SEND_ENABLED !== 'true';
export const NEWSLETTER_SEND_PAUSED = process.env.NEWSLETTER_SEND_ENABLED !== 'true';

export function sendPausedMessage(which: 'outreach' | 'newsletter'): string {
  const env = which === 'outreach' ? 'OUTREACH_SEND_ENABLED' : 'NEWSLETTER_SEND_ENABLED';
  return `Sending is paused (${env} is not 'true'). This is the default safe state. Set ${env}='true' in Vercel to allow a batch, then unset it again.`;
}

/**
 * Per-batch typed confirmation code (operator spec 2026-08-11): a short code is
 * shown in the send dialog and must be typed back; the server verifies it before
 * executing a send. This is a second, independent guard from the default-paused
 * kill-switch — it means a bare `action:'send'` POST (an automated/replayed
 * session that never fetched the code) is refused, and it forces a deliberate
 * human transcription. The code rotates every 5 minutes; verification accepts the
 * current or previous window so a slow click still lands.
 *
 * Residual (told to operator): a session that can read GET and then POST can echo
 * the code. Fully agent-proofing the send needs an out-of-band factor (an OTP to
 * your phone/email), which we can add on top if you want it.
 */
import { createHmac } from 'crypto';

const WINDOW_MS = 5 * 60 * 1000;

function codeForWindow(channel: 'partb' | 'newsletter', win: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || 'dev-only-secret';
  return createHmac('sha256', secret).update(`send-confirm:${channel}:${win}`).digest('hex').slice(0, 5).toUpperCase();
}

export function sendConfirmCode(channel: 'partb' | 'newsletter'): string {
  return codeForWindow(channel, Math.floor(Date.now() / WINDOW_MS));
}

export function verifySendCode(channel: 'partb' | 'newsletter', code: unknown): boolean {
  const c = String(code || '').trim().toUpperCase();
  if (c.length < 4) return false;
  const now = Math.floor(Date.now() / WINDOW_MS);
  return c === codeForWindow(channel, now) || c === codeForWindow(channel, now - 1);
}
