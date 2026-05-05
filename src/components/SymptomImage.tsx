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
    // Reliable Unsplash images for each symptom
    const unsplashMapping: Record<string, string> = {
      'hangover': 'https://images.unsplash.com/photo-1584515933487-759f3817edc5?q=80&w=1920&auto=format&fit=crop',
      'jet-lag': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1920&auto=format&fit=crop',
      'fatigue': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1920&auto=format&fit=crop',
      'cold-and-flu': 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=2070&auto=format&fit=crop',
      'stomach-flu': 'https://images.unsplash.com/photo-1584515933487-759f3817edc5?q=80&w=1920&auto=format&fit=crop',
      'morning-sickness': 'https://images.unsplash.com/photo-1584515933487-759f3817edc5?q=80&w=1920&auto=format&fit=crop',
      'dehydration': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1920&auto=format&fit=crop',
      'migraine': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=2070&auto=format&fit=crop',
      'event-prep': 'https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?q=80&w=2070&auto=format&fit=crop',
      'energy-boost': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1920&auto=format&fit=crop',
      'weight-loss': 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1974&auto=format&fit=crop',
      'sports-recovery': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
      'skin-glow': 'https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?q=80&w=2070&auto=format&fit=crop',
      'immunity': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop',
      'brain-fog': 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083&auto=format&fit=crop',
    };

    // Generic fallbacks using reliable Unsplash images
    const genericFallbacks = [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=2070&auto=format&fit=crop'
    ];

    const attempts: (string | null)[] = [
      // 0. High Priority: Reliable Unsplash Mapping
      unsplashMapping[slug] || null,

      // 1. Final: Core working Unsplash fallbacks
      ...genericFallbacks,
    ];

    // Filter out nulls and return the attempt corresponding to current error count
    const validAttempts = attempts.filter((src): src is string => src !== null);
    const index = Math.min(errorCount, validAttempts.length - 1);
    
    return validAttempts[index];
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
