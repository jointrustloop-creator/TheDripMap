import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { BlogCard } from '../../src/components/BlogCard';
import { getBlogPosts } from '../../src/lib/data';

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Wellness Blog | IV Therapy Guides & Local Insights | TheDripMap",
  description: "Expert guides on IV therapy, wellness protocols, and local health insights. Learn how intravenous hydration can help you reach your health goals.",
  openGraph: {
    title: "Wellness Blog | IV Therapy Guides & Local Insights | TheDripMap",
    description: "Expert guides on IV therapy, wellness protocols, and local health insights. Learn how intravenous hydration can help you reach your health goals.",
    url: 'https://thedripmap.com/blog',
    type: 'website',
    images: [
      {
        url: 'https://thedripmap.com/og-image.png',
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
    images: ['https://thedripmap.com/og-image.png'],
  },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Wellness <span className="text-wellness-600">Insights</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Expert guides on IV therapy, clinical wellness, and local health trends across the United States.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {posts.map((post, idx) => (
            <BlogCard key={idx} post={post} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
