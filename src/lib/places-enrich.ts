// src/lib/places-enrich.ts
//
// Two narrow Google Places passes:
//
//   1. enrichClaimedHours: for every claimed clinic that has NO
//      working_hours populated, fetch opening_hours.weekday_text from
//      Place Details and write it. Reuses the place_id already stored
//      in decision_drivers.rating_refresh.place_id from the daily
//      rating refresh cron, so no Text Search round-trip is needed.
//
//   2. rescue404Urls: for every provider slug in the list, search
//      Places Text Search by name + city, take the top result, compare
//      its website to the on-file URL. If different, update. If Places
//      returns nothing, return 'no_listing' so the operator can flag
//      the clinic as truly defunct.
//
// Both passes write ONLY null/empty fields (never overwrite). Both
// return structured per-row results for the admin endpoint to render.
// 250ms throttle between Places calls to stay under quota.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const THROTTLE_MS = 250;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// --- Place Details: opening_hours -----------------------------------------

interface PlaceOpeningHours {
  weekday_text?: string[];
}

interface PlaceDetailsResponse {
  result?: {
    opening_hours?: PlaceOpeningHours;
    website?: string;
    formatted_phone_number?: string;
    name?: string;
  };
  status?: string;
}

async function placeDetails(placeId: string, fields: string[]): Promise<PlaceDetailsResponse | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', fields.join(','));
  url.searchParams.set('key', key);
  try {
    const r = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    return (await r.json()) as PlaceDetailsResponse;
  } catch {
    return null;
  }
}

interface PlaceSearchResult {
  place_id?: string;
  website?: string;
  name?: string;
  formatted_address?: string;
}

interface PlaceSearchResponse {
  results?: PlaceSearchResult[];
  status?: string;
}

async function placeTextSearch(query: string): Promise<PlaceSearchResponse | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('key', key);
  try {
    const r = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    return (await r.json()) as PlaceSearchResponse;
  } catch {
    return null;
  }
}

// Convert Places weekday_text (e.g. "Monday: 9:00 AM – 8:00 PM") to the
// working_hours JSON shape used in the DB (lowercased day key, "to" instead
// of en-dash so we don't reintroduce the dashes we just scrubbed elsewhere).
function weekdayTextToHoursMap(weekdayText: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of weekdayText) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (!m) continue;
    const day = m[1].toLowerCase();
    let hours = m[2].trim();
    // Normalize dashes to "to" so we honor the no-em-dash rule.
    hours = hours.replace(/\s*[–—−-]\s*/g, ' to ').replace(/\s+/g, ' ').trim();
    out[day] = hours;
  }
  return out;
}

// --- Pass 1: enrichClaimedHours -------------------------------------------

export interface EnrichHoursRow {
  slug: string;
  name: string;
  status: 'filled' | 'skipped_present' | 'no_place_id' | 'no_hours_returned' | 'error';
  message?: string;
  hours?: Record<string, string>;
}

export interface EnrichHoursResult {
  ok: boolean;
  totalConsidered: number;
  filled: number;
  rows: EnrichHoursRow[];
}

