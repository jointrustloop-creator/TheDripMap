'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Map, 
  Globe, 
  Star,
  CheckCircle2
} from 'lucide-react';

export const TrustSignals = () => {
  const stats = [
    { 
      label: 'Clinics listed', 
      value: '496', 
      icon: <Building2 className="text-wellness-600" size={24} />,
      suffix: ''
    },
    { 
      label: 'Cities covered', 
      value: '276', 
      icon: <Map className="text-wellness-600" size={24} />,
      suffix: ''
    },
    { 
      label: 'States represented', 
      value: '50', 
      icon: <Globe className="text-wellness-600" size={24} />,
      suffix: ''
    },
    { 
      label: 'Average clinic rating', 
      value: '4.8', 
      icon: <Star className="text-amber-500 fill-amber-500" size={24} />,
      suffix: '★'
    },
  ];

  return (
    <section className="py-24 px-6 bg-slate-50/50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-6 group-hover:scale-110 transition-transform duration-300">
                {stat.icon}
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </span>
                {stat.suffix && (
                  <span className="text-2xl font-black text-slate-900">
                    {stat.suffix}
                  </span>
                )}
              </div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
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
          className="mt-16 flex items-center justify-center gap-2 text-slate-500 font-medium text-sm"
        >
          <CheckCircle2 size={16} className="text-wellness-600" />
          <span>Updated daily from verified Google Maps data across the United States.</span>
        </motion.div>
      </div>
    </section>
  );
};
