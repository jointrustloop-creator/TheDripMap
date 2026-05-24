import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { BreadcrumbNav } from '../../src/components/BreadcrumbNav';
import { GUIDES } from '../../src/lib/guides';

export const revalidate = 86400;

const SITE_URL = 'https://www.thedripmap.com';

const title = 'IV Therapy Guides — Cost, How to Choose, What to Expect | TheDripMap';
const description = 'In-depth guides to IV therapy: how to choose a clinic, what treatments cost, what to expect on your first visit, and how IV compares to oral supplements.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/guide` },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/guide`,
    type: 'website',
    siteName: 'TheDripMap',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'IV Therapy Guides' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function GuidesIndexPage() {
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'IV Therapy Guides',
    numberOfItems: GUIDES.length,
    itemListElement: GUIDES.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/guide/${g.slug}`,
      name: g.title,
    })),
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <BreadcrumbNav items={[{ label: 'Guides' }]} />

        <section className="mt-12 mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            IV Therapy Guides
          </h1>
        </section>

        <section className="mb-16 max-w-3xl">
          <p className="text-lg text-slate-600 leading-relaxed">
            Practical guides for anyone researching, comparing, or trying IV therapy for the first time. Written for patients, not other clinicians.
          </p>
        </section>

        <section className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-6">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guide/${g.slug}`}
              className="group bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-wellness-200 hover:shadow-xl transition-all flex flex-col"
            >
              <div className="w-12 h-12 rounded-2xl bg-wellness-50 text-wellness-600 flex items-center justify-center mb-5">
                <BookOpen size={22} />
              </div>
              <h3 className="text-xl font-black text-slate-900 group-hover:text-wellness-600 transition-colors mb-3 leading-tight">{g.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-3">{g.metaDescription}</p>
              <span className="mt-auto text-wellness-600 font-black text-xs flex items-center gap-1.5">
                Read Guide <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
