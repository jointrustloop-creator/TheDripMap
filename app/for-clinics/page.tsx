import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { ClinicAudit } from '../../src/components/ClinicAudit';
import { ArrowRight, BarChart, Users, Globe, Check, X, ShieldCheck } from 'lucide-react';
import { getSiteStats, getFeaturedListings, getListingsByCity, getAllListings } from '../../src/lib/data';
import { ProviderCard } from '../../src/components/ProviderCard';
import { Provider } from '../../src/types';

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats();
  const title = 'List Your IV Therapy Clinic Free | The Drip Map';
  const description = `Claim your free listing on North America's IV therapy matching platform. ${stats.total.toLocaleString()}+ clinics listed across the US and Canada. Add your drips, prices, team, and photos, and reach patients searching in your city.`;

  return {
    title,
    description,
    alternates: {
      canonical: 'https://www.thedripmap.com/for-clinics',
    },
    openGraph: {
      title,
      description,
      url: 'https://www.thedripmap.com/for-clinics',
      type: 'website',
      images: [
        {
          url: 'https://www.thedripmap.com/og-image.png',
          width: 1200,
          height: 630,
          alt: 'TheDripMap for Clinics',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.thedripmap.com/og-image.png'],
    },
  };
}

export default async function ForClinicsPage() {
  const stats = await getSiteStats();

  // Use REAL listings so the comparison shows exactly how claimed vs unclaimed
  // listings render on the site (never hardcoded clinic data).
  const featured = await getFeaturedListings(3);
  const claimedSample: Provider | null = (featured[0] as Provider) || null;
  let unclaimedSample: Provider | null = null;
  if (claimedSample) {
    const cityList = await getListingsByCity(claimedSample.city);
    unclaimedSample = (cityList.find((p) => !p.is_featured) as Provider) || null;
  }
  if (!unclaimedSample) {
    const all = await getAllListings();
    unclaimedSample = (all.find((p) => !p.is_featured) as Provider) || null;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Your clinic is already on <span className="text-wellness-600">TheDripMap</span>. Make it work for you.
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            {stats.total.toLocaleString()}+ clinics listed across the US and Canada. Patients are actively searching. Claim your free listing in 2 minutes.
          </p>
        </div>

        {/* SEO audit CTA — run the free audit before diving in */}
        <Link
          href="/tools/seo-audit"
          className="group flex flex-col sm:flex-row items-center gap-5 bg-white border-2 border-wellness-600 rounded-3xl p-6 md:p-7 mb-12 max-w-3xl mx-auto shadow-sm hover:shadow-xl hover:shadow-wellness-100/60 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-wellness-50 flex items-center justify-center shrink-0 text-wellness-600">
            <BarChart size={24} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="font-black text-slate-900 text-lg">Not sure how your clinic ranks?</div>
            <div className="text-slate-500 text-sm">Run a free SEO audit first — see your score in 60 seconds.</div>
          </div>
          <span className="inline-flex items-center gap-2 font-black text-sm text-wellness-700 shrink-0">
            Run free audit <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        {/* Real-numbers stat strip. Every figure is queried live from the
            database at render time; no hardcoded market claims. (The previous
            "19,700 monthly searches" / "+83% WoW" / "12.5x" figures were
            static and unverifiable, removed 2026-06-12 copy audit.) */}
        <div className="bg-slate-900 text-white rounded-[2rem] py-8 px-6 md:px-12 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-black text-wellness-400 mb-1">{stats.total.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">clinics listed</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-wellness-400 mb-1">{stats.cities.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">cities covered</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-wellness-400 mb-1">{stats.states.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">states &amp; provinces</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-wellness-400 mb-1">$0</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">to claim, forever</div>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-6 font-medium italic">
            On our own measured traffic, listings with real prices and named practitioners earn <span className="text-wellness-400 font-bold not-italic">many times</span> more patient clicks than bare listings. That gap is what claiming closes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
          {[
            { icon: <Users size={32} />, title: 'Patients, not impressions', desc: 'High-intent patients comparing IV clinics in your city land on your listing at the exact moment they decide where to book.' },
            { icon: <BarChart size={32} />, title: 'Your page, complete', desc: 'Your drip menu with your real prices, your team and their credentials, photos, hours, and a direct booking link. We build it with you from one reply email.' },
            { icon: <Globe size={32} />, title: 'The Safety Verified badge', desc: 'Answer our safety questionnaire in writing and earn the badge patients look for. It is never sold, only earned, and it stays free.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl text-center">
              <div className="w-16 h-16 bg-wellness-50 rounded-2xl flex items-center justify-center text-wellness-600 mx-auto mb-8">
                {item.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Listing audit — clinic owner types their name, sees their actual listing vs claimed,
            plus top competitors in their city. Replaces a tepid ROI calculator with a personal,
            actionable conversion tool. */}
        <div className="mb-24">
          <ClinicAudit />
        </div>

        {/* Comparison Section — claimed vs unclaimed, live from the directory */}
        <div className="mb-32">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-wellness-600 mb-4">Claimed vs Unclaimed</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-5 tracking-tight leading-[1.05]">
              The same clinic, two very different listings
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Both cards below are pulled live from the matching platform — exactly what patients see today, and what changes the moment you claim.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* Unclaimed panel */}
            <div className="flex flex-col h-full rounded-[2.5rem] border border-slate-200 bg-slate-50/70 p-6 md:p-8">
              <div className="flex items-center justify-between mb-7">
                <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-300" /> Unclaimed
                </span>
                <span className="text-[11px] font-bold text-slate-400">Free — but easy to miss</span>
              </div>
              {unclaimedSample && (
                <div className="mx-auto w-full max-w-[330px]">
                  <ProviderCard provider={unclaimedSample} />
                </div>
              )}
              <ul className="mt-8 space-y-3.5 flex-1">
                {[
                  'Grey placeholder — no clinic photo',
                  'No rating or reviews shown',
                  'No booking or call-to-action button',
                  'Sits below claimed clinics in every search',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-slate-500">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                      <X size={12} strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Claimed panel — the winner */}
            <div className="relative flex flex-col h-full rounded-[2.5rem] border-2 border-wellness-500 bg-white p-6 md:p-8 shadow-2xl shadow-wellness-100/60">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-wellness-600 text-white text-[10px] font-black uppercase tracking-[0.18em] px-4 py-1.5 rounded-full shadow-lg shadow-wellness-200">
                Recommended
              </span>
              <div className="flex items-center justify-between mb-7">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-wellness-600">
                  <ShieldCheck size={14} /> Claimed &amp; Verified
                </span>
                <span className="text-[11px] font-bold text-wellness-600">Free · 2 minutes</span>
              </div>
              {claimedSample && (
                <div className="mx-auto w-full max-w-[330px]">
                  <ProviderCard provider={claimedSample} />
                </div>
              )}
              <ul className="mt-8 space-y-3.5 flex-1">
                {[
                  'Your real photos and drip menu',
                  'Verified badge, rating & reviews',
                  'Direct "Book" and call buttons',
                  'Pinned above unclaimed clinics in your city',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-wellness-100 text-wellness-600 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <a
                href="/for-clinics/setup"
                className="mt-8 inline-flex items-center justify-center gap-2 w-full bg-wellness-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-200"
              >
                Claim your free listing <ArrowRight size={18} />
              </a>
            </div>
          </div>
          <p className="mt-6 text-center text-[11px] text-slate-400 font-medium italic">
            Real listings pulled live from the matching platform, not mockups.
          </p>
        </div>

        {/* Featured waitlist — soft mention, no pricing, no oversell */}
        <Link
          href="/for-clinics/featured-waitlist"
          className="group flex flex-col sm:flex-row items-center gap-5 bg-slate-900 text-white rounded-3xl p-6 md:p-7 mb-20 max-w-3xl mx-auto hover:bg-slate-800 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-wellness-300">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="font-black text-white text-lg">Want first dibs when we open Featured placement in your city?</div>
            <div className="text-slate-300 text-sm">Three slots per city, max. No pricing today, no commitment. Just a heads up when your city opens.</div>
          </div>
          <span className="inline-flex items-center gap-2 font-black text-sm text-wellness-300 shrink-0">
            Join the waitlist <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        {/* Social Proof Row */}
        <div className="py-12 border-y border-slate-100 mb-20">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-black text-slate-900">{stats.total.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">clinics listed</div>
            </div>
            <div className="space-y-1 text-slate-200 text-2xl font-light">·</div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-slate-900">{stats.cities.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">cities covered</div>
            </div>
            <div className="space-y-1 text-slate-200 text-2xl font-light">·</div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-slate-900">{stats.states.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">states</div>
            </div>
          </div>
        </div>

        {/* Clinic-owner FAQ — answer-first copy for search + AI engines.
            FAQPage JSON-LD mirrors the visible text exactly. */}
        {(() => {
          const ownerFaqs: Array<{ q: string; a: string }> = [
            {
              q: 'Is listing my clinic on The Drip Map free?',
              a: 'Yes. Claiming and managing your listing is free, with no time limit and no credit card. Your clinic is likely already listed; claiming simply puts you in control of it.',
            },
            {
              q: 'What changes when I claim my listing?',
              a: 'Your page swaps the grey placeholder for your real photos and logo, shows your drip menu with your prices, displays your rating and reviews, adds direct booking and call buttons, and ranks above unclaimed clinics in your city.',
            },
            {
              q: 'How do I earn the Safety Verified badge?',
              a: 'After you verify, we send five short questions covering who administers your IVs, your medical oversight, and where your ingredients come from. Answer in writing and we corroborate against public registries. The badge is never sold, only earned.',
            },
            {
              q: 'Can I update my prices and services later?',
              a: 'Yes. Reply to any email from us with changes and we update your listing, usually within two business days, and send you the link to review.',
            },
            {
              q: 'How do patients contact my clinic?',
              a: 'Your listing carries your phone number, website, directions, and a booking link if you have online booking. Patients go straight to you; we never sit between you and your patient.',
            },
            {
              q: 'How do I correct or remove my listing?',
              a: 'One email to info@thedripmap.com does either. Tell us what to fix and we fix it, or ask for removal and we take the listing down.',
            },
          ];
          const ownerFaqJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: ownerFaqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          };
          return (
            <div className="mb-24 max-w-3xl mx-auto">
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(ownerFaqJsonLd) }}
              />
              <div className="text-center mb-10">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-wellness-600 mb-4">Clinic owner FAQ</p>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  Straight answers, before you claim
                </h2>
              </div>
              <div className="space-y-4">
                {ownerFaqs.map((f) => (
                  <details key={f.q} className="group bg-white rounded-2xl border border-slate-200 px-6 py-5 open:shadow-md transition-all">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                      <h3 className="font-black text-slate-900 text-base md:text-lg tracking-tight">{f.q}</h3>
                      <span className="w-7 h-7 rounded-full bg-wellness-50 text-wellness-600 flex items-center justify-center shrink-0 group-open:rotate-90 transition-transform">
                        <ArrowRight size={14} />
                      </span>
                    </summary>
                    <p className="mt-4 text-[15px] text-slate-600 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="bg-[#0F6E56] text-white rounded-[4rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-black/5 skew-x-12 translate-x-1/4" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Ready to claim your listing?</h2>
              <p className="text-lg text-emerald-50 mb-10 leading-relaxed font-medium">
                It takes 2 minutes and it&apos;s completely free.
              </p>
              <Link
                href="/for-clinics/setup"
                className="inline-flex bg-white text-[#0F6E56] px-10 py-5 rounded-2xl font-black text-lg hover:bg-emerald-50 transition-all items-center gap-2 group shadow-xl shadow-black/20"
              >
                Claim Your Free Listing <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-6">
              {[
                'Free to claim and manage',
                'Add your photos and specialties',
                'Rank higher in match results',
                'See how many patients view your listing'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10 group hover:border-white/20 transition-colors">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    ✓
                  </div>
                  <span className="font-bold text-lg">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
