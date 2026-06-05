import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { FeaturedWaitlistForm } from './FeaturedWaitlistForm';

export const metadata: Metadata = {
  title: 'Featured waitlist for clinics | TheDripMap',
  description:
    "Get first dibs when we open Featured placement in your city. Limited inventory, three slots per city. No pricing today, no commitment.",
  alternates: { canonical: 'https://www.thedripmap.com/for-clinics/featured-waitlist' },
  robots: { index: true, follow: true },
};

export default function FeaturedWaitlistPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="text-xs font-bold text-wellness-600 uppercase tracking-widest mb-3">For clinics</div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            First dibs on Featured placement when we open it in your city.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            We are not charging anything yet. Featured slots are capped at three per city.
            Tell us where you want to be at the top and we will let you know when your city opens.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">What Featured is</div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Top placement on your city page and the treatment pages you serve.
              Three clinics per city, max.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">What it is not</div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Not a paid review boost. Not a way to skip safety verification.
              Free claimed listings stay exactly as they are.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">What happens next</div>
            <p className="text-sm text-slate-700 leading-relaxed">
              We open city by city based on patient search volume.
              You hear from us when your city is up, with terms and pricing.
            </p>
          </div>
        </div>

        <FeaturedWaitlistForm />

        <p className="mt-10 text-xs text-slate-400 leading-relaxed">
          By submitting you agree to receive email about Featured placement in your city.
          You can opt out anytime by replying with the word unsubscribe.
        </p>
      </main>
      <Footer />
    </div>
  );
}
