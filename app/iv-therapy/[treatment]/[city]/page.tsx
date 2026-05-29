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
];

// Canada is our uncontested lane (both competitors are US-only) — these get
// built first / all combinations.
const CANADA_CITIES = [
  'Toronto', 'Vancouver', 'Calgary', 'Ottawa',
  'Mississauga', 'Richmond Hill', 'North York', 'Oakville',
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
  const t = findTreatment(treatment);
  if (!t) return { title: 'Not found' };
  const resolved = await resolveCity(city);
  const clinics = await getListingsByServiceAndCity(t.filter, resolved.name, 60);
  const count = clinics.length;
  const cityLabel = resolved.stateAbbr ? `${resolved.name}, ${resolved.stateAbbr}` : resolved.name;
  // Canonicalize the city to its resolved slug so variant URLs dedupe to one URL.
  const canonical = `${SITE_URL}/iv-therapy/${t.slug}/${slugify(resolved.name)}`;

  return {
    title: `${t.name} in ${cityLabel} (${YEAR}) — ${count} Verified ${count === 1 ? 'Clinic' : 'Clinics'} | TheDripMap`,
    description: `Compare ${count > 0 ? `${count} ` : ''}${t.name.toLowerCase()} providers in ${cityLabel}. See verified clinics, what to expect, typical pricing, and book your session — all on TheDripMap.`,
    alternates: { canonical },
    // Don't index empty combinations — avoids thin programmatic pages.
    robots: count === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${t.name} in ${cityLabel} (${YEAR}) | TheDripMap`,
      description: `Find verified ${t.name.toLowerCase()} clinics in ${cityLabel}.`,
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

  // Data-driven (non-templated) intro — woven from the real count, named clinics,
  // and treatment specifics so each combination reads uniquely.
  const topNames = clinics.slice(0, 3).map((c) => c.name).filter(Boolean);
  const summarySentence = content?.description?.split('. ')[0];
  const intro = count > 0
    ? `There ${count === 1 ? 'is' : 'are'} ${count} ${t.name.toLowerCase()} ${count === 1 ? 'provider' : 'providers'} in ${cityLabel} on TheDripMap${verifiedCount > 0 ? `, ${verifiedCount} of them claimed and verified` : ''}.${topNames.length ? ` Options include ${topNames.join(', ')}.` : ''} ${summarySentence ? summarySentence + '.' : ''} Compare what each clinic offers below, then book directly.`
    : `We're still adding ${t.name.toLowerCase()} providers in ${cityLabel}. ${summarySentence ? summarySentence + '.' : ''} In the meantime, browse nearby clinics or explore the treatment guide below.`;

  // Treatment-and-city-specific FAQs.
  const costRange = content?.costRange;
  const faqs = [
    {
      q: `How much does ${t.name.toLowerCase()} cost in ${resolved.name}?`,
      a: costRange
        ? `${t.name} typically runs ${costRange} in most US and Canadian markets. ${resolved.name} pricing varies by clinic, add-ons, and whether you choose in-clinic or mobile service — confirm current pricing directly with the provider.`
        : `Pricing for ${t.name.toLowerCase()} in ${resolved.name} varies by clinic and add-ons. Confirm current pricing directly with the provider before booking.`,
    },
    {
      q: `Are there mobile ${t.name.toLowerCase()} options in ${resolved.name}?`,
      a: `Some ${resolved.name} providers offer mobile or in-home service in addition to a clinic. Look for the "Mobile" tag on the clinic cards above, and confirm the service area covers your address.`,
    },
    {
      q: `How do I choose a safe ${t.name.toLowerCase()} clinic in ${resolved.name}?`,
      a: `Look for licensed medical oversight, transparent ingredients and pricing, and verification. On TheDripMap, claimed and verified ${resolved.name} clinics carry a badge. ${content?.safety ? content.safety.split('. ')[0] + '.' : 'Always confirm suitability with a licensed clinician.'}`,
    },
    {
      q: `Do I need an appointment for ${t.name.toLowerCase()} in ${resolved.name}?`,
      a: `Many ${resolved.name} clinics take both walk-ins and appointments, while mobile services are appointment-based. Check each listing for hours and booking details, and book ahead during busy periods.`,
    },
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Treatments', item: `${SITE_URL}/treatments` },
      { '@type': 'ListItem', position: 2, name: t.name, item: `${SITE_URL}/treatments/${t.slug === 'hangover-recovery' ? 'hangover' : t.slug === 'athletic-recovery' ? 'recovery' : t.slug === 'mobile-iv' ? 'hydration' : t.slug === 'vitamin-c' ? 'high-dose-vitamin-c' : t.slug}` },
      { '@type': 'ListItem', position: 3, name: `${t.name} in ${cityLabel}`, item: canonical },
    ],
  };
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

  const otherTreatments = MATRIX_TREATMENTS.filter((x) => x.slug !== t.slug).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {itemListJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <BreadcrumbNav items={[{ label: 'Treatments', href: '/treatments' }, { label: t.name, href: `/treatments/${treatmentPageSlug}` }, { label: cityLabel }]} />

        {/* Hero */}
        <section className="mt-10 mb-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.18em] mb-5 border border-wellness-100">
            <MapPin size={14} /> {cityLabel}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[1.02]">
            {t.name} in {resolved.name} — Find Verified Clinics
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">{intro}</p>
          {count > 0 && (
            <div className="flex flex-wrap gap-3 mt-6">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-full">
                <Star size={14} className="text-amber-500" fill="currentColor" /> {count} {count === 1 ? 'clinic' : 'clinics'}
              </span>
              {verifiedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-wellness-700 bg-wellness-50 border border-wellness-100 px-4 py-2 rounded-full">
                  <ShieldCheck size={14} /> {verifiedCount} verified
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
                Search the directory
              </Link>
            </div>
          </section>
        )}

        {/* Treatment context */}
        {content && (
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-10 mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight">What is {t.name.replace(/ IV$/, '')}?</h2>
            <p className="text-slate-600 leading-relaxed mb-6 whitespace-pre-wrap">{content.description.split('\n\n')[0]}</p>
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
            <HelpCircle size={24} className="text-wellness-600" /> {t.name} in {resolved.name} — FAQ
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
