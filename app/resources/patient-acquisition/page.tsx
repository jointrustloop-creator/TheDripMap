import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowRight, MapPin, Star, ListChecks, Gauge, Repeat, Megaphone } from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';

const EMERALD = '#0F6E56';
const title = 'How to Get More Patients for Your IV Therapy Clinic (2026 Guide) | TheDripMap';
const description =
  'A practical, data-backed playbook for IV therapy clinic owners: local SEO, reviews, directories, booking conversion, retention and paid ads — with real benchmarks and sources.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://www.thedripmap.com/resources/patient-acquisition' },
  openGraph: { title, description, url: 'https://www.thedripmap.com/resources/patient-acquisition', type: 'article', images: [{ url: 'https://www.thedripmap.com/og-image.png', width: 1200, height: 630, alt: 'How to get more IV therapy patients' }] },
  twitter: { card: 'summary_large_image', title, description, images: ['https://www.thedripmap.com/og-image.png'] },
};

const STRATEGIES = [
  {
    icon: MapPin,
    name: 'Google Business Profile + local SEO',
    why: 'Most people searching for a local health service use Google with explicit local intent ("IV therapy near me"), and the Map 3-pack — driven by your Google Business Profile — sits above the website results. It\'s the single highest-leverage free channel to get found.',
    tip: 'Fully complete your profile: correct primary category ("IV therapy" or "Medical spa"), services with prices, hours, and a booking link. Add real photos and post weekly.',
    stat: 'An estimated 75%+ of 2025 healthcare searches include location-based keywords.',
    soft: true,
  },
  {
    icon: Star,
    name: 'A steady stream of recent reviews',
    why: 'Reviews are now the second-biggest local-ranking factor and decisive for conversion — and recency matters as much as volume. Too few (or stale) reviews and many patients won\'t even consider you.',
    tip: 'Request a review by SMS or email right after each visit. Aim for 20+ reviews, a 4.5★+ average, and a constant trickle of fresh ones.',
    stat: '47% of consumers won\'t use a business with fewer than 20 reviews, 74% want reviews from the last 3 months, and 68% now require at least a 4-star rating.',
    soft: false,
  },
  {
    icon: ListChecks,
    name: 'Consistent directory listings',
    why: 'Consistent Name/Address/Phone (NAP) across directories is a foundational local-ranking signal, and niche directories put you in front of searchers already looking for exactly your service. Inconsistent listings actively cost you customers.',
    tip: 'Pick one canonical name/address/phone and make it identical everywhere — Google, Apple/Bing Maps, Yelp, and niche IV/med-spa directories. Fix or remove duplicates.',
    stat: 'Businesses with incorrect NAP data are reported to lose ~22% of customers who reach the wrong info.',
    soft: true,
  },
  {
    icon: Gauge,
    name: 'A fast site with real online booking',
    why: 'Healthcare sites typically convert only 1–3% of visitors, so friction fixes pay off — and speed is the biggest. Online booking removes the phone-call barrier, and upfront pricing closes the trust gap before anyone calls.',
    tip: 'Put a "Book now" button above the fold that opens real scheduling (not a contact form), load the page in under 3 seconds on mobile, and show treatment prices up front.',
    stat: 'About 53% of mobile users abandon a page that takes more than 3 seconds to load.',
    soft: true,
  },
  {
    icon: Repeat,
    name: 'Retention & memberships',
    why: 'Keeping a patient costs a fraction of acquiring one, and IV economics reward repeat visits. With new-client visits down industry-wide in 2025, rebooking and memberships are how clinics grow without buying more ads.',
    tip: 'Book the next visit at checkout instead of hoping clients return, and launch a simple monthly IV membership.',
    stat: 'Booking at checkout drives ~70–80% rebooking vs ~40–50% when you wait, and membership clients tend to spend meaningfully more.',
    soft: true,
  },
  {
    icon: Megaphone,
    name: 'Paid ads — once the basics are solid',
    why: 'Paid search and social make sense after your profile, reviews and site are dialled in and you have a clear offer. Google Search buys high-intent traffic; Meta is cheaper but lower intent. CAC has roughly doubled in two years, so ads should supplement owned channels, not replace them.',
    tip: 'Start with one Google Search campaign on "IV therapy [city]" with a specific first-visit offer and online booking as the landing page. Track cost-per-booked-patient, not cost-per-click.',
    stat: 'Med-spa cost-per-lead runs roughly $15–50 on Meta and $30–80 on Google; customer-acquisition cost commonly lands around $100–200.',
    soft: true,
  },
];

