'use client';
import React, { useState, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, Star } from 'lucide-react';
import { Provider } from '../types';
import { slugify } from '../lib/data';
import { cn } from '../lib/utils';

interface MapboxListingMapProps {
  providers: Provider[];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export const MapboxListingMap = ({ providers }: MapboxListingMapProps) => {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const center = useMemo(() => {
    const valid = providers.filter(p => p.latitude && p.longitude);
    if (valid.length === 0) return { latitude: 37.0902, longitude: -95.7129 };
    return {
      latitude: valid.reduce((s, p) => s + (p.latitude || 0), 0) / valid.length,
      longitude: valid.reduce((s, p) => s + (p.longitude || 0), 0) / valid.length,
    };
  }, [providers]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-[calc(100vh-280px)] min-h-[500px] w-full rounded-3xl bg-slate-100 flex flex-col items-center justify-center p-8 text-center border-2 border-slate-200 border-dashed">
        <h2 className="text-xl font-black text-slate-900 mb-4">Map unavailable</h2>
        <p className="text-sm text-slate-600 max-w-md font-medium">
          Set <code className="bg-slate-200 px-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in your environment to enable the interactive map.
        </p>
      </div>
    );
  }

  const selectedSlug = selectedProvider ? (selectedProvider.slug || slugify(selectedProvider.name)) : '';

  return (
    <div className="h-[calc(100vh-280px)] min-h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative z-0">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ ...center, zoom: 11 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
        {providers.map(p => {
          if (!p.latitude || !p.longitude) return null;
          return (
            <Marker
              key={p.id}
              latitude={p.latitude}
              longitude={p.longitude}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedProvider(p);
              }}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full border-2 border-white shadow-md cursor-pointer transform hover:scale-110 transition-transform",
                  p.is_featured ? "bg-emerald-500" : "bg-blue-500"
                )}
                title={p.name}
              />
            </Marker>
          );
        })}

        {selectedProvider && selectedProvider.latitude && selectedProvider.longitude && (
          <Popup
            latitude={selectedProvider.latitude}
            longitude={selectedProvider.longitude}
            onClose={() => setSelectedProvider(null)}
            closeOnClick={false}
            anchor="bottom"
            offset={20}
            maxWidth="240px"
          >
            <div className="p-1 max-w-[200px]">
              {(selectedProvider.imageUrl || selectedProvider.image_url) && (
                <div className="relative h-24 w-full mb-2 rounded-lg overflow-hidden">
                  <Image
                    src={selectedProvider.imageUrl || selectedProvider.image_url!}
                    alt={selectedProvider.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">{selectedProvider.name}</h4>
              <div className="flex items-center gap-1 mb-2">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-slate-600">{selectedProvider.rating} ({selectedProvider.reviewCount || 0})</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/providers/${selectedSlug}`}
                  className="flex-1 bg-wellness-600 text-white text-[10px] font-bold py-1.5 rounded text-center hover:bg-wellness-700 transition-colors"
                >
                  Profile
                </Link>
                {selectedProvider.phone && (
                  <a
                    href={`tel:${selectedProvider.phone}`}
                    className="bg-slate-100 text-slate-600 p-1.5 rounded hover:bg-slate-200 transition-colors"
                  >
                    <Phone size={12} />
                  </a>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default MapboxListingMap;
