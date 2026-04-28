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
    
    // Attempt 0: Original slug
    if (errorCount === 0) return `${base}${slug}.jpg`;
    
    // Attempt 1: Handle "and" cases or try common variations
    if (errorCount === 1) {
      if (slug.includes('-and-')) {
        return `${base}${slug.replace('-and-', '-')}.jpg`;
      }
      if (slug === 'stress') {
        return `${base}woman-relaxing.jpg`; // Known working image that fits stress
      }
      if (slug === 'cold-and-flu') {
        return `${base}woman-home.jpg`; // Known working image that fits cold/flu
      }
      return `${base}${slug}.png`;
    }
    
    // Attempt 2: More variations
    if (errorCount === 2) {
      if (slug.includes('-and-')) {
        return `${base}${slug.replace('-and-', '-')}.png`;
      }
      if (slug === 'cold-and-flu') {
        return `${base}stomach-flu.jpg`; // User confirmed this works
      }
      return `${base}group-clinic.jpg`;
    }
    
    // Generic fallback
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
