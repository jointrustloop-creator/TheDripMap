'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Provider } from '../types';
import { SubmitTestimonialModal } from './SubmitTestimonialModal';

interface SubmitTestimonialButtonProps {
  provider: Provider;
  variant?: 'card' | 'inline' | 'primary';
  className?: string;
  label?: string;
}

export const SubmitTestimonialButton = ({
  provider,
  variant = 'card',
  className,
  label,
}: SubmitTestimonialButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultClass =
    variant === 'primary'
      ? 'inline-flex items-center gap-2 bg-wellness-600 hover:bg-wellness-700 text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-wellness-200/50'
      : variant === 'inline'
      ? 'inline-flex items-center gap-1.5 text-sm font-black text-wellness-700 hover:text-wellness-800 transition-colors'
      : 'inline-flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-wellness-500 hover:text-wellness-700 text-slate-700 px-5 py-2.5 rounded-xl font-black text-sm transition-all';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={className || defaultClass}
      >
        <Heart size={16} /> {label || 'Share your experience'}
      </button>
      <SubmitTestimonialModal
        provider={provider}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
