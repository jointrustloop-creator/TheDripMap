'use client';

import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useCompare, COMPARE_MAX } from '../lib/compare';
import { Provider } from '../types';
import { cn } from '../lib/utils';

interface CompareToggleProps {
  provider: Provider;
  className?: string;
}

// Demoted to a subtle, low-emphasis ghost icon (was a loud "Compare" pill that
// competed with the rating). A small circular + that fills with brand green when
// selected. Never narrates beyond its icon + aria/title.
export const CompareToggle = ({ provider, className }: CompareToggleProps) => {
  const { isSelected, toggle } = useCompare();
  const [flash, setFlash] = useState(false);
  const selected = isSelected(provider.id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const result = toggle(provider.id);
        if (result.reason === 'max') {
          setFlash(true);
          setTimeout(() => setFlash(false), 1200);
        }
      }}
      className={cn(
        'inline-flex items-center justify-center h-7 w-7 rounded-full border transition-colors',
        selected
          ? 'bg-[#0F6E56] text-white border-[#0F6E56]'
          : 'bg-white/90 backdrop-blur text-slate-400 border-slate-200 hover:text-[#0F6E56] hover:border-[#0F6E56]/40',
        flash && 'border-amber-400 text-amber-500',
        className
      )}
      aria-pressed={selected}
      aria-label={
        selected ? 'Remove from comparison' : flash ? `Maximum ${COMPARE_MAX} clinics to compare` : 'Add to comparison'
      }
      title={selected ? 'Comparing' : flash ? `Max ${COMPARE_MAX}` : 'Add to compare'}
    >
      {selected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.5} />}
    </button>
  );
};
