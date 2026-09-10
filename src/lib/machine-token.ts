/**
 * Operator-side machine token for the few admin routes the batch runners drive
 * remotely (the extraction and mail keys only exist on Vercel). The token is
 * minted on the operator side and stored in Vercel as ACTIVATION_RUN_TOKEN.
 * middleware.ts admits it ONLY for the paths in MACHINE_TOKEN_PATHS, and each
 * of those routes re-checks it here, so the token can never reach any other
 * admin route and never involves the admin password.
 */

export const MACHINE_TOKEN_PATHS = new Set<string>([
  '/api/admin/activation-run',
  '/api/admin/finish-nudge',
  '/api/admin/warm-outreach',
]);

/** Constant-time compare of the presented Bearer token. Absent env = off. */
export function machineTokenOk(authorizationHeader: string | null | undefined): boolean {
  // Trim both sides: a value added through the CLI can carry a trailing
  // newline, and a raw length compare would then fail forever.
  const expected = (process.env.ACTIVATION_RUN_TOKEN || '').trim();
  if (!expected) return false;
  const got = (authorizationHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!got || got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
