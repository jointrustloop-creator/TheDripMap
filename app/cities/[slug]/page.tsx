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
import { getCityBySlug, getListingsByCity, getAllCities } from '@/src/lib/data';
import { getCityIntro } from '@/src/lib/city-intros';
import { MapTrigger } from '@/src/components/MapTrigger';
import { FAQSection } from '@/src/components/FAQSection';
import { NearbyCities } from '@/src/components/NearbyCities';

export const revalidate = 3600;
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

  const title = cityData?.meta_title?.replace('{count}', String(count)) || `IV Therapy in ${name} — ${count} Top-Rated Clinics Near You | TheDripMap`;
  const description = cityData?.meta_description?.replace('{count}', String(count)) || `Find and compare ${count} IV therapy clinics in ${name}. Read reviews, compare prices, and book hangover recovery, NAD+, immune support and hydration drips near you.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.thedripmap.com/cities/${slug}`,
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
  const listings = await getListingsByCity(cityData.name, cityData.state || '');
  const count = listings.length;

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

        {/* 1. H1 city name */}
        <section className="mt-12 mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            IV Therapy in {cityData.name} — {count} {count === 1 ? 'Clinic' : 'Clinics'} Near You
          </h1>
        </section>

        {/* 2. Stats bar (verified providers count, quick map view) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold border border-wellness-100 shadow-sm">
            <MapPin size={16} />
            <span>{count} providers in {cityData.name}</span>
          </div>
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
          <ListingController 
            initialProviders={listings} 
            cityName={cityData.name} 
          />
        )}

        {/* 5. Match quiz CTA block */}
        <QuizCTA 
          className="mb-24"
          title={`Looking for specific results in ${cityData.name}?`}
          subtitle={`Not all IV protocols are equal. We match you based on your exact wellness goals and the specific offerings of verified ${cityData.name} clinics.`}
        />

        {/* 6. SEO content (all the written content about IV therapy in the city) */}
        {cityData.content ? (
          <section className="mb-24">
            <div className="prose prose-lg max-w-none prose-slate prose-headings:font-black prose-headings:tracking-tight prose-a:text-wellness-600 prose-a:no-underline hover:prose-a:underline bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <ReactMarkdown>
                {String(cityData.content).replace(/\\n/g, '\n')}
              </ReactMarkdown>
            </div>
          </section>
        ) : (
          <section className="mb-24 bg-white p-12 rounded-[3.5rem] border border-slate-100">
            <p className="text-slate-500 italic text-center">Comprehensive hydration guides for {cityData.name} are currently being updated.</p>
          </section>
        )}

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
