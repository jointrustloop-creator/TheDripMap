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
  Stethoscope,
  Check,
  FlaskConical,
  UserCheck,
  MapPin,
} from 'lucide-react';
import { Navbar } from '../src/components/Navbar';
import { Footer } from '../src/components/Footer';
import { BlogCard } from '../src/components/BlogCard';
import { QuickMatch } from '../src/components/QuickMatch';
import { ClinicianSection } from '../src/components/ClinicianSection';
import { TrustSignals } from '../src/components/TrustSignals';
import { getBlogPosts, getSiteStats, getPopularCities, getFeaturedListings, getOperatorProfiles } from '../src/lib/data';
import { US_MARKET_ENABLED } from '../src/lib/market';
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
  // Title kept under ~60 visible chars so it never truncates in SERPs.
  // "Verified" is the differentiator word; the live count is the proof.
  const title = `IV Therapy Near Me: Compare ${stats.total}+ Verified Clinics | The Drip Map`;
  const description = `Find the right IV therapy clinic near you. Compare ${stats.total}+ IV therapy clinics across Canada and the US, see real drip menus and safety credentials, and match in 60 seconds.`;

  return {
    title,
    description,
    alternates: { canonical: 'https://www.thedripmap.com' },
    openGraph: {
      title,
      description,
      url: 'https://www.thedripmap.com',
      siteName: 'The Drip Map',
      images: [{ url: 'https://www.thedripmap.com/og-image.png', width: 1200, height: 630, alt: 'The Drip Map — Find Your IV Therapy Match' }],
      locale: 'en_CA',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', description, images: ['https://www.thedripmap.com/og-image.png'] },
  };
}

