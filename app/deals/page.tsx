/**
 * /deals: the live clinic-offer hub (v3, redesigned for desktop 2026-09-18).
 *
 * Everything shown here is a real offer published by a clinic that claimed its
 * listing (via /finish); TheDripMap is a matching platform and sells nothing.
 * Data and compliance gating live in src/lib/deals.ts; the card is the shared
 * DealCard.
 *
 * v3 layout: one grid of every live offer (the v2 one-card-per-city sections
 * left most of a desktop screen empty), a hero with the drip photography the
 * rest of the site uses, a live tally, and the quiet metros as one compact
 * row rather than six dashed boxes.
 *
 * SEO: self-canonical. Indexable ONLY while at least one live deal exists;
 * with zero deals the page emits robots noindex,follow (the site's thin-page
 * pattern, mirroring the city-page provider gate) so Google never indexes an
 * empty hub. app/sitemap.ts applies the same gate. getLiveDeals is React
 * cache()d, so generateMetadata + the page body share one fetch.
 */
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BadgeCheck, Droplets, MapPin, ShieldCheck, Tag } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import DealCard from '../../src/components/DealCard';
import { getLiveDeals } from '../../src/lib/deals';

// Offer ON/OFF and edits also revalidate('/deals') on the spot via the
// finish-listing + offer-toggle routes; this is the background refresh.
export const revalidate = 600;

const SITE_URL = 'https://www.thedripmap.com';

// Major Canadian metros always shown on the hub. Metros with live deals are in
// the grid; the rest get one honest line each (never fabricated deals).
const METROS: { name: string; slug: string }[] = [
  { name: 'Toronto', slug: 'toronto' },
  { name: 'Vancouver', slug: 'vancouver' },
  { name: 'Calgary', slug: 'calgary' },
  { name: 'Edmonton', slug: 'edmonton' },
  { name: 'Ottawa', slug: 'ottawa' },
  { name: 'Montreal', slug: 'montreal' },
  { name: 'Winnipeg', slug: 'winnipeg' },
  { name: 'Hamilton', slug: 'hamilton' },
];

