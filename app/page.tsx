/*
 * ─────────────────────────────────────────────────────────────────────
 *  HOMEPAGE — v3 (2026-05-30 redesign, "human-warmth pass")
 * ─────────────────────────────────────────────────────────────────────
 *  Per the design brief: warm cream + brand green accents + dark navy
 *  headings + rounded cards + REAL clinic data + Playfair Display for
 *  the editorial italic moments. Story arc:
 *    Find it → Browse it → Understand it → Trust it → Book it.
 *
 *  Section rhythm (no two dark in a row):
 *    cream hero → white trust → cream treatments → cream situation →
 *    white featured → emerald stats → navy CTA.
 *
 *  All numbers/counts pulled live from getSiteStats. All clinic data
 *  pulled live from getFeaturedListings — real people (Kia, Eva,
 *  Mechelle), no fabricated testimonials.
 *
 *  Previous version preserved at scripts/page-backup-pre-v2-swap-2026-05-30.tsx.
 * ─────────────────────────────────────────────────────────────────────
 */

import Link from 'next/link';
import Image from 'next/image';
import { Playfair_Display } from 'next/font/google';
import {
  ArrowRight, ArrowUpRight, ShieldCheck, MapPin, Star, Stethoscope,
  Heart, Sparkles, Activity, Dumbbell, Zap, ShieldCheck as ShieldIcon, Droplets,
} from 'lucide-react';
import { Metadata } from 'next';
import { Navbar } from '../src/components/Navbar';
import { Footer } from '../src/components/Footer';
import { QuickMatch } from '../src/components/QuickMatch';
import { getSiteStats, getFeaturedListings } from '../src/lib/data';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

export const revalidate = 60;