export async function enrichClaimedHours(opts: { skipSlugs?: string[] } = {}): Promise<EnrichHoursResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, totalConsidered: 0, filled: 0, rows: [] };

  const skip = new Set(opts.skipSlugs || []);
  const { data, error } = await sb
    .from('providers')
    .select('id, slug, name, working_hours, decision_drivers')
    .eq('is_claimed', true);
  if (error || !data) return { ok: false, totalConsidered: 0, filled: 0, rows: [] };

  const rows: EnrichHoursRow[] = [];
  let filled = 0;
  let considered = 0;

  for (const p of data) {
    if (skip.has(p.slug)) continue;
    considered++;

    const hasHours = p.working_hours && Object.keys(p.working_hours as object).length > 0;
    if (hasHours) {
      rows.push({ slug: p.slug, name: p.name, status: 'skipped_present' });
      continue;
    }

    const driver = (p.decision_drivers || {}) as { rating_refresh?: { place_id?: string } };
    const placeId = driver.rating_refresh?.place_id;
    if (!placeId) {
      rows.push({ slug: p.slug, name: p.name, status: 'no_place_id' });
      continue;
    }

    const det = await placeDetails(placeId, ['opening_hours', 'name']);
    await sleep(THROTTLE_MS);
    const wt = det?.result?.opening_hours?.weekday_text;
    if (!wt || wt.length === 0) {
      rows.push({ slug: p.slug, name: p.name, status: 'no_hours_returned' });
      continue;
    }
    const hoursMap = weekdayTextToHoursMap(wt);
    if (Object.keys(hoursMap).length === 0) {
      rows.push({ slug: p.slug, name: p.name, status: 'no_hours_returned' });
      continue;
    }
    // Record provenance in decision_drivers
    const driversNext = {
      ...(p.decision_drivers as Record<string, unknown> || {}),
      hours_enriched_at: new Date().toISOString(),
      hours_source: 'google_places_details',
    };
    const { error: upErr } = await sb
      .from('providers')
      .update({ working_hours: hoursMap, decision_drivers: driversNext })
      .eq('id', p.id);
    if (upErr) {
      rows.push({ slug: p.slug, name: p.name, status: 'error', message: upErr.message });
      continue;
    }
    rows.push({ slug: p.slug, name: p.name, status: 'filled', hours: hoursMap });
    filled++;
  }

  return { ok: true, totalConsidered: considered, filled, rows };
}

// --- Research-only inspection (no writes) --------------------------------

export interface InspectRow {
  slug: string;
  name: string;
  listedCity: string | null;
  listedWebsite: string | null;
  places: null | {
    name: string | null;
    address: string | null;
    types: string[];
    business_status: string | null;
    website: string | null;
    phone: string | null;
    place_id: string | null;
    rating: number | null;
    user_ratings_total: number | null;
    cityMatch: boolean;
    looksLikeIvClinic: boolean;
  };
  verdict: 'keep_iv_clinic' | 'maybe_not_iv' | 'closed' | 'no_listing' | 'error';
  notes: string[];
}

function lower(s: string | null | undefined): string {
  return (s || '').toLowerCase();
}

function looksLikeIvClinic(name: string | null, types: string[]): boolean {
  const n = lower(name);
  if (/\biv\b|drip|hydrat|infusion|wellness|naturopath|med spa|medspa|aesthet|injection|vitamin/.test(n)) return true;
  for (const t of types) {
    if (/health|doctor|spa|wellness|beauty_salon|medical|hospital/.test(t)) return true;
  }
  return false;
}

export async function inspectPlaces(opts: { slugs: string[] }): Promise<{ ok: boolean; rows: InspectRow[] }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, rows: [] };

  const slugs = opts.slugs.slice(0, 50);
  const { data, error } = await sb
    .from('providers')
    .select('id, slug, name, city, state, country, website')
    .in('slug', slugs);
  if (error || !data) return { ok: false, rows: [] };

  const rows: InspectRow[] = [];
  for (const p of data) {
    const notes: string[] = [];
    const query = [p.name, p.city, p.state].filter(Boolean).join(' ');
    const search = await placeTextSearch(query);
    await sleep(THROTTLE_MS);
    const top = search?.results?.[0];

    if (!top || !top.place_id) {
      rows.push({
        slug: p.slug,
        name: p.name,
        listedCity: p.city,
        listedWebsite: p.website,
        places: null,
        verdict: 'no_listing',
        notes: ['No Google Places result for "' + query + '"'],
      });
      continue;
    }

    const det = await placeDetails(top.place_id, [
      'name',
      'formatted_address',
      'types',
      'business_status',
      'website',
      'formatted_phone_number',
      'rating',
      'user_ratings_total',
    ]);
    await sleep(THROTTLE_MS);
    const dr = (det?.result || {}) as Record<string, unknown>;
    const placesName = (dr.name as string) || top.name || null;
    const address = (dr.formatted_address as string) || top.formatted_address || null;
    const types = Array.isArray(dr.types) ? (dr.types as string[]) : [];
    const businessStatus = (dr.business_status as string) || null;
    const website = (dr.website as string) || null;
    const phone = (dr.formatted_phone_number as string) || null;
    const rating = typeof dr.rating === 'number' ? (dr.rating as number) : null;
    const reviewCount = typeof dr.user_ratings_total === 'number' ? (dr.user_ratings_total as number) : null;

    const cityMatch = !!(p.city && address && lower(address).includes(lower(p.city)));
    const isIv = looksLikeIvClinic(placesName, types);

    if (!cityMatch) notes.push('Places address does not contain listed city "' + p.city + '"');
    if (!isIv) notes.push('Places name/types do not look like an IV/wellness clinic');
    if (businessStatus && businessStatus !== 'OPERATIONAL') notes.push('Business status: ' + businessStatus);
    if (website && p.website && website !== p.website) notes.push('Different website on Places');

    let verdict: InspectRow['verdict'] = 'keep_iv_clinic';
    if (businessStatus === 'CLOSED_PERMANENTLY' || businessStatus === 'CLOSED_TEMPORARILY') verdict = 'closed';
    else if (!isIv || !cityMatch) verdict = 'maybe_not_iv';

    rows.push({
      slug: p.slug,
      name: p.name,
      listedCity: p.city,
      listedWebsite: p.website,
      places: {
        name: placesName,
        address,
        types,
        business_status: businessStatus,
        website,
        phone,
        place_id: top.place_id,
        rating,
        user_ratings_total: reviewCount,
        cityMatch,
        looksLikeIvClinic: isIv,
      },
      verdict,
      notes,
    });
  }

  return { ok: true, rows };
}

