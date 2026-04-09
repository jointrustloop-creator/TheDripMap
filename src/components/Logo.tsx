import React from 'react';
import { Droplets } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export const Logo = ({ className, iconOnly = false }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2.5 group select-none", className)}>
      <div className="relative flex items-center justify-center">
        {/* $20k Logo Aesthetic: Clean, Minimalist, High-End Wellness */}
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-200 group-hover:scale-105 transition-all duration-500 ease-out">
          <Droplets size={20} className="text-wellness-400" />
        </div>
        {/* Subtle accent dot for that premium "tech-wellness" feel */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-wellness-500 rounded-full border-2 border-white" />
      </div>
      
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
            TheDrip<span className="text-wellness-600">Map</span>
          </span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
            Premium Wellness Directory
          </span>
        </div>
      )}
    </div>
  );
};
