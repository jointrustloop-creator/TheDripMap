import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Clock, 
  User, 
  Share2, 
  Calendar, 
  MapPin, 
  Zap, 
  ArrowRight,
  Star,
  ShieldCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { BlogCard } from '../../../src/components/BlogCard';
import { getBlogPostBySlug, getBlogPosts, slugify, getListingsByIds } from '../../../src/lib/data';
import { cn } from '../../../src/lib/utils';

export const revalidate = 0; // Disable caching for development

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts
    .filter(p => p.slug)
    .map((p) => ({
      slug: p.slug,
    }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  
  if (!post) return { title: 'Post Not Found' };

  const title = `${post.title} | TheDripMap`;
  const description = post.metaDescription || post.excerpt || `Read our latest guide on ${post.title.toLowerCase()}. Expert insights from TheDripMap Team.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://thedripmap.com/blog/${slug}`,
      images: [{ url: post.imageUrl || 'https://thedripmap.com/og-image.png' }],
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.lastUpdated || post.date,
      authors: [post.author || 'TheDripMap Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [post.imageUrl || 'https://thedripmap.com/og-image.png'],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  const allPosts = await getBlogPosts();
  
  if (!post) notFound();

  // DEBUG LOGGING AS REQUESTED
  console.log('RAW CONTENT:', post.content);

  const relatedPosts = allPosts
    .filter(p => p.slug !== post.slug && p.category === post.category)
    .slice(0, 2);

  const relatedClinics = post.relatedClinics 
    ? await getListingsByIds(post.relatedClinics)
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "image": post.imageUrl,
    "datePublished": post.date,
    "dateModified": post.lastUpdated || post.date,
    "author": {
      "@type": "Person",
      "name": post.author || "TheDripMap Team",
      "jobTitle": post.authorRole || "TheDripMap Editorial"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TheDripMap",
      "logo": {
        "@type": "ImageObject",
        "url": "https://thedripmap.com/logo.png"
      }
    },
    "description": post.metaDescription || post.excerpt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://thedripmap.com/blog/${slug}`
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://thedripmap.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://thedripmap.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://thedripmap.com/blog/${slug}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <BreadcrumbNav 
          items={[
            { label: 'Blog', href: '/blog' },
            { label: post.title }
          ]} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Article Content */}
          <article className="lg:col-span-8">
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg",
                  post.category === 'Educational' ? "bg-blue-600 text-white" :
                  post.category === 'Local' ? "bg-wellness-600 text-white" :
                  "bg-amber-500 text-white"
                )}>
                  {post.category}
                </span>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar size={14} /> {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                {post.lastUpdated && (
                  <div className="flex items-center gap-2 text-xs font-bold text-wellness-600 uppercase tracking-widest">
                    <Clock size={14} /> Updated: {new Date(post.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1]">
                {post.title}
              </h1>

              <div className="flex flex-col md:flex-row md:items-center justify-between py-8 border-y border-slate-100 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden">
                    {post.authorImageUrl ? (
                      <Image src={post.authorImageUrl} alt={post.author} width={48} height={48} className="object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">{post.author}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{post.authorRole || "TheDripMap Editorial"}</div>
                  </div>
                </div>

                {post.reviewedBy && (
                  <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-wellness-100 rounded-full flex items-center justify-center text-wellness-600">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medically Reviewed By</div>
                      <div className="text-xs font-bold text-slate-900">{post.reviewedBy}</div>
                    </div>
                  </div>
                )}

                <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-wellness-50 hover:text-wellness-600 transition-all shrink-0">
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            <div className="relative h-[250px] md:h-[350px] rounded-[3rem] overflow-hidden mb-16 shadow-2xl bg-[#1a3a2a] flex flex-col items-center justify-center p-8 text-center uppercase tracking-widest border border-[#2a4a3a]">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-64 h-64 bg-wellness-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-wellness-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="text-white/40 font-black text-sm mb-4 uppercase tracking-[0.4em]">TheDripMap</div>
                <div className="w-16 h-px bg-white/20 mb-6" />
                <div className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 text-[10px] font-black tracking-[0.2em]">
                  {post.category}
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none prose-slate prose-headings:font-black prose-headings:tracking-tight prose-a:text-wellness-600 prose-a:no-underline hover:prose-a:underline">
              {post.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {String(post.content)
                    .replace(/\\n/g, '\n')
                    .replace(/\[Full content is now in your app code!\]/g, '')}
                </ReactMarkdown>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center">
                  <Zap size={40} className="mx-auto mb-6 text-slate-300" />
                  <h3 className="text-xl font-black text-slate-900 mb-2">Content Coming Soon</h3>
                  <p className="text-slate-500">We are currently finalizing the medical review for this article. Please check back shortly.</p>
                </div>
              )}
            </div>

            {/* Related Cities Tags */}
            {post.relatedCities && post.relatedCities.length > 0 && (
              <div className="mt-20 pt-10 border-t border-slate-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Related Locations</h3>
                <div className="flex flex-wrap gap-3">
                  {post.relatedCities.map((city, idx) => (
                    <Link 
                      key={idx}
                      href={`/iv-therapy/${slugify(city)}`}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:border-wellness-600 hover:text-wellness-600 transition-all"
                    >
                      <MapPin size={14} /> {city}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-12">
            {/* Related Clinics */}
            {relatedClinics.length > 0 && (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Featured Clinics</h3>
                <div className="space-y-6">
                  {relatedClinics.map((clinic) => (
                    <Link 
                      key={clinic.id}
                      href={`/provider/${slugify(clinic.name)}`}
                      className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all"
                    >
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <Image src={clinic.imageUrl || `https://picsum.photos/seed/${clinic.id}/200/200`} alt={clinic.name} fill className="object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-wellness-600 transition-colors line-clamp-1">{clinic.name}</h4>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                          <MapPin size={10} /> {clinic.city}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Star size={10} className="text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-slate-700">{clinic.rating}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link 
                  href="/search"
                  className="w-full mt-8 bg-wellness-600 text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-100 flex items-center justify-center gap-2"
                >
                  Explore All Clinics <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {/* Newsletter / CTA */}
            <div className="bg-wellness-900 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-wellness-800 rounded-bl-[5rem] -mr-8 -mt-8" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-4 tracking-tight">Find Your Perfect Match</h3>
                <p className="text-wellness-100 text-sm leading-relaxed mb-8">
                  Take our clinical diagnostic quiz and get matched with the best IV therapy providers in your city.
                </p>
                <Link 
                  href="/quiz"
                  className="w-full bg-wellness-600 text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-wellness-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Zap size={16} /> Get Matched Now
                </Link>
              </div>
            </div>

            {/* Related Posts */}
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">More from the Blog</h3>
              <div className="space-y-8">
                {relatedPosts.map((post, idx) => (
                  <BlogCard key={idx} post={post} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
