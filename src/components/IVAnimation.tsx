'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export const IVAnimation = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Mouse tracking for subtle parallax
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(y, [-100, 100], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(x, [-100, 100], [-5, 5]), springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div 
      className="relative w-full h-full flex items-center justify-center bg-wellness-50 rounded-[3rem] overflow-hidden cursor-pointer group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
      }}
    >
      {/* Background Glow */}
      <motion.div 
        className="absolute w-[150%] h-[150%] bg-gradient-to-br from-wellness-200/20 via-transparent to-wellness-300/20"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* The IV Stand (Stylized) */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-200 -translate-x-1/2 opacity-50" />
      
      {/* The IV Bag */}
      <motion.div 
        className="relative z-10 w-48 h-72 bg-white/40 backdrop-blur-md border border-white/60 rounded-[2rem] shadow-2xl flex flex-col items-center p-4 overflow-hidden"
        animate={{
          y: isHovered ? -10 : 0,
          scale: isHovered ? 1.02 : 1,
          boxShadow: isHovered 
            ? "0 25px 50px -12px rgba(14, 165, 233, 0.25)" 
            : "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Pulse Glow */}
        <motion.div 
          className="absolute inset-0 bg-wellness-400/10"
          animate={{
            opacity: [0, 0.2, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Fluid Level */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-wellness-500/40 to-wellness-400/20"
          animate={{
            height: isHovered ? "85%" : "75%",
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          {/* Waves */}
          <motion.div 
            className="absolute top-0 left-0 right-0 h-4 bg-wellness-300/30 blur-sm"
            animate={{
              x: [-20, 20, -20],
              y: [-2, 2, -2],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Bubbles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/60 rounded-full"
            initial={{ bottom: -20, x: Math.random() * 100 - 50 }}
            animate={{
              bottom: "100%",
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          />
        ))}

        {/* Logo/Text in Bag */}
        <div className="mt-8 text-wellness-800/40 font-black text-2xl tracking-tighter select-none">
          DRIP
        </div>
      </motion.div>

      {/* The Tube */}
      <svg className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 pointer-events-none" viewBox="0 0 400 400">
        <motion.path
          d="M 200 250 Q 200 350 300 400"
          fill="none"
          stroke="url(#tubeGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2 }}
        />
        <defs>
          <linearGradient id="tubeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Flowing Particles in Tube */}
        {[...Array(5)].map((_, i) => (
          <motion.circle
            key={i}
            r="3"
            fill="#0ea5e9"
            animate={{
              offsetDistance: ["0%", "100%"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "linear"
            }}
            style={{
              offsetPath: "path('M 200 250 Q 200 350 300 400')",
            }}
          />
        ))}
      </svg>

      {/* Interactive Label */}
      <motion.div 
        className="absolute bottom-12 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl border border-white/50 z-20"
        animate={{
          y: isHovered ? 0 : 10,
          opacity: isHovered ? 1 : 0,
        }}
      >
        <div className="text-wellness-900 font-bold text-sm">Interactive Hydration</div>
        <div className="text-wellness-600 text-[10px] font-black uppercase tracking-widest">Hover to Infuse</div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div 
        className="absolute top-20 right-20 w-12 h-12 bg-wellness-100 rounded-full blur-xl"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.div>
  );
};
