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

import { encodeIntent, type IntentKind, type IntentFields } from './intent';

const ENDPOINT = '/api/track';

const ALLOWED: ReadonlySet<string> = new Set([
  'view',
  'book_click',
  'call_click',
  'website_click',
  'directions_click',
  'message_click',
  'booking_click',
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
  send(JSON.stringify({ provider_id, event_type, referrer: coarseReferrer() }));
}

/**
 * Per-tab session id (Demand Pulse). Random, 8 chars, lives in sessionStorage
 * so one visitor's searches, quiz, compares and listing views can be grouped
 * without any identity. A browser that blocks storage gets a fresh id per
 * page, which only under-counts.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const k = 'tdm_sid';
    let v = window.sessionStorage.getItem(k);
    if (!v || !/^[a-z0-9]{8}$/.test(v)) {
      v = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
      window.sessionStorage.setItem(k, v);
    }
    return v;
  } catch {
    return Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  }
}

/** Fire an intent event once per session for a given dedupe key. */
export function trackIntentOnce(dedupeKey: string, provider_id: string, kind: IntentKind, fields: IntentFields = {}): void {
  if (typeof window === 'undefined') return;
  try {
    const k = `tdm_i_${dedupeKey}`;
    if (window.sessionStorage.getItem(k)) return;
    window.sessionStorage.setItem(k, '1');
  } catch { /* storage blocked: fire anyway */ }
  trackIntent(provider_id, kind, fields);
}

/** Fire an intent event (see src/lib/intent.ts). Fire-and-forget. Never throws. */
export function trackIntent(provider_id: string, kind: IntentKind, fields: IntentFields = {}): void {
  if (typeof window === 'undefined' || !provider_id) return;
  const token = encodeIntent(kind, { s: getSessionId(), ...fields });
  if (!token) return;
  send(JSON.stringify({ provider_id, event_type: 'intent', referrer: token }));
}

/** Internal path of the page that linked here, or null when the visitor came from outside. */
export function internalSourcePath(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const raw = document.referrer;
    if (!raw) return null;
    const u = new URL(raw);
    if (u.hostname.replace(/^www\./, '') !== window.location.hostname.replace(/^www\./, '')) return null;
    return u.pathname.slice(0, 80) || '/';
  } catch {
    return null;
  }
}

function send(payload: string): void {
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
