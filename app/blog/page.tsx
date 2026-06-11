import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { ArrowRight, Clock, Zap, BookOpen, HelpCircle, MapPin } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { BlogClientContent } from '../../src/components/BlogClientContent';
import { getBlogPosts } from '../../src/lib/data';

// 2026-06-11: revalidate every 10 min so newly-published posts surface
// quickly on /blog. Matches the sitemap revalidate cycle. Previously
// 3600 (1 hour), which left freshly-published posts invisible on the
// index for up to an hour after going live.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Wellness Blog | IV Therapy Guides & Local Insights | TheDripMap",
  description: "Expert guides on IV therapy, wellness protocols, and local health insights. Learn how intravenous hydration can help you reach your health goals.",
  alternates: {
    canonical: 'https://www.thedripmap.com/blog',
  },
  openGraph: {
    title: "Wellness Blog | IV Therapy Guides & Local Insights | TheDripMap",
    description: "Expert guides on IV therapy, wellness protocols, and local health insights. Learn how intravenous hydration can help you reach your health goals.",
    url: 'https://www.thedripmap.com/blog',
    type: 'website',
    images: [
      {
        url: 'https://www.thedripmap.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TheDripMap Wellness Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Wellness Blog | IV Therapy Guides & Local Insights | TheDripMap",
    description: "Expert guides on IV therapy, wellness protocols, and local health insights. Learn how intravenous hydration can help you reach your health goals.",
    images: ['https://www.thedripmap.com/og-image.png'],
  },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();
  // Pin the newest post as the featured hero. Rest goes into the chip-filtered grid.
  const [featured, ...restPosts] = posts;

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Wellness <span className="text-wellness-600">Insights</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed font-medium">
            Expert guides on IV therapy, clinical wellness, and local health trends across the US and Canada.
          </p>
        </div>

        {/* Featured hero post — newest article gets premium real estate above the grid */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block mb-16 bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl hover:shadow-2xl transition-all"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
              <div className="relative h-64 lg:h-auto min-h-[320px] bg-slate-100 overflow-hidden">
                {featured.imageUrl && (
                  <Image
                    src={featured.imageUrl}
                    alt={featured.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                  />
                )}
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-600 bg-wellness-50 border border-wellness-100 px-3 py-1 rounded-full">
                    ★ Featured
                  </span>
                  {featured.category && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {featured.category}
                    </span>
                  )}
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight group-hover:text-wellness-600 transition-colors">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-6 line-clamp-3">
                    {featured.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                    {featured.date && (
                      <>
                        <Clock size={12} />
                        <span>{new Date(featured.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-wellness-600">
                    Read article <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        <BlogClientContent initialPosts={restPosts} />

        {/* Cross-link footer — keeps readers moving after they finish the index */}
        <section className="mt-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 md:p-14">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-wellness-600 mb-4">
            Skip the reading
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-10 tracking-tight">
            Ready to find a clinic?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Link
              href="/treatments"
              className="group bg-slate-50 hover:bg-wellness-50 rounded-[1.5rem] p-7 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-wellness-600 flex items-center justify-center mb-4 shadow-sm">
                <Zap size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                Treatments
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                NAD+, Myers Cocktail, Hangover, Beauty Glow and 6 more — full details and clinics that offer each protocol.
              </p>
              <span className="text-xs font-black text-wellness-600 uppercase tracking-widest group-hover:underline">
                See protocols →
              </span>
            </Link>
            <Link
              href="/cities"
              className="group bg-slate-50 hover:bg-wellness-50 rounded-[1.5rem] p-7 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-wellness-600 flex items-center justify-center mb-4 shadow-sm">
                <MapPin size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                Browse by city
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                300+ cities across the US and Canada with active IV therapy clinics. Find what&apos;s near you.
              </p>
              <span className="text-xs font-black text-wellness-600 uppercase tracking-widest group-hover:underline">
                All cities →
              </span>
            </Link>
            <Link
              href="/guide"
              className="group bg-slate-50 hover:bg-wellness-50 rounded-[1.5rem] p-7 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-wellness-600 flex items-center justify-center mb-4 shadow-sm">
                <BookOpen size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                Read the guides
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Cost guide, how to choose a clinic, IV vs oral supplements, first-time tips, mobile vs clinic.
              </p>
              <span className="text-xs font-black text-wellness-600 uppercase tracking-widest group-hover:underline">
                See guides →
              </span>
            </Link>
            <Link
              href="/quiz"
              className="group bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] p-7 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-wellness-600 text-white flex items-center justify-center mb-4 shadow-sm">
                <HelpCircle size={20} />
              </div>
              <h3 className="text-xl font-black mb-2 tracking-tight">
                Take the 60-sec quiz
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Pick your symptom — we&apos;ll recommend the right protocol and show clinics that offer it.
              </p>
              <span className="text-xs font-black text-wellness-300 uppercase tracking-widest">
                Start quiz →
              </span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
