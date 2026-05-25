'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Map as MapIcon, Star } from 'lucide-react';
import { Provider } from '../types';
import { ProviderCard } from './ProviderCard';
import { ProviderCardFeatured } from './ProviderCardFeatured';
import { cn } from '../lib/utils';

// Dynamically import map to avoid SSR issues
const MapboxListingMap = dynamic(() => import('./MapboxListingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <MapIcon className="text-slate-300 w-12 h-12" />
        <span className="text-slate-400 font-medium">Loading map…</span>
      </div>
    </div>
  ),
});

interface SplitListingViewProps {
  providers: Provider[];
  cityName: string;
}

// Zillow-style 2-pane layout:
//   Left:  scrollable column of provider cards
//   Right: sticky Mapbox map filling the viewport
// Hover sync: hovering a card → highlights the matching map pin (and vice versa,
// via the onMarkerClick → scroll-into-view behavior).
export const SplitListingView = ({ providers, cityName }: SplitListingViewProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const handleMarkerClick = (id: string) => {
    setHoveredId(id);
    const el = cardRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const providersWithCoords = providers.filter((p) => p.latitude && p.longitude);
  const allHaveCoords = providersWithCoords.length === providers.length;
  const featuredCount = providers.filter((p) => p.is_featured).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 mb-12">
      {/* LEFT: Scrollable card column. On lg+ it has a max height + own scroll so the map can stick beside. */}
      <div className="lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto pr-1 lg:pr-3 -mr-1 lg:-mr-3 space-y-4 custom-scrollbar">
        {!allHaveCoords && (
          <div className="text-[11px] font-bold text-slate-400 px-3">
            {providersWithCoords.length} of {providers.length} {providers.length === 1 ? 'clinic' : 'clinics'} mapped — the rest are missing coordinates.
          </div>
        )}
        {featuredCount > 0 && (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 px-3">
            <Star size={12} fill="currentColor" className="text-emerald-500" />
            <span>{featuredCount} verified · always shown first</span>
          </div>
        )}
        {providers.map((provider) => {
          const isHovered = hoveredId === provider.id;
          return (
            <div
              key={provider.id}
              ref={(el) => {
                cardRefs.current.set(provider.id, el);
              }}
              onMouseEnter={() => setHoveredId(provider.id)}
              onMouseLeave={() => setHoveredId((curr) => (curr === provider.id ? null : curr))}
              className={cn(
                'transition-all duration-200 rounded-[2rem]',
                isHovered ? 'ring-2 ring-wellness-400 ring-offset-2 ring-offset-[#FDFDFB]' : ''
              )}
            >
              {provider.is_featured ? (
                <ProviderCardFeatured provider={provider} isPrimary={false} />
              ) : (
                <ProviderCard provider={provider} />
              )}
            </div>
          );
        })}
      </div>

      {/* RIGHT: Sticky map. Hidden on mobile (cards stack instead). */}
      <div className="hidden lg:block">
        <div className="sticky top-[110px] h-[calc(100vh-140px)] w-full rounded-[2rem] overflow-hidden border border-slate-200 shadow-2xl">
          <MapboxListingMap
            providers={providers}
            hoveredProviderId={hoveredId}
            onMarkerClick={handleMarkerClick}
            bare
          />
        </div>
      </div>

      {/* MOBILE-ONLY: small map below cards, since the desktop sticky map is hidden on small screens.
          We render it AFTER cards so the listings are above the fold — patients are scanning text first
          on small screens, then peeking the map for spatial context. */}
      <div className="lg:hidden">
        <div className="h-[400px] w-full rounded-[2rem] overflow-hidden border border-slate-200 shadow-xl">
          <MapboxListingMap
            providers={providers}
            hoveredProviderId={hoveredId}
            onMarkerClick={handleMarkerClick}
            bare
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2 font-medium text-center">
          Tap a pin to jump to that clinic above · Tip: try the desktop view for the side-by-side map.
        </p>
      </div>
    </div>
  );
};

export default SplitListingView;
