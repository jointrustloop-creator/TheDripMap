/**
 * deals.ts
 *
 * SINGLE source of truth for "live deals" (slow-time offers) everywhere they
 * render: the /deals hub, city-page deal modules, and the provider listing.
 *
 * DATA SHAPE: deals live on providers.special_offers (jsonb array), written
 * only by /api/finish-listing (the claimed owner's "slow-time offer" step) and
 * toggled by /api/offer-toggle. Shape per entry:
 *   { title: string, description: string, code?: string,
 *     expires?: 'YYYY-MM-DD', active?: boolean }
 *
 * A deal is LIVE when: the provider is not hidden and has a slug, the offer
 * has a non-empty title, active !== false, the expiry (if any) is today or
 * later, AND the text passes the compliance gate below. Nothing is ever
 * fabricated here: no data, no deals rendered.
 *
 * COMPLIANCE GATE: offer text is owner-written free text. The write path
 * (finish-listing's scrub()) already rewrites obvious claim verbs, but rows
 * written before that guard, or via any other path, must still never render a
 * health or outcome claim. This gate is the render-side backstop: a deal whose
 * text reads as a treatment-outcome claim is silently dropped everywhere.
 * Conservative by design: a real discount blocked is a minor loss, a health
 * claim published is not.
 */
import { cache } from 'react';
import { getAllListings } from './data';
import { isSafetyVerified } from './safety';

export interface DealOffer {
  title: string;
  description?: string;
  code?: string;
  expires?: string; // YYYY-MM-DD
  active?: boolean;
}

export interface LiveDeal {
  providerId: string | null;
  name: string;
  slug: string;
  city: string;
  state: string | null;
  safetyVerified: boolean;
  offer: DealOffer;
}

// Treatment-outcome and health-claim language that must never appear in a
// rendered deal. Word-boundary matched, case-insensitive. "treat yourself" is
// ordinary retail phrasing and is explicitly allowed; every other "treats/
// treatment of" form is a claim. Kept conservative and easy to extend.
const CLAIM_PATTERN = new RegExp(
  [
    'cure[sd]?',
    'heal(s|ed|ing)?',
    'reverse[sd]?\\s+(aging|disease|illness)',
    'treats?\\b(?!\\s+yourself)',
    'treatment\\s+(of|for)',
    'prevents?\\b',
    'prevention\\s+of',
    'fix(es|ed)?\\s+(your|my|any)',
    'detox(es|ed|ify|ifies|ification)?',
    'cleanse[sd]?',
    'flush(es|ing)?\\s+(out\\s+)?toxins?',
    'removes?\\s+toxins?',
    'guaranteed?\\s+(results?|relief|recovery|weight\\s+loss)',
    'clinically\\s+proven',
    'eliminates?\\s+(illness|disease|symptoms?)',
    '(melts?|burns?)\\s+fat',
    'kills?\\s+(viruses|bacteria|germs)',
    'anti[\\s-]?viral',
    'cancer',
    'covid',
    'diabetes',
    'immunity\\s+(boost(ed|s)?|guarantee)',
  ].join('|'),
  'i'
);

/** True when the offer's visible text is free of health/outcome claims. */
export function dealTextIsCompliant(offer: DealOffer | null | undefined): boolean {
  if (!offer) return false;
  const text = [offer.title, offer.description].filter(Boolean).join(' ');
  if (!text.trim()) return false;
  return !CLAIM_PATTERN.test(text);
}

/** Today's date as YYYY-MM-DD (string compare works for ISO dates). */
export function dealTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The first offer on a provider row that is live AND compliant, or null.
 * Tolerant of any malformed shape: bad data yields null, never a throw.
 */
export function pickLiveOffer(
  p: { special_offers?: unknown } | null | undefined,
  todayIso: string = dealTodayIso()
): DealOffer | null {
  try {
    const raw = p?.special_offers;
    if (!Array.isArray(raw)) return null;
    for (const o of raw as DealOffer[]) {
      if (!o || typeof o !== 'object') continue;
      if (typeof o.title !== 'string' || !o.title.trim()) continue;
      if (o.active === false) continue;
      if (o.expires && o.expires < todayIso) continue;
      if (!dealTextIsCompliant(o)) continue;
      return o;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * ALL live, compliant offers on a provider row (for the listing page, which
 * stacks multiple offers). Same predicate as pickLiveOffer, unfiltered count.
 */
export function liveOffersForProvider(
  p: { special_offers?: unknown } | null | undefined,
  todayIso: string = dealTodayIso()
): DealOffer[] {
  try {
    const raw = p?.special_offers;
    if (!Array.isArray(raw)) return [];
    return (raw as DealOffer[]).filter(
      (o) =>
        o &&
        typeof o === 'object' &&
        typeof o.title === 'string' &&
        o.title.trim() !== '' &&
        o.active !== false &&
        (!o.expires || o.expires >= todayIso) &&
        dealTextIsCompliant(o)
    );
  } catch {
    return [];
  }
}

type Providerish = {
  id?: string;
  name?: string;
  slug?: string;
  city?: string;
  state?: string | null;
  is_hidden?: boolean;
  safety_verified?: boolean | null;
  safety_review_status?: string | null;
  decision_drivers?: { safety_review_expires_at?: string | null } | null;
  special_offers?: unknown;
};

/** One provider row -> LiveDeal or null. Pure and throw-safe. */
export function liveDealFromProvider(p: Providerish | null | undefined, todayIso?: string): LiveDeal | null {
  try {
    if (!p || p.is_hidden || !p.slug || !p.name) return null;
    const offer = pickLiveOffer(p, todayIso);
    if (!offer) return null;
    return {
      providerId: p.id || null,
      name: p.name,
      slug: p.slug,
      city: p.city || '',
      state: p.state || null,
      safetyVerified: isSafetyVerified(p),
      offer,
    };
  } catch {
    return null;
  }
}

/**
 * Live deals from an already-fetched listing pool (city pages reuse their own
 * fetch, zero extra queries). Order of the input pool is preserved, which
 * already ranks claimed/featured first everywhere this is used.
 */
export function liveDealsFromListings(listings: unknown[], todayIso: string = dealTodayIso()): LiveDeal[] {
  if (!Array.isArray(listings)) return [];
  const out: LiveDeal[] = [];
  for (const p of listings as Providerish[]) {
    const d = liveDealFromProvider(p, todayIso);
    if (d) out.push(d);
  }
  return out;
}

/**
 * Every live deal on the platform. Tolerant: a data error returns [] so no
 * consumer (page metadata, sitemap, module) can break on a Supabase hiccup.
 * Wrapped in React cache() so the /deals page's generateMetadata + render and
 * the sitemap share one fetch per request.
 */
export const getLiveDeals = cache(async (): Promise<LiveDeal[]> => {
  try {
    const all = await getAllListings();
    return liveDealsFromListings(all as unknown[]);
  } catch {
    return [];
  }
});
