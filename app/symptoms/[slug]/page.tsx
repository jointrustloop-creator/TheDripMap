import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getUseCaseBySlug, getListingsByService, getAllUseCases, slugify } from '@/src/lib/data';
import * as Icons from 'lucide-react';
import { BreadcrumbNav } from '@/src/components/BreadcrumbNav';
import { Navbar } from '@/src/components/Navbar';
import { Footer } from '@/src/components/Footer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const useCase = await getUseCaseBySlug(slug);
  if (!useCase) return { title: 'Not Found' };

  const title = `IV Therapy for ${useCase.title} — Protocols & Local Clinics | TheDripMap`;
  const description = `Clinically-reviewed protocols for ${useCase.title.toLowerCase()} via IV therapy. Find clinics near you specializing in ${useCase.title.toLowerCase()} support.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.thedripmap.com/symptoms/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.thedripmap.com/symptoms/${slug}`,
      type: 'website',
      images: [
        {
          url: 'https://www.thedripmap.com/og-image.png',
          width: 1200,
          height: 630,
          alt: `IV Therapy protocol for ${useCase.title}`,
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

export async function generateStaticParams() {
  const useCases = await getAllUseCases();
  return useCases.map((u) => ({ slug: u.slug }));
}

import { UseCaseClinicSection } from '@/src/components/UseCaseClinicSection';
import { SymptomImage } from '@/src/components/SymptomImage';

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;
  const useCase = await getUseCaseBySlug(slug);
  if (!useCase) notFound();

  const clinics = await getListingsByService(useCase.serviceTag, 4);

  const breadcrumbs = [
    { label: 'IV Therapy For', href: '/symptoms' },
    { label: useCase.title, href: `/symptoms/${useCase.slug}` },
  ];

  // Each use case ships 8 symptom-specific FAQs, so the page renders those alone.
  // The old generic cost/speed/insurance trio was identical across all 16 symptom
  // pages (a shared-content tail) and is dropped to keep every page unique.
  const allFaqs = useCase.faqs;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFaqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  const medicalProcedureSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    "name": `IV Therapy for ${useCase.title}`,
    "description": useCase.description,
    "procedureType": "Intravenous Therapy",
    "relevantSpecialty": {
      "@type": "MedicalSpecialty",
      "name": "Wellness and Preventive Medicine"
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalProcedureSchema) }}
      />

      <main>

      {/* Header & Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbNav items={breadcrumbs} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 tracking-tight">
                IV Therapy for {useCase.title} — What to Expect
              </h1>
              <div className="prose prose-lg text-gray-600 max-w-none leading-relaxed">
                <p className="mb-6">{useCase.description}</p>
                
                {useCase.whyItWorks && (
                  <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Why IV therapy works for {useCase.title}</h2>
                    <div className="whitespace-pre-wrap">{useCase.whyItWorks}</div>
                  </div>
                )}
              </div>
            </div>
              <div className="flex flex-col gap-8 w-full md:w-[400px]">
                <div className="relative w-full aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-100 group">
                  <SymptomImage slug={useCase.slug} title={useCase.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>

                <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 h-fit">
                  <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                    <Icons.FlaskConical className="w-5 h-5 mr-2" /> Common Ingredients
                  </h3>
                  <ul className="space-y-4">
                    {useCase.ingredientsDetailed ? (
                      useCase.ingredientsDetailed.map((item, idx) => (
                        <li key={idx} className="flex items-start text-blue-800">
                          <Icons.CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold block">{item.name}</span>
                            <span className="text-sm text-blue-700/80">{item.role}</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      useCase.ingredients.map((ingredient, idx) => (
                        <li key={idx} className="flex items-start text-blue-800">
                          <Icons.CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="font-medium">{ingredient}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Comparisons & Typical Patient Section */}
      {(useCase.comparisons || useCase.typicalPatient) && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {useCase.comparisons && (
                <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">How it compares to other options</h2>
                  <p className="text-gray-600 leading-relaxed">{useCase.comparisons}</p>
                </div>
              )}
              {useCase.typicalPatient && (
                <div className="bg-blue-50/50 p-10 rounded-[2.5rem] border border-blue-100/50">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Who typically uses IV therapy for {useCase.title}</h2>
                  <p className="text-gray-600 leading-relaxed">{useCase.typicalPatient}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Session Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">What to expect at your session</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {useCase.sessionExpectation}
          </p>
        </div>
      </section>

      {/* Clinics Section */}
      <UseCaseClinicSection 
        serviceTag={useCase.serviceTag} 
        useCaseTitle={useCase.title} 
        initialClinics={clinics} 
      />

      {/* Location CTA Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Find a {useCase.title} IV clinic in your city</h2>
          <p className="text-slate-500 mb-10">Search our matching platform for top-rated providers specializing in {useCase.title.toLowerCase()} support.</p>
          
          <form action="/search" method="GET" className="relative max-w-xl mx-auto mb-12">
            <input type="hidden" name="service" value={useCase.serviceTag} />
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Icons.MapPin className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              name="city"
              placeholder="Enter your city (e.g. Dallas)"
              className="block w-full pl-12 pr-32 py-5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm font-medium"
              required
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Icons.Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { city: 'Toronto', state: 'on' },
              { city: 'Vancouver', state: 'bc' },
              { city: 'Calgary', state: 'ab' }
            ].map((loc) => (
              <Link 
                key={`${loc.city}-${loc.state}`}
                href={`/cities/${slugify(loc.city)}?service=${encodeURIComponent(useCase.serviceTag)}`}
                className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-sm font-bold text-slate-700"
              >
                IV therapy for {useCase.title} in {loc.city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Common Questions About {useCase.title}</h2>
          <div className="space-y-6">
            {allFaqs.map((faq, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiz CTA */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Not sure which drip is right for you?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Take our 60-second Drip Finder quiz to get a personalized recommendation based on your symptoms and goals.
          </p>
          <Link 
            href="/quiz"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-full text-blue-600 bg-white hover:bg-blue-50 transition-colors shadow-lg"
          >
            Take the Drip Finder Quiz
          </Link>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
