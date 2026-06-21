'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Columns, List as ListIcon, Map as MapIcon, X } from 'lucide-react';
import { Provider } from '../../types';
import { cn } from '../../lib/utils';
import { ExploreCard } from './ExploreCard';

// Lazy-load the map so the Leaflet bundle never blocks first paint.
const ExploreMap = dynamic(() => import('./ExploreMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center animate-pulse">
      <span className="text-slate-400 font-bold text-sm">Loading map…</span>
    </div>
  ),
});

type ViewMode = 'list' | 'map' | 'split';

interface ExploreResultsProps {
  providers: Provider[];
}

export function ExploreResults({ providers }: ExploreResultsProps) {
  const [view, setView] = useState<ViewMode>('list'); // SSR-safe default
  const [isDesktop, setIsDesktop] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // Desktop defaults to Split; mobile stays List. Honor a stored preference.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const lg = window.matchMedia('(min-width: 1024px)').matches;
    setIsDesktop(lg);
    const pref = sessionStorage.getItem('tdm_explore_view') as ViewMode | null;
    if (pref === 'list' || pref === 'map' || pref === 'split') setView(pref);
    else if (lg) setView('split');
  }, []);

  const changeView = (v: ViewMode) => {
    setView(v);
    try {
      sessionStorage.setItem('tdm_explore_view', v);
    } catch {
      /* ignore */
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const el = cardRefs.current.get(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const cards = providers.map((p) => (
    <div
      key={p.id}
      ref={(el) => {
        cardRefs.current.set(p.id, el);
      }}
    >
      <ExploreCard
        provider={p}
        active={hoveredId === p.id || selectedId === p.id}
        onHover={setHoveredId}
        onSelect={handleSelect}
      />
    </div>
  ));

  const mapEl = (
    <ExploreMap
      providers={providers}
      selectedId={selectedId}
      hoveredId={hoveredId}
      onSelect={handleSelect}
      onHover={setHoveredId}
    />
  );

  const viewButtons: { id: ViewMode; label: string; icon: React.ReactNode; desktopOnly?: boolean }[] = [
    { id: 'list', label: 'List', icon: <ListIcon size={16} /> },
    { id: 'split', label: 'Split', icon: <Columns size={16} />, desktopOnly: true },
    { id: 'map', label: 'Map', icon: <MapIcon size={16} /> },
  ];

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {providers.length} {providers.length === 1 ? 'clinic' : 'clinics'}
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {viewButtons.map((b) => (
            <button
              key={b.id}
              onClick={() => (b.id === 'map' && !isDesktop ? setMobileMapOpen(true) : changeView(b.id))}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all',
                b.desktopOnly && 'hidden lg:flex',
                view === b.id ? 'bg-white text-wellness-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exactly one layout renders at a time (avoids mounting Leaflet in a hidden container). */}
      {isDesktop && view === 'split' ? (
        <div className="grid grid-cols-[minmax(0,38fr)_minmax(0,62fr)] gap-6">
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2 -mr-2 space-y-4 custom-scrollbar">
            {cards}
          </div>
          <div className="sticky top-[100px] h-[calc(100vh-180px)] rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
            {mapEl}
          </div>
        </div>
      ) : isDesktop && view === 'map' ? (
        <div className="h-[calc(100vh-220px)] min-h-[420px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
          {mapEl}
        </div>
      ) : (
        // List view (desktop list mode) and all mobile.
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{cards}</div>
      )}

      {/* Mobile full-screen map sheet */}
      {mobileMapOpen && (
        <div className="fixed inset-0 z-[60] bg-white lg:hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-black text-slate-900">Map · {providers.length} {providers.length === 1 ? 'clinic' : 'clinics'}</span>
            <button onClick={() => setMobileMapOpen(false)} aria-label="Close map" className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1">{mapEl}</div>
        </div>
      )}
    </div>
  );
}

export default ExploreResults;
