import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import Link from 'next/link';
import { ShieldCheck, Zap, Heart, Clock, Star, MapPin, CheckCircle2 } from 'lucide-react';
import { IVAnimation } from '../../src/components/IVAnimation';
import { getSiteStats } from '../../src/lib/data';

const aboutTitle = "Our Mission & Clinical Standards | TheDripMap";
const aboutDescription = "Learn about TheDripMap, Canada's IV therapy matching platform. We help patients compare clinics and match with the right IV therapy provider.";
const aboutOgImage = 'https://www.thedripmap.com/og-image.png';

export const metadata: Metadata = {
  title: aboutTitle,
  description: aboutDescription,
  alternates: { canonical: 'https://www.thedripmap.com/about' },
  openGraph: {
    title: aboutTitle,
    description: aboutDescription,
    url: 'https://www.thedripmap.com/about',
    type: 'website',
    siteName: 'TheDripMap',
    images: [{ url: aboutOgImage, width: 1200, height: 630, alt: 'TheDripMap' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: aboutTitle,
    description: aboutDescription,
    images: [aboutOgImage],
  },
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
            TheDripMap is Canada&apos;s IV therapy matching platform. Our goal is to help you find the right provider for your goals and lifestyle, across {stats.total} clinics and {stats.cities} cities.
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
              TheDripMap was created to bring transparency and trust to the IV therapy industry. We&apos;ve analyzed hundreds of clinics across Canada to provide you with the most accurate and up-to-date information.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          <div className="bg-wellness-50 rounded-[3rem] p-12 border border-wellness-100 shadow-xl shadow-wellness-100/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-wellness-600 rounded-2xl flex items-center justify-center text-white">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">What Safety Verified means</h3>
            </div>
            <ul className="space-y-6">
              {[
                'The owner has claimed and verified the listing',
                'They name their medical director',
                'They confirm who administers the IVs',
                'They disclose where ingredients are sourced',
                'Attested in writing, checked against public registries where available'
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
                { icon: <Star size={16} />, title: 'Guided Matching', desc: 'Personalized matching quiz' },
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

        {/* Verification methodology. Linked from every guide byline and footer
            (#how-we-verify) as the site-wide trust/methodology reference. */}
        <section id="how-we-verify" className="mb-32 scroll-mt-24">
          <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">How We Verify Clinics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6 text-lg text-slate-500 leading-relaxed">
              <p>
                TheDripMap is an independent matching platform. We do not sell treatments, we do not
                take commissions on bookings, and no clinic can pay to change how it ranks. That
                independence is the foundation of every recommendation on this site.
              </p>
              <p>
                The Safety Verified badge is earned, not bought. A clinic gets it only after its
                owner claims the listing and attests to the specifics that matter: who the medical
                director is, which licensed professionals administer IVs, and where ingredients are
                sourced. Where a provincial registry lists the practitioner, we check it.
              </p>
            </div>
            <div className="space-y-6 text-lg text-slate-500 leading-relaxed">
              <p>
                Listing data starts from public sources (clinic websites, Google business profiles)
                and is upgraded to clinic-verified detail when an owner completes their profile.
                Ratings shown are real Google review scores; we never edit or filter them.
              </p>
              <p>
                Aggregated numbers, like the city cost ranges in our guides and the IV Price Index,
                are computed from clinics&apos; own published menus. When we rank or shortlist
                clinics, the criteria are stated on the page: verified status first, then rating and
                review volume. Nothing on TheDripMap is medical advice.
              </p>
            </div>
          </div>
        </section>

        <div className="bg-slate-900 text-white rounded-[4rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-800/50 skew-x-12 translate-x-1/4" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Ready to find your match?</h2>
              <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                Take our match quiz and get matched with IV therapy providers in your city.
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
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Clinics Listed</div>
              </div>
              <div>
                <div className="text-4xl font-black text-wellness-400 mb-2">{stats.cities}+</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cities Covered</div>
              </div>
              <div>
                <div className="text-4xl font-black text-wellness-400 mb-2">{stats.states}</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Provinces &amp; States</div>
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
