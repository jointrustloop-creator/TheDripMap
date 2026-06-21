'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Provider } from '../../types';
import { isVerifiedClinic, coordsOf, topServices, clinicHref } from '../../lib/clinic-display';

const VERIFIED = '#1D9E75';
const MUTED = '#64748b';

interface ExploreMapProps {
  providers: Provider[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

function pinIcon(p: Provider, emphasized: boolean): L.DivIcon {
  const verified = isVerifiedClinic(p);
  const bg = verified ? VERIFIED : MUTED;
  const size = emphasized ? 36 : verified ? 28 : 22;
  const ring = emphasized ? 'box-shadow:0 0 0 5px rgba(29,158,117,.30),0 1px 4px rgba(0,0,0,.4);' : 'box-shadow:0 1px 4px rgba(0,0,0,.35);';
  return L.divIcon({
    className: 'tdm-pin',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bg};border:2px solid #fff;${ring}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function clusterIcon(count: number, hasVerified: boolean): L.DivIcon {
  const size = count > 25 ? 50 : count > 9 ? 44 : 38;
  const bg = hasVerified ? VERIFIED : '#0f766e';
  return L.divIcon({
    className: 'tdm-cluster',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};opacity:.92;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;font-family:Arial,sans-serif;">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Fit to the provider set on change, and fly to a selected pin on click.
function MapSync({ providers, selectedId }: { providers: Provider[]; selectedId: string | null }) {
  const map = useMap();
  const lastSig = useRef<string>('');

  useEffect(() => {
    const pts = providers.map(coordsOf).filter((c): c is [number, number] => c !== null);
    const sig = pts.length + ':' + pts.slice(0, 3).map((c) => c.join(',')).join('|');
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 12, { animate: false });
      return;
    }
    map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 13 });
  }, [providers, map]);

  useEffect(() => {
    if (!selectedId) return;
    const sel = providers.find((p) => p.id === selectedId);
    const c = sel ? coordsOf(sel) : null;
    if (c) map.setView(c, Math.max(map.getZoom(), 13), { animate: true });
  }, [selectedId, providers, map]);

  return null;
}

// Zoom-aware grid clustering. Cell size shrinks with zoom so pins decluster as
// you zoom in. Only points in the current viewport (padded) are considered.
function ClusterLayer({ providers, selectedId, hoveredId, onSelect, onHover }: ExploreMapProps) {
  const map = useMap();
  const [tick, setTick] = useState(0);
  useMapEvents({
    zoomend: () => setTick((t) => t + 1),
    moveend: () => setTick((t) => t + 1),
  });

  const groups = useMemo(() => {
    const zoom = map.getZoom();
    const bounds = map.getBounds().pad(0.25);
    const cell = 360 / Math.pow(2, zoom);
    const buckets = new Map<string, Provider[]>();
    for (const p of providers) {
      const c = coordsOf(p);
      if (!c || !bounds.contains(c)) continue;
      const key = `${Math.floor(c[0] / cell)}_${Math.floor(c[1] / cell)}`;
      let arr = buckets.get(key);
      if (!arr) {
        arr = [];
        buckets.set(key, arr);
      }
      arr.push(p);
    }
    return [...buckets.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers, tick, map]);

  return (
    <>
      {groups.map((group) => {
        if (group.length === 1) {
          const p = group[0];
          const c = coordsOf(p)!;
          const emphasized = hoveredId === p.id || selectedId === p.id;
          const services = topServices(p, 2);
          return (
            <Marker
              key={p.id}
              position={c}
              icon={pinIcon(p, emphasized)}
              zIndexOffset={emphasized ? 1000 : isVerifiedClinic(p) ? 100 : 0}
              eventHandlers={{
                click: () => onSelect(p.id),
                mouseover: () => onHover(p.id),
                mouseout: () => onHover(null),
              }}
            >
              {selectedId === p.id && (
                <Popup>
                  <div className="min-w-[180px]">
                    <div className="font-black text-sm text-slate-900 leading-snug mb-1">{p.name}</div>
                    {Number(p.rating) > 0 && (
                      <div className="text-[11px] font-bold text-slate-500 mb-1.5">
                        {'★'} {Number(p.rating).toFixed(1)}
                        {Number(p.reviewCount) > 0 ? ` (${p.reviewCount})` : ''}
                      </div>
                    )}
                    {services.length > 0 && (
                      <div className="text-[10px] font-bold text-slate-500 mb-2">{services.join(' · ')}</div>
                    )}
                    <div className="flex gap-1.5">
                      <Link href="/quiz" className="flex-1 bg-wellness-600 text-white text-[10px] font-black text-center py-1.5 rounded-md no-underline">
                        Get Matched
                      </Link>
                      <Link href={clinicHref(p)} className="flex-1 border border-slate-200 text-slate-600 text-[10px] font-black text-center py-1.5 rounded-md no-underline">
                        View clinic
                      </Link>
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        }
        // Cluster: centroid + count
        const lat = group.reduce((s, p) => s + (coordsOf(p)?.[0] ?? 0), 0) / group.length;
        const lng = group.reduce((s, p) => s + (coordsOf(p)?.[1] ?? 0), 0) / group.length;
        const hasVerified = group.some(isVerifiedClinic);
        const key = `c-${group[0].id}-${group.length}`;
        return (
          <Marker
            key={key}
            position={[lat, lng]}
            icon={clusterIcon(group.length, hasVerified)}
            eventHandlers={{
              click: () => {
                const pts = group.map(coordsOf).filter((c): c is [number, number] => c !== null);
                if (pts.length) map.flyToBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 15 });
              },
            }}
          />
        );
      })}
    </>
  );
}

export default function ExploreMap({ providers, selectedId, hoveredId, onSelect, onHover }: ExploreMapProps) {
  const mapped = useMemo(() => providers.filter((p) => coordsOf(p) !== null), [providers]);

  // Never show a blank map: branded panel when nothing is mappable.
  if (mapped.length === 0) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-wellness-50 via-white to-emerald-50 flex flex-col items-center justify-center text-center p-8">
        <div className="w-14 h-14 rounded-2xl bg-wellness-100 text-wellness-700 flex items-center justify-center mb-4">
          <MapPin size={26} />
        </div>
        <h3 className="text-base font-black text-slate-900 mb-1">No clinics to map in this view yet</h3>
        <p className="text-sm text-slate-500 max-w-xs font-medium">
          Try clearing a filter or widening your city. We will show the nearest verified clinics in the list.
        </p>
      </div>
    );
  }

  const first = coordsOf(mapped[0])!;

  return (
    <MapContainer
      center={first}
      zoom={5}
      scrollWheelZoom
      className="h-full w-full z-0"
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapSync providers={mapped} selectedId={selectedId} />
      <ClusterLayer
        providers={mapped}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
      />
    </MapContainer>
  );
}
