import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { UpgradeRequestForm } from '../../../src/components/UpgradeRequestForm';
import { Check, X, Sparkles, TrendingUp, Eye, Star, Calendar, MessageSquare, Image as ImageIcon, MapPin } from 'lucide-react';

const SITE_URL = 'https://www.thedripmap.com';
const PRICE = 99; // monthly USD

const title = 'Upgrade to a Featured Listing — TheDripMap';
const description = `Featured listings get top placement on city + treatment pages, image-rich profiles, instant-book CTAs, and patient testimonials. $${PRICE}/month, cancel anytime.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/for-clinics/upgrade` },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/for-clinics/upgrade`,
    type: 'website',
    siteName: 'TheDripMap',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [`${SITE_URL}/og-image.png`],
  },
};

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Top placement, always',
    body: `Featured clinics pin to the top of every city, treatment, and search page they qualify for — above unclaimed competitors regardless of sort.`,
  },
  {
    icon: ImageIcon,
    title: 'Image-rich profile',
    body: `Real photos of your clinic, drip menu, staff, and interior instead of the grey unclaimed placeholder.`,
  },
  {
    icon: Calendar,
    title: 'Direct-booking CTAs',
    body: `Visible "Book Appointment" + "Call Clinic" + "Message Clinic" buttons in the right rail — every visitor sees how to reach you immediately.`,
  },
  {
    icon: MessageSquare,
    title: 'Patient testimonials',
    body: `Verified patients can submit testimonials on your profile (admin-moderated). Builds trust and SEO over time.`,
  },
  {
    icon: Eye,
    title: 'Full operator profile',
    body: `Custom intro, primary specialty, drip menu, hours, walk-in policy — all editable. Visitors see your story, not just your name.`,
  },
  {
    icon: Star,
    title: 'Magazine-style hero',
    body: `Top of your page gets a custom photo hero with rating, reviews, and your one-liner pull-quote — built to convert.`,
  },
];

interface Row {
  feature: string;
  unclaimed: boolean | string;
  claimed: boolean | string;
  featured: boolean | string;
}
const COMPARISON: Row[] = [
  { feature: 'Listed on TheDripMap', unclaimed: true, claimed: true, featured: true },
  { feature: 'Show in search results', unclaimed: true, claimed: true, featured: true },
  { feature: 'Custom photos + drip menu', unclaimed: false, claimed: true, featured: true },
  { feature: 'Edit your own profile', unclaimed: false, claimed: true, featured: true },
  { feature: 'Operator profile + one-liner', unclaimed: false, claimed: true, featured: true },
  { feature: 'Patient testimonials surface', unclaimed: false, claimed: true, featured: true },
  { feature: 'Direct-booking + call CTAs', unclaimed: false, claimed: 'Limited', featured: true },
  { feature: 'Pinned to top of city/treatment pages', unclaimed: false, claimed: false, featured: true },
  { feature: 'Magazine-style profile hero', unclaimed: false, claimed: false, featured: true },
  { feature: 'Lead leads forwarded by email', unclaimed: false, claimed: false, featured: true },
  { feature: 'Priority placement in match-quiz results', unclaimed: false, claimed: false, featured: true },
];

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <BreadcrumbNav items={[{ label: 'For Clinics', href: '/for-clinics' }, { label: 'Upgrade' }]} />

        {/* Hero */}
        <section className="mt-12 mb-20 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6 border border-amber-100">
              <Sparkles size={14} />
              Featured listing — for paying clinics
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.95]">
              Stop losing leads to{' '}
              <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">
                claimed clinics on top.
              </span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-8">
              Featured listings sit above every other clinic on every page they qualify for — city pages, treatment pages, search results, match-quiz results. Real photos, real CTAs, real reviews. Built to convert visitors into your patients.
            </p>
            <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-700">
              <span className="bg-white border border-slate-200 px-4 py-2 rounded-full">
                <span className="text-emerald-600 font-black">$</span>{PRICE}/month
              </span>
              <span className="bg-white border border-slate-200 px-4 py-2 rounded-full">
                Cancel anytime
              </span>
              <span className="bg-white border border-slate-200 px-4 py-2 rounded-full">
                No setup fee
              </span>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <UpgradeRequestForm price={PRICE} />
          </div>
        </section>

        {/* Benefits grid */}
        <section className="mb-24">
          <div className="flex items-baseline justify-between gap-4 mb-10 flex-wrap">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              What you get
            </h2>
            <p className="text-sm font-bold text-slate-500">
              Every Featured listing includes all of these.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 flex flex-col">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">
                    {b.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">
                    {b.body}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Comparison table */}
        <section className="mb-24">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-10 tracking-tight">
            How the tiers compare
          </h2>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-0 text-sm">
              {/* Header */}
              <div className="bg-slate-50 p-5 font-black text-xs uppercase tracking-widest text-slate-500">
                Feature
              </div>
              <div className="bg-slate-50 p-5 text-center font-black text-xs uppercase tracking-widest text-slate-500">
                Unclaimed<br /><span className="text-[10px] font-bold normal-case text-slate-400">free</span>
              </div>
              <div className="bg-slate-50 p-5 text-center font-black text-xs uppercase tracking-widest text-emerald-700">
                Claimed<br /><span className="text-[10px] font-bold normal-case text-emerald-600">free</span>
              </div>
              <div className="bg-amber-50 p-5 text-center font-black text-xs uppercase tracking-widest text-amber-700 border-l-2 border-amber-200">
                Featured<br /><span className="text-[10px] font-bold normal-case text-amber-600">${PRICE}/mo</span>
              </div>

              {COMPARISON.map((row, i) => (
                <React.Fragment key={i}>
                  <div className={`p-5 font-bold text-slate-800 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    {row.feature}
                  </div>
                  <Cell value={row.unclaimed} striped={i % 2 !== 0} />
                  <Cell value={row.claimed} striped={i % 2 !== 0} accent="emerald" />
                  <Cell value={row.featured} striped={i % 2 !== 0} accent="amber" highlighted />
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-24">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-10 tracking-tight">
            Common questions
          </h2>
          <div className="space-y-4">
            <Faq q="How does billing work?">
              We invoice monthly via Stripe or e-transfer. First clinics get hand-onboarded — once we hit volume we'll move to a self-serve dashboard.
            </Faq>
            <Faq q="Can I cancel anytime?">
              Yes. Cancel and your listing reverts to a Claimed (free) listing — no penalty, no lock-in.
            </Faq>
            <Faq q="How long until I see leads?">
              Most Featured clinics see their first inbound message within 2 weeks of going live. Volume scales with your city's traffic — we'll share your city's monthly traffic stats during onboarding.
            </Faq>
            <Faq q="Do you charge per lead?">
              No. Flat $${PRICE}/month, unlimited leads. The more visitors TheDripMap drives to your area, the better your ROI.
            </Faq>
            <Faq q="What if I already claimed my listing?">
              Perfect — that's the starting point. Featured is the next tier up. Submit the form above and we'll upgrade your existing claimed listing within 24h.
            </Faq>
            <Faq q="Is there a contract or commitment?">
              Month-to-month, no minimum. Most clinics stay because the leads pay for themselves several times over — but you're never locked in.
            </Faq>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-slate-900 text-white rounded-[3rem] p-12 md:p-16 text-center">
          <Sparkles size={32} className="mx-auto mb-5 text-amber-400" />
          <h2 className="text-3xl md:text-5xl font-black mb-5 tracking-tight">
            Ready to get featured?
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Tell us your clinic name and we'll upgrade your profile within 24 hours.
          </p>
          <Link
            href="#upgrade-form"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-4 rounded-2xl font-black text-base transition-all shadow-2xl"
          >
            <MapPin size={18} /> Request upgrade
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Cell({
  value,
  striped,
  accent,
  highlighted,
}: {
  value: boolean | string;
  striped?: boolean;
  accent?: 'emerald' | 'amber';
  highlighted?: boolean;
}) {
  const bg = striped ? 'bg-slate-50/40' : 'bg-white';
  const accentBg = highlighted ? 'bg-amber-50/40' : '';
  const borderL = highlighted ? 'border-l-2 border-amber-100' : '';
  return (
    <div className={`p-5 text-center ${highlighted ? accentBg : bg} ${borderL}`}>
      {typeof value === 'boolean' ? (
        value ? (
          <Check
            size={20}
            className={`mx-auto ${
              accent === 'amber' ? 'text-amber-600' : accent === 'emerald' ? 'text-emerald-600' : 'text-slate-700'
            }`}
            strokeWidth={3}
          />
        ) : (
          <X size={20} className="mx-auto text-slate-300" strokeWidth={2} />
        )
      ) : (
        <span className="text-xs font-bold text-slate-600">{value}</span>
      )}
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group bg-white rounded-2xl border border-slate-100 shadow-sm">
      <summary className="p-6 cursor-pointer flex items-center justify-between font-black text-slate-900 text-base tracking-tight list-none">
        <span>{q}</span>
        <span className="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light">+</span>
      </summary>
      <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed">
        {children}
      </div>
    </details>
  );
}
