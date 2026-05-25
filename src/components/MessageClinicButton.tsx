'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Provider } from '../types';
import { MessageClinicModal } from './MessageClinicModal';

interface MessageClinicButtonProps {
  provider: Provider;
  variant?: 'primary' | 'secondary' | 'inline';
  className?: string;
  label?: string;
}

export const MessageClinicButton = ({
  provider,
  variant = 'secondary',
  className,
  label,
}: MessageClinicButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const baseClass =
    variant === 'primary'
      ? 'w-full bg-wellness-600 text-white px-6 py-4 rounded-2xl font-black text-base hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-200/50 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2'
      : variant === 'inline'
      ? 'inline-flex items-center gap-2 text-sm font-black text-wellness-600 hover:text-wellness-700 transition-colors'
      : 'w-full bg-white border-2 border-slate-200 text-slate-900 px-6 py-4 rounded-2xl font-black text-base hover:border-slate-900 transition-all flex items-center justify-center gap-2';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={className || baseClass}
      >
        <MessageSquare size={18} /> {label || 'Message Clinic'}
      </button>

      <MessageClinicModal
        provider={provider}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
