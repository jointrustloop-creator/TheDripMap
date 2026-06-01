/**
 * Recognises a Supabase connection-level failure (Cloudflare 522, fetch
 * timeout, socket reset) — i.e. the upstream is unreachable rather than the
 * query being wrong. Data-layer functions throw this error so dynamic routes
 * can render a soft fallback page instead of HTTP 404.
 */
export class SupabaseUnreachableError extends Error {
  constructor(origMessage: string) {
    super(`Supabase origin unreachable: ${(origMessage || '').slice(0, 200)}`);
    this.name = 'SupabaseUnreachableError';
  }
}

/**
 * Returns true if the error looks like a connection-level failure (Cloudflare
 * 522 origin-timeout HTML body, fetch network error, socket reset, etc.).
 * Returns false for PostgREST query errors (column missing, RLS denial, etc.)
 * which should still be treated as a "no data" outcome by callers.
 */
export function isSupabaseConnectionError(err: unknown): boolean {
  if (!err) return false;
  const msgRaw =
    typeof err === 'string'
      ? err
      : (err as { message?: unknown })?.message != null
        ? String((err as { message?: unknown }).message)
        : String(err);
  const msg = msgRaw.trim();
  // Cloudflare 5xx error pages start with the HTML doctype.
  if (msg.startsWith('<!DOCTYPE html>') || msg.startsWith('<!doctype html>')) return true;
  if (/Connection timed out|<title>[^<]*522:|cloudflare/i.test(msg)) return true;
  if (/UND_ERR_SOCKET|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|fetch failed|network error|terminated/i.test(msg)) return true;
  return false;
}
