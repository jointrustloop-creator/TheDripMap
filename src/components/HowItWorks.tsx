'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'motion/react';
import { Zap, Search, Droplets, ArrowRight } from 'lucide-react';

export const HowItWorks = ({ totalListings = 1518 }: { totalListings?: number }) => {
  const steps = [
    { 
      step: '01', 
      title: 'Share Your Goals', 
      desc: 'Tell us how you feel and what you want to achieve through our quick diagnostic quiz.',
      icon: <Zap size={32} className="text-wellness-600" />
    },
    { 
      step: '02', 
      title: 'Get Matched', 
      desc: 'Our algorithm analyzes local providers to find the best clinical fit for your specific needs.',
      icon: <Search size={32} className="text-wellness-600" />
    },
    { 
      step: '03', 
      title: 'Book & Recover', 
      desc: 'Connect directly with your chosen clinic and start your journey to feeling your best.',
      icon: <Droplets size={32} className="text-wellness-600" />
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
    <section className="py-32 px-6 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4a7362 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <span className="text-wellness-600 font-black text-xs uppercase tracking-[0.4em] mb-4 block">The Process</span>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Your Path to <span className="text-wellness-600 italic">Optimal</span> Wellness
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            We&apos;ve simplified the process of finding medical-grade IV therapy. No more endless searching—just results.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20 relative mb-24"
        >
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-24 left-0 w-full h-px bg-slate-100 z-0" />
          
          {steps.map((item, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className="relative group"
            >
              {/* Large Number Background */}
              <div className="text-[10rem] font-black text-slate-50 absolute -top-20 -left-4 z-0 select-none group-hover:text-wellness-50 transition-colors duration-500">
                {item.step}
              </div>
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-10 border border-slate-100 group-hover:border-wellness-200 group-hover:shadow-2xl group-hover:shadow-wellness-100 transition-all duration-500 shadow-xl shadow-slate-100/50">
                  {item.icon}
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-wellness-600 font-black text-sm tracking-[0.2em] uppercase">{item.step}</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                
                <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tight group-hover:text-wellness-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-lg">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col items-center justify-center"
        >
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-16 w-full max-w-5xl relative overflow-hidden shadow-2xl">
            {/* Decorative elements for CTA box */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-wellness-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-wellness-900/20 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="text-center md:text-left">
                <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Ready to find your perfect drip?</h3>
                <p className="text-slate-400 text-lg max-w-md">{totalListings}+ clinics ready to match with you. Find yours in 60 seconds.</p>
              </div>
              <Link 
                href="/quiz"
                className="group bg-wellness-600 text-white px-10 py-6 rounded-2xl font-black text-xl hover:bg-wellness-700 transition-all shadow-xl shadow-wellness-900/20 flex items-center gap-3 uppercase tracking-tighter italic whitespace-nowrap"
              >
                Start My Match Quiz
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
