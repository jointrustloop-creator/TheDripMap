import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { CityGrid } from '../../../src/components/CityGrid';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { getAllCities, slugify } from '../../../src/lib/data';

export const revalidate = 86400; // 24 hours

interface StatePageProps {
  params: Promise<{
    state: string;
  }>;
}

export async function generateStaticParams() {
  const cities = await getAllCities();
  const states = Array.from(new Set(cities.map(c => slugify(c.state)).filter(Boolean)));
  return states.map((state) => ({
    state,
  }));
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state } = await params;
  const cities = await getAllCities();
  const cityInState = cities.find(c => slugify(c.state) === state || c.stateAbbr.toLowerCase() === state);
  
  if (!cityInState) return { title: 'State Not Found' };

  const stateName = cityInState.state;

  return {
    title: `Best IV Therapy in ${stateName} | Top Rated Clinics by City | TheDripMap`,
    description: `Find the best IV therapy clinics across ${stateName}. Compare top-rated providers in major cities and book your hydration treatment today.`,
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { state } = await params;
  const allCities = await getAllCities();
  
  const stateCities = allCities.filter(c => slugify(c.state) === state || c.stateAbbr.toLowerCase() === state);
  
  if (stateCities.length === 0) notFound();

  const stateName = stateCities[0].state;

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <BreadcrumbNav 
          items={[
            { label: 'IV Therapy', href: '/search' },
            { label: stateName }
          ]} 
        />

        <section className="mb-16 mt-8">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            IV Therapy in <span className="text-wellness-600">{stateName}</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-3xl leading-relaxed">
            Browse the best IV therapy providers across {stateName}. Select a city below to find top-rated clinics, mobile services, and specialized wellness treatments near you.
          </p>
        </section>

        <CityGrid 
          cities={stateCities} 
          title={`Browse ${stateName} Cities`} 
        />
      </main>

      <Footer />
    </div>
  );
}
