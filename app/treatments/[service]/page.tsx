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
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { ProviderCard } from '../../../src/components/ProviderCard';
import { FAQSection } from '../../../src/components/FAQSection';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { CityGrid } from '../../../src/components/CityGrid';
import { QuizCTA } from '../../../src/components/QuizCTA';
import { getListingsByServiceAndCity, getListingsByService, getTopHubs } from '../../../src/lib/data';
import { Provider } from '../../../src/types';
import { getTreatmentContent } from '../../../src/lib/treatment-content';
import { slugify } from '../../../src/lib/data';

const SERVICES = [
  { name: 'NAD+ Plus',      slug: 'nad-plus',       icon: <Activity size={24} />,     aliases: ['nad', 'nad-plus-therapy'] },
  { name: 'Hangover',       slug: 'hangover',       icon: <Heart size={24} />,        aliases: ['hangover-recovery'] },
  { name: 'Immune Support', slug: 'immune-support', icon: <ShieldCheck size={24} />,  aliases: [] },
  { name: 'Beauty Glow',    slug: 'beauty-glow',    icon: <Sparkles size={24} />,     aliases: [] },
  { name: 'Weight Loss',    slug: 'weight-loss',    icon: <Activity size={24} />,     aliases: [] },
  { name: 'Hydration',      slug: 'hydration',      icon: <Droplets size={24} />,     aliases: [] },
  { name: 'Recovery',       slug: 'recovery',       icon: <Dumbbell size={24} />,     aliases: ['athletic-recovery'] },
  { name: 'Myers Cocktail', slug: 'myers-cocktail', icon: <Zap size={24} />,          aliases: [] },
  { name: 'Jet Lag',        slug: 'jet-lag',        icon: <Droplets size={24} />,     aliases: [] },
  { name: 'Energy Boost',   slug: 'energy-boost',   icon: <Zap size={24} />,          aliases: [] },
  { name: 'Peptide Therapy', slug: 'peptide-therapy', icon: <Sparkles size={24} />,    aliases: ['peptides', 'peptide'] },
];

