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
