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
    
    // Mapping known working images to slugs to avoid 400 errors
    const specialMapping: Record<string, string[]> = {
      'stress': ['woman-relaxing.jpg', 'woman-home.jpg', 'group-clinic.jpg'],
      'cold-and-flu': ['woman-home.jpg', 'group-clinic.jpg'],
      'jet-lag': ['man-lounge.jpg', 'woman-relaxing.jpg'],
      'hangover': ['two-women.jpg', 'woman-relaxing.jpg'],
      'fatigue': ['man-lounge.jpg', 'woman-home.jpg'],
      'sports-recovery': ['man-lounge.jpg', 'group-clinic.jpg'],
      'migraine': ['woman-relaxing.jpg', 'woman-home.jpg'],
      'weight-loss': ['woman-relaxing.jpg', 'woman-home.jpg'],
      'skin-glow': ['woman-relaxing.jpg', 'two-women.jpg'],
      'stomach-flu': ['woman-home.jpg', 'group-clinic.jpg'],
      'immunity': ['group-clinic.jpg', 'woman-home.jpg'],
      'morning-sickness': ['woman-home.jpg', 'woman-relaxing.jpg'],
      'event-prep': ['group-clinic.jpg', 'two-women.jpg'],
      'dehydration': ['man-lounge.jpg', 'woman-home.jpg'],
      'brain-fog': ['man-lounge.jpg', 'woman-relaxing.jpg'],
    };

    if (specialMapping[slug]) {
      const fallbacks = specialMapping[slug];
      if (errorCount < fallbacks.length) {
        return `${base}${fallbacks[errorCount]}`;
      }
      return `${base}group-clinic.jpg`;
    }

    if (errorCount === 0) return `${base}${slug}.jpg`;
    if (errorCount === 1 && slug.includes('-and-')) return `${base}${slug.replace('-and-', '-')}.jpg`;
    if (errorCount === 1) return `${base}${slug}.png`;
    if (errorCount === 2 && slug.includes('-and-')) return `${base}${slug.replace('-and-', '-')}.png`;
    
    return `${base}group-clinic.jpg`;
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
