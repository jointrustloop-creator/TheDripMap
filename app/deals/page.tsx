/**
 * /deals: the live clinic-offer hub (v2, redesigned 2026-08).
 *
 * Everything shown here is a real offer published by a clinic that claimed its
 * listing (via /finish); TheDripMap is a directory and sells nothing. Data and
 * compliance gating live in src/lib/deals.ts; the card is the shared DealCard.
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
import { ArrowRight, Gift, MapPin, Store, Tag } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import DealCard from '../../src/components/DealCard';
import { getLiveDeals, type LiveDeal } from '../../src/lib/deals';

// Offer ON/OFF and edits also revalidate('/deals') on the spot via the
// finish-listing + offer-toggle routes; this is the background refresh.
export const revalidate = 600;

const SITE_URL = 'https://www.thedripmap.com';

// Major Canadian metros always shown on the hub. Metros with live deals get a
// deal grid; the rest get the designed empty state (never fabricated deals).
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
    },
  };
}

export default async function DealsPage() {
  const deals = await getLiveDeals();

  // Group by "City, Prov" for a scannable, locally relevant layout. Pool order
  // (claimed/featured first) is preserved inside each group.
  const byCity = new Map<string, LiveDeal[]>();
  for (const d of deals) {
    const key = [d.city, d.state].filter(Boolean).join(', ') || 'Other';
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key)!.push(d);
  }
  const cityGroups = [...byCity.entries()].sort((a, b) => b[1].length - a[1].length);

  // Metros with no live deal get the designed empty state below the grids.
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
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero: honest about what this page is and is not. */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-wellness-700 bg-wellness-50 border border-wellness-200 rounded-full px-3 py-1.5 mb-5">
            <Gift size={14} /> Live clinic offers
          </span>
          <h1 className="font-black text-slate-900 tracking-[-0.03em] leading-[1.02] text-[clamp(2.25rem,6vw,4rem)] mb-5">
            IV therapy deals,<br />
            <span className="font-serif italic font-normal text-[#0F6E56]">straight from the clinic.</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            Every offer on this page was published by a clinic that claimed its listing on TheDripMap.
            We are a directory: we do not sell treatments, mark up prices, or run promotions of our own.
            Clinics switch these on when they have openings, so check back before you book.
          </p>
        </div>

        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-400">
            <Tag size={14} />
            {deals.length > 0
              ? `${deals.length} live offer${deals.length > 1 ? 's' : ''} right now`
              : 'No live offers right now'}
          </span>
        </div>

        {deals.length === 0 ? (
          /* Designed global empty state: honest, with a patient path and an owner path. */
          <div className="text-center py-20 px-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm max-w-xl mx-auto">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
              <Tag size={30} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">No live offers right now</h2>
            <p className="text-slate-500 mb-8">
              Clinics publish deals when they claim their listing and have openings to fill.
              Browse all clinics in the meantime, or check back soon.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 bg-wellness-600 text-white px-7 py-3.5 rounded-xl font-black text-sm hover:bg-wellness-700 transition-all"
              >
                Browse clinics <ArrowRight size={16} />
              </Link>
              <Link
                href="/for-clinics"
                className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-7 py-3.5 rounded-xl font-black text-sm hover:border-slate-300 transition-all"
              >
                Run a clinic? Post an offer
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {cityGroups.map(([city, rows]) => (
              <section key={city}>
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#0F6E56] mb-5 flex items-center gap-2">
                  <MapPin size={15} /> {city} <span className="text-slate-300 font-bold">·</span>{' '}
                  <span className="text-slate-400">
                    {rows.length} offer{rows.length > 1 ? 's' : ''}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rows.map((d) => (
                    <DealCard key={d.slug} deal={d} showCity={false} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Designed per-city empty state for major metros without a live deal. */}
        {quietMetros.length > 0 && (
          <section className="mt-16">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400 mb-5 flex items-center gap-2">
              <Store size={15} /> More cities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quietMetros.map((m) => (
                <div key={m.slug} className="bg-white rounded-[1.25rem] border border-dashed border-slate-200 p-5 flex flex-col">
                  <span className="text-[15px] font-black text-slate-900 mb-1.5">{m.name}</span>
                  <p className="text-[13px] text-slate-500 leading-relaxed flex-1">
                    No current offers in {m.name}. Clinics publish deals when they claim their listing.
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <Link href={`/cities/${m.slug}`} className="text-[12.5px] font-bold text-wellness-700 hover:underline">
                      Browse {m.name} clinics
                    </Link>
                    <Link href="/for-clinics" className="text-[12.5px] font-bold text-slate-400 hover:text-slate-600 hover:underline">
                      Claim yours
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Owner CTA */}
        <div className="mt-16 text-center bg-[#0F6E56] text-white rounded-[2.5rem] p-10 md:p-14">
          <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">Run a clinic? Post your own offer.</h2>
          <p className="text-emerald-50 mb-7 max-w-xl mx-auto">
            Claim your free listing and flip an offer on whenever you have openings. It shows here and on
            your listing instantly, and turns itself off at the expiry you set.
          </p>
          <Link
            href="/for-clinics"
            className="inline-flex items-center gap-2 bg-white text-[#0F6E56] px-8 py-4 rounded-xl font-black hover:bg-emerald-50 transition-all"
          >
            Claim your listing <ArrowRight size={18} />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
