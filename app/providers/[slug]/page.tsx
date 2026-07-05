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
import { isNoindexedUSPage, marketOf } from '../../../src/lib/market';
import { ClinicImage } from '../../../src/components/ClinicImage';
import { ResilientImage } from '../../../src/components/ResilientImage';
import { ClaimListingTrigger } from '../../../src/components/ClaimListingTrigger';
import { StickyClaimRail } from '../../../src/components/StickyClaimRail';
import { MessageClinicButton } from '../../../src/components/MessageClinicButton';
import { PatientTestimonials } from '../../../src/components/PatientTestimonials';
import { ClaimAutoOpener } from '../../../src/components/ClaimAutoOpener';
import { TreatmentDefinitionDisclosure } from '../../../src/components/TreatmentDefinitionDisclosure';
import { findDefinition } from '../../../src/lib/treatment-definitions';
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
import { getCityPriceIndex } from '../../../src/lib/price-index-data';
import DefinitiveListingLayout from '../../../src/components/DefinitiveListingLayout';
import { OpenStatus } from '../../../src/components/OpenStatus';
import ListingAnalytics from '../../../src/components/ListingAnalytics';
import TrackedLink from '../../../src/components/TrackedLink';

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

  // Canonical URL is built from the URL slug as a final fallback so we ALWAYS
  // emit one, even when Supabase is unreachable or the provider row is null.
  // Search Console's duplicate-canonical flag and the "missing canonical" flag
  // both stem from variants of this metadata function returning early.
  const safeSlug = slug || 'unknown';
  const fallbackCanonical = `https://www.thedripmap.com/providers/${safeSlug}`;
  const fallbackTitleFromSlug = safeSlug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  let provider: Awaited<ReturnType<typeof getListingBySlug>> = null;
  try {
    provider = await getListingBySlug(slug);
  } catch (err) {
    if (err instanceof SupabaseUnreachableError) {
      // Soft fallback so a transient Supabase outage doesn't ship a "not found"
      // title into Google's cache. Page renders TemporarilyUnavailable below.
      // Canonical and a generic description still emitted so the page is never
      // tagless even mid-outage.
      return {
        title: `${fallbackTitleFromSlug} | IV Therapy Clinic | TheDripMap`,
        description: `Find ${fallbackTitleFromSlug} and other IV therapy clinics on TheDripMap. Compare prices, read reviews, and book your drip session today.`,
        alternates: { canonical: fallbackCanonical },
      };
    }
    throw err;
  }

  // If the slug doesn't resolve to a provider, fall through to a tagged
  // "not found" rather than calling notFound() here — Next still 404s the
  // page render, but at least the metadata never goes out empty if the
  // fuzzy-resolver returns null between cache rebuilds.
  if (!provider) {
    return {
      title: `IV Therapy Clinic Not Found | TheDripMap`,
      description: `We couldn't find that clinic on TheDripMap. Browse all clinics of IV therapy providers near you.`,
      alternates: { canonical: fallbackCanonical },
      robots: { index: false, follow: true },
    };
  }
  if (provider.availability === false) {
    notFound();
  }

  // Safe field extraction — every downstream string MUST tolerate missing
  // data. After enrichProvider() the fields default to sane values, but we
  // belt-and-suspenders here because the bella-excellence-tampa-tampa stub
  // (description=null, specialties=null, rating=null) is the canonical
  // proof that partial rows reach this function.
  const providerName = (provider.name || '').trim() || fallbackTitleFromSlug || 'IV Therapy Clinic';
  const displayName = providerName
    .split(' | ')[0]
    .split(' - IV')[0]
    .split(' - Drip')[0]
    .trim() || 'IV Therapy Clinic';
  const cityLabel = (provider.city && String(provider.city).trim()) || 'the US or Canada';

  const specialtyList = Array.isArray(provider.specialties)
    ? provider.specialties.filter((s): s is string => typeof s === 'string' && s.length > 0)
    : [];
  const topSpecialties = specialtyList.slice(0, 3).join(', ') || 'hydration, NAD+, immune support';

  // Canonicalize to the provider's TRUE slug, not the requested URL slug.
  // getListingBySlug() fuzzy-matches, so several URL variants can resolve to
  // the same provider. Pointing every variant's canonical at the one true
  // slug is what tells Google they're the same page (fixes duplicate-canonical
  // flags in Search Console).
  const canonicalSlug = provider.slug || slugify(providerName) || safeSlug;
  const canonicalUrl = `https://www.thedripmap.com/providers/${canonicalSlug}`;

  // Title: "<Name> | IV Therapy in <City> | TheDripMap" — region dropped
  // 2026-06-15 so titles stay near/under 60 chars (78% previously exceeded 65
  // once the full state name was appended). Pipe separators, no em-dash.
  const title = `${displayName} | IV Therapy in ${cityLabel} | TheDripMap`;
  // Descriptions clamp to <=155 chars (98% previously exceeded 165 and were
  // truncated by Google). Written short, then hard-cut at a word boundary.
  const clampDesc = (str: string, max = 155): string =>
    str.length <= max ? str : `${str.slice(0, max).replace(/\s+\S*$/, '').trim()}…`;
  const description = provider.is_featured && Number(provider.reviewCount) > 0
    ? clampDesc(`${displayName} in ${cityLabel}: ${provider.rating} stars from ${provider.reviewCount} reviews. IV drips include ${topSpecialties}. Book on TheDripMap.`)
    : clampDesc(`${displayName} in ${cityLabel}. IV drips include ${topSpecialties}. Compare prices and book your session on TheDripMap.`);

  // Orphan-claim stubs are placeholders created when a setup-form submission
  // doesn't match any existing listing. They have no real content until the
  // owner verifies the claim. Keep them out of Google's index until then.
  // Matches the same filter used by app/sitemap.ts so the two stay in sync.
  const dd = (provider as { decision_drivers?: { source?: string } | null }).decision_drivers;
  const isOrphanStub = dd?.source === 'orphan_claim_stub' && provider.is_claimed !== true;

  // US market off: noindex US provider pages. Reversible via US_MARKET_ENABLED;
  // Canadian providers are never affected (country=Canada => not US).
  const usNoindex = isNoindexedUSPage({ country: provider.country, state: provider.state });

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: (isOrphanStub || usNoindex)
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
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
          alt: providerName,
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

  // Platform-wide safety verification. The badge gates on the providers
  // .safety_verified column (added 2026-06-08) — a single operator-flipped
  // boolean. Claimed is NOT enough; safety_verified is the explicit, separate
  // attestation. The 5 sub-attestation breakdown below is kept for the
  // transparency UI (so visitors see which specific checks were attested),
  // but the badge itself fires only on the column.
  const SAFETY_CHECKS = [
    { key: 'verifiedMedicalDirector',     label: 'Licensed medical director', detail: 'A board-licensed physician or nurse practitioner oversees protocols and patient care.' },
    { key: 'verifiedClinician',           label: 'Licensed clinical staff',   detail: 'IVs and injections are administered by RNs, NPs, or physicians, never unlicensed staff.' },
    { key: 'verifiedCompoundingPharmacy', label: 'Pharmaceutical-grade IVs',  detail: 'Ingredients are sourced from a licensed compounding pharmacy and prepared under sterile conditions.' },
    { key: 'verifiedLiabilityInsurance',  label: 'Liability insurance',       detail: 'Active medical liability coverage for IV therapy and adjacent treatments.' },
    { key: 'verifiedStateBoard',          label: 'State / provincial board',  detail: 'Operating in good standing with the relevant medical or nursing regulator.' },
  ] as const;
  const profileData = (profile?.profile_data || {}) as Record<string, unknown>;
  // Some claimed clinics don't fit the default physician/NP framing (e.g. an
  // ND-led naturopathic clinic). When the operator profile records who actually
  // administers IVs or provides oversight, render THAT verbatim instead of the
  // generic physician/NP copy, so the Safety Verified block never overstates the
  // clinical model. Falls back to the generic detail when no context is present.
  const administerType = typeof profileData.administerType === 'string' ? profileData.administerType.trim() : '';
  const medicalDirectorName = typeof profileData.medicalDirectorName === 'string' ? profileData.medicalDirectorName.trim() : '';
  const safetyResults = SAFETY_CHECKS.map(c => {
    let detail: string = c.detail;
    if (c.key === 'verifiedClinician' && administerType) {
      detail = `Administered by ${administerType}. IVs and injections are never handled by unlicensed staff.`;
    } else if (c.key === 'verifiedMedicalDirector' && medicalDirectorName) {
      detail = `${medicalDirectorName} provides medical oversight of protocols and patient care.`;
    }
    return { ...c, detail, passed: profileData[c.key] === true };
  });
  const safetyVerifiedCount = safetyResults.filter(c => c.passed).length;
  const safetyVerified = (provider as { safety_verified?: boolean }).safety_verified === true;
  const stateCode = provider.state || getStateFromProvider(provider);
  const timezone = TIMEZONE_MAP[stateCode] || 'America/Toronto';
  const stateName = STATE_MAP[stateCode] || stateCode;
  const citySlug = slugify(provider.city);
  // City price context from the IV Price Index. Lights up only for cities we
  // actually cover, so a listing with no prices of its own still shows real,
  // city-wide ranges and links to the citable index.
  const cityPrices = getCityPriceIndex(citySlug);
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
  // Show the clinic's real Google rating on EVERY listing. The 2026-06 ratings
  // backfill populated rating + review count for ~96% of Canadian clinics, so a
  // bare page now shows a credible star rating (CTR + trust). Blended with any
  // first-party TheDripMap testimonials for the visible display.
  const googleRating = Number(provider.rating) || 0;
  const googleCount = Number(provider.reviewCount) || 0;
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
  // Structured-data rating is intentionally NARROWER than the visible rating.
  // We only assert AggregateRating from a first-party basis — TheDripMap patient
  // testimonials, plus Google ratings ONLY for featured/claimed clinics (the
  // prior behaviour). We deliberately do NOT mark up scraped third-party (Google)
  // ratings across every unclaimed listing: Google's guidelines disallow marking
  // up ratings aggregated from other sources, and a site-wide review-snippet
  // manual action would undo the SEO we're building. The real Google rating still
  // shows visibly on the page — it just isn't claimed as our structured data.
  const schemaGoogleCount = isVerified ? googleCount : 0;
  const schemaGoogleRating = isVerified ? googleRating : 0;
  const schemaCount = schemaGoogleCount + testimonialCount;
  const schemaRating = schemaCount > 0
    ? Number(((schemaGoogleRating * schemaGoogleCount + testimonialRatingSum) / schemaCount).toFixed(1))
    : 0;

  const isCityMatch = similarClinics.every(c => c.city === provider.city);
  const similarTitle = isCityMatch && similarClinics.length >= 3 
    ? `Other IV therapy clinics in ${provider.city}` 
    : `Other IV therapy clinics in ${stateName}`;

  // Only emit optional schema props when we actually have a value — Google
  // prefers omitted keys over null/empty ones, and an empty GeoCoordinates or a
  // misspelled property is silently dropped (or flags the item as invalid).
  // NOTE: the property is "telephone" (was "telePhone" — a typo Google ignored,
  // so no provider's phone was ever valid in structured data until this fix).
  const hasGeo = provider.latitude != null && provider.longitude != null;
  const medicalBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "MedicalBusiness"],
    "name": provider.name,
    ...(provider.description ? { "description": provider.description } : {}),
    ...(provider.imageUrl ? { "image": provider.imageUrl } : {}),
    ...(provider.phone ? { "telephone": provider.phone } : {}),
    "url": `https://www.thedripmap.com/providers/${slug}`,
    "address": {
      "@type": "PostalAddress",
      ...(provider.address ? { "streetAddress": provider.address } : {}),
      "addressLocality": provider.city,
      "addressRegion": stateCode,
      ...(provider.postal_code ? { "postalCode": provider.postal_code } : {}),
      // marketOf understands province fallback (ON/BC/AB...) and only returns
      // "US" when confidently US, so a Canadian clinic with a blank/abbreviated
      // country is tagged "CA", not mislabelled "US", in its schema.
      "addressCountry": marketOf({ country: (provider as { country?: string }).country, state: provider.state }) === 'US' ? "US" : "CA"
    },
    ...(hasGeo ? {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": provider.latitude,
        "longitude": provider.longitude
      }
    } : {}),
    "aggregateRating": schemaCount > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": schemaRating,
      "reviewCount": schemaCount
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
          "text": `Pricing at ${provider.name} is classified as ${provider.price_range || 'competitive'}.${cityPrices ? ` Across ${provider.city} clinics with published menus, a standard IV vitamin drip runs a median of $${cityPrices.headline.median}.` : ''} For exact pricing on specific drips like NAD+ or Myers' Cocktail, it is best to visit their website or call the clinic directly.`
        }
      }
    ]
  } : null;

  // BreadcrumbList JSON-LD for every provider page (claimed or not). Mirrors
  // the visible <BreadcrumbNav> shown in both render branches.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.thedripmap.com/" },
      { "@type": "ListItem", "position": 2, "name": "Cities", "item": "https://www.thedripmap.com/cities" },
      { "@type": "ListItem", "position": 3, "name": cityLabel, "item": `https://www.thedripmap.com/cities/${citySlug}` },
      { "@type": "ListItem", "position": 4, "name": displayName, "item": `https://www.thedripmap.com/providers/${provider.slug || slugify(provider.name)}` },
    ]
  };

  // ─────────────────────────────────────────────────────────────
  // CLAIMED LISTINGS: render the new editorial template (DefinitiveListingLayout).
  // Unclaimed listings continue to use the legacy render path below.
  // ─────────────────────────────────────────────────────────────
  if (provider.is_claimed) {
    return (
      <div className="min-h-screen bg-[#f8f5ee]">
        <Navbar />
        {/* ClaimAutoOpener intentionally omitted on the claimed branch — it
            uses useSearchParams() and would need a Suspense boundary, and
            a claimed clinic has no claim modal to auto-open anyway. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalBusinessJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        {faqJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        )}
        {/* Fires a single 'view' analytics event per session. See
            ListingAnalytics for the 30-min sessionStorage dedupe. */}
        <ListingAnalytics providerId={provider.id} />
        <DefinitiveListingLayout
          provider={provider}
          profile={profile}
          safetyResults={safetyResults.map(r => ({ key: r.key, label: r.label, detail: r.detail, passed: r.passed }))}
          safetyVerified={safetyVerified}
          status={status}
          timezone={timezone}
          displayName={displayName}
          displayRating={displayRating}
          displayReviewCount={displayReviewCount}
          stateCode={stateCode}
          cityLabel={cityLabel}
          initials={initials}
          similarClinics={similarClinics.map(c => ({
            name: c.name,
            slug: c.slug || '',
            city: c.city,
            state: c.state,
            specialties: c.specialties || [],
          }))}
          citySlug={citySlug}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      {/* First-party 'view' capture. Fires once per provider per session
          (30-minute TTL) for both claimed and unclaimed listings so we
          can power profile insights without a third-party pixel. */}
      <ListingAnalytics providerId={provider.id} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/95 text-white text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full shadow-lg">
                    <CheckCircle2 size={11} /> Verified Clinic
                  </div>
                  {safetyVerified && (
                    <a href="#safety-verified" className="inline-flex items-center gap-1.5 bg-sky-500/95 hover:bg-sky-400 text-white text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full shadow-lg transition-colors" title="Operator confirmed all 5 safety criteria — tap to see the breakdown.">
                      <CheckCircle2 size={11} /> Safety Verified · 5/5
                    </a>
                  )}
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
                  {displayRating} · {displayReviewCount} {ratingSource === 'testimonials' ? 'patient testimonials' : ratingSource === 'google' ? 'Google reviews' : 'reviews'}
                </div>
              )}
              <div className="bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 shadow-md">
                <MapPin size={13} className="text-wellness-600" />
                {provider.city}, {stateCode}
              </div>
              <div className="bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 shadow-md">
                <span className={status.isOpen ? 'text-emerald-500' : 'text-amber-500'}>●</span>
                {status.isOpen ? 'Open now' : status.known ? 'Closed' : 'Hours not listed'}
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

        {/* Typical city prices from the IV Price Index. Fills the gap for the
            many listings without their own published prices, and cross-links the
            citable index. Renders only for cities we cover; city-wide menus,
            clearly labelled as not necessarily this clinic's own prices. */}
        {cityPrices && (
          <div className="mb-12 rounded-3xl border border-wellness-100 bg-wellness-50/60 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-700">Typical IV prices in {cityPrices.city}</span>
              <div className="h-px flex-1 bg-wellness-100" />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              Across {cityPrices.clinicCount} {cityPrices.city} clinics with published menus, a standard IV vitamin drip runs a median of <b className="text-slate-900">${cityPrices.headline.median}</b> (about ${cityPrices.headline.low} to ${cityPrices.headline.high}). These are city-wide published prices, not necessarily {provider.name}&apos;s own — confirm directly with the clinic.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {cityPrices.rows.slice(0, 6).map((r) => (
                <div key={r.treatment} className="bg-white rounded-2xl border border-slate-100 px-4 py-3">
                  <div className="text-[11px] font-bold text-slate-500 truncate">{r.treatment}</div>
                  <div className="text-lg font-black text-[#0F6E56]">${r.median}</div>
                </div>
              ))}
            </div>
            <Link href={`/iv-prices/${cityPrices.citySlug}`} className="inline-flex items-center gap-1.5 text-sm font-black text-[#0F6E56] hover:gap-2.5 transition-[gap]">
              See the full {cityPrices.city} IV price index →
            </Link>
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
                        {status.isOpen ? 'Open Now' : status.known ? 'Closed' : 'Hours not listed'}
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
                        <TrackedLink
                          providerId={provider.id}
                          eventType="call_click"
                          href={`tel:${provider.phone}`}
                          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-lg"
                        >
                          📞 Call Now
                        </TrackedLink>
                      ) : (
                        <TrackedLink
                          providerId={provider.id}
                          eventType="call_click"
                          href={`tel:${provider.phone}`}
                          className="flex items-center gap-2 text-xl font-black text-slate-900 hover:text-wellness-600 transition-colors"
                        >
                          <span>📞</span> {provider.phone}
                        </TrackedLink>
                      )
                    )}
                    {provider.website && (
                      provider.is_featured ? (
                        <TrackedLink
                          providerId={provider.id}
                          eventType="website_click"
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-wellness-600 text-white px-6 py-3 rounded-2xl font-black text-lg hover:bg-wellness-700 transition-all shadow-lg"
                        >
                          🌐 Visit Website
                        </TrackedLink>
                      ) : (
                        <TrackedLink
                          providerId={provider.id}
                          eventType="website_click"
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xl font-black text-wellness-600 hover:underline"
                        >
                          <span>🌐</span> Visit Website →
                        </TrackedLink>
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
                    <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Services</h2>
                    <p className="text-sm text-slate-500 font-medium mb-6 max-w-2xl">
                      Tap a service to see what it is.{' '}
                      <Link href="/treatments" className="text-wellness-600 hover:underline font-bold">
                        Browse the full treatment glossary
                      </Link>
                      .
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {[...new Set(provider.specialties)].map((service, idx) => {
                        const def = findDefinition(service);
                        return (
                          <TreatmentDefinitionDisclosure
                            key={service + idx}
                            name={service}
                            definition={def}
                            variant="unclaimed"
                          />
                        );
                      })}
                    </div>

                    {/* Crawl-depth helper: subtle links to the city hub + a
                        couple of common treatment x city matrix pages so the
                        unclaimed listing is connected to deeper money pages.
                        Kept purposely understated; not a CTA. */}
                    <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 font-medium">
                      <span className="font-bold text-slate-700">More in {provider.city}:</span>
                      <Link href={`/cities/${citySlug}`} className="text-wellness-700 hover:underline font-bold">
                        All {provider.city} clinics
                      </Link>
                      <span className="text-slate-300">·</span>
                      <Link href={`/iv-therapy/nad-plus/${citySlug}`} className="text-wellness-700 hover:underline font-bold">
                        NAD+ in {provider.city}
                      </Link>
                      <span className="text-slate-300">·</span>
                      <Link href={`/iv-therapy/hangover-recovery/${citySlug}`} className="text-wellness-700 hover:underline font-bold">
                        Hangover recovery in {provider.city}
                      </Link>
                      <span className="text-slate-300">·</span>
                      <Link href={`/iv-therapy/myers-cocktail/${citySlug}`} className="text-wellness-700 hover:underline font-bold">
                        Myers Cocktail in {provider.city}
                      </Link>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* SAFETY VERIFIED — 5-check breakdown for clinics that pass all 5.
                Mirrors the platform-wide model used by /api/safety-check. */}
            {safetyVerified && safetyResults.some((c) => c.passed) && (
              <section id="safety-verified" className="pt-8 border-t border-slate-100 scroll-mt-24">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">Safety Verified</h2>
                    <p className="text-sm font-bold text-sky-700 uppercase tracking-widest mt-0.5">Completed TheDripMap's safety questionnaire</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-8 max-w-2xl">
                  {provider.name} completed TheDripMap's safety questionnaire. Here is what they confirmed.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {safetyResults.filter((c) => c.passed).map((c) => (
                    <div key={c.key} className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={16} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 text-[15px] leading-snug">{c.label}</div>
                        <div className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{c.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-5">
                  These criteria are self-attested by the clinic operator. TheDripMap does not perform on-site audits. If you believe any of these is no longer accurate, email <a href="mailto:info@thedripmap.com" className="text-sky-600 hover:underline font-bold">info@thedripmap.com</a>.
                </p>
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
                  <p className="text-slate-500 font-bold mb-6 text-lg">Claim it free to unlock your full profile:</p>

                  {/* Claim-to-unlock checklist — the free benefits made concrete */}
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mb-8 max-w-xl">
                    {[
                      'Your logo, photos & drip menu with prices',
                      'Your team & credentials shown',
                      'Book & call buttons straight to you',
                      'Top placement above unclaimed clinics',
                      'Turn on a limited-time offer',
                      'Respond to reviews + see your visit stats',
                    ].map((b) => (
                      <li key={b} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                        <CheckCircle2 size={16} className="text-wellness-600 shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>

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
                TheDripMap is an independent matching service. Always verify credentials directly with the provider before booking any treatment.
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
                        {status.isOpen ? 'Open now' : status.known ? 'Currently closed' : 'Hours not listed'}
                      </div>
                      <div className="text-sm font-bold text-slate-900">{status.todayHours}</div>
                    </div>
                  </div>

                  {/* PRIMARY ACTIONS — Book is the conversion CTA */}
                  <div className="space-y-3">
                    {provider.website && (
                      <TrackedLink
                        providerId={provider.id}
                        eventType="book_click"
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-wellness-600 text-white px-6 py-4 rounded-2xl font-black text-base hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-200/50 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                      >
                        Book Appointment <ExternalLink size={18} />
                      </TrackedLink>
                    )}
                    {provider.phone && (
                      <TrackedLink
                        providerId={provider.id}
                        eventType="call_click"
                        href={`tel:${provider.phone}`}
                        className="w-full bg-white border-2 border-slate-200 text-slate-900 px-6 py-4 rounded-2xl font-black text-base hover:border-slate-900 transition-all flex items-center justify-center gap-2"
                      >
                        <Phone size={18} /> Call Clinic
                      </TrackedLink>
                    )}
                    <MessageClinicButton provider={provider} variant="secondary" />
                  </div>

                  {/* ADDRESS + DIRECTIONS — clickable to open in maps */}
                  {provider.address && (
                    <TrackedLink
                      providerId={provider.id}
                      eventType="directions_click"
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
                    </TrackedLink>
                  )}

                  {/* RATING — quick credibility anchor */}
                  {displayRating > 0 && displayReviewCount > 0 && (
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

