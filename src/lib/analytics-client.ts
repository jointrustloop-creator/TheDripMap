/**
 * analytics-client.ts
 *
 * Browser-side capture for first-party listing analytics. Posts to
 * /api/track using sendBeacon so the request survives navigation away
 * from the page (which is the whole point — most events fire RIGHT
 * before the user opens the clinic's booking site, tel: dialer, or
 * Google Maps).
 *
 * Server-component safe: every browser API is guarded by a
 * `typeof window !== 'undefined'` check. trackEvent() never throws.
 *
 * Owners do not see this data yet. It powers the future "profile
 * insights" premium feature; for now only admins read it.
 */
'use client';

const ENDPOINT = '/api/track';

const ALLOWED: ReadonlySet<string> = new Set([
  'view',
  'book_click',
  'call_click',
  'website_click',
  'directions_click',
  'message_click',
]);

// Strip path + query off document.referrer so we never log PII.
// Browsers send full URLs; we want hostname only (e.g. "www.google.com").
function coarseReferrer(): string | null {
  if (typeof document === 'undefined') return null;
  const raw = document.referrer;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.hostname || null;
  } catch {
    return null;
  }
}

/**
 * Fire a single capture event. Fire-and-forget. Never throws.
 *
 * Uses navigator.sendBeacon when available so the request is queued by
 * the browser even if the user clicks a link that immediately navigates
 * the page away. Falls back to fetch({ keepalive: true }) on browsers
 * that don't expose sendBeacon (mostly older Safari).
 */
export function trackEvent(provider_id: string, event_type: string): void {
  if (typeof window === 'undefined') return;
  if (!provider_id || !ALLOWED.has(event_type)) return;

  const payload = JSON.stringify({
    provider_id,
    event_type,
    referrer: coarseReferrer(),
  });

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      // sendBeacon must be given a Blob with explicit content-type so the
      // server-side route reads it as JSON.
      const blob = new Blob([payload], { type: 'application/json' });
      const ok = navigator.sendBeacon(ENDPOINT, blob);
      if (ok) return;
      // sendBeacon returned false (queue full / size cap). Fall through.
    }
    // Fallback: keepalive fetch so the request still survives navigation.
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // swallow — analytics must never block the user or surface errors
    });
  } catch {
    // swallow — analytics must never throw
  }
}
