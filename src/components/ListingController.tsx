
'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Map as MapIcon, Navigation } from 'lucide-react';
import { Provider } from '../types';
import { ProviderCard } from './ProviderCard';
import { ProviderCardFeatured } from './ProviderCardFeatured';
import dynamic from 'next/dynamic';
import { calculateDistance, getUserLocation } from '../lib/geo';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Dynamically import map to avoid SSR issues
const GoogleListingMap = dynamic(() => import('./GoogleListingMap'), { 
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

interface ListingControllerProps {
  initialProviders: Provider[];
  cityName: string;
}

export function ListingController({ initialProviders, cityName }: ListingControllerProps) {
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [providers, setProviders] = useState<Provider[]>(initialProviders);

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
        
        // Sort by distance if location is available
        setProviders(updatedProviders.sort((a, b) => (a.distance || 9999) - (b.distance || 9999)));
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
      setProviders(updatedProviders.sort((a, b) => (a.distance || 9999) - (b.distance || 9999)));
    }
  };

  return (
    <section className="mb-24">
      {/* Header with View Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Verified Providers in {cityName}</h2>
          <p className="text-slate-500 font-medium">Compare the best IV therapy and hydration services near you.</p>
        </div>
        
        <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-2xl">
          <button 
            onClick={() => setView('grid')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              view === 'grid' 
                ? 'bg-white text-wellness-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid size={18} />
            Grid View
          </button>
          <button 
            id="map-view-trigger"
            onClick={() => setView('map')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
              view === 'map' 
                ? 'bg-white text-wellness-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapIcon size={18} />
            Map View
            {view === 'grid' && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wellness-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-wellness-500"></span>
              </span>
            )}
          </button>
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
        {view === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {providers.map((provider) => (
              <div key={provider.id} className={cn(provider.is_featured ? "md:col-span-2 lg:col-span-3" : "")}>
                {provider.is_featured ? (
                  <ProviderCardFeatured provider={provider} isPrimary={true} />
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
            <GoogleListingMap providers={providers} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
