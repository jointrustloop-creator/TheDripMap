import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
import { Navbar } from '@/src/components/Navbar';
import { Footer } from '@/src/components/Footer';
import { BreadcrumbNav } from '@/src/components/BreadcrumbNav';
import { QuizCTA } from '@/src/components/QuizCTA';
import { ListingController } from '@/src/components/ListingController';
import { getCityBySlug, getListingsByCity, getAllCities, getListingsByState, getFeaturedListings, getBlogPostBySlug, slugify, getTorontoGtaTieredListings } from '@/src/lib/data';
import { SupabaseUnreachableError } from '@/src/lib/supabase-health';
import { TemporarilyUnavailable } from '@/src/components/TemporarilyUnavailable';
import { getCityIntro } from '@/src/lib/city-intros';
import { MapTrigger } from '@/src/components/MapTrigger';
import { FAQSection } from '@/src/components/FAQSection';
import { NearbyCities } from '@/src/components/NearbyCities';

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

  // Fetch actual count for accurate metadata
  let listings = await getListingsByCity(name, state);
  // Slug-aware fallback: catches DB city strings the naive reconstruction
  // can't produce (e.g. "Whitchurch-Stouffville" preserves dash, "St. Petersburg"
  // preserves period). slugify("Whitchurch-Stouffville") === "whitchurch-stouffville".
  if (listings.length === 0 && !cityData) {
    const all = await getAllCities();
    const match = all.find((c) => slugify(c.city) === slug);
    if (match) {
      name = match.city;
      state = match.state || match.stateAbbr || '';
      listings = await getListingsByCity(name, state);
    }
  }
  const count = listings.length;

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
  const title = `IV Therapy in ${cityStateLabel} (${titleYear}) | ${count} Clinics`;
  const description =
    intro?.metaDescription ||
    cityData?.meta_description?.replace('{count}', String(count)) ||
    `Find and compare ${count} IV therapy clinics in ${name}. Read reviews, compare prices, and book hangover recovery, NAD+, immune support and hydration drips near you.`;

  return {
    title,
    description,
    alternates: {
      // Point at the resolved city's canonical slug so case/variant URLs
      // (e.g. /cities/New-York) dedupe to the one true /cities/new-york.
      canonical: `https://www.thedripmap.com/cities/${cityData?.slug || slug}`,
    },
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
    let listings = await getListingsByCity(name);

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
        listings = await getListingsByCity(name, resolvedState);
      }
    }

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

  // Fetch actual listings for display
  let listings = isToronto
    ? [...torontoCore, ...torontoNearby]
    : await getListingsByCity(cityData.name, cityData.state || '');
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
    const featured = await getFeaturedListings(24);
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

  const faqs = [
    {
      question: `How many IV therapy clinics are in ${cityData.name}?`,
      answer: `There are currently ${count} IV therapy providers in ${cityData.name} listed on TheDripMap, including both clinic locations and mobile services.`
    },
    {
      question: `Do clinics in ${cityData.name} offer mobile services?`,
      answer: `Yes, many providers in ${cityData.name} offer mobile IV therapy where medical professionals bring treatments directly to your home, office, or hotel. You can identify these by looking for the "Mobile Service" badge in the listings.`
    },
    {
      question: `What is the average cost of IV therapy in ${cityData.name}?`,
      answer: `While prices vary by provider and specific protocol, most standard hydration and wellness drips in ${cityData.name} range from $150 to $300. Specialized treatments like NAD+ therapy typically start at $500.`
    }
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  // BreadcrumbList JSON-LD — mirrors the visible <BreadcrumbNav> so search
  // engines and AI assistants can place the city page in the site hierarchy.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.thedripmap.com/' },
      { '@type': 'ListItem', position: 2, name: 'Cities', item: 'https://www.thedripmap.com/cities' },
      { '@type': 'ListItem', position: 3, name: cityData.name, item: `https://www.thedripmap.com/cities/${cityData.slug || slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <BreadcrumbNav
          items={[
            { label: 'Cities', href: '/cities' },
            { label: cityData.name }
          ]}
        />

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
        </section>

        {/* 2. Quick map view trigger */}
        <div className="flex justify-end mb-8">
          <MapTrigger />
        </div>

        {/* 3. Intro paragraph */}
        {(() => {
          const intro = getCityIntro(slug);
          if (intro) {
            return (
              <section className="mb-12 max-w-4xl space-y-4">
                <p className="text-lg text-slate-600 leading-relaxed">{intro.localContext}</p>
                <p className="text-lg text-slate-600 leading-relaxed">
                  With {count} {count === 1 ? 'clinic' : 'clinics'} in {cityData.name}, popular treatments include {intro.popularTreatments.join(', ')}. {intro.pricing}
                </p>
              </section>
            );
          }
          return (
            <section className="mb-12 max-w-4xl">
              <p className="text-lg text-slate-600 leading-relaxed">
                Looking for IV therapy in {cityData.name}? Compare {count === 1 ? '1 top-rated clinic' : `${count} top-rated clinics`} offering hydration drips, NAD+, immune support, hangover recovery, and beauty treatments. Read reviews, see prices, and book your session in-clinic or mobile, whichever you prefer.
              </p>
            </section>
          );
        })()}

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
                  initialProviders={torontoCore}
                  cityName={cityData.name}
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
                  initialProviders={torontoNearby}
                  cityName={cityData.name}
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
                initialProviders={listings}
                cityName={cityData.name}
              />
            </>
          )
        )}

        {/* 5. Match quiz CTA block */}
        <QuizCTA
          className="mb-24"
          title="Not sure which clinic is right for you?"
          subtitle={`Answer 5 quick questions and we'll match you to the best IV therapy clinic in ${cityData.name}.`}
        />

        {/* 6. SEO content (all the written content about IV therapy in the city) */}
        {cityData.content ? (
          <section className="mb-24">
            <div className="prose prose-lg max-w-none prose-slate prose-headings:font-black prose-headings:tracking-tight prose-a:text-wellness-600 prose-a:no-underline hover:prose-a:underline bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <ReactMarkdown>
                {String(cityData.content)
                  .replace(/\\n/g, '\n')
                  .replace(/\{count\}/g, String(count))
                  .replace(/\{city\}/g, cityData.name)}
              </ReactMarkdown>
            </div>
          </section>
        ) : (
          <section className="mb-24 bg-white p-12 rounded-[3.5rem] border border-slate-100">
            <p className="text-slate-500 italic text-center">Comprehensive hydration guides for {cityData.name} are currently being updated.</p>
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

        {/* 8. Helpful Resources and related cities */}
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
