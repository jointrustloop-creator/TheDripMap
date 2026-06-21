import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { Navbar } from '@/src/components/Navbar';
import { Footer } from '@/src/components/Footer';
import { BreadcrumbNav } from '@/src/components/BreadcrumbNav';
import { getAllCities, slugify } from '@/src/lib/data';
import { marketOf } from '@/src/lib/market';

export const revalidate = 3600;

const SITE = 'https://www.thedripmap.com';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'IV Therapy Clinics in Canada | Browse by Province | TheDripMap',
    description:
      'Browse IV therapy clinics across Canada by province and city. TheDripMap is the matching platform that helps you find the right clinic for your goals, location, and budget.',
    alternates: { canonical: `${SITE}/canada` },
    openGraph: {
      title: 'IV Therapy Clinics in Canada',
      description: 'Browse IV therapy clinics across Canada by province and city on TheDripMap.',
      url: `${SITE}/canada`,
      type: 'website',
      siteName: 'TheDripMap',
      images: [`${SITE}/og-image.png`],
    },
  };
}

// Canonical province order; provinces with clinics not in this list are appended
// alphabetically so the page never drops a region that has data.
const PROVINCE_ORDER = [
  'Ontario', 'British Columbia', 'Alberta', 'Quebec', 'Manitoba', 'Saskatchewan',
  'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador', 'Prince Edward Island',
  'Northwest Territories', 'Yukon', 'Nunavut',
];

export default async function CanadaPage() {
  const allCities = await getAllCities();
  // Canadian cities with at least one clinic (real Supabase data only).
  const caCities = allCities.filter((c) => c.city && (c.count ?? 0) > 0 && marketOf({ state: c.state }) === 'CA');

  const byProvince = new Map<string, { city: string; slug: string; count: number }[]>();
  for (const c of caCities) {
    const prov = c.state || 'Other';
    const arr = byProvince.get(prov) || [];
    arr.push({ city: c.city, slug: slugify(c.city), count: c.count });
    byProvince.set(prov, arr);
  }
  for (const arr of byProvince.values()) arr.sort((a, b) => a.city.localeCompare(b.city));

  const provinces = [...byProvince.keys()].sort((a, b) => {
    const ia = PROVINCE_ORDER.indexOf(a);
    const ib = PROVINCE_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  const totalClinics = caCities.reduce((s, c) => s + (c.count || 0), 0);
  const totalCities = caCities.length;
  const totalProvinces = provinces.length;

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'IV therapy clinics in Canada by city',
    numberOfItems: totalCities,
    itemListElement: caCities.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.city,
      url: `${SITE}/cities/${slugify(c.city)}`,
    })),
  };
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'IV Therapy Clinics in Canada',
    description: `IV therapy clinics across ${totalCities} Canadian cities in ${totalProvinces} provinces, on TheDripMap.`,
    url: `${SITE}/canada`,
    isPartOf: { '@type': 'WebSite', name: 'TheDripMap', url: SITE },
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <BreadcrumbNav items={[{ label: 'Canada' }]} />

        <section className="mb-12 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">IV Therapy Clinics in Canada</h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            TheDripMap is the IV therapy matching platform for Canada. Browse {totalClinics.toLocaleString()} clinics listed across {totalCities} cities in {totalProvinces} provinces, then get matched to the right clinic for your goals, location, and budget in under 60 seconds.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/quiz" className="inline-flex items-center gap-2 bg-wellness-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-wellness-700 transition-all">
              Take the 60 second quiz <ArrowRight size={16} />
            </Link>
            <Link href="/search" className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold text-sm hover:border-wellness-300 transition-all">
              Explore all clinics
            </Link>
          </div>
        </section>

        {provinces.map((prov) => {
          const cities = byProvince.get(prov)!;
          const provTotal = cities.reduce((s, c) => s + c.count, 0);
          return (
            <section key={prov} className="mb-12">
              <div className="flex items-baseline justify-between mb-5 border-b border-slate-100 pb-3 gap-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{prov}</h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {cities.length} {cities.length === 1 ? 'city' : 'cities'} · {provTotal} {provTotal === 1 ? 'clinic' : 'clinics'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {cities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/cities/${c.slug}`}
                    className="flex items-center justify-between gap-2 px-4 py-3 bg-white border border-slate-100 rounded-2xl hover:border-wellness-200 hover:shadow-sm transition-all group"
                  >
                    <span className="text-sm font-bold text-slate-900 group-hover:text-wellness-700 transition-colors flex items-center gap-1.5 min-w-0">
                      <MapPin size={13} className="text-slate-300 group-hover:text-wellness-500 shrink-0" />
                      <span className="truncate">{c.city}</span>
                    </span>
                    <span className="text-[10px] font-black bg-slate-50 text-[#0F6E56] px-1.5 py-0.5 rounded-full shrink-0">{c.count}</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
      <Footer />
    </div>
  );
}
