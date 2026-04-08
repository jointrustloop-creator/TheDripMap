import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import Link from 'next/link';
import { ShieldCheck, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: "About TheDripMap | Our Mission & Clinical Standards | TheDripMap",
  description: "Learn about the mission behind TheDripMap. We're building the most trusted resource for IV therapy and clinical wellness in the United States.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Our <span className="text-wellness-600">Mission</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            We&apos;re building the most trusted resource for IV therapy and clinical wellness in the United States. Our goal is to help you find the perfect provider based on your specific health goals and lifestyle needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center mb-32">
          <div className="relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl">
            <Image 
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1200"
              alt="Professional medical team at IV clinic"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">The Problem We&apos;re Solving</h2>
            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Finding a reputable IV therapy provider can be difficult. With so many options available, it&apos;s hard to know which clinics prioritize medical supervision, follow strict safety protocols, and offer the best value for your money.
            </p>
            <p className="text-lg text-slate-500 leading-relaxed">
              TheDripMap was created to bring transparency and trust to the IV therapy industry. We&apos;ve analyzed hundreds of clinics across the country to provide you with the most accurate and up-to-date information.
            </p>
          </div>
          <div className="bg-wellness-50 rounded-[3rem] p-12 border border-wellness-100 shadow-xl shadow-wellness-100/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-wellness-600 rounded-2xl flex items-center justify-center text-white">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Our Standards</h3>
            </div>
            <ul className="space-y-6">
              {[
                'Verified Medical Director Required',
                'Licensed RN Administration Only',
                'Transparent Pricing Protocols',
                'High Clinical Safety Standards',
                'Verified Patient Reviews'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 text-slate-700 font-bold">
                  <div className="w-6 h-6 bg-wellness-100 rounded-full flex items-center justify-center text-wellness-600">
                    <Zap size={14} className="fill-wellness-600" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-[4rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-800/50 skew-x-12 translate-x-1/4" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Ready to find your match?</h2>
              <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                Take our clinical diagnostic quiz and get matched with the best IV therapy providers in your city.
              </p>
              <Link 
                href="/quiz"
                className="bg-wellness-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-wellness-700 transition-all shadow-xl shadow-wellness-100 flex items-center justify-center gap-2"
              >
                <Zap size={20} /> Get Matched Now
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-4xl font-black text-wellness-400 mb-2">140+</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verified Clinics</div>
              </div>
              <div>
                <div className="text-4xl font-black text-wellness-400 mb-2">80+</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cities Covered</div>
              </div>
              <div>
                <div className="text-4xl font-black text-wellness-400 mb-2">100%</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Clinical Focus</div>
              </div>
              <div>
                <div className="text-4xl font-black text-wellness-400 mb-2">24/7</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Support Access</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
