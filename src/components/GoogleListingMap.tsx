'use client';
import React, { useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { Provider } from '../types';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, Star } from 'lucide-react';
import { slugify } from '../lib/data';

interface GoogleListingMapProps {
  providers: Provider[];
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const MarkerWithInfoWindow = ({ provider }: { provider: Provider }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowShown, setInfoWindowShown] = useState(false);
  const slug = provider.slug || slugify(provider.name);

  if (!provider.latitude || !provider.longitude) return null;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: provider.latitude, lng: provider.longitude }}
        onClick={() => setInfoWindowShown(true)}
        title={provider.name}
      >
        <Pin 
          background={provider.is_featured ? "#10B981" : "#4285F4"} 
          glyphColor="#fff" 
          borderColor={provider.is_featured ? "#059669" : "#1D4ED8"}
        />
      </AdvancedMarker>
      {infoWindowShown && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setInfoWindowShown(false)}
          className="z-50"
        >
          <div className="p-1 max-w-[200px]">
            {(provider.imageUrl || provider.image_url) && (
              <div className="relative h-24 w-full mb-2 rounded-lg overflow-hidden">
                <Image 
                  src={provider.imageUrl || provider.image_url!}
                  alt={provider.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">{provider.name}</h4>
            <div className="flex items-center gap-1 mb-2">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-bold text-slate-600">{provider.rating} ({provider.reviewCount || 0})</span>
            </div>
            <div className="flex gap-2">
              <Link 
                href={`/provider/${slug}`}
                className="flex-1 bg-wellness-600 text-white text-[10px] font-bold py-1.5 rounded text-center hover:bg-wellness-700 transition-colors"
              >
                Profile
              </Link>
              {provider.phone && (
                <a 
                  href={`tel:${provider.phone}`}
                  className="bg-slate-100 text-slate-600 p-1.5 rounded hover:bg-slate-200 transition-colors"
                >
                  <Phone size={12} />
                </a>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const GoogleListingMap = ({ providers }: GoogleListingMapProps) => {
  // Center of map based on providers
  const center = useMemo(() => {
    const validProviders = providers.filter(p => p.latitude && p.longitude);
    if (validProviders.length === 0) return { lat: 37.0902, lng: -95.7129 }; // USA center

    const sumLat = validProviders.reduce((acc, p) => acc + (p.latitude || 0), 0);
    const sumLng = validProviders.reduce((acc, p) => acc + (p.longitude || 0), 0);
    return { lat: sumLat / validProviders.length, lng: sumLng / validProviders.length };
  }, [providers]);

  if (!hasValidKey) {
    return (
      <div className="h-[calc(100vh-280px)] min-h-[500px] w-full rounded-3xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center p-8 text-center border-2 border-slate-200 border-dashed">
        <h2 className="text-xl font-black text-slate-900 mb-4">Google Maps API Key Required</h2>
        <p className="text-sm text-slate-600 max-w-md mb-6 font-medium">
          To enable the interactive map, please add your Google Maps API key to the environment variables.
        </p>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left w-full max-w-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Instructions</p>
          <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-4 font-medium">
            <li>Open <strong className="text-slate-900">Settings</strong> (⚙️ icon)</li>
            <li>Go to <strong className="text-slate-900">Secrets</strong></li>
            <li>Add <code className="bg-slate-100 px-1 rounded text-slate-900">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code></li>
            <li>Paste your key and press Enter</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-280px)] min-h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative z-0">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={center}
          defaultZoom={11}
          mapId="e8e8e8e8e8e8e8e8" // Example ID or use your own
          className="w-full h-full"
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          scrollwheel={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {providers.map(provider => (
            <MarkerWithInfoWindow key={provider.id} provider={provider} />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
};

export default GoogleListingMap;
