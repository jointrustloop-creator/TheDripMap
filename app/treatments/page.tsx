import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity, Heart, ShieldCheck, Sparkles, Dumbbell, Droplets, Zap,
  ArrowRight, BookOpen, MapPin, HelpCircle,
} from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { BreadcrumbNav } from '../../src/components/BreadcrumbNav';
import { getTreatmentContent } from '../../src/lib/treatment-content';

const STORAGE_BASE =
  'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';

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
  { name: 'NAD+ Plus',      slug: 'nad-plus',       icon: Activity,    category: 'Energy & Longevity', image: 'iv-therapy-clinical-medical-setting.jpg' },
  { name: 'Hangover',       slug: 'hangover',       icon: Heart,       category: 'Recovery',           image: 'iv-therapy-hangover.jpg' },
  { name: 'Immune Support', slug: 'immune-support', icon: ShieldCheck, category: 'Wellness',           image: 'iv-therapy-immunity.jpg' },
  { name: 'Beauty Glow',    slug: 'beauty-glow',    icon: Sparkles,    category: 'Beauty',             image: 'iv-therapy-skin-glow.jpg' },
  { name: 'Weight Loss',    slug: 'weight-loss',    icon: Activity,    category: 'Metabolic',          image: 'iv-therapy-weight-loss.jpg' },
  { name: 'Hydration',      slug: 'hydration',      icon: Droplets,    category: 'Foundational',       image: 'iv-therapy-dehydration.jpg' },
  { name: 'Recovery',       slug: 'recovery',       icon: Dumbbell,    category: 'Athletic',           image: 'iv-therapy-sports-recovery.jpg' },
  { name: 'Myers Cocktail', slug: 'myers-cocktail', icon: Zap,         category: 'Foundational',       image: 'iv-therapy-vitamin-drip-citrus.jpg' },
  { name: 'Jet Lag',        slug: 'jet-lag',        icon: Droplets,    category: 'Travel',             image: 'iv-therapy-jet-lag.jpg' },
  { name: 'Energy Boost',   slug: 'energy-boost',   icon: Zap,         category: 'Energy & Longevity', image: 'iv-therapy-fatigue.jpg' },
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

        {/* Treatment grid — image-bg cards (mirrors the /cities pattern) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {TREATMENTS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.slug}
                href={`/treatments/${t.slug}`}
                className="group relative overflow-hidden rounded-[2rem] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 aspect-[4/5] flex flex-col"
              >
                {/* Background image with zoom-on-hover */}
                <Image
                  src={STORAGE_BASE + t.image}
                  alt={`${t.name} IV therapy`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-[1500ms] ease-out"
                />
                {/* Dark gradient overlay for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-slate-950/15" />
                {/* Wellness-tint hover wash */}
                <div className="absolute inset-0 bg-gradient-to-br from-wellness-600/0 to-wellness-600/0 group-hover:from-wellness-600/30 group-hover:to-transparent transition-all duration-500" />

                {/* Top-left: icon + category chip */}
                <div className="absolute top-5 left-5 right-5 z-10 flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md text-wellness-600 flex items-center justify-center shadow-lg shrink-0">
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-950/40 backdrop-blur-md text-white px-2.5 py-1 rounded-full">
                    {t.category}
                  </span>
                </div>

                {/* Bottom: name + preview + CTA */}
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-7 z-10 flex flex-col gap-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-[0.95] drop-shadow-lg">
                    {t.name}
                  </h2>
                  <p className="text-sm text-white/85 leading-relaxed line-clamp-3 drop-shadow">
                    {getTreatmentPreview(t.name)}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/20">
                    <span className="text-white font-black text-xs uppercase tracking-widest">
                      See clinics
                    </span>
                    <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-wellness-600 group-hover:translate-x-1 transition-all">
                      <ArrowRight size={16} />
                    </div>
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
