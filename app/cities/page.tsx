import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { Navbar } from '@/src/components/Navbar';
import { Footer } from '@/src/components/Footer';
import { BreadcrumbNav } from '@/src/components/BreadcrumbNav';
import { getAllCities, slugify } from '@/src/lib/data';
import { getCityPhoto, getCityGradient, getCityInitial } from '@/src/lib/city-images';

const citiesTitle = 'Cities Archive — Browse IV Therapy Locations | TheDripMap';
const citiesDescription =
  'Explore our complete directory of cities providing IV therapy. Find top-rated clinics and mobile services across the US and Canada.';
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

  const cities = providerCities
    .map((pc) => ({
      name: pc.city,
      slug: slugify(pc.city),
      state: pc.state || 'Ontario',
      count: pc.count,
    }))
    .sort((a, b) => b.count - a.count);

  const totalProviders = cities.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <BreadcrumbNav items={[{ label: 'Cities', href: '/cities' }]} />

        <section className="mt-12 mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6 border border-wellness-100">
            <Sparkles size={14} />
            {cities.length} cities · {totalProviders.toLocaleString()} clinics
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.95]">
            Find IV Therapy{' '}
            <span className="bg-gradient-to-r from-wellness-600 to-emerald-500 bg-clip-text text-transparent">
              by city
            </span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Browse every city in our directory. Tap any card for clinics, reviews, prices, and instant booking.
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city, idx) => {
            const photo = getCityPhoto(city.slug);
            const gradient = getCityGradient(city.slug);
            const initials = getCityInitial(city.name);
            // Top 3 by provider count get a bigger card on lg+ for visual rhythm.
            // Easy way to highlight your strongest markets without manual config.
            const isFeatured = idx < 3;

            return (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className={`group relative overflow-hidden rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 ${
                  isFeatured ? 'lg:col-span-1 aspect-[4/5]' : 'aspect-[4/5]'
                }`}
              >
                {/* Background: photo if curated, gradient otherwise */}
                {photo ? (
                  <>
                    <Image
                      src={photo}
                      alt={`${city.name} skyline`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-[1500ms] ease-out"
                      unoptimized
                    />
                    {/* Dark gradient overlay for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-wellness-600/0 to-wellness-600/0 group-hover:from-wellness-600/30 group-hover:to-transparent transition-all duration-500" />
                  </>
                ) : (
                  <>
                    {/* Gradient fallback with initials as visual anchor */}
                    <div className={`absolute inset-0 ${gradient}`} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white/15 font-black text-[12rem] leading-none tracking-tighter select-none">
                        {initials}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent" />
                  </>
                )}

                {/* Top right: listing count chip */}
                <div className="absolute top-5 right-5 z-10">
                  <div className="bg-white/95 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {city.count} {city.count === 1 ? 'clinic' : 'clinics'}
                  </div>
                </div>

                {/* Top left: state pill */}
                <div className="absolute top-5 left-5 z-10">
                  <div className="bg-slate-950/40 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em]">
                    {city.state}
                  </div>
                </div>

                {/* Bottom: city name + CTA */}
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-7 z-10 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-white/80">
                    <MapPin size={14} />
                    <span className="text-[11px] font-black uppercase tracking-[0.25em]">
                      IV Therapy
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-[0.95] drop-shadow-lg">
                    {city.name}
                  </h2>
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/20">
                    <span className="text-white font-black text-sm uppercase tracking-widest">
                      Browse providers
                    </span>
                    <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-wellness-600 group-hover:translate-x-1 transition-all">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {cities.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
            <div className="text-slate-300 mb-4 flex justify-center">
              <MapPin size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No cities found</h3>
            <p className="text-slate-500">
              We are currently updating our city directory. Please check back soon.
            </p>
          </div>
        )}

        {/* Subtle attribution row — Unsplash terms require credit somewhere */}
        <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-16">
          City photography courtesy of Unsplash contributors
        </p>
      </main>
      <Footer />
    </div>
  );
}
