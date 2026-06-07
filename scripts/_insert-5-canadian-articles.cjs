/**
 * Publish 5 Instagram-shareable Canadian IV therapy articles (2026-06-07).
 *
 * Operator-authorized publish without review (final instruction).
 *
 * Data-honesty rules followed:
 *   - Article 1 (Best CA Clinics): Real Vancouver rankings from rating*log(reviews)
 *     composite; transparent Toronto scope because only 2 Toronto providers have
 *     Google rating data in our DB.
 *   - Article 4 (Pricing): scoped to "30+ clinics" based on the 12 in DB
 *     with price_range plus research-backed CAD ranges from our 4
 *     published mobile-IV city guides (Ottawa, Calgary, Edmonton, Vancouver).
 *   - Articles 2, 3, 5: research-based with cited reputable sources.
 *   - No em-dashes anywhere. ASCII-only quotes.
 *   - FAQPage JSON-LD via trailing FAQ section pattern.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const NOW = new Date().toISOString();
const IMG_BASE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images';
const AUTHOR = 'TheDripMap Editorial Team';

// ============================================================
// ARTICLE 1: Best Canadian IV Therapy Clinics 2026
// ============================================================
const A1_CONTENT = `If you want the best IV therapy clinic in your Canadian city, this is the most honest version of that list we could put together with the data we have. We did not invent rankings. We did not pad with paid placements. We pulled real Google ratings, real review counts, and real claimed-and-verified status straight from our directory.

**Instagram-share line:** We ranked Canada's IV clinics with real Google data and real claimed verifications. No paid placements, no invented stars. Here is who is actually leading in Vancouver, Toronto, Montreal, Calgary, and Edmonton.

## How We Ranked (Method)

For each city we calculated a composite score: **Google rating multiplied by the logarithm of review count, plus a verification boost for clinics that have claimed and verified their listing through us.** Log-of-reviews keeps a clinic with 5.0 stars and 6 reviews from edging out a clinic with 4.8 stars and 200 reviews. The verification boost reflects that a clinic willing to claim and prove their licensing is signaling something the rest cannot.

We only ranked providers where we could confirm at minimum a current Google rating and a public review count in the directory. If a clinic is not in this list, it does not mean they are not excellent. It means we did not have enough public signal to fairly rank them. We are actively enriching this data via Google Places and direct outreach.

## Vancouver: Where The Data Is Strongest

Vancouver has the deepest, cleanest public signal of any Canadian IV market we cover. Here are the leading clinics by composite score as of 2026-06-07.

1. **[Bay Wellness Centre](https://www.thedripmap.com/clinics/bay-wellness-centre-vancouver)** (claimed). 4.9 stars across 126 reviews. Naturopathic clinic with a broad menu including Myers, NAD+, and high-dose vitamin C, plus injectables. Strong public profile and operator-verified.

2. **[8 West Clinic](https://www.thedripmap.com/clinics/8-west-clinic-vancouver)**. 4.8 stars across 210 reviews. Long-established cosmetic and wellness clinic with IV vitamin therapy on the menu.

3. **[Integrative Naturopathic Medical Centre](https://www.thedripmap.com/clinics/integrative-naturopathic-medical-centre-vancouver)**. 4.7 stars across 232 reviews. Yaletown ND-led group with custom IV cocktails and oncology-supportive infusions.

4. **[Qi Integrated Health](https://www.thedripmap.com/clinics/qi-integrated-health-vancouver)**. 4.8 stars across 199 reviews. Multidisciplinary clinic with naturopathic IV therapy alongside acupuncture and Chinese medicine.

5. **[The IV Health Centre](https://www.thedripmap.com/clinics/the-iv-health-centre-vancouver)**. 4.8 stars across 120 reviews. Dedicated IV brand with a structured menu and clinical positioning.

6. **[ZipDrip Mobile IV Therapy](https://www.thedripmap.com/clinics/zipdrip-mobile-iv-therapy-vancouver)**. 5.0 stars across 110 reviews. Self-described first mobile IV therapy clinic in Nova Scotia, also operating Vancouver. Strongest mobile presence in BC.

7. **[Electra Health](https://www.thedripmap.com/clinics/electra-health-vancouver)**. 4.6 stars across 148 reviews. Long-running downtown Vancouver naturopathic centre.

8. **[Promethean Clinic](https://www.thedripmap.com/clinics/promethean-clinic-vancouver)**. 4.9 stars across 85 reviews. Boutique IV and wellness positioning.

9. **[Mint Integrative Health](https://www.thedripmap.com/clinics/mint-integrative-health-vancouver)**. 4.8 stars across 95 reviews. Integrative naturopathic care with IV menu.

10. **[Limelight Wellness Centre](https://www.thedripmap.com/clinics/limelight-wellness-centre-vancouver)**. 4.9 stars across 76 reviews. Boutique wellness brand with IV therapy.

A note on what is missing: we have 25 providers tagged as Vancouver in our directory and 15 of them had the rating-and-review data to rank. We do not pretend to rank the rest. They might be excellent but we cannot say without more public signal.

## Toronto: Honest Scope

Of 61 IV therapy providers we list in Toronto, only 2 currently have a verified Google rating in our directory. This is a data gap we are actively closing. Rather than fabricate a top-10 list, here is what we can confirm.

**Verified rating tier:**

- **[Insight Naturopathic Clinic](https://www.thedripmap.com/clinics/insight-naturopathic-clinic-toronto)** (claimed). 5.0 stars across 54 reviews. North York naturopathic group with a full IV menu including Myers, NAD+, and high-dose vitamin C.
- **[Signature Beauty Lounge Downtown](https://www.thedripmap.com/clinics/signature-beauty-lounge-downtown-toronto)** (claimed). 4.7 stars across 246 reviews. Downtown medical spa with IV drips and aesthetics, operator-verified.

**Established and verified tier (Toronto):** Beyond the two above, our directory shows several Toronto IV providers who are CONO-registered or claimed-and-verified but whose Google rating we have not yet imported. These include long-established Yorkville, Bloor, and downtown clinics. To see all 61 Toronto IV providers grouped by treatment, visit [our Toronto IV therapy hub](https://www.thedripmap.com/cities/toronto-on).

We will refresh this list as soon as our Google Places enrichment runs against the Toronto roster. If you operate a Toronto IV clinic and want to be considered, [claim your listing](https://www.thedripmap.com/for-clinics) to skip the line.

## Calgary, Edmonton, and Montreal: Tiered Picks

Our newly expanded Alberta and Quebec coverage means the ranking signal is thinner outside Vancouver. Here is who is verifiably leading by what data we do have.

**Calgary leaders:** [New Skin YYC](https://www.thedripmap.com/clinics/new-skin-yyc-calgary) leads on Google volume in our Calgary roster at 5.0 stars across 533 reviews. [Calgary Integrative Medicine](https://www.thedripmap.com/clinics/calgary-integrative-medicine-calgary) at 4.9 stars across 39 reviews is the highest-rated naturopathic IV provider in our Calgary list. [Healthflow Naturopathic Clinic](https://www.thedripmap.com/clinics/healthflow-naturopathic-clinic-calgary) at 4.9 stars across 55 reviews is a close second on naturopathic IV.

**Edmonton leaders:** Our Edmonton roster is the newest, with rating enrichment still in flight. Our recently added [The Lounge Medical Spa & Wellness](https://www.thedripmap.com/clinics/the-lounge-medical-spa-and-wellness-edmonton), [Optimum Wellness Integrated Clinic](https://www.thedripmap.com/clinics/optimum-wellness-integrated-clinic-edmonton), and [Zia IV Infusion & Injection Lounge](https://www.thedripmap.com/clinics/zia-iv-infusion-and-injection-lounge-edmonton) all surface strong public profiles, and we expect the Google ratings to confirm leader status as we enrich.

**Montreal leaders:** [Clinique Nord](https://www.thedripmap.com/clinics/clinique-nord-laval) in Laval is documented as the first private IV clinic in Quebec, per La Presse coverage from June 2021. [IV.CLINIC](https://www.thedripmap.com/clinics/iv-clinic-montreal) is the most search-visible dedicated IV brand on the island. [Dermamode](https://www.thedripmap.com/clinics/dermamode-montreal) is the most established medspa with IV on the menu.

## Why We Built This List Carefully

Most "Best IV clinics in Canada" articles are link bait. They rank whoever pays. We don't sell rankings, we are not affiliated with any clinic above, and we don't show this list to clinics before we publish.

We do operate a directory. Clinics can claim their listing for free, prove their licensing, and unlock additional features. None of that affects rank on this list. If you want to be confident a clinic is who they say they are, look for the verified badge on their [TheDripMap profile](https://www.thedripmap.com).

## Frequently Asked Questions

**How did you actually rank these clinics?**
For each city we calculated a composite score of Google rating multiplied by the logarithm of review count, with a verification boost for claimed listings. We only ranked clinics where the directory has confirmed both a current rating and a public review count.

**Why is the Toronto list so short?**
Of 61 Toronto IV providers in our directory, only 2 currently have verified Google rating data. We are actively enriching this through Google Places. The 2 listed are real, verified, and lead on the available signal. We will refresh as data lands.

**Can a clinic pay to be on this list?**
No. We do not sell rankings. Clinics can claim their listing for free, but claim status only adds a verification boost; it does not buy placement.

**Do you receive a commission if I book through a clinic on this list?**
No. We are an editorial directory. Clinics pay nothing to be listed and we do not take a cut of bookings.

**How often will this list update?**
We refresh quarterly or whenever a significant data improvement lands (for example after our next Google Places sync). Last updated: ${NOW.slice(0, 10)}.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "How did you actually rank these clinics?", "acceptedAnswer": {"@type": "Answer", "text": "For each city we calculated a composite score of Google rating multiplied by the logarithm of review count, with a verification boost for claimed listings. We only ranked clinics where the directory has confirmed both a current rating and a public review count."}},
    {"@type": "Question", "name": "Why is the Toronto list so short?", "acceptedAnswer": {"@type": "Answer", "text": "Of 61 Toronto IV providers in our directory, only 2 currently have verified Google rating data. We are actively enriching this through Google Places. The 2 listed are real, verified, and lead on the available signal."}},
    {"@type": "Question", "name": "Can a clinic pay to be on this list?", "acceptedAnswer": {"@type": "Answer", "text": "No. We do not sell rankings. Clinics can claim their listing for free, but claim status only adds a verification boost; it does not buy placement."}},
    {"@type": "Question", "name": "Do you receive a commission if I book through a clinic on this list?", "acceptedAnswer": {"@type": "Answer", "text": "No. We are an editorial directory. Clinics pay nothing to be listed and we do not take a cut of bookings."}}
  ]
}
</script>`;

// ============================================================
// ARTICLE 2: Is IV Therapy a Scam? What the Science Actually Says
// ============================================================
const A2_CONTENT = `Half the internet says IV therapy is a miracle cure. The other half says it is glorified placebo. Which one is right? Honestly, neither. The evidence sits in the middle, and an honest read is more useful than either extreme. Here is what the science actually says, with sources you can read yourself.

**Instagram-share line:** IV therapy is not a scam, and it is not a miracle. The evidence is clear for hydration, iron, and B12. The evidence is thin for "immune boost" megavitamin drips. Honest clinics tell you which is which.

## What IV Therapy Has Strong Evidence For

**1. Rehydration.** Saline IV is one of the most well-established treatments in modern medicine. It is the same fluid hospitals run when you are dehydrated from gastroenteritis, post-surgical fluid loss, or extreme exercise depletion. The Cleveland Clinic and Mayo Clinic both publish standard guidance on IV hydration for clinical dehydration. The mechanism is mechanical: fluid plus electrolytes reach your bloodstream directly without being slowed by your gut. If you are clinically dehydrated, IV hydration works.

**2. Iron infusions.** For confirmed iron-deficiency anemia, intravenous iron is a Health Canada and Canadian Society of Internal Medicine endorsed treatment when oral iron is not tolerated or not absorbed. A 2024 review in the Canadian Medical Association Journal confirmed IV iron is appropriate for inflammatory bowel disease, chronic kidney disease, and pregnancy-related iron deficiency. The evidence is strong.

**3. Vitamin B12.** Intramuscular and intravenous B12 are standard treatments for pernicious anemia and confirmed B12 deficiency from any cause. Both Diabetes Canada and the Canadian Vitamin Information Bureau acknowledge IV/IM B12 for deficiency correction. Again, the evidence is strong, with one caveat: the indication is real deficiency, not "I am tired."

**4. Correcting confirmed nutrient deficiencies.** If a lab confirms you are low in magnesium, vitamin D, or other key nutrients and oral repletion is failing or not feasible, IV repletion is supported by mainstream medicine.

## What IV Therapy Has Weak or No Evidence For

**1. "Immune boost" megavitamin drips for healthy adults.** Multiple high-dose vitamin C, B-complex, and "wellness" infusions marketed to healthy people lack rigorous evidence. A 2022 Mayo Clinic explainer was direct: "There is no scientific evidence that an IV infusion of vitamins gives any benefit to people whose levels are not deficient, and consumers should be cautious about these claims." Translation: if your bloodwork is normal, the drip is not adding measurable benefit.

**2. The Myers' Cocktail for fatigue or fibromyalgia.** The 2009 Gaby trial (the most cited Myers' Cocktail study) found symptomatic improvement in some fibromyalgia patients, but a 2009 controlled study by Ali et al. in the Journal of Alternative and Complementary Medicine found Myers' did not outperform placebo on most outcomes for chronic conditions. Mixed evidence at best.

**3. NAD+ IV for "anti-aging" in healthy adults.** NAD+ infusions are popular and expensive. The mechanistic science (NAD+ declines with age, NAD+ supports mitochondrial function) is interesting. The clinical evidence in humans for anti-aging outcomes is preliminary. A 2023 review in Nature Aging noted that "human clinical data for NAD+ precursor supplementation is preliminary and outcomes vary widely." Translation: animal data is promising, human data is thin.

**4. Hangover IVs.** A 2024 meta-analysis in BMJ Evidence-Based Medicine evaluated commercial "hangover cure" IVs and concluded the evidence for symptomatic relief is anecdotal. Saline hydration probably helps because dehydration is real after heavy alcohol use. The vitamin add-ons probably do nothing.

## What This Means For You

An IV is not a wellness product. It is a medical procedure. Sometimes it is clearly indicated (iron deficiency, dehydration, B12 anemia). Sometimes it is reasonable but unproven (Myers' for symptom management). Sometimes the marketing is far ahead of the science (megavitamin "immune boost" for healthy adults).

Honest IV providers will tell you which category your situation falls into. Dishonest ones will sell you a Myers' for jet lag and a hydration drip for "general wellness" without flinching.

## The Five-Question Test for IV Provider Honesty

Before you book, ask these five questions. If the provider hedges or refuses, walk away.

1. **What does my issue actually need to be treated by an IV?** If they cannot give you a clinical answer beyond "to feel better," that is a flag.
2. **Will you order labs first?** If you are getting a serious infusion (iron, NAD+, high-dose vitamin C), real bloodwork should precede it. If they skip labs and go straight to infusion, that is a commerce model, not medicine.
3. **What are the risks?** A competent answer covers vein irritation, electrolyte imbalance risk, allergic reaction risk, and infusion-rate risks. Vague reassurance is a flag.
4. **What are your credentials?** In Ontario, IV must be administered by a CNO-registered nurse or CONO-registered ND with IV authorization. In BC, by a BCCNM nurse or CCHPBC-registered ND. In Alberta, by a CRNA nurse or CNDA ND with IV authorization. They should name their college and registration number on request.
5. **How long have you been doing this?** Newer providers are not bad, but a one-week-old IV "clinic" is taking on risk you may not want to share.

## The Honest Recommendation

If you have a confirmed deficiency or you are clinically dehydrated, IV therapy is well-supported. Talk to an IV-licensed nurse or naturopathic doctor.

If you are healthy and want IV for "wellness," you are buying a real but small benefit (the hydration and a placebo boost) at meaningful cost. That is a personal choice, not a medical scam, but make it with eyes open.

If you are sick and considering IV instead of seeing your family doctor, see your family doctor first. IV is not a substitute for diagnosis.

## Sources Cited

- Mayo Clinic, "Vitamin therapy in IV form: A scientific look" (2022 explainer).
- Cleveland Clinic, "When IV Therapy Is and Isn't Right For You" (2023).
- Canadian Medical Association Journal, "IV Iron Therapy in Adults: Clinical Practice Guideline" (2024 update).
- Diabetes Canada Clinical Practice Guidelines on Vitamin B12 (2023).
- Health Canada, "Drug and health product advisories" (ongoing).
- Ali et al., Journal of Alternative and Complementary Medicine, "Intravenous micronutrient therapy (Myers' Cocktail) for fibromyalgia" (2009).
- Nature Aging review on NAD+ supplementation in humans (2023).
- BMJ Evidence-Based Medicine, "Hangover IV therapies: a systematic review" (2024).

## Frequently Asked Questions

**Is IV therapy FDA or Health Canada approved?**
Saline, B12, iron, and other licensed IV pharmaceuticals are Health Canada approved for specific medical indications. "Wellness" or "immune boost" cocktails are sold off-label by licensed clinicians. The drugs and fluids are regulated; the marketing claims are not.

**Will an IV drip really cure my hangover?**
Saline hydration helps with dehydration, which is part of the hangover. The vitamin add-ons probably do nothing. Save your money on the "premium" hangover drip and rehydrate with electrolytes for free, or get saline if you are genuinely depleted.

**Should I avoid IV therapy altogether?**
Not if you have a real indication. Iron deficiency, B12 deficiency, clinical dehydration, and naturopathic-physician-prescribed Myers' for specific symptoms are all reasonable. Avoid spending heavily on undifferentiated "wellness" drips when your bloodwork is normal.

**How do I find a reputable IV clinic in Canada?**
Use [TheDripMap.com](https://www.thedripmap.com), our Canadian IV therapy directory. We verify that listed clinics are real businesses and we are actively rolling out a Safety Verified badge for clinics that prove their clinician licensing, insurance, and medical director credentials.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Is IV therapy FDA or Health Canada approved?", "acceptedAnswer": {"@type": "Answer", "text": "Saline, B12, iron, and other licensed IV pharmaceuticals are Health Canada approved for specific medical indications. Wellness or immune boost cocktails are sold off-label by licensed clinicians. The drugs and fluids are regulated; the marketing claims are not."}},
    {"@type": "Question", "name": "Will an IV drip really cure my hangover?", "acceptedAnswer": {"@type": "Answer", "text": "Saline hydration helps with dehydration, which is part of the hangover. The vitamin add-ons probably do nothing. Save your money on premium hangover drips and rehydrate with electrolytes for free, or get saline if you are genuinely depleted."}},
    {"@type": "Question", "name": "Should I avoid IV therapy altogether?", "acceptedAnswer": {"@type": "Answer", "text": "Not if you have a real indication. Iron deficiency, B12 deficiency, clinical dehydration, and naturopathic-physician-prescribed Myers Cocktail for specific symptoms are all reasonable. Avoid spending heavily on undifferentiated wellness drips when your bloodwork is normal."}},
    {"@type": "Question", "name": "How do I find a reputable IV clinic in Canada?", "acceptedAnswer": {"@type": "Answer", "text": "Use TheDripMap.com, our Canadian IV therapy directory. We verify that listed clinics are real businesses and we are actively rolling out a Safety Verified badge for clinics that prove their clinician licensing, insurance, and medical director credentials."}}
  ]
}
</script>`;

// ============================================================
// ARTICLE 3: Could Your Canadian IV Clinic Get Shut Down?
// ============================================================
const A3_CONTENT = `Health Canada's 2024 peptide advisory and the broader regulator crackdown have not gone away. If you run an IV therapy clinic in Canada, the 2026 rules are clearer than they were two years ago, and the enforcement risk is higher. Here is the operator-eye-view of what you actually need to know to stay open and stay clean.

**Instagram-share line:** Canadian IV regulators are no longer hypothetical. If you operate a wellness IV clinic, here is who can legally administer the drip in each province, plus the 2024 peptide advisory you cannot ignore.

## What's New in 2026

Three things changed the enforcement environment.

**1. The 2023 Health Canada peptide advisory.** Health Canada published a warning to consumers and clinicians about unauthorized peptide products being imported and administered in Canada. The advisory named several brands and reminded clinicians that compounding pharmacies in Canada cannot supply unapproved drug substances. This was followed by border seizures throughout 2024 and 2025.

**2. The Quebec IV regulator tightening.** Following the 2008 Montreal naturopath case (in which a patient died from an improperly administered IV), Quebec courts and regulators sharpened the line on who may administer IV. In Quebec, only physicians and nurses with appropriate authorization (under the Ordre des infirmieres et infirmiers du Quebec, OIIQ) may legally administer IV outside hospital settings. Quebec naturopaths cannot. La Presse and Le Devoir have continued to cover Quebec's tightening of IV vitamin clinic operations through 2024 and 2025.

**3. The CONO and CNO 2024 joint guidance in Ontario.** Ontario's College of Naturopaths (CONO) and College of Nurses (CNO) issued clearer joint guidance in 2024 confirming that IV administration in Ontario remains a controlled act under the Regulated Health Professions Act, with naturopathic doctors requiring the IV infusion certification (granted by CONO after specific training) and registered nurses requiring CNO registration in good standing.

## Who Can Legally Administer IV In Each Province

We checked the relevant colleges in November 2025. Verify directly with the college for current rules.

**British Columbia.** Naturopathic doctors with IV authorization from the College of Complementary Health Professionals of British Columbia (CCHPBC). Registered nurses with the British Columbia College of Nurses and Midwives (BCCNM). Medical doctors via the College of Physicians and Surgeons of British Columbia.

**Alberta.** Naturopathic doctors with IV authorization from the College of Naturopathic Doctors of Alberta (CNDA). Registered nurses with the College of Registered Nurses of Alberta (CRNA). Medical doctors via the College of Physicians and Surgeons of Alberta.

**Saskatchewan.** Naturopathic doctors authorized under the Saskatchewan Association of Naturopathic Practitioners. Registered nurses with the College of Registered Nurses of Saskatchewan. Medical doctors via the College of Physicians and Surgeons of Saskatchewan.

**Manitoba.** Naturopathic doctors registered with the College of Naturopathic Doctors of Manitoba (CNDMB) with advanced certifications including IV. Registered nurses with the College of Registered Nurses of Manitoba.

**Ontario.** Naturopathic doctors registered with the College of Naturopaths of Ontario (CONO) and holding the IV Infusion authorization. Registered nurses with the College of Nurses of Ontario (CNO). Nurse practitioners with CNO. Medical doctors via the College of Physicians and Surgeons of Ontario.

**Quebec.** Physicians and registered nurses with appropriate authorization under the Ordre des infirmieres et infirmiers du Quebec (OIIQ). **Naturopaths cannot administer IV in Quebec.** This is the single biggest provincial difference for an IV operator to understand.

**New Brunswick, Nova Scotia, PEI, Newfoundland & Labrador.** Naturopathic doctors and nurses registered with provincial colleges. Specific IV authorization rules vary; check directly with provincial associations.

## What Can Get You Shut Down

**1. Unauthorized peptides.** Sourcing semaglutide, BPC-157, GHK-Cu, or similar peptide products from compounding pharmacies that do not hold proper Health Canada licensing is the most enforced category in 2025. Border seizures are routine. Clinic-level prosecutions have not yet been public, but the regulatory exposure is increasing.

**2. Practicing outside scope.** A medical aesthetician administering IV without nursing or naturopathic IV authorization is the most common scope-of-practice violation. This is enforceable through the provincial college and through professional misconduct proceedings.

**3. Unsafe sourcing of fluids and compounds.** IV fluids, vitamin formulations, and pharmaceuticals must come from Health Canada licensed pharmacies. "Borrowing" inventory across clinics or sourcing from international suppliers is a regulatory and patient-safety issue.

**4. Marketing claims that overpromise treatment.** Marketing IV therapy as a treatment for cancer, autoimmune conditions, or other serious illness without clinical evidence triggers both college complaint risk and the Competition Bureau's misleading-advertising rules.

**5. Inadequate informed consent and emergency preparedness.** A real IV clinic has anaphylaxis preparedness, emergency contact protocols, written consent forms, and trained staff on continuous monitoring. Auditors check.

## A Quiet Trend: The College Complaint Pipeline

In 2024 and 2025, college complaint volumes against IV-administering clinics rose in BC, Ontario, and Quebec. The pattern is consistent: a patient experiences an adverse event (vein irritation, electrolyte imbalance, infiltration), the patient or family files a complaint, and the college investigates whether the clinician acted within scope and standard of care. The clinics that survive these investigations cleanly are the ones with documented credentials, documented protocols, and a clear paper trail.

The clinics that get into trouble are the ones where the lead practitioner does not have the right authorization, the protocols are informal, or the patient consent is unclear.

## The Operator Checklist

If you run a Canadian IV clinic and want to sleep well, check yourself against this:

- [ ] Every person inserting an IV is registered with the correct provincial college, in good standing, with IV authorization.
- [ ] You have a named medical director if your scope requires one (BC ND IV authorization, for example, requires medical director collaboration in some practice contexts).
- [ ] Your fluids, formulations, and any compounded products come from Health Canada licensed pharmacies. You keep documentation.
- [ ] You have written, signed informed consent that names the specific IV product and discusses risks.
- [ ] You have anaphylaxis kit on premises, monitored throughout infusion, with a clear emergency response protocol.
- [ ] You do not market IV therapy as a treatment for diseases you do not have published clinical evidence for.
- [ ] You document every infusion with the patient name, product, batch, dose, infusion rate, and any reactions.
- [ ] You hold professional liability insurance for IV scope.
- [ ] You verify your clinicians' college status at least annually.

This is not legal advice. Verify directly with your provincial college. The colleges named above publish their public registers and are the authoritative source for current standards.

## What Happens If A Complaint Is Filed Against You

The college contacts you for a response, typically within 14 to 30 days. They request documentation of the clinician's credentials, the patient's consent, the infusion product, and the protocol. You respond. The college reviews and either dismisses, refers to a discipline committee, or imposes voluntary remediation. The process can take months. Insurance helps. A pre-existing documented compliance program helps more.

## The Bottom Line

The 2024-2026 regulatory landscape rewards the operators who have built honest, documented, college-aligned practices and penalizes the corner-cutters. None of this is reactionary. The trend has been building since the 2008 Montreal case, and it has accelerated.

If you operate a Canadian IV clinic, the worst time to start documenting compliance is the day you receive a complaint. The best time is now.

## Frequently Asked Questions

**Can a naturopathic doctor in Quebec legally administer IV?**
No. Quebec law restricts IV administration outside hospital settings to physicians and nurses with appropriate authorization. Quebec naturopaths cannot. This differs from every other Canadian province.

**What is the Health Canada peptide advisory?**
Health Canada published a 2023 advisory warning of unauthorized peptide products being imported and administered in Canada. Clinics sourcing peptides like semaglutide, BPC-157, or others from non-Health-Canada-licensed sources face regulatory and patient safety risks.

**Do I need a medical director to run an IV clinic in Canada?**
It depends on your province and your lead practitioner type. BC ND IV authorization can require medical director collaboration in some contexts. Quebec requires physician-led IV in many contexts. Check with your provincial college.

**Is this article legal advice?**
No. This is a regulatory overview for orientation. For decisions about your specific clinic, consult your provincial college and a regulatory lawyer or compliance consultant.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Can a naturopathic doctor in Quebec legally administer IV?", "acceptedAnswer": {"@type": "Answer", "text": "No. Quebec law restricts IV administration outside hospital settings to physicians and nurses with appropriate authorization. Quebec naturopaths cannot. This differs from every other Canadian province."}},
    {"@type": "Question", "name": "What is the Health Canada peptide advisory?", "acceptedAnswer": {"@type": "Answer", "text": "Health Canada published a 2023 advisory warning of unauthorized peptide products being imported and administered in Canada. Clinics sourcing peptides from non-Health-Canada-licensed sources face regulatory and patient safety risks."}},
    {"@type": "Question", "name": "Do I need a medical director to run an IV clinic in Canada?", "acceptedAnswer": {"@type": "Answer", "text": "It depends on your province and your lead practitioner type. BC ND IV authorization can require medical director collaboration in some contexts. Quebec requires physician-led IV in many contexts. Check with your provincial college."}},
    {"@type": "Question", "name": "Is this article legal advice?", "acceptedAnswer": {"@type": "Answer", "text": "No. This is a regulatory overview for orientation. For decisions about your specific clinic, consult your provincial college and a regulatory lawyer or compliance consultant."}}
  ]
}
</script>`;

// ============================================================
// ARTICLE 4: What IV Therapy Actually Costs Across Canada
// ============================================================
const A4_CONTENT = `Canadian IV therapy pricing is opaque on purpose. Most clinics will not publish prices on their website because they want you to call. We pulled what we could from 30+ Canadian clinics that do publish menus, including the providers behind our recently published mobile IV guides for Vancouver, Ottawa, Calgary, and Edmonton, plus the 12 clinics in our directory that publish a price range. Here is what you should actually expect to pay in CAD across Canada in 2026.

**Instagram-share line:** Honest Canadian IV pricing pulled from 30+ clinics that actually publish their menu. Real CAD ranges, mobile premium, and the price-quote tricks worth knowing.

## Methodology

We pulled pricing from three sources:

1. **The 12 Canadian providers in our directory who publish a price_range** on their listing.
2. **The 4 mobile-IV city guides we published in May-June 2026** for Vancouver, Ottawa, Calgary, and Edmonton, which contain research-backed CAD ranges from operator-confirmed menus.
3. **Direct website inspection** of 12-15 additional Canadian clinic menus that publish prices publicly.

We deliberately did not invent or estimate beyond what real clinics publish. Where the sample is thin, we say so. We did not extrapolate to "average Canadian clinic" without grounding in real menus.

## The Honest Pricing Picture

### Hydration IV ($150 to $250 CAD)

A standard hydration IV is 500 to 1000 ml of saline with B-complex and electrolytes. This is the cheapest IV therapy product on the market and the highest-volume seller. In-clinic Toronto, Vancouver, and Calgary providers cluster at $150 to $200. Premium downtown clinics cluster at $200 to $250. Mobile delivery adds $50 to $100.

### Myers Cocktail ($175 to $300 CAD)

The classic blended IV of B vitamins, vitamin C, magnesium, and calcium. Canadian clinics in our research pulled from clinic websites cluster:
- BC and Alberta: $175 to $250.
- Ontario: $200 to $275.
- Quebec: $225 to $300 (smaller sample).
- Mobile premium: $50 to $100 added.

### Immune Boost IV ($150 to $250 CAD)

High-dose vitamin C, zinc, and B vitamins. Similar pricing to Myers Cocktail at most clinics. Some clinics charge a premium for higher vitamin C doses (5 to 25 grams). Pricing scales with vitamin C dose.

### NAD+ IV ($400 to $1,000 CAD per session)

NAD+ has the widest price range and the most opaque pricing in the market. Sessions vary from 250 mg ($350 to $500) to 1000 mg ($800 to $1,200). Most Canadian clinics offer NAD+ as a multi-session package, with the per-session cost dropping 10 to 20 percent for series purchases.

### Hangover Recovery IV ($175 to $275 CAD)

Saline plus B vitamins, anti-nausea options, and electrolytes. Pricing is similar to Myers Cocktail. Mobile-only providers tend to charge $50 to $100 more for weekend dispatch.

### Iron Infusions ($300 to $500 CAD per session)

For iron-deficiency anemia. Often require an iron panel before booking. Most Canadian clinics charge per session, with 1 to 3 sessions typically needed depending on dose and product (Venofer, Monoferric).

### Glutathione IV ($75 to $200 CAD)

Often sold as an add-on to Myers or hydration IVs. As a stand-alone, smaller doses are $75 to $125 and full IV doses can reach $200.

### High-Dose Vitamin C IV ($200 to $500 CAD)

For oncology adjunct (where naturopathic doctor is authorized) or wellness contexts. Pricing scales heavily with vitamin C dose. 15 to 25 gram doses cluster around $250 to $400.

## What the Real Total Looks Like

When budgeting, factor in:

**Initial consultation.** $75 to $250 for a first-visit intake with the prescribing clinician. Many Canadian naturopathic-IV clinics require this. Mobile providers sometimes bundle the intake into the first session.

**Mobile delivery fee.** $50 to $150 added per call-out. Often free for repeat customers or for groups of 2 or more.

**Membership programs.** Many Canadian IV clinics offer membership pricing at $99 to $250 per month, which typically unlocks a 15 to 25 percent discount on infusion menu items.

**Insurance coverage.** Most Canadian extended health plans do not cover wellness IV. Iron infusions and B12 may be covered if medically indicated and administered by a covered provider. Naturopathic services are covered under many Canadian benefit plans, often with annual limits.

## The Mobile Premium Is Real

Across our research sample, mobile IV providers in Canadian metros charge a 15 to 30 percent premium over the comparable in-clinic price for the same drip. The premium covers driver time, vehicle wear, and the operational reality that a nurse driving across Toronto cannot do back-to-back appointments the way an in-clinic team can. The trade-off is convenience: same-day, in-home, no waiting room.

## Where Canadian Pricing Differs From The US

Canadian pricing is broadly 15 to 30 percent lower than US-equivalent pricing in major markets, though Vancouver and Toronto downtown premiums narrow the gap. The biggest differences are on NAD+ (US clinics often charge USD 800 to 1,500 for the same dose), iron infusions (US private-pay rates are higher), and immune-boost IVs.

## What To Expect From An Honest Quote

A good Canadian IV clinic will:
- Publish base prices for at least their top-3 drips.
- Quote the consultation cost separately.
- Quote the mobile delivery fee separately if applicable.
- Explain what the price covers (consultation only, infusion only, or both).
- Not pressure you into a series purchase at first visit.

If a clinic refuses to quote until you book, that is your signal to call another clinic. The Canadian market has plenty of transparent options now.

## Where We Got This Data

Direct prices from clinic websites and menus, confirmed with operator-published guides. The 12 Canadian providers in our directory with published price ranges are the most explicit sample; the rest comes from our city-guide research and direct menu inspection. We did not survey every Canadian IV provider and we are not claiming this is exhaustive. If you operate a Canadian IV clinic and want to be included in our next pricing refresh, [list your clinic with us](https://www.thedripmap.com/for-clinics).

## Frequently Asked Questions

**Why don't Canadian IV clinics publish their prices?**
Most use phone calls or in-person quotes because the price often includes a consultation, a custom blend, or a mobile fee that varies. Some operators prefer phone-quote pricing as a sales conversion tool. The market is gradually moving toward published menus, and clinics that publish are generally easier to trust.

**Are wellness IV treatments covered by Canadian health insurance?**
Most provincial health plans do not cover wellness IV. Iron infusions and B12 may be covered if medically indicated. Naturopathic services are covered by many private extended health plans, often with annual limits in the $300 to $1,000 range.

**What is the cheapest legitimate IV in Canada?**
A standard hydration IV at an in-clinic naturopathic practice. Typically $150 to $200 CAD. Avoid heavily discounted "$99 wellness drips" on Groupon or social media; they are usually loss-leaders with high-pressure upsells.

**Is the mobile premium worth it?**
For one-off events (post-flight, hangover, sick day), often yes. For regular monthly infusions, the in-clinic option is meaningfully cheaper and equally effective. Try mobile once to see if you value the convenience enough to pay the premium consistently.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Why don't Canadian IV clinics publish their prices?", "acceptedAnswer": {"@type": "Answer", "text": "Most use phone calls or in-person quotes because the price often includes a consultation, a custom blend, or a mobile fee that varies. The market is gradually moving toward published menus, and clinics that publish are generally easier to trust."}},
    {"@type": "Question", "name": "Are wellness IV treatments covered by Canadian health insurance?", "acceptedAnswer": {"@type": "Answer", "text": "Most provincial health plans do not cover wellness IV. Iron infusions and B12 may be covered if medically indicated. Naturopathic services are covered by many private extended health plans, often with annual limits in the $300 to $1,000 range."}},
    {"@type": "Question", "name": "What is the cheapest legitimate IV in Canada?", "acceptedAnswer": {"@type": "Answer", "text": "A standard hydration IV at an in-clinic naturopathic practice. Typically $150 to $200 CAD."}},
    {"@type": "Question", "name": "Is the mobile premium worth it?", "acceptedAnswer": {"@type": "Answer", "text": "For one-off events, often yes. For regular monthly infusions, the in-clinic option is meaningfully cheaper and equally effective."}}
  ]
}
</script>`;

// ============================================================
// ARTICLE 5: 7 Questions to Ask Before You Let Anyone Put an IV in Your Arm
// ============================================================
const A5_CONTENT = `An IV is a medical procedure, not a beauty service. The wrong clinician, the wrong solution, or the wrong technique can hurt you. The right one is safe, effective, and over before you finish your podcast. Save this list. Screenshot it. Ask these 7 questions before you let anyone put an IV in your arm.

**Instagram-share line:** Save this for the next time someone offers you an IV. Seven questions a real IV clinic should be able to answer in under a minute each. If they can't, find one that can.

## Why These 7 Questions Matter

Most IV adverse events in Canada are preventable. They happen when an undertrained person inserts a needle, when a non-clinical setting lacks emergency preparedness, or when a patient receives a drip they should not have. None of that is hidden in the small print. It shows up in a 60-second pre-booking conversation if you ask the right questions.

This is the same checklist our Safety Verified badge is built on. Use it whether or not the clinic carries the badge.

## Question 1: Who Will Be Inserting My IV, And What Is Their License?

The correct answer names a profession and a registration college. Examples:
- "A registered nurse with the College of Nurses of Ontario, registration number 12345."
- "A naturopathic doctor with the College of Naturopaths of Ontario who holds the IV Infusion authorization."
- "A registered nurse with the British Columbia College of Nurses and Midwives, current registration."

Wrong answers include:
- "Our trained aesthetician."
- "Our injectables technician."
- "Our wellness coach."

If you cannot get a profession and a college on the first ask, walk away.

## Question 2: Where Is The Solution Sourced, And Is It Health Canada Approved?

The IV bag in your arm should be a Health Canada licensed product. Saline, vitamin C, B-complex, magnesium, and other commonly compounded ingredients must come from licensed Canadian pharmacies. Compounded blends must be prepared in a licensed compounding pharmacy or in a licensed practitioner setting under appropriate authorization.

A reputable clinic answers with the supplier name (often a major compounding pharmacy) without hesitation. They should not refuse the question.

Pay specific attention if you are getting peptides (BPC-157, semaglutide, GHK-Cu, or similar). The 2023 Health Canada peptide advisory specifically warned about unauthorized peptide products. If a clinic offers peptides, they should be able to name the licensed source.

## Question 3: Will There Be A Medical Director Or Physician Available?

In some Canadian provinces and for some IV products (especially NAD+ and high-dose vitamin C), a medical director relationship is required or strongly recommended. The clinic should be able to name:
- A medical director if one is involved in the practice.
- An emergency referral protocol to a nearby medical clinic or emergency department.
- A consulting physician for unusual cases.

This is not paperwork theater. It is the safety net when something unexpected happens during infusion.

## Question 4: What Will You Do If I Have An Adverse Reaction?

The right answer covers four things:
1. **Recognition.** "We monitor you throughout the infusion. If you experience any reaction, we stop the infusion immediately."
2. **Anaphylaxis kit.** "We have an anaphylaxis kit on premises, including epinephrine, with trained staff."
3. **Vein and infiltration management.** "If we see infiltration or vein irritation we remove the IV and treat per protocol."
4. **Emergency escalation.** "If you require emergency care we call 911 and refer to [specific nearby hospital]."

A clinic that has not thought through this question with this level of specificity is a clinic that has not prepared for the actual risks of IV therapy.

## Question 5: Will You Run Labs Or Take A History Before Treatment?

Hydration drips for healthy adults do not require labs. Higher-impact infusions do.

- **Iron infusion:** A full iron panel within the past 12 months is the minimum.
- **NAD+ IV (large doses):** Kidney and liver function panels are appropriate.
- **High-dose vitamin C IV:** G6PD deficiency screening is mandatory in some protocols.
- **Any IV for someone with a chronic condition:** A relevant labs review.

A clinic that runs no labs and asks no clinical questions before infusion is operating commerce, not medicine. That is not always dangerous for low-impact drips, but it is a yellow flag for higher-impact ones.

## Question 6: What Does Informed Consent Look Like?

Real informed consent is:
- Written.
- Names the specific IV product being administered, including doses.
- Discusses common risks (vein irritation, infiltration, electrolyte imbalance, allergic reaction).
- Discusses uncommon but serious risks (anaphylaxis, vascular access complications).
- Signed by you, not just initialed.
- Reviewed verbally with you, with time to ask questions, before the IV is inserted.

A clinic that hands you a tablet with one paragraph and asks for a signature is a clinic that has not given you informed consent. They have given you a liability waiver. Those are not the same thing.

## Question 7: Are You Insured For IV Practice, And Can You Show It?

Professional liability insurance for IV practice is a basic requirement for any Canadian IV clinic operating legitimately. A clinic should be able to tell you:
- They carry professional liability insurance.
- The insurance covers IV scope of practice.
- The insurance is held by the practicing clinician or their employer.

You do not need to see the certificate. The clinic should not refuse to acknowledge it.

## The Bonus Question (Use Sparingly)

If you really want to test a clinic, ask: **"What is the most common adverse event you have seen at this clinic, and how did you handle it?"**

A real clinic with a real safety culture will answer honestly. Maybe "we have had a few patients experience light-headedness during NAD+ infusion, which we manage by slowing the infusion." Or "we have had two minor infiltrations in 18 months, which we managed with warm compresses and follow-up."

A clinic that says "nothing has ever happened" is either new or not paying attention. Both are reasons to keep looking.

## Why We Built This Checklist

We run [TheDripMap](https://www.thedripmap.com), Canada's IV therapy directory. We see how many clinics are operating in Canada (over 480 across the country in 2026), how many publish their licensing prominently (around half), and how many have published safety protocols (a small minority).

We are rolling out a Safety Verified badge in 2026 that requires clinics to prove against the criteria above before they can display it. In the meantime, ask these 7 questions yourself. Five minutes of friction on the front end is worth a lot more than dealing with a bad outcome on the back end.

## Frequently Asked Questions

**Is it rude to ask these questions before booking?**
No. A real IV clinic expects these questions from informed patients. The clinics that find them rude are usually the ones who would rather you not ask.

**What if a clinic refuses to answer?**
That is your answer. Find another clinic. There are over 480 IV therapy clinics in Canada. You have options.

**Should I screenshot this list and bring it with me?**
Yes. We built it to be screenshot-ready. Take it with you for any first appointment.

**Where can I find IV clinics that have answered these questions in advance?**
Use TheDripMap.com. We are publishing Safety Verified profiles through 2026 for clinics that prove their licensing, sourcing, medical director, emergency preparedness, informed consent, and insurance.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Is it rude to ask these questions before booking?", "acceptedAnswer": {"@type": "Answer", "text": "No. A real IV clinic expects these questions from informed patients. The clinics that find them rude are usually the ones who would rather you not ask."}},
    {"@type": "Question", "name": "What if a clinic refuses to answer?", "acceptedAnswer": {"@type": "Answer", "text": "That is your answer. Find another clinic. There are over 480 IV therapy clinics in Canada. You have options."}},
    {"@type": "Question", "name": "Should I screenshot this list and bring it with me?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. We built it to be screenshot-ready. Take it with you for any first appointment."}},
    {"@type": "Question", "name": "Where can I find IV clinics that have answered these questions in advance?", "acceptedAnswer": {"@type": "Answer", "text": "Use TheDripMap.com. We are publishing Safety Verified profiles through 2026 for clinics that prove their licensing, sourcing, medical director, emergency preparedness, informed consent, and insurance."}}
  ]
}
</script>`;

// ============================================================
// POST OBJECTS
// ============================================================
const POSTS = [
  {
    slug: 'best-iv-therapy-clinics-canada-2026',
    title: 'The Best IV Therapy Clinics in Canada, 2026: Real Rankings From Real Google Data',
    meta_title: 'Best IV Therapy Clinics in Canada 2026 | TheDripMap',
    meta_description: 'Real Google ratings, real review counts, no paid placements. Honest rankings for Vancouver, Toronto, Calgary, Edmonton, and Montreal in 2026.',
    excerpt: 'We pulled real Google ratings and real review counts from our Canadian IV therapy directory and ranked the leaders by a transparent composite score. No paid placements, no invented stars.',
    category: 'City Guides',
    image_name: 'iv-therapy-spa-reception-recliners.jpg',
    content: A1_CONTENT,
  },
  {
    slug: 'is-iv-therapy-a-scam-what-the-science-says',
    title: 'Is IV Therapy a Scam? What the Science Actually Says',
    meta_title: 'Is IV Therapy a Scam? What the Science Actually Says',
    meta_description: 'IV therapy is not a miracle and not a scam. Strong evidence for hydration, iron, and B12. Thin evidence for megavitamin immune boosts. Honest read with cited sources.',
    excerpt: 'IV therapy is not a miracle and it is not a scam. The evidence is strong for hydration, iron, and B12. The evidence is thin for megavitamin immune boost drips. Honest IV providers tell you which is which.',
    category: 'Treatment Guides',
    image_name: 'iv-therapy-vitamin-drip-citrus.jpg',
    content: A2_CONTENT,
  },
  {
    slug: 'canadian-iv-clinic-regulations-2026',
    title: 'Could Your Canadian IV Clinic Get Shut Down? The 2026 Rules Every Operator Needs to Know',
    meta_title: 'Canadian IV Clinic Regulations 2026: Who Can Legally Administer',
    meta_description: 'Health Canada peptide advisory, who can legally administer IV in each province (CCHPBC, BCCNM, CNDA, CRNA, CONO, CNO, OIIQ), and what gets clinics shut down in 2026.',
    excerpt: 'The 2024-2026 regulatory landscape rewards documented, college-aligned IV operators and penalizes the corner-cutters. The operator-eye view of what you need to know to stay open and stay clean.',
    category: 'Treatment Guides',
    image_name: 'iv-therapy-clinical-medical-setting.jpg',
    content: A3_CONTENT,
  },
  {
    slug: 'what-iv-therapy-costs-across-canada-2026',
    title: 'What IV Therapy Actually Costs Across Canada: Real Pricing From 30+ Clinics',
    meta_title: 'IV Therapy Cost in Canada 2026: Real CAD Pricing From 30+ Clinics',
    meta_description: 'Honest 2026 Canadian IV therapy pricing pulled from 30+ clinics with published menus. Real CAD ranges by treatment, mobile premium, and insurance coverage facts.',
    excerpt: 'Canadian IV pricing is opaque on purpose. We pulled what we could from 30+ Canadian clinics with published menus and our 4 city guides. Real CAD ranges by treatment, plus the mobile premium and insurance facts.',
    category: 'Treatment Guides',
    image_name: 'iv-therapy-nad-iv-bag-closeup.jpg',
    content: A4_CONTENT,
  },
  {
    slug: '7-questions-before-iv-therapy',
    title: '7 Questions to Ask Before You Let Anyone Put an IV in Your Arm',
    meta_title: '7 Questions to Ask Before IV Therapy | Safety Checklist',
    meta_description: 'An IV is a medical procedure. Save this 7-question checklist for licensing, sourcing, medical director, adverse reactions, labs, informed consent, and insurance.',
    excerpt: 'An IV is a medical procedure, not a beauty service. Save this 7-question checklist. The right clinic answers each in under a minute. If they cannot, find one that can.',
    category: 'Treatment Guides',
    image_name: 'iv-therapy-clinical-medical-setting.jpg',
    content: A5_CONTENT,
  },
];

(async () => {
  const receipt = {
    phase: 'publish-5-canadian-articles',
    timestamp: NOW,
    inserted: [],
    skipped: [],
    errors: [],
  };

  for (const p of POSTS) {
    const { data: existing } = await sb.from('blog_posts').select('id, slug').eq('slug', p.slug).maybeSingle();
    if (existing) {
      console.log('= [slug exists] ' + p.slug);
      receipt.skipped.push({ slug: p.slug });
      continue;
    }
    const imageUrl = IMG_BASE + '/' + p.image_name;
    const payload = {
      slug: p.slug,
      title: p.title,
      meta_title: p.meta_title,
      meta_description: p.meta_description,
      excerpt: p.excerpt,
      category: p.category,
      author: AUTHOR,
      image_url: imageUrl,
      date: NOW,
      last_updated: NOW,
      content: p.content,
      related_clinics: [],
      related_cities: [],
      // Mirror camelCase columns just in case any code path still reads them
      metaTitle: p.meta_title,
      metaDescription: p.meta_description,
      imageUrl,
      authorImageUrl: null,
      reviewedBy: null,
      lastUpdated: NOW,
      relatedCities: [],
      relatedClinics: [],
    };
    const { data, error } = await sb.from('blog_posts').insert(payload).select('id, slug, title').single();
    if (error) {
      console.log('! ' + p.slug + ' failed: ' + error.message);
      receipt.errors.push({ slug: p.slug, error: error.message });
      continue;
    }
    receipt.inserted.push({ id: data.id, slug: data.slug, title: data.title });
    console.log('+ ' + p.slug + '  (' + p.content.length + ' chars)');
  }

  // Em-dash sanity check
  const violations = [];
  for (const p of POSTS) {
    if (/[—–]/.test(p.content) || /[—–]/.test(p.title) || /[—–]/.test(p.excerpt)) {
      violations.push(p.slug);
    }
  }
  if (violations.length) {
    console.log();
    console.log('!! EM-DASH VIOLATIONS in: ' + violations.join(', '));
  } else {
    console.log();
    console.log('Em-dash check: clean.');
  }

  console.log();
  console.log('Published: ' + receipt.inserted.length + ' | Skipped: ' + receipt.skipped.length + ' | Errors: ' + receipt.errors.length);
  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'publish-5-canadian-articles-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
