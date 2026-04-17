import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { 
  MapPin, 
  Zap, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Star,
  Users,
  Truck,
  ShieldCheck
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
  searchParams: Promise<{
    service?: string;
  }>;
}

export async function generateStaticParams() {
  const cities = await getAllCities();
  return cities
    .filter(c => c.state && c.city)
    .map((c) => ({
      state: slugify(c.state),
      city: slugify(c.city),
    }));
}

export async function generateMetadata({ params, searchParams }: CityPageProps): Promise<Metadata> {
  const { state, city } = await params;
  const cities = await getAllCities();
  const cityInfo = cities.find(c => 
    slugify(c.city) === city && 
    (slugify(c.state) === state || c.stateAbbr.toLowerCase() === state)
  );
  
  if (!cityInfo) return { title: 'City Not Found' };

  const cityName = cityInfo.city;
  const listings = await getListingsByCity(cityName);
  const count = listings.length;

  const title = `IV Therapy in ${cityName}, ${cityInfo.stateAbbr} — ${count} Clinics | TheDripMap`;
  const description = `Find and compare ${count} IV therapy clinics in ${cityName}, ${state}. Read reviews, compare prices, and book top-rated hydration and wellness drips.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/iv-therapy/${state}/${city}`,
    },
    openGraph: {
      title,
      description,
      url: `https://thedripmap.com/iv-therapy/${state}/${city}`,
      type: 'website',
      images: [
        {
          url: 'https://thedripmap.com/og-image.png',
          width: 1200,
          height: 630,
          alt: `IV Therapy in ${cityName}, ${state}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://thedripmap.com/og-image.png'],
    },
  };
}

export default async function CityPage({ params, searchParams }: CityPageProps) {
  const { state, city } = await params;
  const { service } = await searchParams;
  
  const cities = await getAllCities();
  const cityInfo = cities.find(c => 
    slugify(c.city) === city && 
    (slugify(c.state) === state || c.stateAbbr.toLowerCase() === state)
  );
  
  if (!cityInfo) notFound();

  // Redirect /us/ to correct state code if possible
  if (state.toLowerCase() === 'us' && cityInfo.state && cityInfo.state.toLowerCase() !== 'us') {
    redirect(`/iv-therapy/${slugify(cityInfo.state)}/${city}`);
  }

  const cityName = cityInfo.city;
  const stateName = cityInfo.state;
  let listings = await getListingsByCity(cityName);

  if (service) {
    listings = listings.filter(l => 
      l.specialties.some(s => s.toLowerCase().includes(service.toLowerCase())) ||
      l.name.toLowerCase().includes(service.toLowerCase()) ||
      l.description.toLowerCase().includes(service.toLowerCase())
    );
  }
  
  // Popular Drips logic
  const serviceCounts: Record<string, number> = {};
  listings.forEach(l => {
    const servicesList = Array.isArray(l.services) ? l.services : [];
    servicesList.forEach((s: string | { name: string }) => {
      const name = typeof s === 'string' ? s : (s.name || '');
      if (name) {
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
      }
    });
  });
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const commonServicesText = topServices.length > 0 
    ? topServices.join(', ') 
    : 'NAD+ therapy, hangover recovery, and immune support';

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
    },
    {
      question: `What is the average cost of IV therapy in ${cityName}?`,
      answer: `On average, residents in ${cityName} can expect to pay around $225 for a standard wellness drip. Specialized treatments like NAD+ or high-dose Vitamin C may cost more, while basic hydration packages are often available at lower price points.`
    },
    {
      question: `Are there mobile IV therapy services in ${cityName}?`,
      answer: `Absolutely. ${cityName} has a high concentration of mobile-first IV providers. These services are particularly popular for group events, office wellness days, or recovery at home after a long night or intense workout.`
    },
    {
      question: `Do I need an appointment for IV therapy in ${cityName}?`,
      answer: `While some clinics in ${cityName} accept walk-ins, we highly recommend booking an appointment. This ensures a nurse is available and allows the clinic to prepare your specific infusion in advance.`
    },
    {
      question: `What should I look for when choosing an IV therapy clinic in ${cityName}?`,
      answer: `When selecting a provider in ${cityName}, prioritize clinics with licensed medical staff (RNs or NPs), positive patient reviews, and transparent pricing. Ensure they conduct a brief medical screening before your first treatment.`
    },
    {
      question: `Is IV therapy safe in ${cityName}?`,
      answer: `Yes, IV therapy is a safe and common wellness procedure in ${cityName} when performed by trained medical professionals. All clinics listed on TheDripMap follow standard medical protocols for intravenous administration.`
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
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
      "reviewCount": listings.length > 0 
        ? listings.reduce((acc, curr) => acc + (curr.reviewCount || 0), 0).toString()
        : "12"
    }
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": listings.map((l, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `https://thedripmap.com/provider/${l.slug || slugify(l.name)}`,
      "name": l.name
    }))
  };

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

  // Calculate real stats for the city
  const avgRating = listings.length > 0 
    ? (listings.reduce((acc, l) => acc + (l.rating || 0), 0) / listings.length).toFixed(1)
    : "4.8";
  
  const totalReviews = listings.reduce((acc, l) => acc + (l.reviewCount || 0), 0);
  
  const mobileProviders = listings.filter(l => 
    l.mobile_service === true || 
    l.type === 'Mobile' || 
    l.type === 'Both'
  ).length;
  
  const priceMap: Record<string, number> = { '$': 149, '$$': 199, '$$$': 249, '$$$$': 299 };
  const avgPrice = listings.length > 0
    ? Math.round(listings.reduce((acc, l) => acc + (priceMap[l.priceRange || l.price_range || '$$'] || 199), 0) / listings.length)
    : 175;

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
              <span>Top Rated Providers in {cityName}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Best {service ? <span className="text-wellness-600">{service} </span> : ''}IV Therapy in <span className="text-wellness-600">{cityName}, {stateName}</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-10">
              Compare {service ? listings.length : (cityInfo.count || listings.length)} top-rated {service ? service + ' ' : ''}IV therapy clinics and mobile services in {cityName}. Find the perfect hydration, energy, or recovery drip today.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <CheckCircle2 size={18} className="text-wellness-600" />
                <span className="text-sm font-bold text-slate-700">Medical Supervision</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <CheckCircle2 size={18} className="text-wellness-600" />
                <span className="text-sm font-bold text-slate-700">Patient Reviews</span>
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
              <Clock size={16} /> Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.length > 0 ? (
              listings.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <MapPin size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No clinics found in {cityName} yet</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  We&apos;re currently expanding our network in {stateName}. Check out nearby cities or try a different search.
                </p>
                <Link 
                  href="/search"
                  className="inline-flex items-center gap-2 bg-wellness-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-200"
                >
                  Browse All Locations <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Local Content Sections */}
        <section className="mb-24 space-y-20">
          {/* Opening Section */}
          <div className="prose prose-slate max-w-none">
            <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">IV Therapy in {cityName}</h2>
            <div className="text-lg text-slate-600 leading-relaxed space-y-6">
              <p>
                IV therapy in {cityName} has grown significantly over the past few years, with {listings.length} clinics now serving {cityName} residents across {stateName}. This surge in popularity reflects a broader trend toward proactive wellness and rapid recovery solutions. Whether you are a busy professional in the heart of {cityName} or a local athlete looking to optimize performance, intravenous hydration offers a direct path to cellular replenishment.
              </p>
              <p>
                The local landscape in {cityName} is diverse, featuring everything from high-end wellness boutiques to specialized medical clinics. Most providers in the area focus on a holistic approach, ensuring that each drip is tailored to the individual&apos;s needs. Common services found across {cityName} include {commonServicesText}. These treatments are designed to address a variety of concerns, from seasonal allergies and immune support to chronic fatigue and anti-aging protocols.
              </p>
              <p>
                As {cityName} continues to embrace these advanced health services, the quality and accessibility of care have reached new heights. Patients can now choose between relaxing in-clinic environments or the convenience of mobile services that bring the treatment directly to their doorstep. The medical community here has set high standards for safety and efficacy, making it one of the premier locations for elective IV treatments in the region.
              </p>
            </div>
          </div>

          {/* What to Expect Section */}
          <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-wellness-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-10 tracking-tight">What to Expect from Your Session in {cityName}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="text-lg text-slate-300 leading-relaxed space-y-6">
                  <p>
                    When you book an IV therapy session in {cityName}, you can expect a professional and streamlined experience. Most sessions begin with a brief medical consultation to ensure the chosen treatment is safe and appropriate for you. The actual infusion typically takes between 45 to 60 minutes, during which you can relax, work, or even catch up on your favorite show.
                  </p>
                  <p>
                    Price ranges in {cityName} are competitive, with standard wellness drips starting around ${avgPrice} and more complex formulas reaching up to $350. Mobile IV therapy is particularly popular in {cityName}, with {mobileProviders} providers offering convenient alternatives for those with busy schedules.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white/5 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 bg-wellness-500/20 rounded-xl flex items-center justify-center text-wellness-400 mb-4">
                      <Star size={20} fill="currentColor" />
                    </div>
                    <div className="text-white font-black text-2xl md:text-3xl mb-1">{avgRating}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Avg. Rating</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 bg-wellness-500/20 rounded-xl flex items-center justify-center text-wellness-400 mb-4">
                      <Users size={20} />
                    </div>
                    <div className="text-white font-black text-2xl md:text-3xl mb-1">{totalReviews.toLocaleString()}+</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Reviews</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 bg-wellness-500/20 rounded-xl flex items-center justify-center text-wellness-400 mb-4">
                      <Truck size={20} />
                    </div>
                    <div className="text-white font-black text-2xl md:text-3xl mb-1">{mobileProviders}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mobile Clinics</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 bg-wellness-500/20 rounded-xl flex items-center justify-center text-wellness-400 mb-4">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="text-white font-black text-2xl md:text-3xl mb-1">${avgPrice}+</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Starting Price</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Drips Section */}
          <div>
            <h3 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Popular Drips in {cityName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topServices.length > 0 ? topServices.map((s, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-wellness-50 rounded-xl flex items-center justify-center text-wellness-600 mb-6">
                    <Zap size={24} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{s}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    One of the most requested treatments in {cityName}, known for its effective results and high patient satisfaction. Local clinics report high demand for this specific protocol due to its comprehensive nutrient profile.
                  </p>
                </div>
              )) : (
                <p className="col-span-full text-slate-500 italic">Data on specific popular drips is currently being updated for {cityName}.</p>
              )}
            </div>
            <p className="mt-10 text-lg text-slate-600 leading-relaxed">
              The high demand for these specific treatments in {cityName} highlights the community&apos;s focus on targeted wellness. Whether it&apos;s the energy-boosting properties of NAD+ or the rapid rehydration of a recovery drip, {cityName} residents prioritize efficiency and quality in their health choices. Many local providers also offer custom blends, allowing you to fine-tune your infusion based on your unique physiological needs.
            </p>
          </div>
        </section>

        <FAQSection faqs={faqs} title={`IV Therapy in ${cityName} FAQ`} />
        
        {nearbyCities.length > 0 && (
          <section className="py-12 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Also serving:</span>
              {nearbyCities.map((c, i) => (
                <React.Fragment key={`${c.city}-${c.state}`}>
                  <Link 
                    href={`/iv-therapy/${slugify(c.state)}/${slugify(c.city)}`}
                    className="text-xs font-bold text-wellness-600 hover:text-wellness-700 transition-colors"
                  >
                    {c.city}
                  </Link>
                  {i < nearbyCities.length - 1 && <span className="text-slate-300">·</span>}
                </React.Fragment>
              ))}
            </div>
          </section>
        )}

        {nearbyCities.length > 0 && (
          <NearbyCities cities={nearbyCities} currentState={stateName} />
        )}
      </main>

      <Footer />
    </div>
  );
}
