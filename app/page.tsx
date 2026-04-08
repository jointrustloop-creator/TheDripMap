import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-5xl mx-auto mb-20">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1]">
              Stop <span className="text-wellness-600">Guessing.</span> <br />
              Get The <span className="underline decoration-wellness-500 decoration-4 underline-offset-4">Exact</span> IV <br />
              You Need.
            </h1>
            
            <p className="text-2xl md:text-3xl text-slate-600 mb-12 font-bold tracking-tight max-w-3xl mx-auto leading-tight">
              We&apos;ve analyzed {stats.totalListings} clinics across {stats.totalCities} cities so you don&apos;t have to. Get matched to your perfect drip in 60 seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                href="/quiz"
                className="w-full sm:w-auto bg-wellness-600 text-white px-16 py-8 rounded-2xl font-black text-2xl hover:bg-wellness-700 transition-all shadow-[0_20px_50px_rgba(234,88,12,0.3)] flex items-center justify-center gap-3 uppercase tracking-tighter italic"
              >
                <Zap size={28} fill="currentColor" />
                Find My Match
              </Link>
              <Link 
                href="/search"
                className="w-full sm:w-auto bg-white text-slate-900 border-[6px] border-slate-900 px-16 py-8 rounded-2xl font-black text-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3 uppercase tracking-tighter italic"
              >
                <Search size={28} strokeWidth={4} />
                Browse All
              </Link>
            </div>

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

      {/* Human Connection Section */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200"
                alt="Happy people at wellness clinic"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
              <div className="absolute bottom-10 left-10 right-10">
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                  <p className="text-slate-900 font-bold italic">&quot;The best IV experience I&apos;ve ever had. The matching quiz found me a clinic that specialized exactly in what I needed for my marathon recovery.&quot;</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-wellness-100 rounded-full flex items-center justify-center text-wellness-600 font-bold">JD</div>
                    <div>
                      <div className="text-sm font-black text-slate-900">Jessica D.</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Verified Patient</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight leading-tight">
                Wellness is Better <br />
                <span className="text-wellness-600">When It&apos;s Personal.</span>
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-10">
                We believe that IV therapy isn&apos;t just about the vitamins—it&apos;s about the care, the environment, and the results. That&apos;s why we only partner with clinics that prioritize the human experience.
              </p>
              <div className="space-y-6">
                {[
                  { title: 'Group Friendly', desc: 'Find clinics that offer group drips for bridal parties, corporate events, or friends.' },
                  { title: 'Luxury Environments', desc: 'Browse lounges designed for relaxation with massage chairs and premium amenities.' },
                  { title: 'Expert Care', desc: 'Every provider in our network is vetted for medical supervision and licensed administration.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-6 h-6 bg-wellness-100 rounded-full flex items-center justify-center text-wellness-600 shrink-0 mt-1">
                      <Zap size={14} fill="currentColor" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900">{item.title}</h4>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
