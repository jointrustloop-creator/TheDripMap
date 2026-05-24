import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import { Navbar } from '@/src/components/Navbar';
import { Footer } from '@/src/components/Footer';
import { BreadcrumbNav } from '@/src/components/BreadcrumbNav';
import { getAllCities, slugify } from '@/src/lib/data';

const citiesTitle = 'Cities Archive - Browse IV Therapy Locations | TheDripMap';
const citiesDescription = 'Explore our complete directory of cities providing IV therapy. Find top-rated clinics and mobile services across the United States.';
const citiesOgImage = 'https://www.thedripmap.com/og-image.png';

export const metadata: Metadata = {
  title: citiesTitle,
  description: citiesDescription,
  alternates: { canonical: 'https://www.thedripmap.com/cities' },
  openGraph: {
    title: citiesTitle,
    description: citiesDescription,
    url: 'https://www.thedripmap.com/cities',
    type: 'website',
    siteName: 'TheDripMap',
    images: [{ url: citiesOgImage, width: 1200, height: 630, alt: 'TheDripMap' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: citiesTitle,
    description: citiesDescription,
    images: [citiesOgImage],
  },
};

export const revalidate = 3600;

export default async function CitiesHubPage() {
  const providerCities = await getAllCities();
  
  // Create a display-ready list of cities with fallbacks for slug and state
  const cities = providerCities.map(pc => ({
    name: pc.city,
    slug: slugify(pc.city),
    state: pc.state || 'Ontario', // Default for Toronto/GTA if unknown
    displayCount: pc.count
  })).sort((a, b) => b.displayCount - a.displayCount);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <BreadcrumbNav 
          items={[
            { label: 'Cities', href: '/cities' }
          ]} 
        />

        <section className="mt-12 mb-20 text-center max-w-2xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Find IV Therapy <span className="text-wellness-600">By City</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Browse our directory of {cities.length} cities with active, verified IV therapy providers.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <Link 
              key={city.slug}
              href={`/cities/${city.slug}`}
              className="group bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-wellness-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-wellness-50 flex items-center justify-center text-wellness-600 group-hover:bg-wellness-600 group-hover:text-white transition-colors duration-300">
                    <MapPin size={24} />
                  </div>
                  <div className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {city.displayCount} Listings
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-wellness-600 transition-colors">
                  {city.name}
                </h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-6">
                  {city.state || 'United States'}
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-wellness-600 font-black text-sm uppercase tracking-widest">
                <span>Browse Providers</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {cities.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
            <div className="text-slate-300 mb-4 flex justify-center">
              <MapPin size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No cities found</h3>
            <p className="text-slate-500">We are currently updating our city directory. Please check back soon.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
