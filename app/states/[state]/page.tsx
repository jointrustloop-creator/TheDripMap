import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ArrowRight, Building2 } from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { FAQSection } from '../../../src/components/FAQSection';
import { QuizCTA } from '../../../src/components/QuizCTA';
import { STATES, getStateBySlug } from '../../../src/lib/states';
import { getListingsByState, slugify } from '../../../src/lib/data';

export const revalidate = 3600;
export const dynamicParams = false;

const SITE_URL = 'https://www.thedripmap.com';

export async function generateStaticParams() {
  return STATES.map((s) => ({ state: s.slug }));
}

interface StatePageProps {
  params: Promise<{ state: string }>;
}

export default async function StatePage({ params }: StatePageProps) {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) notFound();

  const providers = await getListingsByState(state.name);
  const total = providers.length;

  const cityMap = new Map<string, number>();
  providers.forEach((p) => {
    if (p.city) cityMap.set(p.city, (cityMap.get(p.city) || 0) + 1);
  });
  const cities = Array.from(cityMap.entries())
    .map(([city, count]) => ({ city, count, slug: slugify(city) }))
    .sort((a, b) => b.count - a.count);

  const cityCount = cities.length;
  const topCityNames = cities.slice(0, 3).map((c) => c.city);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `IV Therapy Cities in ${state.name}`,
    numberOfItems: cities.length,
    itemListElement: cities.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/cities/${c.slug}`,
      name: `${c.city}, ${state.abbr}`,
    })),
  };

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `IV Therapy in ${state.name}`,
    description: `Matching platform for ${total} IV therapy clinics across ${cityCount} cities in ${state.name}.`,
    url: `${SITE_URL}/states/${state.slug}`,
    isPartOf: { '@type': 'WebSite', name: 'TheDripMap', url: SITE_URL },
  };

  // Real, per-state signals so the cost + mobile answers differ by state instead
  // of repeating a shared template. Mobile detection mirrors the data layer.
  const stMobileCount = providers.filter((c) => {
    if (c.mobile_service) return true;
    const ty = (c.type || '').toLowerCase();
    if (ty === 'mobile' || ty === 'both') return true;
    const blob = [c.category, (c.specialties || []).join(' '), (c.subtypes || []).join(' '), c.description].join(' ').toLowerCase();
    return blob.includes('mobile') || blob.includes('in-home') || blob.includes('at-home') || blob.includes('concierge');
  }).length;
  const stTopCity = cities[0];

  const faqs = [
    {
      question: `How many IV therapy clinics are in ${state.name}?`,
      answer: `TheDripMap lists ${total} IV therapy clinics across ${cityCount} cities in ${state.name}, including providers in ${topCityNames.join(', ')}, and more.`,
    },
    {
      question: `What does IV therapy cost in ${state.name}?`,
      answer: `Across the ${total} ${state.name} ${total === 1 ? 'clinic' : 'clinics'} listed, each sets its own pricing. Most standard hydration and wellness drips run $150 to $300, and higher-dose options like NAD+ start around $400.${stTopCity ? ` ${stTopCity.city} has the most listings with ${stTopCity.count}.` : ''} Confirm current pricing with the clinic.`,
    },
    {
      question: `Are mobile IV therapy services available in ${state.name}?`,
      answer: stMobileCount > 0
        ? `${stMobileCount} of the ${total} IV therapy ${total === 1 ? 'clinic' : 'clinics'} in ${state.name} offer mobile or in-home service, bringing the drip to your home, office, or hotel. Open a city page and filter by "Mobile Service" to find them.`
        : `Most ${state.name} clinics work from a physical location. Check individual city pages for any mobile or in-home options.`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <BreadcrumbNav
          items={[
            { label: 'States', href: '/states' },
            { label: state.name },
          ]}
        />

        <section className="mt-12 mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            IV Therapy in {state.name} — {total} {total === 1 ? 'Clinic' : 'Clinics'}
          </h1>
        </section>

        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
          <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold border border-wellness-100 shadow-sm">
            <MapPin size={16} />
            <span>{total} providers across {cityCount} {cityCount === 1 ? 'city' : 'cities'}</span>
          </div>
        </div>

        <section className="mb-16 max-w-4xl">
          <p className="text-lg text-slate-600 leading-relaxed">
            Compare {total} IV therapy clinics across {state.name}. From hydration drips to NAD+ and beauty protocols, find top-rated providers in {topCityNames.join(', ')} and {cityCount > 3 ? `${cityCount - 3} more ${cityCount - 3 === 1 ? 'city' : 'cities'}` : 'beyond'}. Read reviews, see pricing, and book your session, in-clinic or mobile.
          </p>
        </section>

        {cities.length > 0 ? (
          <section className="mb-24">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Cities in {state.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/cities/${c.slug}`}
                  className="group bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-wellness-200 hover:shadow-xl transition-all flex flex-col"
                >
                  <div className="w-12 h-12 rounded-2xl bg-wellness-50 text-wellness-600 flex items-center justify-center mb-5">
                    <Building2 size={22} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-wellness-600 transition-colors mb-2">{c.city}</h3>
                  <p className="text-sm font-bold text-slate-500 mb-4">
                    {c.count} {c.count === 1 ? 'provider' : 'providers'}
                  </p>
                  <span className="mt-auto text-wellness-600 font-black text-xs flex items-center gap-1.5">
                    View Clinics <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-24 bg-white p-12 rounded-[3rem] border border-slate-100 text-center">
            <p className="text-slate-500 italic">No IV therapy clinics found in {state.name} yet. Check back soon as we expand our matching platform.</p>
          </section>
        )}

        <QuizCTA
          className="mb-24"
          title={`Not sure which clinic in ${state.name} is right for you?`}
          subtitle={`Take our free 60-second quiz and we'll match you with the best IV therapy clinic in ${state.name} for your specific goals.`}
        />

        <FAQSection faqs={faqs} title={`${state.name} IV Therapy FAQ`} />
      </main>

      <Footer />
    </div>
  );
}
