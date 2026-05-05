'use client';

import { USE_CASES } from '@/src/lib/use-cases';
import { cn } from '@/src/lib/utils';
import { ResilientImage } from './ResilientImage';

interface SymptomImageProps {
  slug: string;
  title: string;
  className?: string;
}

export function SymptomImage({ slug, title, className }: SymptomImageProps) {
  const SUPABASE_BASE_URL = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';
  const DEFAULT_IMAGE = `${SUPABASE_BASE_URL}iv-therapy-group-clinic.jpg`;

  const getSrc = () => {
    // 1. Try to find the use case in the standard data
    const useCase = USE_CASES.find(uc => uc.slug === slug || uc.title.toLowerCase() === title.toLowerCase());
    
    if (useCase?.imageUrl) {
      return useCase.imageUrl;
    }

    // 2. Dynamic mapping fallback: iv-therapy-[slug].jpg
    // This follows the project's standard naming convention for storage assets
    const normalizedSlug = slug || title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    if (normalizedSlug) {
      return `${SUPABASE_BASE_URL}iv-therapy-${normalizedSlug}.jpg`;
    }

    return DEFAULT_IMAGE;
  };

  const src = getSrc();

  return (
    <ResilientImage
      src={src}
      fallbackSrc={DEFAULT_IMAGE}
      alt={`IV therapy for ${title}`}
      fill
      unoptimized
      className={cn('object-cover transition-transform duration-700 group-hover:scale-110', className)}
    />
  );
}
