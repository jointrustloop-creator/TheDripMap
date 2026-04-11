import React from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Search, 
  Droplets, 
  ShieldCheck, 
  ArrowRight,
  Activity,
  Heart,
  Sparkles,
  Dumbbell
} from 'lucide-react';
import { Navbar } from '../src/components/Navbar';
import { Footer } from '../src/components/Footer';
import { CityGrid } from '../src/components/CityGrid';
import { BlogCard } from '../src/components/BlogCard';
import { ClinicianSection } from '../src/components/ClinicianSection';
import { HowItWorks } from '../src/components/HowItWorks';
import { DripBackground } from '../src/components/DripBackground';
import { QuickMatch } from '../src/components/QuickMatch';
import { TrustSignals } from '../src/components/TrustSignals';
import { getAllCities, getListingStats, getBlogPosts } from '../src/lib/data';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "IV Therapy Near Me — Find Top Rated Clinics | TheDripMap",
  description: "Find and compare the best IV therapy clinics near you. Browse providers across the US or get matched to your perfect drip in 60 seconds.",
  alternates: {
    canonical: '/',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const cities = await getAllCities();
  const stats = await getListingStats();
  const blogPosts = await getBlogPosts();
  const isLive = isSupabaseConfigured();
  const latestPosts = blogPosts.slice(0, 3);
  const topCities = cities.slice(0, 12);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://thedripmap.com"
      }
    ]
  };

  const services = [
    { name: 'NAD+ Plus', slug: 'nad-plus', icon: <Activity size={24} /> },
    { name: 'Hangover', slug: 'hangover', icon: <Heart size={24} /> },
    { name: 'Immune Support', slug: 'immune-support', icon: <ShieldCheck size={24} /> },
    { name: 'Beauty Glow', slug: 'beauty-glow', icon: <Sparkles size={24} /> },
    { name: 'Weight Loss', slug: 'weight-loss', icon: <Activity size={24} /> },
    { name: 'Hydration', slug: 'hydration', icon: <Droplets size={24} /> },
    { name: 'Recovery', slug: 'recovery', icon: <Dumbbell size={24} /> },
    { name: 'Myers Cocktail', slug: 'myers-cocktail', icon: <Zap size={24} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-40 px-6 overflow-hidden bg-white">
        <DripBackground />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-5xl mx-auto mb-20">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1] drop-shadow-sm">
              Stop <span className="text-wellness-600 relative">
                Guessing.
                <span className="absolute -inset-1 bg-wellness-100/30 blur-2xl -z-10 rounded-full" />
              </span> <br />
              Get The <span className="underline decoration-wellness-500 decoration-4 underline-offset-4">Exact</span> IV <br />
              You Need.
            </h1>
            
            <p className="text-2xl md:text-3xl text-slate-600 mb-16 font-bold tracking-tight max-w-3xl mx-auto leading-tight">
              We&apos;ve analyzed {stats.totalListings} clinics across {stats.totalCities} cities so you don&apos;t have to. Get matched to your perfect drip in 60 seconds.
            </p>
            
            <QuickMatch />

            <div className="mt-16 flex flex-col items-center gap-4">
              {isLive ? (
                <div className="inline-flex items-center gap-3 text-slate-400 font-black text-xs uppercase tracking-[0.3em]">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                  {stats.totalListings > 0 ? `${stats.totalListings} Clinics Verified` : 'Live Database Connected'}
                </div>
              ) : (
                <div className="inline-flex items-center gap-3 text-amber-500 font-black text-xs uppercase tracking-[0.3em]">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  Demo Mode (Mock Data)
                </div>
              )}
              
              {stats.error && (
                <div className="bg-red-50 text-red-600 px-6 py-3 rounded-xl text-sm font-bold border border-red-100 max-w-lg">
                  Connection Issue: {stats.error}
                </div>
              )}
            </div>
          </div>

          {/* Path Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Link href="/quiz" className="group relative bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-wellness-200 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-wellness-50 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-wellness-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-wellness-100">
                  <Zap size={28} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4">The Smart Match</h3>
                <p className="text-slate-500 leading-relaxed mb-8">
                  Not sure which IV is right for you? Our clinical algorithm matches you based on goals, symptoms, and budget.
                </p>
                <div className="flex items-center gap-2 text-wellness-600 font-bold">
                  Start Quiz <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/search" className="group relative bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 mb-8 shadow-lg">
                  <Search size={28} />
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Browse Directory</h3>
                <p className="text-slate-400 leading-relaxed mb-8">
                  Already know what you need? Filter through {stats.totalListings} top-rated clinics by city, service, or price.
                </p>
                <div className="flex items-center gap-2 text-white font-bold">
                  Explore Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Browse By Drip Type */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Browse By Drip Type</h2>
            <p className="text-lg text-slate-500">Select a service to find specialized providers near you.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service, idx) => (
              <Link 
                key={idx}
                href={`/iv-therapy/treatment/${service.slug}`}
                className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-wellness-200 hover:shadow-xl transition-all text-center group"
              >
                <div className="w-12 h-12 bg-wellness-50 rounded-xl flex items-center justify-center text-wellness-600 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <span className="font-bold text-slate-900 group-hover:text-wellness-600 transition-colors">{service.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Cities Grid */}
      <CityGrid cities={topCities} />

      {/* How It Works */}
      <HowItWorks />

      {/* Trust Signals Section */}
      <TrustSignals />

      {/* For Clinicians Section */}
      <ClinicianSection stats={stats} />

      {/* Blog Preview */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Latest from the Blog</h2>
              <p className="text-lg text-slate-500 leading-relaxed">
                Expert guides on IV therapy, wellness protocols, and local health insights.
              </p>
            </div>
            <Link 
              href="/blog"
              className="flex items-center gap-2 text-wellness-600 font-bold hover:text-wellness-700 transition-colors"
            >
              View All Articles <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestPosts.map((post, idx) => (
              <BlogCard key={idx} post={post} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
