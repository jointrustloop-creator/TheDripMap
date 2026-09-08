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

/**
 * An honest "starting price" for a card, or null. This is the single strongest
 * booking cue we promise clinic owners on /for-clinics ("your drip menu with
 * your real prices... patients book the one whose prices they can see"), so it
 * is surfaced on claimed cards — but ONLY when the clinic's own menu carries a
 * real dollar amount. We never invent a number.
 *
 * Sources are the owner's real menu: services[].price and the price_range field
 * (which in practice holds a real dollar range like "$150-250" or "$180" for
 * clinics that filled it in). We extract every $-prefixed figure, keep those
 * inside a sane IV band ($30–$5,000 so a stray "5" or a "$10,000 membership"
 * can't distort it), and return the minimum as "From $X". A vague $/$$/$$$ tier
 * has no digit after the "$", so it is ignored by design: a tier is not a price
 * a patient can act on, and showing it would dilute the real ones.
 */
export function priceSignalOf(provider: Provider): { from: number; text: string } | null {
  const services = (provider.services || []) as Array<{ price?: string | null }>;
  const sources: string[] = services.map((s) => (s?.price || '').toString());
  // price_range / priceRange often carry a real dollar range for claimed clinics.
  sources.push((provider.price_range || '').toString());
  sources.push(((provider as { priceRange?: string | null }).priceRange || '').toString());

  const amounts: number[] = [];
  for (const raw of sources) {
    if (!raw) continue;
    // Match $-prefixed figures only, so a bare "60 min" duration never reads as
    // a price and a "$$" tier (no digit) is skipped. Handles "$150", "$1,200",
    // "$150-$200" / "$150-250" (the leading figure is the starting price).
    const matches = raw.match(/\$\s?\d[\d,]*/g);
    if (!matches) continue;
    for (const m of matches) {
      const n = Number(m.replace(/[^\d]/g, ''));
      if (Number.isFinite(n) && n >= 30 && n <= 5000) amounts.push(n);
    }
  }
  if (!amounts.length) return null;
  const from = Math.min(...amounts);
  return { from, text: `From $${from.toLocaleString()}` };
}
