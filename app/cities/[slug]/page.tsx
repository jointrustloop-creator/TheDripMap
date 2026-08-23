import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { MapPin, ArrowRight, Gift } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
// GFM is REQUIRED here: bespoke city copy contains pipe tables (the 2026 price
// bands on /cities/toronto). Without this plugin ReactMarkdown does not parse
// GFM tables and the markdown rendered as literal "| Treatment | Price |" text
// on the highest-value section of the page. Found in the 2026-08 SERP teardown.
import remarkGfm from 'remark-gfm';
import { Navbar } from '@/src/components/Navbar';
import { Footer } from '@/src/components/Footer';
import { BreadcrumbNav } from '@/src/components/BreadcrumbNav';
import { QuizCTA } from '@/src/components/QuizCTA';
import { ListingController } from '@/src/components/ListingController';
import { slimProviderForList } from '@/src/lib/clinic-display';
import { ProviderCard } from '@/src/components/ProviderCard';
import { getCityBySlug, getListingsByCity, getAllCities, getListingsByState, getFeaturedListings, getBlogPostBySlug, slugify, getTorontoGtaTieredListings } from '@/src/lib/data';
import { marketOf } from '@/src/lib/market';
import { isSafetyVerified } from '@/src/lib/safety';
import { liveDealsFromListings, type LiveDeal } from '@/src/lib/deals';
import DealCard from '@/src/components/DealCard';
import { RelatedGuides } from '@/src/components/RelatedGuides';
import { SupabaseUnreachableError } from '@/src/lib/supabase-health';
import { TemporarilyUnavailable } from '@/src/components/TemporarilyUnavailable';
import { getCityIntro } from '@/src/lib/city-intros';
import { getCityMeta, filterByUseCase } from '@/src/lib/city-meta';
import { getCityPriceIndex } from '@/src/lib/price-index-data';
import { normalizeCountry, isNoindexedUSPage } from '@/src/lib/market';
import { MapTrigger } from '@/src/components/MapTrigger';
import { FAQSection } from '@/src/components/FAQSection';
import { NearbyCities } from '@/src/components/NearbyCities';
import { ShieldCheck, BookOpen } from 'lucide-react';

// Revalidate every 5 min: balances freshness against the cost of a Supabase
// outage caching a notFound() state. Bumped from 60 → 300 on 2026-05-31
// alongside the SupabaseUnreachableError fallback so a 22-min postgrest
// outage (like the one that night) can't pin every city page at 404.
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Don't crash during build if env vars are missing or placeholders
  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    console.warn('Skipping generateStaticParams: Supabase keys missing or invalid');
    return [];
  }

  try {
    const supabase = createClient(url, key);
    const { data } = await supabase
      .from('cities')
      .select('slug')
      .not('slug', 'is', null);

    return (data || []).map((city) => ({
      slug: String(city.slug),
    }));
  } catch (err) {
    console.error('Error in generateStaticParams during build:', err);
    return [];
  }
}

