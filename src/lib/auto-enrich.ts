// src/lib/auto-enrich.ts
//
// Fire-and-forget enrichment for a single provider, called from the
// verify-claim handler after `is_claimed = true` flips. Pulls public
// data (Nominatim geocode + clinic-website scrape + optional Google
// Places when key present) and fills ONLY null/empty fields. Existing
// values are never overwritten.
//
// Follows the source-flag pattern used by scripts/enrich-diamond-bay.cjs:
// every enriched field is recorded inside providers.decision_drivers
// JSONB as:
//   {
//     enrichment_source: 'public_enrichment',
//     enriched_at: ISO,
//     enriched_fields: ['phone', 'working_hours', ...]
//   }
//
// Always returns — never throws — so the caller can fire-and-forget.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ensureManageToken } from './manage-token';

const USER_AGENT = 'TheDripMap-AutoEnrich/1.0 (info@thedripmap.com)';
const FETCH_TIMEOUT_MS = 12000;

export interface EnrichmentResult {
  ok: boolean;
  providerId: string;
  filled: string[];
  skipped: string[];
  errors: string[];
}

interface ProviderRow {
  id: string;
  name: string | null;
  slug: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  online_booking_url: string | null;
  working_hours: Record<string, string> | null;
  specialties: string[] | null;
  rating: number | null;
  reviews: string | number | null;
  decision_drivers: Record<string, unknown> | null;
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { 'User-Agent': USER_AGENT, ...(init.headers || {}) },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return res;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Nominatim geocoder (no key needed). Respect their 1-req/sec policy.
// ─────────────────────────────────────────────────────────────────
async function geocodeAddress(query: string): Promise<{ lat: number; lon: number } | null> {
  if (!query || query.trim().length < 4) return null;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  const res = await fetchWithTimeout(url.toString());
  if (!res || !res.ok) return null;
  try {
    const j = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    if (!Array.isArray(j) || j.length === 0) return null;
    const lat = Number(j[0]?.lat);
    const lon = Number(j[0]?.lon);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Website scrape: pull phone + booking URL + a coarse hours hint.
// Pragmatic regex extraction — never parses HTML, never blocks the
// caller for long, and skips silently on any failure.
// ─────────────────────────────────────────────────────────────────
interface ScrapeResult {
  phone: string | null;
  online_booking_url: string | null;
  hours_hint: string | null;
}

const BOOKING_HOSTS = [
  'janeapp.com',
  'square.site',
  'squareup.com',
  'mindbody',
  'vagaro.com',
  'booksy.com',
  'fresha.com',
  'calendly.com',
  'acuityscheduling.com',
  'setmore.com',
  'schedulicity.com',
  'getzenoti.com',
  'zenoti.com',
];

function extractPhone(html: string): string | null {
  // Match North American formats only — anything else, skip.
  const m = html.match(/(\+?1[\s.\-]?)?\(?([2-9]\d{2})\)?[\s.\-]?(\d{3})[\s.\-]?(\d{4})/);
  if (!m) return null;
  return `${m[2]}-${m[3]}-${m[4]}`;
}

function extractBookingUrl(html: string): string | null {
  const re = /https?:\/\/[a-z0-9.\-]+\/[^"'<>\s]*/gi;
  const matches = html.match(re) || [];
  for (const raw of matches) {
    const lower = raw.toLowerCase();
    if (BOOKING_HOSTS.some((h) => lower.includes(h))) {
      // Strip trailing punctuation
      return raw.replace(/[\)\]\.,;]+$/, '');
    }
  }
  return null;
}

function extractHoursHint(html: string): string | null {
  // Look for the first "Mon...Sun" or "Hours" snippet. We don't try to
  // parse it perfectly — the operator's review pass + Places fallback
  // do the real work. This just gives the daily report a soft signal.
  const m = html.match(
    /(Monday|Mon|Hours)[^<]{5,120}(Sunday|Sun|Closed|AM|PM|appointment)/i,
  );
  return m ? m[0].replace(/\s+/g, ' ').trim().slice(0, 200) : null;
}

async function scrapeWebsite(website: string | null): Promise<ScrapeResult> {
  const empty: ScrapeResult = { phone: null, online_booking_url: null, hours_hint: null };
  if (!website) return empty;
  let url = website.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  const res = await fetchWithTimeout(url);
  if (!res || !res.ok) return empty;
  let html: string;
  try {
    html = await res.text();
  } catch {
    return empty;
  }
  // Cap to first 200kb to bound CPU.
  html = html.slice(0, 200_000);
  return {
    phone: extractPhone(html),
    online_booking_url: extractBookingUrl(html),
    hours_hint: extractHoursHint(html),
  };
}

// ─────────────────────────────────────────────────────────────────
// Google Places (optional): grab rating + review count if key present.
// We deliberately do NOT pull phone/hours/website from Places here —
// the existing /api/cron/refresh-verified-ratings handles those on a
// schedule, and the website scrape is more reliable for the long-tail
// indie clinic case.
// ─────────────────────────────────────────────────────────────────
interface PlacesData {
  rating: number | null;
  reviews: number | null;
}

async function lookupPlacesQuick(
  name: string,
  city: string | null,
  state: string | null,
): Promise<PlacesData> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return { rating: null, reviews: null };
  const queryParts = [name, city, state].filter((s) => s && s.trim().length > 0);
  const query = queryParts.join(' ');
  if (!query) return { rating: null, reviews: null };

  const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  searchUrl.searchParams.set('query', query);
  searchUrl.searchParams.set('key', apiKey);
  const sRes = await fetchWithTimeout(searchUrl.toString());
  if (!sRes || !sRes.ok) return { rating: null, reviews: null };
  let sJson: { results?: Array<{ place_id?: string; rating?: number; user_ratings_total?: number }> };
  try {
    sJson = await sRes.json();
  } catch {
    return { rating: null, reviews: null };
  }
  const top = sJson?.results?.[0];
  if (!top) return { rating: null, reviews: null };
  return {
    rating: typeof top.rating === 'number' ? top.rating : null,
    reviews: typeof top.user_ratings_total === 'number' ? top.user_ratings_total : null,
  };
}

// ─────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────
export async function autoEnrichProvider(providerId: string): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    ok: false,
    providerId,
    filled: [],
    skipped: [],
    errors: [],
  };

  const supabase = getSupabase();
  if (!supabase) {
    result.errors.push('Supabase env vars missing');
    return result;
  }

  const { data, error } = await supabase
    .from('providers')
    .select(
      'id, name, slug, address, city, state, country, latitude, longitude, phone, website, online_booking_url, working_hours, specialties, rating, reviews, decision_drivers',
    )
    .eq('id', providerId)
    .maybeSingle();

  if (error) {
    result.errors.push(`Provider select failed: ${error.message}`);
    return result;
  }
  if (!data) {
    result.errors.push('Provider not found');
    return result;
  }
  const row = data as ProviderRow;

  const update: Record<string, unknown> = {};
  const filled: string[] = [];
  const skipped: string[] = [];

  // 1. Geocode (only if missing)
  if (isEmpty(row.latitude) || isEmpty(row.longitude)) {
    const addrParts = [row.address, row.city, row.state, row.country].filter(Boolean);
    const addrQuery = addrParts.join(', ');
    if (addrQuery) {
      const geo = await geocodeAddress(addrQuery);
      if (geo) {
        update.latitude = geo.lat;
        update.longitude = geo.lon;
        filled.push('latitude', 'longitude');
      } else {
        skipped.push('latitude/longitude (geocode returned nothing)');
      }
    } else {
      skipped.push('latitude/longitude (no address to geocode)');
    }
  } else {
    skipped.push('latitude/longitude (already set)');
  }

  // 2. Website scrape (only if website present)
  if (row.website) {
    const scraped = await scrapeWebsite(row.website);
    if (scraped.phone && isEmpty(row.phone)) {
      update.phone = scraped.phone;
      filled.push('phone');
    }
    if (scraped.online_booking_url && isEmpty(row.online_booking_url)) {
      update.online_booking_url = scraped.online_booking_url;
      filled.push('online_booking_url');
    }
    if (scraped.hours_hint && isEmpty(row.working_hours)) {
      // Don't overwrite — only set a coarse hint so the operator
      // can review/correct on the next pass.
      update.working_hours = { hint: scraped.hours_hint };
      filled.push('working_hours');
    }
  } else {
    skipped.push('website-scrape (no website on record)');
  }

  // 3. Google Places (rating + reviews) — optional, only if key set
  if (row.name && (isEmpty(row.rating) || isEmpty(row.reviews))) {
    const places = await lookupPlacesQuick(row.name, row.city, row.state);
    if (places.rating !== null && isEmpty(row.rating)) {
      update.rating = places.rating;
      filled.push('rating');
    }
    if (places.reviews !== null && isEmpty(row.reviews)) {
      update.reviews = places.reviews;
      filled.push('reviews');
    }
  }

  // If nothing was actually filled, skip the write entirely — no churn and no
  // risk of clobbering a concurrent write for zero gain.
  if (filled.length === 0) {
    result.ok = true;
    result.filled = [];
    result.skipped = skipped;
    return result;
  }

  // Re-read decision_drivers IMMEDIATELY before writing and merge into the
  // freshest value. This runs as a slow fire-and-forget at the exact moment an
  // owner verifies, while the verify handler writes `manage_token` (the /finish
  // link) and the owner may submit their /finish answers (decision_drivers.manage).
  // Merging the stale snapshot we read at the top of this function would clobber
  // those concurrent writes (this is what silently broke a real owner's finish
  // link). Re-reading here makes the JSONB read-modify-write safe.
  const { data: fresh } = await supabase
    .from('providers')
    .select('decision_drivers')
    .eq('id', providerId)
    .maybeSingle();
  const freshDrivers =
    fresh?.decision_drivers && typeof fresh.decision_drivers === 'object'
      ? (fresh.decision_drivers as Record<string, unknown>)
      : row.decision_drivers && typeof row.decision_drivers === 'object'
        ? (row.decision_drivers as Record<string, unknown>)
        : {};
  const priorFields = Array.isArray((freshDrivers as { enriched_fields?: unknown }).enriched_fields)
    ? ((freshDrivers as { enriched_fields: string[] }).enriched_fields)
    : [];
  update.decision_drivers = {
    ...freshDrivers,
    enrichment_source: 'public_enrichment',
    enriched_at: new Date().toISOString(),
    enriched_fields: Array.from(new Set([...priorFields, ...filled])),
  };

  const { error: upErr } = await supabase.from('providers').update(update).eq('id', providerId);
  if (upErr) {
    result.errors.push(`Provider update failed: ${upErr.message}`);
    return result;
  }

  // Safety net (2026-06-15): immediately after writing decision_drivers, re-ensure
  // the /finish manage-token exists. The re-read merge above preserves it in the
  // normal case, but a bad-order write previously left a freshly verified owner
  // with no token and a dead questionnaire link. ensureManageToken is idempotent
  // (a no-op when the token is already present), so this only heals the rare
  // clobbered case and never churns a working token. Non-fatal.
  try {
    await ensureManageToken(supabase, providerId);
  } catch {
    /* non-fatal: the daily report's FINISH LINK BROKEN alarm catches any miss */
  }

  result.ok = true;
  result.filled = filled;
  result.skipped = skipped;
  return result;
}
