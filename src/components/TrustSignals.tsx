'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  Map,
  Globe,
  Star,
  CheckCircle2,
} from 'lucide-react';

interface TrustSignalsProps {
  stats?: {
    totalListings: number;
    totalCities: number;
    totalStates: number;
    avgRating: number;
  };
}

export const TrustSignals = ({ stats: dynamicStats }: TrustSignalsProps) => {
  // Use the real computed avg rating; fall back to a sensible default only if NaN
  const ratingValue =
    typeof dynamicStats?.avgRating === 'number' && !isNaN(dynamicStats.avgRating) && dynamicStats.avgRating > 0
      ? dynamicStats.avgRating.toFixed(1)
      : '4.9';

  const stats = [
    {
      label: 'Clinics listed',
      value: dynamicStats?.totalListings?.toString() || '...',
      icon: <Building2 size={26} strokeWidth={2.5} />,
      suffix: '+',
      gradient: 'from-wellness-400 to-wellness-600',
      shadow: 'shadow-wellness-300/40',
    },
    {
      label: 'Cities covered',
      value: dynamicStats?.totalCities?.toString() || '...',
      icon: <Map size={26} strokeWidth={2.5} />,
      suffix: '+',
      gradient: 'from-sky-400 to-sky-600',
      shadow: 'shadow-sky-300/40',
    },
    {
      label: 'States & provinces',
      value: dynamicStats?.totalStates?.toString() || '...',
      icon: <Globe size={26} strokeWidth={2.5} />,
      suffix: '+',
      gradient: 'from-violet-400 to-violet-600',
      shadow: 'shadow-violet-300/40',
    },
    {
      label: 'Average clinic rating',
      value: ratingValue,
      icon: <Star size={26} fill="currentColor" strokeWidth={2} />,
      suffix: '★',
      gradient: 'from-amber-400 to-amber-600',
      shadow: 'shadow-amber-300/40',
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 relative overflow-hidden bg-gradient-to-br from-wellness-50/40 via-white to-amber-50/30">
      {/* Ambient orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-wellness-100/40 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Eyebrow + heading — gives the stats grid proper hierarchy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-12 bg-wellness-500/40" />
            <span className="text-wellness-700 font-black text-[10px] uppercase tracking-[0.3em]">By The Numbers</span>
            <span className="h-px w-12 bg-wellness-500/40" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-3xl mx-auto">
            North America&apos;s largest <em className="not-italic bg-gradient-to-br from-wellness-600 to-wellness-800 bg-clip-text text-transparent italic inline-block pb-1">verified</em> IV therapy directory.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="group relative bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-[2rem] border border-white shadow-[0_20px_40px_-20px_rgba(15,23,42,0.12)] hover:shadow-[0_30px_60px_-20px_rgba(15,23,42,0.2)] hover:-translate-y-1 transition-all duration-500 text-center"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg ${stat.shadow} group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500`}>
                {stat.icon}
              </div>
              <div className="flex items-baseline justify-center gap-1 mb-3">
                <span className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </span>
                {stat.suffix && (
                  <span className="text-2xl md:text-3xl font-black text-slate-700">
                    {stat.suffix}
                  </span>
                )}
              </div>
              <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-14 flex items-center justify-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-wellness-200/60 rounded-full shadow-sm">
            <CheckCircle2 size={16} className="text-wellness-600" />
            <span className="text-slate-700 font-bold text-sm">Clinics verified by our team</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
