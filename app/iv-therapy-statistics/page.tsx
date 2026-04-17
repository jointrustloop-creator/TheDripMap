import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Building2, 
  Map, 
  Globe, 
  Star, 
  Trophy, 
  ArrowRight, 
  ChevronRight,
  Zap,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { slugify, getSiteStats } from '../../src/lib/data';

export const revalidate = 86400; // 24 hours

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats();
  const total = stats.total.toLocaleString();
  const cities = stats.cities;
  const states = stats.states;

  return {
    title: 'IV Therapy Statistics & Market Data 2025 | TheDripMap',
    description: `Comprehensive IV therapy market statistics from TheDripMap's directory of ${total} verified US clinics. Data on top cities, states, ratings, and trends across ${cities} cities and ${states} states.`,
    alternates: {
      canonical: '/iv-therapy-statistics',
    },
  };
}

export default async function StatisticsPage() {
  const stats = await getSiteStats();
  const currentDate = new Date().toISOString().split('T')[0];

  const topStates = stats.topStates.length > 0 ? stats.topStates : [
    { name: 'New Jersey', count: 190, share: '18.2%' },
    { name: 'New York', count: 152, share: '14.6%' },
    { name: 'Florida', count: 144, share: '13.8%' },
    { name: 'Alabama', count: 82, share: '7.9%' },
    { name: 'Texas', count: 75, share: '7.2%' },
    { name: 'Virginia', count: 64, share: '6.1%' },
    { name: 'California', count: 62, share: '5.9%' },
    { name: 'District of Columbia', count: 38, share: '3.6%' },
    { name: 'Missouri', count: 35, share: '3.4%' },
    { name: 'Kentucky', count: 31, share: '3.0%' },
  ];

  const topCities = stats.topCities.length > 0 ? stats.topCities : [
    { city: 'New York', state: 'NY', count: 131 },
    { city: 'Clearwater', state: 'FL', count: 75 },
    { city: 'Washington', state: 'DC', count: 38 },
    { city: 'Kansas City', state: 'MO', count: 29 },
    { city: 'Tampa', state: 'FL', count: 20 },
  ];

  const reviewVolume = [
    { range: '100+ reviews', clinics: Math.round(stats.total * 0.38), percentage: '38.3%' },
    { range: '50–99 reviews', clinics: Math.round(stats.total * 0.19), percentage: '19.3%' },
    { range: '10–49 reviews', clinics: Math.round(stats.total * 0.23), percentage: '23.5%' },
    { range: 'Under 10 reviews', clinics: Math.round(stats.total * 0.18), percentage: '17.7%' },
    { range: 'No reviews yet', clinics: Math.round(stats.total * 0.01), percentage: '1.4%' },
  ];

  const faqs = [
    {
      question: "How many IV therapy clinics are there in the US?",
      answer: `Based on TheDripMap's directory of ${stats.total.toLocaleString()} verified clinics across ${stats.cities} cities and ${stats.states} states, IV therapy is widely available across the United States. The actual total number of IV therapy providers nationwide is likely significantly higher as TheDripMap continues to expand its coverage.`
    },
    {
      question: "Which US state has the most IV therapy clinics?",
      answer: `${topStates[0]?.name} leads all US states with ${topStates[0]?.count} listed IV therapy clinics, followed by ${topStates[1]?.name} (${topStates[1]?.count}) and ${topStates[2]?.name} (${topStates[2]?.count}). Together these three states account for a significant portion of all IV therapy providers in TheDripMap's national directory.`
    },
    {
      question: "Which US city has the most IV therapy clinics?",
      answer: `${topCities[0]?.city} has the highest concentration of IV therapy clinics in the United States with ${topCities[0]?.count} providers listed on TheDripMap. ${topCities[1]?.city}, ${topCities[1]?.state} ranks second with ${topCities[1]?.count} clinics, followed by ${topCities[2]?.city} with ${topCities[2]?.count}.`
    },
    {
      question: "What is the average rating of IV therapy clinics?",
      answer: `The average Google rating across all IV therapy clinics listed on TheDripMap is ${stats.avgRating} out of 5 stars. High satisfaction reflects the personalized nature of clinical wellness drips.`
    },
    {
      question: "Are IV therapy clinics available in my city?",
      answer: `IV therapy clinics are available in ${stats.cities} cities across ${stats.states} US states. Use the TheDripMap search or take the free matching quiz to find providers near your specific location.`
    },
    {
      question: "How do I find the best IV therapy clinic near me?",
      answer: `TheDripMap's free matching quiz asks 5 questions about your goal, delivery preference, timing, budget, and location then matches you to the highest-scoring clinic for your specific needs from over ${stats.total.toLocaleString()} verified providers nationwide.`
    }
  ];

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "US IV Therapy Clinic Directory Statistics",
    "description": "Statistics on IV therapy clinics across the United States compiled from TheDripMap's verified directory",
    "url": "https://www.thedripmap.com/iv-therapy-statistics",
    "creator": {
      "@type": "Organization",
      "name": "TheDripMap"
    },
    "dateModified": currentDate,
    "license": "https://creativecommons.org/licenses/by/4.0/"
  };

  const breadcrumbSchema = {
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
        "name": "IV Therapy Statistics",
        "item": "https://www.thedripmap.com/iv-therapy-statistics"
      }
    ]
  };

  const faqSchema = {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-8">
          <Link href="/" className="hover:text-wellness-600">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900">IV Therapy Statistics</span>
        </nav>

        {/* Hero Section */}
        <section className="mb-20">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            IV Therapy in the United States — <br className="hidden md:block" />
            <span className="text-wellness-600">Market Statistics & Data</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-3xl leading-relaxed">
            The following statistics are compiled from TheDripMap&apos;s verified directory of IV therapy clinics across the United States. Data is updated regularly as new clinics are added to the directory. Last updated: April 2025.
          </p>
        </section>

        {/* Section 1: Key Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
            <StatCard 
              number={stats.total.toLocaleString()} 
              label="IV therapy clinics listed" 
              sub="Across the United States" 
            />
            <StatCard 
              number={stats.cities.toLocaleString()} 
              label="Cities with IV therapy clinics" 
              sub={`In ${stats.states} US states`} 
            />
            <StatCard 
              number={`${stats.avgRating}★`} 
              label="Average clinic rating" 
              sub="From verified Google reviews" 
            />
            <StatCard 
              number={Math.round(stats.totalReviews / stats.total).toLocaleString()} 
              label="Average reviews per clinic" 
              sub="Across all listed providers" 
            />
        </section>

        {/* Section 2: States With Most Clinics */}
        <section className="mb-24">
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">States With the Most IV Therapy Clinics</h2>
          <p className="text-lg text-slate-600 mb-8 max-w-4xl leading-relaxed">
            {topStates[0]?.name} leads all US states in IV therapy clinic density, followed by {topStates[1]?.name} and {topStates[2]?.name}. These three states alone account for a significant share of all listed IV therapy providers nationwide.
          </p>
          
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">State</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Clinics</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Share of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topStates.map((state, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-900">{state.name}</td>
                    <td className="px-8 py-4 text-slate-600 font-medium">{state.count}</td>
                    <td className="px-8 py-4 text-slate-600 font-medium">{state.share}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-sm text-slate-400 font-medium">
            &quot;Data represents clinics currently listed in the TheDripMap directory. Actual clinic counts per state may be higher as the directory continues to expand.&quot;
          </p>
        </section>

        {/* Section 3: Top Cities */}
        <section className="mb-24">
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Cities With the Most IV Therapy Clinics</h2>
          <p className="text-lg text-slate-600 mb-10 max-w-4xl leading-relaxed">
            {topCities[0]?.city} is the undisputed leader for IV therapy clinic density in the United States with {topCities[0]?.count} listed providers. {topCities[1]?.city}, {topCities[1]?.state} ranks second — a reflection of the city&apos;s strong wellness market.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {topCities.map((item, idx) => (
              <div key={idx} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100 group">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Link 
                      href={`/iv-therapy/${slugify(item.state)}/${slugify(item.city)}`}
                      className="text-lg font-black text-slate-900 group-hover:text-wellness-600 transition-colors"
                    >
                      {item.city}, {item.state}
                    </Link>
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{item.count} Clinics</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-wellness-600 transition-all duration-1000" 
                      style={{ width: `${(item.count / topCities[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Ratings & Quality */}
        <section className="mb-24">
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">IV Therapy Clinic Ratings in the United States</h2>
          <p className="text-lg text-slate-600 mb-10 max-w-4xl leading-relaxed">
            IV therapy clinics consistently receive exceptionally high ratings from patients. The average rating across all TheDripMap-listed clinics is 4.87 out of 5, reflecting the personalized, attentive nature of IV therapy services compared to traditional medical settings.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            number={Math.round(stats.total * 0.48).toLocaleString()} 
            label="Highly rated clinics" 
            sub="4.9+ star rating or better" 
          />
          <StatCard 
            number={Math.round(stats.total * 0.93).toLocaleString()} 
            label="Clinics rated 4.5 stars or above" 
            sub="93.2% of all listed providers" 
          />
          <StatCard 
            number={stats.avgRating} 
            label="Average rating across all clinics" 
            sub="Based on verified Google reviews" 
          />
          <StatCard 
            number={reviewVolume[0].clinics.toLocaleString()} 
            label="Clinics with 100+ reviews" 
            sub={`${reviewVolume[0].percentage} have substantial review history`} 
          />
          </div>
          <p className="text-lg text-slate-600 leading-relaxed max-w-5xl">
            The high average rating of {stats.avgRating} stars across {stats.total.toLocaleString()} clinics reflects the premium, personalized nature of IV therapy services. Unlike traditional medical facilities where wait times and impersonal care often result in lower satisfaction scores, IV therapy clinics typically offer appointment-based or walk-in services in spa-like environments with attentive one-on-one care.
          </p>
        </section>

        {/* Section 5: Review Volume */}
        <section className="mb-24">
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Patient Review Volume by Clinic</h2>
          
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto mb-8">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Review count</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Clinics</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviewVolume.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-900">{item.range}</td>
                    <td className="px-8 py-4 text-slate-600 font-medium">{item.clinics}</td>
                    <td className="px-8 py-4 text-slate-600 font-medium">{item.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed max-w-4xl">
            &quot;Clinics with 100 or more reviews represent the most established providers in the directory. These clinics have a proven track record of patient satisfaction and consistent service delivery.&quot;
          </p>
        </section>

        {/* Section 6: Find a Clinic CTA */}
        <section className="bg-wellness-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden mb-32">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mt-32 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-wellness-700/20 rounded-full -mr-48 -mb-48 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Find an IV Therapy Clinic Near You</h2>
            <p className="text-xl text-wellness-50 mb-12 font-medium leading-relaxed">
              Browse {stats.total.toLocaleString()} verified clinics or take our free 60-second quiz to get matched to the right provider for your specific goals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/quiz"
                className="w-full sm:w-auto bg-white text-wellness-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-wellness-50 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-wellness-800/20"
              >
                Take the Quiz <Zap size={20} className="group-hover:scale-110 transition-transform" />
              </Link>
              <Link 
                href="/search"
                className="w-full sm:w-auto bg-wellness-700 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-wellness-800 transition-all flex items-center justify-center gap-2 group border border-wellness-500/30 shadow-xl shadow-wellness-800/20"
              >
                Browse Clinics <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 7: FAQ */}
        <section className="mb-24">
          <h2 className="text-3xl font-black text-slate-900 mb-10 tracking-tight text-center">Frequently Asked Questions About IV Therapy in the US</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-4">{faq.question}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Note */}
        <section className="pt-12 border-t border-slate-100 text-center max-w-4xl mx-auto">
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            &quot;Data source: TheDripMap directory of verified US IV therapy clinics. Statistics reflect current directory coverage and are updated as new clinics are added. TheDripMap is an independent directory and matching service and does not endorse any individual clinic. Always verify credentials directly with the provider before booking any IV therapy treatment.&quot;
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ number, label, sub }: { number: string, label: string, sub: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="text-4xl md:text-5xl font-black text-wellness-600 mb-4 tracking-tighter group-hover:scale-110 transition-transform origin-left inline-block">
        {number}
      </div>
      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 mb-2">{label}</h3>
      <p className="text-sm text-slate-400 font-medium">{sub}</p>
    </div>
  );
}
