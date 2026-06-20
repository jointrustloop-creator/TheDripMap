import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { MapPin, ArrowRight, ShieldCheck, Star, HelpCircle } from 'lucide-react';
import { Navbar } from '../../../../src/components/Navbar';
import { Footer } from '../../../../src/components/Footer';
import { ProviderCard } from '../../../../src/components/ProviderCard';
import { BreadcrumbNav } from '../../../../src/components/BreadcrumbNav';
import {
  getAllCities,
  getListingsByServiceAndCity,
  slugify,
  STATE_MAP,
} from '../../../../src/lib/data';
import { getTreatmentContent } from '../../../../src/lib/treatment-content';
import { findDefinition } from '../../../../src/lib/treatment-definitions';
import { Provider } from '../../../../src/types';

export const revalidate = 86400;
export const dynamicParams = true;

const SITE_URL = 'https://www.thedripmap.com';
const YEAR = new Date().getFullYear();

// The treatment x city matrix. `filter` is the keyword string passed to the
// provider search; `content` maps to a TREATMENT_CONTENT key for the education
// block (null when there isn't a dedicated page, e.g. mobile delivery).
interface MatrixTreatment {
  slug: string;
  name: string;
  filter: string;
  content: string | null;
  mobile?: boolean;
}
const MATRIX_TREATMENTS: MatrixTreatment[] = [
  { slug: 'hydration', name: 'Hydration IV', filter: 'Hydration', content: 'Hydration' },
  { slug: 'nad-plus', name: 'NAD+ IV', filter: 'NAD+', content: 'NAD+ Plus' },
  { slug: 'myers-cocktail', name: 'Myers Cocktail', filter: 'Myers Cocktail', content: 'Myers Cocktail' },
  { slug: 'hangover-recovery', name: 'Hangover Recovery IV', filter: 'Hangover', content: 'Hangover' },
  { slug: 'immune-support', name: 'Immune Support IV', filter: 'Immune Support', content: 'Immune Support' },
  { slug: 'beauty-glow', name: 'Beauty & Glow IV', filter: 'Beauty Glow', content: 'Beauty Glow' },
  { slug: 'athletic-recovery', name: 'Athletic Recovery IV', filter: 'Recovery', content: 'Recovery' },
  { slug: 'mobile-iv', name: 'Mobile IV', filter: 'Mobile', content: null, mobile: true },
  { slug: 'weight-loss', name: 'Weight Loss IV', filter: 'Weight Loss', content: 'Weight Loss' },
  { slug: 'vitamin-c', name: 'Vitamin C IV', filter: 'Vitamin C', content: 'High-Dose Vitamin C' },
  { slug: 'glutathione', name: 'Glutathione IV', filter: 'Glutathione', content: 'Glutathione' },
  { slug: 'glp-1-weight-loss', name: 'GLP-1 IV (Semaglutide/Tirzepatide)', filter: 'Peptide', content: null },
  { slug: 'iron-infusion', name: 'Iron Infusion', filter: 'Iron', content: null },
];

// Canada is our uncontested lane (both competitors are US-only) — these get
// built first / all combinations.
const CANADA_CITIES = [
  'Toronto', 'Vancouver', 'Calgary', 'Ottawa',
  'Mississauga', 'Richmond Hill', 'North York', 'Oakville',
  'Edmonton', 'Montreal', 'Quebec City', 'Winnipeg',
  'Halifax', 'Victoria', 'Kelowna', 'Red Deer',
];

const findTreatment = (slug: string) =>
  MATRIX_TREATMENTS.find((t) => t.slug === slug.toLowerCase());

interface ResolvedCity {
  name: string;
  state: string | null;
  stateAbbr: string | null;
}

