import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Droplets,
  Activity,
  Heart,
  Sparkles,
  Dumbbell,
  ShieldCheck,
  Zap,
  Wine,
  Thermometer,
  Brain,
  Plane,
  PartyPopper,
  Pill,
} from 'lucide-react';
import { Navbar } from '../src/components/Navbar';
import { Footer } from '../src/components/Footer';
import { BlogCard } from '../src/components/BlogCard';
import { QuickMatch } from '../src/components/QuickMatch';
import { ClinicianSection } from '../src/components/ClinicianSection';
import { TrustSignals } from '../src/components/TrustSignals';
import { getBlogPosts, getSiteStats, getPopularCities } from '../src/lib/data';
import { Metadata } from 'next';

export const revalidate = 60;

/*
 * ─────────────────────────────────────────────────────────────────────
 *  HOMEPAGE — V2 (2026-05-27 redesign)
 * ─────────────────────────────────────────────────────────────────────
 *  Disciplined palette: deep ink (#0A0B0D), pure white, bone (#F8F7F3),
 *  brand emerald (#0F6E56). NO other accent colors.
 *
 *  Section rhythm: dark → light → dark → light → bone → light → bone →
 *  emerald. Alternating creates calm contrast without color noise.
 *
 *  Previous version preserved at scripts/page-backup-2026-05-27.tsx.
 * ─────────────────────────────────────────────────────────────────────
 */

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats();
  const title = `IV Therapy Clinics Near Me — Find & Compare ${stats.total}+ Providers | TheDripMap`;
  const description = `Find the best IV therapy clinic near you. Compare ${stats.total}+ verified providers across the US and Canada. Filter by treatment, price, and location. Book in 60 seconds.`;

  return {
    title,
    description,
    alternates: { canonical: 'https://www.thedripmap.com' },
    openGraph: {
      title,
      description,
      url: 'https://www.thedripmap.com',
      siteName: 'TheDripMap',
      images: [{ url: 'https://www.thedripmap.com/og-image.png', width: 1200, height: 630, alt: 'TheDripMap — Find Your IV Therapy Match' }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', description, images: ['https://www.thedripmap.com/og-image.png'] },
  };
}

export default async function HomePage() {
  const stats = await getSiteStats();
  const blogPosts = await getBlogPosts();
  const popularCities = await getPopularCities();
  const latestPosts = blogPosts.slice(0, 3);

  const websiteJsonLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'TheDripMap', url: 'https://www.thedripmap.com', potentialAction: { '@type': 'SearchAction', target: 'https://www.thedripmap.com/search?q={search_term_string}', 'query-input': 'required name=search_term_string' } };
  const organizationJsonLd = { '@context': 'https://schema.org', '@type': 'Organization', name: 'TheDripMap', url: 'https://www.thedripmap.com', logo: 'https://www.thedripmap.com/logo.png', sameAs: ['https://www.instagram.com/thedripmap'] };

  const services = [
    { name: 'Hydration',       slug: 'hydration',       Icon: Droplets },
    { name: 'NAD+',            slug: 'nad-plus',        Icon: Activity },
    { name: 'Myers Cocktail',  slug: 'myers-cocktail',  Icon: Zap },
    { name: 'Hangover',        slug: 'hangover',        Icon: Heart },
    { name: 'Immune Support',  slug: 'immune-support',  Icon: ShieldCheck },
    { name: 'Beauty Glow',     slug: 'beauty-glow',     Icon: Sparkles },
    { name: 'Recovery',        slug: 'recovery',        Icon: Dumbbell },
    { name: 'Weight Loss',     slug: 'weight-loss',     Icon: Activity },
  ];

  const situations = [
    { Icon: Wine,        label: 'Out too late last night',    drip: 'Hangover Recovery' },
    { Icon: Thermometer, label: 'Catching something nasty',   drip: 'Immune Support' },
    { Icon: Brain,       label: 'Brain fog all week',         drip: 'NAD+ / Energy' },
    { Icon: Dumbbell,    label: 'Race or big workout coming', drip: 'Athletic Recovery' },
    { Icon: Sparkles,    label: 'Event in a week',            drip: 'Beauty Glow' },
    { Icon: Plane,       label: 'Just landed jet-lagged',     drip: 'Hydration + B-complex' },
    { Icon: Pill,        label: 'Bug or stomach flu',         drip: 'Hydration Drip' },
    { Icon: PartyPopper, label: 'Bachelor / bachelorette',    drip: 'Hangover + Recovery' },
  ];

  const guides = [
    { num: '01', label: 'Pricing',         title: 'What IV therapy actually costs',         href: '/guide/iv-therapy-cost-guide',                desc: 'Hangover, NAD+, Myers, recovery — real 2026 ranges across US and Canadian metros.' },
    { num: '02', label: 'Quality Signals', title: 'How to choose a clinic',                 href: '/guide/how-to-choose-iv-therapy-clinic',      desc: 'The 7 things every reputable IV therapy clinic should have. Walk away if any are missing.' },
    { num: '03', label: 'Walk-through',    title: 'Your first session, step by step',       href: '/guide/first-time-iv-therapy-what-to-expect', desc: 'Intake to needle to discharge. What to expect, what to ask, how to know it went well.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />

      {/* ─────────────────────────────────────────────────────────────
          1. HERO — light, airy, single emerald accent
          ───────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-[#F4F6F4] via-[#FBFCFB] to-white text-slate-900">
        {/* Decorative background, clipped to the hero. Kept in its own
            overflow-hidden layer so the section itself does NOT clip the
            QuickMatch dropdowns (which open downward past the hero edge). */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Soft emerald glow up top — barely there, just warmth */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[800px] bg-[#0F6E56]/[0.07] rounded-full blur-[170px]" />
          {/* Faint dot grid, masked to fade at the edges */}
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(15,110,86,0.10) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
              maskImage: 'radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent 75%)',
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24 relative">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6 justify-center">
            <span className="hidden md:block h-px w-8 bg-[#0F6E56]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56] text-center">North America's IV Therapy Platform</span>
            <span className="hidden md:block h-px w-8 bg-[#0F6E56]" />
          </div>

          {/* Hero headline — dark ink with emerald serif italic accent */}
          <h1 className="text-center font-black tracking-[-0.03em] leading-[0.95] text-[clamp(2.75rem,7.5vw,6.5rem)] mb-6 text-slate-900">
            Find the right<br />
            <span className="font-serif italic font-normal text-[#0F6E56] tracking-[-0.02em]">IV therapy clinic.</span>
          </h1>

          <p className="text-center text-base md:text-[20px] text-slate-500 max-w-[560px] mx-auto mb-8 leading-relaxed font-light">
            {stats.total.toLocaleString()}+ verified clinics across {stats.cities}+ cities. Find the right one for you in under 60 seconds.
          </p>

          {/* QuickMatch — full width so the city picker + button breathe */}
          <div className="max-w-4xl mx-auto mb-10">
            <QuickMatch />
          </div>

          {/* Trust row — typographic */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 md:gap-x-10 gap-y-3 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
            <span><span className="text-slate-900">{stats.total.toLocaleString()}</span> &nbsp;Verified Clinics</span>
            <span className="hidden md:inline text-slate-300">·</span>
            <span><span className="text-slate-900">{stats.cities}</span> &nbsp;Cities</span>
            <span className="hidden md:inline text-slate-300">·</span>
            <span><span className="text-slate-900">{stats.states}</span> &nbsp;States &amp; Provinces</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. SMART MATCH CTA — white, one emerald focal point
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 md:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56] mb-6 block">The Smart Match</span>
            <h2 className="font-black text-slate-900 tracking-[-0.025em] leading-[1.05] text-[clamp(2rem,5vw,4rem)] max-w-3xl mx-auto">
              Skip the guesswork.<br />
              <span className="font-serif italic font-normal text-[#0F6E56]">Get matched in 60 seconds.</span>
            </h2>
            <p className="mt-8 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed font-light">
              Five quick questions. We map your goals, location, and budget to the right clinic — and the right drip.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <Link
              href="/quiz"
              className="group inline-flex items-center gap-3 bg-[#0F6E56] hover:bg-[#0A5742] text-white px-10 py-5 rounded-full font-bold text-base transition-all shadow-[0_20px_40px_-12px_rgba(15,110,86,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(15,110,86,0.5)] hover:-translate-y-0.5"
            >
              Start the Match Quiz
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/search" className="text-sm text-slate-500 hover:text-[#0F6E56] transition-colors font-medium underline-offset-4 hover:underline">
              Or browse all {stats.total.toLocaleString()} clinics directly
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. DRIP MENU — deep ink, monochrome grid
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#0A0B0D] text-white py-20 md:py-44 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0F6E56]/10 rounded-full blur-[180px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative">
          <div className="mb-12 md:mb-20 flex items-end justify-between gap-8 flex-wrap">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/40 mb-6 block">The Menu</span>
              <h2 className="font-black tracking-[-0.025em] leading-[1] text-[clamp(2rem,5vw,4rem)]">
                Browse by<br />
                <span className="font-serif italic font-normal text-[#7ED3B8]">drip type.</span>
              </h2>
            </div>
            <Link href="/search" className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white transition-colors">
              See full directory <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-3xl overflow-hidden">
            {services.map((s) => (
              <Link
                key={s.slug}
                href={`/treatments/${s.slug}`}
                className="group bg-[#0A0B0D] hover:bg-[#13151A] p-8 md:p-10 transition-colors relative"
              >
                <s.Icon size={22} className="text-[#7ED3B8] mb-6" strokeWidth={1.75} />
                <div className="font-bold text-base tracking-tight">{s.name}</div>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={16} className="text-white/60" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. SITUATION MATCHER — light, monochrome, type-led
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56] mb-6 block">By Situation</span>
            <h2 className="font-black text-slate-900 tracking-[-0.025em] leading-[1.05] text-[clamp(2rem,5vw,4rem)] max-w-3xl mx-auto">
              What are you<br />
              <span className="font-serif italic font-normal text-[#0F6E56]">actually going through?</span>
            </h2>
            <p className="mt-8 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed font-light">
              Pick the moment closest to yours. We'll match you with the right drip and clinic.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 border border-slate-100 rounded-3xl overflow-hidden">
            {situations.map((s) => (
              <Link
                key={s.label}
                href="/quiz"
                className="group bg-white hover:bg-[#F8F7F3] p-5 md:p-8 transition-colors relative"
              >
                <s.Icon size={20} className="text-[#0F6E56] mb-5" strokeWidth={1.75} />
                <div className="font-bold text-slate-900 text-sm md:text-[15px] leading-tight tracking-tight mb-2">
                  {s.label}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {s.drip}
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-3 text-[#0F6E56] hover:text-[#0A5742] font-bold text-sm tracking-tight transition-colors group"
            >
              <span className="border-b border-[#0F6E56] pb-1">Take the full 60-second quiz</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CITIES — bone paper, editorial typography
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#F8F7F3] py-20 md:py-32 px-6 border-b border-[#0F6E56]/30">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 md:mb-20 flex items-end justify-between gap-8 flex-wrap">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56] mb-6 block">Cities</span>
              <h2 className="font-black text-slate-900 tracking-[-0.025em] leading-[1] text-[clamp(2rem,5vw,4rem)]">
                Major metros,<br />
                <span className="font-serif italic font-normal text-[#0F6E56]">fully mapped.</span>
              </h2>
            </div>
            <Link href="/cities" className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#0F6E56] transition-colors">
              All {stats.cities}+ cities <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200/60 border border-slate-200/60 rounded-3xl overflow-hidden">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className="group bg-[#F8F7F3] hover:bg-white p-8 md:p-10 transition-colors relative border-l-2 border-transparent hover:border-[#0F6E56]"
              >
                <div className="font-bold text-slate-900 text-xl tracking-tight mb-3 group-hover:text-[#0F6E56] transition-colors">
                  {city.name}
                </div>
                {city.count ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-[#0F6E56] tracking-tight">{city.count}</span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      {city.name.toLowerCase().includes('toronto') ? 'providers' : 'clinics'}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">View clinics</div>
                )}
                <ArrowUpRight size={14} className="absolute top-8 right-8 text-slate-300 group-hover:text-[#0F6E56] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>
            ))}
          </div>

          {/* Mobile-only fallback for the All N+ cities link hidden in the header */}
          <div className="text-center mt-10 md:hidden">
            <Link href="/cities" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#0F6E56] transition-colors">
              All {stats.cities}+ cities <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. GUIDES — light, editorial, restrained
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white pt-20 md:pt-32 pb-14 md:pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56] mb-6 block">Before You Book</span>
            <h2 className="font-black text-slate-900 tracking-[-0.025em] leading-[1.05] text-[clamp(2rem,5vw,4rem)] max-w-3xl mx-auto">
              The questions <span className="font-serif italic font-normal text-[#0F6E56]">everyone asks</span>,<br />
              answered plainly.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-100 border border-slate-100 rounded-3xl overflow-hidden">
            {guides.map((g) => (
              <Link
                key={g.num}
                href={g.href}
                className="group bg-white hover:bg-[#F8F7F3] p-7 md:p-12 transition-colors relative flex flex-col"
              >
                <div className="font-serif italic text-4xl md:text-5xl text-[#0F6E56]/30 group-hover:text-[#0F6E56]/60 transition-colors mb-5 md:mb-8 font-normal">
                  {g.num}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3">{g.label}</div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4 group-hover:text-[#0F6E56] transition-colors">
                  {g.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1">{g.desc}</p>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0F6E56]">
                  <span>Read the guide</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 items-center justify-center text-sm">
            <span className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">More guides</span>
            <Link href="/guide/mobile-iv-therapy-vs-clinic" className="font-bold text-slate-700 hover:text-[#0F6E56] transition-colors">Mobile vs in-clinic</Link>
            <span className="text-slate-300">·</span>
            <Link href="/guide/iv-therapy-vs-oral-supplements" className="font-bold text-slate-700 hover:text-[#0F6E56] transition-colors">IV vs oral supplements</Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. BLOG — bone paper, editorial
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#F8F7F3] pt-14 md:pt-16 pb-20 md:pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 md:mb-20 flex items-end justify-between gap-8 flex-wrap">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56] mb-6 block">Latest</span>
              <h2 className="font-black text-slate-900 tracking-[-0.025em] leading-[1] text-[clamp(2rem,5vw,4rem)]">
                From the <span className="font-serif italic font-normal text-[#0F6E56]">journal.</span>
              </h2>
            </div>
            <Link href="/blog" className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#0F6E56] transition-colors">
              All articles <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {latestPosts.map((post, idx) => (
              <BlogCard key={idx} post={post} index={idx} />
            ))}
          </div>

          <div className="text-center mt-10 md:hidden">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#0F6E56] transition-colors">
              All articles <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. TRUST SIGNALS — keeps the existing component but lets it
             breathe within the new rhythm
          ───────────────────────────────────────────────────────────── */}
      <TrustSignals stats={{
        totalListings: stats.total,
        totalCities: stats.cities,
        totalStates: stats.states,
        avgRating: parseFloat(stats.avgRating),
      }} />

      {/* ─────────────────────────────────────────────────────────────
          9. CLOSING CTA — single emerald moment, sparse copy
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#0F6E56] text-white py-20 md:py-36 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-white/5 rounded-full blur-[200px] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

        <div className="max-w-4xl mx-auto text-center relative">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/50 mb-8 block">Your match is waiting</span>
          <h2 className="font-black tracking-[-0.025em] leading-[1] text-[clamp(2.5rem,6vw,5rem)] mb-10">
            Stop guessing.<br />
            <span className="font-serif italic font-normal text-white/85">Start healing.</span>
          </h2>
          <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto mb-14 leading-relaxed font-light">
            Five questions. One match. The right drip, the right clinic, the first time.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <Link
              href="/quiz"
              className="group inline-flex items-center justify-center gap-3 bg-white text-[#0F6E56] px-10 py-5 rounded-full font-bold text-base transition-all hover:bg-white/95 hover:-translate-y-0.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)]"
            >
              Get My Match Now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 text-white/85 hover:text-white px-10 py-5 rounded-full font-bold text-base border border-white/25 hover:border-white/50 transition-colors"
            >
              Browse Clinics
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          10. CLINICIAN SECTION — keep existing component
          ───────────────────────────────────────────────────────────── */}
      <ClinicianSection stats={{
        totalListings: stats.total,
        totalCities: stats.cities,
        totalStates: stats.states,
        avgRating: parseFloat(stats.avgRating),
        isLive: true,
      }} />

      <Footer />
    </div>
  );
}
