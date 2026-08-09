import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Check, Info, ArrowRight } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { TRANSPARENCY_TOTAL } from '../../src/lib/transparency-score';

export const revalidate = 86400;

const SITE_URL = 'https://www.thedripmap.com';

export const metadata: Metadata = {
  title: 'The TheDripMap Transparency Score, explained',
  description: 'What the TheDripMap Transparency Score is, what it is not, and the 7 disclosure details it reports for every IV therapy clinic. It is not a safety rating.',
  alternates: { canonical: `${SITE_URL}/transparency` },
  openGraph: {
    title: 'The TheDripMap Transparency Score, explained',
    description: 'The 7 disclosure details we report for every IV therapy clinic. It reports what a clinic publicly discloses, not a safety rating.',
    url: `${SITE_URL}/transparency`,
    type: 'article',
  },
};

const CHECKS: { label: string; detail: string }[] = [
  { label: 'Medical oversight disclosed', detail: 'The clinic names a medical director or supervising clinician on their profile.' },
  { label: 'Administering professional identified', detail: 'The role that administers IVs is stated, such as RN, NP, MD, or ND.' },
  { label: 'Health screening disclosed', detail: 'The clinic states whether a consultation or health screening happens before treatment.' },
  { label: 'Drip ingredients disclosed', detail: 'The menu names the ingredients in its drips, not only branded blend names.' },
  { label: 'Pricing published', detail: 'Prices are visible on the profile.' },
  { label: 'Business details confirmed', detail: 'A current phone number, address, and website are on file.' },
  { label: 'Booking path available', detail: 'There is an online booking link or a stated way to book, including by phone.' },
];

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 mb-5">
          <ShieldCheck size={14} /> How it works
        </span>
        <h1 className="font-black text-slate-900 tracking-[-0.03em] leading-[1.05] text-[clamp(2rem,5vw,3rem)] mb-5">
          The Transparency Score
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-4">
          The TheDripMap Transparency Score is a simple count, out of {TRANSPARENCY_TOTAL}, of how many
          practical details a clinic publicly discloses about how it operates. It is computed
          automatically from listing data and updates as a clinic completes its profile.
        </p>

        {/* What it is NOT: prominent, first, because it matters most */}
        <div className="my-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2 mb-3 text-amber-900">
            <Info size={18} />
            <h2 className="text-lg font-black tracking-tight">What the score is not</h2>
          </div>
          <ul className="space-y-2 text-[15px] text-amber-900 leading-relaxed">
            <li>It is not a safety rating and not a quality ranking.</li>
            <li>It is not medical advice, and it does not judge treatments or outcomes.</li>
            <li>
              It is separate from Safety Verified, which is reviewed by our team and is a different
              signal entirely. A high score does not mean a clinic is Safety Verified, and the reverse
              is also true.
            </li>
          </ul>
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">The 7 details we report</h2>
        <p className="text-slate-600 leading-relaxed mb-6">
          Each detail is either disclosed or not yet disclosed. Missing information is counted as not
          yet disclosed, never assumed either way.
        </p>
        <ul className="space-y-3 mb-10">
          {CHECKS.map((c) => (
            <li key={c.label} className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl p-4">
              <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={14} strokeWidth={3} />
              </span>
              <div>
                <div className="font-black text-slate-900 text-[15px]">{c.label}</div>
                <div className="text-[14px] text-slate-500 leading-relaxed">{c.detail}</div>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Why we built it</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          IV therapy is a fast growing field, and the practical details a patient wants before booking,
          who administers the drip, what is in it, what it costs, are often hard to find in one place.
          The score rewards clinics for putting that information in the open, and gives patients a
          consistent, plain way to see what has been disclosed.
        </p>
        <p className="text-slate-600 leading-relaxed mb-10">
          The score is computed from public listings and from details that claimed clinics submit
          themselves. Any clinic can raise its score in minutes by claiming its free listing and
          completing these fields.
        </p>

        <div className="rounded-3xl bg-slate-900 text-white p-8 md:p-10 text-center">
          <h2 className="text-2xl font-black tracking-tight mb-3">Own an IV therapy clinic?</h2>
          <p className="text-slate-300 mb-6 max-w-lg mx-auto leading-relaxed">
            Claiming your free listing lets you complete these details and raise your score right away.
          </p>
          <Link href="/for-clinics" className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-slate-100 transition-all">
            Claim your listing <ArrowRight size={18} />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
