import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { ShieldCheck, Zap, ArrowRight, BarChart, Users, Globe } from 'lucide-react';

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
            Grow Your <span className="text-wellness-600">IV Practice</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Join 140+ top-rated clinics and reach thousands of patients searching for IV therapy in your city every month.
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
                Apply to Join <ArrowRight size={20} />
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
