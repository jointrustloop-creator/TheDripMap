import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  MapPin, 
  Droplets, 
  Star, 
  Clock, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Activity,
  Heart,
  Sparkles,
  Dumbbell,
  Search,
  CheckCircle2,
  Phone,
  Globe,
  Navigation,
  Calendar,
  Info,
  AlertCircle,
  Building2,
  Home
} from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { RatingStars } from '../../../src/components/RatingStars';
import { ServicePill } from '../../../src/components/ServicePill';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { getListingBySlug, getListingsByCity, slugify, getAllListings } from '../../../src/lib/data';
import { cn } from '../../../src/lib/utils';

export const revalidate = 86400; // 24 hours

interface ProviderPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const providers = await getAllListings();
  return providers
    .filter(p => p.name)
    .map((p) => ({
      slug: slugify(p.name),
    }));
}

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getListingBySlug(slug);
  
  if (!provider) return { title: 'Provider Not Found' };

  return {
    title: `${provider.name} | Best IV Therapy in ${provider.city} | TheDripMap`,
    description: `${provider.name} offers top-rated IV therapy in ${provider.city}. Specialties include ${provider.specialties.slice(0, 3).join(', ')}. Read reviews and book your drip today.`,
    alternates: {
      canonical: `/provider/${slug}`,
    },
    openGraph: {
      title: `${provider.name} | IV Therapy in ${provider.city}`,
      description: provider.description,
      url: `https://thedripmap.com/provider/${slug}`,
      images: [{ url: provider.imageUrl }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${provider.name} | IV Therapy in ${provider.city}`,
      description: provider.description,
      images: [provider.imageUrl],
    },
  };
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { slug } = await params;
  const provider = await getListingBySlug(slug);
  
  if (!provider) notFound();

  const citySlug = slugify(provider.city);
  // We don't have the state here easily, but we can find it from other listings in the same city
  const cityListings = await getListingsByCity(provider.city);
  const stateCode = 'CA'; // Default fallback, should ideally be derived
  const stateSlug = slugify(stateCode);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": provider.name,
    "description": provider.description,
    "image": provider.imageUrl,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": provider.address,
      "addressLocality": provider.city,
      "addressRegion": stateCode,
      "addressCountry": "US"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": (provider.rating || 0).toString(),
      "reviewCount": (provider.reviewCount || 0).toString()
    },
    "priceRange": provider.priceRange,
    "url": `https://thedripmap.com/provider/${slug}`
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://thedripmap.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": provider.city,
        "item": `https://thedripmap.com/iv-therapy/${stateSlug}/${citySlug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": provider.name,
        "item": `https://thedripmap.com/provider/${slug}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <BreadcrumbNav 
          items={[
            { label: 'IV Therapy', href: '/search' },
            { label: provider.city, href: `/iv-therapy/${stateSlug}/${citySlug}` },
            { label: provider.name }
          ]} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Header Section */}
            <section>
              <div className="flex flex-wrap gap-2 mb-6">
                {provider.is_featured && (
                  <span className="bg-wellness-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                    <Zap size={12} className="fill-white" /> Featured Provider
                  </span>
                )}
                {provider.type === 'Mobile' && (
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                    <Home size={12} className="fill-white" /> Mobile IV Service
                  </span>
                )}
                {provider.type === 'In-Clinic' && (
                  <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                    <Building2 size={12} className="fill-white" /> In-Clinic Lounge
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                {provider.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-500">
                <RatingStars rating={provider.rating} count={provider.reviewCount} size={18} />
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-wellness-600" />
                  {provider.city}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900">{provider.priceRange}</span>
                  <span className="text-slate-400 font-normal">Price Range</span>
                </div>
              </div>
            </section>

            {/* Image Gallery (Single for now) */}
            <section className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl">
              <Image 
                src={provider.imageUrl} 
                alt={`${provider.name} IV therapy clinic in ${provider.city}`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1200px) 100vw, 800px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </section>

            {/* Description */}
            <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">About {provider.name}</h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {provider.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Core Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.specialties.map((specialty, idx) => (
                      <ServicePill key={idx} service={specialty} />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.amenities.map((amenity, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-wellness-50 text-wellness-700 rounded-full text-xs font-bold border border-wellness-100">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Clinical Decision Drivers */}
            <section className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-wellness-600 rounded-xl flex items-center justify-center">
                  <Activity size={24} />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Clinical Insights</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Luxury Experience</span>
                    <span className="text-lg font-black text-wellness-400">{provider.decisionDrivers.luxuryExperience}/5</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-wellness-500" style={{ width: `${(provider.decisionDrivers.luxuryExperience / 5) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Speed of Service</span>
                    <span className="text-lg font-black text-wellness-400">{provider.decisionDrivers.speedOfService}/5</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-wellness-500" style={{ width: `${(provider.decisionDrivers.speedOfService / 5) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Value for Money</span>
                    <span className="text-lg font-black text-wellness-400">{provider.decisionDrivers.valueForMoney}/5</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-wellness-500" style={{ width: `${(provider.decisionDrivers.valueForMoney / 5) * 100}%` }} />
                  </div>
                </div>
              </div>
              
              {provider.decisionDrivers.medicalSupervision && (
                <div className="mt-10 pt-8 border-t border-slate-800 flex items-center gap-3 text-wellness-400">
                  <ShieldCheck size={24} />
                  <span className="font-bold">Medical Director Supervised Protocols</span>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-8">
            {/* Booking Card */}
            <div className="sticky top-28 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8">
              <div className="mb-8">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Service Location</div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  {provider.type === 'Mobile' ? <Home className="text-wellness-600" /> : <Building2 className="text-wellness-600" />}
                  <div>
                    <div className="font-bold text-slate-900">{provider.type} Service</div>
                    <div className="text-xs text-slate-500">{provider.type === 'Mobile' ? 'Nurse comes to you' : 'Visit our clinical lounge'}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin size={20} className="text-slate-400 shrink-0" />
                  <span className="text-sm font-medium leading-relaxed">{provider.address}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Clock size={20} className="text-slate-400 shrink-0" />
                  <span className="text-sm font-medium">Open Today: 9:00 AM - 7:00 PM</span>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-wellness-600 text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-wellness-700 transition-all shadow-xl shadow-wellness-100 flex items-center justify-center gap-2">
                  <Calendar size={20} /> Book Appointment
                </button>
                <button className="w-full bg-white border-2 border-slate-100 text-slate-900 px-8 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <Phone size={20} /> Call Clinic
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                <div className="flex items-center justify-center gap-2 text-wellness-600 font-bold text-sm mb-2">
                  <ShieldCheck size={16} /> Verified Provider
                </div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Listing Managed by TheDripMap</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
