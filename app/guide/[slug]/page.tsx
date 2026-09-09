import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { PRICE_INDEX } from '../../../src/lib/price-index-data';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { FAQSection } from '../../../src/components/FAQSection';
import { QuizCTA } from '../../../src/components/QuizCTA';
import { GuideByline, MethodologyNote } from '../../../src/components/GuideByline';
import { GUIDES, getGuideBySlug } from '../../../src/lib/guides';

export const revalidate = 86400;
export const dynamicParams = false;

const SITE_URL = 'https://www.thedripmap.com';

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.metaDescription,
    url: `${SITE_URL}/guide/${guide.slug}`,
    author: { '@type': 'Organization', name: guide.author || 'TheDripMap Editorial Team' },
    ...(guide.lastUpdated ? { dateModified: guide.lastUpdated } : {}),
    ...(guide.reviewedBy ? { reviewedBy: { '@type': 'Person', name: guide.reviewedBy } } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'TheDripMap',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/guide/${guide.slug}` },
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <BreadcrumbNav
          items={[
            { label: 'Guides', href: '/guide' },
            { label: guide.title },
          ]}
        />

        <article className="mt-12">
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold border border-wellness-100 shadow-sm mb-6">
              <BookOpen size={16} />
              <span>Guide</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              {guide.title}
            </h1>
            <GuideByline
              author={guide.author}
              lastUpdated={guide.lastUpdated}
              reviewedBy={guide.reviewedBy}
            />
            <p className="text-xl text-slate-600 leading-relaxed">{guide.intro}</p>
          </header>

          <div className="space-y-16">
            {guide.sections.map((section, i) => (
              <section key={i}>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">{section.heading}</h2>
                {section.paragraphs?.map((p, pi) => (
                  <p key={pi} className="text-lg text-slate-600 leading-relaxed mb-5">{p}</p>
                ))}
                {section.bullets && (
                  <ul className="space-y-3 mb-5">
                    {section.bullets.map((b, bi) => (
                      <li key={bi} className="flex items-start gap-3 text-lg text-slate-600 leading-relaxed">
                        <span className="text-wellness-600 font-black mt-1">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.subsections?.map((sub, si) => (
                  <div key={si} className="mt-8">
                    <h3 className="text-xl font-black text-slate-900 mb-4">{sub.heading}</h3>
                    {sub.paragraphs.map((p, pi) => (
                      <p key={pi} className="text-lg text-slate-600 leading-relaxed mb-4">{p}</p>
                    ))}
                  </div>
                ))}
              </section>
            ))}
          </div>

          {/* Cost guide -> the Price Index (Activation Plan step 4). The guide
              ranks (position ~13) and was a dead end; the logical next answer
              is the real, current prices by city that the guide is derived
              from. City chips are rendered from PRICE_INDEX, so a new city
              appears here the day it is published. */}
          {guide.slug === 'iv-therapy-cost-guide' && (
            <aside className="mt-16 rounded-[2rem] bg-wellness-900 text-white p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-wellness-800 rounded-bl-[6rem] -mr-10 -mt-10" aria-hidden="true" />
              <div className="relative z-10">
                <div className="text-[11px] font-black uppercase tracking-[0.15em] text-wellness-200 mb-3">The next question</div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3 leading-tight text-white">See real prices in your city</h2>
                <p className="text-wellness-100 text-sm md:text-[15px] leading-relaxed max-w-xl mb-6">
                  Every number above comes from the IV Price Index, built from clinics&apos; own published menus. Open your city for the full breakdown by treatment, and the clinics behind each price.
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.values(PRICE_INDEX).map((c) => (
                    <Link
                      key={c.citySlug}
                      href={`/iv-prices/${c.citySlug}`}
                      className="inline-flex items-center gap-1.5 bg-white text-wellness-900 px-4 py-2.5 rounded-xl font-black text-sm hover:bg-wellness-50 transition-all"
                    >
                      {c.city} <span className="font-bold text-wellness-700">from CA${c.headline.low}</span>
                    </Link>
                  ))}
                  <Link
                    href="/iv-prices"
                    className="inline-flex items-center gap-2 border border-white/30 text-white px-4 py-2.5 rounded-xl font-black text-sm hover:bg-white/10 transition-all"
                  >
                    All cities <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </aside>
          )}

          {(guide.relatedTreatments?.length || guide.relatedCities?.length) && (
            <section className="mt-20 pt-12 border-t border-slate-100">
              {guide.relatedTreatments && guide.relatedTreatments.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Related Treatments</h3>
                  <div className="flex flex-wrap gap-2">
                    {guide.relatedTreatments.map((t) => (
                      <Link
                        key={t.slug}
                        href={`/treatments/${t.slug}`}
                        className="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-slate-700 font-bold text-sm hover:border-wellness-200 hover:text-wellness-600 transition-colors"
                      >
                        {t.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {guide.relatedCities && guide.relatedCities.length > 0 && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Related Cities</h3>
                  <div className="flex flex-wrap gap-2">
                    {guide.relatedCities.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/cities/${c.slug}`}
                        className="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-slate-700 font-bold text-sm hover:border-wellness-200 hover:text-wellness-600 transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Related guides — cross-link the sibling guides so the guide cluster
              links to itself (topical authority + crawl paths). */}
          {GUIDES.filter((g) => g.slug !== guide.slug).length > 0 && (
            <section className="mt-12 pt-12 border-t border-slate-100">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Keep reading</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 4).map((g) => (
                  <Link
                    key={g.slug}
                    href={`/guide/${g.slug}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-white border border-slate-100 text-slate-800 font-bold text-sm hover:border-wellness-200 hover:text-wellness-700 transition-colors"
                  >
                    <span>{g.title}</span>
                    <ArrowRight size={16} className="text-wellness-500 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        <div className="mt-20">
          <QuizCTA
            title="Ready to find your perfect IV therapy match?"
            subtitle="Answer 5 quick questions and we'll match you with the best clinic for your goals, location, and budget."
          />
        </div>

        <div className="mt-20">
          <FAQSection faqs={guide.faqs} title="Frequently Asked Questions" />
        </div>

        <MethodologyNote />
      </main>

      <Footer />
    </div>
  );
}
