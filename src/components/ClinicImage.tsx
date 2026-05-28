'use client';

import React from 'react';
import { ResilientImage } from './ResilientImage';
import { cn } from '../lib/utils';
import { ClinicImagePlaceholder } from './ClinicImagePlaceholder';

interface ClinicImageProps {
  name: string;
  imageUrl?: string;
  initials?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  size?: 'sm' | 'lg';
  fallbackSrc?: string;
  /**
   * Render the image CONTAINED on a soft branded backdrop instead of
   * cover-cropping it edge to edge. Use for claimed-clinic logos so they
   * sit centered with padding (max ~55% of the frame) and never stretch.
   */
  contain?: boolean;
}

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop';

export const ClinicImage = ({
  name,
  imageUrl,
  initials,
  className,
  fill = true,
  width,
  height,
  size = 'sm',
  fallbackSrc = DEFAULT_FALLBACK,
  contain = false,
}: ClinicImageProps) => {
  // We now show "placeholder" images from Supabase if they exist
  const hasImage = !!imageUrl;

  if (!hasImage) {
    if (initials === ' ') return null;
    return <ClinicImagePlaceholder name={name} initials={initials} size={size} className={className} />;
  }

  // Logo mode — centered + padded on a light wellness backdrop, never cropped.
  if (contain) {
    return (
      <div className={cn('absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-wellness-50/40', className)}>
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <ResilientImage
            src={imageUrl}
            fallbackSrc={fallbackSrc}
            alt={name}
            width={width || 400}
            height={height || 400}
            className="max-h-[55%] max-w-[55%] w-auto h-auto object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <ResilientImage
      src={imageUrl}
      fallbackSrc={fallbackSrc}
      alt={name}
      fill={fill}
      width={width}
      height={height}
      className={cn("object-cover", className)}
    />
  );
};
