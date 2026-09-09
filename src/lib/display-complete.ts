/**
 * Display Complete: the ONE definition of "this claimed listing is actually
 * useful to a patient", used everywhere a completeness judgement is made
 * (/admin/listing-gaps, the nightly report's data check, the owner's Profile
 * Strength on /finish, and later the activation engine). Before 2026-09-09
 * three places each had their own slightly different rule, so the same clinic
 * could read complete in one and missing in another.
 *
 * Computed from the RAW provider row (service-role read), never from the
 * public-safe enriched shape, because the answers live in decision_drivers.
 *
 * Five required items. Safety Verified is deliberately NOT part of this: it is
 * earned by human review against a register (docs/badge-standard.md) and must
 * never be conflated with "the page is filled in".
 */

export type CompletenessKey = 'contact' | 'hours' | 'services' | 'prices' | 'photo' | 'practitioner';

export interface CompletenessItem {
  key: CompletenessKey;
  label: string;          // owner-facing, e.g. "Booking link or phone"
  present: boolean;
  weight: number;         // contribution to Profile Strength (sums to 100)
  impact: 'critical' | 'major' | 'trust' | 'conversion';
}

export interface Completeness {
  complete: boolean;      // every REQUIRED item present
  strength: number;       // 0-100, weighted
  missing: CompletenessItem[];
  items: CompletenessItem[];
}

// Scraped placeholder imagery is not the clinic's own photo.
const STOCK_RE = /picsum|unsplash|placeholder|loremflickr|pravatar|monogram|logo-fallback/i;
const MONEY_RE = /\$\s?\d/;

function s(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Raw providers row. Only the fields this needs; everything optional. */
export interface CompletenessRow {
  phone?: string | null;
  online_booking_url?: string | null;
  working_hours?: Record<string, unknown> | null;
  price_range?: string | null;
  services?: Array<{ name?: string | null; price?: string | null }> | null;
  specialties?: string[] | null;
  image_url?: string | null;
  photos?: unknown[] | null;
  medical_team?: Array<{ name?: string | null }> | null;
  decision_drivers?: {
    manage?: { team?: { prescriberName?: string; leadName?: string } };
    prescriber_verification?: { name?: string | null } | null;
  } | null;
  /**
   * The clinic's operator_profiles row, when the caller has it. Older claims
   * recorded the medical director there (profile_data.medicalDirectorName)
   * rather than on the provider row, e.g. Bay Wellness. Callers fetch it by
   * clinic_id and attach; absent means "not checked", not "none".
   */
  operator_profile?: {
    owner_name?: string | null;
    profile_data?: { medicalDirectorName?: string | null } | null;
  } | null;
}

export function assessCompleteness(row: CompletenessRow): Completeness {
  const hasPhone = !!s(row.phone);
  const hasBooking = /^https?:\/\/[^\s.]+\.[^\s]+/i.test(s(row.online_booking_url));
  const hasHours = !!row.working_hours && Object.keys(row.working_hours).length > 0;
  const services = Array.isArray(row.services) ? row.services.filter((x) => x && s(x.name)) : [];
  const hasServices = services.length > 0 || (Array.isArray(row.specialties) && row.specialties.length > 0);
  const hasPrices = MONEY_RE.test(s(row.price_range)) || services.some((x) => MONEY_RE.test(s(x.price)));
  const photoCount = Array.isArray(row.photos) ? row.photos.length : 0;
  const hasPhoto = photoCount > 0 || (!!s(row.image_url) && !STOCK_RE.test(s(row.image_url)));
  const team = Array.isArray(row.medical_team) ? row.medical_team : [];
  const manageTeam = row.decision_drivers?.manage?.team;
  const hasPractitioner =
    team.some((m) => m && s(m.name))
    || !!s(manageTeam?.prescriberName)
    || !!s(manageTeam?.leadName)
    || !!s(row.decision_drivers?.prescriber_verification?.name)
    || !!s(row.operator_profile?.profile_data?.medicalDirectorName);

  const items: CompletenessItem[] = [
    { key: 'contact', label: 'Booking link or phone', present: hasPhone || hasBooking, weight: 20, impact: 'critical' },
    { key: 'hours', label: 'Opening hours', present: hasHours, weight: 20, impact: 'major' },
    { key: 'services', label: 'Treatments offered', present: hasServices, weight: 15, impact: 'major' },
    { key: 'prices', label: 'Prices', present: hasPrices, weight: 20, impact: 'major' },
    { key: 'practitioner', label: 'Named practitioner', present: hasPractitioner, weight: 15, impact: 'trust' },
    { key: 'photo', label: 'Logo or photo', present: hasPhoto, weight: 10, impact: 'conversion' },
  ];
  const strength = items.reduce((n, i) => n + (i.present ? i.weight : 0), 0);
  const missing = items.filter((i) => !i.present);
  return { complete: missing.length === 0, strength, missing, items };
}

/** Short human line for reports: "missing prices, hours" or "complete". */
export function completenessSummary(c: Completeness): string {
  return c.complete ? 'complete' : `missing ${c.missing.map((m) => m.key).join(', ')}`;
}
