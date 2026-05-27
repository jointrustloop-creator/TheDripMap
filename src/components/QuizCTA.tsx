'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface QuizCTAProps {
  className?: string;
  title?: string;
  subtitle?: string;
}

export function QuizCTA({
  className,
  title = "Not sure which clinic is right for you?",
  subtitle = "Answer 5 quick questions and we'll match you to the best IV therapy clinic for your needs.",
}: QuizCTAProps) {
  return (
    <section className={className}>
      <div className="bg-[#0F6E56] rounded-[3rem] p-8 md:p-16 relative overflow-hidden text-center md:text-left">
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight tracking-tight">
              {title}
            </h2>
            <p className="text-lg md:text-xl text-emerald-50 leading-relaxed font-medium">
              {subtitle}
            </p>
          </div>

          <Link
            href="/quiz"
            className="group shrink-0 bg-white text-[#0F6E56] px-10 py-5 rounded-2xl font-black text-lg md:text-xl hover:bg-emerald-50 transition-all shadow-2xl shadow-black/20 flex items-center gap-3 active:scale-95"
          >
            Find My Match
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
