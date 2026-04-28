'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

const WELLNESS_NEEDS = [
  { id: 1, label: 'Immunity', color: 'bg-emerald-400', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.4)]' },
  { id: 2, label: 'Energy', color: 'bg-amber-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]' },
  { id: 3, label: 'Recovery', color: 'bg-blue-400', glow: 'shadow-[0_0_20px_rgba(96,165,250,0.4)]' },
  { id: 4, label: 'Focus', color: 'bg-purple-400', glow: 'shadow-[0_0_20px_rgba(192,132,252,0.4)]' },
  { id: 5, label: 'Glow', color: 'bg-rose-400', glow: 'shadow-[0_0_20px_rgba(251,113,133,0.4)]' },
  { id: 6, label: 'Detox', color: 'bg-cyan-400', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]' },
];

export function IVAnimation() {
  const [activeNeed, setActiveNeed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNeed((prev) => (prev + 1) % WELLNESS_NEEDS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#050A14] flex items-center justify-center overflow-hidden">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-wellness-500/30 to-transparent blur-[150px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-wellness-400/20 to-transparent blur-[150px] rounded-full"
        />
      </div>

      {/* Floating Wellness Nodes */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {WELLNESS_NEEDS.map((need, idx) => {
          const angle = (idx / WELLNESS_NEEDS.length) * Math.PI * 2;
          const radius = 220;
          return (
            <motion.div
              key={need.id}
              animate={{
                x: [
                  Math.cos(angle) * radius,
                  Math.cos(angle) * (radius + 20),
                  Math.cos(angle) * radius
                ],
                y: [
                  Math.sin(angle) * radius,
                  Math.sin(angle) * (radius + 20),
                  Math.sin(angle) * radius
                ],
                scale: activeNeed === idx ? 1.2 : 0.8,
                opacity: activeNeed === idx ? 1 : 0.4,
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
            >
              <div className={`w-3 h-3 rounded-full ${need.color} ${need.glow}`} />
              <AnimatePresence mode="wait">
                {activeNeed === idx && (
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] font-bold tracking-widest uppercase text-white/60 whitespace-nowrap"
                  >
                    {need.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Main IV Bag Unit */}
      <div className="relative z-20 flex flex-col items-center">
        {/* Support Line */}
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-white/20 to-white/40 mb-[-5px]" />

        {/* The Bag */}
        <motion.div 
          animate={{ 
            y: [0, 5, 0],
            rotate: [-0.5, 0.5, -0.5]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-64 h-80 filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          {/* Outer Shell */}
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-b-[5rem] rounded-t-[2.5rem] overflow-hidden">
            
            {/* Liquid System */}
            <motion.div 
              animate={{ 
                height: ['52%', '54%', '52%'],
                backgroundColor: [
                  'rgba(56, 189, 248, 0.1)', 
                  'rgba(14, 165, 233, 0.15)', 
                  'rgba(56, 189, 248, 0.1)'
                ] 
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-0 left-0 right-0 w-full rounded-b-[4.5rem]"
            >
              {/* Internal Fluid Motion */}
              <motion.div 
                animate={{ x: ['-20%', '20%'], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
              />

              {/* Rising Nutrient Particles */}
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [-10, -250], 
                    opacity: [0, 0.5, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 5 + Math.random() * 5, 
                    repeat: Infinity, 
                    delay: Math.random() * 5 
                  }}
                  className={`absolute w-1 h-1 rounded-full ${WELLNESS_NEEDS[activeNeed].color} opacity-20`}
                  style={{ left: `${15 + Math.random() * 70}%` }}
                />
              ))}
            </motion.div>

            {/* Smart Medical Label */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-44 p-4 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm select-none">
              <div className="flex justify-between items-center mb-3">
                <div className="h-1.5 w-8 bg-wellness-400 rounded-full" />
                <div className="text-[8px] font-mono text-white/30 uppercase tracking-[0.2em]">Medical Grade</div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeNeed}
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  className="flex flex-col gap-1"
                >
                  <div className="text-[12px] font-bold text-white/90 tracking-tight leading-none uppercase">
                    Protocol {WELLNESS_NEEDS[activeNeed].id}0{activeNeed + 1}
                  </div>
                  <div className={`text-[10px] font-medium ${WELLNESS_NEEDS[activeNeed].color.replace('bg-', 'text-')} tracking-wide`}>
                    {WELLNESS_NEEDS[activeNeed].label} Optimized
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <div className="h-1 w-16 bg-white/10 rounded-full" />
                  <div className="h-1 w-10 bg-white/10 rounded-full" />
                </div>
                <div className="text-[10px] font-mono text-white/20">500mL</div>
              </div>
            </div>

            {/* Glass Curvature Highlights */}
            <div className="absolute inset-y-0 left-6 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="absolute inset-y-0 right-6 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
          </div>

          {/* Bag Hole */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-white/20 shadow-inner" />
        </motion.div>

        {/* Drip Chamber (Glassmorphism Detail) */}
        <div className="relative w-12 h-20 bg-white/[0.05] border border-white/10 rounded-2xl mt-[-8px] backdrop-blur-md overflow-hidden flex flex-col items-center">
            {/* The Actual Drip */}
            <motion.div 
              animate={{ 
                y: [0, 45], 
                opacity: [0, 1, 0, 0],
                scale: [1, 1.2, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: [0.4, 0, 0.6, 1]
              }}
              className="w-1.5 h-1.5 bg-sky-200 rounded-full mt-3 blur-[0.5px]"
            />
            
            {/* Fluid build-up at bottom of chamber */}
            <div className="absolute bottom-0 w-full h-4 bg-sky-400/20" />
        </div>

        {/* Infusion Line */}
        <div className="relative w-2 h-[500px]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-white/20 via-white/5 to-transparent" />
          {/* Subtle line flow animation */}
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, 500], opacity: [0, 0.3, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 1.5 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-white/40"
            />
          ))}
        </div>
      </div>

      {/* Atmospheric Overlays */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {/* Grain / Texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </div>
  );
}