// Resolve a city slug to its canonical name/state from the directory. Falls back
// to a humanized slug so on-demand pages for smaller cities still render.
async function resolveCity(citySlug: string): Promise<ResolvedCity> {
  const cities = await getAllCities();
  const match = cities.find((c) => slugify(c.city) === citySlug.toLowerCase());
  if (match) return { name: match.city, state: match.state || null, stateAbbr: match.stateAbbr || null };
  const humanized = citySlug.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
  return { name: humanized, state: null, stateAbbr: null };
}

// Mobile detection mirrors the data layer (enriched flag first, then the raw
// type/specialty signals) so the count matches what the cards actually show.
function clinicIsMobile(c: Provider): boolean {
  if (c.mobile_service) return true;
  const ty = (c.type || '').toLowerCase();
  if (ty === 'mobile' || ty === 'both') return true;
  const blob = [c.category, (c.specialties || []).join(' '), (c.subtypes || []).join(' '), c.description]
    .join(' ')
    .toLowerCase();
  return blob.includes('mobile') || blob.includes('in-home') || blob.includes('at-home') || blob.includes('concierge');
}

// House style: no en/em/figure dashes in generated copy. Belt-and-suspenders in
// case a clinic name or price_range carries one.
const noDash = (str: string): string => str.replace(/[‒-―−]/g, '-');

interface CityStats {
  count: number;
  mobileCount: number;
  mobileNames: string[];
  inClinicCount: number;
  ratedCount: number;
  avgRating: number;
  topRated: Provider | null;
  claimedCount: number;
  verifiedCount: number;
  priced: Provider | null;
}

// Compute real, per-(treatment x city) stats from the loaded clinic set. Every
// figure is sourced from live provider data so each page reads uniquely instead
// of swapping a name into a shared template.
function computeCityStats(clinics: Provider[]): CityStats {
  const mob = clinics.filter(clinicIsMobile);
  const rated = clinics.filter((c) => Number(c.rating) > 0 && Number(c.reviewCount) > 0);
  const avg = rated.length ? rated.reduce((sum, c) => sum + Number(c.rating), 0) / rated.length : 0;
  const top = rated
    .slice()
    .sort((a, b) => (Number(b.rating) - Number(a.rating)) || (Number(b.reviewCount) - Number(a.reviewCount)))[0] || null;
  const priced = clinics.find((c) => typeof c.price_range === 'string' && /\d/.test(c.price_range)) || null;
  return {
    count: clinics.length,
    mobileCount: mob.length,
    mobileNames: mob.slice(0, 2).map((c) => c.name).filter(Boolean),
    inClinicCount: clinics.length - mob.length,
    ratedCount: rated.length,
    avgRating: avg,
    topRated: top,
    claimedCount: clinics.filter((c) => c.is_claimed === true).length,
    verifiedCount: clinics.filter((c) => c.is_featured === true).length,
    priced,
  };
}

