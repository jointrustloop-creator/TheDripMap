import React from 'react';
import Image from 'next/image';
import { Droplets } from 'lucide-react';
import { cn } from '../lib/utils';

// Official TheDripMap logo (on white background) hosted in Supabase storage.
// Note: filename has a typo ("drimap" not "dripmap") — kept as-is to match the storage object.
const LOGO_URL =
  'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/thedrimaplogo-white.jpeg';

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

  return (
    <div className={cn('flex items-center select-none', className)}>
      <Image
        src={LOGO_URL}
        alt="TheDripMap — Your Guide to Feeling Better"
        width={620}
        height={170}
        priority
        className="h-14 md:h-16 w-auto"
      />
    </div>
  );
};
