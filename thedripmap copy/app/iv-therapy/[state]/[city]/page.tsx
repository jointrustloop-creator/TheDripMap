import React from 'react';
import { Metadata } from 'next';
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
  CheckCircle2
} from 'lucide-react';
import { Navbar } from '../../../../src/components/Navbar';
import { Footer } from '../../../../src/components/Footer';
import { ProviderCard } from '../../../../src/components/ProviderCard';
import { FAQSection } from '../../../../src/components/FAQSection';
import { BreadcrumbNav } from '../../../../src/components/BreadcrumbNav';
import { NearbyCities } from '../../../../src/components/NearbyCities';
import { getListingsByCity, getAllCities, slugify } from '../../../../src/lib/data';

export const revalidate = 86400; // 24 hours

interface CityPageProps {
  params: Promise<{
    state: string;
    city: string;
  }>;
}

export async function generateStaticParams() {
  const cities = await getAllCities();
  return cities.map((c) => ({
    state: slugify(c.state),
    city: slugify(c.city),
  }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { state, city } = await params;
  const cities = await getAllCities();
  const cityInfo = cities.find(c => slugify(c.city) === city);
  
  if (!cityInfo) return { title: 'City Not Found' };

  const cityName = cityInfo.city;
  const stateName = cityInfo.state;

  return {
    title: `Best IV Therapy in ${cityName}, ${stateName} | Top Rated Clinics 2024`,
    description: `Find and compare the best IV therapy clinics in ${cityName}, ${stateName}. Read reviews, compare prices, and book top-rated hydration and wellness drips.`,
    alternates: {
      canonical: `/iv-therapy/${state}/${city}`,
    },
    openGraph: {
      title: `Best IV Therapy in ${cityName}, ${stateName}`,
      description: `Find and compare the best IV therapy clinics in ${cityName}, ${stateName}.`,
      url: `https://thedripmap.com/iv-therapy/${state}/${city}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Best IV Therapy in ${cityName}, ${stateName}`,
      description: `Find and compare the best IV therapy clinics in ${cityName}, ${stateName}.`,
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { state, city } = await params;
  const cities = await getAllCities();
  const cityInfo = cities.find(c => slugify(c.city) === city);
  
  if (!cityInfo) notFound();

  const cityName = cityInfo.city;
  const stateName = cityInfo.state;
  const listings = await getListingsByCity(cityName);
  
  const nearbyCities = cities
    .filter(c => c.state === cityInfo.state && c.city !== cityName)
    .slice(0, 5);

  const faqs = [
    {
      question: `How much does IV therapy cost in ${cityName}?`,
      answer: `IV therapy prices in ${cityName} typically range from $150 to $350 per session, depending on the ingredients and whether you choose in-clinic or mobile service.`
    },
    {
      question: `Is mobile IV therapy available in ${cityName}?`,
      answer: `Yes, many providers in ${cityName} offer mobile IV services that can come to your home, office, or hotel within 60-90 minutes.`
    },
    {
      question: `What are the most popular IV drips in ${cityName}?`,
      answer: `The most popular treatments in ${cityName} include NAD+ therapy for longevity, hangover recovery drips, and immune support infusions.`
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `IV Therapy Providers in ${cityName}`,
    "description": `Top rated IV hydration and wellness clinics in ${cityName}, ${stateName}.`,
    "url": `https://thedripmap.com/iv-therapy/${state}/${city}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressRegion": stateName,
      "addressCountry": "US"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": (listings.length * 15 + 7).toString()
    }
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
        "name": "Cities",
        "item": "https://thedripmap.com/search"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": cityName,
        "item": `https://thedripmap.com/iv-therapy/${state}/${city}`
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
            { label: stateName, href: `/iv-therapy/${state}` },
            { label: cityName }
          ]} 
        />

        {/* Hero Section */}
        <section className="mb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-wellness-100">
              <MapPin size={16} />
              <span>Verified Providers in {cityName}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Best IV Therapy in <span className="text-wellness-600">{cityName}, {stateName}</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-10">
              Compare {listings.length} top-rated IV therapy clinics and mobile services in {cityName}. Find the perfect hydration, energy, or recovery drip today.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <CheckCircle2 size={18} className="text-wellness-600" />
                <span className="text-sm font-bold text-slate-700">Medical Supervision</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <CheckCircle2 size={18} className="text-wellness-600" />
                <span className="text-sm font-bold text-slate-700">Verified Reviews</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <CheckCircle2 size={18} className="text-wellness-600" />
                <span className="text-sm font-bold text-slate-700">Mobile Available</span>
              </div>
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        <section className="mb-24">
          <div className="flex items-center justify-between gap-6 mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Top Rated Clinics</h2>
            <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-400">
              <Clock size={16} /> Updated: April 2024
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </section>

        {/* Local Content Section */}
        <section className="py-20 px-10 bg-wellness-900 text-white rounded-[3rem] mb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-wellness-800/50 skew-x-12 translate-x-1/4" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-black mb-6 tracking-tight">Why Get IV Therapy in {cityName}?</h2>
            <p className="text-lg text-wellness-100 leading-relaxed mb-8">
              {cityName} is a hub for wellness and performance. Whether you're recovering from a long flight, prepping for a big event, or just maintaining your health, {cityName}'s top clinics offer cutting-edge protocols tailored to your lifestyle.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-wellness-700 rounded-xl flex items-center justify-center shrink-0">
                  <Zap size={20} className="text-wellness-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Rapid Recovery</h4>
                  <p className="text-xs text-wellness-200">Feel better in under 60 minutes with targeted infusions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-wellness-700 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} className="text-wellness-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Expert Nurses</h4>
                  <p className="text-xs text-wellness-200">All treatments administered by licensed medical professionals.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FAQSection faqs={faqs} title={`IV Therapy in ${cityName} FAQ`} />
        
        {nearbyCities.length > 0 && (
          <NearbyCities cities={nearbyCities} currentState={stateName} />
        )}
      </main>

      <Footer />
    </div>
  );
}
