/**
 * Badge rules (2026-06-19). Two INDEPENDENT badges, never conflated:
 *
 *   Claimed         <- ownership is verified  (providers.is_claimed)
 *   Safety Verified <- the safety questionnaire is completed
 *                      (providers.safety_verified)
 *
 * "TheDripMap's safety questionnaire" is Step 1 of the /finish form ("Who keeps
 * patients safe?"): who administers IVs, medical oversight, ingredient sourcing.
 * Those answers are stored on providers.decision_drivers.manage. Completing it
 * derives the attestation flags into operator_profiles.profile_data AND sets
 * providers.safety_verified = true. The badge renders off safety_verified.
 *
 * The form covers 3 of the 5 attestation checks (who administers, oversight,
 * sourcing). Liability insurance and regulator standing are NOT asked there, so
 * they are never auto-derived; they can only come from an operator-recorded
 * attestation (e.g. a clinic that answered by email).
 */

export interface SafetyAnswers {
  team?: { whoPlaces?: string[]; oversight?: string };
  sourcing?: string[];
}

/**
 * Completed = the clinic told us who administers IVs AND named the medical
 * oversight. That is the core of "who keeps patients safe" and the bar for the
 * Safety Verified badge. A barely-touched form does not qualify.
 */
export function isSafetyComplete(manage: unknown): boolean {
  const m = manage && typeof manage === 'object' ? (manage as SafetyAnswers) : {};
  const who = Array.isArray(m.team?.whoPlaces) ? (m.team!.whoPlaces as string[]) : [];
  const oversight = typeof m.team?.oversight === 'string' ? m.team!.oversight! : '';
  return who.length > 0 && oversight.trim().length > 0;
}

/**
 * Map the completed safety answers to the badge's attestation flags. Only the
 * checks the form actually covers are set true; the others are left untouched.
 */
export function deriveSafetyFlags(manage: unknown): Record<string, unknown> {
  const m = manage && typeof manage === 'object' ? (manage as SafetyAnswers) : {};
  const who = Array.isArray(m.team?.whoPlaces) ? (m.team!.whoPlaces as string[]) : [];
  const oversight = typeof m.team?.oversight === 'string' ? m.team!.oversight! : '';
  const sourcing = Array.isArray(m.sourcing) ? m.sourcing : [];
  const out: Record<string, unknown> = {};
  if (who.length) {
    out.verifiedClinician = true;
    out.administerType = who.join(', ');
  }
  if (oversight) out.verifiedMedicalDirector = true;
  if (sourcing.some((x) => /compounding pharmacy|503B/i.test(String(x)))) {
    out.verifiedCompoundingPharmacy = true;
  }
  return out;
}
