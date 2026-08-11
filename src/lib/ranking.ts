// Single source of truth for listing ranking, shared by the match quiz and the
// city/search pages so the two can never diverge. The rule everywhere:
//   - a FEATURED band (paid top-placement), capped, that a clinic only enters
//     when it is strictly Safety Verified (isSafetyVerified). Paying never
//     exempts a clinic from the safety bar.
//   - then an ORGANIC band sorted by: Safety Verified -> profile completeness
//     -> rating.
// The quiz adds its own hard filter (city + treatment), contraindication
// override, and modality nudge on top of this shared core.

import type { Provider } from '../types';
import { isSafetyVerified } from './safety';

// TEMPORARY profile-completeness proxy (0-100), equal-weighted. There is no
// providers.completeness_score column yet (it ships in the tier migration), so
// this derives a score from raw fields. REPLACE with the real column when it
// exists. Kept here so the quiz and city ranking use ONE implementation.
export function profileCompleteness(p: Provider): number {
  const online = (p as { online_booking_url?: string | null }).online_booking_url;
  const checks = [
    Array.isArray(p.photos) && p.photos.length >= 3,
    !!p.price_range,
    !!p.working_hours && Object.keys(p.working_hours).length > 0,
    !!online,
    !!p.phone,
    typeof p.description === 'string' && p.description.length >= 200,
    p.safety_verified === true,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// Core organic comparator: Safety Verified (strict) -> completeness -> rating.
// Callers may layer additional keys before/after (the quiz does).
export function organicCompare(a: Provider, b: Provider): number {
  const aV = isSafetyVerified(a), bV = isSafetyVerified(b);
  if (aV !== bV) return bV ? 1 : -1;
  const ac = profileCompleteness(a), bc = profileCompleteness(b);
  if (ac !== bc) return bc - ac;
  return (b.rating || 0) - (a.rating || 0);
}

// City-page featured slot cap (monetization brief §4): 5 for the big three,
// else 3. Only strictly-verified featured clinics occupy these slots.
export function featuredCap(city?: string | null): number {
  const c = (city || '').toLowerCase().trim();
  return c === 'toronto' || c === 'montreal' || c === 'vancouver' ? 5 : 3;
}

// Reorder a city/search result set: strictly-verified featured first (capped),
// then everyone else organic. A featured clinic that is NOT strictly verified
// falls through to the organic band — no city-page carve-out, same rule as the
// quiz. is_featured stays the paid signal; when `tier` ships, derive is_featured
// from tier rather than touching this.
export function rankCityListings<T extends Provider>(rows: T[], city?: string | null): T[] {
  const featured = rows
    .filter((p) => p.is_featured === true && isSafetyVerified(p))
    .sort(organicCompare)
    .slice(0, featuredCap(city));
  const ids = new Set(featured.map((p) => p.id));
  const organic = rows.filter((p) => !ids.has(p.id)).sort(organicCompare);
  return [...featured, ...organic];
}
