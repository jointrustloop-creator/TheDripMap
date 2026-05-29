import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { FAQSection } from '../../../src/components/FAQSection';
import { QuizCTA } from '../../../src/components/QuizCTA';
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
    author: { '@type': 'Organization', name: 'TheDripMap' },
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
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-8">
              {guide.title}
            </h1>
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
      </main>

      <Footer />
    </div>
  );
}
