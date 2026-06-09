import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles, Clock, Globe, Star, MessageSquare } from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';

const SITE_URL = 'https://www.thedripmap.com';
const PRICE_USD = 149;
const TURNAROUND_HOURS = 48;

const title = `Get Found Kit, $${PRICE_USD} done-for-you Google visibility | TheDripMap`;
const description = `A custom Google Business Profile rewrite, IV page SEO, schema, GBP posts, and review request templates for your clinic. Delivered to your inbox within ${TURNAROUND_HOURS} hours.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/tools/get-found-kit` },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/tools/get-found-kit`,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'TheDripMap Get Found Kit' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: [`${SITE_URL}/og-image.png`] },
};

const INCLUDES: { icon: React.ComponentType<{ size?: number }>; label: string; detail: string }[] = [
  { icon: Sparkles,       label: 'Optimized GBP description', detail: 'Up to 750 characters of marketing copy grounded only in your real services. No health claims. No invented credentials.' },
  { icon: Sparkles,       label: 'Recommended GBP categories', detail: 'Primary and 3 secondary category candidates for your IV clinic, so you stop competing in the wrong bucket.' },
  { icon: MessageSquare,  label: '10 ready-to-publish GBP posts', detail: 'Drop-in posts you can schedule weekly for the next 10 weeks, no copy-from-scratch.' },
  { icon: MessageSquare,  label: '8 GBP Q&A entries', detail: 'Pre-written answers for the questions every IV clinic gets asked, walk-ins, hours, payment, mobile service.' },
  { icon: Globe,          label: 'IV page title, meta, H1, intro', detail: 'On-page SEO bundle for your "IV therapy in [city]" page, ready to paste.' },
  { icon: Globe,          label: 'JSON-LD MedicalBusiness schema', detail: 'Drop it in your IV page <head>, instantly readable by Google.' },
  { icon: Star,           label: 'Direct Google review link', detail: 'Pre-generated short URL that goes straight to a 5-star review, no clicking through tabs.' },
  { icon: Star,           label: 'Review request email + SMS templates', detail: 'Polite, no-pressure templates ready to drop into your follow-up flow.' },
];

const FAQ: { q: string; a: string }[] = [
  { q: 'What is the Get Found Kit?', a: 'It is a one-time, done-for-you Google visibility package for your IV therapy clinic. We pull your real Google Business Profile and website data, then generate the GBP and on-page SEO assets your clinic needs to show up.' },
  { q: `Why ${PRICE_USD} dollars?`, a: `Because most clinics will spend ten times that on a one-month marketing retainer and walk away with worse outputs. This is a one-time, fixed-scope deliverable, no upsells, no contracts.` },
  { q: `Why ${TURNAROUND_HOURS} hours?`, a: 'Because we already have the tools running, the only thing slowing us down is the operator review. We do not auto-send, every kit is reviewed by a human first.' },
  { q: 'Do you write medical claims?', a: 'No. The kit is marketing copy only. No health-outcome claims, no "boosts immunity," no "cures hangovers." We protect your clinic from compliance trouble.' },
  { q: 'What if a detail is missing from my profile?', a: 'We flag it with a clear placeholder so you can confirm. We never invent services, credentials, awards, pricing, or staff. If we are unsure, we say so.' },
  { q: 'Do I have to be on TheDripMap?', a: 'No. The Get Found Kit works for any IV therapy clinic, listed or not. If you are not yet on TheDripMap, you can claim your free listing separately.' },
];

export default function GetFoundKitMarketingPage() {
  const stripeUrl = process.env.STRIPE_GET_FOUND_KIT_URL || '';
  const hasStripe = !!stripeUrl;

  // Buyer JSON-LD so the offer is machine-readable.
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Get Found Kit',
    description,
    provider: { '@type': 'Organization', name: 'TheDripMap', url: SITE_URL },
    offers: {
      '@type': 'Offer',
      price: PRICE_USD,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/tools/get-found-kit`,
    },
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6 border border-wellness-100">
            <Sparkles size={14} />
            For IV therapy clinics
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-[-0.025em] leading-[0.95] mb-6">
            Get Found{' '}
            <span className="bg-gradient-to-r from-wellness-600 to-emerald-500 bg-clip-text text-transparent">on Google.</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed mb-8">
            A custom Google Business Profile rewrite, on-page SEO bundle, JSON-LD schema, GBP posts, and review request templates for your clinic. Delivered to your inbox within {TURNAROUND_HOURS} hours.
          </p>

          {/* Offer card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10">
            <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">One-time delivery</div>
                <div className="text-5xl font-black text-slate-900 tracking-tight">${PRICE_USD}</div>
                <div className="text-sm text-slate-500 font-bold mt-2 flex items-center gap-1.5"><Clock size={14} />Delivered in {TURNAROUND_HOURS} hours</div>
              </div>
              <div className="flex-1 min-w-[260px]">
                {hasStripe ? (
                  <a
                    href={stripeUrl}
                    target="_blank"
                    rel="noopener"
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
                  >
                    Get the Kit
                    <ArrowRight size={16} />
                  </a>
                ) : (
                  <Link
                    href="/tools/get-found-kit/order"
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
                  >
                    Get the Kit
                    <ArrowRight size={16} />
                  </Link>
                )}
                <p className="text-xs text-slate-500 font-medium mt-3 text-center">
                  No subscription. No contract. One-time payment.
                </p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-6">
              <div className="text-xs font-black uppercase tracking-[0.15em] text-slate-700 mb-3">Includes</div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                {INCLUDES.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-bold">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Detail grid */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-10">What is inside</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {INCLUDES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-wellness-50 text-wellness-700 flex items-center justify-center mb-4">
                    <Icon size={18} />
                  </div>
                  <div className="font-black text-slate-900 text-lg mb-2 tracking-tight">{item.label}</div>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-10">Common questions</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="bg-white rounded-2xl border border-slate-100 shadow-sm group">
                <summary className="cursor-pointer p-6 font-black text-slate-900 list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-2xl text-slate-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-slate-900 text-white rounded-3xl p-10 md:p-14 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Ready to be found.</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8">
            One payment. {TURNAROUND_HOURS}-hour turnaround. A done-for-you Google visibility package, grounded only in your real clinic data.
          </p>
          {hasStripe ? (
            <a
              href={stripeUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 bg-wellness-600 hover:bg-wellness-700 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
            >
              Get the Kit, ${PRICE_USD}
              <ArrowRight size={16} />
            </a>
          ) : (
            <Link
              href="/tools/get-found-kit/order"
              className="inline-flex items-center gap-2 bg-wellness-600 hover:bg-wellness-700 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
            >
              Get the Kit, ${PRICE_USD}
              <ArrowRight size={16} />
            </Link>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
