'use client';

import React, { useState, useEffect } from 'react';
import { Columns, LayoutGrid, Map as MapIcon, Navigation } from 'lucide-react';
import { Provider } from '../types';
import { ProviderCard } from './ProviderCard';
import { ProviderCardFeatured } from './ProviderCardFeatured';
import dynamic from 'next/dynamic';
import { calculateDistance, getUserLocation } from '../lib/geo';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

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
}

export function ListingController({ initialProviders, cityName }: ListingControllerProps) {
  // Default to grid for SSR (so initial paint matches), then upgrade to split on lg+ after mount.
  const [view, setView] = useState<ViewMode>('grid');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [providers, setProviders] = useState<Provider[]>(initialProviders);

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

  // Claimed listings always pinned to the top, then distance, then rating.
  // Without the is_featured tiebreaker, granting location would push claimed
  // listings down the page based on raw proximity — defeating the value of
  // the claim. We promise "always shown first" in the UI; this enforces it.
  const sortProviders = (list: Provider[]): Provider[] =>
    list.slice().sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      const distDiff = (a.distance ?? 9999) - (b.distance ?? 9999);
      if (distDiff !== 0) return distDiff;
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

  return (
    <section className="mb-24">
      {/* Header with View Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Providers in {cityName}</h2>
          <p className="text-slate-500 font-medium">Compare the best IV therapy and hydration services near you.</p>
        </div>

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
      <AnimatePresence mode="wait">
        {view === 'split' ? (
          <motion.div
            key="split"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SplitListingView providers={providers} cityName={cityName} />
          </motion.div>
        ) : view === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {providers.map((provider) => (
              <div key={provider.id} className={cn(provider.is_featured ? "md:col-span-2 lg:col-span-3" : "")}>
                {/* 2026-06-12: same fix as /search main grid. Route both
                    featured and free-tier claimed clinics to the magazine
                    card; reserve isPrimary for the paid-tier full-width row. */}
                {(provider.is_featured === true || provider.is_claimed === true) ? (
                  <ProviderCardFeatured provider={provider} isPrimary={provider.is_featured === true} />
                ) : (
                  <ProviderCard provider={provider} />
                )}
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-[600px] w-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-2xl"
          >
            <MapboxListingMap providers={providers} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
