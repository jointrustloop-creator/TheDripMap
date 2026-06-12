# Phase 0: The 5 Onboarding Questions for Newly Verified Clinics

Research date: 2026-06-12. Status: DRAFT, awaiting operator sign-off. No code,
DB, or email changes made.

Evidence base:
- Search-intent scan (PAA patterns for "is IV therapy safe", "IV drip cost",
  "what to expect", etc., Canada-first)
- Review mining across 10+ IV clinics (Insight Toronto, Bay Wellness Vancouver,
  The IV Lounge Toronto, Drip Wellness Calgary, IV Health Centre Vancouver,
  Dr Refresh LA, Hydration Room OC, Restore Hyper Wellness, Hydrate IV Bar
  Dallas, DRIPBaR/Replenish Tampa, Drip Hydration mobile)
- Directory structure scan (RealSelf, Zocdoc, Healthgrades, RateMDs, Fresha,
  Booksy) plus published conversion stats
- Our own listing_events data (212 events, 82 providers, 11 with 5+ views)

Internal headline finding: the ONLY listing with a strong action rate is Bay
Wellness (5 clicks on 6 views, 0.83). It is also the only listing with per-drip
prices in `services` AND named practitioners with credentials in the
description. Pooled action rates: service pricing present 0.83 vs 0.013
absent; named practitioner 0.286 vs 0.000 absent. Long description alone does
nothing (Evara, 584 chars, 0 clicks in 13 views). Small sample, but it points
the same direction as every external source.

---

## 1. The Five Questions (final wording, brand voice)

These go in one email. Each is answerable from memory in 2 to 5 sentences.

**Q1. Who will patients meet?**
"Who places the IVs at your clinic, and who provides the medical oversight?
First names or full names, plus credentials (RN, NP, ND, MD) for each. One
line of background per person is perfect, e.g. 'Dr. Megan Maycher, ND, 10
years in IV nutrient therapy.'"

**Q2. What are your three most popular drips, and what do they typically cost?**
"For each: the drip name, a rough price or 'from' price, and how long a
session usually takes. A typical range is fine, we never hold you to exact
pricing."

**Q3. What does a first visit look like?**
"Walk us through it in a few sentences: do new patients get a consultation or
health screening first, how long should they budget for the whole visit, and
what do most first-timers not expect?"

**Q4. Where do your IV ingredients come from, and how are they prepared?**
"For example: a licensed compounding pharmacy or pharmaceutical wholesaler,
prepared fresh on site, that kind of thing. Patients ask us this more than
anything except price."

**Q5. How do patients pay, and what can they claim?**
"Do you issue receipts patients can submit to extended health benefits (for
ND-administered drips in Canada), do you direct bill, and do you take HSA/FSA
(US)? And is there any membership or package, or is it simply pay per visit?"

---

## 2. Evidence and Field Mapping Per Question

### Q1: Who will patients meet?

Evidence: This is the single most consistent finding across all three research
streams. In review mining, needle/insertion skill of a SPECIFIC NAMED PERSON
was the most-quoted detail in positive reviews across every market: "Dr.
Maycher has the gentlest touch... never feel her insert the IV needle" (Bay
Wellness, ratemds.com), "Dr. Mark Fontes is extremely gentle when injecting"
(Insight, reviews.birdeye.com), "quick, painless stick" (Hydrate IV Bar Dallas,
Yelp). Reviews that name a person are almost always 5-star; anonymity
correlates with neutral or negative. On the intent side, "who actually puts
the needle in" is the #3 pre-booking question, and "vague credentials" is the
#1 cited disqualifier (mobileivmedics.com, the AP "ask some questions first"
piece at columbian.com). Directories converge here too: staff profiles are
Booksy's book-a-specific-practitioner model, and credential verification is
the core of RealSelf Verified and Healthgrades. Internally, named-practitioner
listings pooled 0.286 clicks/view vs 0.000 without. In Canada,
"ND-administered" also unlocks the insurance answer in Q5.

Fields fed:
- `medical_team` (name, role, bio per person; renders on listing and feeds the
  lead-practitioner slot on ProviderCardFeatured)
- Safety attestation: `verifiedMedicalDirector` + `verifiedClinician` (2 of 5
  sub-checks in clinic_profiles.profile_data)
- Matching quiz: MD/NP oversight is worth +40 in src/lib/matching.ts
- `description` (lead practitioner sentence, the Bay Wellness pattern)

### Q2: Three most popular drips + typical cost + session length