export async function generateMetadata(): Promise<Metadata> {
  const deals = await getLiveDeals();
  const hasDeals = deals.length > 0;
  return {
    // 39 chars, under the 60-char SERP cap.
    title: 'IV Therapy Deals in Canada | TheDripMap',
    description:
      'Live IV therapy offers published by clinics that claimed their listing on TheDripMap. Real deals straight from the clinic, updated as they turn them on.',
    alternates: { canonical: `${SITE_URL}/deals` },
    // Thin-page pattern: index only when there is at least one live deal.
    robots: hasDeals ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: 'IV Therapy Deals in Canada | TheDripMap',
      description: 'Live IV therapy offers published by clinics that claimed their listing on TheDripMap.',
      url: `${SITE_URL}/deals`,
      type: 'website',
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'IV Therapy Deals in Canada | TheDripMap',
      description: 'Live IV therapy offers published by clinics that claimed their listing on TheDripMap.',
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

export default async function DealsPage() {
  const deals = await getLiveDeals();

  // Live tally for the hero: every number below is counted, none is typed in.
  const cityCount = new Set(deals.map((d) => `${d.city}|${d.state || ''}`)).size;
  const verifiedCount = deals.filter((d) => d.safetyVerified).length;

  // Metros with no live deal get one line each under the grid.
  const dealCityNames = new Set(deals.map((d) => d.city.toLowerCase()));
  const quietMetros = METROS.filter((m) => !dealCityNames.has(m.name.toLowerCase()));

  // schema.org ItemList of Offers, only when real offers exist.
  const jsonLd =
    deals.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'IV Therapy Deals and Offers',
          itemListElement: deals.slice(0, 100).map((d, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Offer',
              name: d.offer.title,
              url: `${SITE_URL}/providers/${d.slug}`,
              seller: {
                '@type': 'MedicalBusiness',
                name: d.name,
                address: [d.city, d.state].filter(Boolean).join(', '),
              },
              ...(d.offer.expires ? { availabilityEnds: d.offer.expires } : {}),
              ...(d.offer.code ? { description: `Use code ${d.offer.code}` } : {}),
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-[#f8f5ee]">
      <Navbar />
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      <main>
        {/* Hero: copy on the left, the drip photography the site already uses on
            the right, so the page feels like IV therapy rather than a coupon list. */}
        <section className="relative overflow-hidden">
          <div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-[#0F6E56]/[0.07] blur-3xl" aria-hidden />
          <div className="absolute -bottom-52 right-[12%] w-[460px] h-[460px] rounded-full bg-[#d9b566]/[0.18] blur-3xl" aria-hidden />
          <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-12 md:pt-20 md:pb-16 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#0F6E56] bg-white border border-[#0F6E56]/20 rounded-full px-3 py-1.5 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F6E56] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F6E56]" />
                </span>
                Live clinic offers
              </span>
              <h1 className="font-black text-slate-900 tracking-[-0.03em] leading-[1.02] text-[clamp(2.4rem,5.6vw,4.2rem)] mb-5 [text-wrap:balance]">
                IV therapy deals,{' '}
                <span className="font-serif italic font-normal text-[#0F6E56]">straight from the clinic.</span>
              </h1>
              <p className="text-[17px] md:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
                Every offer here was written and switched on by a clinic that claimed its listing.
                We do not sell treatments, mark up prices or run promotions of our own. Clinics turn
                these on when they have chairs to fill, so check back before you book.
              </p>

              <div className="flex flex-wrap gap-3">
                <div className="bg-white rounded-2xl border border-[rgba(25,36,28,0.1)] px-5 py-3.5 min-w-[130px]">
                  <div className="text-[30px] leading-none font-black text-[#0F6E56] tracking-tight">{deals.length}</div>
                  <div className="mt-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500">live offer{deals.length === 1 ? '' : 's'}</div>
                </div>
                <div className="bg-white rounded-2xl border border-[rgba(25,36,28,0.1)] px-5 py-3.5 min-w-[130px]">
                  <div className="text-[30px] leading-none font-black text-slate-900 tracking-tight">{cityCount}</div>
                  <div className="mt-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500">{cityCount === 1 ? 'city' : 'cities'}</div>
                </div>
                <div className="bg-white rounded-2xl border border-[rgba(25,36,28,0.1)] px-5 py-3.5 min-w-[130px]">
                  <div className="text-[30px] leading-none font-black text-slate-900 tracking-tight inline-flex items-center gap-2">
                    {verifiedCount} <ShieldCheck size={22} className="text-[#0F6E56]" />
                  </div>
                  <div className="mt-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500">Safety Verified</div>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/5] max-w-[420px] ml-auto rounded-[32px] overflow-hidden border border-white shadow-[0_30px_60px_-30px_rgba(25,36,28,0.45)] rotate-[1.5deg]">
                <Image
                  src="/images/treatments/myers-cocktail.png"
                  alt="An IV drip bag hanging beside a patient in a clinic chair"
                  fill
                  sizes="420px"
                  priority
                  className="object-cover"
                />
              </div>
              <div className="absolute -left-6 bottom-10 bg-white rounded-2xl border border-[rgba(25,36,28,0.1)] shadow-xl px-4 py-3 flex items-center gap-3 -rotate-[2deg]">
                <span className="w-10 h-10 rounded-xl bg-[#e7f1ec] text-[#0F6E56] inline-flex items-center justify-center"><Droplets size={20} /></span>
                <div>
                  <div className="text-[13px] font-black text-slate-900">Published by the clinic</div>
                  <div className="text-[12px] text-slate-500">Turns itself off at the expiry they set</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-16">
          {deals.length === 0 ? (
            /* Designed global empty state: honest, with a patient path and an owner path. */
            <div className="text-center py-20 px-8 bg-white rounded-[2.5rem] border border-[rgba(25,36,28,0.1)] max-w-xl mx-auto">
              <div className="w-16 h-16 bg-[#e7f1ec] rounded-full flex items-center justify-center text-[#0F6E56] mx-auto mb-6">
                <Tag size={30} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">No live offers right now</h2>
              <p className="text-slate-500 mb-8">
                Clinics publish deals when they claim their listing and have openings to fill.
                Browse all clinics in the meantime, or check back soon.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/search" className="inline-flex items-center gap-2 bg-[#0F6E56] text-white px-7 py-3.5 rounded-xl font-black text-sm hover:bg-[#0c5a46] transition-all">
                  Browse clinics <ArrowRight size={16} />
                </Link>
                <Link href="/for-clinics" className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-7 py-3.5 rounded-xl font-black text-sm hover:border-slate-300 transition-all">
                  Run a clinic? Post an offer
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-[22px] md:text-[26px] font-black text-slate-900 tracking-tight">
                    All live offers
                  </h2>
                  {/* The page revalidates every 10 minutes, so this date is the
                      real render date, not a static label (Hubert 2026-09-20). */}
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0F6E56] bg-[#e7f1ec] border border-[#0F6E56]/15 rounded-full px-3 py-1">
                    <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F6E56] opacity-60" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0F6E56]" /></span>
                    Live as of {new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Toronto' })}
                  </span>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500">
                  <BadgeCheck size={14} className="text-[#0F6E56]" /> Claimed clinics only, wording as the clinic wrote it
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {deals.map((d) => (
                  <DealCard key={d.slug} deal={d} showCity />
                ))}
              </div>
            </>
          )}

          {/* Quiet metros: one compact row, one honest line, never a fake deal. */}
          {quietMetros.length > 0 && (
            <div className="mt-12 bg-white rounded-[22px] border border-[rgba(25,36,28,0.1)] px-6 py-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="md:w-[260px] shrink-0">
                <div className="text-[13px] font-black text-slate-900 flex items-center gap-2"><MapPin size={14} className="text-[#0F6E56]" /> No offers yet in</div>
                <div className="text-[12.5px] text-slate-500 mt-0.5">Browse the clinics there, or claim yours and post one.</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {quietMetros.map((m) => (
                  <Link
                    key={m.slug}
                    href={`/cities/${m.slug}`}
                    className="text-[13px] font-bold text-slate-700 bg-[#f8f5ee] border border-[rgba(25,36,28,0.1)] hover:border-[#0F6E56]/40 hover:text-[#0F6E56] rounded-full px-3.5 py-1.5 transition-colors"
                  >
                    {m.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Owner CTA */}
          <div className="mt-12 relative overflow-hidden bg-[#0F6E56] text-white rounded-[2.5rem] px-8 py-10 md:px-14 md:py-14 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
            <Droplets size={220} strokeWidth={0.8} className="absolute -right-10 -bottom-16 text-white/[0.07]" aria-hidden />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">Run a clinic? Post your own offer.</h2>
              <p className="text-emerald-50/90 max-w-xl">
                Claim your free listing and flip an offer on whenever you have openings. It shows here and on
                your listing instantly, and turns itself off at the expiry you set.
              </p>
            </div>
            <Link
              href="/for-clinics"
              className="relative inline-flex items-center justify-center gap-2 bg-white text-[#0F6E56] px-8 py-4 rounded-xl font-black hover:bg-emerald-50 transition-all"
            >
              Claim your listing <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
