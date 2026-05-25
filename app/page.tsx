import { ResilientImage } from '../src/components/ResilientImage';
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
  Dumbbell,
  Target,
  Clock,
  MapPin
} from 'lucide-react';
import { Navbar } from '../src/components/Navbar';
import LiveStatsBar from '../src/components/LiveStatsBar';
import { Footer } from '../src/components/Footer';

export const revalidate = 60; // Reduce from 86400 (24h) to 60s for faster updates during iteration

import { BlogCard } from '../src/components/BlogCard';
import { ClinicianSection } from '../src/components/ClinicianSection';
import { HowItWorks } from '../src/components/HowItWorks';
import { QuickMatch } from '../src/components/QuickMatch';
import { TrustSignals } from '../src/components/TrustSignals';
import { getBlogPosts, getSiteStats, getPopularCities } from '../src/lib/data';
import { Metadata } from 'next';
import { cn } from '../src/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats();
  const title = `IV Therapy Clinics Near Me — Find & Compare ${stats.total}+ Providers | TheDripMap`;
  const description = `Find the best IV therapy clinic near you. Compare ${stats.total}+ verified providers across the US and Canada. Filter by treatment, price, and location. Book in 30 seconds.`;
  
  return {
    title,
    description,
    alternates: {
      canonical: 'https://www.thedripmap.com',
    },
    openGraph: {
      title,
      description,
      url: 'https://www.thedripmap.com',
      siteName: 'TheDripMap',
      images: [
        {
          url: 'https://www.thedripmap.com/og-image.png',
          width: 1200,
          height: 630,
          alt: 'TheDripMap - Find Your Perfect IV Therapy Match',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      description,
      images: ['https://www.thedripmap.com/og-image.png'],
    },
  };
}

export default async function HomePage() {
  const stats = await getSiteStats();
  const blogPosts = await getBlogPosts();
  const popularCities = await getPopularCities();
  const latestPosts = blogPosts.slice(0, 3);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.thedripmap.com"
      }
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TheDripMap",
    "url": "https://www.thedripmap.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.thedripmap.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TheDripMap",
    "url": "https://www.thedripmap.com",
    "logo": "https://www.thedripmap.com/logo.png",
    "sameAs": [
      "https://www.facebook.com/thedripmap",
      "https://www.instagram.com/thedripmap",
      "https://twitter.com/thedripmap"
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
      <LiveStatsBar stats={{
        totalClinics: stats.total,
        totalCities: stats.cities,
        growth: "Weekly"
      }} />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-40 px-6 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <ResilientImage
            src="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-spa-reception-recliners.jpg"
            fallbackSrc="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2000&auto=format&fit=crop"
            alt="Professional IV Therapy Clinic"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Stronger overlay on mobile portrait so the white headline stays readable
              even when the hero image gets aggressively cropped */}
          <div className="absolute inset-0 bg-slate-950/75 md:bg-slate-950/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center max-w-5xl mx-auto mb-20">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1] drop-shadow-xl">
              Get Matched to the Right <br />
              <span className="text-wellness-400 relative">
                IV Therapy Clinic in 30 Seconds.
                <span className="absolute -inset-1 bg-wellness-400/20 blur-2xl -z-10 rounded-full" />
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-200 mb-10 font-medium tracking-tight max-w-3xl mx-auto leading-relaxed">
              Not all IV therapy is the same — we match you based on your exact needs, location, and budget.
            </p>

            <QuickMatch />
            
            <div className="mt-10 flex flex-col items-center gap-2">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] font-bold text-slate-100">
                <span className="flex items-center gap-1.5"><span className="text-wellness-400 font-bold">✓</span> Trusted by patients nationwide</span>
                <span className="flex items-center gap-1.5"><span className="text-wellness-400 font-bold">✓</span> Clinical grade provider match</span>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-black text-white/60 uppercase tracking-[0.2em] mt-4">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full">{stats.total} Verified Clinics</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full">{stats.cities} US & Canadian Cities</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Path Section */}
      <section className="py-24 px-6 bg-white relative -mt-20 z-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 text-center mb-16 tracking-tight">The Smarter Way to Find IV Therapy Clinics</h2>

          {/* Single primary CTA — Smart Match. Browse Directory demoted to a secondary
              text link below so the visitor has one clear next action, not two competing ones. */}
          <div className="max-w-3xl mx-auto mb-12">
            <Link href="/quiz" className="group relative block bg-white p-10 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-wellness-200 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-wellness-50 rounded-bl-[5rem] -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-wellness-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-wellness-100">
                  <Zap size={28} />
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">The Smart Match</h3>
                <p className="text-slate-500 leading-relaxed mb-8 text-lg max-w-xl">
                  Not sure which IV is right for you? Our clinical algorithm matches you based on goals, symptoms, location, and budget — in 60 seconds.
                </p>
                <div className="inline-flex items-center gap-2 bg-wellness-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-wellness-700 transition-colors">
                  Start the 60-Second Quiz <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
          <div className="text-center mb-24">
            <Link href="/search" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-wellness-600 transition-colors">
              <Search size={14} />
              Or browse all {stats.total} clinics directly →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-wellness-50 rounded-xl flex items-center justify-center text-wellness-600 shrink-0">
                <Target size={20} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-900 text-sm">Goal-Based Matching</h4>
                <p className="text-slate-500 text-xs leading-relaxed">We match on what you need, not just who&apos;s closest</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-wellness-50 rounded-xl flex items-center justify-center text-wellness-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-900 text-sm">{stats.total} Top-Rated Clinics</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{stats.total} verified IV therapy providers</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-wellness-50 rounded-xl flex items-center justify-center text-wellness-600 shrink-0">
                <Clock size={20} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-900 text-sm">Results in 60 Seconds</h4>
                <p className="text-slate-500 text-xs leading-relaxed">No browsing. No guessing. Just your best match.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse By Drip Type */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">Browse By Drip Type</h2>
            <p className="text-xl text-slate-500">Select a service to find specialized providers near you.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service, idx) => (
              <Link
                key={idx}
                href={`/treatments/${service.slug}`}
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

      {/* Helpful Guides — internal-link buildout to /guide/* */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">Before You Book</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Plain-English answers to the questions every first-time IV therapy patient asks.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/guide/iv-therapy-cost-guide"
              className="group bg-gradient-to-br from-slate-50 to-white p-10 rounded-[2rem] border border-slate-100 hover:border-wellness-300 hover:shadow-xl transition-all"
            >
              <div className="text-xs font-black uppercase tracking-[0.2em] text-wellness-600 mb-3">Reference Guide</div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-wellness-600 transition-colors">IV Therapy Cost Guide</h3>
              <p className="text-slate-500 text-sm leading-relaxed">What to expect to pay for hangover, NAD+, Myers Cocktail, and recovery drips across US and Canadian metros.</p>
            </Link>
            <Link
              href="/guide/how-to-choose-iv-therapy-clinic"
              className="group bg-gradient-to-br from-slate-50 to-white p-10 rounded-[2rem] border border-slate-100 hover:border-wellness-300 hover:shadow-xl transition-all"
            >
              <div className="text-xs font-black uppercase tracking-[0.2em] text-wellness-600 mb-3">Reference Guide</div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-wellness-600 transition-colors">How to Choose a Clinic</h3>
              <p className="text-slate-500 text-sm leading-relaxed">The 7 things every reputable IV therapy clinic should have — staff credentials, ingredients, screening, pricing.</p>
            </Link>
            <Link
              href="/guide/first-time-iv-therapy-what-to-expect"
              className="group bg-gradient-to-br from-slate-50 to-white p-10 rounded-[2rem] border border-slate-100 hover:border-wellness-300 hover:shadow-xl transition-all"
            >
              <div className="text-xs font-black uppercase tracking-[0.2em] text-wellness-600 mb-3">Reference Guide</div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-wellness-600 transition-colors">First-Time IV Therapy</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Step-by-step walkthrough of a typical first IV therapy session — from intake to needle, infusion, and after.</p>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 items-center justify-center">
            <span className="text-sm font-bold text-slate-500">More guides:</span>
            <Link href="/guide/mobile-iv-therapy-vs-clinic" className="text-sm font-bold text-wellness-600 hover:text-wellness-700">Mobile vs in-clinic</Link>
            <span className="text-slate-300">·</span>
            <Link href="/guide/iv-therapy-vs-oral-supplements" className="text-sm font-bold text-wellness-600 hover:text-wellness-700">IV vs oral supplements</Link>
          </div>
        </div>
      </section>

      {/* Social Proof Images */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
              <ResilientImage 
                src="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-two-women.jpg"
                fallbackSrc="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1920&auto=format&fit=crop"
                alt="Friends receiving IV therapy"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-10 left-10 text-white">
                <span className="font-bold text-sm uppercase tracking-widest text-wellness-400 mb-2 block">Relatable Experience</span>
                <h3 className="text-3xl font-black tracking-tight">IV Therapy is Better with Friends</h3>
              </div>
            </div>
            <div className="relative h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
              <ResilientImage 
                src="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-man-lounge.jpg"
                fallbackSrc="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1920&auto=format&fit=crop"
                alt="Man relaxing during IV therapy"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-10 left-10 text-white">
                <span className="font-bold text-sm uppercase tracking-widest text-wellness-400 mb-2 block">Recovery Focused</span>
                <h3 className="text-3xl font-black tracking-tight">Expert Local Clinics</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks totalListings={stats.total} />

      {/* Mobile IV Section */}
      <section className="py-32 px-6 bg-slate-900 overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 text-center md:text-left">
            <span className="text-wellness-400 font-bold text-sm uppercase tracking-[0.4em] mb-4 block">Convenience Redefined</span>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight leading-[1.1]">
              The Hospital Experience, <br />
              <span className="text-wellness-400">In Your Living Room.</span>
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-xl leading-relaxed">
              We match you with top-rated mobile IV services that bring hydration, vitamins, and recovery directly to your door.
            </p>
            <Link 
              href="/search"
              className="inline-flex items-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all shadow-xl"
            >
              Find Mobile IV <ArrowRight size={20} />
            </Link>
          </div>
          <div className="flex-1 w-full">
            <div className="relative h-[500px] md:h-[650px] rounded-[4rem] overflow-hidden shadow-2xl skew-y-3 md:skew-y-0 md:rotate-3 hover:rotate-0 transition-transform duration-700">
              <ResilientImage 
                src="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-woman-home.jpg"
                fallbackSrc="https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=2070&auto=format&fit=crop"
                alt="Woman receiving IV therapy at home"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Popular Cities Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">Popular Cities</h2>
            <p className="text-xl text-slate-500">Find the best local IV therapy providers and mobile services in your area.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              ...popularCities.map(city => ({ 
                name: city.name, 
                slug: city.slug, 
                subtitle: city.count ? `${city.count} verified ${city.name.includes('Toronto') ? 'providers' : 'clinics'}` : 'View Clinics', 
                isAll: false 
              })),
              { name: 'Browse All Cities', slug: '', subtitle: '', isAll: true }
            ].map((city, idx) => (
              <Link 
                key={idx}
                href={city.isAll ? '/cities' : `/cities/${city.slug}`}
                className={cn(
                  "p-8 rounded-[2rem] border transition-all text-center group flex flex-col items-center justify-center min-h-[160px]",
                  city.isAll 
                    ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800" 
                    : "bg-white border-slate-100 hover:border-wellness-200 hover:shadow-xl"
                )}
              >
                {!city.isAll && (
                  <div className="w-10 h-10 bg-wellness-50 rounded-xl flex items-center justify-center text-wellness-600 mb-4 group-hover:scale-110 transition-transform">
                    <MapPin size={20} />
                  </div>
                )}
                <span className={cn(
                  "font-black tracking-tight",
                  city.isAll ? "text-lg" : "text-slate-900 group-hover:text-wellness-600 transition-colors"
                )}>
                  {city.name}
                </span>
                {!city.isAll && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                    {city.subtitle || 'View Clinics'}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <TrustSignals stats={{
        totalListings: stats.total,
        totalCities: stats.cities,
        totalStates: stats.states,
        avgRating: parseFloat(stats.avgRating)
      }} />

      {/* Blog Preview */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">Latest from the Blog</h2>
              <p className="text-xl text-slate-500 leading-relaxed">
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

      {/* Bottom CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ResilientImage 
            src="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-woman-relaxing.jpg"
            fallbackSrc="https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=2070&auto=format&fit=crop"
            alt="Woman relaxing"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tight leading-[1.1]">
            Stop Guessing. <br />
            <span className="text-wellness-400 italic">Start Healing.</span>
          </h2>
          <p className="text-2xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Join the thousands of patients who found their perfect IV therapy clinic on TheDripMap.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/quiz"
              className="w-full sm:w-auto bg-wellness-600 text-white px-12 py-6 rounded-2xl font-black text-xl hover:bg-wellness-700 transition-all shadow-2xl flex items-center justify-center gap-3"
            >
              Get My Match Now <ArrowRight size={24} />
            </Link>
            <Link 
              href="/search"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-12 py-6 rounded-2xl font-black text-xl transition-all flex items-center justify-center border border-white/20"
            >
              Browse Clinics
            </Link>
          </div>
        </div>
      </section>

      {/* For Clinicians Section */}
      <ClinicianSection stats={{
        totalListings: stats.total,
        totalCities: stats.cities,
        totalStates: stats.states,
        avgRating: parseFloat(stats.avgRating),
        isLive: true
      }} />

      <Footer />
    </div>
  );
}

