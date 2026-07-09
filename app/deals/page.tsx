import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Gift, MapPin, ArrowRight, Tag } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { getAllListings } from '../../src/lib/data';

// Revalidate periodically; offer ON/OFF and edits also revalidate('/deals')
// on the spot via the finish-listing + offer-toggle routes.
export const revalidate = 600;

const SITE_URL = 'https://www.thedripmap.com';

export const metadata: Metadata = {
  title: 'IV Therapy Deals & Offers Near You | The Drip Map',
  description: 'Live IV therapy deals and limited-time offers from verified clinics across Canada. New offers added by clinics directly. Find a drip deal near you.',
  alternates: { canonical: `${SITE_URL}/deals` },
  openGraph: {
    title: 'IV Therapy Deals & Offers Near You | The Drip Map',
    description: 'Live IV therapy deals from verified clinics across Canada.',
    url: `${SITE_URL}/deals`,
    type: 'website',
  },
};

interface Offer { title?: string; code?: string; expires?: string; active?: boolean }
interface DealRow {
  name: string;
  slug: string;
  city: string;
  state: string | null;
  offer: Offer;
}

export default async function DealsPage() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const all = await getAllListings();

  const deals: DealRow[] = [];
  for (const p of all as Array<{ name: string; slug?: string; city?: string; state?: string | null; is_hidden?: boolean; special_offers?: Offer[] }>) {
    if (p.is_hidden || !p.slug) continue;
    const offer = Array.isArray(p.special_offers)
      ? p.special_offers.find((o) => o && o.title && o.active !== false && (!o.expires || o.expires >= todayIso))
      : null;
    if (offer) deals.push({ name: p.name, slug: p.slug, city: p.city || '', state: p.state || null, offer });
  }
  // Newest-feeling first: keep insertion (claimed/featured already sorted first by getAllListings).

  // Group by city for a scannable, locally-relevant layout.
  const byCity = new Map<string, DealRow[]>();
  for (const d of deals) {
    const key = [d.city, d.state].filter(Boolean).join(', ') || 'Other';
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key)!.push(d);
  }
  const cities = [...byCity.entries()].sort((a, b) => b[1].length - a[1].length);

  // schema.org ItemList of Offers so Google can surface them.
  const jsonLd = {
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
        seller: { '@type': 'MedicalBusiness', name: d.name, address: [d.city, d.state].filter(Boolean).join(', ') },
        ...(d.offer.expires ? { availabilityEnds: d.offer.expires } : {}),
        ...(d.offer.code ? { description: `Use code ${d.offer.code}` } : {}),
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-wellness-700 bg-wellness-50 border border-wellness-200 rounded-full px-3 py-1.5 mb-5">
            <Gift size={14} /> Live offers
          </span>
          <h1 className="font-black text-slate-900 tracking-[-0.03em] leading-[1.02] text-[clamp(2.25rem,6vw,4rem)] mb-5">
            IV therapy deals<br /><span className="font-serif italic font-normal text-[#0F6E56]">near you, right now.</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            Limited-time offers posted directly by verified clinics across Canada. Clinics turn these on when they have openings, so they change often. Check back before you book.
          </p>
        </div>

        {deals.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm max-w-xl mx-auto">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6"><Tag size={30} /></div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">No live offers right now</h2>
            <p className="text-slate-500 mb-8">Clinics post deals when they have openings. Browse all clinics in the meantime.</p>
            <Link href="/search" className="inline-flex items-center gap-2 bg-wellness-600 text-white px-7 py-3.5 rounded-xl font-black text-sm hover:bg-wellness-700 transition-all">Browse clinics <ArrowRight size={16} /></Link>
          </div>
        ) : (
          <div className="space-y-12">
            {cities.map(([city, rows]) => (
              <section key={city}>
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#0F6E56] mb-5 flex items-center gap-2">
                  <MapPin size={15} /> {city} <span className="text-slate-300 font-bold">·</span> <span className="text-slate-400">{rows.length} offer{rows.length > 1 ? 's' : ''}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rows.map((d) => (
                    <Link key={d.slug} href={`/providers/${d.slug}`} className="group bg-white rounded-[1.5rem] border border-slate-200 p-6 hover:border-wellness-300 hover:shadow-xl transition-all flex flex-col">
                      <div className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.14em] text-[#a9772a] mb-3">
                        <Gift size={13} /> Limited-time offer
                      </div>
                      <div className="text-[17px] font-black text-slate-900 leading-snug mb-3 flex-1">{d.offer.title}</div>
                      <div className="text-[13px] text-slate-500 flex flex-wrap gap-x-3 mb-4">
                        {d.offer.code && <span>Code <b className="text-slate-700">{d.offer.code}</b></span>}
                        {d.offer.expires && <span>Ends {d.offer.expires}</span>}
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[14px] font-bold text-slate-900 truncate">{d.name}</span>
                        <span className="text-[#0F6E56] inline-flex items-center gap-1 text-[13px] font-bold shrink-0">View <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" /></span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-16 text-center bg-[#0F6E56] text-white rounded-[2.5rem] p-10 md:p-14">
          <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">Run a clinic? Post your own offer.</h2>
          <p className="text-emerald-50 mb-7 max-w-xl mx-auto">Claim your free listing and flip an offer on whenever you have openings. It shows here and on your listing instantly, and turns off on its own.</p>
          <Link href="/for-clinics" className="inline-flex items-center gap-2 bg-white text-[#0F6E56] px-8 py-4 rounded-xl font-black hover:bg-emerald-50 transition-all">Claim your listing <ArrowRight size={18} /></Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
