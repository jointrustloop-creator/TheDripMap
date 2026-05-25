import React from 'react';
import Image from 'next/image';
import { Droplets } from 'lucide-react';
import { cn } from '../lib/utils';

// Official TheDripMap logo — high-res "largerlogo" version, hosted in Supabase storage.
const LOGO_URL =
  'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/largerlogo.jpg';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export const Logo = ({ className, iconOnly = false }: LogoProps) => {
  // Icon-only fallback: keep the simple mark for tiny placements (favicons, mobile fold)
  if (iconOnly) {
    return (
      <div className={cn('flex items-center select-none', className)}>
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
          <Droplets size={20} className="text-wellness-400" />
        </div>
      </div>
    );
  }

  // Visual crop: largerlogo.jpg has roughly equal whitespace padding on both
  // sides of the actual logo mark. To make "left-align" actually look
  // left-aligned, we pull the image leftward with a negative margin and clip
  // the overflow on the parent. Tune the negative margin if the padding ratio
  // changes (or replace the source with a tight-cropped image).
  return (
    <div className={cn('flex items-center select-none overflow-hidden', className)}>
      <Image
        src={LOGO_URL}
        alt="TheDripMap — Your Guide to Feeling Better"
        width={1500}
        height={350}
        priority
        className="h-24 md:h-32 w-auto -ml-5 md:-ml-8"
      />
    </div>
  );
};
