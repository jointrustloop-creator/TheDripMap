import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, ArrowRight } from 'lucide-react';
import { BlogPost } from '../types';
import { cn } from '../lib/utils';

interface BlogCardProps {
  post: BlogPost;
  className?: string;
}

export const BlogCard = ({ post, className }: BlogCardProps) => {
  return (
    <div className={cn(
      "group bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-lg hover:shadow-xl hover:border-wellness-100 transition-all duration-500",
      className
    )}>
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative h-56 overflow-hidden">
          <Image 
            src={post.imageUrl} 
            alt={post.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-4 left-4">
            <span className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg",
              post.category === 'Educational' ? "bg-blue-600 text-white" :
              post.category === 'Local' ? "bg-wellness-600 text-white" :
              "bg-amber-500 text-white"
            )}>
              {post.category}
            </span>
          </div>
        </div>

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

          <h3 className="text-xl font-black text-slate-900 group-hover:text-wellness-600 transition-colors leading-tight mb-4 line-clamp-2">
            {post.title}
          </h3>

          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
            {post.metaDescription}
          </p>

          <div className="flex items-center gap-2 text-wellness-600 font-bold text-sm">
            Read Article <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </div>
  );
};
