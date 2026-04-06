import { Metadata } from 'next';
import Link from 'next/link';
import { getAllUseCases } from '@/src/lib/data';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'IV Therapy for Symptoms & Use Cases | TheDripMap',
  description: 'Explore common reasons people seek IV therapy, from hangover recovery and jet lag to immunity boosts and skin glow. Find the right drip for your needs.',
};

export default async function UseCaseHubPage() {
  const useCases = await getAllUseCases();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            IV Therapy for Every Need
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Whether you\'re recovering from a long night, preparing for a big event, or just looking for a wellness boost, discover how IV therapy is commonly used to support your goals.
          </p>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {useCases.map((useCase) => {
              const IconComponent = (Icons as any)[useCase.icon] as LucideIcon;
              
              return (
                <Link 
                  key={useCase.slug}
                  href={`/iv-therapy-for/${useCase.slug}`}
                  className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                    {IconComponent && <IconComponent className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {useCase.title}
                  </h2>
                  <p className="text-gray-500 text-sm line-clamp-2">
                    Learn about how IV therapy is commonly used for {useCase.title.toLowerCase()} and what to expect.
                  </p>
                  <div className="mt-6 text-blue-600 font-semibold text-sm flex items-center group-hover:translate-x-1 transition-transform">
                    Learn More <Icons.ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              );
            })}
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
      <section className="py-12 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-widest font-semibold mb-4">
            Medical Disclaimer
          </p>
          <p className="text-sm text-gray-500 leading-relaxed italic">
            The information provided on this website is for informational purposes only and is not intended as medical advice, diagnosis, or treatment. IV therapy is a wellness service and should be discussed with a qualified healthcare professional. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </p>
        </div>
      </section>
    </main>
  );
}
