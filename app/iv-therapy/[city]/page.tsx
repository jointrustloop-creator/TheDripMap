import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  MapPin,
  ArrowRight
} from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { ProviderCard } from '../../../src/components/ProviderCard';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { CityGrid } from '../../../src/components/CityGrid';
import { getListingsByCity, getAllCities, slugify, getCityData } from '../../../src/lib/data';
import { Provider } from '../../../src/types';

interface CityDataSub {
  city: string;
  state: string;
  stateAbbr: string;
  count: number;
}

export const revalidate = 0;

interface LocationPageProps {
  params: Promise<{
    city: string; // This handles both city and state slugs
  }>;
  searchParams: Promise<{
    service?: string;
  }>;
}

// Helper to determine if a slug is a state or a city
async function getLocationInfo(slug: string) {
  const cities = await getAllCities();
  const s = slug.toLowerCase();
  
  // 1. Try to find as a city slug
  const cityMatch = cities.find(c => slugify(c.city) === s);
  if (cityMatch) return { type: 'city', data: cityMatch };
  
  // 2. Try to find as a state slug
  const stateMatch = cities.find(c => slugify(c.state) === s || c.stateAbbr.toLowerCase() === s);
  if (stateMatch) {
    const stateName = stateMatch.state;
    const stateCities = cities.filter(c => slugify(c.state) === s || c.stateAbbr.toLowerCase() === s);
    return { type: 'state', name: stateName, cities: stateCities };
  }

  // 3. Inference Fallback (for SEO resiliency)
  const cityName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return { type: 'city', data: { city: cityName, state: '', stateAbbr: '', count: 0 }, inferred: true };
}

export async function generateStaticParams() {
  const cities = await getAllCities();
  const cityParams = cities.map(c => ({ city: slugify(c.city) }));
  const stateParams = Array.from(new Set(cities.map(c => slugify(c.state)))).map(s => ({ city: s }));
  
  return [...cityParams, ...stateParams];
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { city } = await params;
  const location = await getLocationInfo(city);
  
  if (location.type === 'state') {
    return {
      title: `Best IV Therapy in ${location.name} | Top Rated Clinics by City | TheDripMap`,
      description: `Find the best IV therapy clinics across ${location.name}. Compare top-rated providers in major cities and book your hydration treatment today.`,
    };
  }

  const cityInfo = location.data as CityDataSub;
  const cityData = await getCityData(city);
  const cityName = cityInfo.city;
  const count = cityData?.listings_count || cityInfo.count;

  const title = cityData?.meta_title || `IV Therapy in ${cityName} — ${count} Verified Providers | TheDripMap`;
  const description = cityData?.meta_description || `Find and compare ${count} IV therapy clinics in ${cityName}. Read reviews, compare prices, and book top-rated hydration and wellness drips.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/iv-therapy/${city}`,
    },
  };
}

export default async function LocationPage({ params, searchParams }: LocationPageProps) {
  const { city: slug } = await params;
  const { service } = await searchParams;
  const location = await getLocationInfo(slug);

  if (!location) notFound();

  // Handle State View
  if (location.type === 'state') {
    return (
      <div className="min-h-screen bg-[#FDFDFB]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-12">
          <BreadcrumbNav items={[{ label: 'IV Therapy', href: '/search' }, { label: location.name! }]} />
          <section className="mb-16 mt-8">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight tracking-tight">
              IV Therapy in <span className="text-wellness-600">{location.name}</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-3xl leading-relaxed">
              Browse the best IV therapy providers across {location.name}. Select a city below to find top-rated clinics, mobile services, and specialized wellness treatments near you.
            </p>
          </section>
          <CityGrid cities={location.cities!} title={`Browse ${location.name} Cities`} />
        </main>
        <Footer />
      </div>
    );
  }

  const cityInfo = location.data as CityDataSub;
  const cityData = await getCityData(slug);
  const cityName = cityInfo.city;
  const stateName = (cityData?.state as string) || (cityInfo.state as string);
  
  let listings: Provider[] = await getListingsByCity(cityName, stateName);
  if (service) {
    const s = service.toLowerCase();
    listings = listings.filter(l => 
      (l.specialties || []).some(specialty => specialty.toLowerCase().includes(s)) ||
      l.name.toLowerCase().includes(s)
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <BreadcrumbNav 
          items={[
            { label: 'IV Therapy', href: '/search' },
            { label: cityName }
          ]} 
        />

        <section className="mb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-wellness-100">
              <MapPin size={16} />
              <span>{cityData?.listings_count || listings.length} verified providers in {cityName}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Best {service ? <span className="text-wellness-600">{service} </span> : ''}IV Therapy in <span className="text-wellness-600">{cityName}</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-10">
              Compare {listings.length} top-rated {service ? service + ' ' : ''}IV therapy clinics and mobile services in {cityName}. Find the perfect hydration, energy, or recovery drip today.
            </p>
          </div>
        </section>

        <section className="mb-24">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-12">Top Rated Clinics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </section>

        {/* 3. Hub CTA */}
        <div className="flex justify-center mt-12 mb-20">
          <Link 
            href={`/cities/${slug}`}
            className="inline-flex items-center gap-3 bg-wellness-50 text-wellness-700 px-10 py-5 rounded-[2rem] text-lg font-black hover:bg-wellness-100 transition-all border border-wellness-100 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            Learn more about IV therapy in {cityName}
            <ArrowRight size={24} className="text-wellness-600" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
