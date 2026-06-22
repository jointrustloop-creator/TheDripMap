import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ArrowRight, Quote, ShieldCheck } from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { getCityPriceIndex, priceIndexCitySlugs, type CityPriceIndex } from '../../../src/lib/price-index-data';

const SITE = 'https://www.thedripmap.com';

// Static: the index is a curated, dated snapshot. Only cities we actually have
// depth for render; everything else 404s (no thin/empty pages).
export const dynamicParams = false;

export function generateStaticParams() {
  return priceIndexCitySlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const idx = getCityPriceIndex(city);
  if (!idx) return { title: 'IV Therapy Prices | TheDripMap', robots: { index: false, follow: true } };
  const h = idx.headline;
  const title = `IV Therapy Prices in ${idx.city} (2026): What Clinics Charge | TheDripMap`;
  const description = `A standard IV vitamin drip in ${idx.city} runs a median of $${h.median} (about $${h.low} to $${h.high}), based on ${idx.clinicCount} published clinic menus. Compare ${idx.rows.length} drips by real price.`;
  const url = `${SITE}/iv-prices/${idx.citySlug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', images: [`${SITE}/og-image.png`] },
    twitter: { card: 'summary_large_image', title, description },
  };
}

function dollars(n: number) { return `$${n.toLocaleString()}`; }

export default async function CityPriceIndexPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const idx = getCityPriceIndex(city);
  if (!idx) notFound();
  const i = idx as CityPriceIndex;
  const h = i.headline;
  const maxMedian = Math.max(...i.rows.map((r) => r.median));
  const curLong = i.currency === 'CAD' ? 'Canadian dollars' : 'US dollars';

  const find = (kw: RegExp) => i.rows.find((r) => kw.test(r.treatment));
  const myers = find(/myers/i);
  const nad = find(/nad/i);

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: `How much does IV therapy cost in ${i.city}?`,
      a: `A standard IV vitamin drip in ${i.city} costs a median of ${dollars(h.median)}, typically ${dollars(h.low)} to ${dollars(h.high)}, based on ${i.clinicCount} clinics with published prices (as of ${i.asOf}, in ${curLong}). Specialty drips run higher.`,
    },
    ...(myers ? [{
      q: `How much is a Myers' Cocktail in ${i.city}?`,
      a: `A Myers' Cocktail in ${i.city} runs a median of ${dollars(myers.median)} (about ${dollars(myers.low)} to ${dollars(myers.high)}) across ${myers.clinics} clinics with published prices, as of ${i.asOf}.`,
    }] : []),
    ...(nad ? [{
      q: `How much does an NAD+ IV cost in ${i.city}?`,
      a: `NAD+ infusions in ${i.city} run a median of ${dollars(nad.median)}, from about ${dollars(nad.low)} to ${dollars(nad.high)} depending on the dose, across ${nad.clinics} clinics with published prices.`,
    }] : []),
    {
      q: `Why do IV therapy prices vary so much in ${i.city}?`,
      a: `Price depends on the dose, add-ons (an extra glutathione push or B12, for example), whether you book a single visit or a membership, and whether the drip is in-clinic or mobile. Confirm the current price with the clinic before booking.`,
    },
  ];

  const datasetLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${i.city} IV Therapy Price Index (${i.asOf})`,
    description: `Published prices for ${i.rows.length} IV therapy drips across ${i.clinicCount} clinics in ${i.city}, with low, median, and high in ${curLong}.`,
    url: `${SITE}/iv-prices/${i.citySlug}`,
    creator: { '@type': 'Organization', name: 'TheDripMap', url: SITE },
    isAccessibleForFree: true,
    variableMeasured: i.rows.map((r) => ({
      '@type': 'PropertyValue',
      name: `${r.treatment} price in ${i.city} (${i.currency})`,
      median: r.median,
      minValue: r.low,
      maxValue: r.high,
    })),
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <main className="max-w-4xl mx-auto px-6 py-14">
        {/* Hero — answer first */}
        <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#0F6E56] bg-wellness-50 border border-wellness-100 rounded-full px-3 py-1.5 mb-5">
          <MapPin size={13} /> {i.city} price index &middot; {i.asOf}
        </div>
        <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-black text-slate-900 tracking-tight leading-[1.05]">
          IV therapy prices in {i.city}
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          Across <b className="text-slate-900">{i.clinicCount} {i.city} IV therapy clinics</b> with published menus, a standard IV vitamin drip costs a <b className="text-slate-900">median of {dollars(h.median)}</b>, typically {dollars(h.low)} to {dollars(h.high)} ({curLong}, as of {i.asOf}). Specialty drips like NAD+ and beauty blends run higher. Here is the real range by drip.
        </p>

        {/* Price table */}
        <section className="mt-10">
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">{i.city} IV drip prices by type</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Drip</th>
                  <th className="px-4 py-3 text-right">From</th>
                  <th className="px-4 py-3 text-right">Median</th>
                  <th className="px-4 py-3 text-right">High</th>
                  <th className="px-4 py-3 text-right">Clinics</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {i.rows.map((r) => (
                  <tr key={r.treatment} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-bold text-slate-900">{r.treatment}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{dollars(r.low)}</td>
                    <td className="px-4 py-3 text-right font-black text-[#0F6E56]">{dollars(r.median)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{dollars(r.high)}</td>
                    <td className="px-4 py-3 text-right text-slate-400 font-semibold">{r.clinics}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[12px] text-slate-400">All prices in {curLong}. Median across clinics that publish a price for that drip.</p>
        </section>

        {/* Median chart (CSS bars, no layout shift, no JS) */}
        <section className="mt-10" aria-label={`Median IV drip prices in ${i.city}`}>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">Median price by drip</h2>
          <div className="space-y-2.5">
            {i.rows.map((r) => (
              <div key={r.treatment} className="flex items-center gap-3">
                <div className="w-40 shrink-0 text-[13px] font-semibold text-slate-700 truncate">{r.treatment}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                  <div className="h-full bg-[#0F6E56] rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(12, Math.round((r.median / maxMedian) * 100))}%` }}>
                    <span className="text-[11px] font-black text-white">{dollars(r.median)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section className="mt-10 bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500 mb-2">How we built this</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed">
            We collected publicly published prices from {i.clinicCount} {i.city} IV therapy clinics ({i.asOf}), took one representative price per clinic per drip, and report the low, median, and high across clinics. {i.note} Prices change often, so confirm the current price with the clinic before booking. We add owner-verified prices as clinics complete their TheDripMap listing, and refresh this index as coverage grows.
          </p>
        </section>

        {/* Cite this */}
        <section className="mt-6 bg-wellness-50 rounded-2xl border border-wellness-100 p-6">
          <div className="flex items-center gap-2 text-sm font-black text-[#0F6E56] mb-2">
            <Quote size={15} /> Cite or link this index
          </div>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            TheDripMap {i.city} IV Therapy Price Index, {i.asOf}. {SITE}/iv-prices/{i.citySlug}
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">Common questions</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group bg-white rounded-2xl border border-slate-200 px-5 py-4 open:shadow-sm">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                  <h3 className="font-black text-slate-900 text-[15px]">{f.q}</h3>
                  <span className="w-6 h-6 rounded-full bg-wellness-50 text-[#0F6E56] grid place-items-center shrink-0 group-open:rotate-90 transition-transform"><ArrowRight size={13} /></span>
                </summary>
                <p className="mt-3 text-[14px] text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Clinic benchmark CTA (the funnel hook) */}
        <section className="mt-10 rounded-2xl bg-[#0F6E56] text-white p-7">
          <div className="flex items-start gap-3">
            <ShieldCheck size={22} className="shrink-0 mt-0.5 text-white/80" />
            <div>
              <h2 className="text-lg font-black tracking-tight">Run a {i.city} IV clinic?</h2>
              <p className="mt-1.5 text-[14px] text-white/85 leading-relaxed">
                Claim your free listing and we will show how your prices compare to the {i.city} median, and add your verified menu to this index.
              </p>
              <Link href="/for-clinics" className="mt-4 inline-flex items-center gap-2 bg-white text-[#0F6E56] px-5 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-50 transition-colors">
                Claim your listing <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* Internal links */}
        <section className="mt-10 flex flex-wrap gap-3 text-sm font-bold">
          <Link href={`/cities/${i.citySlug}`} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:border-[#0F6E56]/40 hover:text-[#0F6E56] transition-colors">All {i.city} IV clinics</Link>
          <Link href="/treatments" className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:border-[#0F6E56]/40 hover:text-[#0F6E56] transition-colors">Compare treatments</Link>
          <Link href="/quiz" className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:border-[#0F6E56]/40 hover:text-[#0F6E56] transition-colors">Take the match quiz</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
