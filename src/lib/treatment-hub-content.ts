/**
 * Treatment-hub editorial content (Move 1 of the 2026-08-15 CEO audit).
 *
 * The 19 /treatments/[slug] hubs are the money pages and were 290-word shells.
 * This map gives each hub honest-triage editorial in the house voice: a
 * verdict grounded in the published trust cluster (linked, not restated),
 * what is typically in the drip (labeled as OUR normalization), FAQs that
 * become FAQPage schema, and the trust links. Assembled server-side in
 * app/treatments/[service]/page.tsx together with live captured price data.
 *
 * Voice rules (docs/research + GOAL Trusted Source Plan): honest triage
 * ("makes sense for X, skip for Y"), no health claims we cannot cite, no
 * dashes, prescription topics defer to prescribers, never clinic-marketing.
 */

export interface TreatmentHub {
  /** canonical slug from app/treatments/[service]/page.tsx SERVICES */
  slug: string;
  /** drip-vocabulary formula id for live captured-price stats (null = no capture) */
  formulaId: string | null;
  /** 2-3 short paragraphs, the honest verdict. Rendered as-is. */
  verdict: string[];
  /** typical contents line, labeled as our normalization (optional) */
  typicallyIn?: string;
  /** FAQPage entries (3+ each) */
  faqs: { q: string; a: string }[];
  /** trust-cluster links rendered under the verdict */
  links: { href: string; label: string }[];
}

const VERIFY = { href: '/blog/how-to-verify-iv-provider-license-canada-2026', label: 'How to verify any provider on a public register' };
const WHO_NOT = { href: '/blog/who-should-not-get-iv-therapy-canada-2026', label: 'Who should not get IV therapy' };
const VERDICTS = { href: '/blog/iv-drip-verdicts-evidence-2026', label: 'Drip-by-drip evidence verdicts' };
const CHECKLIST = { href: '/blog/iv-therapy-checklist-before-you-book-2026', label: 'The 10-point checklist before you book' };
const IV_VS_ORAL = { href: '/blog/iv-vs-oral-vitamins-absorption-canada-2026', label: 'IV versus oral: the honest absorption story' };

