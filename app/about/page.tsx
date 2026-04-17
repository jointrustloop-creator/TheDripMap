import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import Link from 'next/link';
import { ShieldCheck, Zap, Heart, Clock, Star, MapPin, CheckCircle2 } from 'lucide-react';
import { IVAnimation } from '../../src/components/IVAnimation';
import { getSiteStats } from '../../src/lib/data';

export const metadata: Metadata = {
  title: "Our Mission & Clinical Standards | TheDripMap",
  description: "Learn about the mission behind TheDripMap. We're building the most trusted resource for IV therapy and clinical wellness in the United States.",
};

export default async function AboutPage() {
  const stats = await getSiteStats();
  
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Our <span className="text-wellness-600">Mission</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            We&apos;re building the most trusted resource for IV therapy and clinical wellness in the United States. Our goal is to help you find the perfect provider based on your specific health goals and lifestyle needs across {stats.total} clinics and {stats.cities} cities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center mb-20">
          <div className="h-[500px] w-full">
            <IVAnimation />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
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

          <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl shadow-slate-100/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                <Heart size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Why Choose Us</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: <Clock size={16} />, title: 'Real-time Booking', desc: 'Instant access to clinic schedules' },
                { icon: <MapPin size={16} />, title: 'Mobile Options', desc: 'IV therapy delivered to your door' },
                { icon: <Star size={16} />, title: 'Expert Guidance', desc: 'Clinically-backed matching quiz' },
                { icon: <CheckCircle2 size={16} />, title: '100% Free', desc: 'No hidden fees for patients' }
              ].map((benefit, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-wellness-600 mb-2">{benefit.icon}</div>
                  <div className="font-bold text-slate-900 text-sm mb-1">{benefit.title}</div>
                  <div className="text-slate-500 text-xs leading-relaxed">{benefit.desc}</div>
                </div>
              ))}
            </div>
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
                <div className="text-4xl font-black text-wellness-400 mb-2">{stats.total}+</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verified Clinics</div>
              </div>
              <div>
                <div className="text-4xl font-black text-wellness-400 mb-2">{stats.cities}+</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cities Covered</div>
              </div>
              <div>
                <div className="text-4xl font-black text-wellness-400 mb-2">{stats.states}</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">States</div>
              </div>
              <div>
                <div className="text-4xl font-black text-wellness-400 mb-2">{stats.avgRating}★</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
