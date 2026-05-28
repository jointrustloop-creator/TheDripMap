import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { IvCostCalculator } from '../../../src/components/IvCostCalculator';

const EMERALD = '#0F6E56';
const title = 'How Much Does IV Therapy Cost? Real Price Ranges by Treatment | TheDripMap';
const description =
  'See real IV therapy price ranges by treatment type — Myers’ Cocktail, NAD+, hangover, glutathione, hydration and more. Honest, sourced averages, plus mobile and membership costs.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://www.thedripmap.com/resources/cost-calculator' },
  openGraph: { title, description, url: 'https://www.thedripmap.com/resources/cost-calculator', type: 'website', images: [{ url: 'https://www.thedripmap.com/og-image.png', width: 1200, height: 630, alt: 'IV Therapy Cost Calculator' }] },
  twitter: { card: 'summary_large_image', title, description, images: ['https://www.thedripmap.com/og-image.png'] },
};

export default function CostCalculatorPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F3]">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F4F6F4] via-[#FBFCFB] to-white">
          <div className="absolute inset-0 [background-image:radial-gradient(#0F6E56_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.04]" />
          <div className="relative max-w-3xl mx-auto px-6 pt-24 pb-12 md:pt-28 md:pb-14 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
              <Sparkles size={13} className="text-emerald-700" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56]">Free Cost Calculator</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#0A0B0D] tracking-tight leading-[1.05] mb-5">
              What will IV therapy
              <span className="block font-serif italic font-normal" style={{ color: EMERALD }}>actually cost you?</span>
            </h1>
            <p className="text-[20px] text-slate-500 max-w-[560px] mx-auto leading-relaxed font-light">
              Pick a treatment to see real, sourced price ranges — before you call a single clinic.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          <IvCostCalculator />
        </section>
      </main>
      <Footer />
    </div>
  );
}
