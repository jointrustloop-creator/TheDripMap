/**
 * Slow clinic discovery, source-agnostic.
 *
 * One Canadian city per week, a hard weekly cap on upstream API calls, and a
 * diff that NEVER deletes: new clinics are inserted as honest unclaimed
 * listings, closed ones are FLAGGED for operator review, and changed phone or
 * address is updated silently and logged.
 *
 * The source is behind the DiscoverySource interface, so swapping Google Places
 * for Outscraper later means adding one implementation, not rebuilding the diff
 * or the queueing. Everything below the source boundary is shared.
 *
 * Canada only. US listings are never created here while the US market is off.
 */

export interface RawPlace {
  sourceId: string;          // place_id (Places) or the source's stable id
  name: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  lat?: number | null;
  lng?: number | null;
  businessStatus?: string | null;
  rating?: number | null;
  reviews?: number | null;
}

export interface SearchOutcome {
  places: RawPlace[];
  apiCalls: number;
  notes: string[];
}

export interface DiscoverySource {
  readonly name: string;
  /** Search one city. MUST respect maxCalls and report the calls actually made. */
  search(city: string, queries: string[], maxCalls: number): Promise<SearchOutcome>;
}

/** The weekly rotation. Index by ISO week so the cron is stateless. */
export const DISCOVERY_CITIES = [
  'Toronto',
  'Mississauga',
  'Vaughan',
  'Brampton',
  'Vancouver',
  'Calgary',
  'Ottawa',
  'Edmonton',
  'Montreal',
  // smaller cities, then the cycle repeats
  'Hamilton',
  'London',
  'Kitchener',
  'Halifax',
  'Victoria',
  'Winnipeg',
  // 2026-08-30 expansion. The rotation used to hold 15 cities visited one per
  // WEEK, so a given city came round every 15 weeks and the whole engine added
  // a couple of clinics a month. With outreach fuel exhausted (every CA clinic
  // holding an email has been contacted), discovery IS the growth ceiling, so
  // the list covers the rest of the country's real IV markets.
  'Burnaby',
  'Surrey',
  'Richmond',
  'Markham',
  'Richmond Hill',
  'Oakville',
  'Burlington',
  'Guelph',
  'Windsor',
  'Barrie',
  'Oshawa',
  'Kelowna',
  'Saskatoon',
  'Regina',
  'Quebec City',
  'Laval',
  'Gatineau',
  'St. Catharines',
  'Waterloo',
  'Cambridge',
  'Sudbury',
  'Kingston',
  'Abbotsford',
  'Red Deer',
  'Lethbridge',
  'Kamloops',
  'Nanaimo',
  'Moncton',
  'Fredericton',
  "St. John's",
  'Whitby',
  'Ajax',
  'Pickering',
  'Milton',
  'Newmarket',
];

export const DISCOVERY_QUERIES = (city: string) => [
  `IV therapy ${city}`,
  `IV drips ${city}`,
  `vitamin infusion ${city}`,
];

/** ISO week number, so the rotation advances without storing a cursor. */
export function isoWeek(d = new Date()): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function cityForWeek(d = new Date()): string {
  return DISCOVERY_CITIES[isoWeek(d) % DISCOVERY_CITIES.length];
}

/** Day index since epoch, so a DAILY rotation advances without a stored cursor. */
export function dayIndex(d = new Date()): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000);
}

/**
 * The cities to sweep on one daily run. Consecutive days take consecutive
 * slices, so the whole list is covered every ceil(len / n) days instead of
 * once every len WEEKS. With 51 cities at 3 per day that is a full national
 * pass every 17 days, against 51 weeks under the old weekly single-city
 * rotation.
 */
export function citiesForRun(n = 3, d = new Date()): string[] {
  const out: string[] = [];
  const start = (dayIndex(d) * n) % DISCOVERY_CITIES.length;
  for (let i = 0; i < Math.min(n, DISCOVERY_CITIES.length); i++) {
    out.push(DISCOVERY_CITIES[(start + i) % DISCOVERY_CITIES.length]);
  }
  return out;
}

// ---------------------------------------------------------------- diff ------

export interface ExistingLite {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  place_id?: string | null;
  business_status?: string | null;
}

export interface DiffResult {
  isNew: RawPlace[];
  /** existing row + the fields that changed */
  updates: { id: string; place: RawPlace; changes: Record<string, string | null> }[];
  /** existing rows the source now reports as closed */
  closed: { id: string; name: string; status: string }[];
}

const norm = (s: string | null | undefined) =>
  (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Loose token overlap. Used only as the fallback when place_id is absent. */
export function fuzzyMatch(aName: string, aAddr: string | null | undefined, b: ExistingLite): boolean {
  const an = norm(aName), bn = norm(b.name);
  if (!an || !bn) return false;
  if (an === bn) return true;
  const at = new Set(an.split(' ').filter((w) => w.length > 2));
  const bt = new Set(bn.split(' ').filter((w) => w.length > 2));
  if (!at.size || !bt.size) return false;
  let shared = 0;
  at.forEach((w) => { if (bt.has(w)) shared++; });
  const nameOverlap = shared / Math.min(at.size, bt.size);
  if (nameOverlap < 0.6) return false;
  // Names alone are ambiguous for chains, so require a street-number agreement
  // when both sides carry an address.
  const aNum = (aAddr || '').match(/\d+/)?.[0];
  const bNum = (b.address || '').match(/\d+/)?.[0];
  if (aNum && bNum) return aNum === bNum;
  return nameOverlap >= 0.8;
}

const CLOSED = /CLOSED_PERMANENTLY|CLOSED_TEMPORARILY/i;

export function diffPlaces(found: RawPlace[], existing: ExistingLite[]): DiffResult {
  const byPlaceId = new Map<string, ExistingLite>();
  for (const e of existing) if (e.place_id) byPlaceId.set(e.place_id, e);

  const out: DiffResult = { isNew: [], updates: [], closed: [] };

  for (const p of found) {
    // 1. place_id is exact and stable, so it wins.
    let match = p.sourceId ? byPlaceId.get(p.sourceId) : undefined;
    // 2. fall back to name + address fuzzy match for rows predating place_id.
    if (!match) match = existing.find((e) => !e.place_id && fuzzyMatch(p.name, p.address, e));

    if (!match) {
      out.isNew.push(p);
      continue;
    }

    if (p.businessStatus && CLOSED.test(p.businessStatus)) {
      out.closed.push({ id: match.id, name: match.name, status: p.businessStatus });
      continue; // flag only; never edit or delete a closed listing automatically
    }

    const changes: Record<string, string | null> = {};
    if (p.phone && norm(p.phone) !== norm(match.phone)) changes.phone = p.phone;
    if (p.address && norm(p.address) !== norm(match.address)) changes.address = p.address;
    if (p.sourceId && !match.place_id) changes.place_id = p.sourceId; // backfill the key
    if (Object.keys(changes).length) out.updates.push({ id: match.id, place: p, changes });
  }

  return out;
}

/**
 * Honest listing copy for a newly discovered clinic. Makes ZERO claims about
 * staffing, safety, or environment: everything here is public directory data.
 * Matches the unclaimed-template rule from the 2026-07 trust remediation.
 */
export function honestDescription(name: string, city: string): string {
  return `${name} is an IV therapy provider listed in ${city}. This listing is compiled from public information and has not been claimed or verified. Contact the clinic directly to confirm services, credentials, and pricing.`;
}
