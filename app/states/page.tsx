import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { BreadcrumbNav } from '../../src/components/BreadcrumbNav';
import { STATES } from '../../src/lib/states';
import { getListingsByState } from '../../src/lib/data';

export const revalidate = 3600;

const SITE_URL = 'https://www.thedripmap.com';

const title = 'IV Therapy by State — Browse Clinics in Florida, NY, TX, CA & More | TheDripMap';
const description = 'Browse IV therapy clinics by state. Find top-rated providers across Florida, New York, Texas, California, Virginia, and Ontario.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/states` },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/states`,
    type: 'website',
    siteName: 'TheDripMap',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'IV Therapy by State' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default async function StatesIndexPage() {
  const stateCounts = await Promise.all(
    STATES.map(async (s) => {
      const providers = await getListingsByState(s.name);
      return { ...s, count: providers.length };
    })
  );

  const sortedStates = stateCounts.sort((a, b) => b.count - a.count);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'IV Therapy by State',
    numberOfItems: STATES.length,
    itemListElement: sortedStates.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/states/${s.slug}`,
      name: s.name,
    })),
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <BreadcrumbNav items={[{ label: 'States' }]} />

        <section className="mt-12 mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            IV Therapy by State
          </h1>
        </section>

        <section className="mb-16 max-w-3xl">
          <p className="text-lg text-slate-600 leading-relaxed">
            Browse IV therapy clinics by state. Find top-rated providers across the United States and Canada.
          </p>
        </section>

        <section className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedStates.map((s) => (
              <Link
                key={s.slug}
                href={`/states/${s.slug}`}
                className="group bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-wellness-200 hover:shadow-xl transition-all flex flex-col"
              >
                <div className="w-12 h-12 rounded-2xl bg-wellness-50 text-wellness-600 flex items-center justify-center mb-5">
                  <MapPin size={22} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-wellness-600 transition-colors mb-2">{s.name}</h3>
                <p className="text-sm font-bold text-slate-500 mb-4">
                  {s.count} {s.count === 1 ? 'clinic' : 'clinics'}
                </p>
                <span className="mt-auto text-wellness-600 font-black text-xs flex items-center gap-1.5">
                  Browse Clinics <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
