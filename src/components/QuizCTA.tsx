'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Sparkles } from 'lucide-react';

interface QuizCTAProps {
  className?: string;
  title?: string;
  subtitle?: string;
}

export function QuizCTA({ 
  className, 
  title = "Not sure where to start?", 
  subtitle = "Take the 30-second match quiz to find the perfect IV therapy clinic for your exact needs." 
}: QuizCTAProps) {
  return (
    <section className={className}>
      <div className="bg-[#0F6E56] rounded-[3rem] p-8 md:p-16 relative overflow-hidden text-center md:text-left">
        {/* Abstract Background Decor */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 -skew-x-12 translate-x-1/4" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-black uppercase tracking-widest mb-6">
              <Sparkles size={14} className="text-emerald-300" />
              Matching Algorithm Active
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              {title} <br />
              <span className="text-emerald-300 italic">Take the 30-second match quiz.</span>
            </h2>
            <p className="text-xl text-emerald-50 leading-relaxed font-medium">
              {subtitle}
            </p>
            
            <div className="flex flex-wrap gap-4 mt-8 justify-center md:justify-start">
              <div className="flex items-center gap-2 text-emerald-100 text-sm font-bold">
                <span className="w-5 h-5 bg-emerald-400/30 rounded-full flex items-center justify-center text-[10px]">✓</span> 
                No browsing. No guessing.
              </div>
              <div className="flex items-center gap-2 text-emerald-100 text-sm font-bold">
                <span className="w-5 h-5 bg-emerald-400/30 rounded-full flex items-center justify-center text-[10px]">✓</span> 
                Match based on real health goals.
              </div>
            </div>
          </div>
          
          <Link 
            href="/quiz"
            className="group shrink-0 bg-white text-[#0F6E56] px-12 py-6 rounded-2xl font-black text-xl hover:bg-emerald-50 transition-all shadow-2xl shadow-black/20 flex items-center gap-3 active:scale-95"
          >
            Start Match Quiz
            <Zap size={24} className="fill-[#0F6E56] group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </div>
      
      {/* Trust Quote below the CTA */}
      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden relative">
                <Image 
                  src={`https://i.pravatar.cc/100?img=${i + 10}`} 
                  alt="User" 
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <span className="text-xs font-bold text-slate-500 italic leading-none">
            &quot;Found the perfect NAD+ clinic in New York in under a minute.&quot; — <span className="text-slate-900 not-italic">Sarah T.</span>
          </span>
        </div>
      </div>
    </section>
  );
}
