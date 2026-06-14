import React from 'react';
import Image from 'next/image';
import { Droplets } from 'lucide-react';
import { cn } from '../lib/utils';

// Official TheDripMap logo — high-res "largerlogo", hosted in Supabase storage.
// Two transparent variants (white background knocked out): the default "dark"
// ink (navy + green) reads on light surfaces; "white" inverts the navy to
// white (green kept) for dark surfaces and dark email headers. Both share the
// exact same 1515x400 geometry as the original, so layout/sizing is unchanged.
const LOGO_URL =
  'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/largerlogo-transparent.png';
const LOGO_URL_WHITE =
  'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/largerlogo-white.png';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  // Override the rendered image height (defaults to the nav size). Pass e.g.
  // "h-9" for tighter placements like the owner portal or admin bar.
  imgClassName?: string;
  // "white" renders the inverted variant for dark backgrounds. Default "dark".
  variant?: 'dark' | 'white';
}

export const Logo = ({ className, iconOnly = false, imgClassName, variant = 'dark' }: LogoProps) => {
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
        src={variant === 'white' ? LOGO_URL_WHITE : LOGO_URL}
        alt="TheDripMap — Your Guide to Feeling Better"
        width={1515}
        height={400}
        priority
        className={cn('w-auto -ml-2 md:-ml-3', imgClassName || 'h-14 md:h-16')}
      />
    </div>
  );
};
