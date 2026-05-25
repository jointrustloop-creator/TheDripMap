'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useCompare } from '../lib/compare';

export const ClearCompareButton = () => {
  const { clear } = useCompare();
  const router = useRouter();

  return (
    <button
      onClick={() => {
        clear();
        router.push('/search');
      }}
      className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-rose-600 transition-colors px-3 py-2 rounded-xl hover:bg-rose-50"
    >
      <Trash2 size={12} /> Clear
    </button>
  );
};