interface CityPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Cross-border same-name guard. When no state constrains the query, a city
// name that exists in more than one region returns a mixed set (Bedford NS +
// Bedford TX + Bedford MA rendered as one "Bedford, Nova Scotia | 5 Clinics"
// page in the 2026-07-08 audit). Keep only the modal state's listings so the
// count, title, and cards all describe ONE real-world city. No-op when a
// state was already applied to the query or all listings share one state.
function constrainToModalState<T extends { state?: string }>(listings: T[], appliedState: string): T[] {
  if (appliedState || listings.length === 0) return listings;
  const tally = new Map<string, number>();
  for (const l of listings) {
    const st = (l.state || '').trim();
    tally.set(st, (tally.get(st) || 0) + 1);
  }
  if (tally.size <= 1) return listings;
  let best = '';
  let bestN = 0;
  for (const [k, n] of tally) {
    if (n > bestN) { best = k; bestN = n; }
  }
  return listings.filter((l) => ((l.state || '').trim()) === best);
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const safeSlug = slug || 'unknown';
  const fallbackName = safeSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const fallbackCanonical = `https://www.thedripmap.com/cities/${safeSlug}`;

  let cityData;
  try {
    cityData = await getCityBySlug(slug);
  } catch (err) {
    if (err instanceof SupabaseUnreachableError) {
      // Soft fallback: keep the page indexable with a generic title + canonical
      // so a brief Supabase outage doesn't poison Google's cache with a
      // "City Not Found" page that's also missing its canonical tag.
      return {
        title: `IV Therapy in ${fallbackName} | TheDripMap`,
        description: `Find and compare IV therapy clinics in ${fallbackName}. Read reviews, compare prices, and book hangover recovery, NAD+, immune support and hydration drips near you.`,
        alternates: { canonical: fallbackCanonical },
      };
    }
    throw err;
  }

  let name = '';
  let state = '';

  if (cityData) {
    name = cityData.name;
    state = cityData.state || '';
  } else {
    // Fallback: convert slug to title case (e.g. "san-diego" -> "San Diego")
    name = fallbackName;
  }

  // Fetch actual count for accurate metadata.
  // STRICT: the robots decision below is gated on this count, so a FAILED query
  // must throw rather than return []. A silent [] made healthy pages emit
  // noindex, which ISR then cached (see DataUnavailableError in supabase-health).
  let listings = await getListingsByCity(name, state, { strict: true });
  // Slug-aware fallback: catches DB city strings the naive reconstruction
  // can't produce (e.g. "Whitchurch-Stouffville" preserves dash, "St. Petersburg"
  // preserves period). slugify("Whitchurch-Stouffville") === "whitchurch-stouffville".
  if (listings.length === 0 && !cityData) {
    const all = await getAllCities();
    const match = all.find((c) => slugify(c.city) === slug);
    if (match) {
      name = match.city;
      state = match.state || match.stateAbbr || '';
      listings = await getListingsByCity(name, state, { strict: true });
    }
  }
  listings = constrainToModalState(listings, state);
  const count = listings.length;
  // Real in-city count: getListingsByCity broadens to state level when a city
  // has zero exact matches, so filter back to this city for honest metadata
  // (the title/description must not promise clinics that are actually nearby).
  const localCount = listings.filter(
    (l) => ((l as { city?: string }).city || '').toLowerCase() === name.toLowerCase()
  ).length;

  // Even for a totally unknown city slug, emit title + description + canonical
  // so the page is never tagless. Mark noindex when there is literally no data
  // to back a hub page.
  if (count === 0 && !cityData) {
    return {
      title: `IV Therapy in ${fallbackName} | TheDripMap`,
      description: `IV therapy clinics and providers in ${fallbackName}. Compare hydration drips, NAD+, hangover recovery and more on TheDripMap.`,
      alternates: { canonical: fallbackCanonical },
      robots: { index: false, follow: true },
    };
  }

  // Unified city title format — applies to every city page so the SERP feels
  // consistent and patient-friendly. Per-city description overrides still win
  // (city-intros.ts can shape the meta description for high-traffic pages),
  // but the title itself is locked to "IV Therapy in {City}, {State} ({Year}) |
  // {N} Clinics" — highest-ROI traffic format per the playbook. "Verified" was
  // dropped 2026-05-31 to keep the Safety Verified badge meaningful (only
  // claimed clinics earn it; the directory aggregate must not imply otherwise).
  //
  // Many cities rows have no state populated; when that's the case, derive the
  // modal state from the actual listings so the format renders consistently.
  const intro = getCityIntro(slug);
  const titleYear = new Date().getUTCFullYear();
  let resolvedState = state;
  if (!resolvedState && listings.length > 0) {
    const tally = new Map<string, number>();
    for (const l of listings) {
      const s = (l as { state?: string }).state;
      if (s) tally.set(s, (tally.get(s) || 0) + 1);
    }
    let best = '';
    let bestN = 0;
    for (const [k, n] of tally) {
      if (n > bestN) { best = k; bestN = n; }
    }
    resolvedState = best;
  }
  const cityStateLabel = resolvedState ? `${name}, ${resolvedState}` : name;
  // CTR surgery (2026-08): the old title "IV Therapy in Toronto, Ontario (2026)
  // | 77 Clinics" ran at 0.6% CTR on 1,666 Toronto impressions. Lead with the
  // city, add the compare + price benefit and the year, and keep it under ~60
  // chars so it is not truncated in the SERP. Province is dropped from the title
  // (still in the H1 + description) for brevity; the number + "Prices" carry the
  // click. Length-guarded so long city names fall back to a tighter form.
  let title: string;
  if (localCount > 0) {
    title = `IV Therapy ${name}: Compare ${localCount} Clinics & Prices (${titleYear})`;
    if (title.length > 60) title = `IV Therapy ${name}: ${localCount} Clinics & Prices (${titleYear})`;
    if (title.length > 60) title = `IV Therapy in ${cityStateLabel} (${titleYear}) | ${localCount} Clinics`;
  } else {
    title = `IV Therapy in ${name} (${titleYear}): Clinics Near You`;
  }
  const description =
    intro?.metaDescription ||
    cityData?.meta_description?.replace('{count}', String(localCount || count)) ||
    (localCount > 0
      ? `Find and compare ${localCount} IV therapy ${localCount === 1 ? 'clinic' : 'clinics'} in ${name}. Read reviews, compare prices, and book hangover recovery, NAD+, immune support and hydration drips near you.`
      : `Explore IV therapy clinics near ${name}. Compare reviews and prices for hangover recovery, NAD+, immune support and hydration drips in the surrounding area.`);

  // 3-provider gate (per the 2026-06-09 city-deepening spec). City pages
  // with fewer than 3 listed providers are URL-reachable but emit robots:
  // noindex,follow so Google does not surface thin landing pages. The
  // sitemap.ts gate filters them out of the crawl-priority list separately.
  const passesProviderGate = count >= 3;

  // US market off: noindex US city pages. The city's market is read from its
  // listings' country field (primary) with the province/state as fallback, so
  // Canadian cities are never affected. Reversible via US_MARKET_ENABLED.
  const ctyTally = { US: 0, CA: 0 };
  for (const l of listings) {
    const m = normalizeCountry((l as { country?: string }).country);
    if (m === 'US') ctyTally.US++;
    else if (m === 'CA') ctyTally.CA++;
  }
  const cityModalCountry = ctyTally.US > ctyTally.CA ? 'United States' : ctyTally.CA > 0 ? 'Canada' : '';
  const cityUSNoindex = isNoindexedUSPage({ country: cityModalCountry, state: resolvedState });

  return {
    title,
    description,
    alternates: {
      // Point at the resolved city's canonical slug so case/variant URLs
      // (e.g. /cities/New-York) dedupe to the one true /cities/new-york.
      canonical: `https://www.thedripmap.com/cities/${cityData?.slug || slug}`,
    },
    ...((passesProviderGate && !cityUSNoindex) ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url: `https://www.thedripmap.com/cities/${slug}`,
      siteName: 'TheDripMap',
      type: 'website',
      images: [
        {
          url: 'https://www.thedripmap.com/og-image.png',
          width: 1200,
          height: 630,
          alt: `${name} IV Therapy`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.thedripmap.com/og-image.png'],
    },
  };
}

export default async function IndividualCityPage({ params }: CityPageProps) {
  const { slug } = await params;
  let cityData;
  try {
    cityData = await getCityBySlug(slug);
  } catch (err) {
    if (err instanceof SupabaseUnreachableError) {
      const guess = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return <TemporarilyUnavailable kind="city" label={guess} />;
    }
    throw err;
  }

  // If no city record was found in the 'cities' table or mock data
  if (!cityData) {
    // 1. Try naive slug→name reconstruction (handles san-diego → San Diego).
    let name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    let resolvedState = '';
    // STRICT: an empty result here routes to notFound(), so a failed query
    // would 404 a healthy city page and ISR would cache that 404.
    let listings = await getListingsByCity(name, undefined, { strict: true });

    // 2. Slug-aware fallback: match against actual provider cities so we catch
    //    DB strings the naive reconstruction can't produce — e.g.
    //    "Whitchurch-Stouffville" (preserves dash) or "St. Petersburg"
    //    (preserves period). slugify both round-trip back to the URL slug.
    if (listings.length === 0) {
      const all = await getAllCities();
      const match = all.find((c) => slugify(c.city) === slug);
      if (match) {
        name = match.city;
        resolvedState = match.state || match.stateAbbr || '';
        listings = await getListingsByCity(name, resolvedState, { strict: true });
      }
    }
    listings = constrainToModalState(listings, resolvedState);

    if (listings.length > 0) {
      cityData = {
        id: `fallback-${slug}`,
        name,
        slug,
        state: resolvedState,
        content: null,
        meta_title: null,
        meta_description: null
      };
    } else {
      // Safety net: if the slug is a treatment or symptom name typed into the
      // /cities/ path (e.g. /cities/weight-loss), redirect to the correct hub
      // instead of 404. Treatment slugs source: app/treatments/page.tsx.
      // Symptom slugs source: src/lib/use-cases.ts. Keep this list in sync
      // when those source files change.
      const TREATMENT_SLUGS = new Set([
        'nad-plus', 'hangover', 'hangover-recovery', 'immune-support',
        'beauty-glow', 'weight-loss', 'glp-1-weight-loss', 'hydration',
        'recovery', 'athletic-recovery', 'myers-cocktail', 'jet-lag',
        'energy-boost', 'iron-infusion', 'vitamin-d', 'b12-shot',
        'glutathione', 'high-dose-vitamin-c', 'vitamin-c', 'cold-and-flu',
        'migraine-relief', 'hormone-therapy', 'mobile-iv',
      ]);
      const SYMPTOM_SLUGS = new Set([
        'hangover', 'jet-lag', 'fatigue', 'cold-and-flu', 'sports-recovery',
        'migraine', 'weight-loss', 'skin-glow', 'stress', 'stomach-flu',
        'immunity', 'morning-sickness', 'event-prep',
      ]);
      if (TREATMENT_SLUGS.has(slug)) {
        redirect(`/treatments/${slug}`);
      }
      if (SYMPTOM_SLUGS.has(slug)) {
        redirect(`/symptoms/${slug}`);
      }
      notFound();
    }
  }

  // TORONTO-ONLY two-tier view: Toronto + former municipalities up top, then
  // surrounding GTA below sorted by distance from downtown. Other city pages
  // keep the existing one-tier flow untouched.
  const isToronto = slug === 'toronto';
  let torontoCore: Awaited<ReturnType<typeof getTorontoGtaTieredListings>>['core'] = [];
  let torontoNearby: Awaited<ReturnType<typeof getTorontoGtaTieredListings>>['nearby'] = [];
  if (isToronto) {
    const tiered = await getTorontoGtaTieredListings();
    torontoCore = tiered.core;
    torontoNearby = tiered.nearby;
  }

  // Fetch actual listings for display. Toronto's tiered view is multi-city by
  // design, so the same-name guard only applies to the standard path.
  let listings = isToronto
    ? [...torontoCore, ...torontoNearby]
    : constrainToModalState(await getListingsByCity(cityData.name, cityData.state || '', { strict: true }), cityData.state || '');
  const exactCityCount = isToronto ? torontoCore.length : listings.length;

  // Tiered fallback so a small/empty city never shows 0 cards:
  // 1) widen to state-level top-rated
  // 2) if still under 3, broaden to nationwide featured/top-rated
  // The page passes a "broadened" flag down so the UI can communicate the
  // expansion (banner) instead of silently swapping providers.
  let isBroadened = false;
  let broadenedScope: 'state' | 'national' | null = null;
  if (!isToronto && exactCityCount < 3 && cityData.state) {
    const stateListings = await getListingsByState(cityData.state);
    const existingIds = new Set(listings.map(p => p.id));
    for (const p of stateListings) {
      if (listings.length >= 24) break;
      if (!existingIds.has(p.id)) {
        listings.push(p);
        existingIds.add(p.id);
      }
    }
    if (listings.length > exactCityCount) {
      isBroadened = true;
      broadenedScope = 'state';
    }
  }
  if (!isToronto && listings.length < 3) {
    // Keep the national fallback in THIS city's country (our data is US + Canada
    // only) so a thin Canadian city page never lists US clinics, and vice versa.
    const st = (cityData.state || '').trim();
    const caSet = ['on', 'ontario', 'bc', 'british columbia', 'ab', 'alberta', 'mb', 'manitoba', 'sk', 'saskatchewan', 'qc', 'quebec', 'ns', 'nova scotia', 'nb', 'new brunswick', 'nl', 'newfoundland', 'pe', 'prince edward island', 'nt', 'northwest territories', 'yt', 'yukon', 'nu', 'nunavut'];
    const ccHint = st ? (caSet.includes(st.toLowerCase()) ? 'Canada' : 'US') : undefined;
    const featured = await getFeaturedListings(24, undefined, ccHint);
    const existingIds = new Set(listings.map(p => p.id));
    for (const p of featured) {
      if (listings.length >= 24) break;
      if (!existingIds.has(p.id)) {
        listings.push(p);
        existingIds.add(p.id);
      }
    }
    if (listings.length > exactCityCount) {
      isBroadened = true;
      broadenedScope = broadenedScope === 'state' ? 'state' : 'national';
    }
  }

  const count = listings.length;
  // Honest count phrasing: when the grid was padded with nearby/state clinics
  // (isBroadened), keep those extras out of the in-city number so headlines and
  // the FAQ never imply more clinics are physically in this city than there are.
  // exactCityCount is the real in-city total; nearbyAdded is everything else.
  const nearbyAdded = Math.max(0, count - exactCityCount);

  // If a "best-iv-therapy-{city}-2026" blog post exists, surface it as a
  // contextual CTA. Internal link from city page → blog post pushes PageRank
  // to the blog post and helps it rank for "best IV therapy {city}" queries.
  const cityGuideSlug = `best-iv-therapy-${slug}-2026`;
  const cityGuidePost = await getBlogPostBySlug(cityGuideSlug);

  // Fetch nearby cities in the same state
  const allCities = await getAllCities();
  const nearbyCities = allCities
    .filter(c => c.state === cityData.state && c.city !== cityData.name)
    .slice(0, 5);

  // City-specific deep meta (regulation note, use cases, faqs, internal links).
  // Toronto is the gold-standard pilot; other cities silently render the
  // existing layout when no meta is present.
  const cityMeta = getCityMeta(slug);

  // Citable IV Price Index for this city, if a published snapshot exists (n>=3
  // gate, currently Toronto + Edmonton). Surfacing it answer-first near the top
  // gives the city page a unique, data-driven block competitors can't copy and
  // an internal link to our flagship /iv-prices/[city] asset.
  const cityPriceIndex = getCityPriceIndex(slug);
  const cur = (n: number) => (cityPriceIndex?.currency === 'USD' ? '$' : 'CA$') + n;

  // ── Proprietary local data (Move 2, 2026-08-15 audit) ─────────────────────
  // The data no competitor can paraphrase: captured drip menu items for THIS
  // city's listed clinics (clinic_drips, every row source-attributed), plus the
  // verification counts. Tolerant: all of it is optional and the page renders
  // without it.
  type CityDrip = { published_name: string; price_cad: number | null; source_type: string; captured_at: string; provider_id: string };
  let cityDrips: CityDrip[] = [];
  const listingIds = listings.map((l) => (l as { id?: string }).id).filter(Boolean) as string[];
  const listingById = new Map(listings.map((l) => [(l as { id?: string }).id as string, l]));
  if (listingIds.length && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data } = await sb
        .from('clinic_drips')
        .select('published_name,price_cad,source_type,captured_at,provider_id')
        .in('provider_id', listingIds)
        .eq('is_active', true)
        .not('price_cad', 'is', null)
        .order('price_cad', { ascending: true })
        .limit(10);
      cityDrips = (data || []) as CityDrip[];
    } catch { /* optional module */ }
  }
  const premisesInspectedCount = listings.filter((l) => {
    const dd = (l as { decision_drivers?: { premises?: { status?: string } } }).decision_drivers;
    return dd?.premises && String(dd.premises.status || '').toLowerCase() === 'authorized';
  }).length;
  const safetyVerifiedCount = listings.filter((l) =>
    isSafetyVerified(l as { safety_verified?: boolean | null; safety_review_status?: string | null })
  ).length;

  // Precompute use-case pools so each section can short-circuit when empty.
  // Each filter is a cheap O(n) pass over the local listing pool.
  const useCaseSections = (cityMeta?.useCases || [])
    .map((uc) => ({ useCase: uc, providers: filterByUseCase(listings, uc) }))
    .filter((s) => s.providers.length >= 2);

  // City-specific FAQs (if curated) outrank the generic 3, then the generic
  // fallbacks fill any remaining slots. Cap at 6 so the FAQPage JSON-LD stays
  // focused and the visible block stays scannable.
  const curatedFaqs = cityMeta?.faqs || [];
  const genericFaqs = [
    {
      question: `How many IV therapy clinics are in ${cityData.name}?`,
      answer: isBroadened
        ? (exactCityCount > 0
            ? `There are ${exactCityCount} IV therapy ${exactCityCount === 1 ? 'provider' : 'providers'} listed directly in ${cityData.name}, plus ${nearbyAdded} more in nearby areas, including both clinic locations and mobile services.`
            : `We do not have a clinic listed directly in ${cityData.name} yet, but there are ${count} IV therapy providers in nearby areas, including mobile services that may travel to you.`)
        : `There are currently ${count} IV therapy providers in ${cityData.name} listed on TheDripMap, including both clinic locations and mobile services.`
    },
    {
      question: `Do clinics in ${cityData.name} offer mobile services?`,
      answer: `Yes, many providers in ${cityData.name} offer mobile IV therapy where medical professionals bring treatments directly to your home, office, or hotel. You can identify these by looking for the "Mobile Service" badge in the listings.`
    },
    {
      question: `What is the average cost of IV therapy in ${cityData.name}?`,
      // Data-driven where a published Price Index snapshot exists; the generic
      // range only appears for cities without collected menu data yet.
      answer: cityPriceIndex
        ? `Based on published menu prices from ${cityPriceIndex.clinicCount} ${cityData.name} clinics (${cityPriceIndex.asOf}), a ${cityPriceIndex.headline.treatment.toLowerCase()} runs ${cur(cityPriceIndex.headline.low)} to ${cur(cityPriceIndex.headline.high)}, with a median of ${cur(cityPriceIndex.headline.median)}. See the full ${cityData.name} IV Price Index on TheDripMap for per-treatment ranges.`
        : `While prices vary by provider and specific protocol, most standard hydration and wellness drips in ${cityData.name} range from $150 to $300. Specialized treatments like NAD+ therapy typically start at $500.`
    }
  ];
  const faqs = [...curatedFaqs, ...genericFaqs].slice(0, 6);

  // Data-driven city snapshot. ~260 city rows shared a near-identical "what is IV
  // therapy" template body; this replaces that shared block (on any city without
  // bespoke copy) with real figures computed from the city's own listings, so no
  // two city pages carry a duplicate body. Bespoke city copy is left untouched.
  type SnapClinic = { city?: string; name?: string; rating?: number | string; reviewCount?: number | string; mobile_service?: boolean; type?: string; category?: string; specialties?: string[]; subtypes?: string[]; description?: string; is_claimed?: boolean; safety_verified?: boolean };
  const isTemplatedBody = typeof cityData.content === 'string' && cityData.content.includes('short for intravenous therapy');
  const snapInCity = (listings as SnapClinic[]).filter((l) => (l.city || '').toLowerCase() === cityData.name.toLowerCase());
  const snapPool: SnapClinic[] = snapInCity.length ? snapInCity : (listings as SnapClinic[]);

  // Live offers for clinics on this page. Deals are a strong, time-sensitive
  // conversion hook, so we surface them ON the city page (where ranked traffic
  // lands) rather than only on /deals. Data-gated: the block renders only when a
  // clinic here actually has an active offer, so it never adds thin content. The
  // offer's canonical Offer schema lives on the provider page (linked), so we do
  // not duplicate it here. Filtering + the medical-claims compliance gate live
  // in src/lib/deals.ts (shared with /deals and the provider page); computed
  // from the pool already fetched above, so a data error upstream simply
  // yields [] and this section renders nothing without breaking the page.
  let cityOffers: LiveDeal[] = [];
  try {
    cityOffers = liveDealsFromListings(listings as unknown[]).slice(0, 6);
  } catch {
    cityOffers = [];
  }
  const snapMobile = snapPool.filter((c) => {
    if (c.mobile_service) return true;
    const ty = (c.type || '').toLowerCase();
    if (ty === 'mobile' || ty === 'both') return true;
    const blob = [c.category, (c.specialties || []).join(' '), (c.subtypes || []).join(' '), c.description].join(' ').toLowerCase();
    return blob.includes('mobile') || blob.includes('in-home') || blob.includes('at-home') || blob.includes('concierge');
  }).length;
  const snapRated = snapPool.filter((c) => Number(c.rating) > 0 && Number(c.reviewCount) > 0);
  const snapAvg = snapRated.length ? snapRated.reduce((s, c) => s + Number(c.rating), 0) / snapRated.length : 0;
  const snapTop = snapRated.slice().sort((a, b) => (Number(b.rating) - Number(a.rating)) || (Number(b.reviewCount) - Number(a.reviewCount)))[0] || null;
  const snapClaimed = snapPool.filter((c) => c.is_claimed === true).length;
  const snapCount = snapPool.length;
  const snapInClinic = snapCount - snapMobile;
  const snapParts: string[] = [`TheDripMap lists ${snapCount} IV therapy ${snapCount === 1 ? 'provider' : 'providers'} in ${cityData.name}.`];
  if (snapMobile > 0 && snapInClinic > 0) snapParts.push(`${snapInClinic} ${snapInClinic === 1 ? 'works' : 'work'} from a clinic and ${snapMobile} ${snapMobile === 1 ? 'offers' : 'offer'} mobile or in-home visits.`);
  else if (snapMobile > 0) snapParts.push(`${snapMobile === snapCount ? 'All' : snapMobile} of them offer mobile or in-home visits.`);
  else snapParts.push(`All of them work from a physical clinic.`);
  if (snapRated.length > 0) snapParts.push(`${snapRated.length} ${snapRated.length === 1 ? 'has' : 'have'} public reviews, averaging ${snapAvg.toFixed(1)} stars${snapTop && snapTop.name ? `, led by ${snapTop.name} at ${Number(snapTop.rating).toFixed(1)}` : ''}.`);
  // Claimed and Safety Verified are two INDEPENDENT badges (see src/lib/safety.ts)
  // and must never be merged into one sentence: a clinic can be claimed without
  // the badge, and the badge is granted only by operator review.
  const snapSafety = snapPool.filter((c) => isSafetyVerified(c as { safety_verified?: boolean; safety_review_status?: string | null })).length;
  if (snapClaimed > 0) snapParts.push(`${snapClaimed} ${snapClaimed === 1 ? 'is' : 'are'} claimed by the clinic.`);
  if (snapSafety > 0) snapParts.push(`${snapSafety} ${snapSafety === 1 ? 'holds' : 'hold'} a Safety Verified badge.`);
  const citySnapshot = snapParts.join(' ').replace(/[‒-―−]/g, '-');

  // No FAQPage JSON-LD is built here on purpose: <FAQSection> emits it from the
  // same `faqs` array, colocated with the visible Q&A. See the render below.

  // Breadcrumb trail: Canadian cities get the geo hierarchy Home / Canada /
  // Province / City (linking /canada and the province page) so Canadian
  // authority flows through the hub-and-spoke. Non-CA cities keep the generic
  // Cities trail (those pages are noindexed under the Canada-first posture).
  // The BreadcrumbList JSON-LD is emitted by <BreadcrumbNav> itself — do not
  // hand-emit a second copy here (it produced duplicate breadcrumb schema).
  const cityIsCanadian = marketOf({ state: cityData.state }) !== 'US';
  const breadcrumbItems = cityIsCanadian
    ? [
        { label: 'Canada', href: '/canada' },
        ...(cityData.state ? [{ label: cityData.state, href: `/states/${slugify(cityData.state)}` }] : []),
        { label: cityData.name },
      ]
    : [
        { label: 'Cities', href: '/cities' },
        ...(cityData.state ? [{ label: cityData.state }] : []),
        { label: cityData.name },
      ];

  // ItemList JSON-LD wrapping the visible clinic cards (top 12), each as a
  // LocalBusiness entry with name, address, phone, url, and aggregateRating
  // where present. This is the structured-data emission requested in the
  // 2026-06-09 city-deepening spec.
  type ListingRow = {
    name: string;
    slug?: string | null;
    city?: string | null;
    state?: string | null;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    rating?: number | null | string;
    reviews?: number | null | string;
  };
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `IV therapy clinics in ${cityData.name}`,
    numberOfItems: Math.min(listings.length, 12),
    itemListElement: (listings as ListingRow[]).slice(0, 12).map((l, i) => {
      const lb: Record<string, unknown> = {
        '@type': 'MedicalBusiness',
        name: l.name,
        url: `https://www.thedripmap.com/providers/${l.slug || ''}`,
        address: l.address || [l.city, l.state].filter(Boolean).join(', '),
      };
      if (l.phone) lb.telephone = l.phone;
      if (l.website) lb.sameAs = l.website;
      const rating = l.rating != null ? Number(l.rating) : null;
      const reviews = l.reviews != null ? Number(l.reviews) : null;
      if (rating && reviews) {
        lb.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: rating,
          reviewCount: reviews,
        };
      }
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: lb,
      };
    }),
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      {/* FAQPage JSON-LD is emitted by <FAQSection> itself, colocated with the
          visible Q&A. Emitting it here too produced TWO identical FAQPage blocks
          on every city page (invalid duplicate schema). Removed 2026-08. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <BreadcrumbNav items={breadcrumbItems} />

        {/* Clinic-owner CTA banner — top-of-page so clinic owners spot it before the patient flow */}
        <Link
          href="/for-clinics"
          className="mt-8 mb-8 group flex items-center justify-between gap-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-2xl px-5 py-3 transition-all"
        >
          <span className="text-sm font-bold text-slate-700">
            Own a clinic in {cityData.name}? <span className="text-wellness-600">Claim your free listing in 2 minutes.</span>
          </span>
          <ArrowRight size={16} className="text-slate-400 group-hover:text-wellness-600 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>

        {/* 1. H1 + subheading — clean and simple */}
        <section className="mt-4 mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            {isToronto
              ? <>IV Therapy in Toronto <span className="text-slate-500">&amp; the GTA</span></>
              : <>IV Therapy in {cityData.name}</>
            }
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium mt-3">
            {isToronto
              ? `Compare ${torontoCore.length} ${torontoCore.length === 1 ? 'clinic' : 'clinics'} in Toronto plus ${torontoNearby.length} more across the surrounding GTA. In-clinic and mobile.`
              : isBroadened
                ? (exactCityCount > 0
                    ? `Compare ${exactCityCount} ${exactCityCount === 1 ? 'clinic' : 'clinics'} in ${cityData.name} plus ${nearbyAdded} more nearby. In-clinic and mobile.`
                    : `No clinics in ${cityData.name} yet. Showing ${count} top-rated nearby. In-clinic and mobile.`)
                : `Compare ${count} ${count === 1 ? 'clinic' : 'clinics'}. In-clinic and mobile.`
            }
          </p>
          {cityGuidePost && (
            <Link
              href={`/blog/${cityGuideSlug}`}
              className="inline-flex items-center gap-2 mt-5 text-sm font-black text-wellness-700 hover:text-wellness-800 group"
            >
              📖 Read our 2026 guide to the best IV therapy in {cityData.name}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {/* Answer-first block: the direct answer to "IV therapy in {city}" in
              one snippet-ready paragraph, composed entirely from live data
              (counts, price index, ratings), so search engines and AI assistants
              can lift it verbatim. Every figure is computed above; nothing is
              hardcoded. */}
          <div className="mt-6 max-w-3xl rounded-2xl border border-wellness-100 bg-wellness-50/50 px-5 py-4">
            <p className="text-base md:text-lg text-slate-700 leading-relaxed">
              {isToronto
                ? `There are ${torontoCore.length} IV therapy clinics in Toronto on TheDripMap, plus ${torontoNearby.length} more across the GTA.`
                : `There ${snapCount === 1 ? 'is' : 'are'} ${snapCount} IV therapy ${snapCount === 1 ? 'clinic' : 'clinics'} in ${cityData.name} on TheDripMap.`}{' '}
              {cityPriceIndex
                ? `A ${cityPriceIndex.headline.treatment.toLowerCase()} runs ${cur(cityPriceIndex.headline.low)} to ${cur(cityPriceIndex.headline.high)}, median ${cur(cityPriceIndex.headline.median)}, per published menus from ${cityPriceIndex.clinicCount} clinics.`
                : ''}{' '}
              {snapRated.length > 0
                ? `${snapRated.length} ${snapRated.length === 1 ? 'has' : 'have'} public reviews, averaging ${snapAvg.toFixed(1)} stars.`
                : ''}{' '}
              {snapMobile > 0 ? `${snapMobile} offer mobile or in-home visits.` : ''}
            </p>
          </div>
        </section>

        {/* 2. Quick map view trigger */}
        <div className="flex justify-end mb-8">
          <MapTrigger />
        </div>

        {/* Live offers in this city — surfaced where ranked traffic lands. Only
            renders when a clinic here has an active offer (data-gated). */}
        {cityOffers.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#0F6E56] flex items-center gap-2">
                <Gift size={15} /> Live offers in {cityData.name}
                <span className="text-slate-300 font-bold">·</span>
                <span className="text-slate-400">{cityOffers.length} offer{cityOffers.length > 1 ? 's' : ''}</span>
              </h2>
              <Link href="/deals" className="text-[13px] font-bold text-wellness-700 hover:underline shrink-0">All deals</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cityOffers.map((d) => (
                <DealCard key={d.slug} deal={d} showCity={false} />
              ))}
            </div>
          </section>
        )}

        {/* 3. Intro paragraph */}
        {(() => {
          const intro = getCityIntro(slug);
          if (intro) {
            return (
              <section className="mb-12 max-w-4xl space-y-4">
                <p className="text-lg text-slate-600 leading-relaxed">{intro.localContext}</p>
                <p className="text-lg text-slate-600 leading-relaxed">
                  With {isBroadened
                    ? (exactCityCount > 0
                        ? `${exactCityCount} ${exactCityCount === 1 ? 'clinic' : 'clinics'} in ${cityData.name} and more nearby`
                        : `top-rated clinics near ${cityData.name}`)
                    : `${count} ${count === 1 ? 'clinic' : 'clinics'} in ${cityData.name}`}, popular treatments include {intro.popularTreatments.join(', ')}. {intro.pricing}
                </p>
              </section>
            );
          }
          return (
            <section className="mb-12 max-w-4xl">
              <p className="text-lg text-slate-600 leading-relaxed">
                Looking for IV therapy in {cityData.name}? Compare {isBroadened
                  ? (exactCityCount > 0
                      ? `${exactCityCount} top-rated ${exactCityCount === 1 ? 'clinic' : 'clinics'} in ${cityData.name} plus ${nearbyAdded} more nearby`
                      : `${count} top-rated ${count === 1 ? 'clinic' : 'clinics'} near ${cityData.name}`)
                  : (count === 1 ? '1 top-rated clinic' : `${count} top-rated clinics`)} offering hydration drips, NAD+, immune support, hangover recovery, and beauty treatments. Read reviews, see prices, and book your session in-clinic or mobile, whichever you prefer.
              </p>
            </section>
          );
        })()}

        {/* IV Price Index module — answer-first pricing pulled from the citable
            /iv-prices/[city] snapshot. Renders only where a published index
            exists. Unique, data-driven content + a strong internal link to the
            flagship price asset. */}
        {cityPriceIndex && (
          <section className="mb-12 max-w-4xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-wellness-600">IV Price Index</span>
                <span className="text-[11px] font-bold text-slate-400">Updated {cityPriceIndex.asOf}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">
                What IV therapy costs in {cityData.name}
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                A {cityPriceIndex.headline.treatment.toLowerCase()} in {cityData.name} runs a median of{' '}
                <span className="font-black text-slate-900">{cur(cityPriceIndex.headline.median)}</span>{' '}
                ({cur(cityPriceIndex.headline.low)} to {cur(cityPriceIndex.headline.high)}), based on published
                prices from {cityPriceIndex.clinicCount} {cityData.name} clinics. These are published menu prices,
                not medical advice.
              </p>

              {/* Full per-treatment table (Toronto rescue, 2026-08): the whole
                  citable dataset on the money page itself, not just the headline.
                  Real published-menu figures; the one thing a single clinic's
                  site can never publish. */}
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">
                      <th className="py-2 pr-4">Treatment</th>
                      <th className="py-2 pr-4 text-right">Low</th>
                      <th className="py-2 pr-4 text-right">Median</th>
                      <th className="py-2 pr-4 text-right">High</th>
                      <th className="py-2 text-right">Clinics</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cityPriceIndex.rows.map((r) => (
                      <tr key={r.treatment} className="border-b border-slate-100 last:border-0">
                        <td className="py-2.5 pr-4 font-bold text-slate-800">{r.treatment}</td>
                        <td className="py-2.5 pr-4 text-right text-slate-600 tabular-nums">{cur(r.low)}</td>
                        <td className="py-2.5 pr-4 text-right font-black text-slate-900 tabular-nums">{cur(r.median)}</td>
                        <td className="py-2.5 pr-4 text-right text-slate-600 tabular-nums">{cur(r.high)}</td>
                        <td className="py-2.5 text-right text-slate-500 tabular-nums">{r.clinics}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                Method: one representative (lowest listed) published price per clinic per treatment; low, median and
                high across clinics; only treatments priced by at least 3 clinics are shown. Snapshot: {cityPriceIndex.asOf}.
                {cityPriceIndex.note ? ` ${cityPriceIndex.note}` : ''}
              </p>

              {/* Dataset JSON-LD so the price table is a citable dataset for
                  search and AI engines (AEO), scoped to this module. */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'Dataset',
                    name: `IV Therapy Price Index, ${cityData.name} (${cityPriceIndex.asOf})`,
                    description: `Published IV therapy menu prices in ${cityData.name}, Canada: low, median and high per treatment across ${cityPriceIndex.clinicCount} clinics. Collected from public clinic menus by TheDripMap, the IV therapy matching platform for Canada.`,
                    url: `https://www.thedripmap.com/iv-prices/${cityPriceIndex.citySlug}`,
                    creator: { '@type': 'Organization', name: 'TheDripMap', url: 'https://www.thedripmap.com' },
                    temporalCoverage: cityPriceIndex.asOf,
                    spatialCoverage: { '@type': 'Place', name: `${cityData.name}, Canada` },
                    // Recommended by Google's Dataset rich result (GSC warning
                    // 2026-08-05); points at the published methodology.
                    license: 'https://www.thedripmap.com/iv-prices#methodology',
                    isAccessibleForFree: true,
                    variableMeasured: cityPriceIndex.rows.map((r) => ({
                      '@type': 'PropertyValue',
                      name: `${r.treatment} (median)`,
                      value: r.median,
                      unitText: cityPriceIndex.currency,
                    })),
                  }),
                }}
              />

              <Link
                href={`/iv-prices/${cityPriceIndex.citySlug}`}
                className="inline-flex items-center gap-2 mt-4 text-sm font-black text-wellness-700 hover:text-wellness-800 group"
              >
                See the full {cityData.name} IV Price Index
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>
        )}

        {/* ── Verified local data (Move 2, 2026-08-15) ──────────────────────
            Captured drip menu items + verification counts for THIS city's
            clinics. Every drip row is source-attributed (clinic website or
            owner-selected) with a capture date; verification counts come from
            the register-checked badge system. Renders on any city with data,
            which is exactly what lifts the thin-tail city pages. */}
        {(cityDrips.length > 0 || premisesInspectedCount > 0 || safetyVerifiedCount > 0) && (
          <section className="mb-12 max-w-4xl">
            <div className="rounded-3xl border border-wellness-100 bg-white p-6 md:p-8 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-wellness-600 mb-2">
                Verified local data
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                What we have verified in {cityData.name}
              </h2>
              {(safetyVerifiedCount > 0 || premisesInspectedCount > 0) && (
                <p className="text-slate-600 leading-relaxed mb-4">
                  {safetyVerifiedCount > 0 && (
                    <>
                      <span className="font-black text-slate-900">{safetyVerifiedCount}</span>{' '}
                      {safetyVerifiedCount === 1 ? 'clinic here holds' : 'clinics here hold'} a Safety Verified
                      badge, meaning we checked the named prescriber against a public college register.{' '}
                    </>
                  )}
                  {premisesInspectedCount > 0 && (
                    <>
                      <span className="font-black text-slate-900">{premisesInspectedCount}</span>{' '}
                      {premisesInspectedCount === 1 ? 'premises appears' : 'premises appear'} as authorized on the
                      regulator&apos;s own IVIT inspection register.{' '}
                    </>
                  )}
                  <Link href="/verification" className="font-bold text-wellness-700 hover:underline">
                    How our verification works
                  </Link>
                  .
                </p>
              )}
              {cityDrips.length > 0 && (
                <>
                  <p className="text-sm text-slate-500 mb-3">
                    Real drips with real prices from menus we track at {cityData.name} clinics, each traceable to
                    its source:
                  </p>
                  <ul className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                    {cityDrips.slice(0, 8).map((d, i) => {
                      const clinic = listingById.get(d.provider_id) as { name?: string; slug?: string } | undefined;
                      return (
                        <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                          <span className="font-bold text-slate-800">{d.published_name}</span>
                          <span className="font-black text-slate-900 tabular-nums">CA${d.price_cad}</span>
                          {clinic?.slug && (
                            <Link href={`/providers/${clinic.slug}`} className="text-wellness-700 font-bold hover:underline">
                              {clinic.name}
                            </Link>
                          )}
                          <span className="ml-auto text-[11px] text-slate-400">
                            {d.source_type === 'clinic_website' ? "clinic's published menu" : 'owner-selected'} ·{' '}
                            {d.captured_at}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </section>
        )}

        {/* GTA neighborhood coverage (Toronto rescue, 2026-08): Toronto searches
            are often really "near me in my part of the GTA" searches. Real,
            live per-city counts + internal links push authority through the
            hub-and-spoke and give the page local depth no single clinic has.
            Toronto-only: other cities keep the standard NearbyCities module. */}
        {isToronto && (() => {
          const GTA_NEIGHBOURS = ['Mississauga', 'Vaughan', 'Richmond Hill', 'Markham', 'Brampton', 'Oakville', 'Etobicoke', 'North York', 'Scarborough'];
          const gta = GTA_NEIGHBOURS
            .map((n) => allCities.find((c) => c.city.toLowerCase() === n.toLowerCase()))
            .filter((c): c is NonNullable<typeof c> => !!c && c.count > 0);
          if (gta.length < 3) return null;
          return (
            <section className="mb-12 max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
                IV therapy across the GTA
              </h2>
              <p className="text-slate-600 leading-relaxed mb-5">
                Not downtown? TheDripMap lists clinics across the Greater Toronto Area, so you can compare options
                close to home instead of commuting for a drip.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {gta.map((c) => (
                  <Link
                    key={c.city}
                    href={`/cities/${slugify(c.city)}`}
                    className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-wellness-600 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-700 hover:text-wellness-700 transition-all"
                  >
                    {c.city}
                    <span className="text-[11px] font-black text-slate-400">{c.count}</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Regulation / market note — only renders when the city has curated meta
            (Toronto today). Frames it as general information with a link to the
            full guide. */}
        {cityMeta?.regulationNote && (
          <section className="mb-12 max-w-4xl">
            <div className="rounded-3xl border border-wellness-200 bg-wellness-50/60 p-6 md:p-7">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-wellness-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-wellness-900 mb-2">{cityMeta.regulationNote.headline}</h2>
                  <p className="text-sm text-wellness-900/80 leading-relaxed">
                    {cityMeta.regulationNote.body}
                  </p>
                  {cityMeta.regulationNote.linkBlogSlug && cityMeta.regulationNote.linkLabel && (
                    <Link
                      href={`/blog/${cityMeta.regulationNote.linkBlogSlug}`}
                      className="inline-flex items-center gap-2 mt-4 text-sm font-black text-wellness-700 hover:text-wellness-800 group"
                    >
                      <BookOpen size={14} /> {cityMeta.regulationNote.linkLabel}
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. Verified Providers listings grid.
            TORONTO: two-tier render — Toronto + former municipalities up top,
            then "Nearby in the Greater Toronto Area" below. Other cities use
            the single ListingController.
            Each clinic keeps its REAL city label; suburban clinics are NOT
            relabeled "Toronto". */}
        {isToronto ? (
          <>
            {torontoCore.length > 0 && (
              <section className="mb-16">
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                      IV therapy in Toronto
                    </h2>
                    <p className="text-sm font-bold text-slate-500 mt-1">
                      {torontoCore.length} {torontoCore.length === 1 ? 'clinic' : 'clinics'} in Toronto, North York, Scarborough, Etobicoke, York &amp; East York
                    </p>
                  </div>
                </div>
                <ListingController
                  initialProviders={torontoCore.map(slimProviderForList)}
                  cityName={cityData.name}
                  hideHeading
                />
              </section>
            )}

            {torontoNearby.length > 0 && (
              <section className="mb-16">
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                      Nearby in the Greater Toronto Area
                    </h2>
                    <p className="text-sm font-bold text-slate-500 mt-1">
                      {torontoNearby.length} {torontoNearby.length === 1 ? 'clinic' : 'clinics'} across Markham, Vaughan, Richmond Hill, Mississauga, Brampton, Oakville, Burlington &amp; the rest of the GTA. Closest to downtown first.
                    </p>
                  </div>
                </div>
                <ListingController
                  initialProviders={torontoNearby.map(slimProviderForList)}
                  cityName={cityData.name}
                  hideHeading
                />
              </section>
            )}
          </>
        ) : (
          listings.length > 0 && (
            <>
              {isBroadened && (
                <div className="mb-8 bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-amber-900 mb-1">
                      {exactCityCount === 0
                        ? `No clinics in ${cityData.name} yet. Showing top-rated ${broadenedScope === 'state' ? `in ${cityData.state}` : 'nearby'}.`
                        : `Only ${exactCityCount} clinic${exactCityCount === 1 ? '' : 's'} in ${cityData.name}. Adding more from ${broadenedScope === 'state' ? cityData.state : 'nearby'} so you have options.`}
                    </p>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      Mobile IV providers in some listings will travel. Check the clinic page for service area.
                    </p>
                  </div>
                </div>
              )}
              <ListingController
                initialProviders={listings.map(slimProviderForList)}
                cityName={cityData.name}
              />
            </>
          )
        )}

        {/* 4b. Use-case groupings — "Best for hangover recovery", "Best for
            mobile in-home drips", etc. Only renders for cities with a curated
            cityMeta block AND only sections that found at least 2 matching
            clinics. Each card links to the provider page; the user-facing
            ListingController above is untouched. */}
        {useCaseSections.length > 0 && (
          <section className="mb-24">
            <div className="mb-8 max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
                Find the right drip for what you actually need
              </h2>
              <p className="text-base text-slate-500 leading-relaxed">
                Curated picks from the {cityData.name} listings, grouped by the most common reasons people book.
              </p>
            </div>
            <div className="space-y-12">
              {useCaseSections.map(({ useCase, providers }) => (
                <div key={useCase.key}>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{useCase.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 max-w-2xl">{useCase.blurb}</p>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 shrink-0">
                      {providers.length} {providers.length === 1 ? 'pick' : 'picks'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {providers.map((p) => (
                      <ProviderCard key={p.id} provider={p} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Match quiz CTA block */}
        <QuizCTA
          className="mb-24"
          title="Not sure which clinic is right for you?"
          subtitle={`Answer 5 quick questions and we'll match you to the best IV therapy clinic in ${cityData.name}.`}
        />

        {/* 6. SEO content. Bespoke per-city copy renders as written. Cities that
            only ever carried the shared template body now render a data-driven
            snapshot instead, so no two city pages share a near-identical block. */}
        {cityData.content && !isTemplatedBody ? (
          <section className="mb-24">
            <div className="prose prose-lg max-w-none prose-slate prose-headings:font-black prose-headings:tracking-tight prose-a:text-wellness-600 prose-a:no-underline hover:prose-a:underline bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {String(cityData.content)
                  .replace(/\\n/g, '\n')
                  .replace(/\{count\}/g, String(count))
                  .replace(/\{city\}/g, cityData.name)}
              </ReactMarkdown>
            </div>
          </section>
        ) : snapCount > 0 ? (
          <section className="mb-24">
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight">IV therapy in {cityData.name}: by the numbers</h2>
              <p className="text-lg text-slate-600 leading-relaxed">{citySnapshot}</p>
              <p className="text-sm text-slate-500 leading-relaxed mt-5">
                Compare each clinic above for the treatments offered, pricing, and booking. New to IV drips? See our{' '}
                <Link href="/guide/first-time-iv-therapy-what-to-expect" className="text-wellness-600 font-bold hover:underline">first-time guide</Link>{' '}
                and the{' '}
                <Link href="/guide/iv-therapy-cost-guide" className="text-wellness-600 font-bold hover:underline">cost guide</Link>.
              </p>
            </div>
          </section>
        ) : (
          <section className="mb-24 bg-white p-12 rounded-[3.5rem] border border-slate-100">
            <p className="text-slate-500 italic text-center">Comprehensive hydration guides for {cityData.name} are currently being updated.</p>
          </section>
        )}

        {/* 6a. Related reading — curated blog links for cities with a meta block.
            Internal linking from high-traffic city pages → topic blog posts
            pushes PageRank where it matters and gives readers a real next step. */}
        {cityMeta?.links?.blogPosts && cityMeta.links.blogPosts.length > 0 && (
          <section className="mb-12">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Related reading</h3>
              <div className="flex flex-wrap gap-3">
                {cityMeta.links.blogPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-wellness-300 hover:bg-wellness-50 text-sm font-bold text-slate-700 hover:text-wellness-700 transition-all group"
                  >
                    <BookOpen size={14} className="text-slate-400 group-hover:text-wellness-600" />
                    {post.label}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 6b. Browse Treatments — links every city page to /treatments/[slug] */}
        <section className="mb-24">
          <div className="bg-gradient-to-br from-wellness-50 to-white p-10 md:p-14 rounded-[3rem] border border-wellness-100">
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Browse IV Treatments in {cityData.name}</h3>
            <p className="text-lg text-slate-600 mb-10 max-w-3xl">
              Most {cityData.name} clinics offer these popular treatment protocols. Tap any drip for the full breakdown: benefits, who it&apos;s for, cost, and how to find a provider near you.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { slug: 'nad-plus-therapy',  label: 'NAD+ Therapy' },
                { slug: 'hangover-recovery', label: 'Hangover Recovery' },
                { slug: 'myers-cocktail',    label: 'Myers Cocktail' },
                { slug: 'immune-support',    label: 'Immune Support' },
                { slug: 'beauty-glow',       label: 'Beauty Glow' },
                { slug: 'hydration',         label: 'Hydration Drip' },
                { slug: 'energy-boost',      label: 'Energy Boost' },
                { slug: 'athletic-recovery', label: 'Athletic Recovery' },
              ].map((t) => (
                <Link
                  key={t.slug}
                  href={`/treatments/${t.slug}`}
                  className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-wellness-300 hover:shadow-md transition-all text-center"
                >
                  <span className="font-bold text-slate-900 text-sm">{t.label}</span>
                </Link>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3 items-center">
              <span className="text-sm font-bold text-slate-500">Plus reference guides:</span>
              <Link href="/guide/iv-therapy-cost-guide" className="text-sm font-bold text-wellness-600 hover:text-wellness-700">Cost guide</Link>
              <span className="text-slate-300">·</span>
              <Link href="/guide/how-to-choose-iv-therapy-clinic" className="text-sm font-bold text-wellness-600 hover:text-wellness-700">How to choose a clinic</Link>
              <span className="text-slate-300">·</span>
              <Link href="/guide/first-time-iv-therapy-what-to-expect" className="text-sm font-bold text-wellness-600 hover:text-wellness-700">First-time guide</Link>
              <span className="text-slate-300">·</span>
              <Link href="/guide/mobile-iv-therapy-vs-clinic" className="text-sm font-bold text-wellness-600 hover:text-wellness-700">Mobile vs in-clinic</Link>
            </div>
          </div>
        </section>

        {/* 7. FAQ section */}
        <div className="-mx-6 mb-24">
          <FAQSection faqs={faqs} title={`${cityData.name} IV Therapy FAQ`} />
        </div>

        {/* 8. Editorial guides for this city — internal-link module so authority
            flows between the guide cluster and the geo cluster (Canadian pages only). */}
        {cityIsCanadian && (
          <div className="mb-24">
            <RelatedGuides citySlug={cityData.slug || slug} cityName={cityData.name} />
          </div>
        )}

        {/* 9. Helpful Resources and related cities */}
        {nearbyCities.length > 0 && (
          <div className="-mx-6 mb-24">
            <NearbyCities cities={nearbyCities} currentState={cityData.state || ''} />
          </div>
        )}

        {/* 9. Find IV Therapy Clinics Near You CTA button */}
        <div className="flex justify-center mt-12 mb-20">
          <Link 
            href="/search"
            className="inline-flex items-center gap-3 bg-wellness-600 text-white px-10 py-5 rounded-[2rem] text-lg font-black hover:bg-wellness-700 transition-all shadow-xl shadow-wellness-200/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            Find IV Therapy Clinics Near You
            <ArrowRight size={24} />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
