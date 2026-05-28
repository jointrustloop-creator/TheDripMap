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

  // largerlogo.jpg has whitespace padding around the actual mark. We crop
  // that padding visually by pulling the image left with a small negative
  // margin and clipping overflow. Logo sizes are now nav-appropriate
  // (~10-12 → ~40-48px tall) — anything bigger crowded out the nav links and
  // forced "Explore Clinics" / "For Clinics" / "Get Matched" onto a second
  // line on standard laptop widths.
  return (
    <div className={cn('flex items-center select-none overflow-hidden', className)}>
      <Image
        src={LOGO_URL}
        alt="TheDripMap — Your Guide to Feeling Better"
        width={1500}
        height={350}
        priority
        className="h-14 md:h-16 w-auto -ml-2 md:-ml-3 mix-blend-multiply"
      />
    </div>
  );
};
