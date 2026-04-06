import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Zap, 
  Search, 
  MapPin, 
  Droplets, 
  Star, 
  Clock, 
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
import { getAllCities, getListingStats, getBlogPosts } from '../src/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "IV Therapy Near Me — Find Top Rated Clinics | TheDripMap",
  description: "Find and compare the best IV therapy clinics near you. Browse providers across the US or get matched to your perfect drip in 60 seconds.",
  alternates: {
    canonical: '/',
  },
};

export const revalidate = 3600;

export default async function HomePage() {
  const cities = await getAllCities();
  const stats = await getListingStats();
  const blogPosts = await getBlogPosts();
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
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-wellness-100 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-30 animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold mb-8 border border-wellness-100">
              <Sparkles size={16} />
              <span>The Nation's #1 IV Therapy Directory</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1]">
              Find the Right IV Therapy — <span className="text-wellness-600">Without Guessing.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-12 leading-relaxed max-w-2xl mx-auto">
              We've analyzed {stats.totalListings} clinics across {stats.totalCities} cities. Get matched to your perfect drip in 60 seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/quiz"
                className="w-full sm:w-auto bg-wellness-600 text-white px-10 py-5 rounded-[2rem] font-bold text-lg hover:bg-wellness-700 transition-all shadow-xl shadow-wellness-100 flex items-center justify-center gap-2 group"
              >
                <Zap size={20} className="group-hover:scale-110 transition-transform" />
                Get Matched Now
              </Link>
              <Link 
                href="/search"
                className="w-full sm:w-auto bg-white text-slate-900 border-2 border-slate-100 px-10 py-5 rounded-[2rem] font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Search size={20} />
                Browse All Clinics
              </Link>
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
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">How It Works</h2>
            <p className="text-lg text-slate-500">Your journey to optimal wellness in three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Share Your Goals', desc: 'Tell us how you feel and what you want to achieve through our quick diagnostic quiz.' },
              { step: '02', title: 'Get Matched', desc: 'Our algorithm analyzes local providers to find the best clinical fit for your specific needs.' },
              { step: '03', title: 'Book & Recover', desc: 'Connect directly with your chosen clinic and start your journey to feeling your best.' }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-8xl font-black text-slate-50 absolute -top-10 -left-4 z-0">{item.step}</div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why TheDripMap */}
      <section className="py-24 px-6 bg-wellness-900 text-white rounded-[4rem] mx-6 my-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-wellness-800/50 skew-x-12 translate-x-1/4" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight leading-tight">
                The Most Trusted Resource in <span className="text-wellness-400">IV Wellness.</span>
              </h2>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-4xl font-black text-wellness-400 mb-2">{stats.totalListings}+</div>
                  <div className="text-sm font-bold text-wellness-200 uppercase tracking-widest">Verified Clinics</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-wellness-400 mb-2">{stats.totalCities}</div>
                  <div className="text-sm font-bold text-wellness-200 uppercase tracking-widest">Cities Covered</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-wellness-400 mb-2">100%</div>
                  <div className="text-sm font-bold text-wellness-200 uppercase tracking-widest">Clinical Focus</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-wellness-400 mb-2">24/7</div>
                  <div className="text-sm font-bold text-wellness-200 uppercase tracking-widest">Support Access</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-10 rounded-[3rem] border border-white/10">
              <h3 className="text-2xl font-bold mb-6">Own an IV clinic?</h3>
              <p className="text-wellness-100 mb-8 leading-relaxed">
                Join {stats.totalListings} other providers and reach thousands of patients searching for IV therapy in your city every month.
              </p>
              <Link 
                href="/for-clinics"
                className="inline-flex items-center gap-2 bg-white text-wellness-900 px-8 py-4 rounded-2xl font-bold hover:bg-wellness-50 transition-all"
              >
                Claim Your Listing <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

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
