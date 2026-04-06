import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getUseCaseBySlug, getListingsByService, getAllUseCases } from '@/src/lib/data';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { ProviderCard } from '@/src/components/ProviderCard';
import { MedicalDisclaimer } from '@/src/components/MedicalDisclaimer';
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

  return {
    title: `IV Therapy for ${useCase.title} — Find Clinics Near You | TheDripMap`,
    description: `Learn about how IV therapy is commonly used for ${useCase.title.toLowerCase()}. Find top-rated clinics and what to expect from your session.`,
    alternates: {
      canonical: `/iv-therapy-for/${slug}`,
    },
    openGraph: {
      title: `IV Therapy for ${useCase.title}`,
      description: `Learn about how IV therapy is commonly used for ${useCase.title.toLowerCase()}.`,
      url: `https://thedripmap.com/iv-therapy-for/${slug}`,
      type: 'website',
    },
  };
}

export async function generateStaticParams() {
  const useCases = await getAllUseCases();
  return useCases.map((u) => ({ slug: u.slug }));
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;
  const useCase = await getUseCaseBySlug(slug);
  if (!useCase) notFound();

  const clinics = await getListingsByService(useCase.serviceTag, 4);
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[useCase.icon];

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'IV Therapy For', href: '/iv-therapy-for' },
    { label: useCase.title, href: `/iv-therapy-for/${useCase.slug}` },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": useCase.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.label,
      "item": `https://thedripmap.com${crumb.href}`,
    })),
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-8">
                {IconComponent && <IconComponent className="w-8 h-8 text-blue-600" />}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 tracking-tight">
                IV Therapy for {useCase.title} — What to Expect
              </h1>
              <div className="prose prose-lg text-gray-600 max-w-none leading-relaxed">
                <p>{useCase.description}</p>
              </div>
            </div>
            <div className="w-full md:w-1/3 bg-blue-50 p-8 rounded-3xl border border-blue-100">
              <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                <Icons.FlaskConical className="w-5 h-5 mr-2" /> Common Ingredients
              </h3>
              <ul className="space-y-4">
                {useCase.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex items-start text-blue-800">
                    <Icons.CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Session Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">What a session is like</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {useCase.sessionExpectation}
          </p>
        </div>
      </section>

      {/* Clinics Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Clinics for {useCase.title}</h2>
              <p className="text-gray-600">Find highly-rated providers offering {useCase.title.toLowerCase()} support.</p>
            </div>
            <Link href="/search" className="text-blue-600 font-bold hover:underline hidden sm:block">
              View All Clinics
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {clinics.map((clinic) => (
              <ProviderCard key={clinic.id} provider={clinic} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Common Questions About {useCase.title}</h2>
          <div className="space-y-6">
            {useCase.faqs.map((faq, idx) => (
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

      {/* Medical Disclaimer */}
      <div className="py-12 border-t border-gray-200">
        <MedicalDisclaimer />
      </div>
      </main>
      <Footer />
    </div>
  );
}
