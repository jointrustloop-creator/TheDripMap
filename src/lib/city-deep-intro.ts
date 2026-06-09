/**
 * Compose a 150 to 250 word city intro from live DB data + verified
 * regulator facts. Per the 2026-06-09 spec, the intro must be grounded
 * in real numbers, not invented stats. No medical claims, no em-dashes.
 *
 * Output shape: a single string ready to drop into the page or a city-meta
 * regulationNote.body. Returns null when the city does not pass the
 * 3-provider gate, so the caller can skip the deep intro and fall back to
 * the existing short content.
 *
 * Used by Toronto + Vancouver right now via static city-meta entries.
 * Other cities passing the gate can opt in by either calling this helper
 * at render time, or pre-rendering its output into city-meta.ts.
 */
import { getRegulatorForState } from './regulators-by-region';

export interface CityIntroInput {
  cityName: string;
  state?: string | null;
  country?: string | null;
  totalClinics: number;
  /** Set of treatment keywords mentioned on the page (e.g. ['hydration', 'NAD+']). */
  treatmentsOffered: string[];
  /** Optional explicit neighborhoods / areas to call out (e.g. 'downtown Toronto, North York'). */
  areasCovered?: string;
  /** True when the listings include at least one mobile-flagged provider. */
  hasMobile: boolean;
}

/**
 * Returns a single composed paragraph string, or null if there are fewer
 * than 3 clinics (the 3-provider gate threshold).
 */
export function buildCityDeepIntro(input: CityIntroInput): string | null {
  if (input.totalClinics < 3) return null;

  const reg = getRegulatorForState(input.state || undefined);

  const treatments = input.treatmentsOffered.slice(0, 6);
  const treatmentsText = treatments.length === 0
    ? 'a range of IV protocols'
    : treatments.length === 1
    ? treatments[0]
    : treatments.slice(0, -1).join(', ') + ', and ' + treatments[treatments.length - 1];

  const areasText = input.areasCovered ? input.areasCovered : input.cityName;

  const mobileText = input.hasMobile
    ? `, and a notable share of listed clinics offer mobile in-home or hotel service`
    : '';

  const paragraph1 =
    `${input.cityName} is one of the IV therapy markets on TheDripMap, with ${input.totalClinics} clinics serving ${areasText}. ` +
    `The local mix runs across ${treatmentsText}${mobileText}.`;

  const paragraph2 = reg ? reg.summary : '';

  const paragraph3 =
    'General information only, not legal or medical advice. Always confirm suitability and clinician credentials with the clinic before booking.';

  return [paragraph1, paragraph2, paragraph3].filter(Boolean).join('\n\n');
}
