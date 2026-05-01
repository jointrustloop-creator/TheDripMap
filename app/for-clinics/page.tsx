import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { ShieldCheck, ArrowRight, BarChart, Users, Globe } from 'lucide-react';
import { getSiteStats } from '../../src/lib/data';

export const metadata: Metadata = {
  title: "List Your IV Therapy Clinic — Reach More Patients | TheDripMap",
  description: "Join the nation's #1 IV therapy directory. Claim your free listing to reach thousands of patients searching for wellness drips in your city every month.",
  openGraph: {
    title: "List Your IV Therapy Clinic — Reach More Patients | TheDripMap",
    description: "Join the nation's #1 IV therapy directory. Claim your free listing to reach thousands of patients searching for wellness drips in your city every month.",
    url: 'https://thedripmap.com/for-clinics',
    type: 'website',
    images: [
      {
        url: 'https://thedripmap.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TheDripMap for Clinics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "List Your IV Therapy Clinic — Reach More Patients | TheDripMap",
    description: "Join the nation's #1 IV therapy directory. Claim your free listing to reach thousands of patients searching for wellness drips in your city every month.",
    images: ['https://thedripmap.com/og-image.png'],
  },
};

export default async function ForClinicsPage() {
  const stats = await getSiteStats();
  
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Your clinic is already on <span className="text-wellness-600">TheDripMap</span>. Make it work for you.
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            {stats.total.toLocaleString()}+ clinics listed across the US. Patients are actively searching. Claim your free listing in 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
          {[
            { icon: <Users size={32} />, title: 'New Patient Leads', desc: 'Connect with high-intent patients specifically looking for IV treatments in your area.' },
            { icon: <BarChart size={32} />, title: 'Market Insights', desc: 'Access data on local demand, popular services, and competitive pricing in your city.' },
            { icon: <Globe size={32} />, title: 'SEO Dominance', desc: 'Leverage our high-authority directory to boost your own clinical presence online.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl text-center">
              <div className="w-16 h-16 bg-wellness-50 rounded-2xl flex items-center justify-center text-wellness-600 mx-auto mb-8">
                {item.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Comparison Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Why Claim Your Listing?</h2>
            <p className="text-slate-500">See the difference between a basic listing and a claimed, verified profile.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Unclaimed */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                <span className="w-2 h-2 bg-slate-300 rounded-full" /> Basic Listing (Unclaimed)
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 opacity-80 grayscale-[0.2] pointer-events-none">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#0F6E56]/10 rounded-2xl flex items-center justify-center text-[#0F6E56] font-black text-xl">
                    WD
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Wellness Drip NYC</h4>
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                      <span className="text-wellness-600">★★★★★</span> 4.9 (127 reviews)
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Location</div>
                  <div className="text-slate-600 text-sm font-medium">New York, NY</div>
                </div>
                <div className="flex gap-2 mb-8">
                  {['IV Therapy', 'Wellness'].map(s => (
                    <span key={s} className="bg-slate-50 text-slate-400 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-100">{s}</span>
                  ))}
                </div>
                <div className="w-full py-3 text-center text-slate-300 font-bold text-sm border-2 border-slate-50 rounded-xl">
                  Claim this listing
                </div>
              </div>
              <p className="text-sm text-slate-400 font-medium italic text-center">
                Missing clinical details, verified badges, and direct booking links.
              </p>
            </div>

            {/* Claimed */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-wellness-600 font-bold uppercase tracking-widest text-xs">
                <span className="w-2 h-2 bg-wellness-600 rounded-full animate-pulse" /> Verified Profile (Claimed)
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-wellness-100 shadow-2xl shadow-wellness-100/30">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-wellness-600 rounded-2xl flex items-center justify-center text-white">
                    <ShieldCheck size={32} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-slate-900">Wellness Drip NYC</h4>
                      <div className="bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">Verified</div>
                    </div>
                    <div className="flex items-center gap-1 text-wellness-600">
                      <BarChart size={12} />
                      <span className="text-xs font-bold">Top 5% in New York</span>
                    </div>
                  </div>
                </div>
                <div className="bg-wellness-50 p-4 rounded-xl mb-6 border border-wellness-100">
                  <p className="text-xs text-wellness-900 font-bold italic leading-relaxed">
                    &quot;Specializing in hangover recovery and energy boosts with 15-minute wait times.&quot;
                  </p>
                </div>
                <div className="flex gap-2 mb-8">
                  {['Hangover', 'Energy', 'NAD+'].map(s => (
                    <span key={s} className="bg-slate-50 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-100">{s}</span>
                  ))}
                </div>
                <button className="w-full bg-wellness-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-wellness-100">
                  Book Appointment
                </button>
              </div>
              <p className="text-sm text-wellness-700 font-bold text-center">
                Includes custom messaging, verified status, and priority in search results.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof Row */}
        <div className="py-12 border-y border-slate-100 mb-20">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-black text-slate-900">{stats.total.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">clinics listed</div>
            </div>
            <div className="space-y-1 text-slate-200 text-2xl font-light">·</div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-slate-900">{stats.cities.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">cities covered</div>
            </div>
            <div className="space-y-1 text-slate-200 text-2xl font-light">·</div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-slate-900">{stats.states.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">states</div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Simple, Growth-Focused Pricing</h2>
            <p className="text-slate-500 text-lg">Choose the right tier to amplify your clinic&apos;s visibility and connect with more patients.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] flex flex-col shadow-sm">
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 mb-2">Free</h3>
                <p className="text-slate-500 text-sm">Basic online presence</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">$0</span>
                  <span className="text-slate-400 font-bold text-sm">/mo</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-bold italic">Free forever</p>
              </div>
              <div className="space-y-4 mb-10 flex-1">
                {[
                  'Listed in directory',
                  'Phone and website shown',
                  'Appears in search results'
                ].map(feature => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100">
                      <span className="text-[10px]">✓</span>
                    </div>
                    <span className="text-sm text-slate-600 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              <Link 
                href="/for-clinics/setup"
                className="w-full py-4 text-center border-2 border-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Featured Tier */}
            <div className="bg-white border-4 border-wellness-100 p-8 rounded-[2.5rem] flex flex-col shadow-2xl shadow-wellness-100/30 relative transform lg:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-wellness-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                Most Popular
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 mb-2">Featured</h3>
                <p className="text-slate-500 text-sm">Everything in Free, plus:</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">$99</span>
                  <span className="text-slate-400 font-bold text-sm">/mo</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-bold">Billed monthly</p>
              </div>
              <div className="space-y-4 mb-10 flex-1">
                {[
                  'Priority placement in city results',
                  'Verified green badge',
                  'Custom description and photos',
                  'Book Appointment button',
                  'Patient analytics dashboard'
                ].map(feature => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-wellness-50 text-wellness-600 flex items-center justify-center shrink-0 border border-wellness-100">
                      <span className="text-[10px] font-bold">✓</span>
                    </div>
                    <span className="text-sm text-slate-700 font-bold">{feature}</span>
                  </div>
                ))}
              </div>
              <Link 
                href="/for-clinics/setup?plan=featured"
                className="w-full py-4 text-center bg-wellness-600 text-white rounded-2xl font-black shadow-lg shadow-wellness-100 hover:bg-wellness-700 transition-all"
              >
                Go Featured
              </Link>
            </div>

            {/* Premium Tier */}
            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] flex flex-col shadow-sm">
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 mb-2">Premium</h3>
                <p className="text-slate-500 text-sm">Everything in Featured, plus:</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">$249</span>
                  <span className="text-slate-400 font-bold text-sm">/mo</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-bold">Annual billing available</p>
              </div>
              <div className="space-y-4 mb-10 flex-1">
                {[
                  'Top of city page placement',
                  'Featured in matching quiz results',
                  'Monthly performance report',
                  'Dedicated account manager'
                ].map(feature => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100">
                      <span className="text-[10px]">✓</span>
                    </div>
                    <span className="text-sm text-slate-600 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              <Link 
                href="/for-clinics/setup?plan=premium"
                className="w-full py-4 text-center border-2 border-slate-900 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                Go Premium
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-[#0F6E56] text-white rounded-[4rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-black/5 skew-x-12 translate-x-1/4" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Ready to claim your listing?</h2>
              <p className="text-lg text-emerald-50 mb-10 leading-relaxed font-medium">
                It&apos;s free. Takes 2 minutes. Patients in your city are searching right now.
              </p>
              <Link 
                href="/for-clinics/setup"
                className="inline-flex bg-white text-[#0F6E56] px-10 py-5 rounded-2xl font-black text-lg hover:bg-emerald-50 transition-all items-center gap-2 group shadow-xl shadow-black/20"
              >
                Claim My Free Listing <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-6">
              {[
                'Free to claim and manage',
                'Add your photos and specialties',
                'Rank higher in match results',
                'See how many patients view your listing'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10 group hover:border-white/20 transition-colors">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    ✓
                  </div>
                  <span className="font-bold text-lg">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
