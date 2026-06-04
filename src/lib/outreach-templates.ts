/**
 * Shared outreach email templates + helpers.
 *
 * Originally lived inside app/api/cron/daily-outreach/route.ts. Extracted so
 * the daily cron AND admin endpoints (queue-outreach-drafts,
 * regenerate-outreach) generate IDENTICAL bodies, and so any future template
 * edit happens in exactly one place.
 *
 * Em/en dash policy (2026-06-02): no em-dash (—) or en-dash (–) characters
 * anywhere in outgoing template strings. Use comma or period-and-new-sentence.
 * Regular hyphens (-) are fine for list separators.
 */
import { CASL_FOOTER } from './outreach-quality';

const SITE_URL = 'https://www.thedripmap.com';

export interface ProviderRow {
  id: string;
  name: string;
  slug: string;
  rating: number | null;
  reviews: string | number | null;
  email: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
}

export function cleanName(n: string): string {
  return n
    .split(' - ')[0]
    .split(' | ')[0]
    .split(', A Division of')[0]
    .replace(/\s+IV (Hydration|Therapy).*$/i, '')
    .trim();
}

export function locationLabel(p: ProviderRow): string {
  const city = (p.city || '').trim();
  const state = (p.state || '').trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || 'location';
}

export function isCanadian(country?: string | null): boolean {
  return (country || '').trim().toLowerCase() === 'canada';
}

export function buildSingleLocationBody(p: ProviderRow): string {
  const display = cleanName(p.name);
  const claimUrl = `${SITE_URL}/providers/${p.slug}?claim=1`;
  const city = (p.city || '').trim();
  const hasRating = !!(p.rating && Number(p.reviews) > 0);

  const opener = hasRating
    ? `I came across ${display} while researching the top-rated IV therapy clinics in ${city || 'your area'}. Your Google rating of ${p.rating}★ across ${p.reviews} reviews puts you in a small group of clinics patients actually trust, which is exactly the kind we feature on TheDripMap.`
    : `I came across ${display} while building out our ${city || 'local'} IV therapy listings on TheDripMap, North America's directory for IV therapy clinics.`;

  return `Hi ${display} team,

${opener}

We added your listing, but right now it's unclaimed, so visitors see a generic placeholder instead of your photos, hours, services, and description. Claiming is free and takes 2 minutes:
${claimUrl}

Warmly,
TheDripMap Team
info@thedripmap.com
${CASL_FOOTER}`;
}

export function buildMultiLocationBody(providers: ProviderRow[], email: string): string {
  const brand = cleanName(providers[0].name);
  const count = providers.length;
  const cities = Array.from(
    new Set(
      providers
        .map((p) => (p.city || '').trim())
        .filter((c) => c.length > 0)
    )
  );
  const cityPhrase = cities.length === 0
    ? 'multiple cities'
    : cities.length === 1
      ? cities[0]
      : cities.length === 2
        ? `${cities[0]} and ${cities[1]}`
        : `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}`;

  const locations = providers.map((p) => {
    const url = `${SITE_URL}/providers/${p.slug}?claim=1`;
    return `  • ${cleanName(p.name)} - ${locationLabel(p)}\n    ${url}`;
  }).join('\n');

  return `Hi ${brand} team,

I came across ${count} of your ${brand} locations across ${cityPhrase} while researching trusted IV therapy clinics for TheDripMap, North America's directory for IV therapy. All ${count} are live with us but currently unclaimed:

${locations}

Right now visitors see a generic placeholder on each one instead of your real photos, hours, services, and description. Claiming each listing is free and takes 2 minutes.

I sent this once to ${email.toLowerCase().trim()} because all ${count} locations share that email, so you only hear from me once, not ${count} times.

Warmly,
TheDripMap Team
info@thedripmap.com
${CASL_FOOTER}`;
}

export function outreachSubject(brand: string, locations: number): string {
  return locations > 1
    ? `Your ${brand} locations on TheDripMap`
    : `Your ${brand} listing on TheDripMap`;
}
