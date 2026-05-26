'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';

interface ClinicianSectionProps {
  stats: {
    totalListings: number;
    totalCities: number;
    totalStates: number;
    avgRating?: number;
    isLive: boolean;
    error?: string;
  };
}

export const ClinicianSection = ({ stats }: ClinicianSectionProps) => {
  return (
    <section className="py-16 md:py-20 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-16 relative overflow-hidden border border-slate-800/50 shadow-[0_40px_80px_-30px_rgba(15,23,42,0.6)] flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          {/* Layered mesh glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-wellness-500/25 rounded-full blur-[140px] -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-500/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-500/15 rounded-full blur-[140px] pointer-events-none" />
          {/* Subtle starfield dot grid */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <div className="relative z-10 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full mb-6">
              <TrendingUp size={12} className="text-wellness-300" />
              <span className="text-wellness-300 font-black text-[10px] uppercase tracking-[0.3em]">For Clinic Owners</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-5 tracking-tight leading-[1.05]">
              Own an IV Clinic? <br />
              <span className="inline-block italic bg-gradient-to-br from-wellness-300 via-wellness-400 to-sky-300 bg-clip-text text-transparent pb-2">Grow with TheDripMap.</span>
            </h2>
            <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed max-w-md">
              Join {stats.totalListings}+ elite providers across {stats.totalCities} cities and start receiving high-intent patient referrals today.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center lg:items-end gap-6 md:gap-8">
            {/* Stat row */}
            <div className="flex items-center gap-6 md:gap-10">
              <div className="text-center lg:text-right">
                <div className="text-3xl md:text-4xl font-black text-white tracking-tight">{stats.totalListings}+</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1">Clinics Verified</div>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="text-center lg:text-right">
                <div className="text-3xl md:text-4xl font-black text-white tracking-tight">{stats.totalCities}+</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1">Cities Reached</div>
              </div>
            </div>

            <Link
              href="/for-clinics"
              className="group relative bg-gradient-to-br from-wellness-400 via-wellness-500 to-wellness-700 hover:from-wellness-300 hover:via-wellness-400 hover:to-wellness-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg transition-all shadow-[0_20px_40px_-15px_rgba(20,184,166,0.6)] hover:shadow-[0_25px_50px_-15px_rgba(20,184,166,0.85)] hover:-translate-y-0.5 flex items-center gap-3 whitespace-nowrap"
            >
              <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
              Claim Your Listing
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Free · No credit card</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