export const TREATMENT_HUBS: Record<string, TreatmentHub> = {
  'nad-plus': {
    slug: 'nad-plus', formulaId: 'nad_infusion',
    verdict: [
      'NAD+ is the most expensive drip on most Canadian menus and the one where the marketing runs furthest ahead of the evidence. The molecule is real and important; the longevity claims attached to a 500 dollar infusion are not established in human trials, and infusions are commonly uncomfortable enough that clinics run them over several hours.',
      'A reasonable person can find the research fascinating and still note that oral precursors cost a small fraction as much, and that the meaningful clinical benefits remain unproven for both routes. If you book anyway, screening matters more here than for lighter drips.',
    ],
    faqs: [
      { q: 'Does NAD+ IV therapy work?', a: 'NAD+ biology is a legitimate research field, but human evidence so far, mostly on oral precursors, shows raised blood levels with limited and inconsistent effects on outcomes that matter. No regulator has approved NAD+ therapy for aging or longevity. Our NAD+ guide covers the dosing tiers and evidence in detail.' },
      { q: 'How much does NAD+ IV cost in Canada?', a: 'Typically 250 to 1,000 dollars or more per session depending on dose, with clinics commonly recommending an initial series. It is the highest-priced item on most menus, which is worth weighing against the state of the evidence.' },
      { q: 'Why do NAD+ infusions take so long?', a: 'Because infusing NAD+ quickly is uncomfortable. Chest tightness, cramping and nausea are commonly reported at faster rates, so clinics run sessions over two to four hours or more. The length is side-effect management, not a sign of potency.' },
    ],
    links: [
      { href: '/blog/nad-iv-therapy-canada-dosing-safety-evidence-2026', label: 'NAD+ in Canada: dosing, safety and cost' },
      { href: '/blog/nad-plus-iv-therapy-cellular-longevity-guide', label: 'NAD+ and longevity: what is known and what is sold' },
      VERDICTS, WHO_NOT,
    ],
  },
  hangover: {
    slug: 'hangover', formulaId: 'hangover',
    verdict: [
      'The honest version: a hangover drip rehydrates you faster than drinking, and that is the part it genuinely fixes. It does not clear the alcohol byproducts that cause most of the misery, which resolve on their own schedule. Neutral reviewers land on a one-word verdict: maybe.',
      'Where it earns its price is speed on a day you cannot afford to be horizontal, or genuine inability to keep fluids down. Where it does not is as a cure, and a clinic using that word is telling you about its marketing.',
    ],
    faqs: [
      { q: 'Do hangover IV drips actually work?', a: 'They treat the dehydration component quickly, and anti-nausea medication where included does real work. They do not remove the metabolic byproducts of alcohol that drive most symptoms. For most people, fluids, food and time do the same job at almost no cost.' },
      { q: 'How much does a hangover IV cost in Canada?', a: 'Published Canadian menus typically run 150 to 300 dollars, with mobile services charging a premium to come to you.' },
      { q: 'Is a hangover drip safe?', a: 'For most healthy adults the risks are the ordinary ones of any IV. The better questions are who is administering it, who prescribed any medication in the bag, and whether anyone screened your history. People with kidney or heart conditions should talk to a doctor first.' },
    ],
    links: [
      { href: '/blog/science-of-iv-therapy-for-hangover-recovery', label: 'Hangover IVs: what they fix and what they cannot' },
      VERDICTS, CHECKLIST,
    ],
  },
  'immune-support': {
    slug: 'immune-support', formulaId: 'immune',
    verdict: [
      'Your immune system is not a fuel tank. Correcting a genuine nutrient deficiency helps immunity; adding surplus to a well-nourished body mostly produces excretion, and neutral reviews of the category describe the evidence for wellness immune drips as thin.',
      'One specific question separates careful clinics: what they do about G6PD deficiency before high-dose vitamin C, where hemolysis is documented. A clinic that engages with that question is showing you how it operates.',
    ],
    faqs: [
      { q: 'Do immune IV drips prevent colds?', a: 'There is no good evidence that vitamin infusions make well-nourished people get sick less. Deficiency correction helps; surplus mostly gets excreted. Sleep, vaccination and hand hygiene remain the unglamorous things that actually move the needle.' },
      { q: 'What is in an immune drip?', a: 'Typically vitamin C at gram doses, zinc and B vitamins in saline, though recipes vary by clinic and are not standardized. Ask for the specific ingredient list and doses rather than the menu name.' },
      { q: 'Is high-dose vitamin C safe?', a: 'The one well-documented risk is hemolysis in people with G6PD deficiency, most of whom did not know they had it before reacting. Asking a clinic what they do about G6PD before a gram-dose vitamin C infusion is a fair and revealing question.' },
    ],
    links: [
      { href: '/blog/iv-therapy-immune-support', label: 'Immune drips: what the evidence actually supports' },
      WHO_NOT, IV_VS_ORAL,
    ],
  },
  'cold-and-flu': {
    slug: 'cold-and-flu', formulaId: 'immune',
    verdict: [
      'Cold and flu drips are immune drips with a seasonal label: vitamin C, zinc and B vitamins in fluids. The fluids help if you are genuinely struggling to drink; the vitamins have not been shown to shorten a cold in people who are not deficient.',
      'If you are sick enough to consider an IV, you are sick enough that a phone call to your clinic or pharmacist is the better first move, and influenza in higher-risk people has actual treatments with actual timing windows.',
    ],
    faqs: [
      { q: 'Will an IV drip cure my cold or flu?', a: 'No. The evidence does not support vitamin infusions shortening or curing viral illness in well-nourished people. Rest and fluids remain the honest core of care, and higher-risk people with influenza should ask about antiviral treatment promptly rather than booking a drip.' },
      { q: 'Can an IV help if I cannot keep fluids down?', a: 'Genuine inability to hold fluids down is a medical situation, and IV rehydration is real medicine for it, in a setting with assessment and monitoring. That is different from a wellness drip for a rough cold.' },
      { q: 'What should I ask before a sick-day drip?', a: 'What is in the bag by ingredient, who is administering and who prescribed, and what screening they do. Our pre-booking checklist covers all ten questions worth asking.' },
    ],
    links: [
      { href: '/blog/iv-therapy-immune-support', label: 'Immune drips: what the evidence actually supports' },
      CHECKLIST, WHO_NOT,
    ],
  },
  'beauty-glow': {
    slug: 'beauty-glow', formulaId: 'beauty',
    verdict: [
      'Beauty drips bundle biotin, glutathione and vitamin C under names like glow and radiance. The claims are cosmetic, the evidence is thin, and the specific skin-whitening pitch attached to glutathione carries an actual regulatory record: no injectable drug is approved for skin lightening by the US FDA, and Canada has had documented contamination incidents with injectable glutathione supplied to clinics.',
      'If you are considering one anyway, the highest-value question is where the product in the vial is compounded.',
    ],
    faqs: [
      { q: 'Do beauty IV drips work for skin and hair?', a: 'The marketed effects are not established in good clinical evidence. Where people report changes with glutathione they are described as gradual and temporary, which makes any effect an ongoing paid subscription rather than a result.' },
      { q: 'Is glutathione IV safe for skin brightening?', a: 'No injectable is approved for skin whitening by the US FDA, which warns these are unapproved products with real risks. The most serious documented harms in Canada came from contaminated product, which is why asking where the vial is compounded matters more than the menu.' },
      { q: 'What is in a beauty drip?', a: 'Typically biotin, glutathione and vitamin C in fluids, though recipes vary and are not standardized. Ask for the actual ingredient list and doses.' },
    ],
    links: [
      { href: '/blog/glutathione-iv-therapy-benefits', label: 'Glutathione: the claims, the evidence, the safety record' },
      VERDICTS, CHECKLIST,
    ],
  },
  glutathione: {
    slug: 'glutathione', formulaId: 'glutathione_push',
    verdict: [
      'Glutathione is a real molecule your cells make and use constantly, which is what makes the marketing plausible. The clinical evidence for the marketed benefits of infusing it, brighter skin, detoxification, slowed aging, has not caught up with the theory, and the skin-whitening pitch specifically is one the US FDA has warned against.',
      'The serious documented harms in Canada in this category were about the product, not the needle: contaminated injectable glutathione supplied to clinics triggered a Health Canada recall. Where the vial comes from is the question that maps onto real risk.',
    ],
    faqs: [
      { q: 'What does glutathione IV actually do?', a: 'It delivers the molecule directly to your blood. Whether that produces the marketed benefits is the unestablished part; your body also synthesizes its own glutathione from dietary protein. The honest summary is real molecule, unproven claims.' },
      { q: 'How much does glutathione IV cost?', a: 'Usually 80 to 200 dollars per session as a push or add-on on published Canadian menus, with clinics commonly recommending a series, which multiplies the real cost.' },
      { q: 'Is glutathione IV safe?', a: 'Reactions to properly made product are usually minor. The documented serious harms in Canada came from contaminated, unauthorized product, which is why asking where it is compounded is the single most useful question before this particular drip.' },
    ],
    links: [
      { href: '/blog/glutathione-iv-therapy-benefits', label: 'Glutathione: the claims, the evidence, the safety record' },
      VERDICTS, VERIFY,
    ],
  },
  'weight-loss': {
    slug: 'weight-loss', formulaId: 'weight_loss',
    verdict: [
      'Weight-loss drips are usually MIC lipotropic blends with B12. The evidence that these produce meaningful weight loss is weak, and the honest mechanism review is short: nothing in a vitamin drip changes energy balance.',
      'Prescription weight-loss medication is a different category entirely, is genuinely effective for many people, and belongs with a prescriber who assesses you, not with a drip menu.',
    ],
    faqs: [
      { q: 'Do weight loss IV drips work?', a: 'The MIC and B12 blends sold as weight-loss drips have weak evidence and no plausible mechanism for meaningful weight change on their own. If a clinic pairs them with a supervised program, ask what the program actually is, because that is where any effect would come from.' },
      { q: 'What about semaglutide or other GLP-1 drugs?', a: 'Those are prescription medications with real evidence and real medical management requirements, prescribed after assessment by a licensed prescriber. They are not wellness drips, and any clinic offering them should have a named prescriber you can look up on a public register.' },
      { q: 'What is in a weight-loss drip?', a: 'Typically methionine, inositol and choline, the MIC blend, plus B12. Ask for the exact contents and what evidence the clinic can point to for the combination.' },
    ],
    links: [VERDICTS, WHO_NOT, VERIFY],
  },
  'glp-1-weight-loss': {
    slug: 'glp-1-weight-loss', formulaId: null,
    verdict: [
      'GLP-1 medications are prescription drugs, full stop. They have genuine evidence for weight loss and genuine requirements: an assessment by a licensed prescriber, an individual prescription, monitoring, and a plan for side effects. That is medical care, not a drip-bar add-on.',
      'If a clinic offers GLP-1 support, the questions are simple: who is the prescriber, are they registered in your province, and do they assess you individually before prescribing? All three are checkable on public registers in minutes.',
    ],
    faqs: [
      { q: 'Can I get semaglutide at an IV clinic in Canada?', a: 'Only through a licensed prescriber issuing an individual prescription after assessing you. A clinic offering it should name its prescriber, and you can verify that person on your provincial college register before booking. Regulators have specifically warned against figurehead medical-director arrangements.' },
      { q: 'Do GLP-1 medications work for weight loss?', a: 'The prescription GLP-1 class has strong clinical trial evidence for weight loss under medical management. That is exactly why it is prescription-only: dosing, side effects and follow-up need a clinician who knows you.' },
      { q: 'How do I check who is prescribing?', a: 'Ask for the prescriber name and look them up on the provincial register: CPSO for Ontario physicians, your province’s college of nurses for NPs. Our step-by-step guide links every register.' },
    ],
    links: [VERIFY, WHO_NOT, CHECKLIST],
  },
  hydration: {
    slug: 'hydration', formulaId: 'hydration',
    verdict: [
      'The plainest thing on any menu, and the best supported: fluids delivered to a vein rehydrate you, full stop. The equally honest half is that for most people, drinking works as well at almost no cost.',
      'The genuine use case is someone who cannot keep fluids down, which is a medical situation. If you can drink, what an IV adds is speed and a chair.',
    ],
    faqs: [
      { q: 'Is IV hydration better than drinking water?', a: 'It is faster, because it bypasses digestion. For most mildly dehydrated people the outcome is the same as drinking fluids, which neutral reviewers point out costs almost nothing. The IV earns its price when speed genuinely matters or drinking is not possible.' },
      { q: 'How much does a hydration IV cost in Canada?', a: 'Typically 100 to 200 dollars on published menus, the least expensive item in most clinics.' },
      { q: 'When is IV hydration medically necessary?', a: 'When someone cannot hold fluids down, from illness, vomiting or severe dehydration. That situation belongs in a medical setting with assessment, and in pregnancy it specifically belongs with your obstetric provider.' },
    ],
    links: [VERDICTS, WHO_NOT, CHECKLIST],
  },
  recovery: {
    slug: 'recovery', formulaId: 'athletic',
    verdict: [
      'Athletic recovery drips bundle fluids, amino acids, B vitamins and magnesium. Rehydration after serious exertion is real; the evidence that the added ingredients speed recovery beyond what food, fluids and sleep already do is not established.',
      'Serious athletes should also know exactly what is in the bag: supplement contamination is a real anti-doping risk, and an unlisted ingredient is a bigger problem for a tested athlete than for anyone else.',
    ],
    faqs: [
      { q: 'Do recovery IV drips speed up muscle recovery?', a: 'Rehydration helps if you finished genuinely depleted. Beyond that, evidence that IV amino acids or vitamins outperform normal food, fluids and sleep for recovery is lacking. The honest benefit is convenience and speed of rehydration.' },
      { q: 'Are IV drips allowed for competitive athletes?', a: 'Anti-doping rules restrict IV infusions above certain volumes for tested athletes regardless of contents, and unlisted ingredients are a contamination risk. Tested athletes should check their sport’s rules before any infusion.' },
      { q: 'What is in an athletic recovery drip?', a: 'Typically saline, amino acids, B complex and magnesium, varying by clinic. Ask for the exact list, and if you are a tested athlete, get it in writing.' },
    ],
    links: [VERDICTS, CHECKLIST, WHO_NOT],
  },
  'myers-cocktail': {
    slug: 'myers-cocktail', formulaId: 'myers',
    verdict: [
      'The original wellness drip: magnesium, calcium, B vitamins and vitamin C. There is no standard recipe, and the clearest neutral assessment, from the US National Capital Poison Center, is that the Myers cocktail has not been proven to effectively treat any medical condition, with small mixed trials and one showing no difference from placebo.',
      'It remains the item most clinics sell most of, which says more about the category than the evidence.',
    ],
    faqs: [
      { q: 'What is in a Myers cocktail?', a: 'Typically magnesium, calcium, several B vitamins and vitamin C in fluids. The recipe is not standardized, so contents differ between clinics, which is a good reason to ask for the specific list where you book.' },
      { q: 'Does the Myers cocktail work?', a: 'Poison Control’s review says it has not been proven to treat any medical condition; trial evidence is small and mixed. People do report feeling better, and fluids plus rest plus expectation are each real contributors to that.' },
      { q: 'How much does a Myers cocktail cost in Canada?', a: 'Typically 150 to 250 dollars on published Canadian menus, with our captured menu data showing real prices in that range.' },
    ],
    links: [
      { href: '/blog/myers-cocktail-iv-therapy-complete-guide', label: 'The Myers cocktail guide' },
      VERDICTS, IV_VS_ORAL,
    ],
  },
  'jet-lag': {
    slug: 'jet-lag', formulaId: null,
    verdict: [
      'Jet lag is a circadian rhythm problem, and there is no evidence a vitamin drip resets your body clock. Hydration after a long flight is reasonable and achievable by drinking; the things that actually shift circadian timing are light exposure, sleep scheduling and time.',
      'If a drip helps you feel better on landing day, that is fluids and rest doing honest work under a fancier name.',
    ],
    faqs: [
      { q: 'Do jet lag IV drips work?', a: 'There is no evidence that IV vitamins shift circadian rhythm, which is what jet lag is. Rehydration after a flight is real but modest, and achievable by drinking. Light exposure and sleep timing are what actually move your body clock.' },
      { q: 'What actually helps jet lag?', a: 'Strategic light exposure, adjusting sleep timing toward the destination, caffeine timing, and short-term melatonin for some people, ideally discussed with a pharmacist or doctor. None of it comes in a bag.' },
      { q: 'Is an IV worth it after a long-haul flight?', a: 'If you value arriving rehydrated quickly and the price does not bother you, it is a comfort purchase, and comfort is real. Just know that is what is being bought.' },
    ],
    links: [VERDICTS, CHECKLIST, WHO_NOT],
  },
  'energy-boost': {
    slug: 'energy-boost', formulaId: 'energy',
    verdict: [
      'Energy drips are B12 and B-complex marketing. B vitamins genuinely matter for energy metabolism, and supplementing genuinely helps people who are deficient. For everyone else, surplus B vitamins are excreted, which is why persistent fatigue deserves bloodwork and a doctor, not a menu.',
      'Fatigue with an actual cause, anemia, thyroid, sleep apnea, depression, gets fixed by treating the cause. A drip can delay that conversation.',
    ],
    faqs: [
      { q: 'Do energy IV drips give you energy?', a: 'If you are deficient in B12 or other B vitamins, correcting that helps, and deficiency is diagnosable with inexpensive bloodwork. If you are not deficient, the surplus is excreted. Persistent fatigue is a reason to see a doctor, because the common causes are treatable and none of them are vitamin shortages in a well-fed adult.' },
      { q: 'Is a B12 drip better than a B12 injection or pill?', a: 'For diagnosed B12 deficiency, standard treatment is inexpensive injections or high-dose oral B12 through your doctor. A wellness drip is the costliest route to the same molecule.' },
      { q: 'What is in an energy drip?', a: 'Typically B12, B complex and sometimes amino acids in fluids. Ask for the specific contents where you book.' },
    ],
    links: [IV_VS_ORAL, WHO_NOT, VERDICTS],
  },
  'iron-infusion': {
    slug: 'iron-infusion', formulaId: 'iron_infusion',
    verdict: [
      'Iron infusion is the odd one out on this page: a genuine medical treatment for diagnosed iron deficiency, prescribed after bloodwork, not a wellness add-on. In hospital it is typically covered; privately it runs 400 to 900 dollars in reported Toronto pricing, and people pay because hospital waits stretch weeks to months.',
      'If a clinic offers you iron without recent bloodwork establishing deficiency, that is a reason to stop. This is the one drip where the referral pathway, the coverage question and the product choice all genuinely matter.',
    ],
    faqs: [
      { q: 'Is an iron infusion covered by OHIP or provincial insurance?', a: 'Generally covered in hospital outpatient settings and generally not at standalone private clinics, with sources differing on exactly how the drug itself is paid in hospital. Confirm with the specific hospital or clinic what you will be billed for. Our iron infusion guide covers the decision tree.' },
      { q: 'How much does a private iron infusion cost?', a: 'Reported Toronto private pricing runs 400 to 900 dollars per session, with single-dose products costing more per visit but often needing only one, and older products costing less per session across several sessions. Compare total course cost, not per-visit price.' },
      { q: 'Do I need bloodwork before an iron infusion?', a: 'Yes. Iron infusion treats diagnosed deficiency, established by ferritin and an iron panel, after a clinician decides oral iron is not the right answer. A clinic that wants your labs before treating you is behaving correctly.' },
    ],
    links: [
      { href: '/blog/iron-infusion-canada-cost-coverage-2026', label: 'Iron infusions in Canada: cost, coverage and waits' },
      VERIFY, WHO_NOT,
    ],
  },
  'vitamin-d': {
    slug: 'vitamin-d', formulaId: null,
    verdict: [
      'Vitamin D is one place the cheap option is also the medically standard one: oral supplementation, guided by bloodwork if there is a question. Vitamin D injections exist for specific malabsorption situations under medical care; there is no established role for vitamin D in wellness IV drips.',
      'If a menu offers vitamin D by IV, ask why, and expect a better answer than absorption.',
    ],
    faqs: [
      { q: 'Can you get vitamin D through an IV?', a: 'Vitamin D is fat-soluble and standard care for low levels is oral supplementation, which is inexpensive and effective. Injections exist for genuine malabsorption cases under medical supervision. A wellness IV is not an established route for vitamin D.' },
      { q: 'Should I test my vitamin D level?', a: 'If you and your doctor suspect deficiency, testing exists and supplementation is cheap. Many Canadians run low in winter, and the fix is a pill measured in cents.' },
      { q: 'Why do clinics offer vitamin D shots?', a: 'Injections are established for specific medical situations, and some clinics offer them more broadly. Whether one makes sense for you is a conversation for a clinician who knows your levels and history.' },
    ],
    links: [IV_VS_ORAL, WHO_NOT, VERIFY],
  },
  'b12-shot': {
    slug: 'b12-shot', formulaId: null,
    verdict: [
      'B12 injections are real medicine for diagnosed B12 deficiency, especially pernicious anaemia, where the gut absorption mechanism itself is broken. That is precisely why B12 for pernicious anaemia is one of the few injectables named in Canada’s medical expense tax credit rules.',
      'For people without deficiency, a B12 shot is the same story as every other vitamin: your body takes what it needs and excretes the rest. Deficiency is cheap to test and cheap to treat through your doctor.',
    ],
    faqs: [
      { q: 'Do B12 shots give you energy?', a: 'They correct fatigue caused by B12 deficiency, which is real and diagnosable. In people with normal levels, evidence for an energy effect is lacking. If fatigue is persistent, bloodwork through your doctor answers the question for a few dollars.' },
      { q: 'How often do you need B12 injections?', a: 'For diagnosed deficiency, your prescriber sets a schedule, often more frequent at first and then maintenance. A wellness clinic cadence is a menu, not a protocol; deficiency treatment belongs with your doctor.' },
      { q: 'Are B12 shots covered or tax deductible in Canada?', a: 'B12 for pernicious anaemia prescribed by a practitioner is one of the specific injectables recognized in the medical expense tax credit rules. Wellness B12 shots generally are not. Our tax guide covers the split.' },
    ],
    links: [
      { href: '/blog/iv-therapy-tax-deductible-canada-2026', label: 'Is IV therapy tax deductible in Canada?' },
      IV_VS_ORAL, VERIFY,
    ],
  },
  'high-dose-vitamin-c': {
    slug: 'high-dose-vitamin-c', formulaId: 'high_dose_c',
    verdict: [
      'IV vitamin C at gram doses genuinely does something oral cannot: it pushes blood levels far above the ceiling your gut and kidneys enforce. That is real physiology, it is why high-dose IV vitamin C is studied in oncology settings under medical supervision, and it is not evidence that the same infusion does anything for a healthy person buying a wellness drip.',
      'The one documented consumer risk is specific: hemolysis in people with G6PD deficiency, most of whom did not know their status. Ask any clinic offering gram-dose vitamin C what they do about G6PD.',
    ],
    faqs: [
      { q: 'What does high-dose IV vitamin C do?', a: 'It raises blood vitamin C far above what oral dosing can achieve, because it bypasses gut absorption limits. Whether those levels benefit a well-nourished person is not established; research interest is concentrated in supervised clinical settings, mostly oncology, not wellness lounges.' },
      { q: 'Is high-dose vitamin C dangerous?', a: 'The well-documented risk is hemolysis in people with G6PD deficiency, an inherited condition most affected patients did not know they had. Kidney stones and kidney strain are also flagged at high doses in susceptible people. Screening questions exist for a reason.' },
      { q: 'Should I be tested for G6PD first?', a: 'That is a question for a doctor. The published case series shows most affected patients were unaware of their status, and the authors called for physician awareness at high doses. Asking the clinic what they do about G6PD is reasonable, and their answer is informative.' },
    ],
    links: [WHO_NOT, IV_VS_ORAL, VERDICTS],
  },
  'migraine-relief': {
    slug: 'migraine-relief', formulaId: null,
    verdict: [
      'Migraine is a neurological condition with real acute treatments and real preventives, and hospital emergency departments do use IV medication protocols for severe attacks. That is medicine, prescribed and monitored, and it is not what a wellness magnesium drip is.',
      'Magnesium has legitimate evidence in migraine prevention for some people, typically as daily oral supplementation discussed with a doctor. If migraines are affecting your life, the highest-value step is a physician who can offer the treatments with actual evidence.',
    ],
    faqs: [
      { q: 'Do IV drips help migraines?', a: 'Hospital migraine protocols use specific IV medications for severe attacks under medical care. Wellness clinic drips are a different product; their usual active ingredient, magnesium, has evidence as a daily oral preventive for some people rather than as an infusion cure. A recurring migraine pattern deserves a doctor, because effective acute and preventive treatments exist.' },
      { q: 'Does magnesium help migraines?', a: 'Oral magnesium has evidence as a preventive for some migraine sufferers and is inexpensive. Discuss dose and form with your doctor or pharmacist; it is a daily strategy, not an emergency treatment.' },
      { q: 'When should I see a doctor about migraines?', a: 'If they are frequent, worsening, disabling, or changing in character. Modern migraine care includes effective acute medications and preventives, and a sudden severe unlike-anything-before headache is an emergency.' },
    ],
    links: [WHO_NOT, VERIFY, VERDICTS],
  },
  'hormone-therapy': {
    slug: 'hormone-therapy', formulaId: null,
    verdict: [
      'Hormone therapy, testosterone, HRT and related care, is prescription medicine that starts with bloodwork, diagnosis and a prescriber who monitors you. It is genuinely valuable care for the right patients, and none of it is a drip-menu item.',
      'If a wellness clinic offers hormone therapy, the entire question is who the prescriber is: named, registered in your province, assessing you individually, and monitoring after. Every part of that is checkable on a public register before you book.',
    ],
    faqs: [
      { q: 'Can an IV clinic prescribe testosterone or HRT in Canada?', a: 'Only a licensed prescriber, a physician or nurse practitioner, can prescribe hormone therapy, after assessment and bloodwork, with monitoring. A clinic offering it should name its prescriber, and regulators have specifically warned against arrangements where a medical director signs without genuinely assessing patients.' },
      { q: 'What should hormone therapy actually involve?', a: 'Baseline bloodwork, a diagnosis, an individual prescription, and scheduled follow-up including repeat labs. If any of those is missing from what a clinic describes, that is the answer.' },
      { q: 'How do I verify who is prescribing?', a: 'Ask the prescriber’s name and check the provincial register: CPSO for Ontario physicians, the college of nurses for NPs. Our verification guide links every register with a walkthrough.' },
    ],
    links: [VERIFY, WHO_NOT, CHECKLIST],
  },
};

/** Formula ids used by hubs, for the price-stats query. */
export const HUB_FORMULA_IDS = [...new Set(Object.values(TREATMENT_HUBS).map((h) => h.formulaId).filter(Boolean))] as string[];
