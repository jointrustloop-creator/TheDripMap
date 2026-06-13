/**
 * Durable, passwordless owner-access tokens for the self-serve "Finish your
 * listing" page (/finish/[token]).
 *
 * Design v2 (2026-06-13): the token is a random secret STORED IN THE DATABASE
 * at providers.decision_drivers.manage_token. We deliberately moved off an
 * env-secret HMAC because the secret resolved differently across environments
 * (local vs Vercel), so links signed in one place failed in another. A
 * DB-stored token is identical everywhere: any environment that can read the
 * row can mint and validate the same link, and links never break on a secret
 * rotation.
 *
 * Token format in the URL: `<providerId>.<secret>`. Provider ids are UUIDs
 * (no dots) and the secret is base64url (no dots), so the single dot is an
 * unambiguous separator. Validation = load the provider, constant-time compare
 * the secret against the stored value.
 */
import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

const SITE = 'https://www.thedripmap.com';

export function newManageSecret(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function parseManageToken(token: string | undefined | null): { providerId: string; secret: string } | null {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const providerId = token.slice(0, dot);
  const secret = token.slice(dot + 1);
  if (!providerId || !secret) return null;
  return { providerId, secret };
}

export function secretsMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  try {
    if (!a || !b) return false;
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && crypto.timingSafeEqual(x, y);
  } catch {
    return false;
  }
}

export function manageUrlFrom(providerId: string, secret: string, site = SITE): string {
  return `${site}/finish/${providerId}.${secret}`;
}

/**
 * Read (and lazily create) the per-provider manage secret stored in
 * providers.decision_drivers.manage_token. Returns the secret or null on error.
 * Merges into existing decision_drivers so other keys (orphan_claim_stub
 * source, the /finish answers under `manage`, etc.) are preserved.
 */
export async function ensureManageToken(sb: SupabaseClient, providerId: string): Promise<string | null> {
  const { data, error } = await sb.from('providers').select('decision_drivers').eq('id', providerId).maybeSingle();
  if (error || !data) return null;
  const dd = (data.decision_drivers && typeof data.decision_drivers === 'object')
    ? (data.decision_drivers as Record<string, unknown>)
    : {};
  if (typeof dd.manage_token === 'string' && dd.manage_token) return dd.manage_token as string;
  const secret = newManageSecret();
  const { error: updErr } = await sb.from('providers').update({ decision_drivers: { ...dd, manage_token: secret } }).eq('id', providerId);
  if (updErr) return null;
  return secret;
}

/** Ensure + format the full /finish URL for a provider. */
export async function manageUrlForProvider(sb: SupabaseClient, providerId: string, site = SITE): Promise<string | null> {
  const secret = await ensureManageToken(sb, providerId);
  return secret ? manageUrlFrom(providerId, secret, site) : null;
}
