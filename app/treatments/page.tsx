import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Activity, Heart, ShieldCheck, Sparkles, Dumbbell, Droplets, Zap,
  ArrowRight, BookOpen, MapPin, HelpCircle,
} from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { BreadcrumbNav } from '../../src/components/BreadcrumbNav';
import { getTreatmentContent } from '../../src/lib/treatment-content';

const SITE_URL = 'https://www.thedripmap.com';

export const revalidate = 86400;

const title = 'All IV Therapy Treatments — Find the Right Drip | TheDripMap';
const description =
  'Browse every IV therapy protocol we cover — NAD+, Myers Cocktail, hangover recovery, immune support, beauty glow, weight loss, jet lag, athletic recovery, and more. Compare what each treatment does, costs, and which clinics offer it.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/treatments` },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/treatments`,
    type: 'website',
    siteName: 'TheDripMap',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'IV Therapy Treatments' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [`${SITE_URL}/og-image.png`],
  },
};

const TREATMENTS = [
  { name: 'NAD+ Plus',      slug: 'nad-plus',       icon: Activity,    category: 'Energy & Longevity' },
  { name: 'Hangover',       slug: 'hangover',       icon: Heart,       category: 'Recovery' },
  { name: 'Immune Support', slug: 'immune-support', icon: ShieldCheck, category: 'Wellness' },
  { name: 'Beauty Glow',    slug: 'beauty-glow',    icon: Sparkles,    category: 'Beauty' },
  { name: 'Weight Loss',    slug: 'weight-loss',    icon: Activity,    category: 'Metabolic' },
  { name: 'Hydration',      slug: 'hydration',      icon: Droplets,    category: 'Foundational' },
  { name: 'Recovery',       slug: 'recovery',       icon: Dumbbell,    category: 'Athletic' },
  { name: 'Myers Cocktail', slug: 'myers-cocktail', icon: Zap,         category: 'Foundational' },
  { name: 'Jet Lag',        slug: 'jet-lag',        icon: Droplets,    category: 'Travel' },
  { name: 'Energy Boost',   slug: 'energy-boost',   icon: Zap,         category: 'Energy & Longevity' },
];

// First sentence (or first ~180 chars) of each treatment's description.
function getTreatmentPreview(name: string): string {
  const content = getTreatmentContent(name);
  if (!content?.description) {
    return `Specialized IV therapy designed for ${name.toLowerCase()}. Browse clinics that offer this protocol.`;
  }
  const firstSentence = content.description.split('. ')[0];
  return firstSentence.length > 220
    ? firstSentence.slice(0, 215).trim() + '…'
    : firstSentence + '.';
}

export default function TreatmentsIndexPage() {
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'IV Therapy Treatments',
    numberOfItems: TREATMENTS.length,
    itemListElement: TREATMENTS.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/treatments/${t.slug}`,
      name: `${t.name} IV Therapy`,
    })),
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <BreadcrumbNav items={[{ label: 'Treatments' }]} />

        {/* Hero */}
        <section className="mt-12 mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6 border border-wellness-100">
            <Sparkles size={14} />
            {TREATMENTS.length} IV protocols
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.95]">
            Every IV protocol{' '}
            <span className="bg-gradient-to-r from-wellness-600 to-emerald-500 bg-clip-text text-transparent">
              we cover.
            </span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Each protocol below has its own clinic finder, pricing context, what
            to expect, and what to ask before booking. Not sure which fits you?
            Take the 60-second quiz instead.
          </p>
        </section>

        {/* Treatment grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {TREATMENTS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.slug}
                href={`/treatments/${t.slug}`}
                className="group bg-white border-2 border-slate-100 rounded-[2rem] p-7 md:p-8 hover:border-wellness-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-wellness-50 text-wellness-600 flex items-center justify-center shrink-0 group-hover:bg-wellness-600 group-hover:text-white transition-colors">
                    <Icon size={22} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                    {t.category}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight leading-tight">
                  {t.name}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">
                  {getTreatmentPreview(t.name)}
                </p>
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-wellness-600 uppercase tracking-widest">
                    See clinics & details
                  </span>
                  <div className="w-9 h-9 rounded-full bg-wellness-50 group-hover:bg-wellness-600 flex items-center justify-center text-wellness-600 group-hover:text-white group-hover:translate-x-1 transition-all">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {/* Cross-links */}
        <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 md:p-14 mb-16">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-wellness-600 mb-4">
            Also worth a look
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-10 tracking-tight">
            Not sure which protocol fits?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/quiz"
              className="group bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] p-7 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-wellness-600 text-white flex items-center justify-center mb-4 shadow-sm">
                <HelpCircle size={20} />
              </div>
              <h3 className="text-xl font-black mb-2 tracking-tight">
                Take the 60-sec quiz
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Pick your symptom — we&apos;ll recommend the right protocol and
                show clinics that offer it.
              </p>
              <span className="text-xs font-black text-wellness-300 uppercase tracking-widest">
                Start quiz →
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
                Browse by symptom
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Fatigue, migraine, hangover, jet lag, morning sickness — match
                how you feel to the right drip.
              </p>
              <span className="text-xs font-black text-wellness-600 uppercase tracking-widest group-hover:underline">
                Symptom hub →
              </span>
            </Link>
            <Link
              href="/guide"
              className="group bg-slate-50 hover:bg-wellness-50 rounded-[1.5rem] p-7 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-wellness-600 flex items-center justify-center mb-4 shadow-sm">
                <BookOpen size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                Read the guides
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Cost guide, how to choose a clinic, IV vs oral supplements,
                first-time tips, mobile vs clinic.
              </p>
              <span className="text-xs font-black text-wellness-600 uppercase tracking-widest group-hover:underline">
                See guides →
              </span>
            </Link>
          </div>
          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500 font-bold">
              Already know your city?
            </p>
            <Link
              href="/cities"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all"
            >
              <MapPin size={16} /> Browse by city
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
