import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Navbar } from '@/src/components/Navbar';
import { Footer } from '@/src/components/Footer';
import { BreadcrumbNav } from '@/src/components/BreadcrumbNav';
import UrgencyIndicator from '@/src/components/UrgencyIndicator';
import { QuizCTA } from '@/src/components/QuizCTA';
import { ProviderCard } from '@/src/components/ProviderCard';
import { getCityBySlug, getListingsByCity } from '@/src/lib/data';

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

  const title = cityData?.meta_title?.replace('{count}', String(count)) || `${name} IV Therapy — ${count} Verified Clinics | TheDripMap`;
  const description = cityData?.meta_description?.replace('{count}', String(count)) || `Find and compare ${count} top-rated IV therapy clinics and mobile services in ${name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.thedripmap.com/cities/${slug}`,
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
            {cityData.name}
          </h1>
        </section>

        {/* 2. Listings count badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold border border-wellness-100">
            <MapPin size={16} />
            <span>{count} verified providers in {cityData.name}</span>
          </div>
          <div className="flex items-center gap-2 text-wellness-600 font-bold text-sm bg-wellness-50 px-3 py-1 rounded-full border border-wellness-100">
            <span className="w-2 h-2 bg-wellness-500 rounded-full animate-pulse" />
            High demand in {cityData.name} this week
          </div>
        </div>

        <UrgencyIndicator city={cityData.name} />

        {/* 3. ReactMarkdown rendering of data.content */}
        {cityData.content ? (
          <section className="mb-12">
            <div className="prose prose-lg max-w-none prose-slate prose-headings:font-black prose-headings:tracking-tight prose-a:text-wellness-600 prose-a:no-underline hover:prose-a:underline bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {String(cityData.content).replace(/\\n/g, '\n')}
              </ReactMarkdown>
            </div>
          </section>
        ) : (
          <section className="mb-12 bg-white p-12 rounded-[3.5rem] border border-slate-100">
            <p className="text-slate-500 italic text-center">Comprehensive hydration guides for {cityData.name} are currently being updated.</p>
          </section>
        )}

        {/* List of Providers Section */}
        {listings.length > 0 && (
          <section className="mb-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinics in {cityData.name}</h2>
              <Link href="/search" className="text-sm font-bold text-wellness-600 hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          </section>
        )}

        <QuizCTA 
          className="mb-24"
          title={`Looking for specific results in ${cityData.name}?`}
          subtitle={`Not all IV protocols are equal. We match you based on your exact wellness goals and the specific offerings of verified ${cityData.name} clinics.`}
        />

        {/* 4. CTA button */}
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
