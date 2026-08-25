'use client';

import React, { useState, useEffect } from 'react';
import { Columns, LayoutGrid, Map as MapIcon, Navigation, ShieldCheck, CheckCircle2, HelpCircle } from 'lucide-react';
import { Provider } from '../types';
import { ProviderCard } from './ProviderCard';
import dynamic from 'next/dynamic';
import { calculateDistance, getUserLocation } from '../lib/geo';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import {
  CHIPS,
  isMobile as isMobileFilter,
  isPrescriberVerified,
  groupBySoft,
  countHard,
  countFacet,
  isSoftId,
  SOFT_GROUP_LABELS,
  type SoftFilterId,
} from '../lib/filters';
import { trackFilter } from '../lib/track-filter';

// Dynamically import map/split-view to avoid SSR issues
const MapboxListingMap = dynamic(() => import('./MapboxListingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-slate-100 rounded-[2.5rem] flex items-center justify-center animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <MapIcon className="text-slate-300 w-12 h-12" />
        <span className="text-slate-400 font-medium">Loading Interactive Map...</span>
      </div>
    </div>
  )
});

const SplitListingView = dynamic(() => import('./SplitListingView'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-slate-50 rounded-[2.5rem] flex items-center justify-center animate-pulse">
      <span className="text-slate-400 font-medium">Loading split view…</span>
    </div>
  )
});

type ViewMode = 'split' | 'grid' | 'map';

interface ListingControllerProps {
  initialProviders: Provider[];
  cityName: string;
  /**
   * Suppress the internal "Providers in {cityName}" heading + subtitle.
   * Use when the parent renders its own descriptive heading above the
   * controller (e.g. the Toronto two-tier render in app/cities/[slug]/
   * page.tsx, where the wrapper headings "IV therapy in Toronto" and
   * "Nearby in the Greater Toronto Area" already say everything). The
   * view-toggle row stays visible and right-aligned.
   */
  hideHeading?: boolean;
}

