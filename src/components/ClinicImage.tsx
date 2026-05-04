'use client';

import React from 'react';
import Image from 'next/image';
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
}

export const ClinicImage = ({ 
  name, 
  imageUrl, 
  initials,
  className, 
  fill = true,
  width,
  height,
  size = 'sm'
}: ClinicImageProps) => {
  // Check if the image URL is forbidden or missing
  const isForbidden = imageUrl?.includes('unsplash.com') || imageUrl?.includes('photo-1519494026892-80bbd2d6fd0d');
  
  // We now show "placeholder" images from Supabase if they exist
  const hasImage = imageUrl && !isForbidden;

  if (!hasImage) {
    if (initials === ' ') return null;
    return <ClinicImagePlaceholder name={name} initials={initials} size={size} className={className} />;
  }

  return (
    <Image
      src={imageUrl}
      alt={name}
      fill={fill}
      width={width}
      height={height}
      className={cn("object-cover", className)}
      referrerPolicy="no-referrer"
    />
  );
};
