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
 * derives the attestation flags into operator_profiles.profile_data AND queues
 * the clinic for review (providers.safety_review_status='pending'). Since
 * 2026-07-25 the badge is HUMAN-REVIEWED: an operator approves it in
 * /admin/badge-reviews, which sets providers.safety_verified = true. The badge
 * renders off safety_verified.
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
/**
 * THE single source of truth for rendering the Safety Verified badge, anywhere.
 *
 * The badge requires BOTH the operator-set safety_verified flag AND an approved
 * human review (safety_review_status === 'approved'). This closes the integrity
 * gap where grandfathered clinics carried safety_verified=true with blank
 * attestations and no review (status null): those must never show the badge.
 * Data is left intact and reversible: completing the questionnaire and getting
 * approved (status='approved') makes the badge return automatically. Every
 * render site (homepage featured row, provider pages, cards) MUST use this.
 */
export function isSafetyVerified(
  p: { safety_verified?: boolean | null; safety_review_status?: string | null } | null | undefined
): boolean {
  return p?.safety_verified === true && p?.safety_review_status === 'approved';
}

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