export async function generateStaticParams() {
  try {
    const cities = await getAllCities();
    const topUS = cities
      .filter((c) => !CANADA_CITIES.includes(c.city))
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 20)
      .map((c) => c.city);
    const priorityCities = [...CANADA_CITIES, ...topUS];
    const params: { treatment: string; city: string }[] = [];
    for (const t of MATRIX_TREATMENTS) {
      for (const city of priorityCities) {
        params.push({ treatment: t.slug, city: slugify(city) });
      }
    }
    return params;
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ treatment: string; city: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { treatment, city } = await params;
  const safeTreatment = treatment || 'iv-therapy';
  const safeCity = city || 'usa';
  const fallbackCanonical = `${SITE_URL}/iv-therapy/${safeTreatment}/${safeCity}`;
  const niceTreatment = safeTreatment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const niceCity = safeCity.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const t = findTreatment(treatment);
  if (!t) {
    return {
      title: `${niceTreatment} IV Therapy in ${niceCity} | TheDripMap`,
      description: `Find ${niceTreatment.toLowerCase()} IV therapy clinics in ${niceCity}. Compare options, pricing, and book your session on TheDripMap.`,
      alternates: { canonical: fallbackCanonical },
      robots: { index: false, follow: true },
    };
  }

  const resolved = await resolveCity(city);
  const clinics = await getListingsByServiceAndCity(t.filter, resolved.name, 60);
  const count = clinics.length;
  const cityLabel = resolved.stateAbbr ? `${resolved.name}, ${resolved.stateAbbr}` : resolved.name;
  // Canonicalize the city to its resolved slug so variant URLs dedupe to one URL.
  const canonical = `${SITE_URL}/iv-therapy/${t.slug}/${slugify(resolved.name) || safeCity}`;

  const titleCount = count === 1 ? '1 Clinic' : `${count} Clinics`;
  const title = `${t.name} in ${cityLabel} (${YEAR}) | ${titleCount} | TheDripMap`;
  const description = `Compare ${count > 0 ? `${count} ` : ''}${t.name.toLowerCase()} providers in ${cityLabel}. See clinics, what to expect, typical pricing, and book your session on TheDripMap.`;

  return {
    title,
    description,
    alternates: { canonical },
    // Don't index thin combinations (fewer than 3 providers) so Google sees
    // the rest of the site as higher quality. 2026-06-06: bumped the
    // threshold from 0 to 3 after the matrix audit found 99 of 468 combos
    // sitting at 1-2 providers, those pages diluting overall site authority
    // signal. Pages remain reachable for users via direct URL and internal
    // links, just noindexed.
    robots: count < 3 ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${t.name} in ${cityLabel} (${YEAR}) | TheDripMap`,
      description: `Find ${t.name.toLowerCase()} clinics in ${cityLabel}.`,
      url: canonical,
      type: 'website',
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

export default async function TreatmentCityPage({ params }: PageProps) {
  const { treatment, city } = await params;
  const t = findTreatment(treatment);

  // Legacy /iv-therapy/{state}/{city} URLs: a non-treatment first segment that is
  // a US state (or "ontario") should land on the city page, preserving old signals.
  if (!t) {
    const stateSlugs = new Set(Object.keys(STATE_MAP));
    if (stateSlugs.has(treatment.toLowerCase())) {
      redirect(`/cities/${city.toLowerCase()}`);
    }
    notFound();
  }

  const resolved = await resolveCity(city);
  const cityLabel = resolved.stateAbbr ? `${resolved.name}, ${resolved.stateAbbr}` : resolved.name;
  const citySlug = city.toLowerCase();
  const canonical = `${SITE_URL}/iv-therapy/${t.slug}/${citySlug}`;

  let clinics = (await getListingsByServiceAndCity(t.filter, resolved.name, 60)) as Provider[];
  if (t.mobile) {
    const mobileFirst = clinics.filter(
      (p) => p.mobile_service || p.type === 'Mobile' || (p.specialties || []).some((s) => (s || '').toLowerCase().includes('mobile'))
    );
    if (mobileFirst.length) clinics = mobileFirst;
  }
  const count = clinics.length;
  const verifiedCount = clinics.filter((c) => c.is_featured).length;
  const content = t.content ? getTreatmentContent(t.content) : undefined;

  // Real per-(treatment x city) stats. Powers the "by the numbers" snapshot and
  // the data-driven FAQs below so each page carries facts unique to this city.
  const cityStats = computeCityStats(clinics);

  // City snapshot — every figure is live data, so this paragraph differs on
  // every treatment x city page.
  const cs = cityStats;
  const tl = t.name.toLowerCase();
  const prov = cs.count === 1 ? 'provider' : 'providers';
  const snapshotParts: string[] = [`TheDripMap lists ${cs.count} ${tl} ${prov} in ${cityLabel}.`];
  if (cs.mobileCount > 0 && cs.inClinicCount > 0) snapshotParts.push(`${cs.inClinicCount} ${cs.inClinicCount === 1 ? 'works' : 'work'} from a clinic and ${cs.mobileCount} ${cs.mobileCount === 1 ? 'offers' : 'offer'} mobile or in-home visits.`);
  else if (cs.mobileCount > 0) snapshotParts.push(`${cs.mobileCount === cs.count ? 'All' : cs.mobileCount} of them offer mobile or in-home visits.`);
  else snapshotParts.push(`All of them work from a physical clinic.`);
  if (cs.ratedCount > 0) snapshotParts.push(`${cs.ratedCount} ${cs.ratedCount === 1 ? 'has' : 'have'} public reviews, averaging ${cs.avgRating.toFixed(1)} stars.`);
  if (cs.claimedCount > 0) snapshotParts.push(`${cs.claimedCount} ${cs.claimedCount === 1 ? 'is' : 'are'} claimed and Safety Verified.`);
  const citySnapshot = noDash(snapshotParts.join(' '));

  // Trim the shared treatment definition to a 2-sentence lede on the matrix page;
  // the full education lives on the linked /treatments hub, so this keeps the
  // page useful without carrying a long block that is identical across cities.
  const contextLede = content
    ? noDash(content.description.split('\n\n')[0].split('. ').slice(0, 2).join('. ').replace(/\s*\.?\s*$/, '.'))
    : '';

  // Data-driven (non-templated) intro — woven from the real count, named clinics,
  // and treatment specifics so each combination reads uniquely.
  const topNames = clinics.slice(0, 3).map((c) => c.name).filter(Boolean);
  const summarySentence = content?.description?.split('. ')[0];
  const intro = count > 0
    ? `There ${count === 1 ? 'is' : 'are'} ${count} ${t.name.toLowerCase()} ${count === 1 ? 'provider' : 'providers'} in ${cityLabel} on TheDripMap${verifiedCount > 0 ? `, ${verifiedCount} of them claimed (Safety Verified)` : ''}.${topNames.length ? ` Options include ${topNames.join(', ')}.` : ''} ${summarySentence ? summarySentence + '.' : ''} Compare what each clinic offers below, then book directly.`
    : `We're still adding ${t.name.toLowerCase()} providers in ${cityLabel}. ${summarySentence ? summarySentence + '.' : ''} In the meantime, browse nearby clinics or explore the treatment guide below.`;

  // Data-driven FAQs. Each answer leads with a fact computed from the live clinic
  // set (mobile split, named providers, the real top-rated clinic, claimed count)
  // so the FAQPage content is unique per city instead of a name-swapped template.
  let costA = `Across the ${cs.count} ${tl} ${cs.count === 1 ? 'clinic' : 'clinics'} listed in ${resolved.name}, each sets its own pricing${content?.costRange ? `, and ${content.costRange} is the typical range for ${tl}` : ''}.`;
  if (cs.priced) costA += ` ${cs.priced.name} lists ${cs.priced.price_range}.`;
  costA += ` Mobile visits usually add a delivery fee. Confirm the current price with the clinic before booking.`;

  let mobileA: string;
  if (cs.mobileCount > 0) {
    mobileA = `Yes. ${cs.mobileCount} of the ${cs.count} ${tl} ${prov} in ${resolved.name} offer mobile or in-home service`;
    if (cs.mobileNames.length) mobileA += `, including ${cs.mobileNames.join(' and ')}`;
    mobileA += `. Check that the service area covers your address when you book.`;
  } else {
    mobileA = `The ${cs.count} ${tl} ${cs.count === 1 ? 'clinic' : 'clinics'} listed in ${resolved.name} work from a physical location rather than offering mobile visits. For at-home drips, browse mobile IV options nearby.`;
  }

  let chooseA = `Compare credentials, transparent ingredients and pricing, and reviews.`;
  if (cs.topRated) chooseA += ` In ${resolved.name}, ${cs.topRated.name} is currently the highest-rated option at ${Number(cs.topRated.rating).toFixed(1)} stars across ${cs.topRated.reviewCount} reviews.`;
  if (cs.claimedCount > 0) chooseA += ` ${cs.claimedCount} ${resolved.name} ${cs.claimedCount === 1 ? 'clinic has' : 'clinics have'} claimed and verified ${cs.claimedCount === 1 ? 'its' : 'their'} listing on TheDripMap.`;
  else chooseA += ` Look for clinics that have claimed and verified their listing.`;

  let bookA = `Most ${resolved.name} clinics work by appointment, and some in-clinic locations also take walk-ins.`;
  if (cs.mobileCount > 0) bookA += ` The ${cs.mobileCount} mobile ${cs.mobileCount === 1 ? 'option is' : 'options are'} appointment-based, so book the visit ahead.`;
  else bookA += ` Check each listing for current hours and booking details.`;
  bookA += ` Weekends and holidays tend to fill up fastest.`;

  const faqs = [
    { q: `How much does ${tl} cost in ${resolved.name}?`, a: noDash(costA) },
    { q: `Can you get mobile ${tl} in ${resolved.name}?`, a: noDash(mobileA) },
    { q: `How do I choose a ${tl} clinic in ${resolved.name}?`, a: noDash(chooseA) },
    { q: `Do you need an appointment for ${tl} in ${resolved.name}?`, a: noDash(bookA) },
  ];

  // One-line definition from the shared map. Falls back to null when no
  // match — page still renders fine via the longer treatment-content block.
  // Match against the matrix display name first, then the filter keyword.
  const oneLineDef = findDefinition(t.name) || findDefinition(t.filter);

  const definedTermJsonLd = oneLineDef ? {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: oneLineDef.name,
    description: oneLineDef.definition,
    inDefinedTermSet: `${SITE_URL}/treatments`,
    url: oneLineDef.slug ? `${SITE_URL}/iv-therapy/${oneLineDef.slug}` : `${SITE_URL}/treatments`,
  } : null;

  const itemListJsonLd = count > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${t.name} clinics in ${cityLabel}`,
    numberOfItems: count,
    itemListElement: clinics.slice(0, 20).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'MedicalBusiness',
        name: c.name,
        url: `${SITE_URL}/providers/${c.slug || slugify(c.name)}`,
        address: { '@type': 'PostalAddress', addressLocality: c.city, addressRegion: c.state },
        ...(c.is_featured && c.rating > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: c.rating, reviewCount: c.reviewCount || 0 } } : {}),
      },
    })),
  } : null;
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  // The treatment page slug for internal linking (matrix slug -> /treatments slug).
  const treatmentPageSlug =
    t.slug === 'hangover-recovery' ? 'hangover'
    : t.slug === 'athletic-recovery' ? 'recovery'
    : t.slug === 'mobile-iv' ? 'hydration'
    : t.slug === 'vitamin-c' ? 'high-dose-vitamin-c'
    : t.slug;

  // BreadcrumbList JSON-LD for the treatment x city page.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Treatments', item: `${SITE_URL}/treatments` },
      { '@type': 'ListItem', position: 3, name: t.name, item: `${SITE_URL}/treatments/${treatmentPageSlug}` },
      { '@type': 'ListItem', position: 4, name: cityLabel, item: canonical },
    ],
  };

  const otherTreatments = MATRIX_TREATMENTS.filter((x) => x.slug !== t.slug).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      {itemListJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />}
      {definedTermJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermJsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <BreadcrumbNav items={[{ label: 'Treatments', href: '/treatments' }, { label: t.name, href: `/treatments/${treatmentPageSlug}` }, { label: cityLabel }]} />

        {/* Hero */}
        <section className="mt-10 mb-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.18em] mb-5 border border-wellness-100">
            <MapPin size={14} /> {cityLabel}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[1.02]">
            {t.name} in {resolved.name}
          </h1>
          {oneLineDef && (
            <div className="bg-wellness-50/60 border border-wellness-100 rounded-2xl px-5 py-4 mb-5">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-wellness-700 mb-1">
                What it is
              </div>
              <p className="text-base text-slate-700 leading-relaxed">
                <strong className="text-slate-900">{oneLineDef.name}:</strong>{' '}
                {oneLineDef.definition}{' '}
                <Link href="/treatments" className="text-wellness-700 font-bold hover:underline whitespace-nowrap">
                  See all treatments
                </Link>
              </p>
            </div>
          )}
          <p className="text-lg text-slate-600 leading-relaxed">{intro}</p>
          {count > 0 && (
            <div className="flex flex-wrap gap-3 mt-6">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-full">
                <Star size={14} className="text-amber-500" fill="currentColor" /> {count} {count === 1 ? 'clinic' : 'clinics'}
              </span>
              {verifiedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-wellness-700 bg-wellness-50 border border-wellness-100 px-4 py-2 rounded-full">
                  <ShieldCheck size={14} /> {verifiedCount} Safety Verified
                </span>
              )}
            </div>
          )}
        </section>

        {/* Clinic grid */}
        {count > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {clinics.slice(0, 24).map((c) => (
              <ProviderCard key={c.id} provider={c} />
            ))}
          </section>
        ) : (
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center mb-16">
            <p className="text-slate-500 font-medium mb-6">
              No {t.name.toLowerCase()} clinics are listed in {cityLabel} yet.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={`/cities/${citySlug}`} className="bg-wellness-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-wellness-700 transition-all">
                All clinics in {resolved.name}
              </Link>
              <Link href="/search" className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black text-sm hover:border-slate-300 transition-all">
                Search all clinics
              </Link>
            </div>
          </section>
        )}

        {/* City snapshot — real, per-city stats. Renders on every page with clinics,
            including treatments (mobile-iv, glp-1, iron) that have no education block. */}
        {count > 0 && (
          <section className="bg-wellness-50/40 border border-wellness-100 rounded-3xl p-6 md:p-8 mb-12">
            <h2 className="text-lg md:text-xl font-black text-slate-900 mb-3 tracking-tight">
              {t.name.replace(/ IV$/, '')} in {resolved.name}: by the numbers
            </h2>
            <p className="text-slate-700 leading-relaxed">{citySnapshot}</p>
          </section>
        )}

        {/* Treatment context */}
        {content && (
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-10 mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight">What is {t.name.replace(/ IV$/, '')}?</h2>
            <p className="text-slate-600 leading-relaxed mb-6">{contextLede}</p>
            <div className="flex flex-wrap gap-6 text-sm">
              {content.costRange && (
                <div><div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Typical cost</div><div className="font-bold text-slate-900">{content.costRange}</div></div>
              )}
              {content.sessionDuration && (
                <div><div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Session</div><div className="font-bold text-slate-900">{content.sessionDuration}</div></div>
              )}
            </div>
            <Link href={`/treatments/${treatmentPageSlug}`} className="inline-flex items-center gap-2 mt-6 text-wellness-600 font-black text-sm hover:underline">
              Full {t.name.replace(/ IV$/, '')} guide <ArrowRight size={15} />
            </Link>
          </section>
        )}

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-3">
            <HelpCircle size={24} className="text-wellness-600" /> {t.name} in {resolved.name} FAQ
          </h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="font-black text-slate-900 mb-2">{f.q}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="bg-slate-900 text-white rounded-3xl p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-black mb-4">More in {resolved.name}</h3>
              <div className="flex flex-wrap gap-2">
                <Link href={`/cities/${citySlug}`} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all">All {resolved.name} clinics</Link>
                {otherTreatments.map((ot) => (
                  <Link key={ot.slug} href={`/iv-therapy/${ot.slug}/${citySlug}`} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                    {ot.name.replace(/ IV$/, '')}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black mb-4">Learn more</h3>
              <div className="flex flex-wrap gap-2">
                <Link href={`/treatments/${treatmentPageSlug}`} className="bg-wellness-600 hover:bg-wellness-700 px-4 py-2 rounded-xl text-sm font-bold transition-all">{t.name.replace(/ IV$/, '')} guide</Link>
                <Link href="/treatments" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all">All treatments</Link>
                <Link href="/quiz" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all">Take the quiz</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
