/**
 * Phase 2 Tier A: depth content for 6 high-commercial-intent posts that
 * weren't city-specific but had thin content and weak ranking potential:
 *   - mobile-iv-therapy-near-me
 *   - vitamin-c-iv-therapy-guide
 *   - how-much-does-nad-plus-iv-therapy-cost
 *   - iv-therapy-insurance-coverage-united-states
 *   - hsa-fsa-iv-therapy-reimbursement-united-states
 *   - iv-therapy-package-deals-membership-guide
 *
 * Content written by 6 parallel agents with WebSearch verification.
 * Real sources cited (IRS Pub 502 + Notice 2026-05, FDA 503A/503B
 * guidance, NIH/PMC vitamin C pharmacokinetics, Medicare LCDs, etc.).
 *
 * Uses PHASE2_DEPTH_START/END sentinel pair for idempotency.
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PHASE2_START = '<!-- PHASE2_DEPTH_START -->';
const PHASE2_END = '<!-- PHASE2_DEPTH_END -->';

const CONTENT = {
  'mobile-iv-therapy-near-me': `## How mobile IV therapy actually works

The mechanics are simpler than most marketing copy suggests. After you book, a dispatcher confirms address, parking, and the protocol you selected, then assigns a registered nurse. Industry-typical response windows run anywhere from 30 minutes in high-density metros like NYC and Las Vegas to 60-90 minutes in spread-out markets or peak-traffic hours. Some providers quote a 30-minute arrival; most quote a 45-to-75-minute window and ask you to allow extra time on weekends.

The RN arrives with a rolling kit: pre-prepared sterile IV bags, tubing, IV catheters in multiple gauges, alcohol prep, tourniquet, sharps container, gloves, saline flushes, and any add-on vials (B-complex, glutathione, zinc, anti-nausea, toradol). A brief intake follows. Expect questions about current medications, allergies, kidney and cardiac history, last meal, hydration status, and pregnancy if relevant. The nurse takes vital signs, including blood pressure, heart rate, and ideally pulse oximetry — most reputable mobile operators carry a portable oximeter and a documented emergency protocol naming the nearest ER.

IV placement is typically in the forearm or back of the hand. Once flow starts, a standard hydration or Myers' Cocktail bag runs 30 to 60 minutes. NAD+ is much slower — usually 2 to 4 hours depending on dose, because faster infusion causes chest pressure and abdominal cramping. The RN stays the entire time, monitors for infiltration or reaction, removes the line, applies a small pressure bandage, and documents the visit.

Common settings: private homes, hotel rooms, corporate offices, post-event recovery houses, bachelorette suites, and yacht or boat charters in coastal markets. Anywhere with a chair, a clean surface, and a power outlet for the nurse's tablet works.

## What mobile IV therapy costs (2026 ranges)

Pricing has stratified considerably as the category matured. In the US, a basic hydration drip from a licensed mobile provider runs roughly **$175-$350**, with the lower end common in Texas, Arizona, and Georgia and the upper end normal in coastal metros. A Myers' Cocktail — saline plus B-complex, B12, magnesium, calcium, and vitamin C — typically lands between **$225 and $400**. NAD+ is the wildest variable: **$400-$1,000+** depending on dose (250mg, 500mg, 1000mg) and whether it's bundled with a methyl donor protocol.

Mobile travel fees sit on top of the drip itself. Within a primary metro service area, expect **$50-$150**. For outlying suburbs, second-ring towns, or anything past a 30-minute drive from the operator's base, fees jump to **$150-$300** and sometimes more. Surge pricing is standard during Super Bowl weekend, F1 race weekends, EDC, Coachella, Art Basel, CES, and major convention weeks. Treat any rate quoted at more than roughly 1.5x the operator's published baseline as a surge premium and ask exactly what the surge covers.

Group bookings almost always discount on a per-person basis once you hit three or more patients at one address — useful for bachelorette parties, corporate retreats, ski-house trips, and family flu-season visits. Monthly memberships ($100-$250/month) typically include one drip and discounted add-ons; these only make financial sense if you genuinely use them more than once a quarter.

Canadian pricing tracks similarly. Standard drips in Toronto, Vancouver, Montreal, and Calgary generally run **C$200-$450**, with travel fees of **C$50-$150** inside major service areas. Ontario pricing reflects the regulatory overhead of administration by an RN, an ND with IVIT certification, or a physician, plus inspected compounding locations.

Insurance does not cover any of this. Most providers accept HSA and FSA cards in the US, though eligibility depends on whether your plan administrator considers wellness IVs reimbursable — many do not.

## When mobile makes more sense than in-clinic (and when it doesn't)

Mobile wins decisively in a handful of scenarios. Post-event recovery in hotel rooms — the Vegas, Miami, and NYC post-bachelorette and post-wedding market is built on this. Group bookings where moving five hungover people to a clinic is a logistical loss. Post-op recovery in the first week after surgery, when getting in a car is the worst part of the day. Conference recovery during a packed schedule. New parents who genuinely cannot leave the baby. Mobility-limited patients and anyone in cardiac or orthopedic recovery. Residents of the GTA, greater LA, or the Bay Area, where a 90-minute round-trip drive for a 45-minute drip is its own form of dehydration.

In-clinic is the better call in other situations. First-time IV patients benefit from a clinic's screening workflow, on-site physician oversight, and crash cart proximity. NAD+ infusions are long, occasionally uncomfortable, and easier to tolerate in a recliner with a bathroom 10 feet away. Anything requiring lab draws or active monitoring — high-dose vitamin C, chelation, iron infusions, ketamine — belongs in a clinic with same-day labs and supervised protocols. Anyone with a meaningful cardiac, kidney, or hepatic history should start in-clinic with a physician on the premises, then move to mobile only once a protocol is established and well-tolerated. Anyone unsure whether they have G6PD deficiency, prior reactions to any vitamin infusion, or a history of vasovagal response should also start in a clinical setting.

## How to vet a mobile IV provider

Before booking, verify the following — in writing where possible:

- **Medical director name and license**, including the state or province where they're licensed. Cross-check at the relevant state medical board or the CPSO/CPSA equivalent in Canada. A provider who can't name their MD on the phone is a hard pass.
- **RN credentials of the person actually inserting the IV.** Not an LPN, not an MA, not a "drip technician," not a paramedic operating outside a 911 scope. In Texas, HB 3749 (Jenifer's Law, in effect since September 1, 2025) restricts elective IV initiation to a physician, APRN, PA, or RN under physician orders. California and New York are RN-only for elective IV. Georgia allows LPNs under physician orders, which means extra scrutiny is warranted. Ontario requires an RN, an ND with current IVIT certification from the College of Naturopaths of Ontario, or a physician, with compounding performed at a College-inspected facility.
- **Where the IV bags are compounded.** Either a 503A pharmacy (patient-specific prescriptions) or a 503B outsourcing facility (FDA-registered, bulk-compounded under CGMP). If the operator can't tell you the source, that bag has no verifiable chain of custody.
- **Malpractice insurance that specifically covers in-home administration.** Many standard nursing policies exclude private-residence work.
- **Written emergency protocol** and the nearest ER's distance from your booking address.
- **Response time guarantee in writing**, not just the website headline.
- **G6PD screening** if you're booking high-dose vitamin C (anything over 10g). High-dose vitamin C in a G6PD-deficient patient can trigger hemolytic anemia. A G6PD lab is a one-time test and should be required, not optional.
- **Medication interaction screening** if methylene blue is on the menu — it interacts dangerously with SSRIs, SNRIs, MAOIs, and several migraine drugs.
- **Written cancellation and refund policy.**
- **Multi-state or multi-province licensure** if your address sits near a state line. A Virginia RN cannot legally insert an IV in DC without DC licensure. A New Jersey-licensed nurse cannot work in Manhattan on a New Jersey license alone. Same logic for an Ontario RN crossing into Quebec.

## Red flags to walk away from

- "Drip technicians," "IV specialists," or unlicensed assistants performing the insertion. The title on the business card matters less than the actual professional license behind it.
- No medical director listed on the website, and the booking agent cannot or will not name one on request.
- NAD+ priced below roughly $300. NAD+ raw material is genuinely expensive; pricing well below market almost always indicates a sub-therapeutic dose, watered-down protocol, or a compounding shortcut.
- Aggressive package upselling on the first call — five-pack, ten-pack, annual memberships pitched before any clinical conversation has happened.
- Event surge pricing two to three times the operator's standard rate, especially anything north of $500 for plain hydration.
- Cash-only operation, no written records left behind, no informed consent form, no visit summary emailed afterward.
- The same operator working under different brand names at different events. Pop-up brands that surface only during CES, EDC, F1 weekend, or Art Basel and disappear in between are a recurring pattern worth checking the business registry on.
- No verifiable business license in the state or province where service is being delivered.
- Refusal to put response time, cancellation policy, or refund policy in writing.
- A nurse who declines to take vitals before starting the drip, skips the medication and allergy review, or starts the bag without confirming what's in it.

Booking mobile IV therapy responsibly is mostly a process of verifying boring administrative details before anyone touches your arm. The providers worth using will answer every one of these questions without friction. The ones worth avoiding will get defensive about the third question on the list.`,

  'vitamin-c-iv-therapy-guide': `## What IV vitamin C actually does (and what it doesn't)

Oral vitamin C runs into a hard biological ceiling. The intestinal transporter responsible for absorbing it (SVCT1) saturates at roughly 200 mg per dose, after which fractional absorption drops sharply and the excess is excreted in urine. Plasma saturates around 200 to 400 mg of daily intake in healthy adults. You cannot meaningfully push plasma concentrations higher by swallowing more pills.

Intravenous administration bypasses the gut entirely. Pharmacokinetic studies have shown that IV dosing can produce plasma concentrations 30 to 70 times higher than the maximum tolerated oral dose, and high-dose protocols can reach peak plasma concentrations over 10 mM, roughly two orders of magnitude above what oral supplementation can achieve.

That difference matters because it splits IV vitamin C into two clinically distinct use categories that often get blurred in marketing copy.

The first is **wellness dosing**, typically 1 to 25 grams per session, marketed for immune support, antioxidant function, post-cold recovery, post-travel rebound, and general "wellness." Be honest about the evidence here: in otherwise healthy adults, the clinical data supporting these specific immune and energy claims is thin. Most of what's sold as an "immune drip" is reasonable as a hydration plus high-dose micronutrient delivery, but the curative or preventive claims outpace the research.

The second is **high-dose or oncology-adjunctive dosing**, typically 25 to 100+ grams per session, administered in integrative oncology and research settings. The mechanistic case is stronger here. At pharmacologic plasma concentrations, vitamin C generates hydrogen peroxide selectively toxic to some tumor cells, and the Riordan IVC Protocol targets blood concentrations of 350 to 400 mg/dL post-infusion. Even with that signal, high-dose IV vitamin C is considered adjunctive, not curative, and is not a replacement for standard oncology care.

## Typical doses and what they treat

Doses cluster into four practical tiers, and the difference between them is not just price. It's screening, monitoring, and clinical intent.

**5 to 7.5 grams.** The standard "immune drip" dose in wellness clinics. Generally well tolerated in healthy adults, runs in 30 to 45 minutes, and is often combined with B-complex, zinc, glutathione, or magnesium. Marketed for immune support, post-cold recovery, jetlag, hangover rebound, and pre-event wellness. Evidence for clinical benefit in healthy adults is modest, but the safety profile at this dose is favorable and most clinics offer it without extensive screening. Typical price: $150 to $250.

**10 to 15 grams.** A moderate dose marketed for active illness recovery, post-surgical healing support, intensive travel schedules, and athletes pushing through heavy training blocks. Sessions usually run 45 to 60 minutes. At this range, well-run clinics start asking more questions about kidney history and may begin requiring G6PD screening. Typical price: $200 to $350.

**25 to 50 grams.** A higher-dose protocol that requires G6PD blood screening before the first session and is usually administered in integrative or functional medicine settings rather than walk-in med spas. Sessions run 60 to 90 minutes with controlled drip rate. Marketed for chronic infection support, autoimmune-related fatigue, Lyme protocols, and as a step-up phase in oncology-adjunctive sequences. Typical price: $200 to $500 per session.

**50 to 100+ grams.** Research and oncology-adjunctive dosing. The Riordan protocol starts at roughly 15 g, escalates to 25 g and then 50 g over the first three sessions, and adjusts from there to hit target plasma concentrations. This tier requires extensive screening (G6PD, kidney function, baseline labs), close monitoring during infusion, and coordination with the patient's oncologist if cancer treatment is active. It is administered only at specialized integrative oncology clinics. Typical price: $400 to $1,000+ per session, usually as part of multi-session packages.

The critical patient takeaway: if a med spa is offering 50 g infusions without G6PD screening, that is not the same product as a 50 g infusion at an integrative oncology clinic. The dose on the bag is identical. The safety infrastructure around it is not.

## Why G6PD screening is non-negotiable

Glucose-6-phosphate dehydrogenase (G6PD) deficiency is an X-linked enzyme deficiency affecting roughly 400 million people worldwide, with notably higher prevalence in people of African, Mediterranean, Middle Eastern, and South and Southeast Asian descent. Many people who carry it have no symptoms day to day and have never been tested.

The clinical problem with IV vitamin C is that high pharmacologic doses generate hydrogen peroxide as part of the mechanism that makes the therapy interesting in the first place. In a G6PD-deficient patient, red blood cells cannot adequately handle that oxidative load, and the result can be acute hemolytic anemia, a serious and occasionally fatal reaction. Most documented cases of hemolysis involve doses above 60 g, but the threshold for risk is not universally agreed on, which is why responsible clinics screen well below that.

The practical standard: any clinic administering doses above roughly 10 grams should require a G6PD blood test (lab cost typically $50 to $150) before the first high-dose session. The test is simple, results return in a few days, and it is the single most important safety step in this entire therapy.

A timing nuance worth knowing: G6PD testing during active hemolysis can produce falsely normal results because the surviving red cells skew younger and enzyme-replete. The test should be done at baseline, not after symptoms appear.

Patient responsibility is direct. Ask explicitly whether you've been screened. Get a copy of the result. Do not accept "we'll just start slow" or "we'll watch for symptoms" as a substitute for a lab test before high-dose dosing. That is a clinically dangerous corner to cut.

## What IV vitamin C costs (2026 ranges)

US pricing in 2026 breaks into reasonably predictable tiers.

- **Add-on vitamin C boost** (1 to 3 g added to a base hydration or Myers' drip): **$25 to $75**.
- **Standalone "immune drip"** (5 to 15 g, often with B-complex, zinc, and glutathione): **$150 to $300**.
- **High-dose IV vitamin C** (25 to 50 g, with G6PD screening required): **$200 to $500** per session.
- **Oncology-adjunctive high-dose** (50 to 100+ g, integrative oncology setting): **$400 to $1,000+** per session, almost always sold as a multi-session protocol.

Mobile delivery adds **$50 to $150** on top, covering the nurse's travel and the convenience of in-home or in-office administration.

Multi-session packages are common and usually discount per-session cost by 15 to 25 percent at the 5 to 10 session range. Be careful here: package pricing is a legitimate cost-saver for protocols you would have done anyway, and a sales tool when applied to wellness dosing you don't actually need a course of.

Insurance generally does not cover wellness IV vitamin C in the US. Some integrative oncology protocols may qualify for HSA or FSA reimbursement with a Letter of Medical Necessity from a prescribing physician; ask before assuming.

Geography matters meaningfully. New York, San Francisco, Los Angeles, and Miami tend to run 30 to 50 percent above the same service in Phoenix, Atlanta, Houston, or smaller metros, both for clinic and mobile delivery.

## Side effects and contraindications

Most side effects are mild and manageable. The serious ones are predictable in patients who weren't properly screened.

- **Vein irritation** at the insertion site. Common, mild, usually self-resolves within hours.
- **Nausea or lightheadedness** during fast infusion. Common at higher doses, almost always fixable by slowing the drip rate.
- **Hemolytic anemia in G6PD-deficient patients.** Rare when screening is enforced, serious when it isn't.
- **Kidney stone risk in patients with a history of oxalate stones.** Vitamin C metabolizes partly to oxalate, and ascorbate contributes 30 to 50 percent of urinary oxalate. Repeated high doses can raise stone risk in susceptible patients.
- **Acute or chronic oxalate nephropathy** following prolonged high-dose infusion in patients with pre-existing renal impairment.
- **Interference with chemotherapy drugs** in active oncology patients. High-dose vitamin C must be coordinated with the treating oncologist, never run in parallel without disclosure.
- **Drug interactions with anticoagulants.** Generally clinically minor, but worth disclosing on intake.

**Contraindications** include G6PD deficiency at high doses, severe kidney disease, a personal history of calcium oxalate kidney stones, and active cancer treatment without oncology coordination. Pregnancy is not a blanket contraindication: lower wellness doses are generally considered safe, but the decision should run through the patient's OB before booking.

## How to choose a vitamin C IV provider

The bar is higher for vitamin C IV than for a basic hydration drip. Here is what to verify before you book, especially for any dose above 10 grams.

- **Medical director's name and state license**, verifiable on the state medical board website.
- **An RN or ND performing the insert and monitoring the infusion**, not an LPN or medical assistant.
- **Sourcing of ascorbic acid and IV bags from a sterile compounding pharmacy**, registered as 503A or 503B with the FDA. Ask. A reputable clinic will answer without hesitation.
- **G6PD screening protocol for any dose above 10 grams**, with documentation of the result before the first session.
- **A pre-session intake** that covers kidney history, prior kidney stones, current medications, and any active cancer treatment.
- **Drip rate monitoring.** High-dose vitamin C should run over 30 to 60 minutes at minimum, not pushed faster to free up the chair.
- **Clear pricing posted online** without a high-pressure package upsell at the first visit.
- **Documented coordination with the patient's oncologist** if the protocol is oncology-adjunctive. No exceptions.

Vitamin C IV done right is one of the better-tolerated infusions on a wellness menu, and at high doses it is one of the few wellness-adjacent therapies with a serious mechanistic and research footprint behind it. Done wrong, with skipped screening, an unlicensed administrator, or sub-therapeutic dosing dressed up as a clinical protocol, it is a wasted $200 at best and a preventable hospital visit at worst. The difference is almost entirely in the questions you ask before the needle goes in.`,

  'how-much-does-nad-plus-iv-therapy-cost': `## Why NAD+ pricing varies so much (the 4 main drivers)

If you call ten clinics asking the price of "an NAD+ IV," you will get ten different answers spanning roughly $250 to $1,500. That is not a bug in the market. It is the market. Four variables explain almost all of the spread.

**1. Dose.** The single biggest driver. "NAD+ IV" is not one product. Clinics typically offer 100mg "intro" sessions, 250mg "standard" infusions, 500mg "loading" or "executive" sessions, and 1000mg "extended" protocols. A 1000mg session contains ten times the active ingredient of an intro dose and takes three to four hours to infuse instead of sixty to ninety minutes. Before you compare two clinics, confirm you are comparing the same dose in milligrams.

**2. Source and compounding.** Pharmaceutical-grade NAD+ in the United States comes from registered 503A compounding pharmacies (patient-specific prescriptions) or 503B outsourcing facilities (office-use batches manufactured under cGMP standards). Per FDA guidance, 503B facilities must validate every process under current Good Manufacturing Practice, the same regulations followed by major pharmaceutical manufacturers. That quality costs money. Anything priced under roughly $300 for a meaningful dose is statistically likely to be diluted, underdosed, or sourced from gray-market suppliers outside the registered compounding system. Pharmaceutical-grade product is not optional with an IV push of this size.

**3. Market and location.** Geography is brutal. Treatments cost $600 to $1,000 or more per session in New York and Los Angeles, while mid-size cities average $300 to $500. San Francisco, Bay Area suburbs, Miami, Scottsdale, and Bethesda also command premium pricing, often 30 to 50 percent above Houston, Phoenix, or Atlanta for an identical dose. Real estate, malpractice carrier rates, and what the local clientele will pay drive most of that delta.

**4. Setting and supervision.** An RN-supervised storefront drip lounge has the leanest cost structure and typically the lowest price. Concierge mobile services that bring the IV to your home or hotel charge a delivery premium. Physician-supervised longevity clinics with full medical intake, baseline labs, and follow-up monitoring sit at the top of the market, because you are paying for the medical workup, not just the bag.

## NAD+ pricing by dose tier (2026 ranges)

Pricing data aggregated across US clinics in 2026 lands in fairly predictable bands once you control for dose.

- **100mg "intro" or "starter":** $200 to $400 per session. Almost always positioned as a marketing tool to onboard customers into a multi-session package. Honest take: 100mg sits below the dose at which most published subjective benefits have been reported. If you walk out feeling nothing, that is not necessarily a placebo failure; it may just be an underdose.
- **250mg "standard":** $300 to $600 per session, sixty to ninety minutes of infusion. This is the most common single-session protocol and what most reputable wellness clinics treat as the entry-level therapeutic dose.
- **500mg "loading" or "executive":** $500 to $900 per session, two to three hours. This is the standard "I actually want to feel something" dose at concierge and longevity clinics. Most clients begin to report the subjective energy, focus, and recovery effects at this tier.
- **1000mg "extended":** $700 to $1,200 or more per session, three to four-plus hours. Reserved for loading protocols, typically three to six sessions over two to three weeks. Side effects (chest pressure, abdominal cramping, flushing, nausea) become noticeably more common at this dose, which is why slow infusion rates matter.

Add-ons stack quickly. A Myers' Cocktail bundle typically adds $75 to $150. Glutathione push adds $50 to $100. Multi-session packages discount per-session pricing 15 to 30 percent, with loading-phase packages of four to six sessions commonly running $1,500 to $6,000.

## How NAD+ compares to oral, sublingual, and nasal NAD precursors

IV is not the only way to raise NAD+ levels, and for many people it is not the most sensible starting point.

- **Oral NAD precursors (NMN, NR):** $30 to $100 per month for supplements containing nicotinamide riboside (NR) or nicotinamide mononucleotide (NMN). Phase 1 pharmacokinetic data places NR oral bioavailability at roughly 50 to 60 percent. NMN sits one biochemical step closer to NAD+ than NR. Both raise NAD+ levels in humans, but at lower peak magnitudes than IV administration.
- **Sublingual NAD+ troches and lozenges:** $100 to $250 per month. Absorption through the oral mucosa beats swallowed pills (which face first-pass liver metabolism), but peak NAD+ levels remain orders of magnitude below IV.
- **Nasal sprays and transdermal patches:** $50 to $200 per month. An emerging category with limited published clinical data and pending longer-term studies. Buyer caution warranted.
- **IV NAD+:** Highest peak NAD+ levels by a wide margin, fastest subjective onset, and by far the most expensive and time-intensive. Worth noting: Dr. Eric Verdin, president of the Buck Institute for Research on Aging, has publicly argued that intact NAD+ is too large to efficiently enter cells and is largely broken down to nicotinamide on its way in. The research community is genuinely split on how much of the IV benefit comes from NAD+ itself versus its metabolites.

Practical translation: for someone simply curious about NAD+, an oral precursor is a defensible lower-cost trial. IV makes more sense for clinically motivated cases (post-surgery recovery, post-viral fatigue, addiction recovery aftercare, neurodegenerative support) or for longevity-curious patients who have already run a serious oral protocol.

## Insurance, HSA/FSA, and out-of-pocket reality

Plan on paying cash. US commercial insurance, Medicare, and Medicaid generally do not cover NAD+ IV therapy. It is classified as elective wellness, not medical treatment, and 2026 has not changed that posture; major payers still consider it investigational.

HSA and FSA reimbursement is technically possible but narrower than clinics often imply. Eligibility requires a Letter of Medical Necessity (LMN) from a treating physician documenting a specific qualifying condition under IRS Publication 502. General "wellness" and "longevity" use cases do not qualify. Documented therapeutic use for conditions such as post-viral chronic fatigue, neurodegenerative support, or addiction recovery aftercare has the strongest chance of being accepted, but reimbursement is not guaranteed and many account administrators will push back even with an LMN on file.

Some clinics offer CareCredit or similar third-party medical financing. Multi-session loading packages are typically paid upfront, which is a meaningful commitment, so confirm refund and cancellation terms before signing.

## How to evaluate if a NAD+ price is fair

The smell test, in dollars:

- **Under $300 for any single session:** Either a sub-therapeutic dose (effectively under 100mg) or a non-pharmaceutical product. Walk away.
- **$300 to $500 for 250mg:** Reasonable wellness-market pricing. Get the dose in writing.
- **$500 to $800 for 500mg:** Mid-market. Expect a named physician medical director and a two-to-three-hour infusion time.
- **$800 to $1,200+ for 1000mg:** Premium longevity-clinic pricing. Expect a comprehensive intake, physician consultation, and post-session follow-up.
- **Multi-session packages discounting more than 40 percent per session:** Either the headline price was inflated to make the discount look bigger, or the clinic is cutting corners on dose or compounding to protect margin. Ask questions.

Three questions worth asking in writing before you pay:

1. *"What is the actual NAD+ dose in milligrams?"* If the front desk cannot or will not put a number on paper, that is your answer.
2. *"Where is the NAD+ sourced and compounded?"* You should hear a specific 503A or 503B pharmacy name, not a vague reference to "a pharmacy partner."
3. *"How fast is the infusion rate?"* Slower is more comfortable. Three to four hours for a 500mg-plus dose is normal. A clinic pushing 500mg in under ninety minutes is probably trading your comfort for table turnover.

One closing caveat worth saying out loud: clinical evidence for NAD+ IV in otherwise healthy adults is still developing. The subjective reports of energy, mental clarity, and recovery are real and consistent enough to take seriously. The longevity-extension and reverse-aging claims, however, outpace what the peer-reviewed literature currently supports. Spend accordingly, and spend on dose and sourcing transparency rather than on marketing.`,

  'iv-therapy-insurance-coverage-united-states': `## The short answer (and why it's so confusing)

Most US health insurance does **not** cover wellness IV therapy. If you walk into a med spa or book a mobile drip for a Myers' Cocktail, NAD+ infusion, hangover recovery bag, immune boost, or beauty drip, you should plan to pay 100% out of pocket. Every major commercial insurer in the country, plus Medicare and Medicaid, classifies these protocols as elective wellness services rather than medically necessary care.

But the same physical procedure, an IV catheter delivering fluids and medication, is fully covered when the clinical context changes. Severe dehydration requiring emergency or observation care, malabsorption disorders like Crohn's and celiac, iron deficiency anemia requiring IV iron, chemotherapy support, lab-documented vitamin deficiencies, IVIG for autoimmune conditions, and hyperemesis gravidarum during pregnancy are all routinely covered. The fluid bag looks identical. The difference lives entirely in the diagnosis code, the setting, and the documentation submitted to the payer.

That is why patients get whiplash trying to research this. A friend's IV antibiotic course was fully paid for. Your sister-in-law's "immune boost" drip cost $250 out of pocket. Both are correct, because insurers do not pay for the bag of fluid. They pay for treatment of a specific, recognized, documented medical condition.

## When IV therapy IS covered by US insurance

When IV therapy is tied to a diagnosed condition and billed with the right CPT and ICD-10 codes, US insurers generally cover it subject to your deductible, coinsurance, and any prior authorization requirements. The most common covered scenarios:

- **Hospital ER or observation for severe dehydration.** CPT 96360 (IV hydration, initial 31 minutes to 1 hour) and 96361 (each additional hour) are the standard hydration codes. CMS coverage rules require that IV hydration be "reasonable and necessary," documented in the medical record, and that the patient's needs cannot be met with oral hydration.
- **IV iron infusions for diagnosed iron deficiency anemia (IDA).** Products like Injectafer, Venofer, Feraheme, and Monoferric are covered with prior authorization at most major insurers, typically after documented failure or intolerance of oral iron. Medicare Part B covers IV iron in the outpatient setting for qualifying conditions including chronic kidney disease on hemodialysis and chemotherapy-related anemia.
- **B12 injections and infusions** for documented deficiency, billed under the D51 ICD-10 series (vitamin B12 deficiency anemia).
- **Vitamin D infusions** for severe, lab-documented deficiency, evaluated case by case.
- **Total Parenteral Nutrition (TPN)** for patients who cannot meet nutritional needs orally or enterally.
- **IVIG (intravenous immunoglobulin)** for primary immunodeficiencies and approved autoimmune indications. Prior authorization is extensive and most plans require step therapy.
- **Chemotherapy and supportive IV fluids** as part of an oncology treatment plan.
- **Outpatient parenteral antimicrobial therapy (OPAT)**, including IV antibiotics for endocarditis, osteomyelitis, and other infections requiring extended IV access. Medicare's Home Infusion Therapy benefit under Part B covers nursing, training, and monitoring for qualifying home infusions.
- **Hyperemesis gravidarum** during pregnancy.

CPT 96365 (therapeutic IV infusion, initial up to 1 hour) and add-on 96366 are the workhorse codes for non-chemotherapy drug infusions. What ultimately decides coverage is the ICD-10 diagnosis attached, the setting (hospital outpatient infusion center, physician office, or home), and whether your prescribing clinician has documented medical necessity in their notes.

## When IV therapy is NOT covered

On the wellness side, the answer is consistent across every major US payer including Aetna, Anthem, Blue Cross Blue Shield plans, Cigna, UnitedHealthcare, Humana, and Kaiser Permanente. The following are routinely denied as elective, investigational, or not medically necessary:

- Myers' Cocktail and other "house" vitamin infusion blends
- NAD+ IV therapy, which payers classify as investigational or experimental
- Hangover and recovery IV drips
- High-dose vitamin C, except in specific oncology-adjunctive research protocols
- Glutathione IV infusions
- Energy, immune, athletic recovery, and beauty drip protocols
- Mobile IV concierge services delivered for wellness purposes
- IV vitamin therapy used as preventive medicine in an asymptomatic patient

Even when a licensed physician orders these for "wellness optimization" or "anti-aging," insurers will reject the claim because there is no recognized medical necessity attached to a covered diagnosis. Some integrative medicine practices will hand you a superbill you can submit yourself, but with the typical wellness ICD-10 codes (such as Z71.3 dietary counseling or R53.83 other fatigue), expect a denial. The insurer is not denying the drug, they are denying the indication.

## Medicare and Medicaid specifics

**Medicare.** Original Medicare covers IV therapy in clinically appropriate settings, including hospital outpatient infusion centers, physician offices, and the home under the Home Infusion Therapy benefit administered through Part B. Covered scenarios include IV antibiotics for OPAT, TPN for patients who cannot eat, IV iron for qualifying conditions, IVIG, and chemotherapy. Patients generally pay 20% of the Medicare-approved amount after the Part B deductible. Medicare does **not** cover wellness IV therapy in any form, including Myers' Cocktails, NAD+, immune drips, or hangover bags. Medicare Advantage plans must cover everything Original Medicare covers but can layer on additional prior authorization and network requirements.

**Medicaid.** Coverage is set state by state, but federal rules require Medicaid programs to cover medically necessary IV therapy for documented conditions. No state Medicaid program covers wellness IV.

**VA and TRICARE.** Both cover IV therapy for service-connected and standard medical conditions following the same medical necessity framework. Wellness IV is excluded.

**Local Coverage Determinations (LCDs).** Medicare contractors (MACs) publish region-specific LCDs that detail covered indications, documentation requirements, and billing rules for hydration and infusion services. If you are an integrative medicine patient exploring IV therapy as adjunctive care, ask your provider's billing office which MAC governs your region and what LCDs apply to the planned service.

## HSA / FSA reimbursement reality

IRS Publication 502 governs which medical expenses qualify for HSA, FSA, and HRA reimbursement, as well as the Schedule A itemized medical deduction. The standard is whether the expense is "primarily to alleviate or prevent a physical or mental disability or illness" and is for the "diagnosis, cure, mitigation, treatment, or prevention of disease."

Applied to IV therapy, this means:

- IV therapy used to treat a **diagnosed condition** is a qualified expense.
- IV therapy used for **general wellness, energy, beauty, longevity, or recovery** without a tied diagnosis is generally not a qualified expense, even if your card runs at the point of sale.

A **Letter of Medical Necessity (LMN)** from a treating physician can convert some borderline expenses to qualified status. A defensible LMN names the specific condition being treated, references supporting labs or clinical findings, explains why IV therapy is appropriate versus oral or alternative treatment, and is dated **before** the service.

Reasonable HSA/FSA reimbursement odds:

- IV iron for diagnosed IDA (clearly qualified)
- IV vitamin B12 for documented deficiency (clearly qualified)
- IV nutrient therapy for diagnosed malabsorption such as Crohn's, celiac, or post-bariatric (qualified with LMN)
- Post-chemotherapy supportive IV (qualified)
- Chronic fatigue or post-COVID symptoms with a documented diagnosis plus LMN (variable, plan dependent)

Scenarios that typically do **not** qualify:

- General wellness or immune boost drips
- NAD+ longevity infusions
- Hangover and recovery drips
- Pre-event beauty drips and athletic enhancement bags

Keep documentation in case of audit: an itemized superbill listing CPT codes and J-codes, the LMN from the prescribing physician, the diagnosis (ICD-10) tied to the service, and proof of payment. HSA and FSA misuse can trigger back taxes plus a 20% additional tax on non-qualified distributions if disallowed, so the documentation discipline matters.

## What to do if you want partial reimbursement

If you want to pursue any reimbursement, the playbook is the same whether you are filing with commercial insurance, an HSA, or an FSA.

1. Get a written diagnosis from your PCP or specialist documenting any condition that IV therapy could plausibly address (IDA, B12 deficiency, vitamin D deficiency, malabsorption, post-COVID fatigue, migraine, hyperemesis, dehydration secondary to GI illness).
2. Ask your IV provider for an itemized superbill with the appropriate CPT codes (such as 96365 for therapeutic infusion, 96374 for IV push, 96360 for hydration) and J-codes for any specific drugs, paired with ICD-10 codes that match your diagnosis.
3. Submit to your insurance for out-of-network reimbursement. Even when denied, the documented spend can sometimes apply toward your out-of-network deductible.
4. For HSA or FSA, obtain the physician's Letter of Medical Necessity **before** the IV session, not after, and keep it with your tax records for at least three years.

Bottom line: paying out of pocket for wellness IV therapy is the realistic baseline in 2026. Plan accordingly, and treat any reimbursement as upside rather than expected.`,

  'hsa-fsa-iv-therapy-reimbursement-united-states': `## How HSA/FSA actually work (the basics that matter for IV therapy)

Health Savings Accounts (HSAs) and Flexible Spending Accounts (FSAs) are both tax-advantaged vehicles for paying medical expenses, but they work differently and that difference matters when you're trying to fund IV therapy.

An **HSA** is tied to enrollment in a High-Deductible Health Plan (HDHP). Contributions are pre-tax, the account is yours (it stays with you when you change jobs), and unused funds roll over indefinitely. For 2026, the IRS set the HSA contribution limit at **$4,400 for self-only coverage and $8,750 for family coverage**, with an additional $1,000 catch-up contribution allowed at age 55. To qualify, your HDHP must have a deductible of at least $1,700 self-only or $3,400 family.

An **FSA** is employer-sponsored and operates on a use-it-or-lose-it basis with limited carryover. For 2026, the health FSA contribution limit is **$3,400, with up to $680 in unused funds rolling over** to the next plan year if your employer permits. Contributions are also pre-tax via payroll deduction.

Both accounts can pay for "qualified medical expenses" (QMEs) as defined in IRS Publication 502. The publication defines medical care as amounts paid "for the diagnosis, cure, mitigation, treatment, or prevention of disease, or for the purpose of affecting any structure or function of the body."

That definition is the entire ballgame for IV therapy. The single question every HSA/FSA user needs to answer before swiping their benefits card at a drip bar is: **does the specific service I'm buying actually meet the Pub 502 standard?** The answer is "sometimes," and the documentation you can produce on demand determines whether that answer holds up.

## What IV therapy expenses qualify (and what doesn't)

The IRS doesn't publish a line-item list of which IV bags are deductible. Instead, qualification flows from medical necessity tied to a documented condition. Here's the practical split:

**Generally qualified (no Letter of Medical Necessity typically needed):**
- IV iron infusions for diagnosed iron-deficiency anemia (Injectafer, Venofer, Feraheme)
- IV vitamin B12 for documented B12 deficiency
- IV hydration for medically diagnosed dehydration (post-stomach flu, hyperemesis gravidarum, severe gastroenteritis)
- IV antibiotics under physician order (Outpatient Parenteral Antimicrobial Therapy)
- IVIG (intravenous immunoglobulin) for diagnosed autoimmune conditions
- Chemotherapy-related IV fluids and medications
- Total Parenteral Nutrition (TPN) for documented malabsorption

**Generally not qualified:**
- "Wellness" IV therapy such as the Myers' Cocktail or "immune boost" drips
- NAD+ IV therapy marketed for longevity or anti-aging
- Hangover recovery drips
- Pre-event "beauty" or "glow" IV drips
- Mobile concierge IV for general wellness
- Energy or athletic performance drips

**May qualify with a Letter of Medical Necessity:**
- IV nutrient therapy for documented chronic fatigue syndrome or long COVID
- IV magnesium for documented migraine prevention when conventional treatments have failed
- IV nutrient therapy for documented malabsorption (Crohn's, celiac, post-bariatric surgery)
- Mobile IV when medically necessary (elderly, mobility-limited, severe nausea preventing oral intake)

The operating principle: IRS Publication 502 requires the expense to be for "diagnosis, cure, mitigation, treatment, or prevention of disease." Wellness optimization and general health maintenance do not meet that bar. Documented medical conditions with conventional clinical recognition do.

## The Letter of Medical Necessity (LMN) — what makes one work

A Letter of Medical Necessity is the documentation that can convert an otherwise non-qualified expense into a qualified one. Most major HSA/FSA administrators (Optum Bank, HSA Bank, HealthEquity, WageWorks/Inspira, Fidelity) accept LMNs as supporting documentation, but the IRS standard is what governs an audit, not the administrator's intake process.

**What a strong LMN includes:**
- Patient name and date of birth
- Specific diagnosis with ICD-10 code preferred
- Specific treatment recommended (IV vitamin C, IV NAD+, IV iron, IV magnesium, etc.)
- Clinical reasoning for why this treatment is medically necessary for this patient's condition
- Why alternative treatments (oral supplementation, dietary modification, prescription medications) are insufficient
- Duration of treatment recommended (e.g., "monthly IV magnesium infusions for 6 months")
- Prescribing physician's name, license number, signature, and date
- Issued **before** the treatment expense is incurred

Per most HSA/FSA administrator policies, a new LMN is generally required each plan year because services cannot be approved indefinitely.

**What makes an LMN weak (and likely to fail in audit):**
- Vague language like "patient would benefit from IV nutrient therapy"
- No specific diagnosis or ICD-10 code
- Signed by a non-treating or non-licensed provider (chiropractor and "wellness coach" signatures for IV therapy carry little weight)
- Generic template language that could apply to any patient
- Issued after the fact at the patient's request

A real LMN from an established treating physician typically costs nothing beyond the office visit ($50 to $200 if you don't have an existing relationship). Some integrative medicine practices include LMN drafting in their consultation fee, but a paid-on-demand LMN from a provider who hasn't evaluated you is exactly the kind of document auditors scrutinize.

## How to actually file for reimbursement (step by step)

1. **Get an LMN from your prescribing physician** before the treatment — or skip this step if your expense is unambiguously qualified, such as IV iron for diagnosed iron-deficiency anemia.
2. **Pay for the IV therapy upfront.** Most wellness clinics do not accept HSA/FSA debit cards directly because their merchant category code (MCC) doesn't match a recognized medical provider. Some medically-oriented infusion centers do.
3. **Request an itemized superbill** from your provider. It must include the provider's tax ID (EIN), CPT codes (96365 for initial IV infusion, 96374 for IV push, etc.), ICD-10 diagnosis codes, itemized charges, and date of service.
4. **Submit to your HSA/FSA administrator** through their app or web portal. Upload the superbill, the LMN if applicable, and proof of payment (itemized receipt or credit card statement).
5. **Wait for processing.** FSA reimbursements typically take 3 to 10 business days. HSA reimbursements are faster because you control the distribution directly from your own account.
6. **Keep your records for at least 7 years.** Save the LMN, superbill, payment proof, and your physician's chart note supporting the diagnosis. HSA audits can reach back this far, and the burden of proof is on you.

## Audit risk and common mistakes that get reimbursements clawed back

Most denied or clawed-back IV therapy reimbursements come from a small set of repeat failure modes:

- **Submitting a "wellness IV" with no LMN.** The single most common rejection. A receipt that says "Myers' Cocktail" with no supporting documentation is a near-automatic denial.
- **LMN issued after the expense.** Auditors flag dates that don't sequence correctly. The clinical recommendation must predate the treatment.
- **No diagnosis code on the superbill.** Without an ICD-10 code, there is nothing tying the expense to a medical necessity. A receipt that lists only a procedure or product name is not enough.
- **Provider isn't a licensed medical professional in your state.** Signatures from wellness coaches, unlicensed assistants, or out-of-state providers without a valid practice license do not meet the Pub 502 standard for a medical practitioner.
- **Same wellness service framed differently.** Calling NAD+ "longevity support" versus "post-COVID neurological symptom management" doesn't change the underlying IRS analysis. The LMN must be clinically credible, not creatively worded.
- **Mixing qualified and non-qualified services on one receipt.** If your IV visit includes a qualified magnesium infusion and a non-qualified glutathione add-on, only the qualified portion is reimbursable. Itemization matters.
- **Failure to keep documentation.** If the IRS or your administrator requests records you no longer have, the expense gets disallowed. For HSAs, ineligible distributions trigger ordinary income tax plus a **20% additional tax** under IRC Section 223(f)(4) (the penalty is waived after age 65, death, or disability). FSA reimbursements that turn out to be ineligible are typically adjusted through payroll rather than penalized, but the money still has to be paid back.

The practical takeaway: HSA/FSA reimbursement for IV therapy works cleanly when the IV is treating a real, documented condition that conventional medicine recognizes. For pure wellness drips, expect to pay out-of-pocket. The tax-advantaged route is reserved for genuine medical use cases, and trying to game it usually costs more in audit risk than the tax savings are worth.`,

  'iv-therapy-package-deals-membership-guide': `## The 3 package structures you'll see in 2026

Walk into any IV therapy clinic in 2026 and you'll be offered one of three commitment models. They're not all equivalent, and the "savings" math works very differently for each.

**1. The drip pack (session bundle)**

This is the classic pre-pay structure: you buy a block of 4, 6, or 10 sessions upfront at a 15-30% discount versus the à la carte rate. Upfront cost typically lands somewhere between $800 and $3,000 depending on the drip tier (basic hydration on the low end, Myers' Cocktails in the middle, NAD+ packs at the top). Most reputable clinics keep these non-expiring or give you 12 months, though some shorten the window to 3-6 months — which materially changes whether the discount is real. Best for: people who've already done a few individual sessions, know IV therapy works for their specific goal, and have a defined protocol in mind.

**2. The monthly membership**

Roughly $99-249/month gets you one included drip plus 10-20% off additional drips, add-ons, and sometimes a guest pass or two per year. National franchise chains — Restore Hyper Wellness, Prime IV Hydration, The DRIPBaR, IV Bars, Hydrate IV Bar — built their business model on this structure. Some chains use a credits system (base drip = X credits, IM shot = Y credits, recovery service = Z credits) which obscures the true per-drip cost; others keep it simple with one included drip per month. Best for: people who'll genuinely use it once a month or more. Below that frequency, you're paying for convenience you're not consuming.

**3. The concierge / near-unlimited model**

The premium tier: $299-999+/month for high-volume access, typically capped at weekly or biweekly rather than truly unlimited. You'll find this almost exclusively at longevity clinics in SF, NYC, LA, Miami, and a few other major metros. It's often bundled with executive physical, quarterly lab work, and selection from a wider IV menu including specialty bags. Best for: high-frequency users (4+ sessions per month) who'd otherwise spend $1,200+ in à la carte fees.

**What's typically excluded across all three structures:** NAD+ is almost never included in basic memberships or low-tier packages — it's billed separately because of its higher ingredient cost. Add-ons like glutathione, biotin pushes, and B12 boosters are usually extra. Mobile delivery (in-home or in-hotel) is virtually always a separate fee on top of the drip price, even for members.

## When packages make financial sense (and when they don't)

Packages aren't inherently good or bad — they're a financial commitment, and the math either works for your usage pattern or it doesn't.

**A package makes sense when:**
- You've already done 2-3 individual sessions and know IV therapy works for your specific goal (energy, recovery, immune support, hangover, athletic performance).
- You're treating a defined condition that requires a multi-session protocol (NAD+ loading for cognitive support, IV nutrient therapy for chronic fatigue, scheduled pre/post-surgical recovery drips).
- You'd otherwise be paying à la carte rates at the same clinic anyway.
- The clinic has a strong reputation and you trust it will still be operating in 12 months.

**A package doesn't make sense when:**
- It's your first IV ever. Start with one session and see how your body actually responds before committing to ten.
- You're being pressured to buy at the chair before any clinical consultation has happened.
- The "discount" only triggers if you commit to weekly visits you won't realistically make.
- The expiration window forces you to use the package within 3-6 months at a cadence faster than you actually want.
- You haven't compared total cost vs. per-session pricing at 2-3 other local clinics.

**The math people don't do:** A 6-pack of Myers' Cocktails priced at $1,200 ($200/session vs. $275 à la carte) looks like a $450 savings — IF you use all six. If you only use four, you've spent $1,200 on $1,100 worth of drips ($275 × 4). The break-even on most packages is somewhere between sessions four and five. Use fewer than that and the "discount" package actually cost you more per used session than à la carte would have.

## Membership math — what the chains don't advertise

National franchise chains have refined the membership model into a profit engine, and the unit economics tell you exactly how. Restore Hyper Wellness, the largest player, runs tiered memberships that vary by metro — generally landing in the $99-250/month range for entry tiers and climbing to $300-450+ for top tiers in major cities, often using a credits system where one base IV consumes about half of a mid-tier monthly allotment. Prime IV, IV Bars, Hydrate IV Bar, and similar chains run comparable structures.

**Hidden friction baked into most chain memberships:**

- **Notice periods of 30-90 days** to cancel are standard. Some chains require 60 days written notice; others demand the request via a specific form. You can't quit mid-month if your schedule changes.
- **Auto-renewal is the default** and the entire business model depends on it. Fewer than 20% of members on most subscription products proactively cancel within any given quarter.
- **The "included drip" is usually basic hydration only.** Want a Myers' Cocktail or anything off the premium menu? That's an upcharge or extra credits.
- **NAD+ is never included** in basic chain memberships. Not at Restore, not at Prime IV, not anywhere at the entry tier.
- **Mobile delivery is not included.** If a chain offers in-home service at all, it's a separate fee on top of the drip and on top of your membership.
- **Sign-up fees of $49-99** are common and erode any first-month savings.
- **Initial commitment terms of 3-12 months** sometimes apply before the standard cancellation policy kicks in.

The honest take: a membership is a good deal if you genuinely commit to going monthly AND you use the included drip without upcharges. It's a bad deal if you sign up for "convenience" and end up with $99-250 auto-billing every month for drips you never claim. The 2026 FTC negative-option rule made cancellation easier on paper — it must now be at least as easy as signup — but enforcement varies and friction still exists. Track your actual usage for three months before deciding whether membership math works for you.

## Red flags in package/membership sales

Some sales tactics are reliable indicators that a clinic prioritizes revenue over clinical care. Watch for:

- **Pressure to buy at the chair** before treatment even begins — legitimate clinics let you experience the service first.
- **"Today only" pricing** that disappears if you don't sign immediately. High-pressure, scarcity-driven tactic.
- **No written cancellation policy** or vague language like "30 days notice required" with no instructions on how to actually cancel.
- **Auto-renewal buried in fine print** rather than presented as a clear opt-in checkbox.
- **Short expiration windows** — a 10-session package that expires in 3 months forces a cadence you may not want medically or logistically.
- **"Lifetime membership" deals** at unfamiliar or newly opened clinics. These vanish when the clinic closes, and there's no recourse.
- **Bundled non-IV services** you didn't ask for: vitamin shots, "wellness coaching," supplement packages, recovery modalities.
- **NAD+ marketed at suspiciously low package prices.** If a clinic is offering $200/session NAD+ in a 6-pack, the dose is almost certainly sub-therapeutic.
- **No medical director listed on the website** but an aggressive packaging push — strongly suggests the clinic is run by sales, not clinicians.
- **Cash-only with no refund policy.** If you can't get money back for an unused package, walk away.

## Questions to ask before buying any package

Before you hand over a card, get clear answers — in writing — to all ten of these:

1. What's the cancellation policy in writing? Can I cancel before the expiration date and receive a partial refund?
2. Do sessions expire? If so, on what date?
3. Are add-ons (glutathione, NAD+, biotin, B12 boosters) included or extra?
4. Is mobile delivery included or extra?
5. Can the package be transferred to another person?
6. What happens to unused sessions if the clinic closes or sells?
7. Is the medical director's name on the contract?
8. Can I see the standard menu pricing side-by-side with the package per-session price (the real discount math, not the marketing number)?
9. Will I be auto-renewed at the end of the term, and what's the exact process to prevent that?
10. Are there blackout dates, appointment restrictions, or location limits?

If a clinic can't answer all ten clearly and in writing, the package isn't worth your money — regardless of how attractive the headline discount looks.`,
};

(async () => {
  const summary = [];
  for (const [slug, contentBlock] of Object.entries(CONTENT)) {
    const { data: post } = await sb.from('blog_posts').select('id, content').eq('slug', slug).single();
    if (!post) { console.log('  ! Not found:', slug); continue; }

    const wrappedSection = `${PHASE2_START}\n\n${contentBlock.trim()}\n\n${PHASE2_END}`;
    let newContent;
    const existing = String(post.content || '');

    if (existing.includes(PHASE2_START) && existing.includes(PHASE2_END)) {
      const before = existing.split(PHASE2_START)[0].trimEnd();
      const after = existing.split(PHASE2_END)[1] || '';
      newContent = `${before}\n\n${wrappedSection}${after}`;
    } else {
      newContent = `${existing.trimEnd()}\n\n${wrappedSection}\n`;
    }

    const { error } = await sb.from('blog_posts').update({
      content: newContent,
      last_updated: new Date().toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString().slice(0, 10),
    }).eq('id', post.id);
    if (error) { console.log('  ! Update failed:', slug, error.message); continue; }

    const newWords = newContent.split(/\s+/).filter(Boolean).length;
    const oldWords = existing.split(/\s+/).filter(Boolean).length;
    summary.push({ slug, oldWords, newWords });
    console.log(`✓ ${slug.padEnd(50)}  ${oldWords} → ${newWords} (+${newWords - oldWords})`);
  }
  console.log('\nTier A injection complete:', summary.length, 'posts.');
})();