const SOURCES = [
  { label: 'Grand View Research — IV hydration market size & CAGR', url: 'https://www.grandviewresearch.com/industry-analysis/iv-hydration-therapy-market-report' },
  { label: 'BrightLocal — Local Consumer Review Survey', url: 'https://www.brightlocal.com/research/local-consumer-review-survey/' },
  { label: 'Lead Origin — local SEO for medical practices', url: 'https://leadorigin.com/local-seo-for-medical-practice/' },
  { label: 'Uniek Digital — NAP citation consistency', url: 'https://uniekdigital.com/blog/seo-citation-building-how-to-boost-local-rankings-with-nap-consistency-2025-guide/' },
  { label: 'Remedo — page speed & conversion', url: 'https://www.remedo.io/blog/how-page-speed-affects-conversion-rates' },
  { label: 'Prospyr — memberships & med-spa retention', url: 'https://www.prospyrmed.com/blog/post/how-memberships-boost-revenue-for-med-spas' },
  { label: 'Pennock — med-spa paid-media benchmarks', url: 'https://www.pennock.co/blog/medspa-and-aesthetics-paid-media-benchmarks-google-vs-meta' },
];

export default function PatientAcquisitionPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F3]">
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F4F6F4] via-[#FBFCFB] to-white">
          <div className="absolute inset-0 [background-image:radial-gradient(#0F6E56_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.04]" />
          <div className="relative max-w-3xl mx-auto px-6 pt-24 pb-12 md:pt-28 md:pb-14 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
              <Sparkles size={13} className="text-emerald-700" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56]">For Clinic Owners</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#0A0B0D] tracking-tight leading-[1.05] mb-5">
              How to get more patients
              <span className="block font-serif italic font-normal" style={{ color: EMERALD }}>for your IV clinic.</span>
            </h1>
            <p className="text-[20px] text-slate-500 max-w-[600px] mx-auto leading-relaxed font-light">
              IV therapy demand is growing — from roughly $2.8B in 2025 toward $5.7B by 2033 (~9%/yr) — but so is competition and ad cost. The leverage is in the cheap, high-intent channels below.
            </p>
          </div>
        </section>

        {/* STRATEGIES */}
        <section className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-5">
          {STRATEGIES.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.name} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 md:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon size={20} style={{ color: EMERALD }} />
                  </div>
                  <h2 className="text-xl font-black text-[#0A0B0D] tracking-tight">
                    <span className="text-slate-300 mr-2">{i + 1}.</span>{s.name}
                  </h2>
                </div>
                <p className="text-slate-600 leading-relaxed mb-4">{s.why}</p>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 mb-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#0F6E56]">Do this</span>
                  <p className="text-sm text-slate-700 font-medium mt-1 leading-relaxed">{s.tip}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-600">By the numbers:</span> {s.stat}{' '}
                  <span className="text-slate-400 italic">{s.soft ? '(industry estimate)' : '(BrightLocal consumer survey)'}</span>
                </p>
              </div>
            );
          })}
        </section>

        {/* PRODUCT TIE-IN CTA */}
        <section className="max-w-3xl mx-auto px-6 pb-12">
          <div className="rounded-3xl p-8 md:p-10 text-white text-center" style={{ backgroundColor: '#0A3D2B' }}>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">TheDripMap is one of those high-intent directories.</h2>
            <p className="text-emerald-50/80 leading-relaxed max-w-xl mx-auto mb-6">
              Patients searching IV therapy in your city land here. Claiming your free listing puts your real photos, services, hours and verified safety details in front of them — no ad spend required.
            </p>
            <Link href="/for-clinics" className="inline-flex items-center gap-2 bg-white text-[#0A3D2B] px-7 py-3.5 rounded-2xl font-black text-sm">
              Claim your free listing <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* SOURCES */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Sources</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Market-size figures (Grand View) and the BrightLocal review survey are primary research; benchmarks marked "industry estimate" come from credible vendor/agency reporting and are directional, not audited. Numbers vary by market — use them as guidance.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {SOURCES.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-slate-500 hover:text-[#0F6E56] underline underline-offset-2">
                {s.label}
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
