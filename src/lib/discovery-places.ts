/**
 * Google Places implementation of DiscoverySource.
 *
 * Uses the legacy Places endpoints already used elsewhere in this codebase
 * (places-enrich, places-refresh) so behaviour and quota accounting match.
 *
 * Quota discipline: EVERY upstream request increments a counter, and the caller
 * passes a hard budget the source will not exceed. We have had silent quota
 * fires before, so the count is returned and logged rather than estimated.
 */
import type { DiscoverySource, RawPlace, SearchOutcome } from './discovery';

const TEXT_SEARCH = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const DETAILS = 'https://maps.googleapis.com/maps/api/place/details/json';

interface PlacesResult {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry?: { location?: { lat?: number; lng?: number } };
}

export class PlacesSource implements DiscoverySource {
  readonly name = 'google_places';
  private key: string;
  constructor(key: string) { this.key = key; }

  async search(city: string, queries: string[], maxCalls: number): Promise<SearchOutcome> {
    const places: RawPlace[] = [];
    const notes: string[] = [];
    const seen = new Set<string>();
    let apiCalls = 0;

    for (const q of queries) {
      if (apiCalls >= maxCalls) { notes.push(`budget reached before "${q}"`); break; }
      let pageToken: string | undefined;
      // Up to 3 pages per query (Places caps at 60 results / 3 pages).
      for (let page = 0; page < 3; page++) {
        if (apiCalls >= maxCalls) { notes.push('budget reached mid-pagination'); break; }
        const url = new URL(TEXT_SEARCH);
        if (pageToken) url.searchParams.set('pagetoken', pageToken);
        else { url.searchParams.set('query', q); url.searchParams.set('region', 'ca'); }
        url.searchParams.set('key', this.key);

        let json: { results?: PlacesResult[]; next_page_token?: string; status?: string; error_message?: string } | null = null;
        try {
          const r = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
          apiCalls++;
          json = await r.json();
        } catch (e) {
          apiCalls++;
          notes.push(`fetch failed for "${q}" page ${page}: ${e instanceof Error ? e.message : 'unknown'}`);
          break;
        }
        if (!json || (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS')) {
          notes.push(`Places status ${json?.status}${json?.error_message ? ': ' + json.error_message : ''}`);
          break;
        }
        for (const r of json.results || []) {
          if (!r.place_id || seen.has(r.place_id)) continue;
          seen.add(r.place_id);
          places.push({
            sourceId: r.place_id,
            name: (r.name || '').trim(),
            address: r.formatted_address || null,
            lat: r.geometry?.location?.lat ?? null,
            lng: r.geometry?.location?.lng ?? null,
            businessStatus: r.business_status || null,
            rating: typeof r.rating === 'number' ? r.rating : null,
            reviews: typeof r.user_ratings_total === 'number' ? r.user_ratings_total : null,
          });
        }
        pageToken = json.next_page_token;
        if (!pageToken) break;
        // Places requires a short delay before a page token becomes valid.
        await new Promise((res) => setTimeout(res, 2000));
      }
    }

    return { places, apiCalls, notes };
  }

  /** Phone + website for one place. One API call. Caller budgets these. */
  async details(sourceId: string): Promise<{ phone: string | null; website: string | null }> {
    const url = new URL(DETAILS);
    url.searchParams.set('place_id', sourceId);
    url.searchParams.set('fields', 'formatted_phone_number,website');
    url.searchParams.set('key', this.key);
    try {
      const r = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
      const j = await r.json();
      return {
        phone: j?.result?.formatted_phone_number || null,
        website: j?.result?.website || null,
      };
    } catch {
      return { phone: null, website: null };
    }
  }
}
