'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SymptomImageProps {
  slug: string;
  title: string;
}

export function SymptomImage({ slug, title }: SymptomImageProps) {
  const [errorCount, setErrorCount] = useState(0);
  
  const getSrc = () => {
    const base = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-';
    
    // Explicit mapping for symptoms where the slug doesn't match a dedicated filename
    const assetMapping: Record<string, string> = {
      'stress': 'woman-relaxing.jpg',
      'cold-and-flu': 'woman-home.jpg',
      'fatigue': 'man-lounge.jpg',
      'hangover': 'two-women.jpg',
      'hangover-recovery': 'two-women.jpg',
      'jet-lag': 'man-lounge.jpg',
      'migraine': 'woman-relaxing.jpg',
      'immunity': 'group-clinic.jpg',
      'dehydration': 'woman-home.jpg',
      'sports-recovery': 'man-lounge.jpg',
      'stomach-flu': 'woman-home.jpg',
      'skin-glow': 'two-women.jpg',
      'weight-loss': 'woman-relaxing.jpg',
      'energy-boost': 'man-lounge.jpg',
    };

    // Core fallback images we know exist in the bucket
    const coreFallbacks = [
      'group-clinic.jpg',
      'woman-relaxing.jpg',
      'man-lounge.jpg',
      'woman-home.jpg',
      'two-women.jpg'
    ];

    // Priority 1: Use the explicit mapping if available to avoid 400s
    if (assetMapping[slug]) {
      if (errorCount === 0) return `${base}${assetMapping[slug]}`;
      // If the mapped image somehow fails, use core fallbacks
      const fallbackIdx = (errorCount - 1) % coreFallbacks.length;
      return `${base}${coreFallbacks[fallbackIdx]}`;
    }

    // Priority 2: Try the exact slug (for any symptoms not in mapping)
    if (errorCount === 0) return `${base}${slug}.jpg`;
    if (errorCount === 1) return `${base}${slug}.png`;

    // Priority 3: Cycle through confirmed working assets
    const fallbackIdx = (errorCount - 2) % coreFallbacks.length;
    return `${base}${coreFallbacks[fallbackIdx]}`;
  };

  return (
    <Image 
      src={getSrc()}
      alt={`IV therapy for ${title}`}
      fill
      className="object-cover transition-transform duration-700 group-hover:scale-110"
      onError={() => setErrorCount(prev => prev + 1)}
    />
  );
}
