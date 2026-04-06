import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
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
import { CityGrid } from '../../../../src/components/CityGrid';
import { getListingsByService, getAllCities, slugify } from '../../../../src/lib/data';

export const revalidate = 86400; // 24 hours

interface ServicePageProps {
  params: Promise<{
    service: string;
  }>;
}

const SERVICES = [
  { name: 'NAD+ Plus', slug: 'nad-plus', icon: <Activity size={24} /> },
  { name: 'Hangover', slug: 'hangover', icon: <Heart size={24} /> },
  { name: 'Immune Support', slug: 'immune-support', icon: <ShieldCheck size={24} /> },
  { name: 'Beauty Glow', slug: 'beauty-glow', icon: <Sparkles size={24} /> },
  { name: 'Weight Loss', slug: 'weight-loss', icon: <Activity size={24} /> },
  { name: 'Hydration', slug: 'hydration', icon: <Droplets size={24} /> },
  { name: 'Recovery', slug: 'recovery', icon: <Dumbbell size={24} /> },
  { name: 'Myers Cocktail', slug: 'myers-cocktail', icon: <Zap size={24} /> },
];

export async function generateStaticParams() {
  return SERVICES.map((s) => ({
    service: s.slug,
  }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { service: serviceSlug } = await params;
  const service = SERVICES.find(s => s.slug === serviceSlug);
  
  if (!service) return { title: 'Service Not Found' };

  return {
    title: `Best ${service.name} IV Therapy Near Me | Top Rated Clinics 2024`,
    description: `Find and compare the best ${service.name} IV therapy clinics near you. Read reviews, compare prices, and book top-rated ${service.name} hydration and wellness drips.`,
    alternates: {
      canonical: `/iv-therapy/treatment/${serviceSlug}`,
    },
    openGraph: {
      title: `Best ${service.name} IV Therapy Near Me`,
      description: `Find and compare the best ${service.name} IV therapy clinics near you.`,
      url: `https://thedripmap.com/iv-therapy/treatment/${serviceSlug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Best ${service.name} IV Therapy Near Me`,
      description: `Find and compare the best ${service.name} IV therapy clinics near you.`,
    },
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { service: serviceSlug } = await params;
  const service = SERVICES.find(s => s.slug === serviceSlug);
  
  if (!service) notFound();

  const listings = await getListingsByService(service.name);
  const cities = await getAllCities();
  const topCities = cities.slice(0, 8);

  const faqs = [
    {
      question: `What is ${service.name} IV therapy?`,
      answer: `${service.name} IV therapy is a specialized intravenous treatment designed to deliver vitamins, minerals, and other nutrients directly into the bloodstream for maximum absorption and rapid results.`
    },
    {
      question: `How long does a ${service.name} drip session take?`,
      answer: `A typical ${service.name} IV session lasts between 45 to 60 minutes, during which you can relax in a comfortable lounge or your own home.`
    },
    {
      question: `How much does ${service.name} IV therapy cost?`,
      answer: `Prices for ${service.name} IV therapy usually range from $175 to $350, depending on the specific ingredients and the provider's location.`
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${service.name} IV Therapy`,
    "description": `Top rated ${service.name} IV hydration and wellness treatments.`,
    "provider": {
      "@type": "Organization",
      "name": "TheDripMap"
    },
    "areaServed": {
      "@type": "Country",
      "name": "US"
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
        "name": "Treatments",
        "item": "https://thedripmap.com/search"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": service.name,
        "item": `https://thedripmap.com/iv-therapy/treatment/${serviceSlug}`
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
            { label: service.name }
          ]} 
        />

        {/* Hero Section */}
        <section className="mb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-wellness-100">
              <Zap size={16} />
              <span>Specialized {service.name} Protocols</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Best <span className="text-wellness-600">{service.name} IV Therapy</span> Near Me
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-10">
              Compare {listings.length} top-rated clinics and mobile services specializing in {service.name} IV therapy. Find the perfect treatment for your wellness goals today.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <CheckCircle2 size={18} className="text-wellness-600" />
                <span className="text-sm font-bold text-slate-700">Clinical Strength</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <CheckCircle2 size={18} className="text-wellness-600" />
                <span className="text-sm font-bold text-slate-700">Expert Administered</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <CheckCircle2 size={18} className="text-wellness-600" />
                <span className="text-sm font-bold text-slate-700">Rapid Results</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Listings Grid */}
        <section className="mb-24">
          <div className="flex items-center justify-between gap-6 mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Top {service.name} Providers</h2>
            <Link 
              href="/search"
              className="hidden md:flex items-center gap-2 text-sm font-bold text-wellness-600 hover:text-wellness-700 transition-colors"
            >
              View All Clinics <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.slice(0, 9).map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </section>

        {/* Service Info Section */}
        <section className="py-20 px-10 bg-slate-900 text-white rounded-[3rem] mb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-800/50 skew-x-12 translate-x-1/4" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-black mb-6 tracking-tight">Understanding {service.name} IV Therapy</h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              {service.name} IV therapy is a powerful clinical tool for maintaining optimal health and recovering quickly from life's demands. By delivering nutrients directly into your bloodstream, you achieve 100% absorption, bypassing the digestive system for immediate cellular benefit.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-wellness-600 rounded-xl flex items-center justify-center shrink-0">
                  <Activity size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">High Bioavailability</h4>
                  <p className="text-xs text-slate-400">Direct delivery ensures your body gets the full benefit of every nutrient.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-wellness-600 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Targeted Wellness</h4>
                  <p className="text-xs text-slate-400">Protocols designed specifically to address your unique health goals.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FAQSection faqs={faqs} title={`${service.name} IV Therapy FAQ`} />
        
        <CityGrid cities={topCities} title={`Top Cities for ${service.name}`} />
      </main>

      <Footer />
    </div>
  );
}
