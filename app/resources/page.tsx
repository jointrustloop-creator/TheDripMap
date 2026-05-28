import type { Metadata } from 'next';
import Link from 'next/link';
import { Droplets, ShieldCheck, BookOpen, CreditCard, Map, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';

const EMERALD = '#0F6E56';

const title = 'IV Therapy Resources — Free Tools & Guides for Patients | TheDripMap';
const description =
  'Free tools and guides to help you find safe, trusted IV therapy care: cost ranges by city, a clinic safety checker, a first-timer guide, HSA/FSA info, and state regulations.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://www.thedripmap.com/resources' },
  openGraph: {
    title, description, url: 'https://www.thedripmap.com/resources', type: 'website',
    images: [{ url: 'https://www.thedripmap.com/og-image.png', width: 1200, height: 630, alt: 'TheDripMap Resources' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['https://www.thedripmap.com/og-image.png'] },
};

export default function ResourcesPage() {
  const cards = [
    {
      icon: Droplets,
      label: 'IV Therapy Cost Calculator',
      cardTitle: 'What will it cost?',
      desc: 'See real, sourced price ranges by treatment — Myers’, NAD+, hangover and more.',
      href: '/resources/cost-calculator',
      badge: 'Free tool',
    },
    {
      icon: ShieldCheck,
      label: 'Safety Checker',
      cardTitle: 'Is this clinic verified?',
      desc: 'Enter any clinic name and see their TheDripMap verification status instantly.',
      href: '/resources/safety-checker',
      badge: 'Free tool',
    },
    {
      icon: BookOpen,
      label: 'First Timer Guide',
      cardTitle: 'Your first session, step by step',
      desc: 'What to expect, what to ask, what red flags to watch for.',
      href: '/guide/first-time-iv-therapy-what-to-expect',
      badge: null,
    },
    {
      icon: CreditCard,
      label: 'HSA / FSA Guide',
      cardTitle: 'Can I use my HSA or FSA?',
      desc: 'Which treatments qualify, what documentation to request, which clinics accept it.',
      href: '/blog/hsa-fsa-iv-therapy-reimbursement-united-states',
      badge: null,
    },
    {
      icon: Map,
      label: 'State Regulations Map',
      cardTitle: 'IV therapy rules by state',
      desc: "What's regulated, what to look for, and how to protect yourself in your state.",
      href: '/states',
      badge: null,
    },
  ];

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
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56]">Resources</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#0A0B0D] tracking-tight leading-[1.05] mb-5">
              Everything you need<br />
              <span className="font-serif italic font-normal" style={{ color: EMERALD }}>before your first drip.</span>
            </h1>
            <p className="text-[20px] text-slate-500 max-w-[560px] mx-auto leading-relaxed font-light">
              Free tools and guides to help you find safe, trusted IV therapy care.
            </p>
          </div>
        </section>

        {/* CARDS */}
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.label}
                  href={c.href}
                  className="group relative bg-white rounded-3xl border border-slate-200/70 p-7 md:p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 flex flex-col"
                >
                  {c.badge && (
                    <span className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-[0.12em] text-[#0F6E56] bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                      {c.badge}
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                    <Icon size={22} style={{ color: EMERALD }} />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">{c.label}</div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug mb-3 group-hover:text-[#0F6E56] transition-colors">
                    {c.cardTitle}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{c.desc}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#0F6E56]">
                    Explore <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* BOTTOM CTA */}
          <div className="mt-14 text-center">
            <Link
              href="/search"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-white text-sm transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: EMERALD }}
            >
              Find a verified clinic near you
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
