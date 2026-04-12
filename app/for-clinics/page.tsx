import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { ShieldCheck, ArrowRight, BarChart, Users, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: "For Clinics | Grow Your IV Therapy Practice | TheDripMap",
  description: "Join the nation's #1 IV therapy directory. Reach thousands of patients searching for wellness drips in your city every month.",
};

export default function ForClinicsPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Your clinic is already on <span className="text-wellness-600">TheDripMap</span>. Make it work for you.
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            40+ clinics listed across the US. Patients are actively searching. Claim your free listing in 2 minutes.
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
              <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
                <span className="w-2 h-2 bg-slate-200 rounded-full" /> Basic Listing (Unclaimed)
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 opacity-60 grayscale-[0.5] pointer-events-none">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-50 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-slate-50 rounded w-full" />
                  <div className="h-3 bg-slate-50 rounded w-full" />
                  <div className="h-3 bg-slate-50 rounded w-2/3" />
                </div>
                <div className="mt-8 h-12 bg-slate-100 rounded-xl w-full" />
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

        <div className="bg-wellness-900 text-white rounded-[4rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-wellness-800/50 skew-x-12 translate-x-1/4" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Ready to claim your listing?</h2>
              <p className="text-lg text-wellness-100 mb-10 leading-relaxed">
                Our team will verify your clinical protocols and medical supervision before adding you to the map. Join the most trusted resource in IV wellness.
              </p>
              <Link 
                href="/for-clinics/setup"
                className="bg-white text-wellness-900 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-wellness-50 transition-all flex items-center gap-2"
              >
                Claim My Free Listing <ArrowRight size={20} />
              </Link>
            </div>
            <div className="space-y-6">
              {[
                'Verified Medical Director Required',
                'Licensed RN Administration Only',
                'Transparent Pricing Protocols',
                'High Clinical Safety Standards'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <ShieldCheck className="text-wellness-400" />
                  <span className="font-bold">{item}</span>
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
