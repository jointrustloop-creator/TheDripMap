import { ResilientImage } from '../src/components/ResilientImage';
import Link from 'next/link';
import { 
  Zap, 
  Search, 
  Droplets, 
  ShieldCheck, 
  ArrowRight,
  Activity,
  Heart,
  Sparkles,
  Dumbbell,
  Target,
  Clock,
  MapPin
} from 'lucide-react';
import { Navbar } from '../src/components/Navbar';
import LiveStatsBar from '../src/components/LiveStatsBar';
import { Footer } from '../src/components/Footer';

export const revalidate = 60; // Reduce from 86400 (24h) to 60s for faster updates during iteration

import { BlogCard } from '../src/components/BlogCard';
import { ClinicianSection } from '../src/components/ClinicianSection';
import { HowItWorks } from '../src/components/HowItWorks';
import { QuickMatch } from '../src/components/QuickMatch';
import { TrustSignals } from '../src/components/TrustSignals';
import { getBlogPosts, getSiteStats, getPopularCities } from '../src/lib/data';
import { Metadata } from 'next';
import { cn } from '../src/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats();
  const title = `IV Therapy Clinics Near Me — Find & Compare ${stats.total}+ Providers | TheDripMap`;
  const description = `Find the best IV therapy clinic near you. Compare ${stats.total}+ verified providers across the US and Canada. Filter by treatment, price, and location. Book in 30 seconds.`;
  
  return {
    title,
    description,
    alternates: {
      canonical: 'https://www.thedripmap.com',
    },
    openGraph: {
      title,
      description,
      url: 'https://www.thedripmap.com',
      siteName: 'TheDripMap',
      images: [
        {
          url: 'https://www.thedripmap.com/og-image.png',
          width: 1200,
          height: 630,
          alt: 'TheDripMap - Find Your Perfect IV Therapy Match',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      description,
      images: ['https://www.thedripmap.com/og-image.png'],
    },
  };
}

export default async function HomePage() {
  const stats = await getSiteStats();
  const blogPosts = await getBlogPosts();
  const popularCities = await getPopularCities();
  const latestPosts = blogPosts.slice(0, 3);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.thedripmap.com"
      }
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TheDripMap",
    "url": "https://www.thedripmap.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.thedripmap.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TheDripMap",
    "url": "https://www.thedripmap.com",
    "logo": "https://www.thedripmap.com/logo.png",
    "sameAs": [
      "https://www.facebook.com/thedripmap",
      "https://www.instagram.com/thedripmap",
      "https://twitter.com/thedripmap"
    ]
  };

  const services = [
    { name: 'NAD+ Plus', slug: 'nad-plus', icon: <Activity size={24} /> },
    { name: 'Hangover', slug: 'hangover', icon: <Heart size={24} /> },
    { name: 'Immune Support', slug: 'immune-support', icon: <ShieldCheck size={24} /> },
    { name: 'Beauty Glow', slug: 'beauty-glow', icon: <Sparkles size={24} /> },
    { name: 'Weight Loss', slug: 'weight-loss', icon: <Activity size={24} /> },
    { name: 'Hydration', slug: 'hydration', icon: <Droplets size={24} /> },
    { name: 'Recovery', slug: 'recovery', icon: <Dumbbell size={24} /> },
    { name: 'Myers Cocktail', slug: 'myers-cocktail', icon: <Zap size={24} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <LiveStatsBar stats={{
        totalClinics: stats.total,
        totalCities: stats.cities,
        growth: "Weekly"
      }} />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-40 px-6 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <ResilientImage
            src="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-two-women.jpg"
            fallbackSrc="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-spa-reception-recliners.jpg"
            alt="Two women receiving IV therapy together"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Medium scrim — photo stays clearly visible, text stays crisp.
              Mobile slightly darker because portrait crops eat lighter zones. */}
          <div className="absolute inset-0 bg-slate-900/40 md:bg-slate-900/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/35" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center max-w-5xl mx-auto mb-20">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1] [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
              Get Matched to the Right <br />
              <span className="text-wellness-300 relative inline-block">
                IV Therapy Clinic in 30 Seconds.
                <span className="absolute -inset-1 bg-wellness-400/25 blur-2xl -z-10 rounded-full" />
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-100 mb-10 font-semibold tracking-tight max-w-3xl mx-auto leading-relaxed [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
              Not all IV therapy is the same — we match you based on your exact needs, location, and budget.
            </p>

            <QuickMatch />

            <div className="mt-10 flex flex-col items-center gap-2">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] font-bold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]">
                <span className="flex items-center gap-1.5"><span className="text-wellness-300 font-bold">✓</span> Trusted by patients nationwide</span>
                <span className="flex items-center gap-1.5"><span className="text-wellness-300 font-bold">✓</span> Clinical grade provider match</span>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-black text-white uppercase tracking-[0.2em] mt-4">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">{stats.total} Verified Clinics</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">{stats.cities} US & Canadian Cities</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Path Section — premium mesh-gradient bg + embossed hero card */}
      <section className="py-24 md:py-28 px-6 relative -mt-20 z-20 overflow-hidden bg-gradient-to-br from-wellness-50/60 via-white to-sky-50/40">
        {/* Layered ambient orbs for mesh depth */}
        <div className="absolute top-20 -left-40 w-[700px] h-[700px] bg-wellness-200/30 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/40 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-wellness-100/40 rounded-full blur-[180px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Editorial eyebrow */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/70 backdrop-blur-md border border-wellness-200/60 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 bg-wellness-500 rounded-full animate-pulse" />
              <span className="text-wellness-700 font-black text-[10px] uppercase tracking-[0.3em]">How It Works</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 text-center mb-16 tracking-tight leading-[1.1] max-w-4xl mx-auto">The Smarter Way to Find IV Therapy Clinics</h2>

          {/* Smart Match hero card — embossed, layered shadow, top accent line */}
          <div className="max-w-3xl mx-auto mb-12">
            <Link href="/quiz" className="group relative block bg-white p-10 md:p-14 rounded-[3rem] border border-white shadow-[0_30px_60px_-20px_rgba(15,23,42,0.18),0_8px_25px_-10px_rgba(15,23,42,0.1)] hover:shadow-[0_40px_80px_-20px_rgba(15,23,42,0.25),0_12px_30px_-12px_rgba(15,23,42,0.15)] hover:-translate-y-1 transition-all duration-500 overflow-hidden">
              {/* Top accent gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-wellness-400 via-sky-400 to-wellness-400" />
              {/* Soft decorative blob */}
              <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-wellness-100/80 to-transparent rounded-bl-[6rem] -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-sky-100/60 to-transparent rounded-tr-[5rem] -ml-6 -mb-6 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-wellness-500 to-wellness-700 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-wellness-300/40 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                  <Zap size={32} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-[1.05]">The Smart Match</h3>
                <p className="text-slate-600 leading-relaxed mb-8 text-lg max-w-xl">
                  Not sure which IV is right for you? Our clinical algorithm matches you based on goals, symptoms, location, and budget — in 60 seconds.
                </p>
                <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-wellness-700 transition-colors shadow-lg">
                  Start the 60-Second Quiz <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
          <div className="text-center mb-24">
            <Link href="/search" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-wellness-600 transition-colors">
              <Search size={14} />
              Or browse all {stats.total} clinics directly →
            </Link>
          </div>

          {/* Trust pillars — vertical layout, big icons, premium typography */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="group relative bg-white/80 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-[0_20px_40px_-20px_rgba(15,23,42,0.12)] hover:shadow-[0_30px_50px_-20px_rgba(15,23,42,0.2)] hover:-translate-y-1 transition-all duration-500 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-wellness-400 to-wellness-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-wellness-300/40 group-hover:scale-110 transition-transform duration-500">
                <Target size={26} strokeWidth={2.5} />
              </div>
              <h4 className="font-black text-slate-900 text-lg mb-2 tracking-tight">Goal-Based Matching</h4>
              <p className="text-slate-500 text-sm leading-relaxed">We match on what you need, not just who&apos;s closest</p>
            </div>
            <div className="group relative bg-white/80 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-[0_20px_40px_-20px_rgba(15,23,42,0.12)] hover:shadow-[0_30px_50px_-20px_rgba(15,23,42,0.2)] hover:-translate-y-1 transition-all duration-500 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-sky-300/40 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck size={26} strokeWidth={2.5} />
              </div>
              <h4 className="font-black text-slate-900 text-lg mb-2 tracking-tight">{stats.total} Top-Rated Clinics</h4>
              <p className="text-slate-500 text-sm leading-relaxed">{stats.total} verified IV therapy providers</p>
            </div>
            <div className="group relative bg-white/80 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-[0_20px_40px_-20px_rgba(15,23,42,0.12)] hover:shadow-[0_30px_50px_-20px_rgba(15,23,42,0.2)] hover:-translate-y-1 transition-all duration-500 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-amber-300/40 group-hover:scale-110 transition-transform duration-500">
                <Clock size={26} strokeWidth={2.5} />
              </div>
              <h4 className="font-black text-slate-900 text-lg mb-2 tracking-tight">Results in 60 Seconds</h4>
              <p className="text-slate-500 text-sm leading-relaxed">No browsing. No guessing. Just your best match.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse By Drip Type — DARK MODE FLIP, Apple Pro spotlight aesthetic */}
      <section className="py-28 md:py-36 px-6 relative overflow-hidden bg-slate-950">
        {/* Mesh gradient — wellness + sky glows on deep slate */}
        <div className="absolute top-0 -left-32 w-[600px] h-[600px] bg-wellness-600/30 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-sky-500/25 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-violet-500/20 rounded-full blur-[200px] pointer-events-none" />
        {/* Subtle starfield/dot grid */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-wellness-400 rounded-full animate-pulse" />
              <span className="text-wellness-300 font-black text-[10px] uppercase tracking-[0.3em]">Drip Menu</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-5 tracking-tight leading-[1.15]">
              <span className="inline-block bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent pb-1">Browse By</span>
              <br />
              <span className="inline-block bg-gradient-to-br from-wellness-300 via-wellness-400 to-sky-300 bg-clip-text text-transparent italic pb-3">Drip Type</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">Select a service to find specialized providers near you.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service, idx) => (
              <Link
                key={idx}
                href={`/treatments/${service.slug}`}
                className="group relative bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md p-8 rounded-[2rem] border border-white/10 hover:border-wellness-400/40 hover:shadow-[0_30px_60px_-15px_rgba(20,184,166,0.3)] hover:-translate-y-1 transition-all duration-500 text-center overflow-hidden"
              >
                {/* Glow halo on hover */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-wellness-400/0 group-hover:bg-wellness-400/30 blur-3xl rounded-full transition-all duration-700 pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-wellness-400/20 to-wellness-600/20 rounded-2xl flex items-center justify-center text-wellness-300 mx-auto mb-4 border border-wellness-400/20 group-hover:from-wellness-400/40 group-hover:to-wellness-600/40 group-hover:border-wellness-300/50 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                    {service.icon}
                  </div>
                  <span className="font-black text-white tracking-tight group-hover:text-wellness-200 transition-colors">{service.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Helpful Guides — editorial magazine treatment, warm cream paper */}
      <section className="py-28 md:py-36 px-6 relative overflow-hidden bg-gradient-to-b from-[#F8F5EE] via-[#FAF7F0] to-[#F5F1E8]">
        {/* Editorial warm orbs */}
        <div className="absolute -top-32 -right-40 w-[600px] h-[600px] bg-amber-200/35 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-40 w-[500px] h-[500px] bg-wellness-200/30 rounded-full blur-[160px] pointer-events-none" />
        {/* Paper grain texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 mb-8">
              <span className="h-px w-12 bg-amber-500/40" />
              <span className="text-amber-700 font-black text-[10px] uppercase tracking-[0.3em]">The Reading Room</span>
              <span className="h-px w-12 bg-amber-500/40" />
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 mb-5 tracking-tight leading-[1.1]">
              Before You{' '}
              <span className="inline-block italic bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 bg-clip-text text-transparent pb-2">Book</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">Plain-English answers to the questions every first-time IV therapy patient asks.</p>
          </div>

          {/* Numbered editorial cards — bigger, layered, magazine quality */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { num: '01', label: 'Pricing', title: 'IV Therapy Cost Guide', href: '/guide/iv-therapy-cost-guide', desc: 'What to expect to pay for hangover, NAD+, Myers Cocktail, and recovery drips across US and Canadian metros.' },
              { num: '02', label: 'Quality Signals', title: 'How to Choose a Clinic', href: '/guide/how-to-choose-iv-therapy-clinic', desc: 'The 7 things every reputable IV therapy clinic should have — staff credentials, ingredients, screening, pricing.' },
              { num: '03', label: 'Walk-Through', title: 'First-Time IV Therapy', href: '/guide/first-time-iv-therapy-what-to-expect', desc: 'Step-by-step walkthrough of a typical first IV therapy session — from intake to needle, infusion, and after.' },
            ].map((g) => (
              <Link
                key={g.num}
                href={g.href}
                className="group relative bg-white p-10 md:p-12 rounded-[2.5rem] border border-stone-200/80 shadow-[0_30px_60px_-25px_rgba(120,90,40,0.18)] hover:shadow-[0_40px_80px_-25px_rgba(120,90,40,0.3)] hover:-translate-y-1 transition-all duration-500 overflow-hidden"
              >
                {/* Top thin gold accent rule */}
                <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                {/* Decorative serif number */}
                <div className="font-serif text-[4.5rem] md:text-[7rem] leading-none font-black text-amber-200/70 group-hover:text-amber-300 absolute top-4 right-6 md:-top-2 md:-right-2 select-none transition-colors duration-500 pointer-events-none" aria-hidden>
                  {g.num}
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-700 mb-6">{g.label}</div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight leading-[1.1] group-hover:text-amber-800 transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed mb-8">{g.desc}</p>
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-700 group-hover:text-amber-800 transition-colors">
                    <span>Read the guide</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Secondary guide links — refined typography */}
          <div className="mt-14 flex flex-wrap gap-x-6 gap-y-3 items-center justify-center text-sm">
            <span className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">Also in this issue —</span>
            <Link href="/guide/mobile-iv-therapy-vs-clinic" className="font-bold text-slate-700 hover:text-amber-700 transition-colors underline decoration-amber-400/40 underline-offset-4 decoration-2 hover:decoration-amber-600">Mobile vs in-clinic</Link>
            <Link href="/guide/iv-therapy-vs-oral-supplements" className="font-bold text-slate-700 hover:text-amber-700 transition-colors underline decoration-amber-400/40 underline-offset-4 decoration-2 hover:decoration-amber-600">IV vs oral supplements</Link>
          </div>
        </div>
      </section>

      {/* Social Proof Images — editorial dual-feature */}
      <section className="py-28 md:py-36 px-6 relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
        {/* Soft ambient blob */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-wellness-100/30 rounded-full blur-[200px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200/70 rounded-full mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 bg-wellness-500 rounded-full" />
              <span className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em]">In The Wild</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.05] max-w-3xl mx-auto">
              Real People. <em className="not-italic bg-gradient-to-br from-wellness-600 to-wellness-800 bg-clip-text text-transparent italic">Real Drips.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {[
              {
                num: '01',
                eyebrow: 'Relatable Experience',
                title: 'IV Therapy is Better with Friends',
                src: 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-two-women.jpg',
                fallback: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1920&auto=format&fit=crop',
                alt: 'Friends receiving IV therapy',
              },
              {
                num: '02',
                eyebrow: 'Recovery Focused',
                title: 'Expert Local Clinics',
                src: 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-man-lounge.jpg',
                fallback: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1920&auto=format&fit=crop',
                alt: 'Man relaxing during IV therapy',
              },
            ].map((card) => (
              <div key={card.num} className="group relative h-[420px] md:h-[600px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-[0_30px_60px_-25px_rgba(15,23,42,0.4)] hover:shadow-[0_40px_80px_-25px_rgba(15,23,42,0.55)] hover:-translate-y-1 transition-all duration-700">
                <ResilientImage
                  src={card.src}
                  fallbackSrc={card.fallback}
                  alt={card.alt}
                  fill
                  className="object-cover scale-105 group-hover:scale-110 transition-transform duration-[1500ms]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
                {/* Top-right number badge */}
                <div className="absolute top-8 right-8 w-14 h-14 bg-white/15 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white font-black text-sm tracking-wider">
                  {card.num}
                </div>
                {/* Bottom caption block */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white">
                  <span className="font-black text-[10px] uppercase tracking-[0.3em] text-wellness-300 mb-3 block">{card.eyebrow}</span>
                  <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-[1.1] [text-shadow:0_2px_12px_rgba(0,0,0,0.4)]">{card.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks totalListings={stats.total} />

      {/* Situation Matcher — solves the #1 pre-booking confusion barrier:
          "I don't know which drip I actually need." Maps real life moments
          to the right protocol, then dumps the visitor straight into the
          quiz to finish the match. */}
      <section className="py-28 md:py-36 px-6 bg-[#FAFAF7] overflow-hidden relative">
        {/* Subtle decorative gradient — warm and editorial, not loud */}
        <div className="absolute top-0 -left-32 w-[600px] h-[600px] bg-wellness-100/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-wellness-200 rounded-full mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 bg-wellness-500 rounded-full" />
              <span className="text-wellness-700 font-black text-[11px] uppercase tracking-[0.25em]">60-Second Match</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.05] mb-6 text-balance max-w-3xl mx-auto">
              What are you <em className="text-wellness-600 not-italic">actually</em> going through?
            </h2>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Most people booking their first IV therapy have no idea what to ask for. Pick the moment closest to yours — we&apos;ll match you with the right drip <em>and</em> the right clinic in 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-14">
            {[
              { emoji: '🍷', label: 'Out too late last night',     drip: 'Hangover Recovery' },
              { emoji: '🤧', label: 'Catching something nasty',     drip: 'Immune Support' },
              { emoji: '😴', label: 'Brain fog all week',           drip: 'NAD+ / Energy' },
              { emoji: '💪', label: 'Big workout or race coming',   drip: 'Athletic Recovery' },
              { emoji: '👰', label: 'Wedding in a week',            drip: 'Beauty Glow' },
              { emoji: '✈️', label: 'Just landed jet-lagged',       drip: 'Hydration + B-complex' },
              { emoji: '🌡️', label: 'Bug or stomach flu',           drip: 'Hydration Drip' },
              { emoji: '🎉', label: 'Vegas / bachelor weekend',     drip: 'Hangover + Recovery' },
            ].map((s) => (
              <Link
                key={s.label}
                href="/quiz"
                className="group block bg-white rounded-[2rem] p-5 md:p-7 border border-slate-100 hover:border-wellness-300 hover:shadow-xl shadow-sm transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-3xl md:text-4xl mb-3 md:mb-4 leading-none" aria-hidden>{s.emoji}</div>
                <div className="font-black text-slate-900 text-sm md:text-base mb-2 md:mb-3 leading-tight tracking-tight">
                  {s.label}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-wellness-600">
                  <span>{s.drip}</span>
                  <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-3 bg-wellness-600 hover:bg-wellness-700 text-white px-10 py-5 rounded-2xl font-black text-base transition-all shadow-2xl shadow-wellness-300/40 hover:scale-[1.02] active:scale-[0.99]"
            >
              <Zap size={18} />
              <span>Take the full 60-second match quiz</span>
              <ArrowRight size={18} />
            </Link>
            <p className="text-xs text-slate-400 mt-5 font-bold tracking-wide">
              5 questions · No signup · No spam · Just the right drip and the right clinic
            </p>
          </div>
        </div>
      </section>

      {/* Popular Cities — light mesh, map-coverage feel */}
      <section className="py-28 md:py-36 px-6 relative overflow-hidden bg-gradient-to-br from-sky-50/40 via-white to-wellness-50/40">
        {/* Map-coverage ambient orbs — distributed across the section */}
        <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-sky-200/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 right-20 w-[450px] h-[450px] bg-rose-100/40 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-wellness-100/40 rounded-full blur-[160px] pointer-events-none" />
        {/* Decorative pin-dot pattern */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #0f172a 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-md border border-sky-200/70 rounded-full mb-6 shadow-sm">
              <MapPin size={12} className="text-sky-600" />
              <span className="text-sky-700 font-black text-[10px] uppercase tracking-[0.3em]">North America Coverage</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 mb-5 tracking-tight leading-[1.05]">
              Popular <em className="not-italic bg-gradient-to-br from-sky-600 via-sky-700 to-wellness-700 bg-clip-text text-transparent italic inline-block pb-2">Cities</em>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">Find the best local IV therapy providers and mobile services in your area.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {popularCities.map((city, idx) => (
              <Link
                key={idx}
                href={`/cities/${city.slug}`}
                className="group relative p-8 rounded-[2rem] bg-white/80 backdrop-blur-md border border-white shadow-[0_20px_40px_-20px_rgba(15,23,42,0.12)] hover:shadow-[0_30px_60px_-20px_rgba(2,132,199,0.25)] hover:-translate-y-1 transition-all duration-500 text-center flex flex-col items-center justify-center min-h-[180px] overflow-hidden"
              >
                {/* Hover glow */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-sky-300/0 group-hover:bg-sky-300/40 blur-3xl rounded-full transition-all duration-700 pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-sky-300/40 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                    <MapPin size={22} strokeWidth={2.5} />
                  </div>
                  <span className="font-black tracking-tight text-slate-900 text-base md:text-lg group-hover:text-sky-700 transition-colors leading-tight">
                    {city.name}
                  </span>
                  {city.count ? (
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                      {city.count} {city.name.includes('Toronto') ? 'providers' : 'clinics'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">View Clinics</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="flex justify-center mt-14">
            <Link
              href="/cities"
              className="group inline-flex items-center gap-3 bg-gradient-to-br from-slate-900 to-slate-700 hover:from-sky-700 hover:to-wellness-700 text-white px-10 py-5 rounded-2xl font-black text-base transition-all shadow-[0_20px_40px_-15px_rgba(15,23,42,0.5)] hover:shadow-[0_25px_50px_-15px_rgba(2,132,199,0.5)] hover:-translate-y-0.5"
            >
              Browse All {stats.cities}+ Cities <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <TrustSignals stats={{
        totalListings: stats.total,
        totalCities: stats.cities,
        totalStates: stats.states,
        avgRating: parseFloat(stats.avgRating)
      }} />

      {/* Blog Preview — editorial newsstand */}
      <section className="py-28 md:py-36 px-6 relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Subtle wellness accent orb */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-wellness-100/30 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-100/30 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="h-px w-10 bg-wellness-500/40" />
                <span className="text-wellness-700 font-black text-[10px] uppercase tracking-[0.3em]">The Press</span>
                <span className="h-px w-10 bg-wellness-500/40" />
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 mb-5 tracking-tight leading-[1.05]">
                Latest from the <em className="not-italic bg-gradient-to-br from-wellness-600 to-wellness-800 bg-clip-text text-transparent italic inline-block pb-2">Blog</em>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                Expert guides on IV therapy, wellness protocols, and local health insights.
              </p>
            </div>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-wellness-300 hover:text-wellness-700 text-slate-700 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-sm hover:shadow-md self-start md:self-auto"
            >
              View All Articles <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {latestPosts.map((post, idx) => (
              <BlogCard key={idx} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ResilientImage 
            src="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-woman-relaxing.jpg"
            fallbackSrc="https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=2070&auto=format&fit=crop"
            alt="Woman relaxing"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tight leading-[1.1]">
            Stop Guessing. <br />
            <span className="text-wellness-400 italic">Start Healing.</span>
          </h2>
          <p className="text-2xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Join the thousands of patients who found their perfect IV therapy clinic on TheDripMap.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/quiz"
              className="w-full sm:w-auto bg-wellness-600 text-white px-12 py-6 rounded-2xl font-black text-xl hover:bg-wellness-700 transition-all shadow-2xl flex items-center justify-center gap-3"
            >
              Get My Match Now <ArrowRight size={24} />
            </Link>
            <Link 
              href="/search"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-12 py-6 rounded-2xl font-black text-xl transition-all flex items-center justify-center border border-white/20"
            >
              Browse Clinics
            </Link>
          </div>
        </div>
      </section>

      {/* For Clinicians Section */}
      <ClinicianSection stats={{
        totalListings: stats.total,
        totalCities: stats.cities,
        totalStates: stats.states,
        avgRating: parseFloat(stats.avgRating),
        isLive: true
      }} />

      <Footer />
    </div>
  );
}

