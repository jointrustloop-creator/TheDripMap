// Shared resolution logic for clinic imagery, badges, and identity, so every
// card surface (ProviderCard, the quiz hero, the homepage shelf, the map popup,
// the provider-page Nearby block, the compare matrix) reads the SAME rules and
// can never diverge again.
//
// Data model: `photos[]` is the real owner-uploaded photo, `image_url` is the
// logo. Unclaimed rows frequently share a recycled stock photo, so those are
// never treated as brand imagery.
//
// The primitives accept a minimal `ClinicLike` shape rather than the full
// Provider, so the various per-surface row types (Provider, SimilarClinic, the
// compare row) all satisfy it without casts. Provider is a superset of this.

export interface ClinicLike {
  name: string;
  imageUrl?: string;
  image_url?: string | null;
  photos?: unknown;
  specialties?: string[] | null;
  description?: string | null;
  medical_team?: unknown;
  is_claimed?: boolean;
  is_featured?: boolean;
  safety_verified?: boolean;
  online_booking_url?: string;
}

const STOCK_MARKERS = ['unsplash.com', 'picsum.photos', 'picsum', 'placeholder'];

function isStock(url: string): boolean {
  const u = url.toLowerCase();
  return STOCK_MARKERS.some((m) => u.includes(m));
}

/**
 * The real, owner-uploaded photo if one exists: the first photos[] entry that
 * is not recycled stock. Returns null when there is no genuine photo (the
 * common case, since most clinics have not completed the finish flow yet).
 */
export function realPhotoUrl(provider: ClinicLike): string | null {
  const photos = Array.isArray(provider.photos) ? provider.photos : [];
  for (const p of photos) {
    if (typeof p === 'string' && p.trim() && !isStock(p)) return p;
  }
  return null;
}

/**
 * The clinic's brand logo if one exists: image_url, guarded against recycled
 * stock. Mirrors the prior hasRealLogo / hasRealClinicImage guards: a generic
 * Unsplash photo is not a logo, and a /blog-images/ asset only counts as a logo
 * for claimed or featured clinics (unclaimed rows were bulk-assigned blog art).
 */
export function realLogoUrl(provider: ClinicLike): string | null {
  const url = (provider.imageUrl || provider.image_url || '').trim();
  if (!url) return null;
  if (isStock(url)) return null;
  const claimed = provider.is_claimed === true || provider.is_featured === true;
  if (url.toLowerCase().includes('/blog-images/') && !claimed) return null;
  return url;
}

/** Two-letter monogram from the clinic name, skipping a leading article. */
export function clinicInitials(name: string): string {
  if (!name) return 'IV';
  let words = name.trim().split(/\s+/).filter((w) => /^[a-zA-Z0-9]/.test(w));
  if (words.length > 1 && ['the', 'a', 'an'].includes(words[0].toLowerCase())) words = words.slice(1);
  const a = words[0]?.[0] || '';
  const b = words[1]?.[0] || '';
  return (a + b).toUpperCase().slice(0, 2) || 'IV';
}

/** The badge gate. NEVER infer from is_claimed; only the operator-set flag. */
export function isSafetyVerified(provider: ClinicLike): boolean {
  return provider.safety_verified === true;
}

/** A clinic is in a claimed state (free-tier claim or grandfathered featured). */
export function isClaimedState(provider: ClinicLike): boolean {
  return provider.is_claimed === true || provider.is_featured === true;
}

/** Owner-provided online booking link, when present. */
export function bookingUrlOf(provider: ClinicLike): string | null {
  const u = provider.online_booking_url;
  return typeof u === 'string' && u.trim() ? u : null;
}

/**
 * The regex-derived "who administers" trust line. Conservative: only asserts
 * what the medical_team / description / specialties actually support. Returns
 * null when nothing is derivable. (Carried over verbatim from ProviderCard so
 * the chip reads identically on every surface.)
 */
export function whoAdministersChip(provider: ClinicLike): string | null {
  const team = (Array.isArray(provider.medical_team) ? provider.medical_team : []) as Array<{ name?: string; role?: string }>;
  const teamBlob = team.map((t) => `${t?.name || ''} ${t?.role || ''}`).join(' ');
  const hay = `${provider.description || ''} ${(provider.specialties || []).join(' ')} ${teamBlob}`;
  if (/medical director|\bMD\b|\bD\.?O\.?\b|physician/i.test(hay)) return 'Physician-led care';
  if (/nurse practitioner|\bNP\b/i.test(hay)) return 'NP on staff';
  if (/registered nurse|\bRN\b/i.test(hay)) return 'RN on staff';
  if (/naturopath|\bN\.?D\.?\b/i.test(hay)) return 'Naturopath-led';
  if (team.length > 0) return 'Medically supervised';
  return null;
}
