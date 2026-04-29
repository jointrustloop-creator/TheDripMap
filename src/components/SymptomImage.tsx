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
    const blogUrl = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';
    const symptomsUrl = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/symptoms/';
    const useCasesUrl = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/use-cases/';
    
    // Explicit mapping for symptoms that don't have a direct name match in the bucket
    // These are considered "blog images" fallbacks if specific symptom images aren't found
    const assetMapping: Record<string, string> = {
      'stress': 'iv-therapy-woman-relaxing.jpg',
      'cold-and-flu': 'iv-therapy-woman-home.jpg',
      'stomach-flu': 'iv-therapy-woman-home.jpg',
      'morning-sickness': 'iv-therapy-woman-home.jpg',
      'dehydration': 'iv-therapy-woman-home.jpg',
      'migraine': 'iv-therapy-woman-relaxing.jpg',
      'event-prep': 'iv-therapy-two-women.jpg',
      'energy-boost': 'iv-therapy-man-lounge.jpg',
      'fatigue': 'iv-therapy-man-lounge.jpg',
      'jet-lag': 'iv-therapy-woman-relaxing.jpg',
      'weight-loss': 'iv-therapy-woman-relaxing.jpg',
      'sports-recovery': 'iv-therapy-man-lounge.jpg',
      'hangover': 'iv-therapy-woman-home.jpg',
      'skin-glow': 'iv-therapy-woman-relaxing.jpg',
      'immunity': 'iv-therapy-woman-home.jpg',
      'brain-fog': 'iv-therapy-man-lounge.jpg',
      'cold-flu': 'iv-therapy-woman-home.jpg',
      'flu': 'iv-therapy-woman-home.jpg',
      'recovery': 'iv-therapy-man-lounge.jpg',
    };

    // Core fallback images we know exist in the bucket
    const coreFallbacks = [
      'iv-therapy-woman-relaxing.jpg',
      'iv-therapy-woman-home.jpg',
      'iv-therapy-man-lounge.jpg',
      'iv-therapy-two-women.jpg',
      'iv-therapy-group-clinic.jpg'
    ];

    const attempts: (string | null)[] = [
      // 1. Primary: Symptoms bucket (User's specific section images) - EXHAUSTIVE CHECK
      `${symptomsUrl}${slug}.jpg`,
      `${symptomsUrl}${slug}.png`,
      `${symptomsUrl}${title.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      `${symptomsUrl}${title.toLowerCase().replace(/\s+/g, '_')}.jpg`,
      `${symptomsUrl}${title.toLowerCase().replace(/\s+/g, '')}.jpg`,
      `${symptomsUrl}${slug.replace(/-/g, '_')}.jpg`, 
      `${symptomsUrl}${slug.replace(/-/g, '')}.jpg`,
      `${symptomsUrl}${slug.replace('-and-', '-')}.jpg`,
      `${symptomsUrl}${slug.replace('-and-', '&')}.jpg`,
      `${symptomsUrl}${slug.replace('-and-', '_&_')}.jpg`,
      `${symptomsUrl}iv-therapy-${slug}.jpg`,
      `${symptomsUrl}iv-therapy-${slug}.png`,

      // 2. Secondary: Use Cases bucket
      `${useCasesUrl}${slug}.jpg`,
      `${useCasesUrl}${slug}.png`,
      `${useCasesUrl}${title.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      `${useCasesUrl}${slug.replace(/-/g, '_')}.jpg`,
      `${useCasesUrl}${slug.replace(/-/g, '')}.jpg`,

      // 3. Tertiary: Blog images bucket named after symptom
      `${blogUrl}${slug}.jpg`,
      `${blogUrl}${slug}.png`,
      `${blogUrl}${title.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      `${blogUrl}${title.toLowerCase().replace(/\s+/g, '')}.jpg`,
      `${blogUrl}iv-therapy-${slug}.jpg`,
      `${blogUrl}iv-therapy-${slug}.png`,
      `${blogUrl}${slug.replace(/-/g, '_')}.jpg`, 
      `${blogUrl}${slug.replace(/-/g, '')}.jpg`,

      // 4. Quaternary: Explicitly mapped "blog images" 
      assetMapping[slug] ? `${blogUrl}${assetMapping[slug]}` : null,
      
      // 5. Final: Core working fallbacks (our blog images)
      ...coreFallbacks.map(file => `${blogUrl}${file}`),
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
