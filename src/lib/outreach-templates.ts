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
 *
 * 2026-06-08: added traffic-led variant for single-location sends. Selector
 * pickSingleLocation() chooses traffic-led when listing_events shows >= 1
 * view in the trailing 7 days, otherwise baseline. Template ID is returned
 * alongside the body so outbound_message_log can record which variant went
 * out (the tally script groups by template_id).
 */
import { CASL_FOOTER } from './outreach-quality';

const SITE_URL = 'https://www.thedripmap.com';

// Stable template IDs. Bump the version suffix when copy changes meaningfully.
export const TEMPLATE_SINGLE_BASELINE_V1 = 'single_baseline_v1';
export const TEMPLATE_SINGLE_TRAFFIC_LED_V1 = 'single_traffic_led_v1';
export const TEMPLATE_MULTI_BASELINE_V1 = 'multi_baseline_v1';
export const TEMPLATE_FOLLOWUP_V1 = 'followup_v1';

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

/**
 * Baseline opener: generic "your listing is live, here's what claiming
 * unlocks." Used when we have no traffic signal for the provider.
 */
export function buildSingleLocationBody(p: ProviderRow): string {
  const display = cleanName(p.name);
  const providerUrl = `${SITE_URL}/providers/${p.slug}`;
  const claimUrl = `${SITE_URL}/providers/${p.slug}?claim=1`;
  const city = (p.city || '').trim();
  const cityLabel = city || 'your area';

  return `Hi ${display} team,

Your clinic is listed on TheDripMap, Canada's IV therapy matching platform, here:
${providerUrl}

Right now your page shows a generic placeholder where your photos, hours, services, and description should be. When someone searching "IV therapy in ${cityLabel}" lands on it, they see a thin profile and move on to the next clinic.

Claimed clinics on TheDripMap get:
  • Real photos and your full menu of drips, prices, and add-ons
  • Hours, phone, and a direct "Book now" link to your site
  • A verified badge once we confirm your medical director and licensed staff
  • Patient reviews aggregated from Google plus TheDripMap

Claiming is free and takes 2 minutes:
${claimUrl}

Separately, we're opening a Featured tier later this year for clinics that want top placement on their city page and treatment pages. Limited inventory, 3 slots per city. If you want first dibs in ${cityLabel}, reply with the word WAITLIST and I'll add you.

Warmly,
TheDripMap Team
info@thedripmap.com
${CASL_FOOTER}`;
}

/**
 * Traffic-led opener: lead with the real view count from listing_events.
 * Used when listing_events shows >= 1 view in the trailing 7 days, so the
 * "N times last week" claim is honest. Falls back to baseline at the caller
 * level when views == 0.
 */
export function buildSingleLocationBodyTrafficLed(p: ProviderRow, views: number): string {
  const display = cleanName(p.name);
  const providerUrl = `${SITE_URL}/providers/${p.slug}`;
  const claimUrl = `${SITE_URL}/providers/${p.slug}?claim=1`;
  const city = (p.city || '').trim();
  const cityLabel = city || 'your area';
  const viewWord = views === 1 ? 'time' : 'times';

  return `Hi ${display} team,

Your TheDripMap page was viewed ${views} ${viewWord} last week by people searching IV therapy in ${cityLabel}, but it is still a blank placeholder:
${providerUrl}

That is real traffic landing on a thin profile and clicking away to the next clinic.

Claimed clinics on TheDripMap get:
  • Real photos and your full menu of drips, prices, and add-ons
  • Hours, phone, and a direct "Book now" link to your site
  • A verified badge once we confirm your medical director and licensed staff
  • Patient reviews aggregated from Google plus TheDripMap

Claiming is free and takes 2 minutes:
${claimUrl}

Separately, we're opening a Featured tier later this year for clinics that want top placement on their city page and treatment pages. Limited inventory, 3 slots per city. If you want first dibs in ${cityLabel}, reply with the word WAITLIST and I'll add you.

Warmly,
TheDripMap Team
info@thedripmap.com
${CASL_FOOTER}`;
}

/**
 * Picks the right single-location template based on trailing-7d view count.
 * Returns the body and the stable template_id so the send path can record
 * which variant was used in outbound_message_log.
 *
 * Per operator (2026-06-08): traffic-led for all providers with real
 * traffic, baseline as fallback. Not a 50/50 split.
 */
export function pickSingleLocationBody(
  p: ProviderRow,
  trailing7dViews: number
): { templateId: string; body: string } {
  if (trailing7dViews >= 1) {
    return {
      templateId: TEMPLATE_SINGLE_TRAFFIC_LED_V1,
      body: buildSingleLocationBodyTrafficLed(p, trailing7dViews),
    };
  }
  return {
    templateId: TEMPLATE_SINGLE_BASELINE_V1,
    body: buildSingleLocationBody(p),
  };
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

All ${count} of your ${brand} locations across ${cityPhrase} are listed on TheDripMap, Canada's IV therapy matching platform:

${locations}

Right now each page shows a generic placeholder where your photos, hours, services, and description should be. When someone searching for IV therapy lands on one of them, they see a thin profile and move on.

Claimed clinics on TheDripMap get:
  • Real photos and your full menu of drips, prices, and add-ons
  • Hours, phone, and a direct "Book now" link to your site
  • A verified badge once we confirm your medical director and licensed staff
  • Patient reviews aggregated from Google plus TheDripMap

Claiming each listing is free and takes 2 minutes.

Separately, we're opening a Featured tier later this year for clinics that want top placement on their city page and treatment pages. Limited inventory, 3 slots per city. If you want first dibs in any of your cities, reply with the word WAITLIST and the city names and I'll add you.

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

/**
 * Pull trailing-7-day view count for a provider from listing_events.
 * Safe to call inside Promise.all over a batch - it's one count(*) per id,
 * sub-50ms each on the indexed column.
 *
 * Returns 0 on any error so the caller falls back to the baseline template
 * rather than blowing up the whole send.
 */
// supabase: loosely typed so callers can pass either the public-anon client
// or a service-role client without dragging the full generated Database type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getProviderViews7d(supabase: any, providerId: string): Promise<number> {
  try {
    const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
    const { count } = await supabase
      .from('listing_events')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', providerId)
      .eq('event_type', 'view')
      .gte('created_at', since);
    return typeof count === 'number' ? count : 0;
  } catch {
    return 0;
  }
}