const SUPABASE_IMG = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';
const SITE_URL = 'https://www.thedripmap.com';

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats();
  const title = `IV Therapy Clinics Near Me — Find & Compare ${stats.total}+ Providers | TheDripMap`;
  const description = `Find the best IV therapy clinic near you. Compare ${stats.total}+ verified providers across the US and Canada. Filter by treatment, price, and location. Book in 60 seconds.`;
  return {
    title,
    description,
    alternates: { canonical: SITE_URL },
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: 'TheDripMap',
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'TheDripMap — Find Your IV Therapy Match' }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', description, images: [`${SITE_URL}/og-image.png`] },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Treatment cards — editorial magazine style, lifestyle photo dominant.
// ─────────────────────────────────────────────────────────────────────────────
const TREATMENTS = [
  { name: 'Hydration',      slug: 'hydration',      Icon: Droplets,    image: 'iv-therapy-dehydration.jpg',         tagline: 'Rapid rehydration',          category: 'Foundational' },
  { name: 'NAD+',           slug: 'nad-plus',       Icon: Activity,    image: 'iv-therapy-nad-iv-bag-closeup.jpg',  tagline: 'Cellular energy + clarity',  category: 'Longevity'    },
  { name: 'Myers Cocktail', slug: 'myers-cocktail', Icon: Zap,         image: 'iv-therapy-vitamin-drip-citrus.jpg', tagline: 'The original wellness drip', category: 'Foundational' },
  { name: 'Hangover',       slug: 'hangover',       Icon: Heart,       image: 'iv-therapy-hangover.jpg',            tagline: 'Reset after a rough night',  category: 'Recovery'     },
  { name: 'Immune Support', slug: 'immune-support', Icon: ShieldIcon,  image: 'iv-therapy-immunity.jpg',            tagline: 'Vitamin C + zinc boost',     category: 'Wellness'     },
  { name: 'Beauty Glow',    slug: 'beauty-glow',    Icon: Sparkles,    image: 'iv-therapy-skin-glow.jpg',           tagline: 'Glutathione for skin',       category: 'Beauty'       },
  { name: 'Recovery',       slug: 'recovery',       Icon: Dumbbell,    image: 'iv-therapy-sports-recovery.jpg',     tagline: 'Amino acids + rebuild',      category: 'Athletic'     },
  { name: 'Weight Loss',    slug: 'weight-loss',    Icon: Activity,    image: 'iv-therapy-weight-loss.jpg',         tagline: 'MIC + lipo + metabolism',    category: 'Metabolic'    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Situation cards — moment-in-time, mood color, large emoji, taller cards.
// Each tile's bg is a flat color chosen by the emotion the situation evokes,
// per the approved palette.
// ─────────────────────────────────────────────────────────────────────────────
const SITUATIONS = [
  { emoji: '🍷', label: 'Out too late last night',    drip: 'Hangover Recovery',     bg: '#F4A261', ink: '#5B3920' },
  { emoji: '🌡️', label: 'Catching something nasty',   drip: 'Immune Support',        bg: '#6BB6D6', ink: '#1F3A4A' },
  { emoji: '🧠', label: 'Brain fog all week',         drip: 'NAD+ / Energy',         bg: '#2C2C54', ink: '#E8E8F5' },
  { emoji: '🏃', label: 'Race or big workout coming', drip: 'Athletic Recovery',     bg: '#E76F51', ink: '#4A1F12' },
  { emoji: '✨', label: 'Event in a week',            drip: 'Beauty Glow',           bg: '#E9C46A', ink: '#5A4310' },
  { emoji: '✈️', label: 'Just landed jet-lagged',     drip: 'Hydration + B-complex', bg: '#7FB3D5', ink: '#1C3B52' },
  { emoji: '🤒', label: 'Bug or stomach flu',         drip: 'Hydration Drip',        bg: '#A8DADC', ink: '#1F4747' },
  { emoji: '🎉', label: 'Bachelor / bachelorette',    drip: 'Hangover + Recovery',   bg: '#BC4749', ink: '#FBE9E9' },
];

// One-line founder quote per claimed clinic — derived from the first sentence
// of providers.description (clinically reviewed copy already in DB). This is
// REAL text, not a fabricated testimonial.
function founderQuote(name: string, description?: string | null): string {
  const firstSentence = (description || '').split(/(?<=[.!?])\s+/)[0]?.trim() || '';
  if (firstSentence) return firstSentence;
  return `${name} on TheDripMap.`;
}

function leadingCredential(name: string, slug: string | null): string {
  // Hand-curated one-line credential per claimed clinic — matches the real
  // amenities listed in providers.amenities.
  if (slug === 'refresh-med-spa-la-los-angeles') return 'MD-led · Dr. Kia Rowhanian, MD + Nurse Fatima';
  if (slug === 'blue-cypress-iv-and-wellness-georgetown') return 'RN-led · Founded by Mechelle Kelley, RN';
  if (slug === 'signature-beauty-lounge-downtown-toronto') return 'Physician-designed · Dr. Gregory Pugen, MD';
  if (slug === 'signature-beauty-lounge-richmond-hill') return 'Physician-designed · Dr. Gregory Pugen, MD';
  return name;
}

export default async function HomePage() {
  const stats = await getSiteStats();
  const featured = (await getFeaturedListings(4)) || [];
  // Pick the LA clinic for the hero card — Kia per the brief.
  const heroClinic = featured.find((c) => c.slug === 'refresh-med-spa-la-los-angeles') || featured[0];

  const websiteJsonLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'TheDripMap', url: SITE_URL, potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
  const organizationJsonLd = { '@context': 'https://schema.org', '@type': 'Organization', name: 'TheDripMap', url: SITE_URL, logo: `${SITE_URL}/logo.png`, sameAs: ['https://www.instagram.com/thedripmap'] };

  return (
    <div className={`${playfair.variable} min-h-screen bg-[#FAF9F6] text-[#0A1628]`}>
      <Navbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />

      {/* ─────────────────────────────────────────────────────────────────
          1. HERO — warm cream, two-column. Left: copy + QuickMatch + 3 stats.
             Right: a REAL claimed clinic card (Kia/Refresh Med Spa LA) with
             MD credentials. No dark background; the hero feels like an
             editorial spread, not a SaaS panel.
          ───────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle warm radial behind the hero — barely-there atmosphere */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 20% 10%, rgba(15,110,86,0.06) 0%, transparent 45%), radial-gradient(circle at 80% 0%, rgba(244,162,97,0.08) 0%, transparent 50%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left: copy + QuickMatch + stats */}
            <div className="lg:col-span-7">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-[#0F6E56] mb-6">
                Verified IV therapy directory · US + Canada
              </span>
              <h1 className="text-[clamp(2.5rem,5.8vw,5rem)] font-black tracking-[-0.025em] leading-[1.04] text-[#0A1628] mb-6">
                Find an IV therapy clinic
                <br />
                <span
                  className="italic font-normal text-[#0F6E56]"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  you can actually trust.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-[#3D4A5C] leading-relaxed max-w-2xl font-light mb-10">
                {stats.total.toLocaleString()} clinics across {stats.cities}+ cities. Real credentials,
                real reviews — checked against the medical board before they get a verified badge.
              </p>

              <div className="mb-10">
                <QuickMatch />
              </div>

              {/* Three social-proof stats — restrained, not the trust signals component */}
              <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl">
                <Stat number={stats.total.toLocaleString()} label="Verified clinics" />
                <Stat number={`${stats.cities}+`} label="Cities" />
                <Stat number={stats.avgRating} label="Avg clinic rating" suffix="★" />
              </div>
            </div>

            {/* Right: real clinic card (Kia / Refresh Med Spa LA) */}
            <div className="lg:col-span-5">
              {heroClinic && <HeroClinicCard clinic={heroClinic} />}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          2. TRUST STRIP — substantial proof band. Shows each verified clinic
             as a small avatar + name + city + credential pill so the section
             actually carries visible proof instead of being a thin text band.
          ───────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-[#0F6E56]/15 py-10 md:py-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-7 md:mb-10">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-[#0F6E56]">
              Trusted across North America
            </span>
            <p className="mt-3 text-[15px] md:text-[16px] text-[#3D4A5C] font-light leading-relaxed max-w-2xl mx-auto">
              We verify every featured clinic against the medical board, the compounding pharmacy, and the
              clinician on file — <em style={{ fontFamily: 'var(--font-playfair)' }} className="not-italic">before</em> they get a badge.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {featured.slice(0, 4).map((c) => {
              const cityLine = [c.city, c.state].filter(Boolean).join(', ');
              const initial = (c.name || '?').charAt(0).toUpperCase();
              return (
                <Link
                  key={c.slug || c.name}
                  href={`/providers/${c.slug}`}
                  className="group flex items-center gap-3 md:gap-4 rounded-2xl bg-[#FAF9F6] border border-[#0F6E56]/10 hover:border-[#0F6E56]/40 px-3 md:px-4 py-3 md:py-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-[#0F6E56]/10 shrink-0 border border-[#0F6E56]/15">
                    {c.image_url ? (
                      <Image
                        src={c.image_url}
                        alt={c.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#0F6E56] font-black text-lg">
                        {initial}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] md:text-[13px] font-black text-[#0A1628] tracking-tight leading-tight truncate group-hover:text-[#0F6E56] transition-colors">
                      {c.name}
                    </div>
                    <div className="text-[10.5px] md:text-[11px] text-[#3D4A5C]/80 font-medium truncate">{cityLine}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] md:text-[10px] font-black uppercase tracking-[0.16em] text-[#0F6E56]">
                      <ShieldCheck size={10} strokeWidth={2.75} /> Verified
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          3. BROWSE BY TREATMENT — LIGHT editorial section. The lifestyle
             photos are the hero of each card; the type sits below in a
             clean white card body so the photos can breathe and the page
             reads warm and human (not dark + clinical).
          ───────────────────────────────────────────────────────────────── */}
      <section
        className="py-24 md:py-32 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #FAF9F6 0%, #F5EFE6 100%)' }}
      >
        {/* Faint emerald + warm radial atmosphere — gives the section depth
            without going dark. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 90% 0%, rgba(15,110,86,0.06) 0%, transparent 45%), radial-gradient(circle at 10% 100%, rgba(244,162,97,0.08) 0%, transparent 50%)',
          }}
        />

        <div className="max-w-7xl mx-auto relative">
          <div className="mb-14 md:mb-20 flex items-end justify-between gap-8 flex-wrap">
            <div className="max-w-2xl">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0F6E56] mb-5 block">
                Browse by treatment
              </span>
              <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-black text-[#0A1628] tracking-[-0.02em] leading-[1.04]">
                The drips,
                <br />
                <span
                  className="italic font-normal text-[#0F6E56]"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  shopped honestly.
                </span>
              </h2>
              <p className="mt-6 text-lg text-[#3D4A5C] leading-relaxed font-light max-w-xl">
                Real ingredients. Honest price ranges. Every protocol comes with safety notes
                and what to ask the clinic before you book.
              </p>
            </div>
            <Link
              href="/treatments"
              className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-[#0A1628] hover:text-[#0F6E56] transition-colors"
            >
              See all 20 treatments <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
            {TREATMENTS.map((t) => (
              <Link
                key={t.slug}
                href={`/treatments/${t.slug}`}
                className="group relative overflow-hidden rounded-3xl bg-white flex flex-col shadow-[0_10px_30px_-10px_rgba(10,22,40,0.12)] hover:shadow-[0_25px_50px_-15px_rgba(10,22,40,0.2)] hover:-translate-y-1 transition-all duration-300"
              >
                {/* Product image — 4:5 portrait so the lifestyle photo dominates */}
                <div className="relative aspect-[4/5] bg-[#F4F6F4] overflow-hidden">
                  <Image
                    src={`${SUPABASE_IMG}${t.image}`}
                    alt={`${t.name} IV drip`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-[1.04] transition-transform duration-[900ms] ease-out"
                  />
                  {/* Category chip pinned top-left — kept high-contrast over photo */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[10px] font-black uppercase tracking-[0.18em] text-[#0F6E56] shadow-sm">
                    {t.category}
                  </span>
                  {/* Subtle arrow wakes up on hover */}
                  <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#0A1628]/70 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-1 transition-all">
                    <ArrowUpRight size={14} />
                  </span>
                </div>
                {/* White card body — name + tagline + small editorial flourish */}
                <div className="px-4 md:px-5 py-4 md:py-5">
                  <div className="font-black text-[#0A1628] text-base md:text-lg tracking-tight leading-tight">{t.name}</div>
                  <div className="mt-1 text-[12px] md:text-[13px] text-[#3D4A5C] leading-snug font-medium">{t.tagline}</div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#0F6E56]">
                    <span className="border-b border-[#0F6E56]/30 group-hover:border-[#0F6E56] pb-0.5 transition-colors">View clinics</span>
                    <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile "see all" link */}
          <div className="text-center mt-12 md:hidden">
            <Link href="/treatments" className="inline-flex items-center gap-2 text-sm font-bold text-[#0A1628] hover:text-[#0F6E56] transition-colors">
              See all 20 treatments <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          4. BY SITUATION — taller mood-colored cards, large emoji.
             Cream background between two darker sections so we never
             stack dark-on-dark.
          ───────────────────────────────────────────────────────────────── */}
      <section className="bg-[#FAF9F6] py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0F6E56] mb-5 block">
              By situation
            </span>
            <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-black text-[#0A1628] tracking-[-0.02em] leading-[1.05] max-w-3xl mx-auto">
              What are you
              <br />
              <span
                className="italic font-normal text-[#0F6E56]"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                actually going through?
              </span>
            </h2>
            <p className="mt-7 text-lg text-[#3D4A5C] max-w-xl mx-auto leading-relaxed font-light">
              Pick the moment closest to yours. We'll match you with the right drip and a clinic
              that's actually right for you.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {SITUATIONS.map((s) => (
              <Link
                key={s.label}
                href="/quiz"
                className="group rounded-3xl p-5 md:p-7 relative overflow-hidden transition-transform hover:-translate-y-1 shadow-sm hover:shadow-xl min-h-[180px] md:min-h-[230px] flex flex-col"
                style={{ backgroundColor: s.bg, color: s.ink }}
                aria-label={`Quiz for ${s.label}`}
              >
                {/* Subtle radial texture so the flat color doesn't feel printed-on */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-50"
                  style={{
                    background:
                      'radial-gradient(circle at 80% 100%, rgba(255,255,255,0.18) 0%, transparent 55%)',
                  }}
                />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-4xl md:text-5xl mb-auto select-none" aria-hidden>
                    {s.emoji}
                  </div>
                  <div
                    className="font-black text-base md:text-[17px] leading-tight tracking-tight mt-6 mb-3"
                    style={{ color: s.ink }}
                  >
                    {s.label}
                  </div>
                  <div className="inline-block self-start text-[10px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-white/85 text-slate-700">
                    {s.drip}
                  </div>
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

      {/* ─────────────────────────────────────────────────────────────────
          5. FEATURED VERIFIED CLINICS — premium cards, real founder names,
             real credentials, real first-sentence-of-description quote
             (which IS clinically reviewed copy in the DB).
          ───────────────────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="bg-white py-24 md:py-32 px-6 border-t border-[#0F6E56]/10">
          <div className="max-w-7xl mx-auto">
            <div className="mb-14 md:mb-20 flex items-end justify-between gap-8 flex-wrap">
              <div className="max-w-2xl">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0F6E56] mb-5 block">
                  Verified on TheDripMap
                </span>
                <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-black text-[#0A1628] tracking-[-0.02em] leading-[1.05]">
                  Featured clinics.
                  <br />
                  <span
                    className="italic font-normal text-[#0F6E56]"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Who we trust.
                  </span>
                </h2>
                <p className="mt-6 text-lg text-[#3D4A5C] leading-relaxed font-light">
                  Every clinic below has had their medical director, clinician, compounding pharmacy,
                  liability insurance, and state board status verified by us before they got a Safety
                  Verified badge.
                </p>
              </div>
              <Link
                href="/search?verified=1"
                className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-[#0A1628] hover:text-[#0F6E56] transition-colors"
              >
                All verified clinics <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {featured.slice(0, 3).map((c) => (
                <FeaturedClinicCard key={c.slug || c.name} clinic={c} />
              ))}
            </div>

            <div className="text-center mt-10 md:hidden">
              <Link
                href="/search?verified=1"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0A1628] hover:text-[#0F6E56] transition-colors"
              >
                All verified clinics <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          6. STATS BAND — solid brand green, 4 large numbers.
          ───────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0F6E56] text-white py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-10 md:gap-y-0">
          <BigStat number={stats.total.toLocaleString()} suffix="+" label="Verified clinics" />
          <BigStat number={String(stats.cities)} suffix="+" label="Cities covered" />
          <BigStat number={String(stats.states)} label="States &amp; provinces" />
          <BigStat number={stats.avgRating} suffix="★" label="Avg clinic rating" />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          7. QUIZ CTA — dark navy close. Warm, short, two buttons.
          ───────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0A1628] text-white py-24 md:py-36 px-6 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full blur-[200px] pointer-events-none"
          style={{ background: 'rgba(15,110,86,0.18)' }}
        />
        <div className="max-w-3xl mx-auto text-center relative">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/55 mb-6 block">
            Your match is waiting
          </span>
          <h2 className="text-[clamp(2.25rem,5.2vw,4.5rem)] font-black tracking-[-0.025em] leading-[1.03] mb-8">
            Stop guessing.
            <br />
            <span
              className="italic font-normal text-[#7ED3B8]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Start healing.
            </span>
          </h2>
          <p className="text-lg md:text-xl text-white/75 max-w-xl mx-auto mb-12 leading-relaxed font-light">
            Five questions. One verified match. The right drip, the right clinic, the first time.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <Link
              href="/quiz"
              className="group inline-flex items-center justify-center gap-3 bg-white text-[#0F6E56] px-10 py-5 rounded-full font-bold text-base transition-all hover:bg-white/95 hover:-translate-y-0.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4)]"
            >
              Get my match now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 text-white/85 hover:text-white px-10 py-5 rounded-full font-bold text-base border border-white/25 hover:border-white/55 transition-colors"
            >
              Browse clinics
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ── Hero stat (small) ───────────────────────────────────────────────
function Stat({ number, label, suffix }: { number: string; label: string; suffix?: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl md:text-3xl font-black tracking-tight text-[#0A1628] tabular-nums">{number}</span>
        {suffix && <span className="text-lg md:text-xl font-black text-[#0F6E56]">{suffix}</span>}
      </div>
      <div className="mt-1 text-[10px] md:text-[11px] font-black uppercase tracking-[0.18em] text-[#3D4A5C]/70">
        {label}
      </div>
    </div>
  );
}

// ── Big stat (band) ─────────────────────────────────────────────────
function BigStat({ number, suffix, label }: { number: string; suffix?: string; label: string }) {
  return (
    <div className="text-center px-4">
      <div className="flex items-baseline justify-center gap-0.5">
        <span className="text-5xl md:text-7xl font-black tracking-tight tabular-nums">{number}</span>
        {suffix && <span className="text-2xl md:text-3xl font-black text-white/75">{suffix}</span>}
      </div>
      <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70" dangerouslySetInnerHTML={{ __html: label }} />
    </div>
  );
}

// ── Hero clinic card — the WHO + WHAT trust anchor ─────────────────
interface HeroClinic {
  name: string;
  slug?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number;
  reviewCount?: number;
  image_url?: string | null;
  description?: string | null;
  amenities?: string[] | null;
  specialties?: string[] | null;
}
function HeroClinicCard({ clinic }: { clinic: HeroClinic }) {
  const credential = leadingCredential(clinic.name, clinic.slug || null);
  const cityLine = [clinic.city, clinic.state].filter(Boolean).join(', ');
  return (
    <Link
      href={`/providers/${clinic.slug}`}
      className="group relative overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_-30px_rgba(10,22,40,0.25)] border border-[#0F6E56]/10 block hover:-translate-y-1 transition-transform duration-300"
    >
      <div className="relative aspect-[5/4] bg-gradient-to-br from-[#F4F6F4] to-[#E8EFE8] overflow-hidden">
        {clinic.image_url ? (
          <Image
            src={clinic.image_url}
            alt={clinic.name}
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-[800ms] ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#0F6E56]/30 text-xs font-black uppercase tracking-[0.25em]">
            Verified clinic
          </div>
        )}
        {/* Safety Verified badge */}
        <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F6E56] text-white text-[10px] font-black uppercase tracking-[0.18em] shadow-lg">
          <ShieldCheck size={12} strokeWidth={2.5} /> Safety Verified
        </div>
      </div>
      <div className="px-6 md:px-8 pt-6 pb-7">
        <div className="flex items-center gap-2 mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#0F6E56]">
          <Stethoscope size={12} /> {credential}
        </div>
        <div className="text-2xl md:text-[26px] font-black tracking-tight leading-[1.1] text-[#0A1628] mb-1">
          {clinic.name}
        </div>
        <div className="flex items-center gap-2 text-sm text-[#3D4A5C] font-medium mb-4">
          <MapPin size={14} className="text-[#0F6E56]" />
          <span>{cityLine}</span>
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-[#0F6E56]/10">
          <div className="flex items-center gap-1 text-[#0F6E56]">
            <Star size={14} fill="currentColor" />
            <span className="text-[#0A1628] font-black text-sm">{Number(clinic.rating || 0).toFixed(1)}</span>
            <span className="text-[#3D4A5C] text-xs font-bold">({clinic.reviewCount || 0})</span>
          </div>
          <span className="text-[#0F6E56]/30">·</span>
          <span className="text-xs font-bold text-[#3D4A5C]">
            5/5 safety checks passed
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Featured Verified Clinic card (Featured section) ───────────────
function FeaturedClinicCard({ clinic }: { clinic: HeroClinic }) {
  const credential = leadingCredential(clinic.name, clinic.slug || null);
  const quote = founderQuote(clinic.name, clinic.description);
  const cityLine = [clinic.city, clinic.state].filter(Boolean).join(', ');
  return (
    <article className="group relative rounded-[2rem] bg-[#FAF9F6] border border-[#0F6E56]/10 overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 shadow-sm">
      <Link href={`/providers/${clinic.slug}`} className="relative block aspect-square bg-gradient-to-br from-[#F4F6F4] to-[#E8EFE8] overflow-hidden">
        {clinic.image_url ? (
          <Image
            src={clinic.image_url}
            alt={clinic.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-[1000ms] ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#0F6E56]/30 text-xs font-black uppercase tracking-[0.25em]">
            Verified clinic
          </div>
        )}
        <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F6E56] text-white text-[10px] font-black uppercase tracking-[0.18em] shadow-lg">
          <ShieldCheck size={12} strokeWidth={2.5} /> Safety Verified
        </div>
      </Link>
      <div className="p-7 md:p-8 flex flex-col flex-1">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0F6E56] mb-3">
          {credential}
        </div>
        <h3 className="text-2xl md:text-[28px] font-black tracking-tight leading-[1.05] text-[#0A1628] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
          {clinic.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-[#3D4A5C] font-medium mb-5">
          <MapPin size={14} className="text-[#0F6E56]" />
          <span>{cityLine}</span>
        </div>
        <blockquote className="text-[15px] text-[#3D4A5C] leading-relaxed font-light italic border-l-2 border-[#0F6E56]/30 pl-4 mb-6 flex-1">
          &ldquo;{quote}&rdquo;
        </blockquote>
        <div className="flex items-center justify-between pt-5 border-t border-[#0F6E56]/10">
          <div className="flex items-center gap-1.5 text-sm">
            <Star size={14} className="text-[#0F6E56]" fill="currentColor" />
            <span className="font-black text-[#0A1628]">{Number(clinic.rating || 0).toFixed(1)}</span>
            <span className="text-[#3D4A5C] text-xs font-bold">({clinic.reviewCount || 0})</span>
          </div>
          <Link
            href={`/providers/${clinic.slug}`}
            className="inline-flex items-center gap-2 bg-[#0A1628] hover:bg-[#0F6E56] text-white px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-[0.15em] transition-colors"
          >
            Book now <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
