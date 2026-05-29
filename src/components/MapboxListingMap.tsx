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
  /** ID of provider currently being hovered/focused in a sibling list — pin gets visual emphasis */
  hoveredProviderId?: string | null;
  /** Called when a pin is clicked; used by SplitListingView to scroll the matching card into view */
  onMarkerClick?: (providerId: string) => void;
  /** Removes the rounded corners + drop shadow wrapper so this can be embedded in a sticky split layout */
  bare?: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Filter out misleading stock photos / blog hero images. Unclaimed listings
// got blog/unsplash URLs misassigned to them in bulk imports — those should
// never display. Claimed clinics with legacy /blog-images/ logos are trusted
// because we placed those files there deliberately.
const isRealClinicImage = (provider: Provider): boolean => {
  const url = provider.imageUrl || provider.image_url || '';
  if (!url) return false;
  if (url.includes('unsplash.com')) return false;
  if (url.includes('/blog-images/') && !provider.is_featured) return false;
  return true;
};

const initialsOf = (name: string): string =>
  name.split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || 'IV';

export const MapboxListingMap = ({ providers, hoveredProviderId, onMarkerClick, bare = false }: MapboxListingMapProps) => {
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
      <div className="h-full min-h-[500px] w-full rounded-3xl bg-slate-100 flex flex-col items-center justify-center p-8 text-center border-2 border-slate-200 border-dashed">
        <h2 className="text-xl font-black text-slate-900 mb-4">Map unavailable</h2>
        <p className="text-sm text-slate-600 max-w-md font-medium">
          Set <code className="bg-slate-200 px-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in your environment to enable the interactive map.
        </p>
      </div>
    );
  }

  const selectedSlug = selectedProvider ? (selectedProvider.slug || slugify(selectedProvider.name)) : '';

  const wrapperClasses = bare
    ? 'h-full w-full relative z-0'
    : 'h-[calc(100vh-280px)] min-h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative z-0';

  return (
    <div className={wrapperClasses}>
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ ...center, zoom: 11 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
        {providers.map(p => {
          if (!p.latitude || !p.longitude) return null;
          const isHovered = hoveredProviderId === p.id;
          return (
            <Marker
              key={p.id}
              latitude={p.latitude}
              longitude={p.longitude}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedProvider(p);
                onMarkerClick?.(p.id);
              }}
            >
              <div
                className={cn(
                  'rounded-full border-2 border-white shadow-md cursor-pointer transition-all',
                  // Featured pins are green/larger; unclaimed are blue/smaller
                  p.is_featured ? 'bg-emerald-500' : 'bg-blue-500',
                  // Hover state: bigger, white-ringed, elevated z
                  isHovered
                    ? 'w-10 h-10 ring-4 ring-wellness-300 z-10 scale-110'
                    : 'w-7 h-7 hover:scale-110'
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
            <div className="p-1 max-w-[220px]">
              {isRealClinicImage(selectedProvider) ? (
                <div className="relative h-24 w-full mb-2 rounded-lg overflow-hidden bg-slate-50">
                  <Image
                    src={selectedProvider.imageUrl || selectedProvider.image_url!}
                    alt={selectedProvider.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-full mb-2 rounded-lg overflow-hidden bg-gradient-to-br from-wellness-100 via-white to-emerald-50 flex items-center justify-center border border-wellness-100/60">
                  <span className="text-xl font-black text-wellness-700 tracking-tight">
                    {initialsOf(selectedProvider.name)}
                  </span>
                </div>
              )}
              <h4 className="font-black text-sm text-slate-900 line-clamp-2 mb-1.5 leading-snug">{selectedProvider.name}</h4>
              {selectedProvider.is_featured && selectedProvider.rating > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-bold text-slate-600">
                    {selectedProvider.rating} ({selectedProvider.reviewCount || 0})
                  </span>
                </div>
              )}
              {selectedProvider.specialties && selectedProvider.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedProvider.specialties.slice(0, 2).map((s) => (
                    <span
                      key={s}
                      className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-wellness-50 text-wellness-700 border border-wellness-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Link
                  href={`/providers/${selectedSlug}`}
                  className="flex-1 bg-wellness-600 text-white text-[10px] font-bold py-1.5 rounded text-center hover:bg-wellness-700 transition-colors"
                >
                  View profile
                </Link>
                {selectedProvider.phone && (
                  <a
                    href={`tel:${selectedProvider.phone}`}
                    className="bg-slate-100 text-slate-600 p-1.5 rounded hover:bg-slate-200 transition-colors"
                    aria-label="Call clinic"
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
