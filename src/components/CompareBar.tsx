'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scale, ArrowRight } from 'lucide-react';
import { useCompare } from '../lib/compare';
import { Provider } from '../types';
import { supabase } from '../lib/supabase';

export const CompareBar = () => {
  const { ids, count, remove, clear } = useCompare();
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    if (ids.length === 0) {
      setProviders([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('providers')
          .select('id, name, city, image_url, is_featured, rating, slug')
          .in('id', ids);
        if (!cancelled && data) {
          // Preserve selection order
          const order = new Map(ids.map((id, i) => [id, i]));
          const sorted = data.slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
          setProviders(sorted as unknown as Provider[]);
        }
      } catch (err) {
        console.error('Compare bar fetch error', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-1rem)] max-w-2xl"
        >
          <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 px-4 py-3 md:px-5 md:py-4 flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-wellness-600 rounded-xl flex items-center justify-center shrink-0">
                <Scale size={18} />
              </div>
              <div className="hidden md:block">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Compare
                </div>
                <div className="text-sm font-black">
                  {count} clinic{count === 1 ? '' : 's'} selected
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="shrink-0 bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-1.5 py-1.5 flex items-center gap-2 max-w-[180px]"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">{p.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 truncate">{p.city}</div>
                  </div>
                  <button
                    onClick={() => remove(p.id)}
                    className="w-6 h-6 rounded-full bg-slate-700 hover:bg-rose-500 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
                    aria-label={`Remove ${p.name}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={clear}
                className="hidden md:block text-[11px] font-bold text-slate-400 hover:text-white transition-colors px-2"
              >
                Clear
              </button>
              {count >= 2 ? (
                <Link
                  href={`/compare?ids=${ids.join(',')}`}
                  className="bg-wellness-600 hover:bg-wellness-500 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg"
                >
                  Compare <ArrowRight size={14} />
                </Link>
              ) : (
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 text-center max-w-[140px] leading-tight">
                  Add one more to compare
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
