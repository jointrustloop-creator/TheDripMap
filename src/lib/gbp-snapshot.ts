/**
 * GBP snapshot + gap scoring lib.
 *
 * Pulls a clinic's current Google Business Profile data via Places (Place
 * Details + Find Place fallback when no place_id is stored), computes the
 * 4 gap flags from the 2026-06-09 operator spec, and appends a row to
 * gbp_snapshots. Never overwrites prior rows; the first row per clinic is
 * the "before" baseline we compare against later.
 *
 * COST AWARENESS:
 *   - We request only the fields we need (no formatted_address bloat).
 *   - When place_id is already stored on providers.decision_drivers.place_id,
 *     we skip the Find Place step (saves one call).
 *   - The caller is expected to throttle / batch.
 *
 * GUARDRAILS (per spec):
 *   - Real data only. If Places does not return a field, store null.
 *   - Never invent values.
 *   - This module reads + writes data. It never contacts a clinic, never
 *     modifies a Google profile, never publishes anything.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tunable thresholds (per spec, "make them easy to tune").
export const THRESHOLD_REVIEWS = 25;
export const THRESHOLD_PHOTOS = 5;

// IV-specific Google Business Profile primary categories. Anything in this
// list passes the category check. Source: Google's category taxonomy.
// "IV therapy service" was added 2024-10-24. Add new IV-specific category
// strings here if Google ships more later.
export const IV_CATEGORIES = new Set<string>([
  'iv therapy service',
  // Future-proofing: any of these would qualify if Google later ships them
  // in their Place Details type strings.
  'iv hydration',
  'intravenous therapy service',
]);

// Google Place type strings that count as "generic / wrong" for an IV
// clinic. Used to flag category_gap when the primary_type is one of these
// and NOT also IV-specific. Sourced from Google's Place types reference.
export const GENERIC_TYPES = new Set<string>([
  'doctor',
  'medical_clinic',
  'spa',
  'beauty_salon',
  'wellness_center',
  'hospital',
  'health',
  'establishment',
  'point_of_interest',
  // Naturopath-as-primary is fine for an ND-led clinic, do NOT flag it.
]);

interface PlacesPhoto {
  photo_reference?: string;
  height?: number;
  width?: number;
}
interface PlacesDetail {
  place_id?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  photos?: PlacesPhoto[];
  website?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  opening_hours?: { periods?: unknown[]; weekday_text?: string[] };
}

export interface GapResult {
  primary_type: string | null;
  types: string[];
  rating: number | null;
  review_count: number | null;
  photo_count: number | null;
  has_website: boolean;
  has_phone: boolean;
  has_hours: boolean;
  category_gap: boolean;
  reviews_gap: boolean;
  photos_gap: boolean;
  completeness_gap: boolean;
  gap_score: number;
  tier: 'high' | 'medium' | 'low';
  gap_list: string[];
}

export function computeGaps(d: PlacesDetail | null): GapResult {
  const types = d?.types || [];
  const primary_type = types[0] || null;
  const rating = d?.rating ?? null;
  const review_count = d?.user_ratings_total ?? null;
  const photo_count = d?.photos?.length ?? null;
  const has_website = !!d?.website;
  const has_phone = !!(d?.formatted_phone_number || d?.international_phone_number);
  const has_hours = !!(d?.opening_hours?.periods && d.opening_hours.periods.length > 0);

  // category_gap: primary type is generic AND none of the types are IV-specific.
  const lowerTypes = types.map((t) => (t || '').toLowerCase());
  const anyIvType = lowerTypes.some((t) => IV_CATEGORIES.has(t));
  const primaryIsGeneric = !!primary_type && GENERIC_TYPES.has(primary_type.toLowerCase());
  const category_gap = primaryIsGeneric && !anyIvType;

  const reviews_gap = (review_count ?? 0) < THRESHOLD_REVIEWS;
  const photos_gap = (photo_count ?? 0) < THRESHOLD_PHOTOS;
  const completeness_gap = !has_website || !has_phone || !has_hours;

  const flags: { name: string; value: boolean }[] = [
    { name: 'category', value: category_gap },
    { name: 'reviews', value: reviews_gap },
    { name: 'photos', value: photos_gap },
    { name: 'completeness', value: completeness_gap },
  ];
  const gap_list = flags.filter((f) => f.value).map((f) => f.name);
  const gap_score = gap_list.length;
  const tier: 'high' | 'medium' | 'low' = gap_score >= 3 ? 'high' : gap_score >= 1 ? 'medium' : 'low';

  return {
    primary_type,
    types,
    rating,
    review_count,
    photo_count,
    has_website,
    has_phone,
    has_hours,
    category_gap,
    reviews_gap,
    photos_gap,
    completeness_gap,
    gap_score,
    tier,
    gap_list,
  };
}

// === Places API helpers (cost-aware) ===
const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

// Fields we actually need. Smaller fields list = lower cost per Place Details call.
// place_id is free in find-place but useful to confirm.
const DETAIL_FIELDS = [
  'place_id',
  'types',
  'rating',
  'user_ratings_total',
  'photo',
  'website',
  'formatted_phone_number',
  'international_phone_number',
  'opening_hours/periods',
  'opening_hours/weekday_text',
].join(',');

interface FetchOutcome {
  detail: PlacesDetail | null;
  place_id: string | null;
  callsUsed: number;
}

export async function fetchPlaceDetailForClinic(args: {
  apiKey: string;
  storedPlaceId?: string | null;
  name: string;
  city?: string | null;
  state?: string | null;
}): Promise<FetchOutcome> {
  let callsUsed = 0;
  let pid = args.storedPlaceId || null;

  // 1. Find Place from Text only when we have no stored place_id.
  if (!pid) {
    const q = [args.name, args.city, args.state].filter(Boolean).join(' ');
    if (!q) return { detail: null, place_id: null, callsUsed };
    const findUrl = `${PLACES_BASE}/findplacefromtext/json?input=${encodeURIComponent(q)}&inputtype=textquery&fields=place_id&key=${args.apiKey}`;
    const fr = await fetch(findUrl);
    callsUsed++;
    if (fr.ok) {
      const fj = await fr.json();
      pid = fj?.candidates?.[0]?.place_id || null;
    }
  }
  if (!pid) return { detail: null, place_id: null, callsUsed };

  // 2. Place Details with the minimal field list.
  const detailUrl = `${PLACES_BASE}/details/json?place_id=${pid}&fields=${DETAIL_FIELDS}&key=${args.apiKey}`;
  const dr = await fetch(detailUrl);
  callsUsed++;
  if (!dr.ok) return { detail: null, place_id: pid, callsUsed };
  const dj = await dr.json();
  return { detail: dj?.result || null, place_id: pid, callsUsed };
}

// === Storage ===
export interface SnapshotInsert extends GapResult {
  clinic_id: string;
  place_id: string | null;
  places_call_count: number;
}

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function insertSnapshot(row: SnapshotInsert): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('gbp_snapshots')
    .insert({
      clinic_id: row.clinic_id,
      place_id: row.place_id,
      primary_type: row.primary_type,
      types: row.types,
      rating: row.rating,
      review_count: row.review_count,
      photo_count: row.photo_count,
      has_website: row.has_website,
      has_phone: row.has_phone,
      has_hours: row.has_hours,
      category_gap: row.category_gap,
      reviews_gap: row.reviews_gap,
      photos_gap: row.photos_gap,
      completeness_gap: row.completeness_gap,
      gap_score: row.gap_score,
      tier: row.tier,
      gap_list: row.gap_list,
      places_call_count: row.places_call_count,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

// === Convenience: snapshot one clinic end-to-end ===
export async function snapshotOneClinic(args: {
  clinicId: string;
  name: string;
  city: string | null;
  state: string | null;
  storedPlaceId?: string | null;
}): Promise<{ ok: true; gaps: GapResult; place_id: string | null; callsUsed: number } | { ok: false; error: string; callsUsed: number }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return { ok: false, error: 'GOOGLE_PLACES_API_KEY not configured', callsUsed: 0 };

  const { detail, place_id, callsUsed } = await fetchPlaceDetailForClinic({
    apiKey,
    storedPlaceId: args.storedPlaceId,
    name: args.name,
    city: args.city,
    state: args.state,
  });
  const gaps = computeGaps(detail);
  const result = await insertSnapshot({
    clinic_id: args.clinicId,
    place_id,
    places_call_count: callsUsed,
    ...gaps,
  });
  if ('error' in result && result.error) return { ok: false, error: result.error, callsUsed };
  return { ok: true, gaps, place_id, callsUsed };
}
