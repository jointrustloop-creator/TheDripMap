import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { getCityBySlug, getListingsByCity } from '../../../src/lib/data';

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

  // Fallback if no specific city record exists but we might have listings
  if (!cityData) {
    // Basic reconstruction from slug for the UI
    const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    // We'll check if listings actually exist below
    cityData = {
      name,
      slug,
      state: '',
      content: null,
      meta_title: null,
      meta_description: null
    };
  }

  // Fetch actual count for the badge and to verify existence
  const listings = await getListingsByCity(cityData.name, cityData.state || '');
  const count = listings.length;

  // If no listings and no city record, then truly not found
  if (count === 0 && !cityData.id) {
    notFound();
  }

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
        <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold mb-12 border border-wellness-100">
          <MapPin size={16} />
          <span>{count} verified providers in {cityData.name}</span>
        </div>

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
