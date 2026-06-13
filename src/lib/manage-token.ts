/**
 * Durable, passwordless owner-access tokens for the self-serve "Finish your
 * listing" page (/finish/[token]).
 *
 * Design (operator-approved 2026-06-13): a clinic owner edits their listing via
 * one unguessable, bookmarkable link, no login ever. The token is an HMAC of
 * the provider id, so NOTHING is stored: the server recomputes and compares.
 * Forging a link requires the server secret, which never leaves the server.
 *
 * Token format: `<providerId>.<base64url(hmac-sha256(secret, providerId))>`.
 * Provider ids are UUIDs (no dots) and the signature is base64url (no dots),
 * so the single dot is an unambiguous separator.
 *
 * Secret resolution prefers a dedicated MANAGE_TOKEN_SECRET, then falls back to
 * the service-role key (server-only, present in every environment, and rarely
 * rotated). We deliberately do NOT chain through CRON_SECRET: it is not present
 * in every environment, so links could validate in one place and not another,
 * and it rotates more often, which would silently break owners' bookmarked
 * links. Add MANAGE_TOKEN_SECRET in Vercel later to decouple cleanly.
 */
import crypto from 'crypto';

function secret(): string {
  return (
    process.env.MANAGE_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'dev-insecure-secret-do-not-use-in-prod'
  );
}

function sign(providerId: string): string {
  return crypto.createHmac('sha256', secret()).update(providerId).digest('base64url');
}

export function generateManageToken(providerId: string): string {
  return `${providerId}.${sign(providerId)}`;
}

/**
 * Returns the providerId if the token is valid, else null. Constant-time
 * signature comparison. Never throws.
 */
export function verifyManageToken(token: string | undefined | null): string | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const dot = token.lastIndexOf('.');
    if (dot <= 0) return null;
    const providerId = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!providerId || !sig) return null;
    const expected = sign(providerId);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
    return providerId;
  } catch {
    return null;
  }
}

export function manageUrl(providerId: string, siteUrl = 'https://www.thedripmap.com'): string {
  return `${siteUrl}/finish/${generateManageToken(providerId)}`;
}