export default async function HomePage() {
  const stats = await getSiteStats();
  const blogPosts = await getBlogPosts();
  const popularCities = await getPopularCities();
  // Canada-only plan: the "Major metros" grid shows Canadian metros only while
  // US_MARKET_ENABLED is off. Reversible — flip the flag and US metros return.
  // Sliced to a multiple of the 4-column grid so it always renders flush
  // (8 Canada-only -> 4x2; 12 when the US is enabled -> 4x3).
  const metroCities = (
    US_MARKET_ENABLED ? popularCities : popularCities.filter((c) => c.country === 'Canada')
  ).slice(0, US_MARKET_ENABLED ? 12 : 8);
  // Featured Verified Clinics — pull the 4 claimed listings live from Supabase
  // so the homepage always reflects current claimed-and-verified status.
  // Canada-first: the homepage Featured shelf shows Canadian clinics only while
  // US_MARKET_ENABLED is off (reversible). US claimed/featured clinics keep their
  // live, verified listings — they simply do not take a slot on the Canadian
  // homepage, which would not reach their US patients anyway.
  const featuredClinics = (await getFeaturedListings(4, undefined, US_MARKET_ENABLED ? undefined : 'Canada')) || [];
  const latestPosts = blogPosts.slice(0, 3);

  // Per-clinic Safety Verified map for the featured shelf. As of 2026-06-08
  // the badge gates on providers.safety_verified (operator-set boolean) only.
  // Claimed and Safety Verified are explicitly separate signals.
  const safetyVerifiedById = new Map<string, boolean>();
  for (const c of featuredClinics) {
    safetyVerifiedById.set(String(c.id), (c as { safety_verified?: boolean }).safety_verified === true);
  }

  // Initials helper for the small circular logo chip when a clinic has no
  // standalone logo asset. "Signature Beauty Lounge, Downtown" -> "SBL".
  // Falls back to the first letter if only one word survives.
  const clinicInitials = (name: string): string => {
    const words = (name || '')
      .replace(/[^A-Za-z0-9\s'-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .filter(w => !['and', 'the', 'of', 'at', 'in'].includes(w.toLowerCase()));
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Real clinic-logo files placed under /public/images/clinic-logos/.
  // Mapping is hardcoded so we don't pay an fs probe per request — when
  // we onboard a new logo, add the slug here. Render with object-contain
  // on a white chip; the initials chip is only the fallback.
  const logoBySlug: Record<string, string> = {
    'blue-cypress-iv-and-wellness-georgetown':
      '/images/clinic-logos/blue-cypress-iv-and-wellness-georgetown.jpg',
    'signature-beauty-lounge-downtown-toronto':
      '/images/clinic-logos/signature-beauty-lounge-downtown-toronto.jpg',
    'signature-beauty-lounge-richmond-hill':
      '/images/clinic-logos/signature-beauty-lounge-richmond-hill.jpg',
    'diamond-aesthetics-brampton':
      '/images/clinic-logos/diamond-aesthetics-brampton.png',
    'bay-wellness-centre-vancouver':
      '/images/clinic-logos/bay-wellness-centre-vancouver.webp',
  };

  // WebSite + Organization JSON-LD are emitted once site-wide from
  // app/layout.tsx with the canonical Site Name signal ("The Drip Map"
  // primary, "TheDripMap" as alternateName). Removing the duplicate
  // declaration here so Google sees a single consistent name.

  // Product-card data for the dark drip menu. Each card shows an actual IV-bag
  // / drip product photo (Supabase blog-images) with name, one-line "what it
  // does" tagline, category chip, and typical price band — Weedmaps-style
  // product shelf rather than the previous icon-tile grid.
  // Curated 2026-06-03 — every image hand-picked from blog-images bucket for
  // (a) no baked-in marketing text, (b) high resolution (1200-1730 wide where
  // possible), (c) cohesive warm-light editorial palette so the 8-card grid
  // reads as designed, not assembled. objectPosition tunes focal point so
  // subjects aren't cropped badly inside the fixed-aspect frame.
  const services: Array<{
    name: string;
    slug: string;
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    image: string;
    tagline: string;
    category: string;
    priceFrom: number;
    objectPosition?: string;
  }> = [
    { name: 'Hydration',      slug: 'hydration',      Icon: Droplets,    image: '/images/treatments/hydration.png',      tagline: 'Rapid rehydration',          category: 'Foundational',  priceFrom: 100 },
    { name: 'NAD+',           slug: 'nad-plus',       Icon: Activity,    image: '/images/treatments/nad-plus.png',       tagline: 'Cellular energy + clarity',  category: 'Longevity',     priceFrom: 400 },
    { name: 'Myers Cocktail', slug: 'myers-cocktail', Icon: Zap,         image: '/images/treatments/myers-cocktail.png', tagline: 'The original wellness drip', category: 'Foundational',  priceFrom: 150 },
    { name: 'Hangover',       slug: 'hangover',       Icon: Heart,       image: '/images/treatments/hangover.png',       tagline: 'Reset after a rough night',  category: 'Recovery',      priceFrom: 150 },
    { name: 'Immune Support', slug: 'immune-support', Icon: ShieldCheck, image: '/images/treatments/immune-support.png', tagline: 'Vitamin C + zinc boost',     category: 'Wellness',      priceFrom: 150 },
    { name: 'Beauty Glow',    slug: 'beauty-glow',    Icon: Sparkles,    image: '/images/treatments/beauty-glow.png',    tagline: 'Glutathione for skin',       category: 'Beauty',        priceFrom: 200 },
    { name: 'Recovery',       slug: 'recovery',       Icon: Dumbbell,    image: '/images/treatments/recovery.png',       tagline: 'Amino acids + rebuild',      category: 'Athletic',      priceFrom: 175 },
    { name: 'Weight Loss',    slug: 'weight-loss',    Icon: Activity,    image: '/images/treatments/weight-loss.png',    tagline: 'MIC + lipo + metabolism',    category: 'Metabolic',     priceFrom: 175 },
  ];
  const DRIP_IMG_BASE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';

  // Photo-card situation set (2026-06-03). Each PNG in
  // /public/images/situations already has the situation's icon baked
  // into the top-left corner, so the card does NOT render a separate
  // icon overlay. Category pills use soft pastel tints (peach, teal,
  // lavender, butter, etc.) instead of the previous loud primaries to
  // fit the cream-and-emerald homepage palette.
  const situations: Array<{
    label: string;
    drip: string;
    image: string;
    pillBg: string;
    pillInk: string;
  }> = [
    { label: 'Out too late last night',    drip: 'Hangover Recovery',     image: '/images/situations/out-too-late.png',           pillBg: '#FBD0B6', pillInk: '#6B3A1B' },
    { label: 'Catching something nasty',   drip: 'Immune Support',        image: '/images/situations/catching-something-nasty.png', pillBg: '#C8E5E0', pillInk: '#1F4747' },
    { label: 'Brain fog all week',         drip: 'NAD+ / Energy',         image: '/images/situations/brain-fog.png',              pillBg: '#D8D5EC', pillInk: '#2C2C54' },
    { label: 'Race or big workout coming', drip: 'Athletic Recovery',     image: '/images/situations/race-or-workout.png',        pillBg: '#F4C9BB', pillInk: '#4A1F12' },
    { label: 'Event in a week',            drip: 'Beauty Glow',           image: '/images/situations/event-in-a-week.png',        pillBg: '#F2E4B4', pillInk: '#5A4310' },
    { label: 'Just landed jet-lagged',     drip: 'Hydration + B-complex', image: '/images/situations/jet-lagged.png',             pillBg: '#CFE0EE', pillInk: '#1C3B52' },
    { label: 'Bug or stomach flu',         drip: 'Hydration Drip',        image: '/images/situations/stomach-flu.png',            pillBg: '#CDE6E5', pillInk: '#1F4747' },
    { label: 'Bachelor / bachelorette',    drip: 'Hangover + Recovery',   image: '/images/situations/bachelor-bachelorette.png',  pillBg: '#EAC8C9', pillInk: '#5B2728' },
  ];

  const guides = [
    { num: '01', label: 'Prices',          title: 'What IV therapy actually costs',         href: '/iv-prices',                                  desc: 'Real published prices by Canadian city: low, median, and high per drip, from live clinic menus. Updated as clinics add prices.', image: 'iv-therapy-vitamin-drip-citrus.jpg' },
    { num: '02', label: 'Quality Signals', title: 'How to choose a clinic',                 href: '/guide/how-to-choose-iv-therapy-clinic',      desc: 'The 7 things every reputable IV therapy clinic should have. Walk away if any are missing.', image: 'iv-therapy-modern-clinic-recliners.jpg' },
    { num: '03', label: 'Walk-through',    title: 'Your first session, step by step',       href: '/guide/first-time-iv-therapy-what-to-expect', desc: 'Intake to needle to discharge. What to expect, what to ask, how to know it went well.',     image: 'iv-therapy-nad-iv-bag-closeup.jpg' },
  ];
  const GUIDE_IMG_BASE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* WebSite + Organization JSON-LD emitted once by app/layout.tsx */}

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
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56] text-center">Canada's IV therapy matching platform</span>
            <span className="hidden md:block h-px w-8 bg-[#0F6E56]" />
          </div>

          {/* Hero headline — dark ink with emerald serif italic accent */}
          <h1 className="text-center font-black tracking-[-0.03em] leading-[0.95] text-[clamp(2.75rem,7.5vw,6.5rem)] mb-6 text-slate-900">
            Find the right<br />
            <span className="font-serif italic font-normal text-[#0F6E56] tracking-[-0.02em]">IV therapy clinic.</span>
          </h1>

          <p className="text-center text-base md:text-[20px] text-slate-500 max-w-[620px] mx-auto mb-8 leading-relaxed font-light">
            Tell us your goal and location, and we match you to the right one of {stats.total.toLocaleString()} clinics across {stats.cities} cities, in under 60 seconds.
          </p>

          {/* QuickMatch — full width so the city picker + button breathe */}
          <div className="max-w-4xl mx-auto mb-4">
            <QuickMatch />
          </div>

          {/* Muted trust line directly under the search bar */}
          <p className="text-center text-[12px] md:text-[13px] text-slate-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Featured clinics answer our safety questionnaire in writing. We never sell placement.
          </p>

          {/* Trust row — typographic */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 md:gap-x-10 gap-y-3 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
            <span><span className="text-slate-900">{stats.total.toLocaleString()}</span> &nbsp;Clinics Listed</span>
            <span className="hidden md:inline text-slate-300">·</span>
            <span><span className="text-slate-900">{stats.cities}</span> &nbsp;Cities</span>
            <span className="hidden md:inline text-slate-300">·</span>
            <span><span className="text-slate-900">{stats.states}</span> &nbsp;Provinces &amp; States</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-stretch">
            {/* Cinematic photo — fills its frame edge to edge with a subtle
                inner gradient and an overlay verification badge sitting on
                the image (not floating in dead space below it). */}
            <div className="lg:col-span-6 order-2 lg:order-1 flex">
              <div className="relative w-full min-h-[480px] md:min-h-[560px] lg:min-h-0 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-30px_rgba(15,40,30,0.35)] bg-[#0F2E25]">
                <Image
                  src="/images/marketing/verified-clinic-thedripmap.png"
                  alt="TheDripMap Safety Verified clinic badge"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                {/* Subtle warm overlay for editorial feel without washing the image */}
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-soft-light"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,229,196,0.30) 0%, rgba(255,229,196,0) 50%, rgba(15,110,86,0.18) 100%)',
                  }}
                />
                {/* Bottom gradient guarantees overlay-badge legibility on any image crop */}
                <div
                  className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                  style={{ background: 'linear-gradient(0deg, rgba(15,46,37,0.55) 0%, rgba(15,46,37,0) 100%)' }}
                />
                {/* Overlay verification badge — sits ON the image at the bottom,
                    with the brass gold tint so it reads premium, not floating. */}
                <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-[#d8b878]/40">
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
              <p className="text-base md:text-lg text-slate-700 leading-relaxed font-normal max-w-xl mb-8 md:mb-10">
                When a clinic carries the Safety Verified badge, it has answered our safety
                questionnaire in writing. Who oversees care, who performs your insert, where its IV
                solutions come from, and whether an intake is required before treatment. We don't
                take a cent for placement, and we never buy or sell reviews.
              </p>

              {/* Trust pillars — considered cards with brass-gold accented icons,
                  a checkmark-led treatment, hairline border, soft elevation, and
                  consistent vertical rhythm. NOT a SaaS feature grid. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:gap-4 max-w-2xl">
                {[
                  { Icon: Stethoscope, label: 'Medical director on file',         detail: 'Clinic confirms a licensed physician oversees care' },
                  { Icon: UserCheck,   label: 'Licensed clinicians, not techs',   detail: 'Clinic confirms an RN or NP performs every insert' },
                  { Icon: FlaskConical,label: 'Pharmacy-sourced solutions',       detail: 'Clinic confirms a licensed compounding pharmacy, no grey-market' },
                  { Icon: Check,       label: 'Intake before infusion',           detail: 'Clinic confirms a clinical assessment before treatment' },
                ].map(({ Icon, label, detail }) => (
                  <div
                    key={label}
                    className="relative flex items-start gap-3.5 p-5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_2px_10px_-2px_rgba(15,40,30,0.05)] hover:shadow-[0_6px_20px_-4px_rgba(15,40,30,0.08)] hover:border-[#d8b878]/50 transition-all"
                  >
                    {/* Brass-gold tinted circle for the theme icon */}
                    <div className="w-11 h-11 rounded-full bg-[#d8b878]/15 text-[#8a6f3e] flex items-center justify-center shrink-0 ring-1 ring-[#d8b878]/25">
                      <Icon size={17} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {/* Checkmark accent leads each card, reinforces the verification theme */}
                        <Check size={13} className="text-[#0F6E56] shrink-0" strokeWidth={3} />
                        <div className="text-[13px] md:text-[13.5px] font-black text-slate-900 tracking-tight leading-tight">{label}</div>
                      </div>
                      <div className="text-[11.5px] md:text-[12px] text-slate-600 font-medium leading-snug">{detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 md:mt-6 text-[11px] md:text-[12px] text-slate-600 leading-relaxed max-w-xl">
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
              Five quick questions. We map your goals, location, and budget to the right clinic, and the right drip.
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {services.map((s) => (
              <Link
                key={s.slug}
                href={`/treatments/${s.slug}`}
                className="group relative bg-white rounded-3xl flex flex-col p-4 md:p-5 shadow-[0_10px_30px_-10px_rgba(15,40,30,0.12)] hover:shadow-[0_25px_50px_-15px_rgba(15,40,30,0.22)] hover:-translate-y-1 transition-all duration-300 border border-[#0F6E56]/5"
              >
                {/* Editorial image frame — uniform square aspect across all 8
                    cards so the grid is rhythmically identical. Square frame
                    matches the near-square 365x377 source PNGs so object-cover
                    barely crops. Pill (category) floats top-left, droplet
                    badge top-right. */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F4F6F4] mb-4">
                  <Image
                    src={s.image.startsWith('/') ? s.image : `${DRIP_IMG_BASE}${s.image}`}
                    alt={`${s.name} IV drip`}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 768px) 46vw, 22vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-[800ms] ease-out"
                    style={{ objectPosition: s.objectPosition ?? '50% 50%' }}
                  />
                  {/* Soft warm vignette — subtle, just enough to unify the photos */}
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-soft-light"
                    style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(255,228,196,0.4) 0%, rgba(255,228,196,0) 65%)' }}
                  />
                  {/* Faint bottom gradient — guarantees pill / badge legibility
                      regardless of the underlying photo, without darkening the
                      subject. */}
                  <div
                    className="absolute inset-x-0 top-0 h-20 pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 100%)' }}
                  />
                  {/* Category pill — floats on the image, top-left */}
                  <span className="absolute top-3 left-3 inline-flex items-center bg-white/95 backdrop-blur-sm text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] text-[#0F6E56] px-2.5 py-1 rounded-full shadow-[0_4px_12px_-4px_rgba(0,0,0,0.18)]">
                    {s.category}
                  </span>
                  {/* Consistent droplet badge — floats top-right of every card */}
                  <span
                    className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-[0_4px_12px_-4px_rgba(0,0,0,0.22)]"
                    aria-hidden
                  >
                    <Droplets size={14} className="text-[#0F6E56]" />
                  </span>
                </div>
                {/* Editorial card foot — serif name, tagline, "View clinics"
                    affordance. Category lives ON the image now. */}
                <div className="flex flex-col gap-1 md:gap-1.5 flex-1">
                  <div className="font-serif text-slate-900 text-[22px] md:text-[24px] tracking-tight leading-tight">{s.name}</div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {situations.map((s) => (
              <Link
                key={s.label}
                href="/quiz"
                className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden flex flex-col shadow-[0_8px_24px_-12px_rgba(15,40,30,0.10)] hover:shadow-[0_24px_48px_-18px_rgba(15,40,30,0.22)] hover:-translate-y-1 transition-all duration-300"
                aria-label={`Quiz for ${s.label}`}
              >
                {/* Wide landscape image banner. PNGs are ~345x200 (1.7:1),
                    so aspect-[17/10] matches the source ratio almost exactly
                    and object-cover crops minimally. The colored icon badge
                    is baked into the top-left of every photo, so we do NOT
                    overlay a separate icon. */}
                <div className="relative aspect-[17/10] overflow-hidden bg-slate-50">
                  <Image
                    src={s.image}
                    alt={s.label}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 768px) 46vw, 22vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-[700ms] ease-out"
                  />
                </div>
                {/* Card foot: two-line title, then muted pastel category pill,
                    then a small circular arrow button bottom-right. */}
                <div className="flex flex-col gap-3 p-5 flex-1">
                  <div className="font-black text-slate-900 text-base md:text-[17px] leading-tight tracking-tight min-h-[2.6em]">
                    {s.label}
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-auto">
                    <span
                      className="inline-block text-[10px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: s.pillBg, color: s.pillInk }}
                    >
                      {s.drip}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[#0F6E56] text-white flex items-center justify-center shrink-0 group-hover:bg-[#0A5742] transition-colors">
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
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

          {/* Card design (2026-06-03): photo hero, "Safety Verified" badge
              top-left (only when truly verified), small circular logo chip
              overlapping the hero base, serif clinic name, MapPin location,
              gold stars + rating + review count, "View clinic" footer with
              chevron, lift-plus-zoom on hover. When a clinic has no
              image_url we render a branded deep-green panel with the
              initials centered — never flat grey. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {featuredClinics.slice(0, 4).map((c) => {
              const cityLine = [c.city, c.state].filter(Boolean).join(', ');
              const isSafetyVerified = safetyVerifiedById.get(String(c.id)) === true;
              const initials = clinicInitials(c.name);
              const logoUrl = c.slug ? logoBySlug[c.slug] || null : null;
              const rating = Number(c.rating) || 0;
              const reviewCount = Number(c.reviewCount) || 0;
              const fullStars = Math.round(rating);
              return (
                <Link
                  key={c.slug || c.name}
                  href={`/providers/${c.slug}`}
                  className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-[0_8px_24px_-12px_rgba(15,40,30,0.10)] hover:shadow-[0_26px_50px_-30px_rgba(15,40,30,0.45)] hover:-translate-y-1 hover:border-[#d3dfca] transition-all duration-300 flex flex-col"
                >
                  {/* Photo hero — uniform aspect-[16/10] across all 4 cards,
                      object-cover keeps a centered focal point with no
                      stretching or letterbox. The hero is NOT clipped by
                      the chip overflow because the chip sits absolutely
                      below the hero base and the card's overflow-hidden
                      crops only the chip's outer edge softly. */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {c.image_url ? (
                      <Image
                        src={c.image_url}
                        alt={c.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-[700ms] ease-out"
                      />
                    ) : (
                      // Branded deep-green fallback panel for clinics without
                      // a photo (radial gradient mirrors the design ref). If
                      // the clinic has a real logo we center it inside a
                      // padded white pill (object-contain so it's never
                      // cropped). Otherwise we fall back to the clinic's
                      // initials in italic serif so the panel still feels
                      // designed, not empty.
                      <div
                        className="absolute inset-0 flex items-center justify-center group-hover:scale-[1.03] transition-transform duration-[700ms] ease-out"
                        style={{ background: 'radial-gradient(120% 120% at 30% 20%, #2f5436, #142619)' }}
                      >
                        {logoUrl ? (
                          <div className="relative w-[58%] h-[58%] rounded-2xl bg-white shadow-[0_8px_24px_-10px_rgba(0,0,0,0.4)] p-4 flex items-center justify-center">
                            <Image
                              src={logoUrl}
                              alt={c.name}
                              fill
                              sizes="(max-width: 640px) 60vw, (max-width: 1024px) 30vw, 15vw"
                              className="object-contain p-2"
                            />
                          </div>
                        ) : (
                          <span className="text-[#e8efe4] font-serif italic font-normal text-4xl tracking-[0.02em]">
                            {initials}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Safety Verified badge — only on truly verified clinics. */}
                    {isSafetyVerified && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1f3a27] text-white text-[10px] font-bold uppercase tracking-[0.06em] shadow-[0_4px_12px_rgba(20,38,25,0.35)]">
                        <Check size={11} strokeWidth={3} /> Safety Verified
                      </span>
                    )}
                    {/* Logo chip — small white circle overlapping the hero base.
                        When the clinic has a real logo file under
                        /public/images/clinic-logos/{slug}.{ext} we render it
                        with object-contain + small padding so the FULL logo
                        shows and never gets cropped. When no logo file
                        exists we fall back to the clinic's initials in
                        serif (matching the design reference). */}
                    {logoUrl ? (
                      <span className="absolute -bottom-5 left-4 w-12 h-12 rounded-full bg-white border-[3px] border-white shadow-[0_6px_16px_-6px_rgba(25,36,28,0.5)] overflow-hidden z-[2]">
                        <Image
                          src={logoUrl}
                          alt={c.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain p-1"
                        />
                      </span>
                    ) : (
                      <span className="absolute -bottom-5 left-4 w-12 h-12 rounded-full bg-white border-[3px] border-white shadow-[0_6px_16px_-6px_rgba(25,36,28,0.5)] flex items-center justify-center font-serif text-[18px] text-[#142619] z-[2]">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div className="px-5 pt-8 pb-5 flex flex-col flex-1">
                    <div className="font-serif text-[19px] leading-[1.15] tracking-[-0.01em] text-[#142619]">
                      {c.name}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-slate-500">
                      <MapPin size={12} className="text-slate-400 shrink-0" strokeWidth={2} />
                      <span className="truncate">{cityLine}</span>
                    </div>
                    {rating > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[#c89a3c] text-[13px] tracking-[1px]" aria-hidden="true">
                          {'★'.repeat(fullStars)}{'☆'.repeat(5 - fullStars)}
                        </span>
                        <span className="text-[13.5px] font-bold text-[#142619]">{rating.toFixed(1)}</span>
                        <span className="text-[12.5px] text-slate-400">({reviewCount})</span>
                      </div>
                    )}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[13px] font-semibold text-[#2f5436] group-hover:gap-2.5 transition-[gap] duration-200">
                      View clinic <ArrowRight size={14} strokeWidth={2.25} />
                    </div>
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
            {metroCities.map((city) => (
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
          7.5. BEFORE-YOU-BOOK FAQ — answer-first copy for search + AI
              engines. Six questions patients actually ask pre-booking
              (sourced from the Phase 0 intent research), each answered
              in 2-3 plain sentences with generic cost framing and no
              medical claims. FAQPage JSON-LD mirrors the visible copy
              exactly — never emit schema for content that isn't on the
              page.
          ───────────────────────────────────────────────────────────── */}
      {(() => {
        const faqs: Array<{ q: string; a: string; href?: string; hrefLabel?: string }> = [
          {
            q: 'How much does IV therapy cost?',
            a: `Most clinics charge between $100 and $400 per drip depending on the formula: basic hydration sits at the low end, vitamin cocktails in the middle, and NAD+ at the top. Published menus in Canadian metros typically run $120 to $350 in Vancouver, $150 to $200 in Calgary, and $190 to $400 in Toronto. Listings on The Drip Map show each clinic's own menu and prices where the clinic has provided them.`,
            href: '/guide/iv-therapy-cost-guide',
            hrefLabel: 'Read the full cost guide',
          },
          {
            q: 'Is IV therapy safe?',
            a: `IV therapy is generally well tolerated when a licensed clinician places the line, a medical director oversees protocols, and ingredients come from a licensed pharmacy. Those are exactly the practices our Safety Verified badge asks clinics to confirm in writing. Always tell the clinic about medications and health conditions before any infusion.`,
            href: '/guide/how-to-choose-iv-therapy-clinic',
            hrefLabel: 'How to choose a clinic',
          },
          {
            q: 'Who should administer an IV drip?',
            a: `A registered nurse, nurse practitioner, physician, or, in Canada, a naturopathic doctor holding their province's IV authorization. If a clinic cannot tell you who places the line and who provides medical oversight, that is the single biggest warning sign to walk away.`,
          },
          {
            q: 'How long does an IV therapy session take?',
            a: `Plan for 30 to 60 minutes in the chair for most drips, plus intake paperwork on a first visit. High-dose formulas like NAD+ can take two hours or more, and many clinics ask new patients to complete a short health screening first.`,
            href: '/guide/first-time-iv-therapy-what-to-expect',
            hrefLabel: 'Your first session, step by step',
          },
          {
            q: 'Does insurance cover IV therapy?',
            a: `Provincial health plans do not cover wellness IV drips. That said, drips administered by a licensed naturopathic doctor can often be claimed under the naturopathic benefit of an extended health plan, so ask the clinic whether they issue eligible receipts.`,
            href: '/blog/iv-therapy-insurance-coverage-canada',
            hrefLabel: 'Insurance coverage in Canada',
          },
          {
            q: 'How do I find a good IV therapy clinic near me?',
            a: `Compare clinics on who administers the drips, whether prices are published, and what real patients say in reviews. The Drip Map lists IV therapy clinics in cities across Canada and matches you by goal, location, and budget in under 60 seconds.`,
            href: '/quiz',
            hrefLabel: 'Take the 60-second match quiz',
          },
        ];
        const faqJsonLd = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        };
        return (
          <section className="bg-white py-20 md:py-28 px-6 border-t border-slate-100">
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12 md:mb-16">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56] mb-6 block">Quick Answers</span>
                <h2 className="font-black text-slate-900 tracking-[-0.025em] leading-[1.05] text-[clamp(2rem,5vw,3.5rem)]">
                  Before you book,<br />
                  <span className="font-serif italic font-normal text-[#0F6E56]">know these six things.</span>
                </h2>
                <p className="mt-6 text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
                  The Drip Map is Canada&apos;s IV therapy matching platform. We list IV therapy
                  clinics in cities nationwide, ask clinics to confirm their safety practices in
                  writing, and match you to the right clinic and drip in under 60 seconds.
                </p>
              </div>
              <div className="space-y-4">
                {faqs.map((f) => (
                  <details
                    key={f.q}
                    className="group bg-[#F8F7F3] rounded-2xl border border-slate-200/70 px-6 py-5 open:bg-white open:shadow-sm transition-all"
                  >
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                      <h3 className="font-black text-slate-900 text-base md:text-lg tracking-tight">{f.q}</h3>
                      <span className="w-7 h-7 rounded-full bg-white border border-slate-200 text-[#0F6E56] flex items-center justify-center shrink-0 group-open:rotate-90 transition-transform">
                        <ArrowRight size={14} />
                      </span>
                    </summary>
                    <p className="mt-4 text-[15px] text-slate-600 leading-relaxed">{f.a}</p>
                    {f.href && (
                      <Link
                        href={f.href}
                        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0F6E56] hover:text-[#0A5742]"
                      >
                        {f.hrefLabel} <ArrowRight size={12} />
                      </Link>
                    )}
                  </details>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

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
