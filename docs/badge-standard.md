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
- That every substance on the menu is within that prescriber's legal scope by our
  independent check. For ND-prescribed clinics we take the prescriber's own
  attestation that the menu is within their prescribing authority, plus a premises
  check — we do not adjudicate substance-by-substance (see §5).
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
5. **For an ND-prescriber clinic: premises verification.** The clinic must appear
   as an **Authorised IVIT Premise** on CONO's public IVIT Premises Register, and
   the operator confirms this at approval (see the register-lookup note below).
6. **Menu-scope attestation (all clinics, prescriber-signed).** The prescriber
   attests that **every IV on the clinic's menu is within their own prescribing
   authority.** This puts substance-level scope on the accountable licensed person
   rather than on us enumerating a list. For an ND that authority is defined and
   limited by Table 2 of the General Regulation (see §5).
7. The answers on file (questionnaire submission, or an owner email confirmation
   recorded as evidence in `decision_drivers.safety_evidence`).

An operator reviews this in `/admin/badge-reviews` before the badge turns on, and
**as part of approval must look up the registration number on the public college
register** and confirm it matches the named prescriber. That lookup is what makes
the §1 "confirmed on the public register" assertion true — without it, do not
approve.

**Register lookups (operator, at approval):**
- **Prescriber registration** — CPSO (physicians): `doctors.cpso.on.ca`; CNO
  (NPs): `cno.org` "Find a Nurse"; CONO (NDs): the College of Naturopaths public
  ND register on the Alinity portal (`cono.alinityapp.com/client/publicdirectory`).
- **ND-prescriber clinics only — IVIT premises** — confirm the clinic is listed as
  an **Authorised IVIT Premise** on CONO's public IVIT Premises Register
  (`cono.alinityapp.com/client/findcorporationdirectory`, searchable by clinic name
  + city; also linked from the CONO site as "IVIT Premises Search"). This register
  is **manual web lookup only — there is no public API**, so it is an operator step
  at approval, not an automated gate. Record the outcome in
  `decision_drivers.safety_evidence`.

**Grandfathering (2026-08-11 ruling).** The registration number is required for
**new** verifications, up front. The clinics already verified to this standard
(9 on the roster as of 2026-08-11) are **not** broken or revoked for lacking a
registration number on file: it is collected at their **next** review. A rule
change never retroactively punishes a clinic that did nothing wrong. Concretely:
`isSafetyVerified()` trusts an existing `safety_review_status='approved'`; the
stricter completeness rule below gates only new completions and new approvals.

## 5. Scope for ND-prescribed clinics (2026-08-11 ruling)

An Ontario ND's IV authority is **defined and limited by Table 2 of the General
Regulation (O. Reg. 168/15)**, surfaced on CONO's Practice Tables page
(`collegeofnaturopaths.on.ca/members/standards-guidelines/nd-practice-tables/`). If a
substance is not in Table 2, an ND may not administer it by injection. Table 2 was
amended in May 2023 and can change again.

**We do not republish an enumerated substance list.** Republishing the list would
mean owning its currency, and a stale list is worse than none. Our public content
**links to CONO's Practice Tables page** and explains that ND IV authority is
defined and limited by that table, carrying (a) the date we last checked the link
and (b) a line telling readers to confirm current scope with CONO. It does **not**
enumerate substances.

**Substance-scope is handled by attestation, not by us adjudicating the menu**
(§4.6): the prescriber attests every IV on the menu is within their own prescribing
authority. For an ND that authority is Table 2. This puts scope on the accountable
licensed person and unblocks the badge now, without us maintaining a list.

**Premises** (§4.5): an ND-prescriber clinic must additionally appear as an
Authorised IVIT Premise on CONO's public IVIT Premises Register, confirmed by the
operator at approval (manual lookup; no API).

With these three in place — link-out content, prescriber-signed menu-scope
attestation, and premises verification — the badge no longer leaves substance scope
as an open gap for ND-prescriber clinics.

## 6. How the standard is enforced in code (must reference this doc)

| Layer | File / mechanism | Rule |
|---|---|---|
| Questionnaire | `/finish` safety section → `decision_drivers.manage` | Who administers (§2); who prescribes + registration # (§3/§4); prescriber's menu-scope attestation (§4.6). |
| Completeness | `isSafetyComplete()` in `src/lib/safety.ts` | Requires who-administers AND a §3-qualified prescriber named. |
| Approval | `/api/admin/badge-review-action` (`approve`) | Refuses approval unless the questionnaire is complete; operator looks up the registration (§4) and, for ND-prescriber clinics, the IVIT premises (§4.5) before approving. |
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
