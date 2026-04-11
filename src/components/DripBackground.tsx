'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Drip {
  id: number;
  left: string;
  delay: number;
  duration: number;
  height: number;
  opacity: number;
  type: 'line' | 'drop';
}

export const DripBackground = () => {
  const [drips, setDrips] = useState<Drip[]>([]);

  useEffect(() => {
    // Generate random drips
    const newDrips = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 10,
      duration: 5 + Math.random() * 10,
      height: Math.random() > 0.7 ? 4 : 40 + Math.random() * 100,
      opacity: 0.05 + Math.random() * 0.1,
      type: (Math.random() > 0.7 ? 'drop' : 'line') as 'drop' | 'line',
    }));
    setDrips(newDrips);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white z-0" />
      
      {/* Ambient Blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-wellness-100/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-wellness-50/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Animated Drips */}
      <div className="absolute inset-0">
        {drips.map((drip) => (
          <motion.div
            key={drip.id}
            initial={{ y: -200, opacity: 0 }}
            animate={{ 
              y: ['0vh', '110vh'],
              opacity: [0, drip.opacity, drip.opacity, 0]
            }}
            transition={{
              duration: drip.duration,
              repeat: Infinity,
              delay: drip.delay,
              ease: "linear",
            }}
            style={{
              position: 'absolute',
              left: drip.left,
              width: drip.type === 'drop' ? '4px' : '1px',
              height: drip.type === 'drop' ? '4px' : `${drip.height}px`,
              background: drip.type === 'drop' 
                ? 'var(--color-wellness-400)' 
                : `linear-gradient(to bottom, transparent, ${drip.id % 2 === 0 ? 'var(--color-wellness-400)' : 'var(--color-wellness-200)'}, transparent)`,
              borderRadius: 'full',
              filter: drip.id % 3 === 0 ? 'blur(1px)' : 'none',
              boxShadow: drip.type === 'drop' ? '0 0 8px var(--color-wellness-300)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Modern SaaS Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `radial-gradient(var(--color-wellness-600) 0.5px, transparent 0.5px)`,
          backgroundSize: '24px 24px'
        }} 
      />
    </div>
  );
};
