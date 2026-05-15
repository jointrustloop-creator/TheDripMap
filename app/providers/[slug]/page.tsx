import React from 'react';
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
  Lock
} from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { ClinicImage } from '../../../src/components/ClinicImage';
import { ResilientImage } from '../../../src/components/ResilientImage';
import { ClaimListingTrigger } from '../../../src/components/ClaimListingTrigger';
import { 
  getListingBySlug, 
  slugify, 
  getAllListings, 
  getStateFromProvider,
  getOperatorProfiles,
  getSimilarClinics
} from '../../../src/lib/data';
import { Provider } from '../../../src/types';
import { cn } from '../../../src/lib/utils';
import { getStatus } from '../../../src/lib/hours';
import SmartSummary from '../../../src/components/SmartSummary';
import { calculateValueMetrics } from '../../../src/lib/price-utils';

export const revalidate = 60; // Revalidate every minute for live-ish data updates

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
  const provider = await getListingBySlug(slug);
  
  if (!provider || provider.availability === false) {
    notFound();
  }

  const displayName = provider.name
    .split(' | ')[0]
    .split(' - IV')[0]
    .split(' - Drip')[0]
    .trim();

  const title = `${displayName} — IV Therapy in ${provider.city}, ${provider.state} | TheDripMap`;
  const description = provider.reviewCount > 0
    ? `Read ${provider.reviewCount} reviews for ${provider.name} in ${provider.city}, ${provider.state}. Top-rated IV therapy clinic offering hydration, NAD+, and wellness drips.`
    : `Find details for ${provider.name} in ${provider.city}, ${provider.state}. Top-rated IV therapy clinic offering hydration, NAD+, and wellness drips.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.thedripmap.com/providers/${slug}`,
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
      url: `https://www.thedripmap.com/providers/${slug}`,
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
  const provider = await getListingBySlug(slug);
  
  if (!provider || provider.availability === false) {
    notFound();
  }

  const profiles = await getOperatorProfiles();
  const profile = profiles.find(p => p.clinicId === provider.id);
  const stateCode = provider.state || getStateFromProvider(provider);
  const timezone = (stateCode === 'ON' || stateCode === 'Ontario') ? 'America/Toronto' : 'America/New_York';
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
    "aggregateRating": provider.reviewCount > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": provider.rating,
      "reviewCount": provider.reviewCount
    } : undefined
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.thedripmap.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": cityLabel,
        "item": `https://www.thedripmap.com/cities/${citySlug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": provider.name,
        "item": `https://www.thedripmap.com/providers/${slug}`
      }
    ]
  };

  const faqJsonLd = {
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
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* BREADCRUMB */}
        <div className="mb-12">
          <BreadcrumbNav 
            items={[
              { label: 'IV Therapy', href: '/search' },
              { label: cityLabel, href: `/cities/${citySlug}` },
              { label: provider.name }
            ]} 
          />
        </div>

        {provider.is_featured && (
          <div className="mb-12 bg-emerald-600 text-white py-4 px-8 rounded-3xl text-center font-black text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-3">
            <CheckCircle2 size={24} /> ✅ Verified & Claimed — This listing is managed by {displayName}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16">
          {/* LEFT COLUMN */}
          <div className="space-y-16">
            {/* HERO SECTION */}
            <section className="space-y-10">
              <div className="flex flex-col md:flex-row gap-8 items-start">
        {provider.is_featured && (provider.imageUrl || provider.image_url) && (
          <div className="w-[160px] h-[160px] rounded-3xl bg-white border border-slate-100 shadow-xl p-4 flex items-center justify-center overflow-hidden shrink-0">
            <ResilientImage 
              src={provider.imageUrl || provider.image_url!} 
              alt={`${displayName} logo`}
              className="w-full h-full object-contain scale-110"
              width={160}
              height={160}
              fallbackSrc="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/clinic-logo-placeholder.png"
            />
          </div>
        )}
                <div>
                  <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                    {displayName}
                  </h1>
                  
                  {/* KEY FACTS ROW */}
                  <div className="flex flex-wrap gap-2">
                    {provider.is_featured && (
                      provider.rating > 0 && provider.reviewCount > 0 ? (
                        <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5">
                          <span className="text-wellness-600">★</span> {provider.rating} · {provider.reviewCount} reviews
                        </div>
                      ) : (
                        <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[13px] font-black flex items-center gap-1.5 border border-emerald-100 uppercase tracking-wider">
                          ✨ New Clinic · Be the first to review
                        </div>
                      )
                    )}
                    <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5">
                      <span>📍</span> {provider.city}, {stateCode}
                    </div>
                  </div>
                </div>
              </div>

              {provider.is_featured && (
                <div className="relative h-[300px] md:h-[450px] rounded-[3rem] overflow-hidden shadow-2xl">
                  <ClinicImage 
                    name={provider.name}
                    initials={initials}
                    imageUrl={(provider.photos && provider.photos.length > 0) ? provider.photos[0] : (provider.imageUrl || provider.image_url)}
                    size="lg"
                    className="object-cover"
                  />
                </div>
              )}

              {provider.is_featured && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Info Cards */}
                  <div className="flex flex-col gap-4">
                    <div className="bg-white p-6 h-full rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                      <div className="text-slate-400 font-bold text-xs uppercase mb-1">Price Range</div>
                      <div className="text-xl font-black text-slate-900">{provider.price_range || provider.priceRange || 'Competitive'}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="bg-white p-6 h-full rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                      <div className="text-slate-400 font-bold text-xs uppercase mb-1">Administered By</div>
                      <div className="text-xl font-black text-slate-900 line-clamp-1">{profile?.profile_data?.administerType || 'Medical Professionals'}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="bg-white p-6 h-full rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                      <div className="text-slate-400 font-bold text-xs uppercase mb-1">Availability</div>
                      <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className={status.isOpen ? "text-emerald-500" : "text-amber-500"}>●</span>
                        {status.isOpen ? 'Open Now' : 'Closed'}
                      </div>
                    </div>
                  </div>

                  {/* Contact Buttons (filling space if featured) */}
                  <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {provider.phone && (
                      <a 
                        href={`tel:${provider.phone}`}
                        className="flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-xl hover:bg-slate-800 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
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

                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-base font-bold text-slate-500 mb-8">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-wellness-600" />
                    {provider.city}, {stateCode}
                  </div>
                </div>

                {/* PHONE + WEBSITE ROW */}
                {!provider.is_featured && (provider.phone || provider.website) && (
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
                  {provider.is_top_rated && (
                    <span className="bg-amber-500 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg">
                      <Star size={14} fill="white" /> Top Rated
                    </span>
                  )}
                  {provider.is_featured && (
                    <span className="bg-wellness-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg">
                      <Star size={14} fill="white" /> Featured
                    </span>
                  )}
                </div>
              </section>

            {/* ABOUT SECTION */}
            <SmartSummary reviews={provider.reviews_data || []} clinicName={displayName} />

            {provider.description && provider.description.length > 30 && (
              <section className="pt-8 border-t border-slate-100">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">About {provider.name}</h2>
                <div className="prose prose-slate max-w-none">
                  {provider.is_featured && (profile?.one_liner || profile?.profile_data?.oneLiner) && (
                    <div className="mb-10 p-8 bg-wellness-50 border-l-8 border-wellness-600 rounded-r-[2rem]">
                      <p className="text-2xl font-black text-wellness-900 italic leading-relaxed">
                        &quot;{profile.one_liner || profile.profile_data.oneLiner}&quot;
                      </p>
                    </div>
                  )}
                  <p className="text-xl text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {provider.description}
                  </p>
                </div>
              </section>
            )}

            {/* SERVICES SECTION */}
            {provider.specialties && provider.specialties.length > 0 && (
              <section className="pt-8 border-t border-slate-100">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Services</h2>
                <div className="flex flex-wrap gap-3">
                  {[...new Set(provider.specialties)].map((service, idx) => (
                    <span 
                      key={idx} 
                      className={cn(
                        "px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm",
                        provider.is_featured 
                          ? "bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100" 
                          : "bg-white border border-slate-100 text-slate-700 hover:border-wellness-200 hover:text-wellness-600"
                      )}
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* UNCLAIMED LISTING CARD / FEATURED BADGE */}
            {!provider.is_featured && !provider.is_claimed && (
              <section className="pt-8 border-t border-slate-100">
                <div className="bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 p-10">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">This listing is unclaimed</h3>
                  <p className="text-slate-500 font-bold mb-8 text-lg">Claim it free to add:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <LockedField icon="📷" label="Photos" text="Add clinic photos to stand out" />
                    <LockedField icon="📝" label="About this clinic" text="Write your clinic's story" />
                    <LockedField icon="⚕️" label="Staff credentials" text="RN / NP / MD administered" />
                    <LockedField icon="🏥" label="Clinic environment" text="Medical / Spa-like / Quick" />
                    <LockedField icon="💬" label="Your one-liner" text="What makes your clinic different" />
                    <LockedField icon="📊" label="Specialization focus" text="Hangover / NAD+ / Beauty / etc." />
                  </div>

                  <ClaimListingTrigger 
                    provider={provider}
                    className="inline-flex items-center gap-2 bg-wellness-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-wellness-700 transition-all shadow-lg"
                  >
                    Claim This Listing Free <ArrowRight size={20} />
                  </ClaimListingTrigger>
                </div>
              </section>
            )}

            {provider.is_featured && (
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

            {/* QUICK FACTS GRID */}
            {!provider.is_featured && (() => {
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

            {/* HOURS SECTION */}
            {!provider.is_featured && provider.hours && Object.keys(provider.hours).length > 0 && (
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

            {/* HOURS AND LOCATION - SIDE BY SIDE FOR FEATURED */}
            {provider.is_featured && (
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
                            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                              <ResilientImage 
                                src={`https://maps.googleapis.com/maps/api/staticmap?center=${provider.latitude},${provider.longitude}&zoom=14&size=600x300&markers=color:blue%7C${provider.latitude},${provider.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                                alt="Clinic map location"
                                fill
                                className="object-cover"
                                fallbackSrc="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/map-placeholder.png"
                              />
                            ) : (
                              <ResilientImage 
                                src={`https://api.mapbox.com/styles/v1/mapbox/light-v10/static/pin-s-plus+3b82f6(${provider.longitude},${provider.latitude})/${provider.longitude},${provider.latitude},14,0/600x300@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZHJpcG1hcCIsImEiOiJjbHY5Mmt4Nm0wYTZ2MmpuMGV6MGV6MGV6In0.X'}`}
                                alt="Clinic map location"
                                fill
                                className="object-cover"
                                fallbackSrc="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/map-placeholder.png"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* REVIEWS SECTION */}
            {provider.reviews_data && provider.reviews_data.length > 0 && (
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
                    
                    return (
                      <Link 
                        key={clinic.id} 
                        href={`/providers/${clinic.slug || slugify(clinic.name)}`}
                        className="bg-white rounded-[2rem] border border-slate-100 p-6 hover:shadow-xl transition-all group flex flex-col h-full"
                      >
                        <div className="relative h-40 rounded-2xl overflow-hidden mb-6">
                          {clinic.is_featured ? (
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
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="flex items-center text-wellness-600">
                            <Star size={12} fill="currentColor" />
                          </div>
                          <span className="text-xs font-black text-slate-900">{clinic.rating}</span>
                          <span className="text-xs font-bold text-slate-400">· {clinic.reviewCount} reviews</span>
                        </div>
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

            {/* UPGRADE CTA FOR CLAIMED CLINICS */}
            {provider.is_claimed && !provider.is_featured && (
              <section className="bg-slate-900 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl mt-16">
                <div className="absolute top-0 right-0 w-96 h-96 bg-wellness-600/20 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">Unlock Your Clinic&apos;s Full Potential</h2>
                  <p className="text-xl opacity-80 mb-10 max-w-xl mx-auto font-medium leading-relaxed">
                    Upgrade to a Featured listing to get 5x more visibility, verified badges, and a custom profile redesigned for conversions.
                  </p>
                  <button 
                    className="inline-flex items-center gap-3 bg-wellness-600 text-white px-12 py-6 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl"
                  >
                    View Upgrade Options <ArrowRight size={24} />
                  </button>
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

          {/* RIGHT COLUMN (SIDEBAR) */}
          <aside>
            <div className="sticky top-32 space-y-6">
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 space-y-10">
                {/* STATUS */}
                <div className="text-center pb-8 border-b border-slate-50">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4",
                    status.isOpen ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}>
                    <span className={cn("w-2.5 h-2.5 rounded-full", status.isOpen ? "bg-emerald-500" : "bg-red-500")} />
                    {status.isOpen ? 'Open Now' : 'Closed'}
                  </div>
                  <div className="text-3xl font-black text-slate-900">{status.todayHours}</div>
                </div>

                {/* ACTIONS */}
                <div className="space-y-4">
                  {provider.website && (
                    <a 
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-wellness-700 text-white px-8 py-6 rounded-2xl font-black text-lg hover:bg-wellness-800 transition-all shadow-xl shadow-wellness-100 flex items-center justify-center gap-3"
                    >
                      Book Appointment <ExternalLink size={20} />
                    </a>
                  )}
                  {provider.phone && (
                    <a 
                      href={`tel:${provider.phone}`}
                      className="w-full bg-white border-2 border-slate-100 text-slate-900 px-8 py-6 rounded-2xl font-black text-lg hover:border-slate-900 transition-all flex items-center justify-center gap-3"
                    >
                      <Phone size={20} /> Call Clinic
                    </a>
                  )}
                </div>

                {/* LOCATION */}
                {!provider.is_featured && (
                  <div className="pt-8 border-t border-slate-50 space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location</div>
                    <div className="flex items-start gap-4 text-slate-900">
                      <MapPin size={24} className="text-wellness-600 shrink-0 mt-1" />
                      <div className="font-bold text-lg leading-relaxed">
                        {provider.address && provider.address.split(',')[0]}
                        {provider.address && <br />}
                        {provider.city}, {stateCode} {provider.postal_code}
                      </div>
                    </div>
                  </div>
                )}

                {/* CLAIM STATUS */}
                <div className="pt-8 border-t border-slate-50">
                  {!provider.is_featured && !provider.is_claimed ? (
                  <ClaimListingTrigger 
                      provider={provider}
                      className="text-sm font-black text-wellness-600 hover:underline flex items-center gap-2"
                    >
                      Own this clinic? Claim your free listing
                    </ClaimListingTrigger>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                        <CheckCircle2 size={18} /> Verified & Claimed Profile
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

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

function LockedField({ icon, label, text }: { icon: string, label: string, text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-black text-slate-900 text-sm">{label}</span>
          <Lock size={12} className="text-slate-300" />
        </div>
        <p className="text-slate-400 text-xs font-bold">{text}</p>
      </div>
    </div>
  );
}
