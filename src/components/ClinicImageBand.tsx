'use client';

import React, { useState } from 'react';
import { cn } from '../lib/utils';

/**
 * Card-top image band. Renders the clinic's real photo (og:image sourced from
 * the clinic's own website) when one exists, and a DESIGNED wellness-palette
 * fallback panel when it does not — deliberate and premium, never a broken or
 * "missing image" look.
 *
 * Provider photo domains are unknown (600+ clinic sites), so this uses a plain
 * <img loading="lazy"> rather than next/image (remotePatterns cannot enumerate
 * them). A load error swaps to the designed fallback panel.
 */

interface ClinicImageBandProps {
  src?: string | null;
  alt: string;
  /** Wrapper classes when the photo renders (size the band here, e.g. aspect-video). */
  className?: string;
  /** Wrapper classes when the fallback renders; defaults to className. */
  fallbackClassName?: string;
  /** The designed fallback panel (absolutely positioned content). */
  fallback: React.ReactNode;
  /** Overlays (badges, toggles) rendered in BOTH states. */
  children?: React.ReactNode;
  /** Subtle darkening over the photo so overlaid chips stay legible. */
  overlayGradient?: boolean;
}

export const ClinicImageBand = ({
  src,
  alt,
  className,
  fallbackClassName,
  fallback,
  children,
  overlayGradient = true,
}: ClinicImageBandProps) => {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!src && !failed;

  return (
    <div className={cn('relative shrink-0 overflow-hidden', showPhoto ? className : fallbackClassName ?? className)}>
      {showPhoto ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src as string}
            alt={alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
          {overlayGradient && (
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/25 via-transparent to-black/10" />
          )}
        </>
      ) : (
        fallback
      )}
      {children}
    </div>
  );
};

/**
 * Designed fallback panel: wellness gradient, large initials, small city name.
 * 'brand' = rich teal (claimed/featured surfaces); 'soft' = light wash for the
 * muted unclaimed card.
 */
export const ClinicMonogramPanel = ({
  initials,
  city,
  variant = 'brand',
}: {
  initials: string;
  city?: string | null;
  variant?: 'brand' | 'soft';
}) => {
  const brand = variant === 'brand';
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-1.5 select-none',
        brand
          ? 'bg-gradient-to-br from-wellness-500 via-wellness-600 to-wellness-700'
          : 'bg-gradient-to-br from-wellness-100 via-wellness-50 to-emerald-100'
      )}
    >
      {/* Faint dot texture so the panel reads as designed, not empty */}
      <div
        className={cn('absolute inset-0', brand ? 'opacity-40' : 'opacity-60')}
        style={{
          backgroundImage: brand
            ? 'radial-gradient(rgba(255,255,255,0.28) 1px, transparent 1px)'
            : 'radial-gradient(rgba(74,115,98,0.18) 1px, transparent 1px)',
          backgroundSize: '10px 10px',
        }}
      />
      <span
        className={cn(
          'relative text-5xl font-black tracking-tight',
          brand ? 'text-white/90' : 'text-wellness-600/50'
        )}
      >
        {initials}
      </span>
      {city ? (
        <span
          className={cn(
            'relative text-[10px] font-black uppercase tracking-[0.3em]',
            brand ? 'text-white/70' : 'text-wellness-700/60'
          )}
        >
          {city}
        </span>
      ) : null}
    </div>
  );
};

/** True when the URL is a real clinic image, not the shared stock/placeholder filler. */
export const isRealClinicImage = (url?: string | null): boolean => {
  const u = (url || '').toLowerCase();
  if (!u) return false;
  return !/unsplash\.com|picsum|placeholder|monogram|stock/.test(u);
};

/**
 * Uploaded brand LOGOS (stored under /blog-images/ or named like a logo) belong
 * in the small avatar, not stretched across a 16:9 cover. Everything else real
 * (og:image photos from the clinic site) anchors the cover band.
 */
export const looksLikeLogo = (url?: string | null): boolean =>
  /\/blog-images\/|logo/i.test(url || '');

export const coverPhotoOf = (p: { imageUrl?: string | null; image_url?: string | null }): string | null => {
  const url = p.imageUrl || p.image_url || '';
  if (!isRealClinicImage(url) || looksLikeLogo(url)) return null;
  return url;
};
