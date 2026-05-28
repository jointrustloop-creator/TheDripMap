import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight, Check, MapPin, Search, ShieldCheck, Star, Sparkles, BookOpen,
} from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { ProviderCard } from '../../../src/components/ProviderCard';
import { QuizCTA } from '../../../src/components/QuizCTA';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { AUDIENCES, getAudienceBySlug } from '../../../src/lib/audiences';
import { getListingsByService } from '../../../src/lib/data';

const EMERALD = '#0F6E56';
const SITE = 'https://www.thedripmap.com';

interface PageProps {
  params: Promise<{ audience: string }>;
}

export async function generateStaticParams() {
  return AUDIENCES.map((a) => ({ audience: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { audience } = await params;
  const a = getAudienceBySlug(audience);
  if (!a) return { title: 'Not Found' };
  return {
    title: a.metaTitle,
    description: a.metaDescription,
    alternates: { canonical: `${SITE}/for/${a.slug}` },
    openGraph: {
      title: a.metaTitle,
      description: a.metaDescription,
      url: `${SITE}/for/${a.slug}`,
      type: 'website',
      images: [{ url: a.heroImage, width: 1200, height: 630, alt: a.metaTitle }],
    },
    twitter: { card: 'summary_large_image', title: a.metaTitle, description: a.metaDescription, images: [a.heroImage] },
  };
}

export default async function AudiencePage({ params }: PageProps) {
  const { audience } = await params;
  const a = getAudienceBySlug(audience);
  if (!a) notFound();

  const clinics = await getListingsByService(a.serviceTag, 6);

  // BreadcrumbNav prepends its own "Home" crumb and emits BreadcrumbList JSON-LD,
  // so we only pass the trailing crumbs. "Who We Serve" has no href yet (no /for
  // index page), so it renders as plain text rather than a 404 link.
  const breadcrumbs = [
    { label: 'Who We Serve' },
    { label: a.navLabel, href: `/for/${a.slug}` },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: a.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <main>
        {/* ===== HERO (light, premium) ===== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F4F6F4] via-[#FBFCFB] to-white">
          <div className="absolute inset-0 [background-image:radial-gradient(#0F6E56_0.5px,transparent_0.5px)] [background-size:22px_22px] opacity-[0.04]" />
          <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-16 md:pb-24">
            <BreadcrumbNav items={breadcrumbs} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center mt-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-5">
                  <Sparkles size={13} className="text-emerald-700" />
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-700">{a.eyebrow}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-[#0A0B0D] tracking-tight leading-[1.05] mb-5">
                  {a.h1}{' '}
                  <span className="italic font-serif" style={{ color: EMERALD }}>{a.h1Accent}</span>
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-xl">{a.heroSub}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="#clinics" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-black text-white text-sm" style={{ backgroundColor: EMERALD }}>
                    <MapPin size={17} /> Find a clinic near me
                  </a>
                  <Link href="/quiz" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-black text-sm text-slate-900 bg-white border border-slate-200 hover:border-slate-300 transition-all">
                    Take the 60-sec quiz <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-7 text-sm font-bold text-slate-500">
                  <span className="flex items-center gap-1.5"><Check size={15} className="text-emerald-600" strokeWidth={3} /> 770+ clinics listed</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-600" /> MD-led options</span>
                  <span className="flex items-center gap-1.5"><Check size={15} className="text-emerald-600" strokeWidth={3} /> Mobile &amp; in-clinic</span>
                </div>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-300/40 ring-1 ring-slate-200/60">
                  <Image src={a.heroImage} alt={a.metaTitle} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== BENEFITS ===== */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-black text-[#0A0B0D] tracking-tight mb-10 text-center">{a.benefitsHeading}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {a.benefits.map((b) => {
              const Ic = (Icons as unknown as Record<string, LucideIcon>)[b.icon] || Sparkles;
              return (
                <div key={b.title} className="bg-[#F8F7F3] rounded-3xl p-7 border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                    <Ic size={22} style={{ color: EMERALD }} />
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-2">{b.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{b.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== WHAT TO LOOK FOR ===== */}
        <section className="bg-[#0A0B0D] py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3 text-center">{a.lookForHeading}</h2>
            <p className="text-slate-400 text-center mb-10 font-medium">A few minutes of vetting protects your health — and your wallet.</p>
            <ul className="space-y-4 max-w-2xl mx-auto">
              {a.lookFor.map((item) => (
                <li key={item} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200 font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ===== COMPARE (e.g. mobile vs in-clinic) ===== */}
        {a.compare && (
          <section className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <h2 className="text-3xl md:text-4xl font-black text-[#0A0B0D] tracking-tight mb-10 text-center">Mobile or in-clinic?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[a.compare.left, a.compare.right].map((col, idx) => (
                <div key={col.heading} className={`rounded-3xl p-8 border ${idx === 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-[#F8F7F3] border-slate-100'}`}>
                  <h3 className="font-black text-xl text-slate-900 mb-5">{col.heading}</h3>
                  <ul className="space-y-3">
                    {col.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-slate-600">
                        <Check size={17} className="text-emerald-600 shrink-0 mt-0.5" strokeWidth={3} />
                        <span className="font-medium">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== TOP CLINICS (live from DB) ===== */}
        <section id="clinics" className="bg-[#F8F7F3] py-16 md:py-20 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-[#0A0B0D] tracking-tight mb-3">Top-rated clinics</h2>
              <p className="text-slate-500 font-medium">Search your city to see the best-reviewed providers near you.</p>
            </div>

            <form action="/search" method="GET" className="relative max-w-xl mx-auto mb-12">
              <input type="hidden" name="service" value={a.serviceTag} />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <input
                type="text"
                name="city"
                placeholder="Enter your city (e.g. Las Vegas)"
                required
                className="block w-full pl-11 pr-32 py-4 rounded-2xl border border-slate-200 bg-white font-semibold focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
              />
              <button type="submit" className="absolute right-2 top-2 bottom-2 px-5 rounded-xl font-black text-white text-sm flex items-center gap-2" style={{ backgroundColor: EMERALD }}>
                <Search size={15} /> Search
              </button>
            </form>

            {clinics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clinics.map((c) => (
                  <ProviderCard key={c.id || c.slug} provider={c} />
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 font-medium">Search your city above to find clinics near you.</p>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {a.popularCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/cities/${city.slug}?service=${encodeURIComponent(a.serviceTag)}`}
                  className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition-all"
                >
                  <Star size={12} className="inline -mt-0.5 mr-1.5 text-amber-400" fill="currentColor" />
                  {a.navLabel} in {city.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===== RELATED / CROSS-LINKS ===== */}
        {(a.relatedDeepDive || a.guidesHref) && (
          <section className="max-w-4xl mx-auto px-6 py-12">
            <div className="flex flex-col sm:flex-row gap-4">
              {a.relatedDeepDive && (
                <Link href={a.relatedDeepDive.href} className="flex-1 group bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition-all flex items-center gap-3">
                  <BookOpen size={20} style={{ color: EMERALD }} className="shrink-0" />
                  <span className="font-bold text-slate-800 text-sm leading-snug">{a.relatedDeepDive.label}</span>
                  <ArrowRight size={16} className="ml-auto text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <Link href={a.guidesHref} className="flex-1 group bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition-all flex items-center gap-3">
                <BookOpen size={20} style={{ color: EMERALD }} className="shrink-0" />
                <span className="font-bold text-slate-800 text-sm leading-snug">Read our IV therapy guides</span>
                <ArrowRight size={16} className="ml-auto text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>
        )}

        {/* ===== FAQ ===== */}
        <section className="max-w-3xl mx-auto px-6 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-black text-[#0A0B0D] tracking-tight mb-10 text-center">Common questions</h2>
          <div className="space-y-4">
            {a.faqs.map((f) => (
              <div key={f.question} className="bg-[#F8F7F3] rounded-2xl p-6 border border-slate-100">
                <h3 className="font-black text-slate-900 mb-2">{f.question}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== QUIZ CTA ===== */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <QuizCTA title={a.quizTitle} subtitle={a.quizSubtitle} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
