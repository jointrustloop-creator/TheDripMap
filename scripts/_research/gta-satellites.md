# GTA Satellites — IV Therapy Clinic Research

Research date: 2026-06-07
Researcher: Claude (Opus 4.7)
Source: web searches via Google + verification via WebSearch (WebFetch unavailable)

## Methodology / Dedup notes

- Existing list checked: `scripts/_ca-clinics-by-metro.json` → `gta_satellites` array (35 entries
  spanning Aurora, Brampton, Markham, Newmarket, North York, Richmond Hill,
  Whitchurch-Stouffville).
- Toronto-list dedup: cross-checked candidate **domains** against
  `scripts/gta-candidates-toronto-york.json` for any North York /
  Etobicoke / Scarborough finds.
- North York / Etobicoke / Scarborough fall within Toronto's borders, so any
  candidate there that *might* already exist as a "Toronto" entry in the
  full DB is flagged **MEDIUM** even if the website domain doesn't appear in
  the files I could open.
- Emails are listed only when literally appeared on the contact page in
  search-result text. Where no email was visible, the field reads
  `(not visible)`.
- WebFetch was not permitted during this research, so addresses/phones
  are sourced from the search-result text snippets. Treat phone numbers
  as best-effort; verify before outreach.

---

## Brampton

### 1. Fleur Aesthetics
- **City:** Brampton
- **Address:** 11755 Bramalea Rd, Unit 4, Brampton, ON (postal not visible)
- **Phone:** (not visible — bookings via janeapp)
- **Website:** https://www.fleuraesthetics.ca
- **Email:** (not visible)
- **Category:** Medical Aesthetics
- **Type:** In-Clinic
- **Specialties:** IV Vitamin Therapy, Botox, Dermal Fillers
- **Description:** Brampton (Bramalea) med-spa offering IV drip therapy
  administered by trained medical professionals. Active Jane app booking.
- **Source:** https://www.fleuraesthetics.ca/ivdrip ; https://fleur.janeapp.com/locations/fleur-aesthetics-bramalea-location/book
- **Confidence:** HIGH

### 2. Glamore Beauty Bar Skin & Laser Clinic
- **City:** Brampton
- **Address:** 16 Main St S, Brampton, ON L6W 2C3
- **Phone:** (647) 983-6269
- **Website:** https://www.glamorebeautybar.com
- **Email:** (not visible)
- **Category:** Medical Spa
- **Type:** In-Clinic
- **Specialties:** IV Vitamin Therapy, Hydrafacial, Microneedling,
  Purasomes, PRP, Injectables, Laser
- **Description:** Downtown Brampton luxury med-spa, regenerative aesthetics
  focus. 739 Birdeye reviews. Established / active.
- **Source:** https://reviews.birdeye.com/glamore-beauty-bar-169807105306051 ;
  https://www.glamorebeautybar.com
- **Confidence:** HIGH

### 3. Nature's Touch Naturopathic Clinic
- **City:** Brampton
- **Address:** 50 Sunny Meadow Blvd, Suite #304, Brampton, ON L6R 0Y7
- **Phone:** (905) 497-3200
- **Website:** https://www.naturestouchnd.ca
- **Email:** info@naturestouchnd.ca
- **Category:** Naturopathic Clinic
- **Type:** In-Clinic
- **Specialties:** IV Vitamin Therapy, B12 Injections, Naturopathic Medicine
- **Description:** Established Brampton naturopathic clinic with dedicated
  IV suite (3 IV treatments/hour). In-person IV/B12 therapy.
- **Source:** https://www.naturestouchnd.ca/contact/ ; medimap, ProfileCanada
- **Confidence:** HIGH

### 4. NewM Clinic — Brampton
- **City:** Brampton
- **Address:** Unit 2, 50 Sunny Meadow Blvd, Brampton, ON L6R 2Y5
- **Phone:** (647) 846-4611
- **Website:** https://newmclinic.com (Brampton sub-pages
  /ivc-brampton, /ivg-brampton, /ivm-brampton, /ivmy-brampton)
- **Email:** info@newmclinic.com
- **Category:** Medical Clinic / IV Lounge
- **Type:** In-Clinic + Mobile
- **Specialties:** Custom IV, Glutathione, Myers Cocktail, Multi-Vitamin,
  NAD+, mobile delivery
- **Description:** Brampton arm of the NewM chain (Newmarket location is
  already in DB). Full IV menu, mobile delivery within GTA. 59 Birdeye
  reviews on the Brampton location.
- **Note:** The NewM **Newmarket** location is already in our DB
  (`newm-clinic-newmarket`). Same brand/domain. Adding the Brampton
  location is reasonable since it's a separate physical clinic and the
  Newmarket entry only covers Newmarket. Confirm with the operator
  whether you want chain locations as separate listings.
