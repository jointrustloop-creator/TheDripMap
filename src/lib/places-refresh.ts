// src/lib/places-refresh.ts
//
// Shared engine behind both:
//   /api/admin/refresh-verified-ratings  (manual, admin-cookie or bearer auth)
//   /api/cron/refresh-verified-ratings   (scheduled daily by Vercel cron)
//
// Refreshes Google rating + review count for every VERIFIED clinic
// (is_claimed = true OR is_featured = true). Hits Google Places Text Search
// to resolve the place_id from name + city + state, then Place Details to
// pull current rating and user_ratings_total. UPDATEs only `rating`,
// `reviews`, and a `rating_refresh` marker inside `decision_drivers` JSONB.
// Bot-safe: ~250ms throttle between Places calls so we stay under quota.

import { createClient } from '@supabase/supabase-js';

const THROTTLE_MS = 250;

export interface RefreshOptions {
  dryRun?: boolean;
  limit?: number | null;
}

interface ProviderRow {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  country: string | null;
  rating: number | null;
  reviews: string | number | null;
  decision_drivers: Record<string, unknown> | null;
}

export interface UpdatedRow {
  slug: string;
  name: string;
  oldRating: number | null;
  newRating: number | null;
  oldReviews: number | null;
  newReviews: number | null;
  placeId: string | null;
  status: 'updated' | 'dry_run' | 'no_change';
}

export interface FailedRow {
  slug: string;
  name: string;
  reason: string;
}

export interface RefreshResult {
  ok: true;
  dryRun: boolean;
  totalProviders: number;
  totalUpdated: number;
  totalFailed: number;
  updated: UpdatedRow[];
  failed: FailedRow[];
  message?: string;
}

