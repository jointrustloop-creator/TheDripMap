/**
 * analytics-query.ts
 *
 * Typed helpers for reading public.listing_events. Encapsulates the actual
 * column names (event_type, provider_id, created_at, referrer) so callers
 * can't accidentally write `.eq('event', ...)` — a real footgun caught
 * 2026-06-06 in a snapshot script that silently returned null instead of
 * counts.
 *
 * Rules every consumer should follow:
 *   1. Never query listing_events with raw .from('listing_events') in app
 *      code. Use these helpers so the column names live in one place.
 *   2. Pass EventType values (the union below), not bare strings.
 *   3. Treat null returns as zero, not as "broken" — a transient PostgREST
 *      hiccup or RLS edge case should not break the dashboard.
 *
 * Server-only. Uses SUPABASE_SERVICE_ROLE_KEY because listing_events has
 * RLS that denies anon + authenticated reads.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Single source of truth for event types -------------------------------

export const EVENT_TYPES = [
  'view',
  'book_click',
  'call_click',
  'website_click',
  'directions_click',
  'message_click',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type EventCountsByType = Record<EventType, number>;

export interface ListingEventRow {
  id: string;
  provider_id: string;
  event_type: EventType;
  created_at: string;
  referrer: string | null;
}

export interface PerProviderCounts {
  provider_id: string;
  counts: EventCountsByType;
  total: number;
}

// --- Client management ----------------------------------------------------

function defaultClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function zeroCounts(): EventCountsByType {
  return {
    view: 0,
    book_click: 0,
    call_click: 0,
    website_click: 0,
    directions_click: 0,
    message_click: 0,
  };
}

// --- Read helpers ---------------------------------------------------------

/**
 * Count events matching the given filters. Returns 0 on missing client or
 * query error. NEVER throws — analytics reads are best-effort.
 */
export async function countEvents(opts: {
  eventType?: EventType;
  sinceIso?: string;
  untilIso?: string;
  providerId?: string;
  client?: SupabaseClient;
}): Promise<number> {
  const sb = opts.client ?? defaultClient();
  if (!sb) return 0;

  let q = sb.from('listing_events').select('id', { count: 'exact', head: true });
  if (opts.eventType) q = q.eq('event_type', opts.eventType);
  if (opts.sinceIso) q = q.gte('created_at', opts.sinceIso);
  if (opts.untilIso) q = q.lte('created_at', opts.untilIso);
  if (opts.providerId) q = q.eq('provider_id', opts.providerId);

  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

/**
 * Return a {view, book_click, call_click, ...} count map, optionally
 * scoped to a time window and/or a single provider. Always returns all
 * six keys (zero-filled) so callers don't have to handle undefined.
 */
export async function countEventsByType(opts: {
  sinceIso?: string;
  untilIso?: string;
  providerId?: string;
  client?: SupabaseClient;
} = {}): Promise<EventCountsByType> {
  const sb = opts.client ?? defaultClient();
  const out = zeroCounts();
  if (!sb) return out;

  let q = sb.from('listing_events').select('event_type');
  if (opts.sinceIso) q = q.gte('created_at', opts.sinceIso);
  if (opts.untilIso) q = q.lte('created_at', opts.untilIso);
  if (opts.providerId) q = q.eq('provider_id', opts.providerId);

  const { data, error } = await q;
  if (error || !data) return out;

  for (const row of data as Array<{ event_type: string }>) {
    if (isEventType(row.event_type)) out[row.event_type]++;
  }
  return out;
}

/**
 * Fetch the most recent N events. Useful for spot-checks and the admin
 * activity feed. Cap is enforced at 200 so a careless caller can't pull
 * tens of thousands of rows into memory.
 */
export async function getRecentEvents(opts: {
  limit?: number;
  eventType?: EventType;
  client?: SupabaseClient;
} = {}): Promise<ListingEventRow[]> {
  const sb = opts.client ?? defaultClient();
  if (!sb) return [];
  const limit = Math.min(Math.max(1, opts.limit ?? 50), 200);

  let q = sb
    .from('listing_events')
    .select('id, provider_id, event_type, created_at, referrer')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (opts.eventType) q = q.eq('event_type', opts.eventType);

  const { data, error } = await q;
  if (error || !data) return [];
  return data as ListingEventRow[];
}

/**
 * Aggregate counts per provider over an optional window. Useful for
 * "top clinics by clicks" lists. Pagination handled internally; capped
 * at 5,000 source rows to bound memory.
 */
export async function getPerProviderCounts(opts: {
  sinceIso?: string;
  untilIso?: string;
  client?: SupabaseClient;
} = {}): Promise<PerProviderCounts[]> {
  const sb = opts.client ?? defaultClient();
  if (!sb) return [];

  const collected: Array<{ provider_id: string; event_type: string }> = [];
  let from = 0;
  const pageSize = 1000;
  const hardCap = 5000;
  while (collected.length < hardCap) {
    let q = sb
      .from('listing_events')
      .select('provider_id, event_type')
      .range(from, from + pageSize - 1);
    if (opts.sinceIso) q = q.gte('created_at', opts.sinceIso);
    if (opts.untilIso) q = q.lte('created_at', opts.untilIso);
    const { data, error } = await q;
    if (error || !data || data.length === 0) break;
    collected.push(...(data as Array<{ provider_id: string; event_type: string }>));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const byProvider = new Map<string, EventCountsByType>();
  for (const row of collected) {
    if (!byProvider.has(row.provider_id)) byProvider.set(row.provider_id, zeroCounts());
    const counts = byProvider.get(row.provider_id)!;
    if (isEventType(row.event_type)) counts[row.event_type]++;
  }
  return Array.from(byProvider.entries()).map(([provider_id, counts]) => ({
    provider_id,
    counts,
    total: EVENT_TYPES.reduce((sum, t) => sum + counts[t], 0),
  }));
}

// --- Internal -------------------------------------------------------------

function isEventType(s: string): s is EventType {
  return (EVENT_TYPES as readonly string[]).includes(s);
}
