import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ArrowRight, Sparkles, Activity, HelpCircle, Zap } from 'lucide-react';
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

  // Use intro for the preview — richer than metaDescription. Cap at ~240 chars.
  const guides = GUIDES.map((g) => ({
    slug: g.slug,
    title: g.title.split(' — ')[0],
    preview:
      g.intro.length > 240 ? g.intro.slice(0, 235).trim() + '…' : g.intro,
    sectionCount: g.sections.length,
    faqCount: g.faqs.length,
  }));

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <BreadcrumbNav items={[{ label: 'Guides' }]} />

        {/* Hero */}
        <section className="mt-12 mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6 border border-wellness-100">
            <BookOpen size={14} />
            Educational guides
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.95]">
            Everything to know{' '}
            <span className="bg-gradient-to-r from-wellness-600 to-emerald-500 bg-clip-text text-transparent">
              before your first drip.
            </span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Plain-language guides written for people deciding whether IV therapy is
            right for them — what to ask, what it costs, what credentials matter,
            and what to expect when you walk in.
          </p>
        </section>

        {/* Guide grid — first card is "Start here" hero */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
          {guides.map((g, idx) => (
            <Link
              key={g.slug}
              href={`/guide/${g.slug}`}
              className={`group bg-white border-2 border-slate-100 rounded-[2rem] p-8 md:p-10 hover:border-wellness-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col ${
                idx === 0
                  ? 'md:col-span-2 bg-gradient-to-br from-wellness-50 via-white to-amber-50/40 border-wellness-200'
                  : ''
              }`}
            >
              {idx === 0 && (
                <div className="inline-flex items-center gap-1.5 bg-wellness-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-5 self-start">
                  <Sparkles size={12} /> Start here
                </div>
              )}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-wellness-50 text-wellness-600 flex items-center justify-center shrink-0 group-hover:bg-wellness-600 group-hover:text-white transition-colors">
                  <BookOpen size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    className={`font-black text-slate-900 tracking-tight leading-tight mb-2 ${
                      idx === 0 ? 'text-3xl md:text-4xl' : 'text-2xl'
                    }`}
                  >
                    {g.title}
                  </h2>
                  <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <span>{g.sectionCount} sections</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span>{g.faqCount} FAQs</span>
                  </div>
                </div>
              </div>
              <p
                className={`text-slate-600 leading-relaxed flex-1 ${
                  idx === 0 ? 'text-lg' : 'text-base'
                }`}
              >
                {g.preview}
              </p>
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-black text-wellness-600 uppercase tracking-widest">
                  Read guide
                </span>
                <div className="w-9 h-9 rounded-full bg-wellness-50 group-hover:bg-wellness-600 flex items-center justify-center text-wellness-600 group-hover:text-white group-hover:translate-x-1 transition-all">
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Cross-links to other educational sections */}
        <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 md:p-14 mb-16">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-wellness-600 mb-4">
            Also worth a look
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-10 tracking-tight">
            More ways to learn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Link
              href="/treatments"
              className="group bg-slate-50 hover:bg-wellness-50 rounded-[1.5rem] p-7 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-wellness-600 flex items-center justify-center mb-4 shadow-sm">
                <Zap size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                Treatments
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                NAD+, Myers Cocktail, Hangover, Beauty Glow and 6 more — full
                details, costs, and clinics that offer each protocol.
              </p>
              <span className="text-xs font-black text-wellness-600 uppercase tracking-widest group-hover:underline">
                See protocols →
              </span>
            </Link>
            <Link
              href="/symptoms"
              className="group bg-slate-50 hover:bg-wellness-50 rounded-[1.5rem] p-7 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-wellness-600 flex items-center justify-center mb-4 shadow-sm">
                <Activity size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                Symptoms hub
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Match the way you&apos;re feeling to the right protocol. Fatigue,
                migraine, stomach flu, pregnancy and more.
              </p>
              <span className="text-xs font-black text-wellness-600 uppercase tracking-widest group-hover:underline">
                Browse symptoms →
              </span>
            </Link>
            <Link
              href="/blog"
              className="group bg-slate-50 hover:bg-wellness-50 rounded-[1.5rem] p-7 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-wellness-600 flex items-center justify-center mb-4 shadow-sm">
                <BookOpen size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                Blog
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                90+ deep articles on specific treatments, city guides, and timely
                topics like jet lag and event prep.
              </p>
              <span className="text-xs font-black text-wellness-600 uppercase tracking-widest group-hover:underline">
                Read blog →
              </span>
            </Link>
            <Link
              href="/quiz"
              className="group bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] p-7 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-wellness-600 text-white flex items-center justify-center mb-4 shadow-sm">
                <HelpCircle size={20} />
              </div>
              <h3 className="text-xl font-black mb-2 tracking-tight">
                Not sure what you need?
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                60-second quiz matches your symptoms to the right protocol and
                shows clinics that offer it.
              </p>
              <span className="text-xs font-black text-wellness-300 uppercase tracking-widest">
                Take the quiz →
              </span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
