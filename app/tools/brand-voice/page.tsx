import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { BrandVoiceTool } from '../../../src/components/BrandVoiceTool';

const EMERALD = '#0F6E56';
const title = 'Free AI Brand Voice Generator for IV Therapy Clinics | TheDripMap';
const description =
  'Generate on-brand marketing copy for your IV therapy clinic in seconds — listing description, Google Business blurb, Instagram bio + captions, welcome email, hero headline, and tagline.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://www.thedripmap.com/tools/brand-voice' },
  robots: { index: true, follow: true },
  openGraph: { title, description, url: 'https://www.thedripmap.com/tools/brand-voice', type: 'website', images: [{ url: 'https://www.thedripmap.com/og-image.png', width: 1200, height: 630, alt: 'TheDripMap Brand Voice Generator' }] },
  twitter: { card: 'summary_large_image', title, description, images: ['https://www.thedripmap.com/og-image.png'] },
};

export default function BrandVoicePage() {
  return (
    <div className="min-h-screen bg-[#F8F7F3]">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F4F6F4] via-[#FBFCFB] to-white">
          <div className="absolute inset-0 [background-image:radial-gradient(#0F6E56_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.04]" />
          <div className="relative max-w-3xl mx-auto px-6 pt-24 pb-12 md:pt-28 md:pb-14 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
              <Sparkles size={13} className="text-emerald-700" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56]">AI-Powered · For Clinic Owners</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#0A0B0D] tracking-tight leading-[1.05] mb-5">
              Your clinic&apos;s marketing copy,
              <span className="block font-serif italic font-normal" style={{ color: EMERALD }}>written in 30 seconds.</span>
            </h1>
            <p className="text-[20px] text-slate-500 max-w-[560px] mx-auto leading-relaxed font-light">
              Answer five quick questions and get a full copy kit — listing description, Google &amp; Instagram bios, captions, a welcome email, a hero headline, and a tagline.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-6 md:p-9">
            <BrandVoiceTool />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
