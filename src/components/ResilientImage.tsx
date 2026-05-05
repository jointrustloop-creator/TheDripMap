'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface ResilientImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string;
  fallbackSrc: string;
}

export const ResilientImage = ({ src, fallbackSrc, alt, ...props }: ResilientImageProps) => {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(!src);

  // Sync state if src prop changes
  useEffect(() => {
    if (src) {
      setImgSrc(src);
      setHasError(false);
    } else {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  }, [src, fallbackSrc]);

  if (!imgSrc) return null;

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      unoptimized={props.unoptimized}
      onError={() => {
        if (!hasError && fallbackSrc) {
          setImgSrc(fallbackSrc);
          setHasError(true);
        }
      }}
      referrerPolicy="no-referrer"
    />
  );
};
