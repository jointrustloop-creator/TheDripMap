'use client';

import React, { useState, useMemo } from 'react';
import { BlogPost } from '../types';
import { BlogCard } from './BlogCard';
import { cn } from '../lib/utils';

const CATEGORIES = [
  'All',
  'Treatment Guides',
  'Conditions & Symptoms',
  'City Guides',
  'Lifestyle & Wellness',
  'Cost & Insurance',
  'Clinic Owner Resources'
];

interface BlogClientContentProps {
  initialPosts: BlogPost[];
}

export function BlogClientContent({ initialPosts }: BlogClientContentProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'All') return initialPosts;
    return initialPosts.filter(post => post.category === activeCategory);
  }, [initialPosts, activeCategory]);

  return (
    <div className="space-y-12">
      {/* Sticky Filter Bar */}
      <div className="sticky top-[80px] z-30 py-6 bg-[#FDFDFB]/80 backdrop-blur-md -mx-6 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-black transition-all border shrink-0",
                activeCategory === cat
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200 scale-105"
                  : "bg-white text-slate-500 border-slate-100 hover:border-wellness-200 hover:text-wellness-600 shadow-sm"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-8">
          {filteredPosts.map((post, idx) => (
            <BlogCard key={post.slug || idx} post={post} />
          ))}
        </div>
      ) : (
        <div className="py-32 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">No posts found</h3>
          <p className="text-slate-500 font-medium">Try choosing a different category or check back later.</p>
          <button 
            onClick={() => setActiveCategory('All')}
            className="mt-6 text-wellness-600 font-black hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
