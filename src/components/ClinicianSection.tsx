'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';

interface ClinicianSectionProps {
  stats: {
    totalListings: number;
    totalCities: number;
    totalStates: number;
    isLive: boolean;
    error?: string;
  };
}

export const ClinicianSection = ({ stats }: ClinicianSectionProps) => {
  return (
    <section className="py-12 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden border border-slate-800 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10"
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-wellness-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 text-wellness-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <TrendingUp size={12} />
              <span>For Business Owners</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight leading-tight">
              Own an IV Clinic? <br />
              <span className="text-slate-400">Grow with TheDripMap.</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md">
              Join {stats.totalListings}+ elite providers across {stats.totalCities} cities and start receiving high-intent patient referrals today.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center lg:justify-end gap-8 md:gap-12">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-black text-white">{stats.totalListings}+</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clinics</div>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-black text-white">12k+</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Matches</div>
              </div>
            </div>

            <Link 
              href="/for-clinics"
              className="group bg-wellness-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-wellness-700 transition-all shadow-xl shadow-wellness-900/20 flex items-center gap-2 whitespace-nowrap"
            >
              Claim Your Listing
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
