/**
 * Shared clinic-filter logic for /search AND /cities/[slug].
 *
 * Design rules (operator-approved 2026-08-11 "filter honesty" pass):
 *  - HARD filters actually narrow the choice set and are fair to fail closed on
 *    (City, text search, Mobile IV). Everything else that reads a sparsely-
 *    populated field must NOT silently hide clinics for missing data.
 *  - SOFT boosts (NAD+, Beauty/Glutathione, Top Rated) never hide anyone. They
 *    partition results into three VISIBLE, labelled groups:
 *        lists     — the clinic's own data says it offers/qualifies
 *        notListed — the clinic has menu/rating data, and it does not match
 *        unknown   — the clinic hasn't given us the data to answer (claim bait)
 *  - The flagship facet ("who prescribes") is honest about its size: it ties to
 *    the Safety Verified system (isSafetyVerified), which now requires a named,
 *    registration-checked prescriber. Count is shown live, never hidden.
 *
 * Removed here on purpose (data can't answer them honestly): Best Value (0% of
 * CA listings pass), Open Now (only ~3% publish hours), Weight Loss (~5%, drug-
 * name sensitivity), and the dead Service-Type panel.
 */
import type { Provider } from '../types';
import { isSafetyVerified } from './safety';

export type HardFilterId = 'Mobile';
export type SoftFilterId = 'NAD' | 'SkinGlow' | 'TopRated';
export type FacetId = 'PrescriberVerified';

export interface ChipDef {
  id: HardFilterId | SoftFilterId | FacetId;
  label: string;
  kind: 'hard' | 'soft' | 'facet';
}

// The full post-cleanup chip set. Order is display order.
export const CHIPS: ChipDef[] = [
  { id: 'PrescriberVerified', label: 'Verified who prescribes', kind: 'facet' },
  { id: 'Mobile', label: 'Mobile IV', kind: 'hard' },
  { id: 'NAD', label: 'NAD+', kind: 'soft' },
  { id: 'SkinGlow', label: 'Beauty / Glutathione', kind: 'soft' },
  { id: 'TopRated', label: 'Top Rated', kind: 'soft' },
];

export const SOFT_FILTER_IDS: SoftFilterId[] = ['NAD', 'SkinGlow', 'TopRated'];
export function isSoftId(id: string): id is SoftFilterId {
  return (SOFT_FILTER_IDS as string[]).includes(id);
}

const SOFT_KEYWORDS: Record<'NAD' | 'SkinGlow', string[]> = {
  NAD: ['nad+', 'nad ', 'nicotinamide', 'longevity'],
  SkinGlow: ['glutathione', 'beauty drip', 'beauty + glow', 'beauty and glow', 'skin glow', 'brightening'],
};

const MOBILE_RE = /\bmobile\b|\bconcierge\b|\bin[\s-]home\b|come to you|at[\s-]your[\s-](?:home|office|hotel)|house calls?|delivered to your/;

// ── Field helpers ────────────────────────────────────────────────────────────
function menuText(p: Provider): string {
  const specialties = (p.specialties || []).join(' ');
  const subtypes = ((p as { subtypes?: string[] }).subtypes || []).join(' ');
  return `${specialties} ${subtypes} ${p.name || ''} ${p.description || ''}`.toLowerCase();
}

/** Does the clinic have ANY menu-ish data to answer a treatment question? */
export function hasMenuData(p: Provider): boolean {
  const specialties = p.specialties || [];
  const services = (p as { services?: unknown[] }).services || [];
  return specialties.length > 0 || services.length > 0 || (p.description || '').trim().length > 0;
}

// ── Hard: Mobile IV ──────────────────────────────────────────────────────────
export function isMobile(p: Provider): boolean {
  if (p.type === 'Mobile' || p.type === 'Both') return true;
  return MOBILE_RE.test(menuText(p));
}

// ── Soft predicates ──────────────────────────────────────────────────────────
export function isTopRated(p: Provider): boolean {
  return (p.rating ?? 0) >= 4.7 && (p.reviewCount ?? 0) >= 20;
}
function matchesTreatment(p: Provider, id: 'NAD' | 'SkinGlow'): boolean {
  const t = menuText(p);
  return SOFT_KEYWORDS[id].some((kw) => t.includes(kw));
}

/**
 * Classify a clinic against ONE soft chip into lists / notListed / unknown.
 * unknown = we genuinely lack the data (no menu for a treatment chip; no rating
 * for Top Rated). This is the group we always show and label, never bury.
 */
export type SoftClass = 'lists' | 'notListed' | 'unknown';
export function classifySoft(p: Provider, id: SoftFilterId): SoftClass {
  if (id === 'TopRated') {
    const rated = (p.reviewCount ?? 0) > 0 && (p.rating ?? 0) > 0;
    if (!rated) return 'unknown';
    return isTopRated(p) ? 'lists' : 'notListed';
  }
  if (!hasMenuData(p)) return 'unknown';
  return matchesTreatment(p, id) ? 'lists' : 'notListed';
}

// ── Facet: who prescribes (flagship) ─────────────────────────────────────────
// Ties to the Safety Verified system: the badge now requires a named prescriber
// whose college registration we checked (see docs/badge-standard.md). So
// "verified who prescribes" == isSafetyVerified. Honest and small by design.
export function isPrescriberVerified(p: Provider): boolean {
  return isSafetyVerified(p as Parameters<typeof isSafetyVerified>[0]);
}

// ── Grouped result shape ─────────────────────────────────────────────────────
export interface GroupedResults {
  lists: Provider[];
  notListed: Provider[];
  unknown: Provider[];
  /** true when at least one soft chip is active (caller should render groups). */
  grouped: boolean;
}

/**
 * Apply the active soft chips as a NON-hiding partition. A clinic lands in:
 *  - lists     if it matches ANY active soft chip
 *  - unknown   if it matches none AND every active chip's data is missing for it
 *  - notListed otherwise (has data, doesn't match)
 * When no soft chip is active, everything is returned in `lists` and
 * grouped=false so the caller renders a normal flat list.
 */
export function groupBySoft(providers: Provider[], activeSoft: SoftFilterId[]): GroupedResults {
  if (activeSoft.length === 0) {
    return { lists: providers, notListed: [], unknown: [], grouped: false };
  }
  const lists: Provider[] = [];
  const notListed: Provider[] = [];
  const unknown: Provider[] = [];
  for (const p of providers) {
    const classes = activeSoft.map((id) => classifySoft(p, id));
    if (classes.includes('lists')) lists.push(p);
    else if (classes.every((c) => c === 'unknown')) unknown.push(p);
    else notListed.push(p);
  }
  return { lists, notListed, unknown, grouped: true };
}

/** Count how many clinics a HARD filter would leave, for the pre-apply hint. */
export function countHard(providers: Provider[], id: HardFilterId): number {
  if (id === 'Mobile') return providers.filter(isMobile).length;
  return providers.length;
}

export function countFacet(providers: Provider[], id: FacetId): number {
  if (id === 'PrescriberVerified') return providers.filter(isPrescriberVerified).length;
  return 0;
}

// Human labels for the three soft groups (used by the UI section headers).
export const SOFT_GROUP_LABELS: Record<keyof Omit<GroupedResults, 'grouped'>, string> = {
  lists: 'Lists this treatment',
  notListed: "Doesn't list it",
  unknown: "Hasn't provided details",
};
