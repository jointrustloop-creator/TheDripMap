'use client';

import React, { useState, useEffect } from 'react';
import { Provider } from '../types';
import { useClaimListing } from '../context/ClaimListingContext';
import { CheckCircle2, X, ChevronUp, ChevronDown } from 'lucide-react';

interface StickyClaimRailProps {
  provider: Provider;
}

// Always-visible claim CTA on unclaimed provider pages.
// Desktop: floating bottom-right card.
// Mobile: collapsible bottom sheet pinned to the viewport.
//
// Dismissable per-session (sessionStorage) so it doesn't bug the same visitor
// across pageviews in the same session, but returns on a new visit.
export const StickyClaimRail = ({ provider }: StickyClaimRailProps) => {
  const { openClaimModal } = useClaimListing();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const key = `tdm_claim_rail_dismissed_${provider.id}`;
    if (typeof window !== 'undefined') {
      const wasDismissed = sessionStorage.getItem(key) === '1';
      setDismissed(wasDismissed);
    }
  }, [provider.id]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`tdm_claim_rail_dismissed_${provider.id}`, '1');
    }
  };

  if (dismissed) return null;

  const benefits = [
    'Add photos & description',
    'List drips with pricing',
    'Reply to reviews',
    'Get featured in match results',
  ];

  return (
    <>
      {/* DESKTOP — floating bottom-right card */}
      <aside
        className="hidden lg:block fixed bottom-6 right-6 z-40 w-[340px] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden"
        aria-label="Claim this listing"
      >
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors z-10"
        >
          <X size={14} />
        </button>
        <div className="p-6">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-3">
            ⚠ Unclaimed Listing
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight leading-tight pr-6">
            Is this your clinic?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Claim {provider.name} in 2 minutes — free forever.
          </p>
          <ul className="space-y-2 mb-5">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 size={14} className="text-wellness-600 shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => openClaimModal(provider)}
            className="w-full bg-wellness-600 hover:bg-wellness-700 text-white py-3 rounded-xl font-black text-sm transition-all shadow-md shadow-wellness-100"
          >
            Claim Free →
          </button>
        </div>
      </aside>

      {/* MOBILE — collapsible bottom sheet */}
      <aside
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-2xl"
        aria-label="Claim this listing"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-amber-500 shrink-0">⚠</span>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unclaimed Listing</div>
              <div className="text-xs font-bold text-slate-900 truncate">Is this your clinic?</div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Expand' : 'Collapse'}
              className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center"
            >
              {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {!collapsed && (
          <div className="px-4 pt-3 pb-4 space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Claim {provider.name} in 2 minutes — free forever.
            </p>
            <button
              type="button"
              onClick={() => openClaimModal(provider)}
              className="w-full bg-wellness-600 hover:bg-wellness-700 text-white py-3 rounded-xl font-black text-sm transition-all shadow-md shadow-wellness-100"
            >
              Claim Free →
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
