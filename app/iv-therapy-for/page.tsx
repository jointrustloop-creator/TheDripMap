'use client';

import Link from 'next/link';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Navbar } from '@/src/components/Navbar';
import { Footer } from '@/src/components/Footer';
import { SymptomImage } from '@/src/components/SymptomImage';
import { useEffect, useState } from 'react';
import { UseCase } from '@/src/lib/use-cases';
import { getAllUseCases } from '@/src/lib/data';

export default function UseCaseHubPage() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);

  useEffect(() => {
    getAllUseCases().then(setUseCases);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main>
        {/* Hero Section - Redesigned */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-wellness-50/50 to-transparent rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-40 right-[10%] w-64 h-64 border border-wellness-100 rounded-full opacity-20"
            />
            <motion.div
              animate={{ 
                y: [0, 20, 0],
                rotate: [0, -5, 0]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 left-[5%] w-96 h-96 border border-wellness-200 rounded-[4rem] opacity-10"
            />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-wellness-50 text-wellness-700 font-black text-[10px] uppercase tracking-[0.3em] mb-8 shadow-sm">
                  Clinical Solutions
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]"
              >
                IV Therapy for <br />
                <span className="relative">
                  <span className="relative z-10 italic text-wellness-600">Every</span>
                  <motion.span 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="absolute bottom-2 left-0 w-full h-4 bg-wellness-100/50 -z-0 origin-left"
                  />
                </span> Need
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-xl md:text-2xl text-slate-500 max-w-xl leading-relaxed mb-12 font-medium"
              >
                Expert-led protocols designed to restore balance, enhance performance, and support your body&apos;s natural resilience.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap gap-4"
              >
                <Link 
                  href="#symptoms-grid"
                  className="px-8 py-5 bg-wellness-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-wellness-700 transition-all shadow-xl shadow-wellness-200/50 flex items-center gap-3 group"
                >
                  Explore Symptoms
                  <Icons.ArrowDown size={18} className="group-hover:translate-y-1 transition-transform" />
                </Link>
                <Link 
                  href="/quiz"
                  className="px-8 py-5 bg-white text-slate-900 border border-slate-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                  Take the Quiz
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Grid Section */}
        <section id="symptoms-grid" className="py-24 bg-white border-t border-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Tailored Treatments</h2>
                <p className="text-slate-500 font-medium max-w-md">Browse our clinical use cases to find the right nutrient infusion for your specific goals.</p>
              </div>
              <div className="flex gap-2">
                <div className="px-4 py-2 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                  {useCases.length} Options Found
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {useCases.map((useCase, idx) => {
                const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[useCase.icon];
                
                return (
                  <motion.div
                    key={useCase.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link 
                      href={`/iv-therapy-for/${useCase.slug}`}
                      className="group block relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
                    >
                      {/* Image Area */}
                      <div className="relative h-64 overflow-hidden">
                        <SymptomImage slug={useCase.slug} title={useCase.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        
                        <div className="absolute top-6 right-6">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20">
                            {IconComponent && <IconComponent size={24} />}
                          </div>
                        </div>

                        <div className="absolute bottom-6 left-8">
                          <div className="px-3 py-1 bg-wellness-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full mb-2 inline-block">
                            {useCase.serviceTag}
                          </div>
                          <h3 className="text-2xl font-black text-white tracking-tight">{useCase.title}</h3>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-8">
                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6">
                          {useCase.description}
                        </p>
                        <div className="flex items-center text-wellness-600 text-xs font-black uppercase tracking-widest gap-2 group-hover:gap-4 transition-all">
                          Protocol Details <Icons.ArrowRight size={14} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quiz CTA */}
        <section className="py-32 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-wellness-600 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">
              Not sure which drip is <span className="text-wellness-400">right for you?</span>
            </h2>
            <p className="text-xl text-slate-300 mb-12 leading-relaxed">
              Our clinical quiz analyzes your symptoms and lifestyle to match you with the ideal nutrient profile.
            </p>
            <Link 
              href="/quiz"
              className="inline-flex items-center gap-4 bg-wellness-600 text-white px-10 py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-wellness-700 transition-all shadow-2xl shadow-wellness-900/50"
            >
              <Icons.Zap size={20} />
              Start Diagnostic Quiz
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