- **Source:** https://newmclinic.com/ivc-brampton/ ;
  https://reviews.birdeye.com/newm-clinic-dermatology-and-iv-therapy-service-170713290289932
- **Confidence:** MEDIUM (chain already partially in DB)

### 5. Aesthefusion — Brampton
- **City:** Brampton
- **Address:** Brampton, ON L6P 2R2 (specific street not visible)
- **Phone:** (647) 243-7860 / (647) 505-2636
- **Website:** https://aesthefusion.com/locations/brampton
- **Email:** info@aesthefusion.com
- **Category:** Medical Aesthetics
- **Type:** In-Clinic
- **Specialties:** IV Infusion Therapy, Botox, Fillers, PRP, Microneedling
- **Description:** Brampton branch of doctor-led Aesthefusion. Markham
  location (`aesthefusion-markham`) is **already in our DB**, same domain.
  Listing the Brampton sister location is debatable.
- **Note:** Same brand/domain as existing `aesthefusion-markham`.
- **Source:** https://aesthefusion.com/locations/brampton ;
  https://aesthefusion.com/contact
- **Confidence:** LOW (likely duplicate chain — operator decision)

---

## Markham

### 6. Ketamind Health
- **City:** Markham
- **Address:** Markham, ON (near Hwy 7 / 407 / 404 — exact street not in
  search results)
- **Phone:** (416) 343-0074
- **Website:** https://ketamindhealth.ca
- **Email:** hello@ketamindhealth.ca
- **Category:** Infusion Clinic
- **Type:** In-Clinic
- **Specialties:** Glutathione IV, NAD+ IV, Myers Cocktail, IV Ketamine
  (mental health), supportive IV nutrition
- **Description:** Markham-based ketamine + IV clinic serving GTA. Offers
  Myers' Cocktail, NAD+, and glutathione alongside IV ketamine therapy.
- **Source:** https://ketamindhealth.ca/glutathione/ ;
  https://ketamindhealth.ca/contact-us/
- **Confidence:** HIGH

### 7. Centre for Advanced Medicine — Markham
- **City:** Markham
- **Address:** 12 Main Street N., Markham, ON L3P 1X2
- **Phone:** (905) 655-7100
- **Website:** https://advancedmedicine.ca/markham/
- **Email:** info@advancedmedicine.ca
- **Category:** Naturopathic / Integrative Medicine
- **Type:** In-Clinic (Infusion Lounge)
- **Specialties:** IV Drips, NAD+ IV Therapy, Iron Infusion, PRP, Naturopathic
  Medicine, Regenerative Medicine
- **Description:** Markham clinic with dedicated Infusion Lounge serving
  chronic-disease, immune-support, and longevity patients. Sister locations
  in Whitby/London.
- **Source:** https://advancedmedicine.ca/infusion-lounge/ ;
  https://advancedmedicine.ca/markham/
- **Confidence:** HIGH

### 8. Bayshore Infusion Clinic — Markham
- **City:** Markham
- **Address:** 7800 Kennedy Rd, Markham, ON
- **Phone:** (not visible — main Bayshore line)
- **Website:** https://www.bayshore.ca/locations/bayshore-infusion-clinic-markham-on/
- **Email:** (not visible)
- **Category:** Infusion Centre
- **Type:** In-Clinic
- **Specialties:** Iron infusion, biologics infusion, IV therapy
- **Description:** Bayshore is a national home health chain; the Markham
  infusion clinic mainly handles iron infusions, biologics, and prescribed
  IV therapies. Borderline for our directory — more like a clinical
  infusion centre than a wellness/IV clinic.
- **Note:** Filter risk — borderline "hospital-style infusion centre."
  May not fit the directory's wellness focus.
- **Source:** https://www.bayshore.ca/locations/bayshore-infusion-clinic-markham-on/
- **Confidence:** LOW (fit risk)

---

## Richmond Hill

### 9. Grand Genesis Plastic Surgery / Grand Genesis Health
- **City:** Richmond Hill
- **Address:** 9080 Yonge St, 2nd Floor (South Wing) Unit 12, Richmond
  Hill, ON L4C 0Y7
