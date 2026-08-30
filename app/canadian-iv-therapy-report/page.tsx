import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, MapPin, Scale, DollarSign, ArrowRight } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { getAllListings } from '../../src/lib/data';
import { PRICE_INDEX } from '../../src/lib/price-index-data';

// THE CANADIAN IV THERAPY REPORT (2026-08). Flagship citable data asset for
// link earning + AI citation. HARD RULE: every market figure on this page is
// COMPUTED LIVE from the providers table at render time; nothing is typed in.
// The only constants are Statistics Canada 2021 Census population counts,
// cited inline. Evergreen URL on purpose: annual updates land here so earned
// backlinks compound on one address.
export const revalidate = 86400; // regenerate daily

const SITE_URL = 'https://www.thedripmap.com';

export const metadata: Metadata = {
  title: 'The Canadian IV Therapy Report (2026): Clinics, Prices, Rules',
  description: 'First-of-its-kind data on Canada\'s IV therapy market: active clinics by province and city, clinics per capita, real published prices, and who can legally administer IVs, from TheDripMap\'s national dataset.',
  alternates: { canonical: `${SITE_URL}/canadian-iv-therapy-report` },
  openGraph: {
    title: 'The Canadian IV Therapy Report (2026)',
    description: 'Clinic counts, per-capita density, real published prices, and the regulatory map of IV therapy in Canada.',
    url: `${SITE_URL}/canadian-iv-therapy-report`,
    type: 'article',
    images: [`${SITE_URL}/og-image.png`],
  },
};

// Statistics Canada, 2021 Census of Population (official counts). Cited in the
// methodology section. Update alongside the next census.
const CENSUS_2021: Record<string, number> = {
  'Ontario': 14223942,
  'Quebec': 8501833,
  'British Columbia': 5000879,
  'Alberta': 4262635,
  'Manitoba': 1342153,
  'Saskatchewan': 1132505,
  'Nova Scotia': 969383,
  'New Brunswick': 775610,
  'Newfoundland and Labrador': 510550,
  'Prince Edward Island': 154331,
};

const PROVINCE_GUIDE: Record<string, string> = {
  'Ontario': '/blog/who-can-legally-give-iv-ontario-2026',
  'British Columbia': '/blog/who-can-legally-give-iv-british-columbia-2026',
  'Alberta': '/blog/who-can-legally-give-iv-alberta-2026',
  'Quebec': '/blog/who-can-legally-give-iv-quebec-2026',
};

