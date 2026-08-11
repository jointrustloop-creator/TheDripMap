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

**Safety Verified asserts:** this clinic told us, in writing, **who administers its
IVs** and **who the qualified prescriber is that authorizes and oversees its
protocols**, an operator reviewed those answers, and they meet the standard below.

**It does NOT assert:**
- That every substance on the clinic's menu is within that prescriber's legal
  scope (see §5 — open item for ND-prescribed clinics).
- Liability insurance or regulator standing (not asked in the questionnaire; only
  ever set from an operator-recorded attestation).
- Anything about price, quality of outcomes, or endorsement.

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

An operator reviews this in `/admin/badge-reviews` before the badge turns on.

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
