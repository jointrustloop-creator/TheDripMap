'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Flame } from 'lucide-react';

interface UrgencyIndicatorProps {
  city: string;
}

export default function UrgencyIndicator({ city }: UrgencyIndicatorProps) {
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    // Generate a semi-stable number based on city name
    const hash = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const base = (hash % 15) + 5; // 5 to 20
    setViewers(base);

    const interval = setInterval(() => {
      setViewers(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1 to +1
        return Math.max(5, Math.min(25, prev + change));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [city]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-10">
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 bg-orange-50 border border-orange-100 px-4 py-3 rounded-2xl text-orange-800"
      >
        <Flame size={18} className="text-orange-500 animate-pulse" />
        <span className="text-sm font-bold truncate">High demand in {city} this week.</span>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-4 py-3 rounded-2xl text-blue-800"
      >
        <Users size={18} className="text-blue-500" />
        <span className="text-sm font-bold whitespace-nowrap">{viewers} others viewing clinics in {city} now</span>
      </motion.div>
    </div>
  );
}
