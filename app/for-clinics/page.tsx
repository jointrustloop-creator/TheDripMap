import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { ClinicAudit } from '../../src/components/ClinicAudit';
import { ShieldCheck, ArrowRight, BarChart, Users, Globe } from 'lucide-react';
import { getSiteStats } from '../../src/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats();
  const title = "List Your IV Therapy Clinic — Reach More Patients | TheDripMap";
  const description = `Join the nation's #1 IV therapy directory with ${stats.total.toLocaleString()}+ listed clinics. Claim your free listing to reach thousands of patients searching for wellness drips in your city every month.`;

  return {
    title,
    description,
    alternates: {
      canonical: 'https://www.thedripmap.com/for-clinics',
    },
    openGraph: {
      title,
      description,
      url: 'https://www.thedripmap.com/for-clinics',
      type: 'website',
      images: [
        {
          url: 'https://www.thedripmap.com/og-image.png',
          width: 1200,
          height: 630,
          alt: 'TheDripMap for Clinics',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.thedripmap.com/og-image.png'],
    },
  };
}

export default async function ForClinicsPage() {
  const stats = await getSiteStats();
  
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Your clinic is already on <span className="text-wellness-600">TheDripMap</span>. Make it work for you.
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            {stats.total.toLocaleString()}+ clinics listed across the US and Canada. Patients are actively searching. Claim your free listing in 2 minutes.
          </p>
        </div>

        {/* SEO audit CTA — run the free audit before diving in */}
        <Link
          href="/tools/seo-audit"
          className="group flex flex-col sm:flex-row items-center gap-5 bg-white border-2 border-wellness-600 rounded-3xl p-6 md:p-7 mb-12 max-w-3xl mx-auto shadow-sm hover:shadow-xl hover:shadow-wellness-100/60 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-wellness-50 flex items-center justify-center shrink-0 text-wellness-600">
            <BarChart size={24} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="font-black text-slate-900 text-lg">Not sure how your clinic ranks?</div>
            <div className="text-slate-500 text-sm">Run a free SEO audit first — see your score in 60 seconds.</div>
          </div>
          <span className="inline-flex items-center gap-2 font-black text-sm text-wellness-700 shrink-0">
            Run free audit <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        {/* Real-numbers stat strip — concrete proof that traffic is real */}
        <div className="bg-slate-900 text-white rounded-[2rem] py-8 px-6 md:px-12 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-black text-wellness-400 mb-1">19,700</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">monthly patient searches</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-wellness-400 mb-1">{stats.total.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">clinics listed</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-wellness-400 mb-1">{stats.cities.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">cities covered</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-wellness-400 mb-1">+83%</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">week-over-week search growth</div>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-6 font-medium italic">
            Live patient demand across the US and Canada. Canadian markets are converting at <span className="text-wellness-400 font-bold not-italic">12.5×</span> the US rate — Canadian clinics, this is your moment.
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

        {/* Listing audit — clinic owner types their name, sees their actual listing vs claimed,
            plus top competitors in their city. Replaces a tepid ROI calculator with a personal,
            actionable conversion tool. */}
        <div className="mb-24">
          <ClinicAudit />
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
                    <div className="text-[9px] text-slate-400 italic mt-0.5">Example listing shown for illustration only</div>
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
                <p className="mt-4 text-[10px] text-slate-400 italic text-center">
                  Example listing shown for illustration purposes only
                </p>
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

        <div className="bg-[#0F6E56] text-white rounded-[4rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-black/5 skew-x-12 translate-x-1/4" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Ready to claim your listing?</h2>
              <p className="text-lg text-emerald-50 mb-10 leading-relaxed font-medium">
                It takes 2 minutes and it&apos;s completely free.
              </p>
              <Link
                href="/for-clinics/setup"
                className="inline-flex bg-white text-[#0F6E56] px-10 py-5 rounded-2xl font-black text-lg hover:bg-emerald-50 transition-all items-center gap-2 group shadow-xl shadow-black/20"
              >
                Claim Your Free Listing <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
