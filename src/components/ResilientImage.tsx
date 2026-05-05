'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface ResilientImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string;
  fallbackSrc: string;
}

export const ResilientImage = ({ src, fallbackSrc, alt, ...props }: ResilientImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Sync state if src prop changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  // Determine if it's a Supabase image that might need unoptimized loading
  const isSupabase = typeof src === 'string' && src.includes('supabase.co');
  
  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      unoptimized={props.unoptimized !== undefined ? props.unoptimized : isSupabase}
      onError={() => {
        if (!hasError) {
          setImgSrc(fallbackSrc);
          setHasError(true);
        }
      }}
      referrerPolicy="no-referrer"
    />
  );
};
