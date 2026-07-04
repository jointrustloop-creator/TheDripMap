import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ArrowRight, Quote, ShieldCheck, TrendingUp } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { priceIndexCitySlugs, getCityPriceIndex, type CityPriceIndex } from '../../src/lib/price-index-data';

const SITE = 'https://www.thedripmap.com';

// In-code dataset, so this is effectively static; revalidate keeps it cheap to
// pick up a newly-published city without a redeploy.
export const revalidate = 3600;

function median(arr: number[]): number {
  const b = [...arr].sort((x, y) => x - y);
  const n = b.length;
  if (!n) return 0;
  return n % 2 ? b[(n - 1) / 2] : Math.round((b[n / 2 - 1] + b[n / 2]) / 2);
}
const ca = (n: number) => `CA$${n.toLocaleString()}`;

// The covered cities, richest first. CAD-only today (Canada-first).
function coveredCities(): CityPriceIndex[] {
  return priceIndexCitySlugs()
    .map((s) => getCityPriceIndex(s))
    .filter((c): c is CityPriceIndex => !!c && c.currency === 'CAD')
    .sort((a, b) => b.clinicCount - a.clinicCount);
}

export async function generateMetadata(): Promise<Metadata> {
  const cities = coveredCities();
  const natMedian = median(cities.map((c) => c.headline.median));
  const names = cities.map((c) => c.city).join(', ');
  // Title targets the real query cluster from GSC (2026-07-04): "iv therapy
  // cost", "how much is iv therapy", "iv drip price" — cost AND prices both
  // appear verbatim.
  const title = `IV Therapy Cost in Canada (2026): Real Prices by City | TheDripMap`;
  const description = `A standard IV vitamin drip in Canada runs a median of CA$${natMedian}, based on published menus from ${cities.reduce((s, c) => s + c.clinicCount, 0)} clinics across ${names}. Compare real IV therapy prices by city.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/iv-prices` },
    openGraph: { title, description, url: `${SITE}/iv-prices`, type: 'website', images: [`${SITE}/og-image.png`] },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default function PriceIndexHubPage() {
  const cities = coveredCities();
  const natMedian = median(cities.map((c) => c.headline.median));
  const natLow = Math.min(...cities.map((c) => c.headline.low));
  const natHigh = Math.max(...cities.map((c) => c.headline.high));
  const totalClinics = cities.reduce((s, c) => s + c.clinicCount, 0);
  const asOf = cities[0]?.asOf || 'June 2026';

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: `How much does IV therapy cost in Canada?`,
      a: `A standard IV vitamin drip in Canada runs a median of ${ca(natMedian)}, typically ${ca(natLow)} to ${ca(natHigh)}, based on published menus from ${totalClinics} clinics across ${cities.map((c) => c.city).join(', ')} (as of ${asOf}). Specialty drips like NAD+ and beauty blends cost more. Prices vary by city, dose, add-ons, and whether the drip is in-clinic or mobile.`,
    },
    {
      q: `Which Canadian cities does the IV Price Index cover?`,
      a: `Right now: ${cities.map((c) => `${c.city} (${c.clinicCount} clinics)`).join(', ')}. We publish a city only once at least three clinics there have a public price for a drip, so the numbers are reliable. We add cities as coverage grows and as clinics add verified prices when they claim their listing.`,
    },
    {
      q: `Where do these IV therapy prices come from?`,
      a: `We collect publicly published prices from each city's IV therapy clinics, take one representative price per clinic per drip, and report the low, median, and high across clinics. They are published menu prices, not medical advice. Prices change often, so confirm the current price with the clinic before booking.`,
    },
  ];

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Canada IV Therapy Price Index',
    description: `Published IV therapy prices by Canadian city, with low, median, and high per drip in Canadian dollars (${asOf}).`,
    url: `${SITE}/iv-prices`,
    isPartOf: { '@type': 'WebSite', name: 'TheDripMap', url: SITE },
    about: { '@type': 'Thing', name: 'IV therapy prices in Canada' },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: cities.map((c, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: `IV therapy prices in ${c.city}`,
        url: `${SITE}/iv-prices/${c.citySlug}`,
      })),
    },
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <main className="max-w-4xl mx-auto px-6 py-14">
        {/* Hero — answer first */}
        <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#0F6E56] bg-wellness-50 border border-wellness-100 rounded-full px-3 py-1.5 mb-5">
          <TrendingUp size={13} /> Canada IV Price Index &middot; {asOf}
        </div>
        <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-black text-slate-900 tracking-tight leading-[1.05]">
          What IV therapy costs in Canada
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          A standard IV vitamin drip in Canada runs a <b className="text-slate-900">median of {ca(natMedian)}</b>, typically {ca(natLow)} to {ca(natHigh)}, based on published menus from <b className="text-slate-900">{totalClinics} clinics</b> across {cities.length} {cities.length === 1 ? 'city' : 'cities'} ({asOf}). Pick a city for its full price breakdown by drip.
        </p>

        {/* National stat strip */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { k: ca(natMedian), v: 'Median standard drip' },
            { k: String(cities.length), v: 'Cities covered' },
            { k: String(totalClinics), v: 'Clinics with prices' },
          ].map((s) => (
            <div key={s.v} className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <div className="text-2xl font-black text-[#0F6E56]">{s.k}</div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mt-1 leading-tight">{s.v}</div>
            </div>
          ))}
        </div>

        {/* City index table */}
        <section className="mt-12">
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">IV therapy prices by city</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3 text-right">Standard drip (median)</th>
                  <th className="px-4 py-3 text-right">Drips priced</th>
                  <th className="px-4 py-3 text-right">Clinics</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="text-sm">
                {cities.map((c) => (
                  <tr key={c.citySlug} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/iv-prices/${c.citySlug}`} className="inline-flex items-center gap-1.5 font-black text-slate-900 hover:text-[#0F6E56]">
                        <MapPin size={13} className="text-slate-400" /> {c.city}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-[#0F6E56]">{ca(c.headline.median)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{c.rows.length}</td>
                    <td className="px-4 py-3 text-right text-slate-400 font-semibold">{c.clinicCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/iv-prices/${c.citySlug}`} className="inline-flex items-center gap-1 text-[13px] font-bold text-slate-600 hover:text-[#0F6E56]">
                        View <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[12px] text-slate-400">All prices in Canadian dollars. Median across clinics that publish a price for the standard drip.</p>
        </section>

        {/* Methodology */}
        <section className="mt-12 bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500 mb-2">How we built this</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed">
            For each city we collect publicly published prices from its IV therapy clinics, take one representative price per clinic per drip, and report the low, median, and high across clinics. A city is published only once at least three clinics price a drip, so the medians are reliable. Multiple locations of the same clinic chain count once. These are published menu prices, not medical advice. Prices change often, so confirm the current price with the clinic before booking. We add owner-verified prices as clinics complete their TheDripMap listing, and refresh as coverage grows.
          </p>
        </section>

        {/* Cite this */}
        <section className="mt-6 bg-wellness-50 rounded-2xl border border-wellness-100 p-6">
          <div className="flex items-center gap-2 text-sm font-black text-[#0F6E56] mb-2">
            <Quote size={15} /> Cite or link this index
          </div>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            TheDripMap Canada IV Therapy Price Index, {asOf}. {SITE}/iv-prices
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-12">
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
        <section className="mt-12 rounded-2xl bg-[#0F6E56] text-white p-7">
          <div className="flex items-start gap-3">
            <ShieldCheck size={22} className="shrink-0 mt-0.5 text-white/80" />
            <div>
              <h2 className="text-lg font-black tracking-tight">Run an IV therapy clinic in Canada?</h2>
              <p className="mt-1.5 text-[14px] text-white/85 leading-relaxed">
                Claim your free listing and we will show how your prices compare to your city&rsquo;s median, and add your verified menu to this index, so patients searching prices find you.
              </p>
              <Link href="/for-clinics" className="mt-4 inline-flex items-center gap-2 bg-white text-[#0F6E56] px-5 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-50 transition-colors">
                Claim your listing <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* Internal links */}
        <section className="mt-10 flex flex-wrap gap-3 text-sm font-bold">
          <Link href="/guide/iv-therapy-cost-guide" className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:border-[#0F6E56]/40 hover:text-[#0F6E56] transition-colors">IV therapy cost guide</Link>
          <Link href="/cities" className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:border-[#0F6E56]/40 hover:text-[#0F6E56] transition-colors">Browse clinics by city</Link>
          <Link href="/treatments" className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:border-[#0F6E56]/40 hover:text-[#0F6E56] transition-colors">Compare treatments</Link>
          <Link href="/quiz" className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:border-[#0F6E56]/40 hover:text-[#0F6E56] transition-colors">Take the match quiz</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