// --- Pass 2: rescue404Urls ------------------------------------------------

export interface Rescue404Row {
  slug: string;
  name: string;
  city: string | null;
  beforeUrl: string | null;
  afterUrl: string | null;
  status: 'updated' | 'no_listing' | 'same_url' | 'no_website_in_listing' | 'error';
  placeId?: string;
  message?: string;
}

export interface Rescue404Result {
  ok: boolean;
  total: number;
  updated: number;
  noListing: number;
  rows: Rescue404Row[];
}

export async function rescue404Urls(opts: { slugs: string[] }): Promise<Rescue404Result> {
  const sb = getSupabase();
  if (!sb) return { ok: false, total: 0, updated: 0, noListing: 0, rows: [] };

  const slugs = opts.slugs.slice(0, 200); // hard cap per call
  const { data, error } = await sb
    .from('providers')
    .select('id, slug, name, city, state, country, website')
    .in('slug', slugs);
  if (error || !data) return { ok: false, total: 0, updated: 0, noListing: 0, rows: [] };

  const rows: Rescue404Row[] = [];
  let updated = 0;
  let noListing = 0;

  for (const p of data) {
    const queryParts = [p.name, p.city, p.state].filter(Boolean);
    const query = queryParts.join(' ');
    const search = await placeTextSearch(query);
    await sleep(THROTTLE_MS);

    const top = search?.results?.[0];
    if (!top || !top.place_id) {
      noListing++;
      rows.push({
        slug: p.slug,
        name: p.name,
        city: p.city,
        beforeUrl: p.website,
        afterUrl: null,
        status: 'no_listing',
      });
      continue;
    }

    // Need a Details call to get the website (text search only returns
    // limited fields). Throttle.
    const det = await placeDetails(top.place_id, ['website', 'name']);
    await sleep(THROTTLE_MS);
    const newSite = det?.result?.website;
    if (!newSite) {
      rows.push({
        slug: p.slug,
        name: p.name,
        city: p.city,
        beforeUrl: p.website,
        afterUrl: null,
        status: 'no_website_in_listing',
        placeId: top.place_id,
      });
      continue;
    }
    if (p.website && newSite === p.website) {
      rows.push({
        slug: p.slug,
        name: p.name,
        city: p.city,
        beforeUrl: p.website,
        afterUrl: newSite,
        status: 'same_url',
        placeId: top.place_id,
      });
      continue;
    }
    const { error: upErr } = await sb
      .from('providers')
      .update({ website: newSite })
      .eq('id', p.id);
    if (upErr) {
      rows.push({
        slug: p.slug,
        name: p.name,
        city: p.city,
        beforeUrl: p.website,
        afterUrl: newSite,
        status: 'error',
        message: upErr.message,
      });
      continue;
    }
    rows.push({
      slug: p.slug,
      name: p.name,
      city: p.city,
      beforeUrl: p.website,
      afterUrl: newSite,
      status: 'updated',
      placeId: top.place_id,
    });
    updated++;
  }

  return { ok: true, total: data.length, updated, noListing, rows };
}
