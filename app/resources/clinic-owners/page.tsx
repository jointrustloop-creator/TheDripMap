import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, ClipboardCheck, Users, BadgeCheck, ArrowRight, Sparkles } from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { getSiteStats } from '../../../src/lib/data';

const EMERALD = '#0F6E56';

const title = 'Clinic Owner Resources — Free Tools to Grow Your IV Practice | TheDripMap';
const description =
  'Free tools and guides built for IV therapy clinic owners: a free SEO audit, a safety compliance checklist, a patient-acquisition guide, and free listing claiming.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://www.thedripmap.com/resources/clinic-owners' },
  openGraph: {
    title, description, url: 'https://www.thedripmap.com/resources/clinic-owners', type: 'website',
    images: [{ url: 'https://www.thedripmap.com/og-image.png', width: 1200, height: 630, alt: 'TheDripMap for Clinic Owners' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['https://www.thedripmap.com/og-image.png'] },
};

export default async function ClinicOwnerResourcesPage() {
  const stats = await getSiteStats();
  const total = stats.total ? `${stats.total.toLocaleString()}+` : '1,030+';

  return (
    <div className="min-h-screen bg-[#F8F7F3]">
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F4F6F4] via-[#FBFCFB] to-white">
          <div className="absolute inset-0 [background-image:radial-gradient(#0F6E56_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.04]" />
          <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 md:pt-28 md:pb-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
              <Sparkles size={13} className="text-emerald-700" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56]">For Clinic Owners</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#0A0B0D] tracking-tight leading-[1.05] mb-5">
              Grow your practice.<br />
              <span className="font-serif italic font-normal" style={{ color: EMERALD }}>Own your listing.</span>
            </h1>
            <p className="text-[20px] text-slate-500 max-w-[560px] mx-auto leading-relaxed font-light">
              Free tools and guides built specifically for IV therapy clinic owners.
            </p>
          </div>
        </section>

        {/* CARDS */}
        <section className="max-w-5xl mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {/* Card 1 — FEATURED: Free SEO Audit */}
            <Link
              href="/tools/seo-audit"
              className="group md:col-span-2 relative bg-white rounded-3xl border-2 border-[#0F6E56] p-8 md:p-10 shadow-sm hover:shadow-xl hover:shadow-emerald-200/40 hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6"
            >
              <span className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-[0.12em] text-[#0F6E56] bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                Free tool
              </span>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                <BarChart3 size={26} style={{ color: EMERALD }} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">Free SEO Audit</div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-[#0F6E56] transition-colors">
                  How does your clinic rank?
                </h2>
                <p className="text-slate-500 leading-relaxed max-w-xl">
                  See your SEO score, what patients can find about you, and how to improve it.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-black text-[#0F6E56] shrink-0">
                Run the audit <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 1b — FEATURED: AI Brand Voice Generator */}
            <Link
              href="/tools/brand-voice"
              className="group md:col-span-2 relative bg-white rounded-3xl border-2 border-[#0F6E56] p-8 md:p-10 shadow-sm hover:shadow-xl hover:shadow-emerald-200/40 hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6"
            >
              <span className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-[0.12em] text-[#0F6E56] bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                AI-Powered
              </span>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Sparkles size={26} style={{ color: EMERALD }} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">AI Brand Voice Generator</div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-[#0F6E56] transition-colors">
                  Your whole marketing copy kit, in 30 seconds
                </h2>
                <p className="text-slate-500 leading-relaxed max-w-xl">
                  Answer five questions and get a listing description, Google &amp; Instagram bios, captions, a welcome email, a hero headline, and a tagline — then publish it to your listing.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-black text-[#0F6E56] shrink-0">
                Generate copy <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2 — Safety Compliance Checklist */}
            <Link
              href="/blog/iv-therapy-safety-side-effects-guide"
              className="group relative bg-white rounded-3xl border border-slate-200/70 p-7 md:p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 flex flex-col"
            >
              <span className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                Free guide
              </span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                <ClipboardCheck size={22} style={{ color: EMERALD }} />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">Safety Compliance Checklist</div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug mb-3 group-hover:text-[#0F6E56] transition-colors">
                Are you compliant?
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed flex-1">
                The 10-point credential checklist patients and regulators look for.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#0F6E56]">
                Read it <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3 — New Patient Acquisition Guide */}
            <Link
              href="/resources/patient-acquisition"
              className="group relative bg-white rounded-3xl border border-slate-200/70 p-7 md:p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 flex flex-col"
            >
              <span className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                Free guide
              </span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                <Users size={22} style={{ color: EMERALD }} />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">New Patient Acquisition</div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug mb-3 group-hover:text-[#0F6E56] transition-colors">
                Get more patients
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed flex-1">
                How TheDripMap drives high-intent patient referrals to verified clinics.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#0F6E56]">
                Learn how <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4 — Claim Your Listing (dark green) */}
            <Link
              href="/for-clinics"
              className="group md:col-span-2 relative rounded-3xl p-8 md:p-10 transition-all duration-300 hover:-translate-y-1 flex flex-col md:flex-row md:items-center gap-6 text-white overflow-hidden"
              style={{ backgroundColor: '#0A3D2B' }}
            >
              <span className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-200 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
                Free · No credit card
              </span>
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <BadgeCheck size={26} className="text-emerald-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black tracking-tight mb-2">Claim your free listing</h2>
                <p className="text-emerald-50/80 leading-relaxed max-w-xl">
                  Join {total} verified clinics. Takes 2 minutes. No credit card.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-black bg-white text-[#0A3D2B] px-6 py-3 rounded-xl shrink-0">
                Claim now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
