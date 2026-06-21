import { Provider } from '../types';
import { slugify } from './data';

// Safety Verified / Claimed is the differentiator signal across the site.
export const isVerifiedClinic = (p: Provider): boolean =>
  p.is_claimed === true ||
  p.is_featured === true ||
  (p as { safety_verified?: boolean }).safety_verified === true;

// Valid lat/lng or null. Guards against 0,0 and non-numeric values.
export const coordsOf = (p: Provider): [number, number] | null => {
  const lat = Number(p.latitude);
  const lng = Number(p.longitude);
  if (!isFinite(lat) || !isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return [lat, lng];
};

// Open-now check. Handles both {Monday:["10AM-8PM"]} (DB shape) and
// {monday:"10AM-8PM"} (legacy). Returns false when unknown rather than guessing.
export const isOpenNow = (hours?: Record<string, string | string[]> | null): boolean => {
  if (!hours) return false;
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const raw = hours[weekday] ?? hours[weekday.toLowerCase()];
  const timeRange = Array.isArray(raw) ? raw[0] : raw;
  if (!timeRange || timeRange.toLowerCase().includes('closed')) return false;
  try {
    const parts = timeRange.replace(/\s+/g, '').split(/[-–—]/);
    if (parts.length !== 2) return false;
    const parse = (t: string): Date | null => {
      const m = t.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
      if (!m) return null;
      let h = parseInt(m[1], 10);
      const min = m[2] ? parseInt(m[2], 10) : 0;
      const mod = m[3].toUpperCase();
      if (mod === 'PM' && h < 12) h += 12;
      if (mod === 'AM' && h === 12) h = 0;
      const d = new Date(now);
      d.setHours(h, min, 0, 0);
      return d;
    };
    const start = parse(parts[0]);
    const end = parse(parts[1]);
    if (!start || !end) return false;
    if (end < start) end.setDate(end.getDate() + 1);
    return now >= start && now <= end;
  } catch {
    return false;
  }
};

// Today's posted hours string (e.g. "10AM-8PM") or null.
export const todayHours = (hours?: Record<string, string | string[]> | null): string | null => {
  if (!hours) return null;
  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const raw = hours[weekday] ?? hours[weekday.toLowerCase()];
  const r = Array.isArray(raw) ? raw[0] : raw;
  return r && !r.toLowerCase().includes('closed') ? r : null;
};

// 2-3 key services for a card. Prefer owner-entered services[].name, then
// specialties, then subtypes. Deduped, trimmed, capped.
export const topServices = (p: Provider, n = 3): string[] => {
  const out: string[] = [];
  const push = (s?: string | null) => {
    const v = (s || '').trim();
    if (v && v.length <= 28 && !out.some((o) => o.toLowerCase() === v.toLowerCase())) out.push(v);
  };
  const services = (p as { services?: { name?: string }[] }).services;
  if (Array.isArray(services)) services.forEach((s) => push(s?.name));
  (p.specialties || []).forEach(push);
  (p.subtypes || []).forEach(push);
  return out.slice(0, n);
};

// Real price indicator or null. Prefer an explicit numeric range, then a
// $-symbol band. Never fabricates a price.
export const priceIndicator = (p: Provider): string | null => {
  const pr = (p.price_range || '').trim();
  if (pr && /\d/.test(pr)) return pr; // e.g. "$150-300"
  if (pr && /^\$+$/.test(pr)) return pr; // e.g. "$$"
  const sym = (p as { priceRange?: string }).priceRange;
  if (sym && /^\$+$/.test(sym)) return sym;
  return null;
};

export const clinicHref = (p: Provider): string => `/providers/${p.slug || slugify(p.name)}`;

// Google Maps directions to the clinic from the user's location.
export const directionsUrl = (p: Provider): string => {
  const dest = encodeURIComponent([p.name, p.address, p.city, p.state].filter(Boolean).join(', '));
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
};