Evidence: Cost is the #2 search question everywhere ("IV drip cost Toronto"
$190-399, Vancouver $120-350, Calgary $150-200 per prometheanclinic.ca and
calgaryintegrativemedicine.ca), and "vague answers or refusal to provide an
estimate is a major warning sign" (ameripharmainfusioncenter.com). Session
length is its own recurring question (#5). Fresha and Booksy make the
per-service menu with upfront price and duration THE profile core, and posted
prices measurably raise patient volume (PMC11129567). Restore's biggest
complaint class is opaque credits-vs-ingredients pricing; the Hydration Room's
clearly posted $125-185 menu defuses skepticism. Internally this is our
strongest signal: the one listing with per-drip prices converts at 0.83 vs
0.013 for everything else. Asking for the top THREE keeps it answerable in one
reply and surfaces what the clinic actually sells.

Fields fed:
- `services` (array of {name, price}; renders as the restaurant-menu for
  claimed listings on /providers/[slug])
- `price_range` (hero badge + Price Range card)
- `specialties` (drip names map to matching tags and the pills section)
- FAQ JSON-LD: replaces the generic auto-generated "How much does IV therapy
  cost at X?" answer with a real one

### Q3: What does a first visit look like?

Evidence: Four of the top 15 search questions are first-visit logistics: how
long does it take, does it hurt, will there be a screening, what should I do
before (kimbellmedspa.com, colaz.co.uk, revitalizemobileiv.com). Review mining
shows consult-first models earn loyalty (The IV Lounge's mandatory 30-45 min
consult is framed as a trust signal; Drip Wellness Calgary's "explained
everything perfectly" reviews), while "bag prepped within 2 minutes, no
vitals" is the top documented red flag (mobileivmedics.com). Needle-phobic
first-timers specifically say they wished they had known only a flexible
catheter stays in the arm (hydrateivbar.com pattern). Zocdoc explicitly
coaches providers to pre-answer "what should a first-timer expect" style FAQs
to set expectations. This answer also quietly tells us whether a health
screening happens, supporting the safety story without an audit tone.

Fields fed:
- `description` (a "your first visit" paragraph, the highest-value description
  content we can add)
- FAQ JSON-LD: "What should I expect at my first visit to X?" (new, real
  question instead of boilerplate)
- Corroborates the screening half of the safety attestation narrative

### Q4: Ingredient sourcing and preparation

Evidence: This is the question patients are told to ask by every credible
source: the AP consumer piece says to ask whether drugs come from a licensed
pharmaceutical wholesaler because of counterfeit risk (dailyherald.com,
barchart.com), and NBC/CBC coverage of unregulated IV spas has made sourcing a
mainstream worry (nbcnews.com rcna235854, CBC patchwork-regulation
investigation). The nightmare reviews exist: "expired, discolored vitamins
being used" (Trustpilot, dripiv.com.au). Positive differentiation exists too:
"drips compounded fresh daily" is a praised trust signal at The IV Lounge.
No competitor directory captures this field, which makes it our safety
attestation's most defensible leg. Phrased as "patients ask us this" so it
reads as us helping them answer a common question, not auditing them.

Fields fed:
- Safety attestation: `verifiedCompoundingPharmacy` (sub-check 3 of 5)
- FAQ JSON-LD: "Where does X source its IV ingredients?"
- `description` (one trust sentence)
- Note: with Q1 + Q4 answered, 3 of the 5 safety sub-checks are evidenced,
  which is the practical threshold for turning on the `safety_verified` badge
  (currently false for ALL providers including Bay Wellness)

### Q5: Payment, claims, and commitment

Evidence: Insurance is the killer Canada question: wellness IVs are never
OHIP/MSP covered, but ND-administered drips can be claimed under the
naturopathic benefit of extended health plans, typically $300-1,000/yr
(theiv.ca, policyadvisor.com, iv-therapy.ca). That makes "can I get a
claimable receipt" a concrete booking criterion for the 8 of 11 of our claimed
clinics that are Canadian, and it still works in the US as HSA/FSA. Zocdoc
forces insurance as a required field and it is one of their highest-leverage
match facets. The membership half earns its place from the loudest complaint
class in all of review mining: Restore's cancellation lawsuit and BBB
complaints, Hydration Room's 4-month minimum, prepaid-package non-delivery on
Trustpilot. For independents, "pay per visit, no membership required" is
itself a marketable claim.

Fields fed:
- FAQ JSON-LD: "Is IV therapy at X covered by insurance?" (mirrors our own
  blog post /blog/iv-therapy-insurance-coverage-canada, which we can internally
  link)
- `description` (one practical sentence)
- Matching/filter tags: direct billing, HSA/FSA, no-membership (candidate
  future facets; today they land in description + FAQ)

---

## 3. Strongest Runner-Ups and Why They Lost

**R1. "What languages does your team speak?"**
Zocdoc's data is striking (2 languages roughly 2x bookings, 3+ roughly 3.5x,
fiercehealthcare.com), and it would suit Brampton/Richmond Hill/Vancouver
markets well. Lost because it is a one-word answer that does not feed
description, safety, or pricing, and we only get five slots. Belongs as a
checkbox on a future profile form, not in the founding five.

**R2. "What is one thing you wish every first-timer knew?"**
Produces lovely, human description copy (the catheter-not-needle fact, eat
before you come). Lost because in practice clinics answer it with the same
content Q3 already elicits, and it maps to no structured field. Q3's "what do
most first-timers not expect?" tail keeps the best of it.

**R3. "Do you offer mobile/at-home visits, and what is your service area?"**
Mobile vs in-clinic is a real matching facet (`type` column, +15 in the
matching quiz) and mobile safety is a known search question. Lost because it
only applies to a minority of clinics, we usually already know it from Google
data, and a wrong speculative service-area claim is exactly the failure mode
from the Sleep Mode lessons. Better confirmed as a yes/no checkbox during
claim review than spent as a question slot.

Also considered and rejected outright: "what conditions do you treat"
(invites medical claims, banned by constraint; the FTC action against a Texas
drip bar for cancer claims is the cautionary tale), amenities (reviews show
comfort details are tie-breakers, never deal-breakers), and "why did you
start the clinic" (zero field mapping).

---

## 4. Draft Onboarding Email

Subject: You're verified on TheDripMap. Five quick questions to finish your listing

Hi {{first_name}},

{{clinic_name}} is now verified on TheDripMap. Nice to have you.

Verified clinics with a complete profile get noticeably more clicks and calls
than bare listings, so we'd like to fill yours in properly. Five questions.
A few sentences each is plenty, and you can answer right in a reply to this
email.

1. Who will patients meet? Who places the IVs, and who provides the medical
   oversight? Names and credentials (RN, NP, ND, MD), with one line of
   background per person. Something like "Dr. Megan Maycher, ND, 10 years in
   IV nutrient therapy" is perfect.

2. What are your three most popular drips, and what do they typically cost?
   Name, a rough or "from" price, and how long a session usually takes. A
   range is fine. We never hold you to exact pricing.

3. What does a first visit look like? Do new patients get a consultation or
   health screening first, how long should they budget, and what do most
   first-timers not expect?

4. Where do your IV ingredients come from, and how are they prepared? For
   example, a licensed compounding pharmacy or pharmaceutical wholesaler,
   prepared fresh on site. Patients ask us this more than anything except
   price.

5. How do patients pay, and what can they claim? Do you issue receipts for
   extended health benefits, do you direct bill, and do you take HSA/FSA? Is
   there a membership or package, or simply pay per visit?

Two more things while you're at it:

- Your logo (PNG or SVG is ideal)
- Two or three photos: your treatment space, your team at work, your front
  door. Real photos beat stock every time, and listings with photos get far
  more bookings.

Reply whenever suits you this week. We'll have your updated listing live
within two business days of hearing back, and we'll send you the link to
review before anything else changes.

Thanks again for verifying. Patients in {{city}} are already finding you.

{{operator_name}}
TheDripMap
info@thedripmap.com

---

## Appendix: Internal Data Notes

- Analysis script: scripts/_phase0-conversion-evidence.cjs (read-only)
- listing_events: 212 total (184 views, 19 website_click, 4 book_click,
  2 call_click, 2 directions_click, 1 message_click)
- Cohorts (pooled clicks/views, providers with 5+ views, n=11):
  claimed 0.162 vs unclaimed 0.000; service pricing 0.833 vs 0.013;
  named practitioner 0.286 vs 0.000; photos 0.098 vs 0.000;
  long description alone 0.000
- Sample is small. Treat as directional, consistent with external evidence,
  not as proof on its own.
- safety_verified is currently false for every provider. Q1 + Q4 answers give
  evidence for 3 of the 5 sub-attestations (verifiedMedicalDirector,
  verifiedClinician, verifiedCompoundingPharmacy). Liability insurance and
  regulator standing (the other 2) are deliberately NOT asked here to avoid
  audit tone; they can be verified by us from public registries (e.g. CONO
  IVIT inspection program in Ontario) or asked at the featured-upgrade stage.
- Reddit caveat: reddit.com blocks the research crawler, so forum evidence
  came from Trustpilot, Yelp, RateMDs, BBB, and first-person journalism. The
  decision-factor patterns were consistent across all of those sources.
