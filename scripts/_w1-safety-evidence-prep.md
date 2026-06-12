# W1 First-Run Safety Evidence Prep (6 verified clinics)

Assembled 2026-06-12 (bootstrap step 5 follow-on). This is the PUBLIC REGISTRY
half of the safety evidence; the other half arrives in each clinic's reply to
the onboarding email (Q1 who administers, Q4 sourcing). safety_verified is
flipped ONLY by the operator on /admin/onboarding. None of the license
statuses below are registry-confirmed yet: all six registries are form-driven
portals that need a human lookup (~20 minutes total, links below).

Current listing gaps (read-only check, scripts/_w1-first-run-gap-check.cjs):
all 6 have a logo; NONE has priced services, photos, or medical_team rows.
VP Health slug confirmed: vp-health-lethbridge (Lethbridge, AB).

## 1. Insight Naturopathic Clinic (insight-naturopathic-clinic-toronto)
- IV providers per site: team of "IV certified" NDs. Named NDs: Dr. Jill
  Shainhouse (owner; legal name Leslie Jill Shainhouse), Dr. Mark Fontes,
  Dr. Sonya Arrigo, plus 6 more. CORRECTION: earlier notes said "Tara"
  Shainhouse; the site says Jill.
- Operator lookups: CONO public register
  https://cono.alinityapp.com/client/publicdirectory (search Shainhouse,
  Fontes, Arrigo; confirm "Registered and practising" + Extended Services
  shows "Intravenous Infusion Therapy (IVIT)" and "Therapeutic Prescribing").
  Premises: https://cono.alinityapp.com/client/findcorporationdirectory
  (search "Insight", expect IVIT premises "Authorised").
- Risk notes: none surfaced; no discipline found in search.

## 2. Nature's Touch Naturopathic Clinic (natures-touch-naturopathic-clinic-brampton)
- IV provider per site: Dr. Maria Papasodaro, ND (sole ND). Site explicitly
  claims she "has passed her inspection" for IVIT, which maps to CONO's IVIT
  premises inspection. Self-reported, easy to corroborate.
- Operator lookups: CONO register (Papasodaro; IVIT + Therapeutic Prescribing)
  and IVIT premises register ("Nature's Touch").

## 3. Soma and Soul Wellness (soma-and-soul-wellness-toronto)
- IV providers per site: Dr. Mary Choi, ND (founder) and Dr. Charity Au, ND,
  both listed with "IV Therapy". No RN/NP/MD on the team page.
- Operator lookups: CONO register (Choi, Au; IVIT authorization) and IVIT
  premises register ("Soma and Soul"). If the premises is absent while they
  advertise vitamin drips, that is a follow-up question, not an accusation.

## 4. Purete Medical Spa (purete-medical-spa-etobicoke)
- Per site: medical director is "Yi S.", NP (oversees injectables, IV, and
  aesthetics). IV given by RNs Tatiana S. and Aman D. Site publishes first
  names + last initial only. NP-led: CNO (registry.cno.org) is the correct
  registry; CPSO does not apply (no MD named anywhere).
- Operator lookups: blocked on full names. Ask in the onboarding reply
  thread (they claimed 2026-06-10, a normal claim-holder request). Then CNO
  Find a Nurse: confirm NP = RN Extended Class, RNs = General Class, no
  terms/restrictions. CNO has no IV-specific authorization; the check is
  class + status + conduct.
- Risk notes: weakest evidence file of the six purely due to unpublished
  names.

## 5. The Lift Bar Medspa (the-lift-bar-medspa-nicholasville)
- Per site/chamber: owner Crystal Geis (non-clinical). IV structure: Amy,
  APRN (16 yrs, orders treatments; surname not published), RNs Ashley and
  Kiara administer. MD collaborator "Dr. Leslie" = Dr. Alicia
  Shirakbari-Leslie, MD (Danville KY, ER-trained, board-certified in
  Addiction Medicine per her own bio; the spa says "Emergency and Preventive
  Medicine", minor mismatch, flag not accuse).
- Kentucky context (confirmed from KBN): IV clinics are not a regulated
  facility type, but IV fluids require a lawful order (MD/PA/APRN) and a
  prior good-faith exam. Their APRN-orders / RN-administers model is the
  legally expected structure.
- Operator lookups: KBN license validation https://kbn.ky.gov for Amy
  (APRN), Ashley, Kiara (needs surnames; ask in reply thread or check
  @the_liftbar Instagram bios; nursys.com fallback). KBML physician search
  https://kbml.ky.gov for Shirakbari-Leslie.

## 6. VP Health (vp-health-lethbridge)
- Per site: Dr. Mariah Pilling, B.Sc., ND is the sole ND and the IV provider
  (IV therapy, injection therapies, iron infusions, chelation, ozone).
  Others on staff are acupuncture/physio, not IV.
- Operator lookups: CNDA public register
  https://cnda.alinityapp.com/client/publicdirectory (search Pilling;
  confirm active + expiry). IMPORTANT: Alberta NDs need specific CNDA
  authorization for restricted activities; IV therapy and especially
  CHELATION are restricted activities. Confirm she is authorized for
  IV/parenteral therapy and chelation; this is the clinic where the
  restricted-activity check matters most.

## How this feeds the queue
When the onboarding_requests table exists and replies come in, each clinic's
safety_evidence JSON gets: {q1_answer, q4_answer, registry_status (from the
operator lookups above), registry_urls, notes}. The /admin/onboarding row
then shows the assembled evidence next to the "Flip safety_verified" button.
Suggested rule of thumb: flip only when Q1 + Q4 are answered AND the registry
lookup confirms the named practitioners; that evidences 3 of the 5
sub-attestations (verifiedMedicalDirector, verifiedClinician,
verifiedCompoundingPharmacy). Liability insurance + regulator standing can be
attested at the Featured-upgrade stage.

Full agent research with all source URLs: see the registry research pass
dated 2026-06-12 (summary preserved here; sources include clinic team pages,
CONO/CNDA/KBN/KBML registry URLs, KBN-KBML joint statement on IV hydration
clinics).
