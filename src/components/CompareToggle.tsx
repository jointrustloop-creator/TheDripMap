'use client';

import React, { useState } from 'react';
import { Plus, Check, AlertCircle } from 'lucide-react';
import { useCompare, COMPARE_MAX } from '../lib/compare';
import { Provider } from '../types';
import { cn } from '../lib/utils';

interface CompareToggleProps {
  provider: Provider;
  className?: string;
}

export const CompareToggle = ({ provider, className }: CompareToggleProps) => {
  const { isSelected, toggle } = useCompare();
  const [flash, setFlash] = useState<string | null>(null);
  const selected = isSelected(provider.id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const result = toggle(provider.id);
        if (result.reason === 'max') {
          setFlash(`Max ${COMPARE_MAX}`);
          setTimeout(() => setFlash(null), 1500);
        }
      }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border-2',
        selected
          ? 'bg-wellness-600 text-white border-wellness-600 shadow-md hover:bg-wellness-700'
          : 'bg-white/95 text-slate-700 border-slate-200 hover:border-wellness-600 hover:text-wellness-600',
        className
      )}
      aria-pressed={selected}
      aria-label={selected ? 'Remove from comparison' : 'Add to comparison'}
    >
      {flash ? (
        <>
          <AlertCircle size={12} /> {flash}
        </>
      ) : selected ? (
        <>
          <Check size={12} /> Comparing
        </>
      ) : (
        <>
          <Plus size={12} /> Compare
        </>
      )}
    </button>
  );
};
