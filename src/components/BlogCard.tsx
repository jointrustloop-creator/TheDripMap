import React from 'react';
import Link from 'next/link';
import {
  Clock,
  User,
  ArrowRight,
  MapPin,
  Droplets,
  Activity,
  Sparkles,
  DollarSign,
  BookOpen,
} from 'lucide-react';
import { BlogPost } from '../types';
import { cn } from '../lib/utils';

interface BlogCardProps {
  post: BlogPost;
  className?: string;
}

// Themes per category. Multiple gradients per theme so 20 posts in one
// category don't all look identical — slug hash picks the variant.
const THEMES = {
  'City Guides': {
    gradients: [
      'from-sky-500 to-sky-700',
      'from-sky-600 to-cyan-700',
      'from-cyan-500 to-blue-700',
    ],
    Icon: MapPin,
  },
  'Treatment Guides': {
    gradients: [
      'from-wellness-500 to-wellness-700',
      'from-wellness-600 to-emerald-700',
      'from-emerald-500 to-teal-700',
    ],
    Icon: Droplets,
  },
  'Conditions & Symptoms': {
    gradients: [
      'from-violet-500 to-violet-700',
      'from-violet-600 to-purple-700',
      'from-indigo-500 to-violet-700',
    ],
    Icon: Activity,
  },
  'Lifestyle & Wellness': {
    gradients: [
      'from-pink-500 to-rose-700',
      'from-rose-500 to-fuchsia-700',
      'from-pink-600 to-rose-800',
    ],
    Icon: Sparkles,
  },
  'Cost & Insurance': {
    gradients: [
      'from-amber-500 to-amber-700',
      'from-amber-600 to-orange-700',
      'from-yellow-500 to-amber-700',
    ],
    Icon: DollarSign,
  },
  default: {
    gradients: [
      'from-slate-700 to-slate-900',
      'from-slate-600 to-slate-800',
      'from-slate-700 to-zinc-900',
    ],
    Icon: BookOpen,
  },
} as const;

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h << 5) - h + slug.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export const BlogCard = ({ post, className }: BlogCardProps) => {
  const theme = (THEMES[post.category as keyof typeof THEMES] ?? THEMES.default) as typeof THEMES['default'];
  const hash = hashSlug(post.slug);
  const gradient = theme.gradients[hash % theme.gradients.length];
  const Icon = theme.Icon;
  // Slight rotation + position offset per slug so the anchor icon doesn't sit identically
  const iconRotation = (hash % 7) - 3; // -3 to +3 degrees
  const iconShift = (hash % 11) - 5;   // -5 to +5 px

  return (
    <div className={cn(
      "group bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-[0_20px_40px_-20px_rgba(15,23,42,0.12)] hover:shadow-[0_30px_60px_-20px_rgba(15,23,42,0.22)] hover:-translate-y-1 hover:border-slate-200 transition-all duration-500",
      className
    )}>
      <Link href={`/blog/${post.slug}`} className="block">
        {/* Designed cover — gradient + anchor icon + watermark, no stock photo */}
        <div className={cn(
          "relative h-48 md:h-56 overflow-hidden bg-gradient-to-br",
          gradient
        )}>
          {/* Top-right soft glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/15 rounded-full blur-3xl pointer-events-none" />
          {/* Bottom-left depth */}
          <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-black/10 rounded-full blur-3xl pointer-events-none" />

          {/* Faint dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Anchor icon — big, faded, with slug-determined rotation/offset */}
          <div
            className="absolute inset-0 flex items-center justify-center text-white/20 group-hover:text-white/30 group-hover:scale-110 transition-all duration-700"
            style={{ transform: `translate(${iconShift}px, 0) rotate(${iconRotation}deg)` }}
          >
            <Icon size={96} strokeWidth={1.5} />
          </div>

          {/* Category chip */}
          <div className="absolute top-5 left-5 z-20">
            <span className="px-3 py-1.5 bg-white/15 backdrop-blur-md border border-white/25 rounded-full text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-lg">
              {post.category}
            </span>
          </div>

          {/* Brand watermark */}
          <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            <span className="text-white/50 font-black text-[9px] tracking-[0.3em] uppercase">
              TheDripMap
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="flex items-center gap-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Clock size={12} /> 5 min read
            </div>
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
            <div className="flex items-center gap-1.5">
              <User size={12} /> {post.author}
            </div>
          </div>

          <h3 className="text-xl font-black text-slate-900 group-hover:text-wellness-700 transition-colors leading-tight mb-4 line-clamp-2">
            {post.title}
          </h3>

          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
            {post.metaDescription}
          </p>

          <div className="flex items-center gap-2 text-wellness-700 font-bold text-sm">
            Read Article <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </div>
  );
};
