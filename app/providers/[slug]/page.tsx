import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MapPin,
  Zap,
  Activity,
  Building2,
  Home,
  Star,
  ArrowRight,
  User,
  CheckCircle2,
  ExternalLink,
  Phone,
  Droplets,
} from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { ProviderCredentialBlock } from '../../../src/components/ProviderCredentialBlock';
import { ClinicImage } from '../../../src/components/ClinicImage';
import { ResilientImage } from '../../../src/components/ResilientImage';
import { ClaimListingTrigger } from '../../../src/components/ClaimListingTrigger';
import { StickyClaimRail } from '../../../src/components/StickyClaimRail';
import { MessageClinicButton } from '../../../src/components/MessageClinicButton';
import { PatientTestimonials } from '../../../src/components/PatientTestimonials';
import { ClaimAutoOpener } from '../../../src/components/ClaimAutoOpener';
import {
  getListingBySlug,
  slugify,
  getAllListings,
  getStateFromProvider,
  getOperatorProfiles,
  getSimilarClinics,
  getApprovedTestimonials
} from '../../../src/lib/data';
import { SupabaseUnreachableError } from '../../../src/lib/supabase-health';
import { TemporarilyUnavailable } from '../../../src/components/TemporarilyUnavailable';
import { Provider } from '../../../src/types';
import { cn } from '../../../src/lib/utils';
import { getStatus } from '../../../src/lib/hours';
import SmartSummary from '../../../src/components/SmartSummary';
import { calculateValueMetrics } from '../../../src/lib/price-utils';

// Revalidate every 5 min. Bumped from 60 → 300 on 2026-05-31 alongside the
// SupabaseUnreachableError fallback so a postgrest outage can't pin clinic
// pages at 404 by caching a notFound() state.
export const revalidate = 300;

const STATE_MAP: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

const TIMEZONE_MAP: Record<string, string> = {
  // US States — Eastern
  'CT': 'America/New_York', 'DE': 'America/New_York', 'DC': 'America/New_York',
  'FL': 'America/New_York', 'GA': 'America/New_York',
  'IN': 'America/Indiana/Indianapolis', 'ME': 'America/New_York',
  'MD': 'America/New_York', 'MA': 'America/New_York', 'MI': 'America/Detroit',
  'NH': 'America/New_York', 'NJ': 'America/New_York', 'NY': 'America/New_York',
  'NC': 'America/New_York', 'OH': 'America/New_York', 'PA': 'America/New_York',
  'RI': 'America/New_York', 'SC': 'America/New_York', 'VT': 'America/New_York',
  'VA': 'America/New_York', 'WV': 'America/New_York',
  // US States — Central
  'AL': 'America/Chicago', 'AR': 'America/Chicago', 'IL': 'America/Chicago',
  'IA': 'America/Chicago', 'KS': 'America/Chicago',
  'KY': 'America/Kentucky/Louisville', 'LA': 'America/Chicago',
  'MN': 'America/Chicago', 'MS': 'America/Chicago', 'MO': 'America/Chicago',
  'NE': 'America/Chicago', 'ND': 'America/Chicago', 'OK': 'America/Chicago',
  'SD': 'America/Chicago', 'TN': 'America/Chicago', 'TX': 'America/Chicago',
  'WI': 'America/Chicago',
  // US States — Mountain
  'AZ': 'America/Phoenix', 'CO': 'America/Denver', 'ID': 'America/Boise',
  'MT': 'America/Denver', 'NM': 'America/Denver', 'UT': 'America/Denver',
  'WY': 'America/Denver',
  // US States — Pacific
  'CA': 'America/Los_Angeles', 'NV': 'America/Los_Angeles',
  'OR': 'America/Los_Angeles', 'WA': 'America/Los_Angeles',
  // US States — Alaska / Hawaii
  'AK': 'America/Anchorage', 'HI': 'Pacific/Honolulu',
  // Canadian Provinces & Territories
  'AB': 'America/Edmonton', 'Alberta': 'America/Edmonton',
  'BC': 'America/Vancouver', 'British Columbia': 'America/Vancouver',
  'MB': 'America/Winnipeg', 'Manitoba': 'America/Winnipeg',
  'NB': 'America/Halifax', 'New Brunswick': 'America/Halifax',
  'NL': 'America/St_Johns', 'Newfoundland and Labrador': 'America/St_Johns',
  'NS': 'America/Halifax', 'Nova Scotia': 'America/Halifax',
  'NT': 'America/Yellowknife', 'Northwest Territories': 'America/Yellowknife',
  'NU': 'America/Iqaluit', 'Nunavut': 'America/Iqaluit',
  'ON': 'America/Toronto', 'Ontario': 'America/Toronto',
  'PE': 'America/Halifax', 'Prince Edward Island': 'America/Halifax',
  'QC': 'America/Toronto', 'Quebec': 'America/Toronto', 'Québec': 'America/Toronto',
  'SK': 'America/Regina', 'Saskatchewan': 'America/Regina',
  'YT': 'America/Whitehorse', 'Yukon': 'America/Whitehorse',
};

const DEFAULT_CLINIC_IMAGE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-group-clinic.jpg';

// Beautiful default cover photo used as the magazine hero background for claimed
// listings whose `image_url` is a logo (not a clinic interior photo). Stretches
// edge-to-edge so the page feels premium regardless of what the clinic uploaded.
const DEFAULT_HERO_BACKDROP =
  'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-spa-reception-recliners.jpg';