export default function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const resolvedParams = React.use(params);
  const serviceSlug = resolvedParams.service.toLowerCase();
  const searchParams = useSearchParams();
  const cityParam = searchParams.get('city');

  const [service] = useState(SERVICES.find(s => s.slug === serviceSlug || (s.aliases && s.aliases.includes(serviceSlug))));
  const [listings, setListings] = useState<Provider[]>([]);
  const [topCities, setTopCities] = useState<{ city: string; state: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCity, setCurrentCity] = useState<string | null>(cityParam);
  // True when the visitor picked a city but it had 0 matches for this treatment,
  // so we broadened to nationwide top-rated. Drives the "Showing nearby options" banner.
  const [isBroadened, setIsBroadened] = useState(false);

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

      const [serviceListings, hubs] = await Promise.all([
        cityToUse && cityToUse !== 'All'
          ? getListingsByServiceAndCity(service.name, cityToUse, 60)
          : getListingsByService(service.name, 60),
        getTopHubs(8)
      ]);

      const finalResults = [...serviceListings];
      const isCityFiltered = !!cityToUse && cityToUse !== 'All';
      let broadened = false;

      // Tiered fallback so a tiny city (Bracebridge, etc.) never shows 0 cards:
      // 1) other clinics in the same city
      // 2) nationwide top-rated for this treatment
      if (finalResults.length < 3 && isCityFiltered) {
        const { getFeaturedListings, getListingsByCity } = await import('../../../src/lib/data');
        let fallbackListings = await getFeaturedListings(60, cityToUse || undefined);
        if (fallbackListings.length < 3) {
          const cityListings = await getListingsByCity(cityToUse!);
          fallbackListings = [...fallbackListings, ...cityListings];
        }

        const existingIds = new Set(finalResults.map(p => p.id));
        const existingBrands = new Set(finalResults.map(p => p.name.toLowerCase().split(' - ')[0].split(' (')[0].trim()));
        fallbackListings.forEach(p => {
          const brand = p.name.toLowerCase().split(' - ')[0].split(' (')[0].trim();
          if (!existingIds.has(p.id) && !existingBrands.has(brand) && finalResults.length < 60) {
            finalResults.push(p);
            existingIds.add(p.id);
            existingBrands.add(brand);
          }
        });
      }

      // Hard floor: if city + nearby still under 3, broaden to nationwide top-rated
      // for this treatment. Show a banner so users know we expanded the radius.
      if (finalResults.length < 3 && isCityFiltered) {
        const nationwide = await getListingsByService(service.name, 24);
        const existingIds = new Set(finalResults.map(p => p.id));
        const existingBrands = new Set(finalResults.map(p => p.name.toLowerCase().split(' - ')[0].split(' (')[0].trim()));
        nationwide.forEach(p => {
          const brand = p.name.toLowerCase().split(' - ')[0].split(' (')[0].trim();
          if (!existingIds.has(p.id) && !existingBrands.has(brand)) {
            finalResults.push(p);
            existingIds.add(p.id);
            existingBrands.add(brand);
          }
        });
        broadened = true;
      }

      setListings(finalResults);
      setIsBroadened(broadened);
      setTopCities(hubs);
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

  const selectCity = (cityName: string | null) => {
    setCurrentCity(cityName);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (cityName) url.searchParams.set('city', cityName);
      else url.searchParams.delete('city');
      window.history.replaceState({}, '', url.toString());
      if (cityName) {
        sessionStorage.setItem('tdm_location', JSON.stringify({ city: cityName }));
      }
    }
  };

  if (!service) notFound();

  const content = getTreatmentContent(service.name);
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
        "item": `${siteUrl}/treatments/${service.slug}`
      }
    ]
  };

  const procedureJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    "name": `${service.name} IV Therapy`,
    "description": content
      ? content.description.split('\n\n')[0]
      : `Specialized intravenous treatment for ${service.name}.`,
    "procedureType": "Intravenous Therapy",
    "relevantSpecialty": {
      "@type": "MedicalSpecialty",
      "name": content?.relevantSpecialty || "Preventive Medicine"
    }
  };
  if (content) {
    procedureJsonLd["alternateName"] = content.alternateName;
    procedureJsonLd["howPerformed"] = content.howItWorks;
    procedureJsonLd["preparation"] = `No specific preparation required. Sessions typically last ${content.sessionDuration}.`;
    procedureJsonLd["followup"] = "No recovery time required after treatment.";
    const [minStr, maxStr] = content.costRange
      .replace(/\$/g, '')
      .split(/\s*to\s*/)
      .map((s) => Number(s.replace(/[^0-9]/g, '')));
    if (minStr && maxStr) {
      procedureJsonLd["estimatedCost"] = {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "minValue": minStr,
        "maxValue": maxStr,
      };
    }
  }

  // Prefer the treatment's own researched FAQs; fall back to a sensible generic
  // set (kept accurate — uses the real session duration + cost range) only if a
  // treatment has none defined.
  const faqs = content?.faqs && content.faqs.length > 0
    ? content.faqs
    : [
        {
          question: `What is ${service.name} IV therapy?`,
          answer: `${service.name} IV therapy is a specialized intravenous treatment designed to deliver vitamins, minerals, and other nutrients directly into the bloodstream for higher absorption than oral supplements.`,
        },
        {
          question: `How long does a ${service.name} drip session take?`,
          answer: content
            ? `A typical ${service.name} IV session lasts ${content.sessionDuration}, during which you can relax in a comfortable lounge or your own home.`
            : `A typical ${service.name} IV session lasts 45 to 60 minutes.`,
        },
        {
          question: `How much does ${service.name} IV therapy cost?`,
          answer: content
            ? `${service.name} IV therapy typically costs ${content.costRange}. ${content.costContext}`
            : `Prices usually range from $150 to $350 depending on ingredients and the provider's location.`,
        },
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
        <section className="mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-wellness-100">
              <Zap size={16} />
              <span>Specialized {service.name} Protocols</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              <span className="text-wellness-600">{service.name} IV Therapy</span>
              {currentCity && currentCity !== 'All' ? (
                <> in <span className="text-slate-900">{currentCity}</span></>
              ) : (
                <> — Find Clinics Near You</>
              )}
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-10">
              {currentCity && currentCity !== 'All'
                ? `Compare ${listings.length} top-rated ${service.name} IV therapy clinics and mobile services in ${currentCity}. Real ratings, real pricing, book in under a minute.`
                : `Compare ${listings.length} top-rated clinics and mobile services specializing in ${service.name} IV therapy. Find the perfect treatment for your wellness goals today.`}
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

        {/* City Chip Row — quick local filter */}
        {topCities.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-4">
              <MapPin size={16} className="text-wellness-600" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Browse by city
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => selectCity(null)}
                className={`px-4 py-2 rounded-full text-sm font-black transition-all border-2 ${
                  !currentCity || currentCity === 'All'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'
                }`}
              >
                All cities
              </button>
              {topCities.map((c) => {
                const isActive = currentCity && currentCity.toLowerCase() === c.city.toLowerCase();
                return (
                  <button
                    key={c.city}
                    onClick={() => selectCity(c.city)}
                    className={`px-4 py-2 rounded-full text-sm font-black transition-all border-2 inline-flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-wellness-600 text-white border-wellness-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-wellness-600 hover:text-wellness-600'
                    }`}
                  >
                    {c.city}
                    <span className={`text-[10px] font-black ${isActive ? 'opacity-80' : 'text-slate-400'}`}>
                      {c.count}
                    </span>
                  </button>
                );
              })}
            </div>
            {currentCity && currentCity !== 'All' && (
              <div className="mt-4">
                <Link
                  href={`/cities/${slugify(currentCity)}`}
                  className="inline-flex items-center gap-2 text-sm font-black text-wellness-600 hover:text-wellness-700"
                >
                  See full {currentCity} guide <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </section>
        )}

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
            <>
              {/* Banner shown when the visitor's city had 0 clinics and we
                  broadened to nationwide top-rated for this treatment. */}
              {isBroadened && currentCity && currentCity !== 'All' && (
                <div className="mb-8 bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-amber-900 mb-1">
                      No {service.name} clinics in {currentCity} yet — showing top-rated nationwide.
                    </p>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      Mobile IV providers in some listings will travel beyond their home city — check individual clinic pages for service area.
                    </p>
                  </div>
                  <button
                    onClick={() => selectCity(null)}
                    className="text-xs font-black text-amber-900 uppercase tracking-widest hover:underline whitespace-nowrap"
                  >
                    Clear filter →
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {listings.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 px-6 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <MapPin size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                No {service.name} clinics found in {currentCity}
              </h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Try a nearby city — these hubs all have active {service.name} providers:
              </p>
              <div className="flex flex-wrap gap-2.5 justify-center mb-8 max-w-2xl mx-auto">
                {topCities.slice(0, 6).map((c) => (
                  <button
                    key={c.city}
                    onClick={() => selectCity(c.city)}
                    className="px-4 py-2 rounded-full text-sm font-black bg-wellness-50 text-wellness-700 border-2 border-wellness-100 hover:bg-wellness-600 hover:text-white hover:border-wellness-600 transition-all"
                  >
                    {c.city}
                    <span className="ml-1.5 text-[10px] font-black opacity-70">{c.count}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => selectCity(null)}
                className="text-wellness-600 font-black hover:underline text-sm"
              >
                Or show all {service.name} clinics →
              </button>
            </div>
          )}
        </section>

        {/* View All Clinics CTA */}
        <section className="mb-16 -mt-12 flex justify-center">
          <Link
            href={`/search?q=${encodeURIComponent(service.name)}`}
            className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl"
          >
            View all {service.name} clinics <ArrowRight size={20} />
          </Link>
        </section>

        {content ? (
          <>
            {/* About this treatment */}
            <section className="mb-20">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-8">About {service.name} IV Therapy</h2>
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 md:p-14 space-y-6">
                {content.description.split('\n\n').map((para, i) => (
                  <p key={i} className="text-lg text-slate-600 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </section>

            {/* How it works */}
            <section className="mb-20">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-8">How {service.name} IV Therapy Works</h2>
              <div className="bg-wellness-50 border border-wellness-100 rounded-[3rem] p-10 md:p-14">
                <p className="text-lg text-wellness-900 leading-relaxed">{content.howItWorks}</p>
                {content.primaryIngredients.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-wellness-100">
                    <div className="text-xs font-black uppercase tracking-widest text-wellness-700 mb-3">Primary ingredients</div>
                    <div className="flex flex-wrap gap-2">
                      {content.primaryIngredients.map((ing, i) => (
                        <span key={i} className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-wellness-900 border border-wellness-200">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Benefits */}
            <section className="mb-20">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Benefits of {service.name} IV Therapy</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.benefits.map((benefit, i) => (
                  <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <p className="text-base font-bold text-slate-800 leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* What to expect + Cost */}
            <section className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900 text-white rounded-[3rem] p-10">
                <h3 className="text-2xl font-black tracking-tight mb-4">What to Expect</h3>
                <p className="text-base text-slate-300 leading-relaxed mb-6">{content.whatToExpect}</p>
                <div className="text-xs font-black uppercase tracking-widest text-wellness-400 mb-1">Session duration</div>
                <div className="text-xl font-black">{content.sessionDuration}</div>
              </div>
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
                <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-4">Cost</h3>
                <div className="text-4xl font-black text-wellness-600 mb-4">{content.costRange}</div>
                <p className="text-base text-slate-600 leading-relaxed">{content.costContext}</p>
              </div>
            </section>

            {/* Who it's for + Safety */}
            {(content.whoItsFor || content.safety) && (
              <section className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-8">
                {content.whoItsFor && (
                  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-4">Who it&apos;s for</h3>
                    <p className="text-base text-slate-600 leading-relaxed">{content.whoItsFor}</p>
                  </div>
                )}
                {content.safety && (
                  <div className="bg-amber-50 border border-amber-100 rounded-[3rem] p-10">
                    <h3 className="text-2xl font-black tracking-tight text-amber-900 mb-4">Safety &amp; considerations</h3>
                    <p className="text-base text-amber-900/80 leading-relaxed">{content.safety}</p>
                  </div>
                )}
              </section>
            )}
          </>
        ) : (
          // Fallback for any treatment without dedicated content (shouldn't happen for canonical slugs)
          <section className="py-20 px-10 bg-slate-900 text-white rounded-[3rem] mb-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-800/50 skew-x-12 translate-x-1/4" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl font-black mb-6 tracking-tight">About {service.name} IV Therapy</h2>
              <p className="text-lg text-slate-300 leading-relaxed">
                {service.name} IV therapy delivers a targeted combination of vitamins, minerals, and nutrients directly into your bloodstream for 100% absorption and rapid results. Speak with a participating clinic for details on protocols, pricing, and what to expect.
              </p>
            </div>
          </section>
        )}

        {/* Match Quiz CTA */}
        <QuizCTA 
          className="mb-24" 
          title={`Not sure if ${service.name} is right for you?`}
          subtitle={`Match with the best ${service.name} protocol for your exact health goals, symptoms, and body type.`}
        />

        <FAQSection faqs={faqs} title={`${service.name} IV Therapy FAQ`} />
        
        <CityGrid cities={topCities} title={`Top Cities for ${service.name}`} />
      </main>

      <Footer />
    </div>
  );
}
