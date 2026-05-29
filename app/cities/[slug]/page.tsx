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
import { getCityBySlug, getListingsByCity, getAllCities, getListingsByState, getFeaturedListings, getBlogPostBySlug } from '@/src/lib/data';
import { getCityIntro } from '@/src/lib/city-intros';
import { MapTrigger } from '@/src/components/MapTrigger';
import { FAQSection } from '@/src/components/FAQSection';
import { NearbyCities } from '@/src/components/NearbyCities';

// Short revalidate so listings_count / new providers propagate within ~1 minute.
// Reverted from a brief force-dynamic experiment that was never actually deployed
// (Vercel build pipeline was stuck — see commit history around 2026-05-25).
export const revalidate = 60;
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
  const cityData = await getCityBySlug(slug);
  
  let name = '';
  let state = '';
  
  if (cityData) {
    name = cityData.name;
    state = cityData.state || '';
  } else {
    // Fallback: convert slug to title case (e.g. "san-diego" -> "San Diego")
    name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Fetch actual count for accurate metadata
  const listings = await getListingsByCity(name, state);
  const count = listings.length;

  if (count === 0 && !cityData) {
    return { title: 'City Not Found' };
  }

  // Unified city title format — applies to every city page so the SERP feels
  // consistent and patient-friendly. Per-city description overrides still win
  // (city-intros.ts can shape the meta description for high-traffic pages),
  // but the title itself is locked to "IV Therapy in {City}, {State} ({Year}) |
  // {N} Verified Clinics" — highest-ROI traffic format per the playbook.
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
  const title = `IV Therapy in ${cityStateLabel} (${titleYear}) | ${count} Verified Clinics`;
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
  let cityData = await getCityBySlug(slug);

  // If no city record was found in the 'cities' table or mock data
  if (!cityData) {
    // Check if we can reconstruction from slug as a last resort before 404
    // Only if it looks like a valid-ish city slug
    const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const listings = await getListingsByCity(name);
    
    if (listings.length > 0) {
      cityData = {
        id: `fallback-${slug}`,
        name,
        slug,
        state: '',
        content: null,
        meta_title: null,
        meta_description: null
      };
    } else {
      notFound();
    }
  }

  // Fetch actual listings for display
  let listings = await getListingsByCity(cityData.name, cityData.state || '');
  const exactCityCount = listings.length;

  // Tiered fallback so a small/empty city never shows 0 cards:
  // 1) widen to state-level top-rated
  // 2) if still under 3, broaden to nationwide featured/top-rated
  // The page passes a "broadened" flag down so the UI can communicate the
  // expansion (banner) instead of silently swapping providers.
  let isBroadened = false;
  let broadenedScope: 'state' | 'national' | null = null;
  if (exactCityCount < 3 && cityData.state) {
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
  if (listings.length < 3) {
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

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
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
            IV Therapy in {cityData.name}
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium mt-3">
            Compare {count} {count === 1 ? 'clinic' : 'clinics'} — in-clinic and mobile
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
                Looking for IV therapy in {cityData.name}? Compare {count === 1 ? '1 top-rated clinic' : `${count} top-rated clinics`} offering hydration drips, NAD+, immune support, hangover recovery, and beauty treatments. Read reviews, see prices, and book your session — in-clinic or mobile, whichever you prefer.
              </p>
            </section>
          );
        })()}

        {/* 4. Verified Providers listings grid */}
        {listings.length > 0 && (
          <>
            {isBroadened && (
              <div className="mb-8 bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-amber-900 mb-1">
                    {exactCityCount === 0
                      ? `No clinics in ${cityData.name} yet — showing top-rated ${broadenedScope === 'state' ? `in ${cityData.state}` : 'nearby'}.`
                      : `Only ${exactCityCount} clinic${exactCityCount === 1 ? '' : 's'} in ${cityData.name} — adding more from ${broadenedScope === 'state' ? cityData.state : 'nearby'} so you have options.`}
                  </p>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Mobile IV providers in some listings will travel — check the clinic page for service area.
                  </p>
                </div>
              </div>
            )}
            <ListingController
              initialProviders={listings}
              cityName={cityData.name}
            />
          </>
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
              Most {cityData.name} clinics offer these popular treatment protocols. Tap any drip for the full breakdown — benefits, who it&apos;s for, cost, and how to find a provider near you.
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