interface ProviderPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  const providers = await getAllListings();
  return providers
    .filter(p => p.name)
    .map((p) => ({
      slug: p.slug || slugify(p.name),
    }));
}

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const { slug } = await params;
  let provider: Awaited<ReturnType<typeof getListingBySlug>>;
  try {
    provider = await getListingBySlug(slug);
  } catch (err) {
    if (err instanceof SupabaseUnreachableError) {
      // Soft fallback so a transient Supabase outage doesn't ship a "not found"
      // title into Google's cache. Page renders TemporarilyUnavailable below.
      return { title: 'IV Therapy Clinic | TheDripMap' };
    }
    throw err;
  }

  if (!provider || provider.availability === false) {
    notFound();
  }

  const displayName = provider.name
    .split(' | ')[0]
    .split(' - IV')[0]
    .split(' - Drip')[0]
    .trim();

  const topSpecialties = provider.specialties?.slice(0, 3).join(', ') || 'hydration, NAD+, immune support';

  // Canonicalize to the provider's TRUE slug, not the requested URL slug.
  // getListingBySlug() fuzzy-matches, so several URL variants can resolve to
  // the same provider — pointing every variant's canonical at the one true
  // slug is what tells Google they're the same page (fixes duplicate-canonical
  // flags in Search Console).
  const canonicalSlug = provider.slug || slugify(provider.name);
  const canonicalUrl = `https://www.thedripmap.com/providers/${canonicalSlug}`;

  const title = `${displayName} — IV Therapy in ${provider.city}, ${provider.state} | Reviews & Booking | TheDripMap`;
  const description = provider.is_featured && provider.reviewCount > 0
    ? `Read reviews for ${displayName} in ${provider.city}, ${provider.state}. ${provider.rating} stars, ${provider.reviewCount} reviews. IV therapy treatments include ${topSpecialties}. Book your session today.`
    : `Find ${displayName} in ${provider.city}, ${provider.state}. IV therapy treatments include ${topSpecialties}. Compare prices and book your drip session today on TheDripMap.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: provider.imageUrl || 'https://www.thedripmap.com/og-image.png',
          width: 1200,
          height: 630,
          alt: provider.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [provider.imageUrl || 'https://www.thedripmap.com/og-image.png'],
    },
  };
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { slug } = await params;
  let provider: Awaited<ReturnType<typeof getListingBySlug>>;
  try {
    provider = await getListingBySlug(slug);
  } catch (err) {
    if (err instanceof SupabaseUnreachableError) {
      const guess = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return <TemporarilyUnavailable kind="clinic" label={guess} />;
    }
    throw err;
  }

  if (!provider || provider.availability === false) {
    notFound();
  }

  const profiles = await getOperatorProfiles();
  // Match on either camelCase or snake_case — DB stores clinic_id, type allows both.
  const profile = profiles.find(p => p.clinicId === provider.id || p.clinic_id === provider.id);
  const stateCode = provider.state || getStateFromProvider(provider);
  const timezone = TIMEZONE_MAP[stateCode] || 'America/New_York';
  const stateName = STATE_MAP[stateCode] || stateCode;
  const citySlug = slugify(provider.city);
  const cityLabel = provider.city;
  
  const status = getStatus(provider.hours, timezone);
  const isMobile = provider.mobile_service || provider.type === 'Mobile' || profile?.profile_data?.mobileService;

  const displayName = provider.name
    .split(' | ')[0]
    .split(' - IV')[0]
    .split(' - Drip')[0]
    .trim();

  const getInitials = (name: string, city: string, listings: Provider[]) => {
    let words = name.trim().split(/\s+/);
    if (words.length > 1 && ['the', 'a', 'an'].includes(words[0].toLowerCase())) {
      words = words.slice(1);
    }
    const w1 = words[0]?.[0] || '';
    const w2 = words[1]?.[0] || '';
    let initials = (w1 + w2).toUpperCase();
    
    const othersInCity = listings.filter(p => p.city === city && p.id !== provider.id);
    const hasConflict = othersInCity.some(p => {
      let oWords = p.name.trim().split(/\s+/);
      if (oWords.length > 1 && ['the', 'a', 'an'].includes(oWords[0].toLowerCase())) oWords = oWords.slice(1);
      return (oWords[0]?.[0] + (oWords[1]?.[0] || '')).toUpperCase() === initials;
    });
    
    if (hasConflict && words[2]) {
      initials = (w1 + words[2][0]).toUpperCase();
    }
    
    return initials.slice(0, 2);
  };

  const allListings = await getAllListings();
  const initials = getInitials(provider.name, provider.city, allListings);
  const valueMetrics = calculateValueMetrics(provider);
  
  const similarClinics = await getSimilarClinics(slug, provider.city, stateCode);
  const patientTestimonials = provider.is_featured
    ? await getApprovedTestimonials(provider.id)
    : [];

  // Reviews & ratings are shown ONLY for claimed/verified listings. Unclaimed
  // listings never display ratings, review counts, or testimonials anywhere.
  const isVerified = provider.is_featured === true;
  // Blend Google rating with patient testimonials so a clinic with 0 Google reviews
  // but verified TheDripMap testimonials still shows a meaningful rating.
  const googleRating = isVerified ? Number(provider.rating) || 0 : 0;
  const googleCount = isVerified ? Number(provider.reviewCount) || 0 : 0;
  const testimonialCount = patientTestimonials.length;
  const testimonialRatingSum = patientTestimonials.reduce(
    (sum, t) => sum + (Number(t.rating) || 0),
    0
  );

  const totalCount = googleCount + testimonialCount;
  const totalSum = googleRating * googleCount + testimonialRatingSum;
  const displayRating = totalCount > 0 ? Number((totalSum / totalCount).toFixed(1)) : 0;
  const displayReviewCount = totalCount;
  const ratingSource: 'google' | 'testimonials' | 'blended' =
    googleCount > 0 && testimonialCount > 0
      ? 'blended'
      : testimonialCount > 0
      ? 'testimonials'
      : 'google';
  const isCityMatch = similarClinics.every(c => c.city === provider.city);
  const similarTitle = isCityMatch && similarClinics.length >= 3 
    ? `Other IV therapy clinics in ${provider.city}` 
    : `Other IV therapy clinics in ${stateName}`;

  const medicalBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "MedicalBusiness"],
    "name": provider.name,
    "description": provider.description,
    "image": provider.imageUrl,
    "telePhone": provider.phone,
    "url": `https://www.thedripmap.com/providers/${slug}`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": provider.address,
      "addressLocality": provider.city,
      "addressRegion": stateCode,
      "postalCode": provider.postal_code,
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": provider.latitude,
      "longitude": provider.longitude
    },
    "aggregateRating": displayReviewCount > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": displayRating,
      "reviewCount": displayReviewCount
    } : undefined
  };

  const faqJsonLd = provider.is_featured ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What services does ${provider.name} offer?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${provider.name} in ${provider.city} specializes in ${provider.specialties?.slice(0, 3).join(', ')} and other IV wellness treatments.`
        }
      },
      {
        "@type": "Question",
        "name": `Is mobile IV therapy available from ${provider.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": isMobile 
            ? `Yes, ${provider.name} offers mobile IV therapy services in the ${provider.city} area.`
            : `Currently, ${provider.name} primarily offers in-clinic treatments at their location in ${provider.city}.`
        }
      },
      {
        "@type": "Question",
        "name": `How much does IV therapy cost at ${provider.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Pricing at ${provider.name} is classified as ${provider.price_range || 'competitive'}. For exact pricing on specific drips like NAD+ or Myers' Cocktail, it is best to visit their website or call the clinic directly.`
        }
      }
    ]
  } : null;

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalBusinessJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      
      {/* MAGAZINE HERO — claimed listings only. Edge-to-edge cover photo with the
          clinic logo as a small inset avatar and the clinic name in display type.
          Solves the legacy "logo stretched across 384px" and "name wraps to 2 lines"
          issues at the same time. */}
      {/* Tier-split (2026-06-01): the magazine hero is the FREE-tier baseline experience.
          Any claimed clinic gets it. Paid (Featured) clinics still get all the premium
          extras (testimonials, schema, instant-book, top placement) below. */}
      {provider.is_claimed && (() => {
        // Deterministic gradient per clinic — feels unique without using stock photo.
        // 6 dark-base gradients with tinted accents; pick from slug hash.
        const HERO_GRADIENTS = [
          'from-slate-900 via-wellness-800 to-emerald-950',
          'from-slate-900 via-sky-800 to-cyan-950',
          'from-slate-900 via-violet-800 to-indigo-950',
          'from-slate-900 via-rose-800 to-pink-950',
          'from-slate-900 via-amber-800 to-orange-950',
          'from-slate-900 via-teal-800 to-cyan-950',
        ];
        let h = 0;
        const seed = provider.slug || provider.name;
        for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
        const gradient = HERO_GRADIENTS[Math.abs(h) % HERO_GRADIENTS.length];
        return (
        <section className={cn('relative w-full h-[60vh] min-h-[480px] overflow-hidden bg-gradient-to-br', gradient)}>
          {/* Decorative orbs for depth without stock photo */}
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-white/10 rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-black/30 rounded-full blur-[160px] pointer-events-none" />
          {/* Subtle dot grid texture */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950/60" />

          <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-12 md:pb-16">
            <div className="mb-6">
              <BreadcrumbNav
                items={[
                  { label: 'IV Therapy', href: '/search' },
                  { label: cityLabel, href: `/cities/${citySlug}` },
                  { label: provider.name }
                ]}
                className="!text-white/70 !mb-0"
                activeClassName="text-white"
              />
            </div>

            <div className="flex items-end gap-4 md:gap-6 mb-6">
              {/* Logo as inset avatar — white background, ring, contains object so logos display cleanly */}
              {provider.imageUrl && (
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-3xl bg-white p-2 md:p-3 shadow-2xl ring-1 ring-white/30 shrink-0 flex items-center justify-center">
                  <ResilientImage
                    src={provider.imageUrl}
                    fallbackSrc={DEFAULT_CLINIC_IMAGE}
                    alt={`${provider.name} logo`}
                    width={120}
                    height={120}
                    className="w-full h-full object-contain"
                    fill={false}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/95 text-white text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full mb-3 shadow-lg">
                  <CheckCircle2 size={11} /> Verified Clinic
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] text-balance">
                  {displayName}
                </h1>
              </div>
            </div>

            {/* Key facts row, overlaid on photo */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              {displayRating > 0 && displayReviewCount > 0 && (
                <div className="bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 shadow-md">
                  <Star size={13} fill="currentColor" className="text-amber-500" />
                  {displayRating} · {displayReviewCount} {ratingSource === 'testimonials' ? 'patient testimonials' : 'reviews'}
                </div>
              )}
              <div className="bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 shadow-md">
                <MapPin size={13} className="text-wellness-600" />
                {provider.city}, {stateCode}
              </div>
              <div className="bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 shadow-md">
                <span className={status.isOpen ? 'text-emerald-500' : 'text-amber-500'}>●</span>
                {status.isOpen ? 'Open now' : 'Closed'}
              </div>
              {provider.price_range && (
                <div className="bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 shadow-md">
                  <span className="text-wellness-600">$</span>
                  {provider.price_range}
                </div>
              )}
            </div>
          </div>
        </section>
        );
      })()}

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* BREADCRUMB — only show for unclaimed listings (claimed listings get the breadcrumb inside the hero) */}
        {!provider.is_claimed && (
          <div className="mb-12">
            <BreadcrumbNav
              items={[
                { label: 'IV Therapy', href: '/search' },
                { label: cityLabel, href: `/cities/${citySlug}` },
                { label: provider.name }
              ]}
            />
          </div>
        )}

        {/* Verified-and-claimed confirmation banner suppressed for claimed listings —
            the magazine hero above already shows the "Verified Clinic" pill prominently. */}
        {!provider.is_claimed && (
          <div className="mb-12 space-y-6">
            <ClaimListingTrigger
              provider={provider}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 px-8 rounded-3xl text-center font-black text-lg shadow-xl shadow-slate-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>⚠️ Is this your clinic? Claim it free in 2 minutes →</span>
            </ClaimListingTrigger>

            {/* "Missing from this listing" — applies social pressure on the clinic owner.
                Only renders for unclaimed listings. */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Missing from this listing</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 opacity-70">
                  <div className="text-2xl mb-2 grayscale">📸</div>
                  <div className="font-bold text-slate-700 text-sm mb-1">Custom photos &amp; clinic description</div>
                  <div className="text-xs text-slate-400 leading-relaxed">Showcase your space, staff, and what makes your protocol different.</div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 opacity-70">
                  <div className="text-2xl mb-2 grayscale">💉</div>
                  <div className="font-bold text-slate-700 text-sm mb-1">Drip menu with transparent pricing</div>
                  <div className="text-xs text-slate-400 leading-relaxed">List your Myers, NAD+, hangover, and add-ons with prices upfront.</div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 opacity-70">
                  <div className="text-2xl mb-2 grayscale">💬</div>
                  <div className="font-bold text-slate-700 text-sm mb-1">Verified responses to reviews</div>
                  <div className="text-xs text-slate-400 leading-relaxed">Reply to reviews and patients see you&apos;re engaged. Boosts trust.</div>
                </div>
              </div>
              <ClaimListingTrigger
                provider={provider}
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-wellness-600 hover:text-wellness-700"
              >
                <span>Add all of this when you claim →</span>
              </ClaimListingTrigger>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16">
          {/* LEFT COLUMN */}
          <div className="space-y-16">
            {/* HERO SECTION */}
            <section className="space-y-10">
              {/* H1 + key facts only render for UNCLAIMED listings — claimed
                  listings get the magazine hero above with the same content
                  in display type. */}
              {!provider.is_claimed && (
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight text-balance max-w-3xl">
                      {displayName}
                    </h1>

                    {/* KEY FACTS ROW */}
                    <div className="flex flex-wrap gap-2">
                      <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5">
                        <span>📍</span> {provider.city}, {stateCode}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* IN THEIR WORDS — editorial pull-quote from the owner's onboarding survey.
                  Only renders for claimed clinics that submitted a one-liner. */}
              {provider.is_featured && (profile?.one_liner || profile?.profile_data?.oneLiner) && (
                <section className="relative bg-gradient-to-br from-wellness-50 via-white to-emerald-50/50 rounded-[2.5rem] p-10 md:p-14 border border-wellness-100 overflow-hidden">
                  <div aria-hidden className="absolute top-2 left-6 text-[8rem] md:text-[10rem] font-black text-wellness-200/60 leading-none select-none pointer-events-none">&ldquo;</div>
                  <div className="relative">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-wellness-700 mb-6 ml-1">
                      In their words
                    </div>
                    <p className="text-2xl md:text-3xl lg:text-[2rem] font-medium text-slate-900 leading-snug italic max-w-3xl mb-8 tracking-tight">
                      {profile.one_liner || profile.profile_data.oneLiner}
                    </p>
                    {(() => {
                      // OperatorProfile type doesn't declare ownerName inside profile_data, but
                      // the actual DB row does carry it. Cast through unknown to access safely.
                      const pdAny = profile.profile_data as unknown as { ownerName?: string };
                      const ownerName = profile.owner_name || profile.ownerName || pdAny?.ownerName;
                      if (!ownerName) return null;
                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                            {ownerName.trim().charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900">— {ownerName}</div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                              Owner, {displayName}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </section>
              )}

              {/* TRUST & CREDENTIALS — the #1 trust signal patients want.
                  Verified WHO + credential checklist + safety badge for claimed
                  clinics; "not verified" warning + claim CTA for unclaimed. */}
              <ProviderCredentialBlock provider={provider} profile={profile} />

              {/* {CLINIC} AT A GLANCE — survey-driven facts as compact icon cards.
                  Only the cards with actual data render; nothing is faked. */}
              {provider.is_featured && profile?.profile_data && (() => {
                const pd = profile.profile_data;
                const items = [
                  pd.waitTime ? { icon: '🕒', label: 'Wait time', value: pd.waitTime } : null,
                  pd.environment ? { icon: '🏛', label: 'Environment', value: pd.environment } : null,
                  pd.administerType ? { icon: '👩‍⚕️', label: 'Administered by', value: pd.administerType } : null,
                  pd.primarySpecialty ? { icon: '💉', label: 'Specialty', value: pd.primarySpecialty } : null,
                  pd.mobileService === true ? { icon: '🚗', label: 'Mobile service', value: 'Available' } : null,
                  pd.walkInsWelcome === true ? { icon: '🚪', label: 'Walk-ins', value: 'Welcome' } : null,
                ].filter(Boolean) as { icon: string; label: string; value: string }[];
                if (items.length === 0) return null;
                return (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px flex-1 bg-slate-100" />
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                        {displayName} at a glance
                      </span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      {items.map((it) => (
                        <div key={it.label} className="bg-white border border-slate-100 hover:border-wellness-200 transition-colors rounded-2xl p-5 flex items-start gap-3 shadow-sm">
                          <div className="text-2xl leading-none shrink-0" aria-hidden>{it.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{it.label}</div>
                            <div className="text-sm font-black text-slate-900 leading-snug">{it.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()}

              {provider.is_claimed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(provider.price_range || provider.priceRange) && (
                    <div className="flex flex-col gap-4">
                      <div className="bg-white p-6 h-full rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                        <div className="text-slate-400 font-bold text-xs uppercase mb-1">Price Range</div>
                        <div className="text-xl font-black text-slate-900">{provider.price_range || provider.priceRange}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-4">
                    <div className="bg-white p-6 h-full rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                      <div className="text-slate-400 font-bold text-xs uppercase mb-1">Availability</div>
                      <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className={status.isOpen ? "text-emerald-500" : "text-amber-500"}>●</span>
                        {status.isOpen ? 'Open Now' : 'Closed'}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {provider.phone && (
                      <a
                        href={`tel:${provider.phone}`}
                        className="flex items-center justify-center gap-3 bg-wellness-600 text-white px-8 py-5 rounded-[2rem] font-black text-xl hover:bg-wellness-700 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                      >
                        📞 Call Now
                      </a>
                    )}
                    {provider.website && (
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 bg-wellness-600 text-white px-8 py-5 rounded-[2rem] font-black text-xl hover:bg-wellness-700 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                      >
                        🌐 Visit Website
                      </a>
                    )}
                  </div>
                </div>
              )}

                {/* Secondary city row only renders for unclaimed listings.
                    Claimed listings get the city in the magazine hero badge row. */}
                {!provider.is_claimed && (
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-base font-bold text-slate-500 mb-8">
                    <div className="flex items-center gap-2">
                      <MapPin size={20} className="text-wellness-600" />
                      {provider.city}, {stateCode}
                    </div>
                  </div>
                )}

                {/* PHONE + WEBSITE ROW — only for unclaimed listings.
                    Claimed listings use the contact card above (gated on is_claimed). */}
                {!provider.is_claimed && (provider.phone || provider.website) && (
                  <div className="flex flex-wrap gap-4 mb-8">
                    {provider.phone && (
                      provider.is_featured ? (
                        <a 
                          href={`tel:${provider.phone}`}
                          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-lg"
                        >
                          📞 Call Now
                        </a>
                      ) : (
                        <a 
                          href={`tel:${provider.phone}`}
                          className="flex items-center gap-2 text-xl font-black text-slate-900 hover:text-wellness-600 transition-colors"
                        >
                          <span>📞</span> {provider.phone}
                        </a>
                      )
                    )}
                    {provider.website && (
                      provider.is_featured ? (
                        <a 
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-wellness-600 text-white px-6 py-3 rounded-2xl font-black text-lg hover:bg-wellness-700 transition-all shadow-lg"
                        >
                          🌐 Visit Website
                        </a>
                      ) : (
                        <a 
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xl font-black text-wellness-600 hover:underline"
                        >
                          <span>🌐</span> Visit Website →
                        </a>
                      )
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {status.isOpen && (
                    <span className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-emerald-100">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Open Now
                    </span>
                  )}
                  {isMobile && (
                    <span className="bg-wellness-50 text-wellness-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-wellness-100">
                      <Home size={14} /> Mobile IV
                    </span>
                  )}
                  {provider.walk_ins_welcome && (
                    <span className="bg-slate-50 text-slate-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-slate-100">
                      <User size={14} /> Walk-ins
                    </span>
                  )}
                  {/* Top Rated and Featured badges removed */}
                </div>
              </section>

            {/* ABOUT SECTION — review-derived summary only for verified listings */}
            {isVerified && (
              <SmartSummary reviews={provider.reviews_data || []} clinicName={displayName} />
            )}

            {provider.description && provider.description.length > 30 && (
              <section className="pt-8 border-t border-slate-100">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">About {provider.name}</h2>
                <div className="prose prose-slate max-w-none">
                  {/* One-liner pull-quote is now rendered in the "In Their Words" section
                      at the top of the page — not repeated here. */}
                  <p className="text-xl text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {provider.description}
                  </p>
                </div>
              </section>
            )}

            {/* SERVICES SECTION — restaurant-menu treatment for claimed listings,
                pill chips for unclaimed. */}
            {provider.specialties && provider.specialties.length > 0 && (
              <section className="pt-8 border-t border-slate-100">
                {provider.is_claimed ? (
                  (() => {
                    // Use real per-service prices from provider.services if populated.
                    // Never extrapolate a "from $150" floor from price_range tier — that
                    // shows the same fake price next to every drip and looks dishonest.
                    type ServiceItem = { name: string; price?: string | null; description?: string | null };
                    const realServices: ServiceItem[] = ((provider as { services?: ServiceItem[] }).services || [])
                      .filter((sv): sv is ServiceItem =>
                        !!sv && typeof sv.name === 'string' && !!sv.name &&
                        typeof sv.price === 'string' && !!sv.price &&
                        !/call|tbd|contact|inquire/i.test(sv.price)
                      );
                    const useStructured = realServices.length > 0;
                    const items: { name: string; price: string | null }[] = useStructured
                      ? realServices.map((sv) => ({
                          name: sv.name,
                          price: (sv.price || '').startsWith('$') ? (sv.price || '') : `$${sv.price}`,
                        }))
                      : [...new Set(provider.specialties)].map((s) => ({ name: s, price: null }));
                    return (
                      <>
                        <div className="flex items-end justify-between gap-4 mb-2">
                          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Drip Menu</h2>
                          {useStructured && (
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                              Pricing
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-8 max-w-2xl">
                          The treatments {provider.name} offers. Custom blends and add-ons available — call to discuss.
                        </p>

                        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                          {items.map((item, idx) => (
                            <div
                              key={item.name + idx}
                              className={cn(
                                'flex items-center gap-4 px-6 md:px-8 py-5 transition-colors hover:bg-slate-50',
                                idx < items.length - 1 && 'border-b border-slate-100'
                              )}
                            >
                              <div className="w-9 h-9 rounded-xl bg-wellness-50 text-wellness-600 flex items-center justify-center shrink-0">
                                <Droplets size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-black text-slate-900 text-base leading-tight">{item.name}</div>
                              </div>
                              {item.price && (
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">from</span>
                                  <div className="text-base font-black text-slate-900">{item.price}</div>
                                </div>
                              )}
                            </div>
                          ))}
                          {!useStructured && provider.phone && (
                            <div className="px-6 md:px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
                              <span className="text-sm font-bold text-slate-500">
                                Prices vary by treatment.{' '}
                                <a href={`tel:${provider.phone}`} className="text-wellness-700 hover:underline">
                                  Call {provider.name} for current pricing
                                </a>.
                              </span>
                            </div>
                          )}
                        </div>

                        {provider.phone && (
                          <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
                            <span className="font-bold">Custom protocol or add-on?</span>
                            <a
                              href={`tel:${provider.phone}`}
                              className="font-black text-wellness-600 hover:text-wellness-700 inline-flex items-center gap-1"
                            >
                              <Phone size={14} /> Call to discuss →
                            </a>
                          </div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <>
                    <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Services</h2>
                    <div className="flex flex-wrap gap-3">
                      {[...new Set(provider.specialties)].map((service, idx) => (
                        <span
                          key={idx}
                          className="px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm bg-white border border-slate-100 text-slate-700 hover:border-wellness-200 hover:text-wellness-600"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* PHOTOS GRID — up to 3 real photos for any claimed clinic (FREE tier).
                Applies the same stock-image filter as enrichProvider does for
                image_url, so any seed picsum/unsplash URLs are silently skipped. */}
            {provider.is_claimed && Array.isArray(provider.photos) && (() => {
              const realPhotos = (provider.photos as unknown[])
                .filter((p): p is string => typeof p === 'string' && p.length > 0)
                .filter((p) => !p.includes('picsum.photos') && !p.includes('unsplash.com'))
                .slice(0, 3);
              if (realPhotos.length === 0) return null;
              return (
                <section className="pt-8 border-t border-slate-100">
                  <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Photos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {realPhotos.map((photo, idx) => (
                      <div
                        key={photo + idx}
                        className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200"
                      >
                        <ResilientImage
                          src={photo}
                          fallbackSrc={DEFAULT_CLINIC_IMAGE}
                          alt={`${provider.name} photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* UNCLAIMED LISTING CARD / FEATURED BADGE */}
            {!provider.is_featured && !provider.is_claimed && (
              <section className="pt-8 border-t border-slate-100">
                <div className="bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 p-10">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">This listing is unclaimed</h3>
                  <p className="text-slate-500 font-bold mb-8 text-lg">Claim it free to add photos and update your clinic story</p>

                  <ClaimListingTrigger
                    provider={provider}
                    className="inline-flex items-center gap-2 bg-wellness-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-wellness-700 transition-all shadow-lg"
                  >
                    Claim This Listing Free <ArrowRight size={20} />
                  </ClaimListingTrigger>

                  <p className="mt-6 text-sm text-slate-500 font-medium">
                    Want to see how your clinic ranks on Google?{' '}
                    <Link href="/tools/seo-audit" className="text-wellness-700 font-bold hover:underline">
                      Run a free SEO audit →
                    </Link>
                  </p>
                </div>
              </section>
            )}

            {provider.is_claimed && (
              <section className="pt-8 border-t border-slate-100">
                <div className="bg-emerald-50 rounded-[2.5rem] border border-emerald-100 p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-emerald-900">Verified & Claimed</h4>
                      <p className="text-emerald-700 font-bold">This provider has verified their credentials and manages this profile.</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* QUICK FACTS GRID — only for unclaimed listings. Claimed listings
                surface the same info inside their richer rendering above. */}
            {!provider.is_claimed && (() => {
              const hasFacts = (provider.price_range || provider.priceRange) || 
                               isMobile || 
                               provider.walk_ins_welcome || 
                               (provider.amenities && provider.amenities.length > 0) ||
                               (provider.subtypes && provider.subtypes.length > 0);
              
              if (!hasFacts) return null;
              
              const priceDisplay = provider.price_range || provider.priceRange || '$$';
              
              return (
                <section className="pt-8 border-t border-slate-100">
                  <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Clinic details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {priceDisplay && (
                      <DetailCard 
                        label="Price Range" 
                        value={`${priceDisplay} (${valueMetrics.label})`} 
                        icon={<Zap size={24} />} 
                      />
                    )}
                    {isMobile && (
                      <DetailCard label="Mobile Service" value="Comes to your location" icon={<Home size={24} />} />
                    )}
                    {provider.walk_ins_welcome && (
                      <DetailCard label="Walk-ins Welcome" value="No appointment needed" icon={<User size={24} />} />
                    )}
                    {provider.amenities && provider.amenities.length > 0 && (
                      <DetailCard 
                        label="Amenities" 
                        value={provider.amenities.slice(0, 2).join(', ')} 
                        icon={<Building2 size={24} />} 
                      />
                    )}
                    {provider.subtypes && provider.subtypes.length > 0 && (
                      <DetailCard 
                        label="Focus" 
                        value={provider.subtypes.slice(0, 2).join(', ')} 
                        icon={<Activity size={24} />} 
                      />
                    )}
                  </div>
                </section>
              );
            })()}

            {/* HOURS SECTION — simple stacked variant, unclaimed only.
                Claimed listings get the side-by-side hours + map variant below. */}
            {!provider.is_claimed && provider.hours && Object.keys(provider.hours).length > 0 && (
              <section id="hours" className="pt-8 border-t border-slate-100">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Hours</h2>
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const dayKey = day.toLowerCase();
                        const hours = provider.hours?.[dayKey] || 'Closed';
                        const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                        const isClosed = hours.toLowerCase() === 'closed';
                        
                        return (
                          <tr key={day} className={cn(
                            "border-b border-slate-50 last:border-0",
                            isToday && "bg-wellness-50/50 border-l-4 border-l-wellness-600"
                          )}>
                            <td className={cn("px-8 py-5 font-bold", isToday ? "text-wellness-900" : "text-slate-700")}>{day}</td>
                            <td className={cn(
                              "px-8 py-5 font-bold text-right",
                              isClosed ? "text-slate-300" : (isToday ? "text-wellness-700" : "text-slate-600")
                            )}>{hours}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* HOURS AND LOCATION - SIDE BY SIDE for any claimed clinic
                (free or featured). Premium presentation, but it's a free benefit
                of the basic claim, not gated on Featured. */}
            {provider.is_claimed && (
              <section id="location-hours" className="pt-16 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  {/* HOURS */}
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Clinic Hours</h2>
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <tbody>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                            const dayKey = day.toLowerCase();
                            const hours = provider.hours?.[dayKey] || 'Closed';
                            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                            const isClosed = hours.toLowerCase() === 'closed';
                            
                            return (
                              <tr key={day} className={cn(
                                "border-b border-slate-50 last:border-0",
                                isToday && "bg-wellness-50/50 border-l-4 border-l-wellness-600"
                              )}>
                                <td className={cn("px-6 py-4 font-bold text-sm", isToday ? "text-wellness-900" : "text-slate-700")}>{day}</td>
                                <td className={cn(
                                  "px-6 py-4 font-bold text-sm text-right",
                                  isClosed ? "text-slate-300" : (isToday ? "text-wellness-700" : "text-slate-600")
                                )}>{hours}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* LOCATION */}
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Location</h2>
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-wellness-100 text-wellness-600 flex items-center justify-center">
                            <MapPin size={24} />
                          </div>
                          <div>
                            <div className="text-slate-400 font-bold text-xs uppercase">Clinic Address</div>
                            <div className="text-xl font-black text-slate-900">{provider.address}</div>
                            <div className="text-slate-600 font-bold">{provider.city}, {stateCode}</div>
                          </div>
                        </div>
                        {provider.latitude && provider.longitude && (
                          <div className="h-48 rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 relative">
                            {process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? (
                              <ResilientImage
                                src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+3b82f6(${provider.longitude},${provider.latitude})/${provider.longitude},${provider.latitude},14,0/600x300@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`}
                                alt="Clinic map location"
                                fill
                                className="object-cover"
                                fallbackSrc="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/map-placeholder.png"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">
                                Map preview unavailable
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* REVIEWS SECTION — verified/claimed listings only */}
            {isVerified && provider.reviews_data && provider.reviews_data.length > 0 && (
              <section id="reviews" className="pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Patient Reviews 
                    <span className="text-wellness-600 text-lg">({provider.reviewCount})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {provider.reviews_data.slice(0, 4).map((review, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-wellness-50 flex items-center justify-center font-bold text-wellness-600">
                          {review.author[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{review.author}</div>
                          <div className="flex items-center gap-1 text-amber-500 text-xs">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />
                            ))}
                            <span className="text-slate-400 ml-1">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed italic">
                        &quot;{review.text}&quot;
                      </p>
                    </div>
                  ))}
                </div>
                {provider.reviews_data.length > 4 && (
                  <div className="mt-8 text-center">
                    <p className="text-sm text-slate-400 font-bold italic mb-4">Viewing recent patient feedback</p>
                  </div>
                )}
              </section>
            )}

            {/* PATIENT TESTIMONIALS — claimed clinics only */}
            {provider.is_featured && (
              <PatientTestimonials provider={provider} testimonials={patientTestimonials} />
            )}

            {/* FAQ SECTION */}
            <section id="faq" className="pt-8 border-t border-slate-100">
              <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {[
                  {
                    q: `What services does ${provider.name} offer?`,
                    a: `${provider.name} in ${provider.city} specializes in ${provider.specialties?.slice(0, 3).join(', ')} and other IV wellness treatments designed for rapid recovery and cellular health.`
                  },
                  {
                    q: `How long does an appointment take?`,
                    a: `Most IV treatments take between 45 to 60 minutes depending on the protocol. Specialized infusions like NAD+ may require up to 2-4 hours for cellular absorption.`
                  },
                  {
                    q: `Is mobile IV therapy available?`,
                    a: isMobile 
                      ? `Yes! ${provider.name} is a mobile provider and will come directly to your home, office, or hotel in the ${provider.city} area.`
                      : `Currently, ${provider.name} provides clinical treatments at their facility in ${provider.city}. For mobile options, check our "Mobile IV" filter on the search page.`
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-4">{item.q}</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* WHO THIS CLINIC IS BEST FOR */}
            {profile?.profile_data && (
              <section className="pt-8 border-t border-slate-100">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Who this clinic is best for</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {profile.profile_data.primarySpecialty && (
                    <BestForCard 
                      icon={<Activity size={28} />} 
                      label="Best for" 
                      value={profile.profile_data.primarySpecialty} 
                    />
                  )}
                  {profile.profile_data.environment && (
                    <BestForCard 
                      icon={<Building2 size={28} />} 
                      label="Environment" 
                      value={profile.profile_data.environment} 
                    />
                  )}
                  {profile.profile_data.priceRange && (
                    <BestForCard 
                      icon={<Zap size={28} />} 
                      label="Typical budget" 
                      value={profile.profile_data.priceRange} 
                    />
                  )}
                </div>
              </section>
            )}

            {/* SIMILAR CLINICS */}
            {similarClinics.length > 0 && (
              <section className="pt-8 border-t border-slate-100">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">{similarTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {similarClinics.map((clinic) => {
                    const cDisplayName = clinic.name
                      .split(' | ')[0]
                      .split(' - IV')[0]
                      .split(' - Drip')[0]
                      .trim();
                    const cStateCode = clinic.state || getStateFromProvider(clinic);
                    const cInitials = getInitials(clinic.name, clinic.city, allListings);
                    const cSlug = clinic.slug || slugify(clinic.name);
                    
                    return (
                      <Link 
                        key={clinic.id} 
                        href={`/providers/${cSlug}`}
                        className="bg-white rounded-[2rem] border border-slate-100 p-6 hover:shadow-xl transition-all group flex flex-col h-full"
                      >
                        <div className="relative h-40 rounded-2xl overflow-hidden mb-6">
                          {clinic.is_claimed ? (
                            <ClinicImage
                              name={clinic.name}
                              initials={cInitials}
                              imageUrl={clinic.imageUrl || clinic.image_url}
                              className="group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 font-black text-4xl select-none group-hover:scale-105 transition-transform duration-500">
                              {cInitials}
                            </div>
                          )}
                        </div>
                        <h4 className="font-black text-slate-900 mb-2 line-clamp-1">{cDisplayName}</h4>
                        {clinic.is_featured && clinic.rating > 0 && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="flex items-center text-wellness-600">
                              <Star size={12} fill="currentColor" />
                            </div>
                            <span className="text-xs font-black text-slate-900">{clinic.rating}</span>
                            <span className="text-xs font-bold text-slate-400">· {clinic.reviewCount} reviews</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mb-4">
                          <MapPin size={12} className="text-wellness-600" />
                          {clinic.city}, {cStateCode}
                        </div>
                        
                        {clinic.specialties && clinic.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {clinic.specialties.slice(0, 2).map((s: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[10px] font-bold">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-wellness-600 font-black text-xs flex items-center gap-1">
                            View Profile <ArrowRight size={14} />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* UPGRADE CTA — FREE-tier (claimed but not Featured) only. Activated
                2026-06-01 as part of the tier-split: claim now flips is_claimed
                only, so this branch is real production code, not dead. */}
            {provider.is_claimed && !provider.is_featured && (
              <section className="bg-slate-900 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl mt-16">
                <div className="absolute top-0 right-0 w-96 h-96 bg-wellness-600/20 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">Unlock Your Clinic&apos;s Full Potential</h2>
                  <p className="text-xl opacity-80 mb-10 max-w-xl mx-auto font-medium leading-relaxed">
                    Your free listing covers the basics. Upgrade to Featured for top placement on city + treatment pages, full photo gallery, patient testimonials, and instant-book CTAs.
                  </p>
                  <Link
                    href="/for-clinics/upgrade"
                    className="inline-flex items-center gap-3 bg-wellness-600 text-white px-12 py-6 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl"
                  >
                    View Upgrade Options <ArrowRight size={24} />
                  </Link>
                </div>
              </section>
            )}

            {/* QUIZ CTA */}
            <section className="bg-wellness-700 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-wellness-200">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">Not sure if {provider.name} is right for you?</h2>
                <p className="text-xl opacity-90 mb-10 max-w-xl mx-auto font-medium leading-relaxed">
                  Answer 5 quick questions and get matched to the best IV therapy clinic for your specific goals.
                </p>
                <Link 
                  href="/quiz"
                  className="inline-flex items-center gap-3 bg-white text-wellness-700 px-12 py-6 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl"
                >
                  Take the Free Quiz <ArrowRight size={24} />
                </Link>
              </div>
            </section>

            {/* MEDICAL DISCLAIMER */}
            <div className="pt-12 border-t border-slate-100">
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                TheDripMap is an independent directory and matching service. Always verify credentials directly with the provider before booking any treatment.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN — sticky booking/contact card */}
          <aside>
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
                {/* CARD HEADER — small logo + clinic name (visible after user scrolls past hero)
                    Available to all claimed listings as part of the FREE-tier basics. */}
                {provider.is_claimed && (
                  <div className="bg-gradient-to-br from-slate-50 to-white px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                    {provider.imageUrl && (
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 p-1.5 shrink-0 flex items-center justify-center">
                        <ResilientImage
                          src={provider.imageUrl}
                          fallbackSrc={DEFAULT_CLINIC_IMAGE}
                          alt={`${provider.name} logo`}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain"
                          fill={false}
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-slate-900 text-sm truncate">{provider.name}</div>
                      <div className="text-[11px] text-slate-500 font-bold truncate">{provider.city}, {stateCode}</div>
                    </div>
                  </div>
                )}

                <div className="px-6 py-6 space-y-6">
                  {/* STATUS — friendlier than the old "OPEN NOW · 10AM-8PM" stacked block */}
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-2.5 h-2.5 rounded-full shrink-0 ring-4',
                      status.isOpen ? 'bg-emerald-500 ring-emerald-100' : 'bg-amber-500 ring-amber-100'
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className={cn(
                        'text-xs font-black uppercase tracking-widest',
                        status.isOpen ? 'text-emerald-600' : 'text-amber-600'
                      )}>
                        {status.isOpen ? 'Open now' : 'Currently closed'}
                      </div>
                      <div className="text-sm font-bold text-slate-900">{status.todayHours}</div>
                    </div>
                  </div>

                  {/* PRIMARY ACTIONS — Book is the conversion CTA */}
                  <div className="space-y-3">
                    {provider.website && (
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-wellness-600 text-white px-6 py-4 rounded-2xl font-black text-base hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-200/50 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                      >
                        Book Appointment <ExternalLink size={18} />
                      </a>
                    )}
                    {provider.phone && (
                      <a
                        href={`tel:${provider.phone}`}
                        className="w-full bg-white border-2 border-slate-200 text-slate-900 px-6 py-4 rounded-2xl font-black text-base hover:border-slate-900 transition-all flex items-center justify-center gap-2"
                      >
                        <Phone size={18} /> Call Clinic
                      </a>
                    )}
                    <MessageClinicButton provider={provider} variant="secondary" />
                  </div>

                  {/* ADDRESS + DIRECTIONS — clickable to open in maps */}
                  {provider.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${provider.address} ${provider.city} ${stateCode}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 pt-4 border-t border-slate-100 hover:text-wellness-600 transition-colors"
                    >
                      <MapPin size={18} className="text-wellness-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-700 leading-relaxed group-hover:text-wellness-700">
                          {provider.address}
                        </div>
                        <div className="text-[11px] font-black text-wellness-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                          Get directions <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </a>
                  )}

                  {/* RATING — quick credibility anchor */}
                  {provider.is_featured && displayRating > 0 && displayReviewCount > 0 && (
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star size={14} fill="currentColor" className="text-amber-500" />
                        <span className="text-sm font-black text-slate-900">{displayRating}</span>
                        <span className="text-xs text-slate-500 font-bold">
                          ({displayReviewCount}{' '}
                          {ratingSource === 'testimonials' ? 'patient testimonials' : 'reviews'})
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        ✓ Verified
                      </span>
                    </div>
                  )}

                  {/* UNCLAIMED CTA — sidebar variant — only for unclaimed listings. */}
                  {!provider.is_claimed && (
                    <div className="pt-4 border-t border-slate-100">
                      <ClaimListingTrigger
                        provider={provider}
                        className="text-xs font-black text-wellness-600 hover:underline flex items-center gap-1"
                      >
                        <span>Own this clinic? Claim your free listing →</span>
                      </ClaimListingTrigger>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Persistent claim CTA — desktop floating card + mobile bottom sheet. Unclaimed only. */}
      {!provider.is_claimed && <StickyClaimRail provider={provider} />}

      {/* Auto-open claim modal when URL has ?claim=1 (outreach email link). Unclaimed only.
          Wrapped in Suspense because ClaimAutoOpener uses useSearchParams() —
          Next.js requires that to be Suspense-bounded for static prerender to succeed. */}
      {!provider.is_claimed && (
        <Suspense fallback={null}>
          <ClaimAutoOpener provider={provider} />
        </Suspense>
      )}

      <Footer />
    </div>
  );
}

function DetailCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 flex items-center gap-6 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-wellness-600">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</div>
        <div className="font-black text-slate-900 text-lg">{value}</div>
      </div>
    </div>
  );
}

function BestForCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 text-center shadow-sm">
      <div className="w-20 h-20 rounded-3xl bg-wellness-50 flex items-center justify-center text-wellness-600 mx-auto mb-6">
        {icon}
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{label}</div>
      <div className="font-black text-slate-900 text-xl">{value}</div>
    </div>
  );
}

