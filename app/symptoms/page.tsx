import { Metadata } from 'next';
import Link from 'next/link';
import { getAllUseCases } from '@/src/lib/data';
import * as Icons from 'lucide-react';

import { Navbar } from '@/src/components/Navbar';
import { Footer } from '@/src/components/Footer';

import { SymptomImage } from '@/src/components/SymptomImage';
import { ResilientImage } from '@/src/components/ResilientImage';

export const metadata: Metadata = {
  title: 'IV Therapy by Symptom | TheDripMap',
  description: 'Find the right IV therapy drip for your specific symptoms. Browse treatments for hangovers, fatigue, migraines, immunity, jet lag, and more.',
  alternates: {
    canonical: 'https://www.thedripmap.com/symptoms',
  },
  openGraph: {
    title: 'IV Therapy by Symptom | TheDripMap',
    description: 'Find the right IV therapy drip for your specific symptoms. Browse treatments for hangovers, fatigue, migraines, immunity, jet lag, and more.',
    url: 'https://www.thedripmap.com/symptoms',
    siteName: 'TheDripMap',
    images: [
      {
        url: 'https://www.thedripmap.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IV Therapy by Symptom',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IV Therapy by Symptom | TheDripMap',
    description: 'Find the right IV therapy drip for your specific symptoms. Browse treatments for hangovers, fatigue, migraines, immunity, jet lag, and more.',
    images: ['https://www.thedripmap.com/og-image.png'],
  },
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
              <ResilientImage 
                src="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-group-clinic.jpg"
                fallbackSrc="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2000&auto=format&fit=crop"
                alt="IV Therapy Protocols"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {useCases.map((useCase) => (
                <Link 
                  key={useCase.slug}
                  href={`/symptoms/${useCase.slug}`}
                  className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full overflow-hidden"
                >
                  <div className="relative h-48 w-full mb-6 rounded-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 shadow-inner bg-slate-50">
                    <SymptomImage slug={useCase.slug} title={useCase.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="flex-1 px-2">
                    <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-wellness-600 transition-colors">
                      {useCase.title}
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6">
                      {useCase.description}
                    </p>
                  </div>
                  <div className="px-2 mt-auto pb-2">
                    <div className="text-wellness-600 font-bold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                      Learn About Protocols <Icons.ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
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