- **Phone:** (289) 597-7676 / (647) 238-7723
- **Website:** https://www.grandgenesisplasticsurgery.ca
  (also https://grandgenesishealth.com)
- **Email:** info@grandgenesisplasticsurgery.ca
- **Category:** Plastic Surgery / Multidisciplinary Health
- **Type:** In-Clinic
- **Specialties:** NAD+ IV Therapy, IV Infusion, Plastic Surgery
- **Description:** Self-described largest hospital-grade multidisciplinary
  plastic surgery centre in Ontario; offers NAD+ IV alongside surgical /
  aesthetic services.
- **Source:** https://www.grandgenesisplasticsurgery.ca/iv-infusion-in-richmondhill/ ;
  https://www.grandgenesisplasticsurgery.ca/contact-us/
- **Confidence:** HIGH

### 10. Meridian Spine + Sport
- **City:** Richmond Hill
- **Address:** 13321 Yonge Street, Unit 205, Richmond Hill, ON L4E 0K5
- **Phone:** (905) 773-5794
- **Website:** https://www.meridianspineandsport.ca
- **Email:** (not visible)
- **Category:** Multi-disciplinary / Naturopathic
- **Type:** In-Clinic
- **Specialties:** IV Therapy ($120-$160), Chiropractic, Physio, Massage,
  Naturopathic Medicine
- **Description:** Multi-disciplinary clinic in north Richmond Hill
  (Yonge & Elgin Mills). IV therapy delivered by naturopaths as part of
  complete treatment plans.
- **Source:** https://www.meridianspineandsport.ca/ivtherapy
- **Confidence:** HIGH

### 11. Dr. Gabriella Chow, ND (Richmond Hill Naturopath)
- **City:** Richmond Hill
- **Address:** 469 16th Avenue, Richmond Hill, ON L4C 7A7
- **Phone:** (905) 597-1331
- **Website:** http://www.richmondhillnaturopath.com
- **Email:** (not visible)
- **Category:** Naturopathic Clinic
- **Type:** In-Clinic
- **Specialties:** IV Therapy (from $180), parenteral therapy, naturopathic
  medicine, herbal medicine
- **Description:** Solo practice of Dr. Gabriella Chow, BSc, ND — 10+
  years of parenteral / IV experience, involved with CCNM's IV
  certification course. Strong CONO-style credentials.
- **Source:** http://www.richmondhillnaturopath.com/intravenous-therapy.html ;
  threebestrated, Sunlife Lumino
- **Confidence:** HIGH

---

## North York

> Reminder: North York is technically inside the City of Toronto. Many
> "Toronto" listings in the DB may already cover these clinics. Items
> below are flagged MEDIUM unless the address and brand are clearly North-
> York-coded and absent from the visible Toronto candidate file.

### 12. The Mom Loft
- **City:** North York
- **Address:** 20 De Boers Drive, Suite 420, North York, ON M3J 0H1
- **Phone:** (416) 649-6650 / 844-MOM-LOFT
- **Website:** https://themomloft.com
- **Email:** (not visible — contact form)
- **Category:** Maternal Wellness / Med Spa
- **Type:** In-Clinic
- **Specialties:** IV Vitamin Therapy, Myers Cocktail, hydration drips,
  postpartum support, laser skin, doula care
- **Description:** First-of-its-kind doctor-led maternal care centre in
  North York (Sheppard West / Allen area) with full IV menu. Active 2025
  press launch. NOT visible in `gta-candidates-toronto-york.json` —
  appears genuinely new to the DB.
- **Source:** https://themomloft.com/iv-drip-vitamin-therapy/ ;
  https://themomloft.com/contact-us/
- **Confidence:** HIGH

### 13. Royal Glow (by Meditism)
- **City:** North York
- **Address:** North York, ON (specific street not visible)
- **Phone:** (416) 222-1530
- **Website:** https://royalglowmed.ca
- **Email:** (not visible)
- **Category:** Medical IV / Wellness
- **Type:** In-Clinic
- **Specialties:** IV Vitamin Therapy, hydration, immunity, energy,
  physician-supervised
- **Description:** Physician-led IV Vitamin Therapy clinic, North York.
  Sister to Meditism brand.
- **Source:** https://royalglowmed.ca/iv-vitamin-therapy/
- **Confidence:** MEDIUM (could be already listed as "Toronto" — verify
  vs full DB by domain royalglowmed.ca)

### 14. The Art of Life Health Centre
- **City:** North York (Toronto)
- **Address:** 885 Don Mills Road, #121, North York, ON M3C 1V9
- **Phone:** (416) 449-6747
- **Website:** https://theartlife.ca
- **Email:** office@theartlife.ca
- **Category:** Naturopathic / Multidisciplinary
- **Type:** In-Clinic
- **Specialties:** IV Vitamin Therapy ($165), Naturopathy, Physiotherapy,
  Massage, Acupuncture, Osteopathy
- **Description:** Established North York multi-disciplinary clinic in
  Don Mills with active IV menu and direct billing.
- **Source:** https://theartlife.ca/iv-therapy/ ;
  https://theartlife.ca/contact-us/
- **Confidence:** MEDIUM (might already be in DB as "Toronto" — verify
  by domain theartlife.ca)

### 15. Motion Care Massage & Rehab
- **City:** North York (Yonge & Sheppard)
- **Address:** Yonge & Sheppard, North York, ON (exact street not visible)
- **Phone:** (647) 508-1888
- **Website:** https://www.motioncareclinic.com
- **Email:** (not visible)
- **Category:** Multi-disciplinary / Naturopathic
- **Type:** In-Clinic
- **Specialties:** IV Vitamin Drip, Chiropractic, Massage, Acupuncture,
  Physio, Osteopathy, Naturopathy
- **Description:** Multi-disciplinary clinic at Yonge & Sheppard offering
  naturopath-led IV Vitamin Drips.
- **Source:** https://www.motioncareclinic.com/naturopathy/iv-vitamin-drip/ ;
  https://www.motioncareclinic.com/contact/
- **Confidence:** MEDIUM (potential Toronto-DB overlap — verify by
  domain motioncareclinic.com)

### 16. Skinlab Medispa
- **City:** North York (Toronto)
- **Address:** 78 Finch Ave E, Unit b2, North York, ON
- **Phone:** (416) 226-9898
- **Website:** https://skinlabmedispa.com
- **Email:** info@skinlabmedispa.com
- **Category:** Medical Spa
- **Type:** In-Clinic
- **Specialties:** IV Vitamin Therapy, Injectables, Laser, Ultherapy,
  PicoSure
- **Description:** Injectable + laser clinic on Finch Ave E offering
  dedicated IV Vitamin Therapy service line.
- **Source:** https://skinlabmedispa.com/treatments/ivtherapy/ ;
  https://skinlabmedispa.com/contact/
- **Confidence:** MEDIUM (verify against Toronto DB by domain)

---

## Etobicoke

> Reminder: Etobicoke is inside Toronto. Flagged MEDIUM unless clearly
> Etobicoke-coded and absent from visible Toronto list.

### 17. Atheria Wellness
- **City:** Etobicoke (The Kingsway)
- **Address:** 3074 Bloor Street West, Etobicoke, ON
- **Phone:** (647) 619-4766
- **Website:** https://www.atheriawellness.com
- **Email:** (not visible — Janeapp booking)
- **Category:** IV Therapy / Iron Infusion Clinic
- **Type:** In-Clinic
- **Specialties:** IV Iron Infusion, IV Vitamin Therapy, IM Injections,
  pregnancy/postpartum iron
- **Description:** Etobicoke (Kingsway) clinic specialising in IV iron
  infusion and individualised IV vitamin/mineral regimens. Specifically
  serves pregnancy/postpartum iron-deficiency patients.
- **Source:** https://www.atheriawellness.com/contact ;
  https://thekingsway.ca/listing/atheria-wellness/
- **Confidence:** HIGH

### 18. Care Clinic on Albion
- **City:** Etobicoke
- **Address:** 1525 Albion Road, Unit 207, Etobicoke, ON M9V 5G5
- **Phone:** (647) 331-8343 / (416) 747-8344
- **Website:** https://carecliniconalbion.ca
- **Email:** info@carecliniconalbion.ca
- **Category:** Medical Walk-in Clinic / IV Nutrition
- **Type:** In-Clinic
- **Specialties:** IV Nutrition Therapy, Sclerotherapy, PRP, Microneedling,
  Botox, Filler
- **Description:** Walk-in medical clinic in Albion (NW Etobicoke) with
  IV Nutrition Therapy service line. Family-medicine-attached.
- **Source:** https://carecliniconalbion.ca/iv-nutrition-therapy/
- **Confidence:** HIGH

### 19. Foundation Health — Etobicoke Medical Clinic
- **City:** Etobicoke
- **Address:** 600 The East Mall, Etobicoke, ON
- **Phone:** 1-888-831-9116
- **Website:** https://foundationhealth.ca/iv-therapy/
- **Email:** (not visible)
- **Category:** Family Medical Clinic
- **Type:** In-Clinic
- **Specialties:** IV Therapy (hydration / vitamins / minerals),
  Family Medicine, Physiotherapy, OT, Women's Health, PrEP
- **Description:** Grand-opened Nov 2024. CPSO-certified family-doctor
  team adding IV therapy as a service. New growth target.
- **Source:** https://foundationhealth.ca/etobicoke-medical-clinic/ ;
  https://www.globenewswire.com/news-release/2024/11/26/2987576/0/en/Foundation-Health-Announces-the-Grand-Opening-of-Its-New-Family-Medical-Clinic-in-Etobicoke-ON.html
- **Confidence:** HIGH

### 20. Pureté Medical Spa
- **City:** Etobicoke (Lake Shore)
- **Address:** 2731 Lake Shore Boulevard West, Etobicoke, ON M8V 1G9
- **Phone:** (416) 887-5160
- **Website:** https://www.puretehealth.ca (also puretemedspa.ca)
- **Email:** (not visible — Janeapp)
- **Category:** Medical Spa
- **Type:** In-Clinic
- **Specialties:** IV Therapy, Hydration, Energy, Immunity, Botox, PRP,
  Potenza RF Microneedling
- **Description:** Lake Shore Blvd medical spa with dedicated Etobicoke
  IV menu (Pureté Signature Infusions).
- **Source:** https://www.puretehealth.ca/iv-therapy-etobicoke ;
  https://www.puretemedspa.ca
- **Confidence:** HIGH

### 21. Skin Studio Toronto
- **City:** Etobicoke
- **Address:** 170 N Queen St, Suite 19 (Unit K), Etobicoke, ON M9C 1A8
- **Phone:** (647) 227-6377
- **Website:** https://www.skinstudiotoronto.ca
- **Email:** (not visible)
- **Category:** Medical Spa
- **Type:** In-Clinic
- **Specialties:** IV Therapy, Laser Hair Removal, Skin Rejuvenation
- **Description:** Etobicoke (Queensway) medspa with custom IV blends for
  energy, immune, wellness.
- **Source:** https://www.skinstudiotoronto.ca/iv-therapy ;
  https://www.skinstudiotoronto.ca/etobicoke-ontario
- **Confidence:** HIGH

### 22. Visionary Health Medical Educational Clinic (VHMEC)
- **City:** Etobicoke
- **Address:** 5359 Dundas Street West, Unit 108, Etobicoke, ON M9B 1B1
- **Phone:** (647) 478-9029
- **Website:** https://www.vhmec.com
- **Email:** (not visible)
- **Category:** Naturopathic / Multidisciplinary Wellness
- **Type:** In-Clinic
- **Specialties:** IV Therapy (NP-administered), Naturopathic Medicine,
  Acupuncture, Osteopathy, Energy Work, Live Blood
- **Description:** Etobicoke (Kipling/Dundas) holistic wellness clinic
  with NP-administered IV therapy menu.
- **Source:** https://www.vhmec.com/intravenous-therapy-iv-therapy ;
  https://www.vhmec.com/faq-fees-contact-us
- **Confidence:** HIGH

### 23. The Borough Health & Wellness
- **City:** Etobicoke (Long Branch)
- **Address:** 408 Brown's Line, Suite 114, Etobicoke, ON M8W 0C3
- **Phone:** (not visible)
- **Website:** https://www.theborough.to
- **Email:** (not visible — Janeapp)
- **Category:** Wellness Clinic
- **Type:** In-Clinic
- **Specialties:** IV Therapy, Vitamin Drips (hydration / recovery /
  wellness)
- **Description:** Long Branch / South Etobicoke wellness clinic with
  IV menu. Active reviews on RateMDs.
- **Source:** https://www.theborough.to/iv-therapy ;
  https://www.theborough.to/contact
- **Confidence:** HIGH

### 24. Wellness Institute
- **City:** Etobicoke (Royal York)
- **Address:** 954 Royal York Road, Etobicoke, ON M8X 2E5
- **Phone:** (416) 234-1888
- **Website:** https://wellness-institute.ca
- **Email:** (not visible)
- **Category:** Naturopathic Clinic
- **Type:** In-Clinic
- **Specialties:** IV / Vitamin Injections, Naturopathic Medicine,
  Osteopathy, Clinical Nutrition
- **Description:** 30-year-old naturopathic clinic across from Royal
  York subway station. IV/IM injection therapy mentioned on directory
  listings (verify menu directly before outreach).
- **Note:** Search snippets indicate IV/vitamin injections but the
  website snippet didn't explicitly list IV therapy — confirm before
  classifying as IV-positive.
- **Source:** https://wellness-institute.ca/naturopathic-clinic-in-etobicoke/
- **Confidence:** MEDIUM (IV-positive needs direct confirmation)

### 25. Drip Club (Etobicoke)
- **City:** Etobicoke
- **Address:** Etobicoke (specific street not visible — in-clinic +
  mobile)
- **Phone:** (not visible)
- **Website:** https://dripclub.ca
- **Email:** (not visible)
- **Category:** IV Therapy Clinic / Mobile
- **Type:** In-Clinic + Mobile
- **Specialties:** Premium IV therapy & wellness injections, RN-
  administered, MD-supervised
- **Description:** Etobicoke-based premium IV brand, in-clinic + mobile
  (home/office/hotel) across GTA.
- **Source:** https://dripclub.ca
- **Confidence:** MEDIUM (address not visible in search snippets — confirm
  before listing)

---

## Scarborough

### 26. Scarborough Naturopathic Clinic
- **City:** Scarborough
- **Address:** 716 Gordon Baker Road, Suite 100, Scarborough, ON
  (Victoria Park / Steeles)
- **Phone:** (647) 287-1063
- **Website:** https://scarboroughnaturopathic.com
- **Email:** info@scarboroughnaturopathic.com
- **Category:** Naturopathic Clinic
- **Type:** In-Clinic
- **Specialties:** IV Vitamin Therapy, Vitamin C, B Vitamins, Minerals,
  Glutathione, Naturopathic Medicine
- **Description:** CONO-approved for IV therapy since 2018-10-17. Strong
  fit for Scarborough's thin coverage.
- **Source:** https://scarboroughnaturopathic.com/therapeutic-modalities/iv-therapy/ ;
  Facebook IV-launch post
- **Confidence:** HIGH

### 27. Silk Aesthetic Skin Clinic
- **City:** Scarborough
- **Address:** 1200 Markham Road, Suite 121, Scarborough, ON M1H 3C3
- **Phone:** (647) 514-7455
- **Website:** https://www.silkaestheticclinic.com
- **Email:** (not visible)
- **Category:** Skin Clinic / Med Spa
- **Type:** In-Clinic
- **Specialties:** IV Nutritional Drips, Hollywood Laser Peel, Laser
  Hair Removal, Carbon Peel
- **Description:** 4.9-star Filipino-owned skin clinic on Markham Rd
  with dedicated IV nutritional drips service line. 152 reviews.
- **Source:** https://www.silkaestheticclinic.com/iv-nutritional-drips ;
  https://reviews.birdeye.com/silk-aesthetic-skin-clinic-169825799196482
- **Confidence:** HIGH

### 28. NewM Clinic — Scarborough
- **City:** Scarborough
- **Address:** 2130 Lawrence Ave E, Suite 308, Scarborough, ON M1R 3A6
- **Phone:** (647) 846-4611 (chain line)
- **Website:** https://newmclinic.com (Scarborough sub-pages)
- **Email:** info@newmclinic.com
- **Category:** Medical Clinic / IV Lounge
- **Type:** In-Clinic + Mobile
- **Specialties:** Custom IV, Glutathione, Myers, NAD+, Multi-Vitamin
- **Description:** Scarborough arm of the NewM chain (Newmarket already
  in DB).
- **Note:** Same domain as `newm-clinic-newmarket` — operator decision
  whether to list chain locations separately. Genuinely fills the
  Scarborough IV gap.
- **Source:** https://newmclinic.com/ivc-scarborough/
- **Confidence:** MEDIUM (chain already partially in DB)

### 29. Dr. Shabnam Izadpanahi, ND
- **City:** Scarborough
- **Address:** 1920 Ellesmere Road, Unit 006, Scarborough, ON
- **Phone:** (647) 778-2755
- **Website:** (not consistently visible — verify; appears on directory listings)
- **Email:** (not visible)
- **Category:** Naturopathic Clinic
- **Type:** In-Clinic
- **Specialties:** Naturopathic Injection Therapy (B12 / IV cocktails)
- **Description:** Solo ND practice on Ellesmere offering naturopathic
  injection therapies. Smaller candidate — confirm IV (vs IM-only)
  before outreach.
- **Note:** Website not clearly identified — needs verification.
- **Source:** Search snippet referencing naturopathic injection therapy
  at 1920 Ellesmere Rd, Unit 006
- **Confidence:** LOW (low signal; website unverified)

---

## Aurora / Newmarket / Stouffville / Thornhill / Concord / Vaughan

### 30. Centre for Health & Performance (CHP)
- **City:** Vaughan (Concord — same postal cluster)
- **Address:** 2640 Rutherford Road, Suite 201, Vaughan, ON L4K 0H3
- **Phone:** (905) 553-4814
- **Website:** https://www.chperformance.ca
- **Email:** info@chperformance.ca
- **Category:** Multi-disciplinary / Naturopathic
- **Type:** In-Clinic
- **Specialties:** IV Nutrient Therapy, Naturopathy, Chiropractic,
  Physio, Massage, Acupuncture
- **Description:** Rutherford-corridor multi-disciplinary clinic with
  naturopath-led IV nutrient therapy.
- **Source:** https://www.chperformance.ca/services/iv-nutrient-therapy ;
  https://www.chperformance.ca/contact
- **Confidence:** HIGH

### 31. Venice Cosmetic Clinic
- **City:** Vaughan
- **Address:** 3530 Rutherford Road, Unit 77, Vaughan, ON L4H 3T8
- **Phone:** (647) 535-4990
- **Website:** https://venicecosmetic.com
- **Email:** (not visible)
- **Category:** Cosmetic Clinic / Med Spa
- **Type:** In-Clinic
- **Specialties:** IV Vitamin Therapy, Glutathione IV, Botox, Fillers, PRP
- **Description:** Custom IV drips by RNs in Vaughan. Established med spa.
- **Source:** https://venicecosmetic.com/iv-vitamin-therapy-vaughan/ ;
  Yelp listing
- **Confidence:** HIGH

### 32. Beautify Skin Clinic
- **City:** Concord / Vaughan
- **Address:** 1600 Steeles Avenue West, Unit 26, Concord, ON L4K 4M2
- **Phone:** (905) 788-8008
- **Website:** https://beautifygroup.com
- **Email:** (not visible)
- **Category:** Medical Spa
- **Type:** In-Clinic
- **Specialties:** IV Drip Treatments, Body Contouring, Injectables,
  Skin Treatments
- **Description:** Steeles/Vaughan med spa with personalized IV vitamin
  drips.
- **Source:** https://beautifygroup.com/iv-drip-treatments
- **Confidence:** HIGH

### 33. Signature Cosmetic Clinic Vaughan
- **City:** Vaughan (Maple)
- **Address:** 9306 Bathurst St, Bldg 1 Unit 3, Maple, ON L6A 4N9
- **Phone:** (not visible)
- **Website:** (Fresha-listed; no clear primary domain in snippet)
- **Email:** (not visible)
- **Category:** Cosmetic Clinic
- **Type:** In-Clinic
- **Specialties:** IV Drips, Picosure, Ultherapy, Coolsculpting
- **Description:** Maple cosmetic clinic listing IV drips. Note: similarly
  named "Signature Cosmetic Clinic" already in DB for Markham — verify
  these are different entities (different domain) before adding.
- **Note:** Brand-name overlap with existing
  `signature-cosmetic-clinic-markham` (signaturemedispa.com). Verify
  domain match before listing.
- **Source:** Fresha listing for Signature Cosmetic Clinic Vaughan
- **Confidence:** LOW (brand-name collision — verify)

---

## Mobile (HIGH PRIORITY)

### 34. Mobile IV Canada (mobileivcanada.com)
- **City:** Toronto / GTA (mobile)
- **Address:** Mobile service — Toronto + GTA
- **Phone:** (not visible — bookings via website)
- **Website:** https://mobileivcanada.com
- **Email:** (not visible)
- **Category:** Mobile IV Therapy
- **Type:** Mobile (RN-administered)
- **Specialties:** Hydration, Immune Boost, Hangover IV, Migraine, Jet Lag
- **Description:** RN-administered mobile IV across Toronto + GTA
  (Toronto, Oakville, Burlington, Hamilton, Barrie, Innisfil, Orangeville,
  Bowmanville, Oshawa).
- **Source:** https://mobileivcanada.com
- **Confidence:** HIGH

### 35. Mobile IV (mobileivcanada.ca)
- **City:** Toronto / GTA (mobile)
- **Address:** Mobile service — GTA
- **Phone:** (not visible)
- **Website:** https://mobileivcanada.ca
- **Email:** (not visible)
- **Category:** Mobile IV Therapy
- **Type:** Mobile
- **Specialties:** Hydration, Vitamin Drips, Wellness IV
- **Description:** Separate `.ca` Mobile IV brand. Possibly same operator
  as `.com` — verify before deduping.
- **Note:** Possible duplicate of #34 (same brand name, different TLD).
  Confirm before listing.
- **Source:** https://mobileivcanada.ca
- **Confidence:** LOW (possible duplicate of #34)

### 36. IV Drip Toronto (mobile)
- **City:** Toronto / GTA (mobile + in-clinic)
- **Address:** Beaudee Clinic, 1860 Queen Street East, Toronto ON M4L 1H1
- **Phone:** (289) 307-5216
- **Website:** https://ivdriptoronto.com
- **Email:** (not visible)
- **Category:** Mobile IV / IV Lounge
- **Type:** In-Clinic (Queen E, Toronto) + Mobile GTA-wide
- **Specialties:** IV Vitamin Drips, Hydration, RN-administered
- **Description:** Queen E (Leslieville) in-clinic + mobile service area
  covering Brampton, Mississauga, Markham, Richmond Hill, Etobicoke,
  Scarborough, Vaughan.
- **Note:** **Important** — the existing Toronto DB likely already has
  Rejuuv Medi Spa at `ivdriptoronto.ca` (Yorkville). Distinct domain:
  `ivdriptoronto.com` (Queen E) vs `ivdriptoronto.ca` (Rejuuv). Confirm
  it's not already listed.
- **Source:** https://ivdriptoronto.com/service-areas/ ;
  https://ivdriptoronto.com/contact-us/
- **Confidence:** MEDIUM (domain collision risk — verify Rejuuv vs this
  is different entity)

---

## Skipped / not included (and why)

- **Higher Health Naturopathic Centre & IV Lounge** — already in Toronto
  candidates file (3363 Yonge, higherhealthcentre.com).
- **Aesthefusion Markham** — already in DB.
- **GMA Clinic, METALAB, HealthyToDos, Markham Integrative Medicine,
  Silver Spruce, ID Cosmetic, BelleBeauté, Serene Cosmetic, Signature
  Cosmetic Markham** — already in DB.
- **igood Health, Golden Glow, Eclat Spa, Signature Beauty Lounge
  Richmond Hill** — already in DB.
- **Stouffville Natural Health Clinic, Springview, Seamless, Dr.
  Wrinkle Away, Healthspace Collective** — already in DB.
- **NHF / NewM / Newmarket Naturopathic / Vita Beauty** (Newmarket) —
  already in DB.
- **Aurora Rejuvenation, Beauty O'Clock, Canira, Summerview, Velmont**
  (Aurora) — already in DB.
- **Astra Medicare, Diamond Aesthetics, Heart Lake, Miracle Medical,
  Peel Weight Loss** (Brampton) — already in DB.
- **Gameday Men's Health North York** — already in DB.
- **Wellness Haus Toronto** (413 Spadina, midtown) — likely already in
  Toronto DB; not a North York/Etobicoke/Scarborough listing so out of
  scope for this batch.
- **Beauty Bar Medical Clinic, Bar Beauty Medical, VitalityMD,
  Rejuuv Medi Spa (ivdriptoronto.ca), Upper Room Clinic, Restorative
  Medicine** — Downtown Toronto / Yonge-Yorkville, almost certainly in
  DB already.
- **Drip Hydration Toronto** — corporate national chain that's likely
  already in DB; if not, it's a Toronto entity not a satellite.
- **Bayshore Markham (#8)** — kept but flagged LOW — it's more of a
  prescribed-infusion centre than a wellness directory fit.
- **DRIP - IV Nutrition & Aesthetics Clinic (mydripclinic.com)** —
  IL/USA-based (McHenry, IL). Not GTA. SKIPPED.
- **Synergistix (Brampton)** — naturopathic but no clear IV menu in
  search results. SKIPPED.
- **Nouveau Wellness (North York Yonge/Finch)** — multi-disc clinic;
  no clear IV menu surfaced. SKIPPED.
- **Emerald Skinlab (North York)** — IV listed in shop page, but
  address not confirmable from snippets. Borderline. SKIPPED for now.
- **D&R Aesthetics and Beauty (Vaughan)** — only mentions IV
  educational pages, not a clearly active IV menu. SKIPPED.
- **Perfection Cosmetic Clinic** — North York based; no street
  address surfaced. SKIPPED (verify if missing from DB).
- **VitalityMD "Scarborough"** — main location is downtown Toronto,
  Scarborough pages appear to be SEO landing pages, not a real
  Scarborough clinic. SKIPPED.

---

## Counts

- **Total candidates returned:** 36

- **HIGH confidence (20):**
  - Brampton (3): Fleur Aesthetics, Glamore Beauty Bar, Nature's Touch
  - Markham (2): Ketamind Health, Centre for Advanced Medicine
  - Richmond Hill (3): Grand Genesis, Meridian Spine + Sport,
    Dr. Gabriella Chow ND
  - North York (1): The Mom Loft
  - Etobicoke (7): Atheria Wellness, Care Clinic on Albion,
    Foundation Health, Pureté Medical Spa, Skin Studio Toronto,
    VHMEC, The Borough Health & Wellness
  - Scarborough (2): Scarborough Naturopathic, Silk Aesthetic
  - Vaughan/Concord (3): CHP, Venice Cosmetic, Beautify Skin
  - Mobile (1): Mobile IV Canada (.com)

- **MEDIUM confidence (9):**
  - NewM Brampton, NewM Scarborough (chain partial-overlap with DB
    Newmarket)
  - Royal Glow, The Art of Life, Motion Care, Skinlab Medispa
    (North York — possible Toronto-DB overlap)
  - Wellness Institute (Etobicoke — IV menu needs verification)
  - Drip Club (Etobicoke — address unverified)
  - IV Drip Toronto .com (potential vs Rejuuv .ca confusion)

- **LOW confidence (5):**
  - Aesthefusion Brampton (sister of existing Markham listing —
    operator call)
  - Bayshore Markham (fit risk — prescribed-infusion centre)
  - Dr. Shabnam Izadpanahi ND (low signal, no website confirmed)
  - Signature Cosmetic Vaughan (brand-name collision risk)
  - Mobile IV (.ca) (possible duplicate of Mobile IV Canada .com)

- **Mobile-capable (3 in mobile category + 2 hybrid in-clinic/mobile):**
  Mobile IV Canada .com (HIGH), IV Drip Toronto (MEDIUM),
  Mobile IV .ca (LOW) — plus NewM Brampton and NewM Scarborough offer
  mobile delivery alongside their in-clinic operation.

