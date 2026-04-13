'use client';
import React, { useState, useEffect } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Droplets, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Activity,
  Heart,
  Sparkles,
  Dumbbell,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { Navbar } from '../../../../src/components/Navbar';
import { Footer } from '../../../../src/components/Footer';
import { ProviderCard } from '../../../../src/components/ProviderCard';
import { FAQSection } from '../../../../src/components/FAQSection';
import { BreadcrumbNav } from '../../../../src/components/BreadcrumbNav';
import { CityGrid } from '../../../../src/components/CityGrid';
import { getListingsByServiceAndCity, getAllCities, getListingsByService } from '../../../../src/lib/data';
import { Provider } from '../../../../src/types';

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

export default function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const resolvedParams = React.use(params);
  const serviceSlug = resolvedParams.service;
  const searchParams = useSearchParams();
  const cityParam = searchParams.get('city');

  const [service] = useState(SERVICES.find(s => s.slug === serviceSlug));
  const [listings, setListings] = useState<Provider[]>([]);
  const [topCities, setTopCities] = useState<{ city: string; state: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCity, setCurrentCity] = useState<string | null>(cityParam);

  useEffect(() => {
    if (!service) return;

    const loadData = async () => {
      setIsLoading(true);
      
      // Check for city in session storage if not in URL
      let cityToUse = currentCity;
      if (!cityToUse) {
        const cached = sessionStorage.getItem('tdm_location');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.city) cityToUse = parsed.city;
          } catch (e) {
            console.error('Failed to parse cached location', e);
          }
        }
      }

      const [serviceListings, allCities] = await Promise.all([
        cityToUse && cityToUse !== 'All' 
          ? getListingsByServiceAndCity(service.name, cityToUse, 9)
          : getListingsByService(service.name, 9),
        getAllCities()
      ]);

      // Fallback logic: if no service-specific listings found, get general top-rated listings
      if (serviceListings.length === 0) {
        const { getFeaturedListings } = await import('../../../../src/lib/data');
        const fallbackListings = await getFeaturedListings(9);
        setListings(fallbackListings);
      } else {
        setListings(serviceListings);
      }
      
      setTopCities(allCities.slice(0, 8));
      setCurrentCity(cityToUse);
      setIsLoading(false);
    };

    loadData();
  }, [service, currentCity]);

  // Listen for global location changes
  useEffect(() => {
    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newLoc = customEvent.detail;
      if (newLoc && newLoc.city) {
        setCurrentCity(newLoc.city);
      }
    };

    window.addEventListener('tdm_location_change', handleLocationChange);
    return () => window.removeEventListener('tdm_location_change', handleLocationChange);
  }, []);

  if (!service) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedripmap.com';
  
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "IV Therapy",
        "item": `${siteUrl}/search`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": service.name,
        "item": `${siteUrl}/iv-therapy/treatment/${service.slug}`
      }
    ]
  };

  const procedureJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    "name": `${service.name} IV Therapy`,
    "description": `Specialized intravenous treatment for ${service.name}.`,
    "procedureType": "Intravenous Therapy",
    "relevantSpecialty": {
      "@type": "MedicalSpecialty",
      "name": "Preventive Medicine"
    }
  };

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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(procedureJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
              Best <span className="text-wellness-600">{service.name} IV Therapy</span> {currentCity && currentCity !== 'All' ? `in ${currentCity}` : 'Near Me'}
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {currentCity && currentCity !== 'All' ? `Top ${service.name} Providers in ${currentCity}` : `Top ${service.name} Providers`}
            </h2>
            <Link 
              href={`/search?q=${encodeURIComponent(service.name)}&city=${encodeURIComponent(currentCity || 'All')}`}
              className="hidden md:flex items-center gap-2 text-sm font-bold text-wellness-600 hover:text-wellness-700 transition-colors"
            >
              View All Clinics <ArrowRight size={16} />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500 font-bold">Finding specialized providers...</p>
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <MapPin size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No {service.name} providers found in {currentCity}</h3>
              <p className="text-slate-500 mb-6">Try searching in a nearby city or browse all providers.</p>
              <button 
                onClick={() => setCurrentCity('All')}
                className="text-wellness-600 font-bold hover:underline"
              >
                Show all {service.name} providers
              </button>
            </div>
          )}
        </section>

        {/* Service Info Section */}
        <section className="py-20 px-10 bg-slate-900 text-white rounded-[3rem] mb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-800/50 skew-x-12 translate-x-1/4" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-black mb-6 tracking-tight">Understanding {service.name} IV Therapy</h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              {service.name} IV therapy is a powerful clinical tool for maintaining optimal health and recovering quickly from life&apos;s demands. By delivering nutrients directly into your bloodstream, you achieve 100% absorption, bypassing the digestive system for immediate cellular benefit.
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
