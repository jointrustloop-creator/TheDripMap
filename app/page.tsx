import Link from 'next/link';
import Image from 'next/image';
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
  Stethoscope,
  Check,
  FlaskConical,
  UserCheck,
} from 'lucide-react';
import { Navbar } from '../src/components/Navbar';
import { Footer } from '../src/components/Footer';
import { BlogCard } from '../src/components/BlogCard';
import { QuickMatch } from '../src/components/QuickMatch';
import { ClinicianSection } from '../src/components/ClinicianSection';
import { TrustSignals } from '../src/components/TrustSignals';
import { getBlogPosts, getSiteStats, getPopularCities, getFeaturedListings } from '../src/lib/data';
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
  // Featured Verified Clinics — pull the 4 claimed listings live from Supabase
  // so the homepage always reflects current claimed-and-verified status.
  const featuredClinics = (await getFeaturedListings(4)) || [];
  const latestPosts = blogPosts.slice(0, 3);

  const websiteJsonLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'TheDripMap', url: 'https://www.thedripmap.com', potentialAction: { '@type': 'SearchAction', target: 'https://www.thedripmap.com/search?q={search_term_string}', 'query-input': 'required name=search_term_string' } };
  const organizationJsonLd = { '@context': 'https://schema.org', '@type': 'Organization', name: 'TheDripMap', url: 'https://www.thedripmap.com', logo: 'https://www.thedripmap.com/logo.png', sameAs: ['https://www.instagram.com/thedripmap'] };

  // Product-card data for the dark drip menu. Each card shows an actual IV-bag
  // / drip product photo (Supabase blog-images) with name, one-line "what it
  // does" tagline, category chip, and typical price band — Weedmaps-style
  // product shelf rather than the previous icon-tile grid.
  const services = [
    { name: 'Hydration',      slug: 'hydration',      Icon: Droplets,    image: 'iv-therapy-dehydration.jpg',         tagline: 'Rapid rehydration',          category: 'Foundational',  priceFrom: 100 },
    { name: 'NAD+',           slug: 'nad-plus',       Icon: Activity,    image: 'iv-therapy-nad-iv-bag-closeup.jpg',  tagline: 'Cellular energy + clarity',  category: 'Longevity',     priceFrom: 400 },
    { name: 'Myers Cocktail', slug: 'myers-cocktail', Icon: Zap,         image: 'iv-therapy-vitamin-drip-citrus.jpg', tagline: 'The original wellness drip', category: 'Foundational',  priceFrom: 150 },
    { name: 'Hangover',       slug: 'hangover',       Icon: Heart,       image: 'iv-therapy-hangover.jpg',            tagline: 'Reset after a rough night',  category: 'Recovery',      priceFrom: 150 },
    { name: 'Immune Support', slug: 'immune-support', Icon: ShieldCheck, image: 'iv-therapy-immunity.jpg',            tagline: 'Vitamin C + zinc boost',     category: 'Wellness',      priceFrom: 150 },
    { name: 'Beauty Glow',    slug: 'beauty-glow',    Icon: Sparkles,    image: 'iv-therapy-skin-glow.jpg',           tagline: 'Glutathione for skin',       category: 'Beauty',        priceFrom: 200 },
    { name: 'Recovery',       slug: 'recovery',       Icon: Dumbbell,    image: 'iv-therapy-sports-recovery.jpg',     tagline: 'Amino acids + rebuild',      category: 'Athletic',      priceFrom: 175 },
    { name: 'Weight Loss',    slug: 'weight-loss',    Icon: Activity,    image: 'iv-therapy-weight-loss.jpg',         tagline: 'MIC + lipo + metabolism',    category: 'Metabolic',     priceFrom: 175 },
  ];
  const DRIP_IMG_BASE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';

  // Each situation card gets a solid color wash driven by color psychology
  // (warm amber for regret/restoration, cool sky for clinical calm, etc.).
  // `bg` is the card background, `ink` is the darker on-color text shade.
  const situations = [
    { Icon: Wine,        label: 'Out too late last night',    drip: 'Hangover Recovery',  bg: '#F4A261', ink: '#5B3920' },
    { Icon: Thermometer, label: 'Catching something nasty',   drip: 'Immune Support',     bg: '#6BB6D6', ink: '#1F3A4A' },
    { Icon: Brain,       label: 'Brain fog all week',         drip: 'NAD+ / Energy',      bg: '#2C2C54', ink: '#E8E8F5' },
    { Icon: Dumbbell,    label: 'Race or big workout coming', drip: 'Athletic Recovery',  bg: '#E76F51', ink: '#4A1F12' },
    { Icon: Sparkles,    label: 'Event in a week',            drip: 'Beauty Glow',        bg: '#E9C46A', ink: '#5A4310' },
    { Icon: Plane,       label: 'Just landed jet-lagged',     drip: 'Hydration + B-complex', bg: '#7FB3D5', ink: '#1C3B52' },
    { Icon: Pill,        label: 'Bug or stomach flu',         drip: 'Hydration Drip',     bg: '#A8DADC', ink: '#1F4747' },
    { Icon: PartyPopper, label: 'Bachelor / bachelorette',    drip: 'Hangover + Recovery',bg: '#BC4749', ink: '#FBE9E9' },
  ];

  const guides = [
    { num: '01', label: 'Pricing',         title: 'What IV therapy actually costs',         href: '/guide/iv-therapy-cost-guide',                desc: 'Hangover, NAD+, Myers, recovery — real 2026 ranges across US and Canadian metros.',                image: 'iv-therapy-vitamin-drip-citrus.jpg' },
    { num: '02', label: 'Quality Signals', title: 'How to choose a clinic',                 href: '/guide/how-to-choose-iv-therapy-clinic',      desc: 'The 7 things every reputable IV therapy clinic should have. Walk away if any are missing.', image: 'iv-therapy-modern-clinic-recliners.jpg' },
    { num: '03', label: 'Walk-through',    title: 'Your first session, step by step',       href: '/guide/first-time-iv-therapy-what-to-expect', desc: 'Intake to needle to discharge. What to expect, what to ask, how to know it went well.',     image: 'iv-therapy-nad-iv-bag-closeup.jpg' },
  ];
  const GUIDE_IMG_BASE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';

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
          1.5. THE STANDARD — premium "manifesto" banner under the hero.
              Cinematic spa-reception photo on the left; editorial copy
              + four trust pillars on the right. Replaces what used to be
              a flat 4-photo strip and now reads like the brand promise of
              a high-end IV therapy clinic, not a SaaS landing page.
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#F8F7F3] px-6 py-16 md:py-24 relative overflow-hidden">
        {/* Atmospheric warm glow + faint emerald — premium spa lounge vibe */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 0% 100%, rgba(244,196,160,0.22) 0%, transparent 55%), radial-gradient(ellipse at 100% 0%, rgba(15,110,86,0.08) 0%, transparent 50%)',
          }}
        />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Cinematic photo — soft drop shadow + tinted gradient frame so the
                clinic-reception shot reads as the actual standard we hold ourselves to. */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="relative aspect-[4/5] md:aspect-[5/6] lg:aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-30px_rgba(15,40,30,0.35)]">
                <Image
                  src={`${DRIP_IMG_BASE}iv-therapy-spa-reception-recliners.jpg`}
                  alt="A modern IV therapy spa reception interior"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                {/* Editorial wash — soft warm overlay so the photo reads like a
                    magazine spread, not a stock shot. */}
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-soft-light"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,229,196,0.4) 0%, rgba(255,229,196,0) 50%, rgba(15,110,86,0.15) 100%)',
                  }}
                />
                {/* Floating "since 2024" emblem — gives the photo provenance */}
                <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-lg">
                  <ShieldCheck size={14} className="text-[#0F6E56]" strokeWidth={2.5} />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-900">Safety Verified Standard</span>
                </div>
              </div>
            </div>

            {/* Editorial copy + trust pillars */}
            <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#0F6E56] mb-5 md:mb-6 block">
                The Safety Verified Badge
              </span>
              <h2 className="font-black text-slate-900 tracking-[-0.025em] leading-[1.02] text-[clamp(2rem,4.5vw,3.75rem)] mb-6 md:mb-7">
                Earned,<br />
                <span className="font-serif italic font-normal text-[#0F6E56]">never bought.</span>
              </h2>
              <p className="text-base md:text-lg text-slate-500 leading-relaxed font-light max-w-xl mb-8 md:mb-10">
                When a clinic carries the Safety Verified badge, it has answered our safety
                questionnaire in writing — who oversees care, who performs your insert, where its IV
                solutions come from, and whether an intake is required before treatment. We don't
                take a cent for placement, and we never buy or sell reviews.
              </p>

              {/* Trust pillars — refined row, NOT a SaaS feature grid. */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-2xl">
                {[
                  { Icon: Stethoscope, label: 'Medical director on file',         detail: 'Clinic confirms a licensed physician oversees care' },
                  { Icon: UserCheck,   label: 'Licensed clinicians — not techs',  detail: 'Clinic confirms an RN or NP performs every insert' },
                  { Icon: FlaskConical,label: 'Pharmacy-sourced solutions',       detail: 'Clinic confirms a licensed compounding pharmacy — no grey-market' },
                  { Icon: Check,       label: 'Intake before infusion',           detail: 'Clinic confirms a clinical assessment before treatment' },
                ].map(({ Icon, label, detail }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 p-3.5 md:p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#0F6E56]/10"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#0F6E56]/10 text-[#0F6E56] flex items-center justify-center shrink-0">
                      <Icon size={16} strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] md:text-[13px] font-black text-slate-900 tracking-tight leading-tight">{label}</div>
                      <div className="text-[10.5px] md:text-[11px] text-slate-500 font-medium leading-snug mt-1">{detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 md:mt-6 text-[11px] md:text-[12px] text-slate-500/80 leading-relaxed max-w-xl">
                Safety Verified reflects each clinic's written answers to our questionnaire, not an independent medical audit. Always confirm credentials directly with your provider.
              </p>
            </div>
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
          3. DRIP MENU — warm cream marble, white cards with smaller
              square product images and editorial type. Reads like a
              high-end spa menu, not a SaaS product grid.
          ───────────────────────────────────────────────────────────── */}
      <section
        className="px-6 py-20 md:py-32 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #F5EFE6 0%, #F8F2E8 100%)' }}
      >
        {/* Soft marble-like atmosphere — barely-there warm radial accents */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 100% 0%, rgba(15,110,86,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 0% 100%, rgba(244,196,160,0.18) 0%, transparent 55%)',
          }}
        />
        {/* Faint dot grid masked to edges — subtle texture, not loud */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(15,110,86,0.10) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, black, transparent 75%)',
          }}
        />

        <div className="max-w-6xl mx-auto relative">
          <div className="mb-14 md:mb-20 flex items-end justify-between gap-8 flex-wrap">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#0F6E56] mb-5 md:mb-6 block">The Menu</span>
              <h2 className="font-black text-slate-900 tracking-[-0.025em] leading-[1] text-[clamp(2rem,5vw,4rem)]">
                Browse by<br />
                <span className="font-serif italic font-normal text-[#0F6E56]">drip type.</span>
              </h2>
            </div>
            <Link href="/search" className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#0F6E56] transition-colors">
              See full directory <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {services.map((s) => (
              <Link
                key={s.slug}
                href={`/treatments/${s.slug}`}
                className="group relative bg-white rounded-3xl flex flex-col p-4 md:p-5 shadow-[0_10px_30px_-10px_rgba(15,40,30,0.12)] hover:shadow-[0_25px_50px_-15px_rgba(15,40,30,0.22)] hover:-translate-y-1 transition-all duration-300 border border-[#0F6E56]/5"
              >
                {/* Square product image — inset within the card with generous
                    padding around it so it reads like product photography in
                    a magazine, not a cropped lifestyle shot. */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F4F6F4] mb-4">
                  <Image
                    src={`${DRIP_IMG_BASE}${s.image}`}
                    alt={`${s.name} IV drip`}
                    fill
                    sizes="(max-width: 768px) 40vw, 22vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-[800ms] ease-out"
                  />
                  {/* Soft warm vignette — subtle, just enough to unify the photos */}
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-soft-light"
                    style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(255,228,196,0.4) 0%, rgba(255,228,196,0) 65%)' }}
                  />
                </div>
                {/* Editorial card foot — small category, big name, tagline,
                    "View clinics" affordance */}
                <div className="flex flex-col gap-1 md:gap-1.5 flex-1">
                  <span className="text-[9.5px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#0F6E56]/80">
                    {s.category}
                  </span>
                  <div className="font-black text-slate-900 text-lg md:text-[20px] tracking-tight leading-tight">{s.name}</div>
                  <div className="text-[12px] md:text-[13px] text-slate-500 leading-snug font-medium">{s.tagline}</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#0F6E56]">
                    <span className="border-b border-[#0F6E56]/30 group-hover:border-[#0F6E56] pb-0.5 transition-colors">View clinics</span>
                    <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12 md:mt-14">
            <Link
              href="/treatments"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0A1628] hover:text-[#0F6E56] transition-colors group"
            >
              <span className="border-b border-[#0F6E56]/40 group-hover:border-[#0F6E56] pb-0.5">See all 20 treatments</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {situations.map((s) => (
              <Link
                key={s.label}
                href="/quiz"
                className="group rounded-3xl p-5 md:p-7 relative overflow-hidden transition-transform hover:-translate-y-1 shadow-sm hover:shadow-xl"
                style={{ backgroundColor: s.bg, color: s.ink }}
                aria-label={`Quiz for ${s.label}`}
              >
                <s.Icon size={26} className="mb-6 opacity-90" strokeWidth={1.75} style={{ color: s.ink }} />
                <div className="font-black text-base md:text-[17px] leading-tight tracking-tight mb-3" style={{ color: s.ink }}>
                  {s.label}
                </div>
                <div className="inline-block text-[10px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-white/80 text-slate-700">
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
          4.5. FEATURED VERIFIED CLINICS — Weedmaps-style "featured brands"
              shelf. Pulls live from getFeaturedListings (claimed clinics
              with verified credentials). Real photos, real ratings.
          ───────────────────────────────────────────────────────────── */}
      {featuredClinics.length > 0 && (
      <section className="bg-white py-20 md:py-28 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 md:mb-16 flex items-end justify-between gap-8 flex-wrap">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56] mb-4 md:mb-6 block">Verified on TheDripMap</span>
              <h2 className="font-black text-slate-900 tracking-[-0.025em] leading-[1] text-[clamp(2rem,5vw,4rem)]">
                Featured clinics.<br />
                <span className="font-serif italic font-normal text-[#0F6E56]">Who we trust.</span>
              </h2>
            </div>
            <Link href="/search?verified=1" className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#0F6E56] transition-colors">
              All verified clinics <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {featuredClinics.slice(0, 4).map((c) => {
              const cityLine = [c.city, c.state].filter(Boolean).join(', ');
              const tagline = ((c as { description?: string }).description || '')
                .split(/(?<=[.!?])\s+/)[0]
                ?.replace(/^\s+|\s+$/g, '')
                .slice(0, 110) || ((c.specialties as string[] | undefined)?.slice(0, 2).join(' · ') || 'Verified IV therapy clinic');
              return (
                <Link
                  key={c.slug || c.name}
                  href={`/providers/${c.slug}`}
                  className="group relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                    {c.image_url ? (
                      <Image
                        src={c.image_url}
                        alt={c.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-[800ms] ease-out"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-[0.25em]">
                        TheDripMap
                      </div>
                    )}
                    {/* Safety Verified pill */}
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F6E56] text-white text-[10px] font-black uppercase tracking-[0.18em] shadow-md">
                      <ShieldCheck size={11} strokeWidth={2.5} /> Safety Verified
                    </span>
                  </div>
                  <div className="px-4 md:px-5 py-4 md:py-5 flex flex-col gap-1.5 flex-1">
                    <div className="font-black text-slate-900 text-base md:text-[17px] tracking-tight leading-tight">{c.name}</div>
                    <div className="text-[12px] md:text-[13px] text-slate-500 font-medium">{cityLine}</div>
                    {Number(c.rating) > 0 && (
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-[#0F6E56] font-black text-sm">★</span>
                        <span className="text-slate-900 font-black text-sm">{Number(c.rating).toFixed(1)}</span>
                        <span className="text-slate-400 text-xs font-bold">({c.reviewCount || 0})</span>
                      </div>
                    )}
                    <p className="text-[12.5px] text-slate-500 leading-relaxed mt-2 line-clamp-2">{tagline}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10 md:hidden">
            <Link href="/search?verified=1" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#0F6E56] transition-colors">
              All verified clinics <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      )}

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
              The big questions,<br />
              <span className="font-serif italic font-normal text-[#0F6E56]">answered plainly.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {guides.map((g) => (
              <Link
                key={g.num}
                href={g.href}
                className="group relative overflow-hidden rounded-3xl flex flex-col min-h-[420px] md:min-h-[480px] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
              >
                <Image
                  src={`${GUIDE_IMG_BASE}${g.image}`}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
                />
                {/* Strong dark gradient anchored at the bottom so the editorial
                    type stays legible no matter what the chosen image looks like. */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-slate-950/30" />
                {/* Subtle emerald wash on hover — same on-brand accent the
                    treatments index uses. */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0F6E56]/0 to-[#0F6E56]/0 group-hover:from-[#0F6E56]/25 group-hover:to-transparent transition-all duration-500" />

                <div className="relative z-10 p-7 md:p-12 flex flex-col h-full">
                  <div className="font-serif italic text-4xl md:text-5xl text-white/45 group-hover:text-[#7ED3B8] transition-colors mb-5 md:mb-8 font-normal">
                    {g.num}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70 mb-3">{g.label}</div>
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-[1.15] mb-4 drop-shadow">
                    {g.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed mb-8 flex-1 drop-shadow">{g.desc}</p>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#7ED3B8]">
                    <span>Read the guide</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
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
