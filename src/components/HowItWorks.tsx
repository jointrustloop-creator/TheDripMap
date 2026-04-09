'use client';

import React from 'react';
import { motion, Variants } from 'motion/react';
import { Zap, Search, Droplets } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    { 
      step: '01', 
      title: 'Share Your Goals', 
      desc: 'Tell us how you feel and what you want to achieve through our quick diagnostic quiz.',
      icon: <Zap size={32} className="text-wellness-400" />
    },
    { 
      step: '02', 
      title: 'Get Matched', 
      desc: 'Our algorithm analyzes local providers to find the best clinical fit for your specific needs.',
      icon: <Search size={32} className="text-wellness-400" />
    },
    { 
      step: '03', 
      title: 'Book & Recover', 
      desc: 'Connect directly with your chosen clinic and start your journey to feeling your best.',
      icon: <Droplets size={32} className="text-wellness-400" />
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
    <section className="py-32 px-6 bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-wellness-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-wellness-900 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Your Path to <span className="text-wellness-400 italic">Optimal</span> Wellness
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            We&apos;ve simplified the process of finding medical-grade IV therapy.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-16 relative"
        >
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-24 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent z-0" />
          
          {steps.map((item, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className="relative group"
            >
              {/* Number Background */}
              <div className="text-[12rem] font-black text-white/[0.03] absolute -top-20 -left-8 z-0 select-none group-hover:text-wellness-400/5 transition-colors duration-500">
                {item.step}
              </div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center mb-10 border border-slate-700 group-hover:border-wellness-500/50 group-hover:bg-slate-800/80 transition-all duration-500 shadow-2xl">
                  {item.icon}
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-wellness-400 font-black text-sm tracking-[0.2em] uppercase">{item.step}</span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>
                
                <h3 className="text-3xl font-black mb-6 tracking-tight group-hover:text-wellness-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-400 leading-relaxed text-lg font-medium">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
