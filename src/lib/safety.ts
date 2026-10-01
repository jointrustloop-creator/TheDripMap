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

/**
 * The public register a prescriber's number was checked against, derived from
 * the recorded credential and the clinic's province (change order 2026-09-28,
 * item 4). Recorded checks did not consistently store the college name, so it
 * is derived here in one place for every public surface.
 */
export function registerFor(credential: string | null | undefined, state: string | null | undefined): { college: string; url: string } | null {
  const c = (credential || '').toLowerCase();
  const s = (state || '').trim().toUpperCase();
  const prov = s.length === 2 ? s : ({ ONTARIO: 'ON', QUEBEC: 'QC', 'BRITISH COLUMBIA': 'BC', ALBERTA: 'AB', MANITOBA: 'MB', SASKATCHEWAN: 'SK', 'NOVA SCOTIA': 'NS', 'NEW BRUNSWICK': 'NB' } as Record<string, string>)[s] || s;
  // Every URL below was fetched and returned 200 on 2026-09-30 (CNO's
  // registry answers 403 to scripts but is the college's own "Find a Nurse"
  // link from cno.org). The first version shipped six dead links.
  if (/cchpbc/.test(c) || (isNDCredential(c) && prov === 'BC')) return { college: 'CCHPBC (College of Complementary Health Professionals of BC)', url: 'https://cchpbc.ca/public/practitioner-search/' };
  if (/cono/.test(c) || (isNDCredential(c) && prov === 'ON')) return { college: 'College of Naturopaths of Ontario', url: 'https://cono.alinityapp.com/client/publicdirectory' };
  if (isNDCredential(c) && prov === 'AB') return { college: 'College of Naturopathic Doctors of Alberta', url: 'https://cnda.alinityapp.com/Client/PublicDirectory' };
  if (/cpso/.test(c) || ((/\bmd\b|\bdo\b|physician/.test(c)) && prov === 'ON')) return { college: 'CPSO (College of Physicians and Surgeons of Ontario)', url: 'https://register.cpso.on.ca/' };
  if ((/\bmd\b|\bdo\b|physician/.test(c)) && prov === 'BC') return { college: 'CPSBC (College of Physicians and Surgeons of BC)', url: 'https://www.cpsbc.ca/directory' };
  if ((/\bmd\b|\bdo\b|physician/.test(c)) && prov === 'AB') return { college: 'CPSA (College of Physicians and Surgeons of Alberta)', url: 'https://search.cpsa.ca/' };
  if ((/nurse practitioner|\bnp\b/.test(c)) && prov === 'ON') return { college: 'College of Nurses of Ontario', url: 'https://registry.cno.org/' };
  if ((/nurse practitioner|\bnp\b/.test(c)) && prov === 'BC') return { college: 'BCCNM (BC College of Nurses and Midwives)', url: 'https://registry.bccnm.ca/' };
  if ((/nurse practitioner|\bnp\b/.test(c)) && prov === 'AB') return { college: 'College of Registered Nurses of Alberta', url: 'https://www.nurses.ab.ca/find-a-nurse/' };
  return null;
}

/**
 * "Prescriber registration verified on <college> on <date>" for the public
 * badge, or null when no register check is on file. Reads the operator-only
 * prescriber_verification record; never the clinic's own questionnaire.
 */
export function prescriberRegisterCheck(
  p: { state?: string | null; decision_drivers?: { prescriber_verification?: { verified?: boolean; verified_at?: string | null; credential?: string | null } | null } | null } | null | undefined
): { college: string; url: string; date: string; sentence: string } | null {
  const pv = p?.decision_drivers?.prescriber_verification;
  if (!pv || pv.verified !== true || !pv.verified_at) return null;
  const reg = registerFor(pv.credential, p?.state);
  if (!reg) return null;
  const d = new Date(pv.verified_at);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Toronto' });
  return { ...reg, date, sentence: `Prescriber registration verified on ${reg.college} on ${date}` };
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
 * L5 "Regulator-Inspected" (docs/badge-standard.md §7). We do NOT run this
 * inspection: we mirror an outcome the regulator already published, and link to
 * their register. In Ontario every premises where an ND performs IVIT must be
 * registered and inspected by CONO, which publishes the result.
 *
 * Stored on the existing decision_drivers JSONB (no migration), shape:
 *   decision_drivers.premises = {
 *     register: 'CONO IVIT Premises Register',
 *     status: 'authorized' | 'not_listed' | 'unknown',
 *     outcome: 'Pass' | 'Pass with conditions' | ...,
 *     url: '<register URL>',
 *     checked_at: '2026-08-13'
 *   }
 *
 * Display rule: we surface ONLY a positive, current authorization. A negative
 * outcome is an operator review signal, never a public mark against a clinic —
 * the process for handling one is still an open item in the SSOT (§5), and
 * publishing a scarlet letter before that process exists would be unfair.
 */
export interface PremisesVerification {
  register: string;
  outcome: string | null;
  url: string | null;
  checkedAt: string | null;
}

export function premisesVerification(
  p: { decision_drivers?: { premises?: unknown } | null } | null | undefined
): PremisesVerification | null {
  const raw = p?.decision_drivers?.premises;
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (String(r.status || '').trim().toLowerCase() !== 'authorized') return null;
  return {
    register: String(r.register || 'the regulator’s register'),
    outcome: r.outcome ? String(r.outcome) : null,
    url: r.url ? String(r.url) : null,
    checkedAt: r.checked_at ? String(r.checked_at) : null,
  };
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
