# TheDripMap Safety Verified Badge — Standard (Single Source of Truth)

**Status:** DRAFT for operator approval (2026-08-11). Once approved, this document
is authoritative. The public content, the questionnaire, and the badge logic must
all reference it and must not drift from it. When any of them needs to change, this
document changes first, then the three consumers are updated to match.

> Why this exists: on 2026-08-11 we found the public content, the questionnaire,
> the database, and CLAUDE.md had each drifted from one another on what the badge
> means and who qualifies. This document is how we stop that recurring.

---

## 1. What the badge asserts (and does not)

**Safety Verified asserts, and only this:** we asked the clinic **who administers
its IVs** and **who the prescriber is that oversees its protocols**; the clinic
named that prescriber and their credential; and we **confirmed that prescriber's
registration number on the relevant public college register** (CPSO, CNO, or
CONO). That is the entire claim: two questions answered, one registration checked.

**It does NOT assert** (we did not do any of these):
- That the clinic is **safe**. The badge is a credential check, not a safety
  judgment. We did not inspect the premises, observe care, or audit records.
- That we verified anything **beyond the prescriber's registration** — not the
  clinic's own licensing, not its equipment, not its practices.
- That every substance on the menu is within that prescriber's legal scope
  (see §5 — open item for ND-prescribed clinics).
- Liability insurance or regulator standing (not asked; only ever set from an
  operator-recorded attestation).
- Anything about price, quality of outcomes, or endorsement.

> Name-vs-claim note: the label "Safety Verified" is broader than the narrow claim
> above. If that gap concerns us, the fix is a tooltip/definition on the badge that
> states exactly this, not a broadening of what we check. Operator decision.

Safety Verified and **Claimed** are independent. Claimed = ownership verified.
Safety Verified = the safety standard below is met. Neither implies the other.

---

## 2. Who may ADMINISTER an IV (Ontario)

Any one of: **RN**, **NP**, **Physician (MD/DO)**, or a **CONO-authorized ND**
(one who holds the College of Naturopaths of Ontario IVIT authorization). An RN is
fully appropriate as the administerer.

Source (our own content, `who-can-legally-give-iv-ontario-2026`): "Ask who starts
the IV and what their credential is (RN, NP, MD, or CONO-authorized ND)."

## 3. Who may PRESCRIBE and OVERSEE the protocols (the medical-oversight bar)

Must be a **Physician (MD/DO)**, a **Nurse Practitioner (NP)**, or a
**CONO-authorized ND (IVIT)**. **An RN alone does NOT satisfy this** — an RN can
administer but is not a prescriber.

Source: "the substances still need a prescriber. In practice an RN-run clinic works
alongside an NP or physician who prescribes and oversees the protocols," and NDs
may prescribe IV "only after" passing CONO's IVIT prescribing-and-therapeutics
requirements.

The public content's summary line is being tightened from "a named MD or NP" to
"a named MD, NP, or CONO-authorized ND" so it matches this standard exactly (§1
content edit).

## 4. Evidence we require

For the prescriber/overseer named in §3:
1. **Name.**
2. **Credential** (MD/DO, NP, or CONO-authorized ND).
3. **College registration number** — CPSO (physicians), CNO (NPs), CONO (NDs) —
   so the claim can be checked against a public college register.
4. **For an ND: explicit confirmation of CONO IVIT authorization** (not merely
   "ND"; not every Ontario ND may prescribe IV).
5. The answers on file (questionnaire submission, or an owner email confirmation
   recorded as evidence in `decision_drivers.safety_evidence`).

An operator reviews this in `/admin/badge-reviews` before the badge turns on, and
**as part of approval must look up the registration number on the public college
register** and confirm it matches the named prescriber. That lookup is what makes
the §1 "confirmed on the public register" assertion true — without it, do not
approve.

**Grandfathering (2026-08-11 ruling).** The registration number is required for
**new** verifications, up front. The clinics already verified to this standard
(9 on the roster as of 2026-08-11) are **not** broken or revoked for lacking a
registration number on file: it is collected at their **next** review. A rule
change never retroactively punishes a clinic that did nothing wrong. Concretely:
`isSafetyVerified()` trusts an existing `safety_review_status='approved'`; the
stricter completeness rule below gates only new completions and new approvals.

## 5. Scope caveat for ND-prescribed clinics (OPEN ITEM)

Our content states a CONO IVIT ND is authorized "**only for a defined list of
substances** on inspected premises." Our content references that this list exists
and is limited but **does not enumerate it**. Consequence: an ND-prescriber clinic
could satisfy the badge while offering a substance outside CONO IVIT scope.

Two follow-ups (operator decision):
- **Content gap:** add what CONO's IVIT list does and does not cover (directionally,
  with a "confirm with CONO" caveat).
- **Badge gap:** decide whether an ND-prescriber clinic must additionally attest
  that its offered menu is within IVIT scope, or whether the badge's assertion in
  §1 (a lawful prescriber oversees the protocols) is scoped narrowly enough. Until
  resolved, the badge does not claim substance-level scope compliance.

## 6. How the standard is enforced in code (must reference this doc)

| Layer | File / mechanism | Rule |
|---|---|---|
| Questionnaire | `/finish` safety section → `decision_drivers.manage` | Two questions: who administers (§2) and who prescribes + registration # (§3/§4). |
| Completeness | `isSafetyComplete()` in `src/lib/safety.ts` | Requires who-administers AND a §3-qualified prescriber named. |
| Approval | `/api/admin/badge-review-action` (`approve`) | Refuses approval unless the questionnaire is complete; operator makes the call. |
| Render gate | `isSafetyVerified()` in `src/lib/safety.ts` | Requires `safety_verified=true` AND `safety_review_status='approved'`. **Every** surface (cards, listing layouts, city pages, explore, schema) must use this — never the raw flag. |
| Public content | `who-can-legally-give-iv-*` posts | Must state §2/§3 exactly; kept in sync with this doc. |

The badge is **human-reviewed** (since 2026-07-25). Completing the questionnaire
sets `safety_review_status='pending'`; it never auto-grants.

## 7. Change process

1. Edit THIS document first and get operator approval.
2. Update the three consumers (content, questionnaire + `isSafetyComplete`, badge
   logic) to match.
3. Re-run the roster audit (RN-as-oversight check across all claimed clinics) to
   confirm nothing on the live roster violates the updated standard.
