import { Provider } from '../types';

// Practitioner / medical-oversight classification, derived from the clinic's
// listed medical team plus credential signals in its name, description,
// specialties, and amenities. Used in two places that must agree:
//   1. The quiz result safety-aware ranking (sort, never hard-filter) when a
//      visitor flags a contraindication, so MD / NP / DO-led clinics rise to
//      the top and a naturopath-led clinic is never led with.
//   2. The clinic card's scannable practitioner chip.
//
// rank: higher = stronger prescriber-level oversight.

export type PractitionerTier =
  | 'physician'
  | 'np'
  | 'rn'
  | 'supervised'
  | 'naturopath'
  | 'unknown';

export interface PractitionerInfo {
  tier: PractitionerTier;
  label: string | null;
  rank: number;
  // True for MD / NP / DO — the prescriber-level oversight a flagged visitor
  // should be steered toward.
  isPrescriberLevel: boolean;
}

export function practitionerType(provider: Provider): PractitionerInfo {
  const team = (provider.medical_team || []) as Array<{ name?: string; role?: string }>;
  const teamBlob = team.map((t) => `${t?.name || ''} ${t?.role || ''}`).join(' ');
  const amenities = ((provider.amenities || []) as unknown as string[]).join(' ');
  const hay = `${provider.name || ''} ${provider.description || ''} ${(provider.specialties || []).join(' ')} ${teamBlob} ${amenities}`;

  if (/\bmedical director\b|\bM\.?D\.?\b|\bD\.?O\.?\b|physician|doctor[- ]led|md[- ]led/i.test(hay)) {
    return { tier: 'physician', label: 'MD-led', rank: 5, isPrescriberLevel: true };
  }
  if (/nurse practitioner|\bN\.?P\.?\b/i.test(hay)) {
    return { tier: 'np', label: 'NP-led', rank: 4, isPrescriberLevel: true };
  }
  if (/registered nurse|\bR\.?N\.?\b/i.test(hay)) {
    return { tier: 'rn', label: 'RN on staff', rank: 3, isPrescriberLevel: false };
  }
  // "Medically supervised" is a vaguer signal (a team is listed but the role is
  // unclear); it ranks above a naturopath for a flagged visitor because the
  // brief is to steer toward MD / NP / DO-equivalent oversight.
  if (team.length > 0) {
    return { tier: 'supervised', label: 'Medically supervised', rank: 2, isPrescriberLevel: false };
  }
  if (/naturopath|\bN\.D\.\b/i.test(hay)) {
    return { tier: 'naturopath', label: 'Naturopath-led', rank: 1, isPrescriberLevel: false };
  }
  return { tier: 'unknown', label: null, rank: 0, isPrescriberLevel: false };
}
