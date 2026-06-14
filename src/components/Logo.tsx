import React from 'react';
import Image from 'next/image';
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
// Icon-only brand mark (the map-pin + IV bag), no wordmark — for tight spots.
const LOGO_MARK_URL =
  'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/largerlogo-mark.png';
const LOGO_MARK_WHITE =
  'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/largerlogo-mark-white.png';

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
  // Icon-only: the real brand mark (map-pin + IV bag) for tight placements.
  if (iconOnly) {
    return (
      <div className={cn('flex items-center select-none', className)}>
        <Image
          src={variant === 'white' ? LOGO_MARK_WHITE : LOGO_MARK_URL}
          alt="TheDripMap"
          width={160}
          height={260}
          priority
          className={cn('w-auto', imgClassName || 'h-12')}
        />
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
