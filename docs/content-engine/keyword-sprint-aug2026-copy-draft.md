# Keyword Sprint Aug 2026, Copy Draft for Operator Review

Branch: feat/keyword-sprint-aug2026. NOTHING here is implemented yet.
Approve, edit, or strike each section; implementation starts only after your OK.

Scope shipped now: targets 1, 2, 3, 4, 5, 8, 9, 10, 11 (iron/Oakville, added
from the Aug 16 GSC data). Deferred pending menu capture: 6 (NAD cost, only 2
Canadian clinics priced) and 7 (Toronto cost, only 1 Toronto clinic priced).
Our own n>=3 rule blocks both today.

Dataset facts used below (verified live 2026-08-16, cite exactly):
- Myers: 6 Canadian clinic menus, $170 to $250 CAD, median $199
  (Toronto, Mississauga, Brampton, Vaughan, Vancouver, Nanaimo)
- Iron infusion: 3 Canadian clinic menus, $185 to $350 CAD
Every price line must carry its count. No em dashes anywhere.

---

## TARGET 1: "is iv therapy covered by ohip"
LIVES ON: blog post `iv-therapy-insurance-coverage-canada` (the pillar), new FAQ
section + FAQPage schema.

### H2: Is IV therapy covered by OHIP?

Direct answer (46 words):
> No. OHIP covers medically necessary IV treatment ordered in hospitals and
> other insured settings, but it does not cover elective IV vitamin drips at
> private wellness clinics. Those are out of pocket in Ontario, typically $100
> to $350 per session across the clinic menus we track.

