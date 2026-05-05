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
  fallbackSrc = DEFAULT_FALLBACK
}: ClinicImageProps) => {
  // We now show "placeholder" images from Supabase if they exist
  const hasImage = !!imageUrl;

  if (!hasImage) {
    if (initials === ' ') return null;
    return <ClinicImagePlaceholder name={name} initials={initials} size={size} className={className} />;
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
