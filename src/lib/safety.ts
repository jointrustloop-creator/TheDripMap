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
  team?: {
    whoPlaces?: string[];
    // Legacy single "oversight" field (pre-2026-08). Kept for back-compat reads
    // of grandfathered answers; the current form writes the prescriber_* fields.
    oversight?: string;
    leadName?: string;
    // 2026-08 two-part model (see docs/badge-standard.md §3/§4): the person who
    // PRESCRIBES and oversees the protocols, distinct from who administers.
    prescriberName?: string;
    prescriberCredential?: string; // 'MD/DO' | 'NP' | 'CONO-authorized ND'
    prescriberRegNum?: string; // CPSO / CNO / CONO registration number
    prescriberNdIvit?: boolean; // required true when credential is an ND
  };
  sourcing?: string[];
}

// A prescriber credential that satisfies medical oversight (docs/badge-standard.md
// §3): physician (MD/DO) or nurse practitioner. ND is handled separately because
// it additionally requires CONO IVIT authorization. An RN never qualifies here.
export function isMDorNP(credential: string | undefined | null): boolean {
  const c = (credential || '').toLowerCase();
  return /\bmd\b|\bdo\b|physician|nurse practitioner|\bnp\b/.test(c);
}
export function isNDCredential(credential: string | undefined | null): boolean {
  const c = (credential || '').toLowerCase();
  return /\bnd\b|naturopath/.test(c);
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
  p: {
    safety_verified?: boolean | null;
    safety_review_status?: string | null;
    decision_drivers?: { safety_review_expires_at?: string | null } | null;
  } | null | undefined
): boolean {
  if (p?.safety_verified !== true || p?.safety_review_status !== 'approved') return false;
  // Approvals EXPIRE so they are re-checked, never trusted forever (2026-08
  // ruling). The approval gate in /api/admin/badge-review-action guarantees the
  // questionnaire is complete AT approval time; the expiry forces re-review so a
  // grandfathered "approved" cannot stand indefinitely. When decision_drivers is
  // loaded (full provider rows) and the expiry is in the past, the badge lapses.
  const exp = p?.decision_drivers?.safety_review_expires_at;
  if (typeof exp === 'string' && exp) {
    const t = Date.parse(exp);
    if (!Number.isNaN(t) && t < Date.now()) return false; // lapsed -> back to review
  }
  return true;
}

// Completeness for the CURRENT (2026-08) two-part questionnaire: who administers
// AND a qualified prescriber (MD/NP, or CONO-authorized ND with IVIT) named WITH
// a college registration number. An RN alone never satisfies oversight. This
// gates new /finish completions and new approvals; grandfathered approvals are
// trusted via isSafetyVerified (approved + not expired), never re-run here.
export function isSafetyComplete(manage: unknown): boolean {
  const m = manage && typeof manage === 'object' ? (manage as SafetyAnswers) : {};
  const t = m.team || {};
  const who = Array.isArray(t.whoPlaces) ? (t.whoPlaces as string[]) : [];
  if (who.length === 0) return false;
  const name = (t.prescriberName || '').trim();
  const reg = (t.prescriberRegNum || '').trim();
  const cred = t.prescriberCredential || '';
  if (!name || !reg) return false;
  if (isMDorNP(cred)) return true;
  if (isNDCredential(cred) && t.prescriberNdIvit === true) return true;
  return false; // RN-only, missing credential, or ND without IVIT confirmation
}

/**
 * Map the completed safety answers to the badge's attestation flags. Only the
 * checks the form actually covers are set true; the others are left untouched.
 */
export function deriveSafetyFlags(manage: unknown): Record<string, unknown> {
  const m = manage && typeof manage === 'object' ? (manage as SafetyAnswers) : {};
  const t = m.team || {};
  const who = Array.isArray(t.whoPlaces) ? (t.whoPlaces as string[]) : [];
  const oversight = typeof t.oversight === 'string' ? t.oversight : '';
  const sourcing = Array.isArray(m.sourcing) ? m.sourcing : [];
  const out: Record<string, unknown> = {};
  if (who.length) {
    out.verifiedClinician = true;
    out.administerType = who.join(', ');
  }
  // New two-part model: a qualified, named prescriber (MD/NP, or IVIT-ND) IS the
  // medical oversight. Fall back to the legacy single "oversight" field.
  const prescriberQualifies =
    !!(t.prescriberName || '').trim() &&
    (isMDorNP(t.prescriberCredential) || (isNDCredential(t.prescriberCredential) && t.prescriberNdIvit === true));
  if (prescriberQualifies) {
    out.verifiedMedicalDirector = true;
    out.medicalDirectorName = (t.prescriberName || '').trim();
    out.medicalDirectorCredentials = t.prescriberCredential || '';
    if ((t.prescriberRegNum || '').trim()) out.medicalDirectorRegNum = (t.prescriberRegNum || '').trim();
  } else if (oversight) {
    out.verifiedMedicalDirector = true;
  }
  if (sourcing.some((x) => /compounding pharmacy|503B/i.test(String(x)))) {
    out.verifiedCompoundingPharmacy = true;
  }
  return out;
}
