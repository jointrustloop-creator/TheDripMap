'use client';

import React from 'react';
import { motion } from 'motion/react';

interface TrustSignalsProps {
  stats?: {
    totalListings: number;
    totalCities: number;
    totalStates: number;
    avgRating: number;
  };
}

// Clean forest-green stat band: four large numbers separated by thin vertical
// hairlines. No icon boxes, no orbs — numbers stay dynamic from getSiteStats().
export const TrustSignals = ({ stats: dynamicStats }: TrustSignalsProps) => {
  const ratingValue =
    typeof dynamicStats?.avgRating === 'number' && !isNaN(dynamicStats.avgRating) && dynamicStats.avgRating > 0
      ? dynamicStats.avgRating.toFixed(1)
      : '4.9';

  const items = [
    { value: dynamicStats?.totalListings?.toLocaleString() || '…', suffix: '+', label: 'Clinics listed' },
    { value: dynamicStats?.totalCities?.toLocaleString() || '…', suffix: '+', label: 'Cities covered' },
    { value: dynamicStats?.totalStates?.toString() || '…', suffix: '', label: 'States & provinces' },
    { value: ratingValue, suffix: '★', label: 'Avg clinic rating' },
  ];

  // Hairlines: center vertical + row divider on mobile (2×2); vertical between
  // all four on desktop.
  const borders = [
    '',
    'border-l border-white/15',
    'border-t border-white/15 md:border-t-0 md:border-l',
    'border-l border-t border-white/15 md:border-t-0',
  ];

  return (
    <section className="bg-[#0A3D2B] px-6 py-20 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4"
      >
        {items.map((it, idx) => (
          <div key={it.label} className={`text-center px-4 py-6 md:py-3 ${borders[idx]}`}>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-4xl md:text-6xl font-black text-white tracking-tight tabular-nums">
                {it.value}
              </span>
              {it.suffix && (
                <span className="text-xl md:text-3xl font-black text-emerald-300/80">{it.suffix}</span>
              )}
            </div>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200/70">
              {it.label}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
};
