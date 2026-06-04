/**
 * POST /api/admin/refresh-verified-ratings
 *
 * Refreshes Google rating + review count for every VERIFIED/claimed clinic
 * (is_claimed = true OR is_featured = true). Hits Google Places Text Search
 * to resolve the place_id from name + city + state, then Place Details to
 * pull current rating and user_ratings_total. UPDATEs only `rating` and
 * `reviews` on the provider row, plus a last_refreshed_at timestamp written
 * into the existing `decision_drivers` JSONB column (the providers table
 * has no dedicated last_refreshed_at column).
 *
 * Auth: admin cookie OR Authorization: Bearer $CRON_SECRET (matches the
 * pattern used in app/api/admin/regenerate-outreach/route.ts).
 *
 * Body (optional JSON):
 *   { dry_run?: boolean, limit?: number }
 *   - dry_run: when true, fetches Places data but does NOT write to DB
 *   - limit: cap on number of providers processed (default no cap)
 *
 * Returns:
 *   { updated: [...], failed: [...], totalUpdated: N, dryRun: bool, ... }
 *
 * Idempotent: re-runs simply refresh. Bot-safe: ~250ms throttle between
 * Places calls so we stay under quota.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';

export const maxDuration = 300;

const THROTTLE_MS = 250;

interface RefreshRequest {
  dry_run?: boolean;
  limit?: number;
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

interface UpdatedRow {
  slug: string;
  name: string;
  oldRating: number | null;
  newRating: number | null;
  oldReviews: number | null;
  newReviews: number | null;
  placeId: string | null;
  status: 'updated' | 'dry_run' | 'no_change';
}

interface FailedRow {
  slug: string;
  name: string;
  reason: string;
}

async function isAuthorized(req: Request): Promise<boolean> {
  if (await isAdminRequest()) return true;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${expected}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PlacesLookup {
  placeId: string;
  rating: number | null;
  reviewCount: number | null;
}

/**
 * Resolve place_id via Text Search, then fetch rating + user_ratings_total
 * via Place Details. Returns null on any failure (caller logs the reason).
 * Throws only when the API key is missing (caller should bail loudly).
 */
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

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'GOOGLE_PLACES_API_KEY not configured. Set it on Vercel before running this endpoint.',
      },
      { status: 500 },
    );
  }

  let body: RefreshRequest = {};
  try {
    const raw = await req.text();
    if (raw && raw.trim().length > 0) {
      body = JSON.parse(raw) as RefreshRequest;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const dryRun = body.dry_run === true;
  const limit = typeof body.limit === 'number' && body.limit > 0 ? body.limit : null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Pull every claimed OR featured provider. Both flags catch the verified pool.
  const query = supabase
    .from('providers')
    .select('id, name, slug, city, state, country, rating, reviews, decision_drivers')
    .or('is_claimed.eq.true,is_featured.eq.true')
    .order('slug', { ascending: true });

  const { data, error } = limit ? await query.limit(limit) : await query;
  if (error) {
    return NextResponse.json({ error: `Supabase select failed: ${error.message}` }, { status: 500 });
  }
  const rows = (data || []) as ProviderRow[];
  if (rows.length === 0) {
    return NextResponse.json({
      ok: true,
      message: 'No claimed or featured providers found.',
      totalUpdated: 0,
      updated: [],
      failed: [],
    });
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
        // Build update payload. Only touch rating, reviews, and the
        // last_refreshed_at marker inside decision_drivers JSONB. Leave
        // every other column alone.
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

    // Throttle so we never punch through Google's quota at scale.
    if (i < rows.length - 1) await sleep(THROTTLE_MS);
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    totalProviders: rows.length,
    totalUpdated: updated.length,
    totalFailed: failed.length,
    updated,
    failed,
  });
}