export function ListingController({ initialProviders, cityName, hideHeading = false }: ListingControllerProps) {
  // Default to grid for SSR (so initial paint matches), then upgrade to split on lg+ after mount.
  const [view, setView] = useState<ViewMode>('grid');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  // Same filter set as /search (shared src/lib/filters.ts). Hard + facet narrow;
  // soft chips regroup into visible labelled groups and never hide.
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const toggleChip = (id: string) => {
    setActiveChips((prev) => {
      const on = !prev.includes(id);
      trackFilter(id, on ? 'on' : 'off', 'city', cityName);
      return on ? [...prev, id] : prev.filter((c) => c !== id);
    });
  };

  // Upgrade to split view on lg+ viewports after hydration, unless user already toggled.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedPref = sessionStorage.getItem('tdm_view_pref');
    if (storedPref === 'split' || storedPref === 'grid' || storedPref === 'map') {
      setView(storedPref as ViewMode);
      return;
    }
    const isLargeViewport = window.matchMedia('(min-width: 1024px)').matches;
    if (isLargeViewport) {
      setView('split');
    }
  }, []);

  const changeView = (next: ViewMode) => {
    setView(next);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tdm_view_pref', next);
    }
  };

  // Featured pinned first, then near-and-good, then stars.
  //
  // This used to sort on RAW distance, which threw away the server ranking and
  // meant a clinic disclosing 1 of 7 outranked one disclosing 6 of 7 for being
  // 400m closer. Nobody chooses a clinic that way. Distance is now BANDED into
  // 2km buckets, so clinics that are equally near in any way a person would
  // notice get ordered by what we actually know about them: whether a human
  // checked their prescriber against a register, then how much they disclose.
  // Still nearest-first, just at human granularity instead of GPS precision.
  const distanceBand = (d?: number | null) => Math.floor((d ?? 9999) / 2);
  const sortProviders = (list: Provider[]): Provider[] =>
    list.slice().sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      const bandDiff = distanceBand(a.distance) - distanceBand(b.distance);
      if (bandDiff !== 0) return bandDiff;
      const av = a.safety_verified === true, bv = b.safety_verified === true;
      if (av !== bv) return av ? -1 : 1;
      const scoreDiff = ((b as { transparency_score?: number }).transparency_score ?? 0)
        - ((a as { transparency_score?: number }).transparency_score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  useEffect(() => {
    // Initial fetch of user location
    const fetchLocation = async () => {
      const location = await getUserLocation();
      if (location) {
        setUserLocation(location);

        // Calculate distances
        const updatedProviders = initialProviders.map(p => {
          if (p.latitude != null && p.longitude != null) {
            const lat = Number(p.latitude);
            const lng = Number(p.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              return {
                ...p,
                distance: calculateDistance(location.lat, location.lng, lat, lng)
              };
            }
          }
          return p;
        });

        setProviders(sortProviders(updatedProviders));
      }
    };

    fetchLocation();
  }, [initialProviders]);

  const requestLocation = async () => {
    const location = await getUserLocation();
    if (location) {
      setUserLocation(location);
      const updatedProviders = providers.map(p => {
        if (p.latitude != null && p.longitude != null) {
          const lat = Number(p.latitude);
          const lng = Number(p.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            return {
              ...p,
              distance: calculateDistance(location.lat, location.lng, lat, lng)
            };
          }
        }
        return p;
      });
      setProviders(sortProviders(updatedProviders));
    }
  };

  const viewButtons: { id: ViewMode; label: string; icon: React.ReactNode; hideOnMobile?: boolean }[] = [
    { id: 'split', label: 'Split', icon: <Columns size={18} />, hideOnMobile: true },
    { id: 'grid', label: 'Grid', icon: <LayoutGrid size={18} /> },
    { id: 'map', label: 'Map', icon: <MapIcon size={18} /> },
  ];

  // Apply hard + facet narrowing, then soft grouping. `narrowed` feeds split/map
  // (grouping is a grid-only concept); `grouped` drives the grid sections.
  const activeSoft = activeChips.filter(isSoftId) as SoftFilterId[];
  let narrowed = providers;
  if (activeChips.includes('Mobile')) narrowed = narrowed.filter(isMobileFilter);
  if (activeChips.includes('PrescriberVerified')) narrowed = narrowed.filter(isPrescriberVerified);
  const grouped = groupBySoft(narrowed, activeSoft);
  const chipCount = (id: string): number | null =>
    id === 'Mobile' ? countHard(providers, 'Mobile') : id === 'PrescriberVerified' ? countFacet(providers, 'PrescriberVerified') : null;

  return (
    <section className="mb-24">
      {/* Header with View Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        {hideHeading ? (
          <div />
        ) : (
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Providers in {cityName}</h2>
            <p className="text-slate-500 font-medium">Compare the best IV therapy and hydration services near you.</p>
          </div>
        )}

        <div className="flex items-center gap-1 p-1.5 bg-slate-100 rounded-2xl">
          {viewButtons.map((b) => (
            <button
              key={b.id}
              id={b.id === 'map' ? 'map-view-trigger' : undefined}
              onClick={() => changeView(b.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
                b.hideOnMobile && 'hidden lg:flex',
                view === b.id
                  ? 'bg-white text-wellness-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {b.icon}
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips — the same set as /search (shared filters lib). */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CHIPS.map((chip) => {
          const active = activeChips.includes(chip.id);
          const count = chipCount(chip.id);
          return (
            <button
              key={chip.id}
              onClick={() => toggleChip(chip.id)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-bold border transition-all inline-flex items-center gap-1.5',
                active ? 'bg-wellness-600 border-wellness-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-wellness-300',
                chip.kind === 'facet' && !active && 'border-wellness-300 text-wellness-700'
              )}
            >
              {chip.kind === 'facet' && <ShieldCheck size={12} />}
              {chip.label}
              {count != null && <span className={cn('font-black', active ? 'text-white/80' : 'text-slate-400')}>{count}</span>}
            </button>
          );
        })}
        {activeChips.length > 0 && (
          <button onClick={() => setActiveChips([])} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 self-center ml-1">Clear</button>
        )}
      </div>

      {/* Location Access Bar (if not granted) */}
      {!userLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-wellness-50 rounded-2xl border border-wellness-100 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-wellness-100 rounded-full flex items-center justify-center text-wellness-600">
              <Navigation size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Show distance from your location?</p>
              <p className="text-xs text-slate-500">Enable location to see clinics ranked by proximity to you.</p>
            </div>
          </div>
          <button
            onClick={requestLocation}
            className="bg-wellness-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-wellness-700 transition-colors shadow-lg shadow-wellness-200/50"
          >
            Enable Location
          </button>
        </motion.div>
      )}

      {/* Main Content Area with AnimatePresence */}
      {narrowed.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
          <h3 className="text-xl font-black text-slate-900 mb-2">No clinics match these filters in {cityName}</h3>
          <p className="text-slate-500 mb-6 text-sm">Try clearing a filter to see more.</p>
          <button onClick={() => setActiveChips([])} className="text-wellness-600 font-bold hover:text-wellness-700">Clear filters</button>
        </div>
      ) : (
      <AnimatePresence mode="wait">
        {view === 'split' ? (
          <motion.div key="split" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SplitListingView providers={narrowed} cityName={cityName} />
          </motion.div>
        ) : view === 'grid' ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {grouped.grouped ? (
              <div className="space-y-12">
                <ClinicGroupSection label={SOFT_GROUP_LABELS.lists} tone="lists" providers={grouped.lists} />
                <ClinicGroupSection label={SOFT_GROUP_LABELS.notListed} tone="notListed" providers={grouped.notListed} />
                <ClinicGroupSection
                  label={SOFT_GROUP_LABELS.unknown}
                  tone="unknown"
                  providers={grouped.unknown}
                  note="These clinics haven't listed their full menu yet. If you own one, claiming your listing fills this in."
                />
              </div>
            ) : (
              // 2026-06-14: every listing (claimed + unclaimed) renders through
              // ProviderCard. One card component = a consistent grid.
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {narrowed.map((provider) => (
                  <div key={provider.id}>
                    <ProviderCard provider={provider} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-[600px] w-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-2xl"
          >
            <MapboxListingMap providers={narrowed} />
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </section>
  );
}

// Labelled, always-visible result group for the city grid's soft-boost view.
// The unknown group is shown too (never buried) and doubles as a claim incentive.
function ClinicGroupSection({
  label,
  tone,
  providers,
  note,
}: {
  label: string;
  tone: 'lists' | 'notListed' | 'unknown';
  providers: Provider[];
  note?: string;
}) {
  if (providers.length === 0) return null;
  const toneStyle =
    tone === 'lists' ? 'bg-wellness-600 text-white' : tone === 'unknown' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500';
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full', toneStyle)}>
          {tone === 'lists' && <CheckCircle2 size={12} />}
          {tone === 'unknown' && <HelpCircle size={12} />}
          {label}
        </span>
        <span className="text-xs font-bold text-slate-400">{providers.length}</span>
      </div>
      {note && <p className="text-xs text-slate-500 font-medium mb-4 -mt-2 max-w-2xl">{note}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {providers.map((provider) => (
          <div key={provider.id}>
            <ProviderCard provider={provider} />
          </div>
        ))}
      </div>
    </div>
  );
}