export interface RefreshError {
  ok: false;
  error: string;
  status?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PlacesLookup {
  placeId: string;
  rating: number | null;
  reviewCount: number | null;
}

async function lookupPlacesRating(
  name: string,
  city: string | null,
  state: string | null,
  apiKey: string,
): Promise<PlacesLookup | { error: string }> {
  const queryParts = [name, city, state].filter((s) => s && s.trim().length > 0);
  const query = queryParts.join(' ');
  if (!query) return { error: 'empty query (name + city + state all blank)' };

  // Step 1: Text Search to find place_id.
  const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  searchUrl.searchParams.set('query', query);
  searchUrl.searchParams.set('key', apiKey);

  let searchJson: { status?: string; results?: Array<{ place_id?: string }>; error_message?: string };
  try {
    const res = await fetch(searchUrl.toString(), {
      headers: { 'User-Agent': 'TheDripMap-RefreshRatings/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { error: `Text Search HTTP ${res.status}` };
    searchJson = await res.json();
  } catch (err) {
    return { error: `Text Search fetch failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  const status = searchJson?.status;
  if (status === 'REQUEST_DENIED') {
    return { error: `Text Search REQUEST_DENIED: ${searchJson?.error_message || 'no detail'}` };
  }
  if (status === 'OVER_QUERY_LIMIT') {
    return { error: 'Text Search OVER_QUERY_LIMIT' };
  }
  const results = searchJson?.results || [];
  if (!results.length || status === 'ZERO_RESULTS') {
    return { error: `ZERO_RESULTS for query "${query}"` };
  }
  const placeId = results[0]?.place_id;
  if (!placeId) return { error: 'Top result missing place_id' };

  // Step 2: Place Details.
  const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  detailsUrl.searchParams.set('place_id', placeId);
  detailsUrl.searchParams.set('fields', 'place_id,rating,user_ratings_total');
  detailsUrl.searchParams.set('key', apiKey);

  let detailsJson: {
    status?: string;
    result?: { place_id?: string; rating?: number; user_ratings_total?: number };
    error_message?: string;
  };
  try {
    const res = await fetch(detailsUrl.toString(), {
      headers: { 'User-Agent': 'TheDripMap-RefreshRatings/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { error: `Place Details HTTP ${res.status}` };
    detailsJson = await res.json();
  } catch (err) {
    return { error: `Place Details fetch failed: ${err instanceof Error ? err.message : String(err)}` };
  }
  const dStatus = detailsJson?.status;
  if (dStatus && dStatus !== 'OK') {
    return { error: `Place Details status ${dStatus}: ${detailsJson?.error_message || 'no detail'}` };
  }
  const r = detailsJson?.result || {};
  return {
    placeId: r.place_id || placeId,
    rating: typeof r.rating === 'number' ? r.rating : null,
    reviewCount: typeof r.user_ratings_total === 'number' ? r.user_ratings_total : null,
  };
}

export async function refreshVerifiedRatings(
  opts: RefreshOptions = {},
): Promise<RefreshResult | RefreshError> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      error: 'GOOGLE_PLACES_API_KEY not configured. Set it on Vercel before running this endpoint.',
    };
  }

  const dryRun = opts.dryRun === true;
  const limit = typeof opts.limit === 'number' && opts.limit > 0 ? opts.limit : null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const baseQuery = supabase
    .from('providers')
    .select('id, name, slug, city, state, country, rating, reviews, decision_drivers')
    .or('is_claimed.eq.true,is_featured.eq.true')
    .order('slug', { ascending: true });

  const { data, error } = limit ? await baseQuery.limit(limit) : await baseQuery;
  if (error) {
    return { ok: false, status: 500, error: `Supabase select failed: ${error.message}` };
  }
  const rows = (data || []) as ProviderRow[];
  if (rows.length === 0) {
    return {
      ok: true,
      dryRun,
      totalProviders: 0,
      totalUpdated: 0,
      totalFailed: 0,
      updated: [],
      failed: [],
      message: 'No claimed or featured providers found.',
    };
  }

  const updated: UpdatedRow[] = [];
  const failed: FailedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const p = rows[i];
    const oldRating = typeof p.rating === 'number' ? p.rating : (p.rating == null ? null : Number(p.rating));
    const oldReviews = p.reviews == null ? null : Number(p.reviews);

    const lookup = await lookupPlacesRating(p.name, p.city, p.state, apiKey);

    if ('error' in lookup) {
      failed.push({ slug: p.slug, name: p.name, reason: lookup.error });
    } else {
      const { placeId, rating: newRating, reviewCount: newReviews } = lookup;

      if (dryRun) {
        updated.push({
          slug: p.slug,
          name: p.name,
          oldRating,
          newRating,
          oldReviews,
          newReviews,
          placeId,
          status: 'dry_run',
        });
      } else {
        const nowIso = new Date().toISOString();
        const existingDrivers = (p.decision_drivers && typeof p.decision_drivers === 'object')
          ? p.decision_drivers
          : {};
        const nextDrivers = {
          ...existingDrivers,
          rating_refresh: {
            source: 'google_places',
            place_id: placeId,
            last_refreshed_at: nowIso,
          },
        };

        const updatePayload: Record<string, unknown> = {
          decision_drivers: nextDrivers,
        };
        if (newRating !== null) updatePayload.rating = newRating;
        if (newReviews !== null) updatePayload.reviews = newReviews;

        const { error: updErr } = await supabase
          .from('providers')
          .update(updatePayload)
          .eq('id', p.id);
        if (updErr) {
          failed.push({ slug: p.slug, name: p.name, reason: `Supabase update failed: ${updErr.message}` });
        } else {
          const changed = newRating !== oldRating || newReviews !== oldReviews;
          updated.push({
            slug: p.slug,
            name: p.name,
            oldRating,
            newRating,
            oldReviews,
            newReviews,
            placeId,
            status: changed ? 'updated' : 'no_change',
          });
        }
      }
    }

    if (i < rows.length - 1) await sleep(THROTTLE_MS);
  }

  return {
    ok: true,
    dryRun,
    totalProviders: rows.length,
    totalUpdated: updated.length,
    totalFailed: failed.length,
    updated,
    failed,
  };
}
