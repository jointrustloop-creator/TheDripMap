import { Provider } from '../types';

/**
 * Honest, data-backed card signals. Each returns a value ONLY when the
 * underlying provider data genuinely supports it, so a card never shows a cue
 * it cannot stand behind (this site's #1 rule: never fabricate).
 *
 * Coverage as of 2026-06-25 (active providers): online_booking_url ~3.5%.
 * Low-coverage by nature, which is exactly why these signals are rendered
 * conditionally and never as a universal chip.
 */

/**
 * A real, clickable online-booking URL for a clinic, or null. Validated to a
 * plausible http(s) URL so empty strings, whitespace, or garbage never render
 * a "Books online" cue.
 */
export function bookingUrlOf(provider: Provider): string | null {
  const raw = (provider as { online_booking_url?: string | null }).online_booking_url;
  if (!raw || typeof raw !== 'string') return null;
  const url = raw.trim();
  // Require a scheme and at least one dot in the host so "n/a", "soon", a bare
  // word, or a relative path can never masquerade as a booking link.
  return /^https?:\/\/[^\s.]+\.[^\s]+/i.test(url) ? url : null;
}
