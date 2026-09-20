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
  // Structured answers first: the prescriber credential the owner gave on
  // /finish (and that we may have checked against the register), then who
  // places the IV. Only when neither exists do we fall back to keyword
  // guessing over the description, which is what produced "Medically
  // supervised" on some cards and nothing on others for the same kind of
  // clinic (Hubert 2026-09-20).
  const dd = (provider as { decision_drivers?: { manage?: { team?: Record<string, unknown> }; prescriber_verification?: { credential?: string; verified?: boolean } } }).decision_drivers || {};
  const teamAns = (dd.manage?.team || {}) as Record<string, unknown>;
  const cred = String(dd.prescriber_verification?.credential || teamAns.prescriberCredential || '');
  const whoPlaces = Array.isArray(teamAns.whoPlaces) ? (teamAns.whoPlaces as string[]).join(' ') : '';
  if (/\bMD\b|\bDO\b|physician/i.test(cred)) return { tier: 'physician', label: 'Physician-led', rank: 5, isPrescriberLevel: true };
  if (/\bNP\b|nurse practitioner/i.test(cred)) return { tier: 'np', label: 'NP-led', rank: 4, isPrescriberLevel: true };
  if (/\bND\b|naturopath/i.test(cred)) return { tier: 'naturopath', label: /IV|IVIT/i.test(cred) || teamAns.prescriberNdIvit === true ? 'ND-led, IV authorized' : 'Naturopath-led', rank: 1, isPrescriberLevel: false };
  if (/\bRN\b/i.test(whoPlaces)) return { tier: 'rn', label: 'RN-administered', rank: 3, isPrescriberLevel: false };
  if (/\bNP\b/i.test(whoPlaces)) return { tier: 'np', label: 'NP-led', rank: 4, isPrescriberLevel: true };
  if (/\bND\b/i.test(whoPlaces)) return { tier: 'naturopath', label: 'Naturopath-led', rank: 1, isPrescriberLevel: false };

  const team = (provider.medical_team || []) as Array<{ name?: string; role?: string }>;
  const teamBlob = team.map((t) => `${t?.name || ''} ${t?.role || ''}`).join(' ');
  const amenities = ((provider.amenities || []) as unknown as string[]).join(' ');
  const hay = `${provider.name || ''} ${provider.description || ''} ${(provider.specialties || []).join(' ')} ${teamBlob} ${amenities}`;

  // Keyword fallback over owner-written text. The team blob is checked first
  // so a naturopathic clinic whose description mentions "physician referrals"
  // is not labelled physician-led.
  if (/\bmedical director\b|\bM\.?D\.?\b|\bD\.?O\.?\b|physician[- ]led|doctor[- ]led|md[- ]led/i.test(teamBlob) || /\bM\.?D\.?\b|\bD\.?O\.?\b/.test(teamBlob)) {
    return { tier: 'physician', label: 'Physician-led', rank: 5, isPrescriberLevel: true };
  }
  if (/nurse practitioner|\bN\.?P\.?\b/i.test(teamBlob)) {
    return { tier: 'np', label: 'NP-led', rank: 4, isPrescriberLevel: true };
  }
  if (/naturopath|\bN\.?D\.?\b/.test(teamBlob)) {
    return { tier: 'naturopath', label: 'Naturopath-led', rank: 1, isPrescriberLevel: false };
  }
  if (/registered nurse|\bR\.?N\.?\b/.test(teamBlob)) {
    return { tier: 'rn', label: 'RN-administered', rank: 3, isPrescriberLevel: false };
  }
  if (/\bmedical director\b|physician[- ]led|md[- ]led/i.test(hay)) {
    return { tier: 'physician', label: 'Physician-led', rank: 5, isPrescriberLevel: true };
  }
  if (/nurse practitioner/i.test(hay)) {
    return { tier: 'np', label: 'NP-led', rank: 4, isPrescriberLevel: true };
  }
  if (/naturopath/i.test(hay)) {
    return { tier: 'naturopath', label: 'Naturopath-led', rank: 1, isPrescriberLevel: false };
  }
  if (/registered nurse|\bRN\b/.test(hay)) {
    return { tier: 'rn', label: 'RN-administered', rank: 3, isPrescriberLevel: false };
  }
  // A team is listed but no role we can name: say that, not "medically
  // supervised", which implied an oversight we had not established.
  if (team.length > 0) {
    return { tier: 'supervised', label: 'Clinical team listed', rank: 2, isPrescriberLevel: false };
  }
  return { tier: 'unknown', label: null, rank: 0, isPrescriberLevel: false };
}
