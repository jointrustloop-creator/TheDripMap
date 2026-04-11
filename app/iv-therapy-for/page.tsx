import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getAllUseCases } from '@/src/lib/data';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

import { Navbar } from '@/src/components/Navbar';
import { Footer } from '@/src/components/Footer';

export const metadata: Metadata = {
  title: 'IV Therapy for Symptoms & Use Cases | TheDripMap',
  description: 'Explore common reasons people seek IV therapy, from hangover recovery and jet lag to immunity boosts and skin glow. Find the right drip for your needs.',
};

export default async function UseCaseHubPage() {
  const useCases = await getAllUseCases();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-white">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4a7362 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left">
              <span className="text-wellness-600 font-black text-xs uppercase tracking-[0.4em] mb-4 block">Clinical Use Cases</span>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1]">
                IV Therapy for <br />
                <span className="text-wellness-600 italic">Every</span> Need
              </h1>
              <p className="text-xl text-slate-500 max-w-xl leading-relaxed">
                Whether you&apos;re recovering from a long night, preparing for a big event, or just looking for a wellness boost, discover how IV therapy is commonly used to support your goals.
              </p>
            </div>
            <div className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200"
                alt="Professional medical environment showing clinical IV therapy preparation"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {useCases.map((useCase) => {
              const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[useCase.icon];
              
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

      </main>
      <Footer />
    </div>
  );
}
