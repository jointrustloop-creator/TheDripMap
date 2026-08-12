'use client';

/**
 * Client helper: record a filter-chip toggle. Fire-and-forget — uses
 * sendBeacon when available (survives navigation) and never throws.
 */
function sessionId(): string {
  try {
    const KEY = 'tdm_sid';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

export function trackFilter(
  filterId: string,
  action: 'on' | 'off',
  surface: 'search' | 'city',
  city?: string | null,
): void {
  try {
    const payload = JSON.stringify({ filterId, action, surface, city: city || null, sessionId: sessionId() });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track-filter', new Blob([payload], { type: 'application/json' }));
      return;
    }
    fetch('/api/track-filter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
  } catch {
    /* never let telemetry break a click */
  }
}
