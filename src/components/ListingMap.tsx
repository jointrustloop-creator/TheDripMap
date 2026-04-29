
'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
import { Provider } from '../types';
import Link from 'next/link';
import { slugify } from '../lib/data';

// Fix for default Leaflet marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom pulse icon for providers
const createPulseIcon = (isFeatured: boolean) => L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute inline-flex h-8 w-8 rounded-full ${isFeatured ? 'bg-wellness-500' : 'bg-slate-700'} opacity-30 animate-ping"></div>
      <div class="relative inline-flex h-4 w-4 rounded-full border-2 border-white ${isFeatured ? 'bg-wellness-600' : 'bg-slate-800'} shadow-sm"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

interface ListingMapProps {
  providers: Provider[];
}

// Center the map when providers change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

export default function ListingMap({ providers }: ListingMapProps) {
  // Find providers with valid numerical coordinates
  const markers = providers.filter(
    p => p.latitude != null && 
         p.longitude != null && 
         !isNaN(Number(p.latitude)) && 
         !isNaN(Number(p.longitude))
  );
  
  // Calculate average center
  const avgLat = markers.length > 0 
    ? markers.reduce((acc, curr) => acc + Number(curr.latitude || 0), 0) / markers.length 
    : 27.9506; // Default to Tampa center
    
  const avgLng = markers.length > 0 
    ? markers.reduce((acc, curr) => acc + Number(curr.longitude || 0), 0) / markers.length 
    : -82.4572;

  const center: [number, number] = [avgLat, avgLng];

  return (
    <MapContainer 
      center={center} 
      zoom={12} 
      className="h-full w-full"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} />
      
      {markers.map((provider) => (
        <Marker 
          key={provider.id} 
          position={[Number(provider.latitude), Number(provider.longitude)]}
          icon={createPulseIcon(provider.is_featured)}
        >
          <Popup className="custom-popup">
            <div className="p-1 min-w-[200px]">
              <div className="aspect-video relative rounded-lg overflow-hidden mb-2">
                {(provider.imageUrl || provider.image_url) ? (
                  <Image 
                    src={provider.imageUrl || provider.image_url!}
                    alt={provider.name}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-wellness-50 flex items-center justify-center">
                    <span className="text-wellness-600 text-xs font-bold">IV</span>
                  </div>
                )}
                {provider.is_featured && (
                  <div className="absolute top-1 left-1 bg-amber-400 text-[8px] font-black uppercase px-2 py-0.5 rounded text-slate-900">
                    Featured
                  </div>
                )}
              </div>
              <h3 className="font-bold text-slate-900 leading-tight mb-1">{provider.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-wellness-600 font-bold text-xs">⭐ {provider.rating}</span>
                <span className="text-slate-400 text-[10px]">({provider.reviewCount})</span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2 mb-3">{provider.description}</p>
              <Link 
                href={`/provider/${provider.slug || slugify(provider.name)}`}
                className="block w-full bg-wellness-600 text-white text-center py-2 rounded-lg text-xs font-bold hover:bg-wellness-700 transition-colors"
              >
                View Clinic Info
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
