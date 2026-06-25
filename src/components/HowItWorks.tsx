'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'motion/react';
import { Zap, Search, Droplets, ArrowRight } from 'lucide-react';

export const HowItWorks = ({ totalListings = 1042 }: { totalListings?: number }) => {
  const steps = [
    {
      step: '01',
      title: 'Share Your Goals',
      desc: 'Tell us how you feel and what you want to achieve through our quick diagnostic quiz.',
      icon: <Zap size={28} strokeWidth={2.5} />,
      gradient: 'from-wellness-400 to-wellness-600',
      shadow: 'shadow-wellness-300/40',
    },
    {
      step: '02',
      title: 'Get Matched',
      desc: 'Our algorithm analyzes local providers to find the best clinical fit for your specific needs.',
      icon: <Search size={28} strokeWidth={2.5} />,
      gradient: 'from-sky-400 to-sky-600',
      shadow: 'shadow-sky-300/40',
    },
    {
      step: '03',
      title: 'Book & Recover',
      desc: 'Connect directly with your chosen clinic and start your journey to feeling your best.',
      icon: <Droplets size={28} strokeWidth={2.5} />,
      gradient: 'from-violet-400 to-violet-600',
      shadow: 'shadow-violet-300/40',
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-28 md:py-36 px-6 relative overflow-hidden bg-gradient-to-br from-white via-wellness-50/30 to-sky-50/40">
      {/* Ambient layered orbs */}
      <div className="absolute -top-20 left-1/4 w-[500px] h-[500px] bg-wellness-200/30 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4a7362 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 md:mb-24"
        >
          <div className="inline-flex items-center gap-3 mb-8">
            <span className="h-px w-12 bg-wellness-500/40" />
            <span className="text-wellness-700 font-black text-[10px] uppercase tracking-[0.3em]">The Process</span>
            <span className="h-px w-12 bg-wellness-500/40" />
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-[1.05]">
            Your Path to{' '}
            <span className="inline-block italic bg-gradient-to-br from-wellness-500 via-wellness-700 to-wellness-900 bg-clip-text text-transparent pb-3 pr-3">Optimal</span>{' '}
            Wellness
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We&apos;ve simplified the process of finding medical-grade IV therapy. No more endless searching. Just results.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 relative mb-24"
        >
          {/* Connecting gradient line for desktop */}
          <div className="hidden md:block absolute top-28 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent z-0" />

          {steps.map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="relative group"
            >
              {/* Large outline numeral */}
              <div className="text-[9rem] md:text-[10rem] font-black absolute -top-16 md:-top-20 -left-2 md:-left-4 z-0 select-none pointer-events-none leading-none" style={{ WebkitTextStroke: '2px rgb(226 232 240)', color: 'transparent' }} aria-hidden>
                {item.step}
              </div>

              <div className="relative z-10">
                <div className={`w-24 h-24 bg-gradient-to-br ${item.gradient} rounded-[2rem] flex items-center justify-center text-white mb-10 shadow-xl ${item.shadow} group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500`}>
                  {item.icon}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-wellness-700 font-black text-xs tracking-[0.3em] uppercase">{item.step}</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-5 tracking-tight leading-[1.1] group-hover:text-wellness-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-base md:text-lg">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action — dark premium card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col items-center justify-center"
        >
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-16 w-full max-w-5xl relative overflow-hidden shadow-[0_40px_80px_-30px_rgba(15,23,42,0.6)] border border-slate-800/50">
            {/* Mesh glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-wellness-500/20 rounded-full blur-[120px] -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/15 rounded-full blur-[120px] -ml-20 -mb-20 pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="text-center md:text-left max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full mb-5">
                  <span className="w-1.5 h-1.5 bg-wellness-400 rounded-full animate-pulse" />
                  <span className="text-wellness-300 font-black text-[10px] uppercase tracking-[0.3em]">Ready When You Are</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight leading-[1.15]">Ready to find your <span className="inline-block italic bg-gradient-to-br from-wellness-300 to-sky-300 bg-clip-text text-transparent pb-2 pr-2">perfect drip?</span></h3>
                <p className="text-slate-400 text-base md:text-lg max-w-md leading-relaxed">{totalListings}+ clinics ready to match with you. Find yours in 60 seconds.</p>
              </div>
              <Link
                href="/quiz"
                className="group bg-gradient-to-br from-wellness-500 to-wellness-700 hover:from-wellness-400 hover:to-wellness-600 text-white px-8 md:px-10 py-5 md:py-6 rounded-2xl font-black text-base md:text-xl transition-all shadow-[0_20px_40px_-15px_rgba(20,184,166,0.6)] hover:shadow-[0_25px_50px_-15px_rgba(20,184,166,0.8)] hover:-translate-y-0.5 flex items-center gap-3 uppercase tracking-tighter whitespace-nowrap"
              >
                Start My Match Quiz
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