Detail paragraph:
OHIP insures physician and hospital services that are medically necessary
[SOURCE: https://www.ontario.ca/page/what-ohip-covers]. A vitamin drip you book
yourself at a wellness clinic is an uninsured, elective service, so the clinic
bills you directly. The exception is treatment a physician orders for a medical
condition delivered in an insured setting, for example IV fluids in an
emergency department. If a private clinic tells you OHIP covers their drip
menu, ask them to put it in writing; we have never seen a case where it does.

FAQ schema items (same section):
- Q: Is IV therapy covered by RAMQ in Quebec?
  A: No. RAMQ insures medically required care; elective vitamin drips at
  private clinics are not an insured service, so you pay out of pocket.
  [SOURCE: https://www.ramq.gouv.qc.ca/en]
- Q: Is IV therapy covered by MSP in British Columbia?
  A: No. MSP covers medically required services by enrolled practitioners;
  elective IV vitamin therapy at a private clinic is not covered.
  [SOURCE: https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp/bc-residents/benefits/services-covered-by-msp]

Internal links: /iv-prices (what people actually pay), /search (compare
clinics), parent stays linked from the regulation guide.
Meta title (pillar, unchanged if already <60): keep existing.

---

## TARGET 2: insurer subsections
LIVES ON: blog post `does-insurance-cover-iv-therapy-canada-2026` (already
titled for the five insurers), new per-insurer H3 subsections + FAQPage schema.
The GSC data shows we already rank 5.8 to 10.7 for insurer + iron infusion
questions, so each subsection gets an iron infusion line.

### H2: Does insurance cover IV therapy in Canada?

Direct answer (44 words):
> Usually not under core benefits. Most Canadian group plans exclude elective
> vitamin drips. Common exceptions: a Health Spending Account can reimburse
> them, some plans cover the naturopath visit fee under paramedical benefits,
> and medically prescribed infusions like iron are handled differently.

Per-insurer subsections (pattern is identical; facts verified against each
insurer's public plan material, linked):

#### Sun Life
Core extended health plans do not list elective IV vitamin therapy as a
covered service. Two routes exist: a Health Spending Account or Personal
Spending Account can reimburse it if your plan includes one, and if a
registered naturopathic doctor administers the drip as part of a visit, the
visit fee may fall under your paramedical ND maximum. Iron infusions are
different: when a physician prescribes iron (for example iron sucrose), the
drug portion may be claimable under your drug plan and the administration
under medical services, ask Sun Life with the DIN before booking.
[SOURCE: https://www.sunlife.ca]
- FAQ: Does Sun Life cover iron infusions? A: The prescribed iron itself may be
  claimable under a Sun Life drug plan and infusion fees vary by plan. Get the
  DIN from your prescriber and confirm with Sun Life first.

#### Manulife / #### Canada Life / #### Blue Cross / #### GreenShield
[Same structure per insurer, one paragraph each + one iron FAQ each. Copy
identical in logic, adjusted names + links: manulife.ca, canadalife.com,
your regional Blue Cross plan site, greenshield.ca. Full text written at
implementation using the paragraph above as the template; flag here if you
want all five spelled out in this draft.]

#### What receipt to ask the clinic for
A claimable receipt shows: the clinic's legal name and address, the
practitioner's full name, designation and registration number, the service
date, the service description, and the amount. For HSA claims this is enough.
For paramedical ND claims the receipt must name the ND. For the medical
expense tax credit, CRA accepts fees paid to an authorized practitioner in
your province (NDs qualify in regulating provinces); the substances themselves
generally do not qualify.
[SOURCE: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/lines-33099-33199-eligible-medical-expenses-you-claim-on-your-tax-return.html]

Internal links: pillar insurance post, /iv-prices, iron infusion guide.
Meta title: keep existing (already lists insurers, 60+ chars, TRIM to:
"Does Insurance Cover IV Therapy? Sun Life to Blue Cross" = 56 chars).

---

## TARGET 3: "do you need a prescription for iv therapy in canada"
LIVES ON: blog post `who-can-legally-give-iv-canada-rules-by-province-2026`,
new FAQ section + FAQPage schema.

### H2: Do you need a prescription for IV therapy in Canada?

Direct answer (49 words):
> You do not bring your own prescription, but every legitimate IV drip must be
> ordered by an authorized prescriber: a physician, a nurse practitioner, or in
> some provinces a naturopathic doctor with IV certification. The clinic's
> prescriber issues that order, usually after a health screening at your visit.

Detail paragraph:
IV vitamin preparations are substances administered by a procedure below the
dermis, a controlled act. The person who orders the infusion must hold
prescribing authority: MDs and NPs everywhere, and NDs where their college
grants IV authority, for example Ontario NDs need IVIT certification with the
College of Naturopaths and must work within its permitted substances
[SOURCE: https://collegeofnaturopaths.on.ca]. What this means for you: a
reputable clinic asks health questions before your first drip because its
prescriber is accountable for the order. A clinic that hooks you up with no
screening and no named prescriber is the red flag our verification guide
teaches you to check.

FAQ schema items:
- Q: Can I get an IV drip without seeing a doctor?
  A: You will not necessarily see a physician in person, but a physician, NP,
  or authorized ND must order your infusion. Provinces differ on who
  qualifies; our province guide lists each.
- Q: Who is allowed to put in the IV line itself?
  A: Administration and prescribing are separate. Registered nurses and other
  regulated professionals may start the IV under an order or directive; the
  order still comes from the prescriber. [SOURCE: https://www.cno.org]

Internal links: /verification (check any clinic in 5 minutes), province posts,
/search.

---

## TARGET 4: "can a nurse start an iv clinic in ontario"
LIVES ON: same regulation guide, adjacent FAQ section. The GSC data shows
"can rpns start ivs in ontario" already at position 5, this extends the
winning cluster.

### H2: Can a nurse start an IV clinic in Ontario?

Direct answer (48 words):
> A nurse can own an IV therapy business in Ontario, but cannot run it on
> nursing authority alone. RNs and RPNs administer IVs under an order or
> medical directive; the drips must be prescribed by a physician, nurse
> practitioner, or an IVIT certified naturopathic doctor working with the clinic.

Detail:
Ownership and clinical authority are separate questions. Nothing stops an RN
from incorporating a clinic. But administering a substance by injection is a
controlled act that nurses perform on the order of an authorized prescriber,
under CNO's medication and directives standards
[SOURCE: https://www.cno.org]. In practice an Ontario IV clinic needs a named
prescriber: a physician or NP who issues directives, or an ND holding IVIT
certification from the College of Naturopaths, who can only prescribe within
the college's permitted substances list
[SOURCE: https://collegeofnaturopaths.on.ca]. Clinics advertising "nurse led"
with no named prescriber are the single most common gap we find when we
verify listings; our directory flags who prescribes at every verified clinic.

FAQ schema items:
- Q: Can RPNs start IVs in Ontario?
  A: RPNs may perform venipuncture and administer IV medication where they
  have the competencies and a proper order or directive, per CNO standards.
  The prescription authority still sits with the prescriber.
- Q: Can a nurse inject vitamins without a doctor involved?
  A: No. An authorized prescriber must order the substance. A nurse working
  without any order is outside CNO standards.

Internal links: /verification, who-can-legally-give-iv-ontario-2026, /search.

---

## TARGET 5: "myers cocktail cost canada"
LIVES ON: /iv-prices page, new FAQ section + FAQPage schema.

### H2: How much does a Myers cocktail cost in Canada?

Direct answer (38 words):
> Across 6 Canadian clinic menus we track (Toronto, Mississauga, Brampton,
> Vaughan, Vancouver, Nanaimo), a Myers cocktail runs $170 to $250 CAD, with a
> median of $199. Prices come from each clinic's own published menu.

Detail: what moves the price (clinic type, add ins, memberships and first
visit discounts), reminder that our index cites source URL and capture date
for every price, and that no insurance plan we know covers it as a core
benefit (link target 1 and 2 sections).

FAQ schema items:
- Q: Why do Myers cocktail prices vary so much? A: Different volumes,
  added ingredients like glutathione, and whether an ND consult is bundled.
- Q: Is the Myers cocktail covered by OHIP or insurance? A: No for OHIP;
  see our insurance guide for HSA and ND paramedical routes.

Internal links: new Myers explainer page (target 10), /cities/toronto,
/search, insurance pillar.

---

## TARGET 8+9: NEW PAGE, the skeptic guide
URL: /blog/is-iv-vitamin-therapy-worth-it-honest-guide (Article schema)
Meta title: "Is IV Vitamin Therapy Worth It? An Honest Look" (46 chars)
Meta description: "What the evidence actually shows about IV vitamin drips,
when they make sense, and when drinking water does the same job for free."

### H2: Is IV vitamin therapy worth it?

Direct answer (47 words):
> For most healthy people, no strong evidence shows IV vitamin drips
> outperform food, water, and oral supplements. IV makes clear sense in
> specific cases: diagnosed deficiency, inability to absorb or keep fluids
> down, and clinician supervised treatment. For general wellness, you are
> mostly buying convenience and ritual.

Body outline (each claim sourced):
1. What the evidence says. The only randomized placebo controlled trial of
   the Myers cocktail (fibromyalgia, 34 patients) found no significant
   difference versus saline placebo
   [SOURCE: https://pubmed.ncbi.nlm.nih.gov/19250003/]. No large trials
   support wellness drips in healthy adults. The US FTC has taken action
   against an IV bar for unsupported health claims
   [SOURCE: https://www.ftc.gov/news-events/news/press-releases/2018/09/ftc-brings-first-ever-action-targeting-iv-therapy-company].
2. The absorption argument, examined. "100 percent bioavailability" is true
   and mostly beside the point: a working gut absorbs what the body needs,
   and excess water soluble vitamins are excreted in urine. Bypassing the gut
   matters when the gut is the problem, which is a medical situation, not a
   wellness one.
3. When IV genuinely makes sense: prescribed iron for diagnosed deficiency,
   rehydration when you cannot keep fluids down, clinician managed protocols.
   Each named with "ask your clinician", zero outcome promises.
4. Honest cost comparison: median Myers $199 across the 6 Canadian menus we
   track versus cents for oral hydration. What you are paying for: the
   setting, the nurse's time, the screening.
5. Safety notes, factual only: infusions should follow a health screening;
   ask any clinic what they do about G6PD deficiency before high dose
   vitamin C [SOURCE: https://pmc.ncbi.nlm.nih.gov/articles/PMC8857720/].
6. Bottom line + how to choose a clinic if you still want one: check the
   prescriber on the public register, our /verification guide shows how.

### H2: IV drip vs drinking water: which hydrates you better?

Direct answer (44 words):
> For mild dehydration, drinking water or an oral rehydration solution works
> for nearly everyone, and it is what clinical guidance recommends first. An
> IV rehydrates faster and is the right tool when someone cannot drink or
> keep fluids down, under clinical supervision.

Short body: oral rehydration is the standard of care for mild to moderate
dehydration [SOURCE: CDC or WHO oral rehydration guidance, exact page picked
at implementation]; IV wins on speed, loses on cost and invasiveness; a
hangover is mostly not a hydration problem, which is why evidence for
hangover drips is thin (link the verdicts post).

Internal links: iv-drip-verdicts-evidence-2026, who-should-not-get, /iv-prices,
/verification, /search. Article schema, author TheDripMap Team, dated.

TONE RULE for this page: it must be comfortable telling readers NOT to buy.
That honesty is the citation magnet.

---

## TARGET 10: NEW PAGE, Myers cocktail explainer
URL: /blog/what-is-in-a-myers-cocktail (Article schema)
Meta title: "What Is in a Myers Cocktail? Ingredients Explained" (50 chars)
Cannibalization handling: existing `myers-cocktail-iv-therapy-complete-guide`
keeps benefit/experience intent; its meta title drops "what is in" phrasing if
present, and it links here as the ingredient reference. No deletions.

### H2: What is in a Myers cocktail?

Direct answer (41 words):
> A Myers cocktail is a vitamin and mineral infusion typically containing
> magnesium, calcium, B complex vitamins, vitamin B12, and vitamin C in a
> saline or sterile water base. Exact amounts vary by clinic, there is no
> single standardized formula.

Body outline:
1. Ingredient table: magnesium chloride, calcium gluconate, B complex, B12
   (hydroxocobalamin or methylcobalamin), vitamin C, base fluid. Column for
   "what it is", NO efficacy column, factual descriptions only.
2. History, two sentences: named after Dr. John Myers (Baltimore), popularized
   by Dr. Alan Gaby [SOURCE: Gaby's published account, PubMed/PMID at
   implementation].
3. There is no standard recipe: clinics adjust volumes and swap ingredients;
   this is why asking for the ingredient list matters. Cite that we capture
   published menus verbatim with source URLs.
4. Variations clinics offer (from our captured menus, named factually):
   added glutathione, added zinc, higher dose vitamin C.
5. Typical Canadian price: $170 to $250, median $199, across the 6 Canadian
   clinic menus we track, linked to /iv-prices.
6. Who administers and prescribes it in Canada: two sentence summary linking
   the regulation guide and /verification.
7. FAQ (FAQPage schema allowed here alongside Article):
   - How long does a Myers cocktail take? Most clinics advertise 30 to 60
     minutes; check the clinic's own menu listing.
   - Is the Myers cocktail safe? Framed as: it should follow a health
     screening by the clinic's prescriber; link who-should-not-get post.
   - Myers cocktail vs banana bag: factual composition difference.

ZERO efficacy claims anywhere on this page. This page seeds the Ingredient
Card taxonomy: each ingredient row gets an anchor id we can later link from
drip menus.

---

## TARGET 11 (added from GSC data): iron infusion Oakville and the GTA
LIVES ON: blog post `iron-infusion-canada-cost-coverage-2026`, new section +
FAQ. Rationale: ~380 impressions per 28 days across Oakville iron queries at
positions 16 to 27, plus four insurer iron questions already ranking 5.8 to
10.7. One section can capture the whole cluster.

### H2: Where can you get an iron infusion in Oakville and the GTA?

Direct answer (43 words):
> Private iron infusion appointments in Oakville and the wider GTA are offered
> by specialized iron clinics and some naturopathic and medical IV clinics.
> You need a prescription and recent ferritin bloodwork; across the 3 Canadian
> clinic menus we track, prices run $185 to $350.

Body: what to bring (prescription, ferritin result), typical process, that
public options exist through hospital programs when medically urgent, and the
insurer angle linking the target 2 iron FAQs (Sun Life, Manulife, Canada
Life, Blue Cross). Directory link to Oakville city page + iron facet.

FAQ schema items:
- Q: Do I need a referral for a private iron infusion? A: You need a
  prescription for the iron product; clinics tell you what bloodwork to bring.
- Q: How much does a private iron infusion cost in the GTA? A: Across the 3
  Canadian clinic menus we track, $185 to $350 plus any consult fee. The drug
  may be claimable under your drug plan when prescribed.

Internal links: /cities/oakville, /cities/toronto, insurance insurer section,
/verification.

---

## MECHANICAL CHECKLIST (implementation, after your approval)
- FAQPage schema per extended section; Article schema on both new pages
- Both new pages: sitemap entries + self canonicals; existing posts keep slugs
- Internal links down from parents, up from children, city pages to /iv-prices
- Meta titles verified under 60 chars; no em dashes anywhere; validator run
- After merge: GSC sitemap resubmit + indexing requests for changed URLs
- Add all 9 shipped queries + the 2 deferred to the weekly GSC tracking list
- Unblock targets 6 and 7: menu capture sprint across Toronto and GTA clinic
  sites (existing resumable capture + QA scripts), then a follow up PR with
  real numbers