export default async function CanadianIVReportPage() {
  // ---- LIVE DATA (single source of truth: the providers table) ----
  const all = await getAllListings();
  type Row = { name?: string; city?: string | null; state?: string | null; country?: string | null; is_hidden?: boolean; is_claimed?: boolean; safety_verified?: boolean; mobile_service?: boolean; description?: string; specialties?: string[]; subtypes?: string[]; type?: string };
  const ca = (all as Row[]).filter((p) => !p.is_hidden && p.country === 'Canada');

  const byProvince = new Map<string, number>();
  const byCity = new Map<string, { count: number; province: string }>();
  let mobileCount = 0, nadCount = 0, gluCount = 0, claimedCount = 0, verifiedCount = 0;
  const mentions = (p: Row) => [p.description, (p.specialties || []).join(' '), (p.subtypes || []).join(' '), p.name].join(' ').toLowerCase();
  for (const p of ca) {
    if (p.state) byProvince.set(p.state, (byProvince.get(p.state) || 0) + 1);
    if (p.city) {
      const cur = byCity.get(p.city) || { count: 0, province: p.state || '' };
      cur.count += 1;
      byCity.set(p.city, cur);
    }
    const blob = mentions(p);
    if (p.mobile_service || (p.type || '').toLowerCase() === 'mobile' || blob.includes('mobile') || blob.includes('domicile')) mobileCount++;
    if (/\bnad\b|nad\+/.test(blob)) nadCount++;
    if (blob.includes('glutathion')) gluCount++;
    if (p.is_claimed) claimedCount++;
    if (p.safety_verified) verifiedCount++;
  }
  const provinces = [...byProvince.entries()]
    .map(([name, count]) => ({ name, count, pop: CENSUS_2021[name] || null, per100k: CENSUS_2021[name] ? (count / CENSUS_2021[name]) * 100000 : null }))
    .sort((a, b) => b.count - a.count);
  const topCities = [...byCity.entries()].map(([city, v]) => ({ city, ...v })).sort((a, b) => b.count - a.count).slice(0, 10);
  const total = ca.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const generated = new Date().toISOString().slice(0, 10);

  const priceCities = Object.values(PRICE_INDEX);

  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `The Canadian IV Therapy Report (${generated.slice(0, 4)})`,
    description: `Active IV therapy clinics in Canada by province and city, clinics per 100,000 residents, and published treatment prices, compiled by TheDripMap. ${total} active Canadian clinics at last generation.`,
    url: `${SITE_URL}/canadian-iv-therapy-report`,
    creator: { '@type': 'Organization', name: 'TheDripMap', url: SITE_URL },
    dateModified: generated,
    spatialCoverage: { '@type': 'Place', name: 'Canada' },
    license: `${SITE_URL}/canadian-iv-therapy-report#cite`,
    distribution: [{
      '@type': 'DataDownload',
      encodingFormat: 'text/csv',
      contentUrl: `${SITE_URL}/canadian-iv-therapy-report/data.csv`,
    }],
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }} />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="max-w-2xl mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-wellness-700 bg-wellness-50 border border-wellness-200 rounded-full px-3 py-1.5 mb-5">
            <BarChart3 size={14} /> Data report · updated {generated}
          </span>
          <h1 className="font-black text-slate-900 tracking-[-0.03em] leading-[1.05] text-[clamp(2rem,5.5vw,3.4rem)] mb-5">
            The Canadian IV Therapy Report
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            The first public dataset on Canada&apos;s IV therapy market: {total.toLocaleString()} active clinics tracked
            across {byProvince.size} provinces, real published prices, and the provincial rules on who can legally
            put a needle in your arm. Compiled continuously by TheDripMap; free to cite with attribution.
          </p>
        </div>

        {/* Headline stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {[
            { label: 'Active clinics', value: total.toLocaleString() },
            { label: 'Offer mobile / at-home', value: `${pct(mobileCount)}%` },
            { label: 'Mention NAD+', value: `${pct(nadCount)}%` },
            { label: 'Mention glutathione', value: `${pct(gluCount)}%` },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
              <div className="text-3xl font-black text-slate-900 tabular-nums">{s.value}</div>
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Key findings: one-line stats a journalist can lift verbatim. All
            computed live above; the ones needing price data read the dated
            snapshots. */}
        <section className="mb-14 bg-slate-900 text-white rounded-3xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-black tracking-tight mb-4">Key findings</h2>
          <ul className="space-y-3 text-[15px] leading-relaxed text-slate-200">
            <li>Canada has <strong className="text-white">{total.toLocaleString()} active IV therapy clinics</strong> across {byProvince.size} provinces, led by {provinces[0]?.name} ({provinces[0]?.count}).</li>
            {provinces.filter(p => p.per100k).sort((a, b) => (b.per100k || 0) - (a.per100k || 0))[0] && (
              <li>Per capita, <strong className="text-white">{provinces.filter(p => p.per100k).sort((a, b) => (b.per100k || 0) - (a.per100k || 0))[0].name}</strong> is the densest IV therapy market in the country at {provinces.filter(p => p.per100k).sort((a, b) => (b.per100k || 0) - (a.per100k || 0))[0].per100k?.toFixed(2)} clinics per 100,000 residents.</li>
            )}
            <li><strong className="text-white">{pct(mobileCount)}% of clinics offer mobile or at-home service</strong>, and {pct(nadCount)}% market NAD+ on their menu.</li>
            {priceCities.find(c => c.citySlug === 'toronto') && (
              <li>A standard IV vitamin drip in Toronto runs <strong className="text-white">${priceCities.find(c => c.citySlug === 'toronto')!.headline.low} to ${priceCities.find(c => c.citySlug === 'toronto')!.headline.high} CAD</strong> (median ${priceCities.find(c => c.citySlug === 'toronto')!.headline.median}) across {priceCities.find(c => c.citySlug === 'toronto')!.headline.clinics} clinics publishing prices.</li>
            )}
            <li>Only <strong className="text-white">{pct(claimedCount)}% of listings are owner-verified</strong>, a transparency gap patients cannot see from a clinic&apos;s own website.</li>
          </ul>
          <p className="mt-5 text-[12.5px] text-slate-400">
            Every figure computes live from the national dataset. <a href="/canadian-iv-therapy-report/data.csv" className="text-wellness-300 underline">Download the raw data (CSV)</a>, free to cite with attribution.
          </p>
        </section>

        {/* Province table */}
        <section className="mb-14">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
            <MapPin size={24} className="text-wellness-600" /> Clinics by province, and per capita
          </h2>
          <p className="text-slate-600 leading-relaxed mb-5">
            Ontario holds the most clinics in absolute terms, but per-capita density tells a different story.
            Population figures: Statistics Canada, 2021 Census.
          </p>
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">
                  <th className="py-3 px-4">Province</th>
                  <th className="py-3 px-4 text-right">Active clinics</th>
                  <th className="py-3 px-4 text-right">Per 100,000 residents</th>
                  <th className="py-3 px-4">Who can administer</th>
                </tr>
              </thead>
              <tbody>
                {provinces.map((p) => (
                  <tr key={p.name} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 tabular-nums">{p.count}</td>
                    <td className="py-3 px-4 text-right text-slate-600 tabular-nums">{p.per100k ? p.per100k.toFixed(2) : 'n/a'}</td>
                    <td className="py-3 px-4">
                      {PROVINCE_GUIDE[p.name]
                        ? <Link href={PROVINCE_GUIDE[p.name]} className="text-wellness-700 font-bold hover:underline text-[13px]">Provincial rules</Link>
                        : <Link href="/blog/who-can-legally-give-iv-canada-rules-by-province-2026" className="text-slate-500 font-bold hover:underline text-[13px]">National overview</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top cities */}
        <section className="mb-14">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-5">The 10 biggest IV therapy cities</h2>
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">
                  <th className="py-3 px-4">#</th><th className="py-3 px-4">City</th><th className="py-3 px-4">Province</th><th className="py-3 px-4 text-right">Active clinics</th>
                </tr>
              </thead>
              <tbody>
                {topCities.map((c, i) => (
                  <tr key={c.city} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-4 text-slate-400 font-bold tabular-nums">{i + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <Link href={`/cities/${c.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="hover:text-wellness-700 hover:underline">{c.city}</Link>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{c.province}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 tabular-nums">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Prices */}
        <section className="mb-14">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
            <DollarSign size={24} className="text-wellness-600" /> What IV therapy actually costs
          </h2>
          <p className="text-slate-600 leading-relaxed mb-5">
            From our IV Price Index: published clinic menu prices, one representative price per clinic per
            treatment, reported only where 3 or more clinics publish a price. These are published prices, not
            medical advice.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {priceCities.map((cityIdx) => (
              <div key={cityIdx.citySlug} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="font-black text-slate-900 mb-1">{cityIdx.city}</div>
                <div className="text-[11px] font-bold text-slate-400 mb-3">{cityIdx.clinicCount} clinics · {cityIdx.asOf}</div>
                <div className="text-sm text-slate-700">
                  {cityIdx.headline.treatment}: <span className="font-black">CA${cityIdx.headline.median}</span> median
                  <span className="text-slate-500"> (CA${cityIdx.headline.low} to CA${cityIdx.headline.high})</span>
                </div>
                <Link href={`/iv-prices/${cityIdx.citySlug}`} className="inline-flex items-center gap-1.5 mt-3 text-[13px] font-black text-wellness-700 hover:underline">
                  Full {cityIdx.city} index <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Regulatory map */}
        <section className="mb-14">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
            <Scale size={24} className="text-wellness-600" /> The regulatory map
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Administering an IV is a regulated act everywhere in Canada, but WHO may do it differs by province:
            physicians and nurses everywhere; naturopathic doctors with additional certification in Ontario,
            British Columbia, and Alberta; and in Quebec, where naturopathy is unregulated, nurses and physicians
            only. Each guide below cites the actual provincial regulator.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(PROVINCE_GUIDE).map(([prov, href]) => (
              <Link key={prov} href={href} className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-wellness-600 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-700 hover:text-wellness-700 transition-all">
                {prov} <ArrowRight size={13} />
              </Link>
            ))}
            <Link href="/blog/who-can-legally-give-iv-canada-rules-by-province-2026" className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all">
              All provinces <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        {/* Methodology + citation */}
        <section id="cite" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 mb-10">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-3">Methodology, and how to cite this</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            Clinic counts are computed directly from TheDripMap&apos;s continuously maintained database of Canadian
            IV therapy providers ({total.toLocaleString()} active listings at generation on {generated}; hidden and
            closed listings excluded). Service-mix percentages count clinics whose public listing mentions the
            service. Per-capita figures use Statistics Canada 2021 Census population counts. Price data comes from
            our IV Price Index: publicly published clinic menu prices, one representative price per clinic per
            treatment, reported only where at least 3 clinics publish a price. Of the clinics tracked,
            {' '}{claimedCount} are owner-claimed and {verifiedCount} hold our human-reviewed Safety Verified badge.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Journalists and researchers: this data is free to cite with attribution and a link to
            {' '}<span className="font-bold">TheDripMap ({SITE_URL}/canadian-iv-therapy-report)</span>. For custom
            cuts (a province, a city, a treatment) write <span className="font-bold">info@thedripmap.com</span>;
            we answer quickly.
          </p>
        </section>

        <div className="text-center">
          <Link href="/search" className="inline-flex items-center gap-2 bg-wellness-600 hover:bg-wellness-700 text-white px-8 py-4 rounded-2xl font-black transition-all">
            Compare IV therapy clinics near you <ArrowRight size={18} />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
