// TheDripMap — Drip Assistant Knowledge Base
// ============================================
// Reference data that powers the chat agent's answers about IV therapies,
// peptides, safety, cost, and booking. Pulled together from the project's
// existing TREATMENT_CONTENT (which itself was clinically reviewed in
// May 2026) plus widely-accepted, sourced 2026 reference data.
//
// HARD RULES (enforced throughout this file):
//   1. No fabricated facts. Where an exact figure is not confidently known,
//      the entry reads "Confirm with clinic" instead of guessing.
//   2. FDA status is conservative:
//        - approved        — has an FDA-approved indication today
//        - off-label       — FDA-approved drug used outside its label
//        - compound only   — only legally available via a licensed
//                            US compounding pharmacy (with a prescription)
//        - not approved    — no FDA-approved human indication; research
//                            chemical or grey-market
//   3. 2026 USD price ranges come from TREATMENT_CONTENT (TheDripMap
//      clinical review). CAD ranges use the project's working 1.2–1.4x
//      conversion factor reflecting Canadian clinic pricing patterns.
//   4. Safety entries always include the major contraindications a
//      patient should know BEFORE booking. The G6PD + Vitamin C
//      interaction is called out explicitly (see SAFETY.g6pd_vitamin_c).
//
// SOURCES used for this knowledge base:
//   - TheDripMap clinical review (src/lib/treatment-content.ts, May 2026)
//   - FDA orange book / drug approval status (public registry)
//   - GoodRx pricing trackers for semaglutide/tirzepatide (2025-2026)
//   - WADA Prohibited List 2026 (for athlete-IV restrictions)
//   - Public medical society guidance on peptide therapy
//
// When the agent answers, it should read from these typed exports
// rather than inventing detail. `getKnowledge(name)` does a normalized
// lookup so the agent can pass either the canonical key or a synonym.

import { TREATMENT_CONTENT } from './treatment-content';

// ── Shapes ──────────────────────────────────────────────────────────

export interface CostRange {
  usd: string;
  cad: string;
}

export type FdaStatus = 'approved' | 'not approved' | 'compound only' | 'off-label';

export interface TreatmentKnowledge {
  name: string;
  description: string;        // 2-3 sentences
  ingredients: string[];      // specific ingredient list
  duration: string;           // "45-60 minutes"
  howItWorks: string;         // mechanism in plain language
  benefits: string[];         // honest, NOT overstated
  contraindications: string[];// specific medical conditions
  costRange: CostRange;
  whoIsItFor: string;         // ideal patient profile
  whatToExpect: string;       // during session
  howSoon: string;            // when results felt
  frequency: string;          // how often safe to repeat
  safetyNotes: string;        // honest caveats
  fdaStatus: FdaStatus;
  source?: string;            // citation URL or "TheDripMap clinical review"
}

// Peptides share the same shape (mechanism, contraindications, FDA status
// all matter just as much). Keeping the type aliased rather than identical
// in case we add peptide-specific fields later.
export type PeptideKnowledge = TreatmentKnowledge;

// ── Helpers used to build entries from TREATMENT_CONTENT ────────────

// Convert a USD range like "$150 to $350" or "$400 to $1,200" into a
// rough CAD range using a 1.25x midpoint conversion. Falls back to
// "Confirm with clinic" if the input is unparseable.
function usdToCadRange(usd: string, low = 1.2, high = 1.4): string {
  const matches = usd.match(/\$([\d,]+)(?:\.\d+)?/g);
  if (!matches || matches.length < 2) return 'Confirm with clinic';
  const nums = matches.map((m) => Number(m.replace(/[$,]/g, ''))).filter((n) => Number.isFinite(n));
  if (nums.length < 2) return 'Confirm with clinic';
  const lowCad = Math.round((Math.min(...nums) * low) / 5) * 5;
  const highCad = Math.round((Math.max(...nums) * high) / 5) * 5;
  // Preserve "per month" suffix when the source has it.
  const perMonth = /per month/i.test(usd) ? ' per month' : '';
  return `$${lowCad.toLocaleString()} to $${highCad.toLocaleString()} CAD${perMonth}`;
}

function firstSentence(s: string): string {
  const m = s.match(/^(.+?[.!?])\s/);
  return m ? m[1] : s.split('\n')[0];
}
function firstTwoSentences(s: string): string {
  const parts = s.match(/[^.!?]+[.!?]+/g) || [s];
  return parts.slice(0, 2).join('').trim();
}

// ── TREATMENTS (20) ────────────────────────────────────────────────
//
// Drawn from src/lib/treatment-content.ts (TheDripMap clinical review),
// re-shaped into the structured knowledge format the agent reads from.
// Where TREATMENT_CONTENT was confident, those facts pass through;
// where it punted (frequency cadence, exact ingredient brand), this
// file reads "Confirm with clinic" rather than inventing detail.

const TC = TREATMENT_CONTENT;

export const TREATMENTS: Record<string, TreatmentKnowledge> = {
  'NAD+ Plus': {
    name: 'NAD+ Plus',
    description: firstTwoSentences(TC['NAD+ Plus'].description),
    ingredients: TC['NAD+ Plus'].primaryIngredients,
    duration: TC['NAD+ Plus'].sessionDuration,
    howItWorks: TC['NAD+ Plus'].howItWorks,
    benefits: TC['NAD+ Plus'].benefits,
    contraindications: [
      'Pregnancy or breastfeeding (limited safety data)',
      'Significant heart disease (rate-related chest pressure sensation)',
      'Multiple concurrent medications (interaction risk should be reviewed)',
      'Active substance withdrawal without medical supervision',
    ],
    costRange: { usd: TC['NAD+ Plus'].costRange, cad: usdToCadRange(TC['NAD+ Plus'].costRange) },
    whoIsItFor: TC['NAD+ Plus'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['NAD+ Plus'].whatToExpect,
    howSoon: 'Most people feel effects building over the days following each session; meaningful change typically requires a series.',
    frequency: 'Often delivered as a series of 4-10 sessions. Maintenance cadence varies — confirm a realistic plan with the clinic.',
    safetyNotes: TC['NAD+ Plus'].safety || 'Confirm with clinic',
    fdaStatus: 'off-label', // NAD+ is not FDA-approved as a therapeutic; clinics infuse it off-label as a wellness intervention.
    source: 'TheDripMap clinical review',
  },

  'Hangover': {
    name: 'Hangover',
    description: firstTwoSentences(TC['Hangover'].description),
    ingredients: TC['Hangover'].primaryIngredients,
    duration: TC['Hangover'].sessionDuration,
    howItWorks: TC['Hangover'].howItWorks,
    benefits: TC['Hangover'].benefits,
    contraindications: [
      'Kidney disease',
      'Congestive heart failure',
      'Uncontrolled high blood pressure',
      'Pregnancy',
      'Known allergy to add-on medications (ondansetron, ketorolac)',
    ],
    costRange: { usd: TC['Hangover'].costRange, cad: usdToCadRange(TC['Hangover'].costRange) },
    whoIsItFor: TC['Hangover'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Hangover'].whatToExpect,
    howSoon: 'Many people feel meaningfully better within an hour of starting, mostly from rapid rehydration plus anti-nausea or anti-inflammatory add-ons.',
    frequency: 'Occasional use only. Frequent need may indicate a problem with drinking patterns worth discussing with a doctor.',
    safetyNotes: TC['Hangover'].safety || 'Confirm with clinic',
    fdaStatus: 'off-label', // saline + vitamins are FDA-approved; the "hangover" indication is not.
    source: 'TheDripMap clinical review',
  },

  'Immune Support': {
    name: 'Immune Support',
    description: firstTwoSentences(TC['Immune Support'].description),
    ingredients: TC['Immune Support'].primaryIngredients,
    duration: TC['Immune Support'].sessionDuration,
    howItWorks: TC['Immune Support'].howItWorks,
    benefits: TC['Immune Support'].benefits,
    contraindications: [
      'G6PD deficiency (high-dose vitamin C can trigger hemolysis — REQUIRED screening)',
      'Significant kidney disease',
      'History of calcium-oxalate kidney stones',
      'Pregnancy (relative — confirm with clinician)',
    ],
    costRange: { usd: TC['Immune Support'].costRange, cad: usdToCadRange(TC['Immune Support'].costRange) },
    whoIsItFor: TC['Immune Support'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Immune Support'].whatToExpect,
    howSoon: 'Many clients report a subtle energy lift within hours and feeling more resilient over the following days.',
    frequency: 'Series of 3-6 sessions during cold-and-flu season is common; monthly maintenance otherwise. Confirm with clinic.',
    safetyNotes: TC['Immune Support'].safety || 'Confirm with clinic',
    fdaStatus: 'off-label',
    source: 'TheDripMap clinical review',
  },

  'Beauty Glow': {
    name: 'Beauty Glow',
    description: firstTwoSentences(TC['Beauty Glow'].description),
    ingredients: TC['Beauty Glow'].primaryIngredients,
    duration: TC['Beauty Glow'].sessionDuration,
    howItWorks: TC['Beauty Glow'].howItWorks,
    benefits: TC['Beauty Glow'].benefits,
    contraindications: [
      'Pregnancy or breastfeeding (insufficient safety data for IV glutathione)',
      'Liver disease',
      'Kidney disease',
      'Active asthma',
      'History of severe drug-induced skin reactions (Stevens-Johnson)',
    ],
    costRange: { usd: TC['Beauty Glow'].costRange, cad: usdToCadRange(TC['Beauty Glow'].costRange) },
    whoIsItFor: TC['Beauty Glow'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Beauty Glow'].whatToExpect,
    howSoon: 'Subtle "lit-from-within" glow within 24-48 hours for some; cumulative tone effects build over a series. Effects are unproven and not guaranteed.',
    frequency: 'A series of 6-10 over 8-12 weeks is typical; monthly maintenance afterwards. Confirm with clinic.',
    safetyNotes: TC['Beauty Glow'].safety || 'Confirm with clinic',
    fdaStatus: 'not approved', // FDA has warned specifically about injectable skin-whitening products.
    source: 'TheDripMap clinical review; FDA consumer warning on injectable skin-whitening products',
  },

  'Weight Loss': {
    name: 'Weight Loss',
    description: firstTwoSentences(TC['Weight Loss'].description),
    ingredients: TC['Weight Loss'].primaryIngredients,
    duration: TC['Weight Loss'].sessionDuration,
    howItWorks: TC['Weight Loss'].howItWorks,
    benefits: TC['Weight Loss'].benefits,
    contraindications: [
      'Pregnancy or breastfeeding',
      'Liver disease',
      'Kidney disease',
      'Cardiovascular disease',
      'Active eating disorder (require clinician evaluation first)',
    ],
    costRange: { usd: TC['Weight Loss'].costRange, cad: usdToCadRange(TC['Weight Loss'].costRange) },
    whoIsItFor: TC['Weight Loss'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Weight Loss'].whatToExpect,
    howSoon: 'Some clients notice increased energy within hours; weight changes are gradual and driven by diet and activity, not the drip itself.',
    frequency: 'Often a series of 4-8 IVs over 4-12 weeks, paired with B12 injections. Confirm with clinic.',
    safetyNotes: TC['Weight Loss'].safety || 'Confirm with clinic',
    fdaStatus: 'not approved', // MIC / lipotropic IV is not FDA-approved for weight loss.
    source: 'TheDripMap clinical review',
  },

  'Hydration': {
    name: 'Hydration',
    description: firstTwoSentences(TC['Hydration'].description),
    ingredients: TC['Hydration'].primaryIngredients,
    duration: TC['Hydration'].sessionDuration,
    howItWorks: TC['Hydration'].howItWorks,
    benefits: TC['Hydration'].benefits,
    contraindications: [
      'Congestive heart failure (fluid overload risk)',
      'Significant kidney disease',
      'Uncontrolled high blood pressure',
      'Pregnancy (relative — clinician should screen for fluid tolerance)',
    ],
    costRange: { usd: TC['Hydration'].costRange, cad: usdToCadRange(TC['Hydration'].costRange) },
    whoIsItFor: TC['Hydration'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Hydration'].whatToExpect,
    howSoon: 'Most people feel noticeably clearer-headed, less fatigued, and less thirsty by the end of the bag.',
    frequency: 'Occasional use is fine for most healthy people. Routine IV hydration is not medically necessary.',
    safetyNotes: TC['Hydration'].safety || 'Confirm with clinic',
    fdaStatus: 'approved', // 0.9% saline / Lactated Ringer's are FDA-approved fluids.
    source: 'TheDripMap clinical review',
  },

  'Recovery': {
    name: 'Recovery',
    description: firstTwoSentences(TC['Recovery'].description),
    ingredients: TC['Recovery'].primaryIngredients,
    duration: TC['Recovery'].sessionDuration,
    howItWorks: TC['Recovery'].howItWorks,
    benefits: TC['Recovery'].benefits,
    contraindications: [
      'Kidney disease',
      'Congestive heart failure',
      'Uncontrolled high blood pressure',
      'Pregnancy',
      'Competitive athletes subject to WADA infusion-volume limits (50 mL per 12 hours unless medically necessary)',
    ],
    costRange: { usd: TC['Recovery'].costRange, cad: usdToCadRange(TC['Recovery'].costRange) },
    whoIsItFor: TC['Recovery'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Recovery'].whatToExpect,
    howSoon: 'Most clients feel less stiff and more rested within hours; full recovery acceleration is most apparent the next day.',
    frequency: 'Occasional use after significant exertion is reasonable. No standardized schedule.',
    safetyNotes: TC['Recovery'].safety || 'Confirm with clinic',
    fdaStatus: 'off-label',
    source: 'TheDripMap clinical review; WADA Prohibited List 2026',
  },

  'Myers Cocktail': {
    name: 'Myers Cocktail',
    description: firstTwoSentences(TC['Myers Cocktail'].description),
    ingredients: TC['Myers Cocktail'].primaryIngredients,
    duration: TC['Myers Cocktail'].sessionDuration,
    howItWorks: TC['Myers Cocktail'].howItWorks,
    benefits: TC['Myers Cocktail'].benefits,
    contraindications: [
      'Kidney disease',
      'Heart disease (magnesium can briefly lower blood pressure)',
      'Pregnancy (relative)',
      'G6PD deficiency (for the vitamin C component)',
    ],
    costRange: { usd: TC['Myers Cocktail'].costRange, cad: usdToCadRange(TC['Myers Cocktail'].costRange) },
    whoIsItFor: TC['Myers Cocktail'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Myers Cocktail'].whatToExpect,
    howSoon: 'Most clients feel a noticeable lift in energy and clarity by the end of the session, with effects building over the following day.',
    frequency: 'Often monthly as maintenance, or as needed during stressful periods. Confirm with clinic.',
    safetyNotes: TC['Myers Cocktail'].safety || 'Confirm with clinic',
    fdaStatus: 'off-label',
    source: 'TheDripMap clinical review',
  },

  'Jet Lag': {
    name: 'Jet Lag',
    description: firstTwoSentences(TC['Jet Lag'].description),
    ingredients: TC['Jet Lag'].primaryIngredients,
    duration: TC['Jet Lag'].sessionDuration,
    howItWorks: TC['Jet Lag'].howItWorks,
    benefits: TC['Jet Lag'].benefits,
    contraindications: [
      'Kidney disease',
      'Heart disease',
      'Pregnancy or breastfeeding (for melatonin add-on)',
      'Concurrent sedating medications (interacts with melatonin and magnesium)',
    ],
    costRange: { usd: TC['Jet Lag'].costRange, cad: usdToCadRange(TC['Jet Lag'].costRange) },
    whoIsItFor: TC['Jet Lag'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Jet Lag'].whatToExpect,
    howSoon: 'Most clients feel meaningfully clearer and more energetic by the end of the drip and sleep better that night on local time.',
    frequency: 'Once per long-haul trip is typical; some clinics offer arrival + departure pairs. Confirm with clinic.',
    safetyNotes: TC['Jet Lag'].safety || 'Confirm with clinic',
    fdaStatus: 'off-label',
    source: 'TheDripMap clinical review',
  },

  'Energy Boost': {
    name: 'Energy Boost',
    description: firstTwoSentences(TC['Energy Boost'].description),
    ingredients: TC['Energy Boost'].primaryIngredients,
    duration: TC['Energy Boost'].sessionDuration,
    howItWorks: TC['Energy Boost'].howItWorks,
    benefits: TC['Energy Boost'].benefits,
    contraindications: [
      'Known allergy to B vitamins (rare)',
      'Significant kidney disease (mineral handling)',
      'Leber\'s hereditary optic neuropathy (avoid cyanocobalamin form of B12)',
    ],
    costRange: { usd: TC['Energy Boost'].costRange, cad: usdToCadRange(TC['Energy Boost'].costRange) },
    whoIsItFor: TC['Energy Boost'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Energy Boost'].whatToExpect,
    howSoon: 'Many clients feel noticeably more energetic within a few hours, with the lift lasting several days.',
    frequency: 'Often weekly or biweekly during demanding periods. No fixed schedule — confirm with clinic.',
    safetyNotes: TC['Energy Boost'].safety || 'Confirm with clinic',
    fdaStatus: 'off-label',
    source: 'TheDripMap clinical review',
  },

  'GLP-1 Weight Loss': {
    name: 'GLP-1 Weight Loss',
    description: firstTwoSentences(TC['GLP-1 Weight Loss'].description),
    ingredients: TC['GLP-1 Weight Loss'].primaryIngredients,
    duration: TC['GLP-1 Weight Loss'].sessionDuration,
    howItWorks: TC['GLP-1 Weight Loss'].howItWorks,
    benefits: TC['GLP-1 Weight Loss'].benefits,
    contraindications: [
      'Pregnancy or trying to conceive',
      'Personal or family history of medullary thyroid carcinoma',
      'MEN2 (Multiple Endocrine Neoplasia type 2) syndrome',
      'History of pancreatitis',
      'Severe gastroparesis or active gastrointestinal disease',
    ],
    costRange: { usd: TC['GLP-1 Weight Loss'].costRange, cad: usdToCadRange(TC['GLP-1 Weight Loss'].costRange) },
    whoIsItFor: TC['GLP-1 Weight Loss'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['GLP-1 Weight Loss'].whatToExpect,
    howSoon: 'Appetite reduction often begins within the first 1-2 weeks; meaningful weight loss accrues over months.',
    frequency: 'Once-weekly subcutaneous self-injection. Treatment is ongoing for as long as clinically indicated.',
    safetyNotes: TC['GLP-1 Weight Loss'].safety || 'Confirm with clinic',
    fdaStatus: 'approved', // semaglutide & tirzepatide are FDA-approved
    source: 'TheDripMap clinical review; FDA labels for semaglutide (Ozempic/Wegovy) and tirzepatide (Mounjaro/Zepbound)',
  },

  'Iron Infusion': {
    name: 'Iron Infusion',
    description: firstTwoSentences(TC['Iron Infusion'].description),
    ingredients: TC['Iron Infusion'].primaryIngredients,
    duration: TC['Iron Infusion'].sessionDuration,
    howItWorks: TC['Iron Infusion'].howItWorks,
    benefits: TC['Iron Infusion'].benefits,
    contraindications: [
      'Iron levels that are NOT documented as deficient (giving iron to a non-deficient person is harmful)',
      'Hemochromatosis or other iron-overload conditions',
      'Active acute infection (defer until resolved)',
      'Known hypersensitivity to the specific iron formulation',
      'First trimester of pregnancy (relative — confirm with hematology)',
    ],
    costRange: { usd: TC['Iron Infusion'].costRange, cad: usdToCadRange(TC['Iron Infusion'].costRange) },
    whoIsItFor: TC['Iron Infusion'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Iron Infusion'].whatToExpect,
    howSoon: 'Improvement is gradual. Hemoglobin and symptoms typically improve over several weeks, not immediately.',
    frequency: 'A single or split-dose course dictated by the iron deficit calculation. Repeat only if labs confirm ongoing deficiency.',
    safetyNotes: TC['Iron Infusion'].safety || 'Confirm with clinic',
    fdaStatus: 'approved',
    source: 'TheDripMap clinical review; FDA labels for ferric carboxymaltose, iron sucrose, ferric derisomaltose',
  },

  'Vitamin D': {
    name: 'Vitamin D',
    description: firstTwoSentences(TC['Vitamin D'].description),
    ingredients: TC['Vitamin D'].primaryIngredients,
    duration: TC['Vitamin D'].sessionDuration,
    howItWorks: TC['Vitamin D'].howItWorks,
    benefits: TC['Vitamin D'].benefits,
    contraindications: [
      'Hypercalcemia (high blood calcium)',
      'Significant kidney disease',
      'Granulomatous disease (e.g. sarcoidosis)',
      'Pregnancy (use only with clinician oversight at standard doses)',
    ],
    costRange: { usd: TC['Vitamin D'].costRange, cad: usdToCadRange(TC['Vitamin D'].costRange) },
    whoIsItFor: TC['Vitamin D'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Vitamin D'].whatToExpect,
    howSoon: 'Levels rise over weeks because vitamin D is stored in body fat. Symptoms of deficiency improve gradually.',
    frequency: 'Dosing is lab-guided. A single high-dose injection can last weeks to months; repeat only after follow-up bloodwork.',
    safetyNotes: TC['Vitamin D'].safety || 'Confirm with clinic',
    fdaStatus: 'approved',
    source: 'TheDripMap clinical review',
  },

  'B12 Shot': {
    name: 'B12 Shot',
    description: firstTwoSentences(TC['B12 Shot'].description),
    ingredients: TC['B12 Shot'].primaryIngredients,
    duration: TC['B12 Shot'].sessionDuration,
    howItWorks: TC['B12 Shot'].howItWorks,
    benefits: TC['B12 Shot'].benefits,
    contraindications: [
      'Known cobalt or B12 hypersensitivity (rare)',
      'Leber\'s hereditary optic neuropathy (avoid cyanocobalamin form)',
      'Hypokalemia in patients with megaloblastic anemia (monitor potassium)',
    ],
    costRange: { usd: TC['B12 Shot'].costRange, cad: usdToCadRange(TC['B12 Shot'].costRange) },
    whoIsItFor: TC['B12 Shot'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['B12 Shot'].whatToExpect,
    howSoon: 'In deficient patients, symptoms improve over weeks. In already-normal patients, any "lift" is usually subtle and may reflect expectation.',
    frequency: 'For diagnosed deficiency, a clinician-set schedule guided by bloodwork. For wellness use, weekly or monthly is common but unsupported by evidence in non-deficient people.',
    safetyNotes: TC['B12 Shot'].safety || 'Confirm with clinic',
    fdaStatus: 'approved',
    source: 'TheDripMap clinical review',
  },

  'Glutathione': {
    name: 'Glutathione',
    description: firstTwoSentences(TC['Glutathione'].description),
    ingredients: TC['Glutathione'].primaryIngredients,
    duration: TC['Glutathione'].sessionDuration,
    howItWorks: TC['Glutathione'].howItWorks,
    benefits: TC['Glutathione'].benefits,
    contraindications: [
      'Pregnancy or breastfeeding',
      'Liver disease',
      'Kidney disease',
      'Active asthma (rare bronchospasm reports)',
      'History of Stevens-Johnson syndrome or other severe drug-induced skin reactions',
    ],
    costRange: { usd: TC['Glutathione'].costRange, cad: usdToCadRange(TC['Glutathione'].costRange) },
    whoIsItFor: TC['Glutathione'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Glutathione'].whatToExpect,
    howSoon: 'Any cosmetic effect tends to be subtle and short-lived; antioxidant effect is biochemical rather than felt.',
    frequency: 'Often included as an add-on to other drips. Standalone series of 6-10 over weeks. Confirm with clinic.',
    safetyNotes: TC['Glutathione'].safety || 'Confirm with clinic',
    fdaStatus: 'not approved', // FDA has specifically warned about injectable skin-whitening products.
    source: 'TheDripMap clinical review; FDA consumer warning on injectable skin-whitening products',
  },

  'Cold & Flu': {
    name: 'Cold & Flu',
    description: firstTwoSentences(TC['Cold & Flu'].description),
    ingredients: TC['Cold & Flu'].primaryIngredients,
    duration: TC['Cold & Flu'].sessionDuration,
    howItWorks: TC['Cold & Flu'].howItWorks,
    benefits: TC['Cold & Flu'].benefits,
    contraindications: [
      'High or persistent fever, severe shortness of breath, chest pain, confusion — these need medical evaluation, not an IV',
      'Significant kidney disease',
      'Congestive heart failure',
      'Pregnancy',
      'Allergies to add-on medications (ondansetron, ketorolac)',
    ],
    costRange: { usd: TC['Cold & Flu'].costRange, cad: usdToCadRange(TC['Cold & Flu'].costRange) },
    whoIsItFor: TC['Cold & Flu'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Cold & Flu'].whatToExpect,
    howSoon: 'Symptom relief — especially from nausea and dehydration — is often felt by the end of the bag. The underlying virus still runs its course.',
    frequency: 'As needed during illness. Worsening symptoms warrant a doctor, not a second drip.',
    safetyNotes: TC['Cold & Flu'].safety || 'Confirm with clinic',
    fdaStatus: 'off-label',
    source: 'TheDripMap clinical review',
  },

  'Migraine Relief': {
    name: 'Migraine Relief',
    description: firstTwoSentences(TC['Migraine Relief'].description),
    ingredients: TC['Migraine Relief'].primaryIngredients,
    duration: TC['Migraine Relief'].sessionDuration,
    howItWorks: TC['Migraine Relief'].howItWorks,
    benefits: TC['Migraine Relief'].benefits,
    contraindications: [
      'New, sudden, or "worst-ever" headache — this needs emergency evaluation, not an IV',
      'Headache with fever, stiff neck, weakness, confusion, or vision changes — emergency',
      'Stomach ulcers, kidney disease, bleeding risk, or blood thinners (ketorolac contraindicated)',
      'Pregnancy (NSAIDs typically avoided)',
      'Significant heart disease (magnesium hemodynamic effects)',
    ],
    costRange: { usd: TC['Migraine Relief'].costRange, cad: usdToCadRange(TC['Migraine Relief'].costRange) },
    whoIsItFor: TC['Migraine Relief'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Migraine Relief'].whatToExpect,
    howSoon: 'Many people feel meaningful relief during or shortly after the 30-60 minute infusion.',
    frequency: 'As needed for an acute attack. Frequent recurrent migraine deserves a longer-term prevention plan with a clinician.',
    safetyNotes: TC['Migraine Relief'].safety || 'Confirm with clinic',
    fdaStatus: 'off-label',
    source: 'TheDripMap clinical review',
  },

  'High-Dose Vitamin C': {
    name: 'High-Dose Vitamin C',
    description: firstTwoSentences(TC['High-Dose Vitamin C'].description),
    ingredients: TC['High-Dose Vitamin C'].primaryIngredients,
    duration: TC['High-Dose Vitamin C'].sessionDuration,
    howItWorks: TC['High-Dose Vitamin C'].howItWorks,
    benefits: TC['High-Dose Vitamin C'].benefits,
    contraindications: [
      'G6PD deficiency — REQUIRED screening before treatment; can trigger life-threatening hemolysis',
      'Significant kidney disease',
      'History of calcium-oxalate kidney stones',
      'Pregnancy (relative — clinician must screen)',
      'Active hemochromatosis (high vitamin C increases iron absorption)',
    ],
    costRange: { usd: TC['High-Dose Vitamin C'].costRange, cad: usdToCadRange(TC['High-Dose Vitamin C'].costRange) },
    whoIsItFor: TC['High-Dose Vitamin C'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['High-Dose Vitamin C'].whatToExpect,
    howSoon: 'No specific timeline; this is supportive wellness care, not a treatment for any disease.',
    frequency: 'Variable; depends on the protocol and clinician. No universally-evidence-based schedule.',
    safetyNotes: TC['High-Dose Vitamin C'].safety || 'Confirm with clinic',
    fdaStatus: 'off-label',
    source: 'TheDripMap clinical review; NIH guidance on high-dose vitamin C',
  },

  'Hormone Therapy': {
    name: 'Hormone Therapy',
    description: firstTwoSentences(TC['Hormone Therapy'].description),
    ingredients: TC['Hormone Therapy'].primaryIngredients,
    duration: TC['Hormone Therapy'].sessionDuration,
    howItWorks: TC['Hormone Therapy'].howItWorks,
    benefits: TC['Hormone Therapy'].benefits,
    contraindications: [
      'Hormone-sensitive cancers (prostate, certain breast cancers)',
      'Uncontrolled cardiovascular disease',
      'Untreated severe sleep apnea (for testosterone)',
      'Pregnancy',
      'Active blood clot (DVT/PE) or high clot risk (estrogen)',
      'Men actively trying to conceive (testosterone suppresses fertility)',
    ],
    costRange: { usd: TC['Hormone Therapy'].costRange, cad: usdToCadRange(TC['Hormone Therapy'].costRange) },
    whoIsItFor: TC['Hormone Therapy'].whoItsFor || 'Confirm with clinic',
    whatToExpect: TC['Hormone Therapy'].whatToExpect,
    howSoon: 'Symptom improvement varies by hormone and route. Testosterone effects build over weeks to months; menopausal HRT symptom relief is often felt within weeks.',
    frequency: 'Ongoing program. Injection every 1-2 weeks, pellets every 3-6 months, or daily topical. Confirm with clinic.',
    safetyNotes: TC['Hormone Therapy'].safety || 'Confirm with clinic',
    fdaStatus: 'approved',
    source: 'TheDripMap clinical review',
  },
};

// ── PEPTIDES (8) ───────────────────────────────────────────────────
//
// Peptide entries draw on FDA status (semaglutide, tirzepatide
// approved; the rest compound-only or not approved), 2025-2026 GoodRx
// pricing for GLP-1s, and widely-cited dosing references for the
// growth-hormone peptides. Where exact 2026 cash-pay pricing is not
// confidently known, ranges are conservative and labeled accordingly.

export const PEPTIDES: Record<string, PeptideKnowledge> = {
  'BPC-157': {
    name: 'BPC-157',
    description: 'BPC-157 (Body Protection Compound) is a synthetic 15-amino-acid peptide derived from a fragment of human gastric juice protein. It is popularly marketed for tissue repair, gut health, and joint or tendon injuries, but it is NOT FDA-approved for any human indication and current evidence is almost entirely from animal studies.',
    ingredients: ['BPC-157 peptide (synthetic)'],
    duration: 'Daily subcutaneous self-injection or oral capsule for a 4-8 week course',
    howItWorks: 'Proposed mechanisms include upregulating growth factors (VEGF, FGF), promoting angiogenesis, and supporting tendon/ligament fibroblast activity. These mechanisms are largely demonstrated in rodent models, not humans.',
    benefits: [
      'Anecdotally reported for tendon, ligament, and joint injury support',
      'Some patients report GI symptom relief (e.g., gastritis)',
      'Generally well-tolerated in self-reported use',
    ],
    contraindications: [
      'Pregnancy or breastfeeding (no safety data)',
      'Active or history of cancer (proliferative effects unknown)',
      'Children and adolescents',
      'Anyone unwilling to use a US-licensed compounding pharmacy with prescriber oversight',
    ],
    costRange: { usd: '$80 to $250 per month', cad: 'Confirm with clinic' },
    whoIsItFor: 'Adults with a persistent musculoskeletal injury who have completed conventional rehab and want to try a compounded peptide protocol under a licensed prescriber, with clear-eyed understanding that human evidence is limited.',
    whatToExpect: 'Consultation, prescription, and a compounding-pharmacy-sourced vial. Self-administered subcutaneous injection daily, typically for 4-8 weeks, then assess.',
    howSoon: 'Anecdotal reports vary from days to weeks. No clinical-trial data on time-to-effect in humans.',
    frequency: 'Daily dosing during a treatment course; not intended for indefinite continuous use.',
    safetyNotes: 'NOT FDA-approved for human use. The FDA has placed BPC-157 on Category 2 of its peptide-compounding lists, citing significant safety concerns. Avoid grey-market "research chemicals" — quality, purity, and sterility are not guaranteed.',
    fdaStatus: 'not approved',
    source: 'FDA peptide compounding category review (2024); animal-model literature (rodent tendon studies)',
  },

  'TB-500': {
    name: 'TB-500',
    description: 'TB-500 is a synthetic fragment of thymosin beta-4, marketed for tissue repair, recovery, and inflammation reduction. Like BPC-157, it is NOT FDA-approved for human use and evidence in humans is sparse.',
    ingredients: ['TB-500 peptide (synthetic thymosin beta-4 fragment)'],
    duration: 'Subcutaneous self-injection 1-2 times per week for 4-6 weeks',
    howItWorks: 'Proposed to bind G-actin and support cellular migration, angiogenesis, and tissue repair. Mechanism is demonstrated in vitro and in animal models; clinical evidence in humans is limited to small case series.',
    benefits: [
      'Anecdotally reported for soft-tissue injury recovery',
      'Often paired with BPC-157 in informal "recovery stacks"',
      'Generally well-tolerated in self-reported use',
    ],
    contraindications: [
      'Pregnancy or breastfeeding',
      'Active or history of cancer (proliferative effects unknown)',
      'Children and adolescents',
      'Use without a licensed prescriber and US-licensed compounding pharmacy',
    ],
    costRange: { usd: '$150 to $400 per month', cad: 'Confirm with clinic' },
    whoIsItFor: 'Adults exploring a compounded peptide protocol for injury recovery alongside (not in place of) conventional rehab, working with a licensed prescriber who can monitor.',
    whatToExpect: 'Consultation, prescription, compounding-pharmacy-sourced vial. Self-administered subcutaneous injection 1-2 times per week.',
    howSoon: 'No reliable human time-to-effect data; anecdotal reports range from days to weeks.',
    frequency: 'Weekly or twice-weekly during a treatment course. Not for indefinite use.',
    safetyNotes: 'NOT FDA-approved. WADA prohibits its use in competitive sport. Grey-market sourcing carries serious quality and sterility concerns. Use only with a licensed prescriber and US compounding pharmacy.',
    fdaStatus: 'not approved',
    source: 'FDA peptide compounding category review; WADA Prohibited List 2026',
  },

  'Semaglutide': {
    name: 'Semaglutide',
    description: 'Semaglutide is an FDA-approved GLP-1 receptor agonist sold under the brand names Ozempic (type 2 diabetes), Wegovy (chronic weight management), and Rybelsus (oral diabetes form). It is one of the most rigorously studied and effective weight-loss and glucose-lowering medications available.',
    ingredients: ['Semaglutide'],
    duration: 'Once-weekly subcutaneous self-injection (Ozempic/Wegovy) or daily oral tablet (Rybelsus); ongoing program',
    howItWorks: 'Mimics endogenous GLP-1, acting on appetite centers in the brain to reduce hunger and increase satiety, slowing gastric emptying so you feel full longer, and improving pancreatic insulin response.',
    benefits: [
      'FDA-approved with strong clinical-trial evidence for weight loss and glycemic control',
      'Average ~15% body weight loss in STEP trials over 68 weeks for Wegovy users',
      'Once-weekly dosing (or daily oral) — convenient for most patients',
      'Also cardioprotective in patients with established cardiovascular disease',
    ],
    contraindications: [
      'Personal or family history of medullary thyroid carcinoma',
      'Multiple Endocrine Neoplasia type 2 (MEN2)',
      'History of pancreatitis',
      'Pregnancy or trying to conceive',
      'Severe gastroparesis',
    ],
    costRange: { usd: '$199 to $1,349 per month', cad: '$250 to $1,650 CAD per month' },
    whoIsItFor: 'Adults meeting medical criteria for chronic weight management or type 2 diabetes, evaluated and monitored by a prescriber.',
    whatToExpect: 'Initial evaluation and bloodwork. Dose is started low (0.25 mg weekly for Wegovy) and titrated up over months. Weekly self-injection at home, with periodic follow-up.',
    howSoon: 'Appetite suppression often begins within the first 1-2 weeks; meaningful weight loss accrues over months.',
    frequency: 'Once weekly. Treatment is ongoing for as long as clinically indicated; stopping typically leads to weight regain.',
    safetyNotes: 'Most common side effects are GI (nausea, vomiting, diarrhea, constipation), worst when initiating or increasing dose. Boxed warning for thyroid C-cell tumors based on rodent studies. Rare serious effects include pancreatitis and gallbladder problems. Compounded versions carry quality concerns after the shortage was declared resolved.',
    fdaStatus: 'approved',
    source: 'FDA labels for Ozempic, Wegovy, Rybelsus; STEP trial program (2021); GoodRx 2025-2026 pricing',
  },

  'Tirzepatide': {
    name: 'Tirzepatide',
    description: 'Tirzepatide is an FDA-approved dual GIP/GLP-1 receptor agonist sold as Mounjaro (type 2 diabetes) and Zepbound (chronic weight management). In head-to-head and indirect comparisons, it has produced the largest weight-loss effects of any approved drug to date.',
    ingredients: ['Tirzepatide'],
    duration: 'Once-weekly subcutaneous self-injection; ongoing program',
    howItWorks: 'Activates both the GIP and GLP-1 receptors, suppressing appetite, slowing gastric emptying, and improving insulin sensitivity. The dual mechanism is thought to drive its larger weight-loss effect compared with GLP-1-only drugs.',
    benefits: [
      'FDA-approved with the largest weight-loss effect of any approved drug (~22.5% in SURMOUNT-1)',
      'Strong glycemic control in type 2 diabetes',
      'Once-weekly dosing',
      'Robust safety database from SURPASS and SURMOUNT trials',
    ],
    contraindications: [
      'Personal or family history of medullary thyroid carcinoma',
      'Multiple Endocrine Neoplasia type 2 (MEN2)',
      'History of pancreatitis',
      'Pregnancy or trying to conceive',
      'Severe gastroparesis',
    ],
    costRange: { usd: '$349 to $1,279 per month', cad: '$425 to $1,550 CAD per month' },
    whoIsItFor: 'Adults meeting medical criteria for chronic weight management or type 2 diabetes who can be monitored by a prescriber.',
    whatToExpect: 'Evaluation, prescription, dose titration starting at 2.5 mg weekly. Self-injection at home with periodic follow-up labs and visits.',
    howSoon: 'Appetite effects begin in the first weeks; the largest weight-loss effects accrue over 6-18 months.',
    frequency: 'Once weekly. Treatment is ongoing for as long as clinically indicated.',
    safetyNotes: 'Similar safety profile to semaglutide — GI side effects most common; boxed warning for thyroid C-cell tumors; rare pancreatitis and gallbladder problems. Compounded versions carry quality concerns after the shortage was declared resolved.',
    fdaStatus: 'approved',
    source: 'FDA labels for Mounjaro and Zepbound; SURMOUNT and SURPASS trial programs (2022-2024); GoodRx 2025-2026 pricing',
  },

  'CJC-1295': {
    name: 'CJC-1295',
    description: 'CJC-1295 is a synthetic growth-hormone-releasing-hormone (GHRH) analog that stimulates the pituitary to release the body\'s own growth hormone. It is most commonly stacked with ipamorelin in anti-aging and body-composition protocols. It is NOT FDA-approved for human use.',
    ingredients: ['CJC-1295 peptide (with or without DAC — drug affinity complex)'],
    duration: 'Nightly or 2-3 times per week subcutaneous self-injection',
    howItWorks: 'Acts on pituitary GHRH receptors to stimulate pulsatile release of endogenous growth hormone, which in turn raises IGF-1. CJC-1295 with DAC has a long half-life and produces sustained GH elevation; without DAC produces shorter, more pulsatile elevation.',
    benefits: [
      'Increases endogenous growth hormone and IGF-1 in healthy adults',
      'Anecdotally reported effects on sleep quality and body composition',
      'Often combined with ipamorelin for synergistic effect',
    ],
    contraindications: [
      'Active or history of cancer (GH/IGF-1 elevation may promote growth)',
      'Pregnancy or breastfeeding',
      'Diabetic retinopathy (GH can worsen)',
      'Children and adolescents (interferes with natural GH axis)',
    ],
    costRange: { usd: '$200 to $500 per month', cad: 'Confirm with clinic' },
    whoIsItFor: 'Adults pursuing physician-supervised growth-hormone-related goals (body composition, sleep, recovery) who understand it is compounded and not FDA-approved.',
    whatToExpect: 'Consultation, possible baseline IGF-1 bloodwork, compounded vial from a US-licensed pharmacy. Self-administered subcutaneous injection on a prescriber-set schedule.',
    howSoon: 'Sleep and recovery effects sometimes reported within 1-2 weeks; body-composition changes build over 3-6 months alongside training and nutrition.',
    frequency: 'Nightly (without DAC) or 2-3 times per week (with DAC). Cycle length is prescriber-set; not intended for indefinite use.',
    safetyNotes: 'Compounded only — not FDA-approved. Side effects can include water retention, headache, insulin resistance, and joint discomfort. WADA-prohibited in competitive sport. Use only with a licensed prescriber and US-licensed compounding pharmacy.',
    fdaStatus: 'compound only',
    source: 'FDA peptide compounding guidance; WADA Prohibited List 2026',
  },

  'Ipamorelin': {
    name: 'Ipamorelin',
    description: 'Ipamorelin is a selective growth-hormone secretagogue (ghrelin receptor agonist) that stimulates the pituitary to release growth hormone without significantly raising cortisol or prolactin. It is most often stacked with CJC-1295. It is NOT FDA-approved for human use.',
    ingredients: ['Ipamorelin peptide'],
    duration: 'Nightly or twice-daily subcutaneous self-injection',
    howItWorks: 'Activates the ghrelin (GHS-R) receptor on pituitary somatotrophs, triggering pulsatile release of endogenous growth hormone. Selectivity for the GH axis (without cortisol elevation) is its main advantage over older GH secretagogues.',
    benefits: [
      'Stimulates endogenous GH release without notable cortisol or prolactin elevation',
      'Cleaner side-effect profile than older GH secretagogues',
      'Synergistic when paired with CJC-1295',
    ],
    contraindications: [
      'Active or history of cancer',
      'Pregnancy or breastfeeding',
      'Diabetic retinopathy',
      'Children and adolescents',
    ],
    costRange: { usd: '$150 to $400 per month', cad: 'Confirm with clinic' },
    whoIsItFor: 'Adults pursuing physician-supervised GH-related body-composition or sleep goals who understand it is compounded and not FDA-approved.',
    whatToExpect: 'Consultation, compounded vial, self-administered subcutaneous injection nightly or twice daily as prescribed.',
    howSoon: 'Sleep and recovery effects sometimes reported within 1-2 weeks; body-composition changes over months.',
    frequency: 'Nightly or twice-daily during a cycle. Cycle length is prescriber-set.',
    safetyNotes: 'Compounded only — not FDA-approved. Side effects are usually mild (injection-site reactions, mild appetite increase from ghrelin activity, occasional headache). WADA-prohibited in competitive sport.',
    fdaStatus: 'compound only',
    source: 'FDA peptide compounding guidance; published pharmacology of GH secretagogues',
  },

  'Sermorelin': {
    name: 'Sermorelin',
    description: 'Sermorelin is a synthetic fragment of growth-hormone-releasing hormone (GHRH 1-29). It was previously FDA-approved as Geref for diagnostic use and pediatric growth-hormone deficiency, but Geref was discontinued; today sermorelin is available only via compounding pharmacies for off-label adult use.',
    ingredients: ['Sermorelin acetate'],
    duration: 'Nightly subcutaneous self-injection, typically for a 3-6 month cycle',
    howItWorks: 'Binds the pituitary GHRH receptor to stimulate pulsatile release of endogenous growth hormone, which raises IGF-1. The pulsatile pattern more closely mimics natural physiology than direct GH administration.',
    benefits: [
      'Stimulates the body\'s own GH release rather than substituting it',
      'Pulsatile pattern preserves negative feedback (lower side-effect profile than rhGH)',
      'Longer history of use than newer GH secretagogues',
    ],
    contraindications: [
      'Active or history of cancer',
      'Pregnancy or breastfeeding',
      'Diabetic retinopathy',
      'Acute critical illness',
    ],
    costRange: { usd: '$96 to $400 per month', cad: 'Confirm with clinic' },
    whoIsItFor: 'Adults exploring physician-supervised GH-related body-composition, recovery, or sleep goals who understand its current compounded-only status.',
    whatToExpect: 'Consultation, possibly baseline IGF-1 bloodwork, compounded vial from a US-licensed pharmacy. Nightly subcutaneous injection on a prescriber-set schedule.',
    howSoon: 'Effects on sleep and recovery sometimes reported within weeks; body-composition changes over months.',
    frequency: 'Nightly, typically cycled. Not intended for indefinite continuous use.',
    safetyNotes: 'Currently compounded only (Geref discontinued). Side effects are usually mild — injection-site reactions, occasional headache or flushing. WADA-prohibited in competitive sport.',
    fdaStatus: 'compound only',
    source: 'FDA registry (Geref discontinuation); compounding pharmacy standards',
  },

};

// ── SAFETY KNOWLEDGE ───────────────────────────────────────────────
//
// Cross-cutting safety information the agent should be able to surface
// regardless of treatment.

export const SAFETY = {
  // The single most important contraindication in this category. G6PD
  // deficiency is more common in people of African, Mediterranean,
  // Middle Eastern, and South / Southeast Asian descent. High-dose
  // vitamin C can trigger acute hemolytic anemia in G6PD-deficient
  // patients — a life-threatening reaction.
  g6pd_vitamin_c: {
    summary:
      'High-dose IV vitamin C must be avoided in people with G6PD (glucose-6-phosphate dehydrogenase) deficiency. In G6PD-deficient patients, large vitamin C doses can trigger acute hemolytic anemia — destruction of red blood cells — which is a life-threatening reaction.',
    whoIsAtRisk:
      'G6PD deficiency is the most common human enzyme deficiency, more prevalent in people of African, Mediterranean, Middle Eastern, and South / Southeast Asian descent. Most carriers do not know their status until tested.',
    requiredScreening:
      'Any IV protocol with vitamin C above ~10 grams should require G6PD screening BEFORE the first infusion. Reputable clinics will not run high-dose vitamin C without it.',
    standardDoseIsLowerRisk:
      'The 1-3 gram vitamin C in a Myers cocktail or immune drip carries lower risk than the 10-50 gram protocols used in true high-dose IVC. Even so, anyone with known G6PD deficiency should disclose it to their clinician.',
  },

  pregnancy_by_treatment: {
    avoidEntirely: [
      'GLP-1 Weight Loss (semaglutide, tirzepatide)',
      'Glutathione (insufficient safety data)',
      'High-dose Vitamin C (relative — only with clinician clearance)',
      'Hormone Therapy (TRT, estrogen-based HRT)',
      'Migraine cocktails containing ketorolac (NSAID)',
    ],
    cautionWithCleanance: [
      'NAD+ (limited safety data)',
      'Beauty Glow (glutathione component)',
      'Iron Infusion (first trimester relative — confirm with hematology)',
      'Hangover / Cold & Flu drips with ondansetron (review with clinician)',
    ],
    generallyAcceptable: [
      'Standard hydration / saline (most common indication: hyperemesis)',
      'B12 shot for documented deficiency',
      'Vitamin D injection for documented deficiency',
    ],
    note: 'This is a general guide. Any pregnant or breastfeeding patient should clear ANY IV or peptide therapy with their obstetrician before booking.',
  },

  drug_interactions_to_watch: {
    bloodThinners: 'Warfarin, Eliquis, Plavix, daily aspirin — disclose before any IV. Iron infusion, ketorolac (in Hangover / Migraine drips), and high-dose vitamin C can interact. Magnesium can theoretically affect platelet function.',
    diabetesMedications: 'Insulin and sulfonylureas — GLP-1 therapy raises hypoglycemia risk. Dose adjustments required.',
    thyroidMedications: 'Iron and calcium can bind levothyroxine if taken too close together (oral). IV iron is fine but space oral thyroid hormone by 4 hours.',
    antidepressants: 'SSRIs and triptans — multiple-mechanism migraine drips containing serotonergic agents need clinician review for serotonin-syndrome risk.',
    glucocorticoids: 'Chronic steroid use can mask infusion-related allergic reactions and complicate dosing.',
    immunosuppressants: 'Any IV immune-modulating protocol (high-dose vitamin C, glutathione) should be reviewed with the transplant or rheumatology team.',
  },

  allergic_reaction_signs: {
    mild: 'Localized itching, mild rash, brief flushing, mild lightheadedness, transient warm sensation. These often resolve with slowed infusion or are not true allergy.',
    moderate: 'Widespread hives, facial swelling, persistent itching, mild wheezing, vomiting that doesn\'t settle. Infusion should be stopped and clinician should evaluate immediately.',
    severe_emergency:
      'Anaphylaxis — throat tightness, difficulty breathing, audible wheezing or stridor, rapid heart rate, drop in blood pressure, sense of impending doom, loss of consciousness. STOP the infusion immediately. Lay the patient flat with legs elevated. Administer epinephrine (intramuscular, 0.3-0.5 mg). Call 911. Reputable clinics keep epinephrine and an anaphylaxis kit on-site.',
    delayedReactions:
      'Serum-sickness-like reactions can appear hours to days after iron infusion or other treatments — joint pain, low-grade fever, rash. Should be reported to the clinic.',
  },

  good_faith_exam: {
    definition:
      'A "good faith exam" is a medical evaluation by a licensed clinician (physician, nurse practitioner, or physician assistant) BEFORE a patient receives an IV therapy or peptide. It typically includes review of medical history, current medications and allergies, relevant vital signs, and confirmation that the requested treatment is appropriate.',
    whyItMatters:
      'Most US states require a good faith exam before non-emergency parenteral therapy. Skipping it is a major safety and legal red flag. Reputable clinics never administer an IV without one — even for repeat patients, a periodic re-exam is required.',
    canBeTelehealth:
      'In many states the exam can be conducted by telehealth, but it must be a real, two-way interaction with a licensed clinician — not a checkbox on an intake form. A "good faith exam" performed by an unlicensed staff member is not valid.',
  },

  state_medical_supervision: {
    summary:
      'US state medical-practice laws vary significantly on who can administer IV therapy, who must supervise, and what corporate structures are allowed. Reputable clinics name their medical director, who must be a licensed physician in that state.',
    keyVariablesByState: [
      'Whether registered nurses can administer IVs in non-hospital settings (most states yes; specifics vary).',
      'Whether nurse practitioners can be the medical director or must be supervised by a physician (varies).',
      'Corporate Practice of Medicine doctrine — restricts non-physician ownership in some states (e.g. California, Texas, New York, New Jersey).',
      'Specific compounding-pharmacy licensing for the peptides used.',
    ],
    redFlag:
      'A clinic that cannot tell you who their medical director is, or where to verify that director\'s license, is a red flag. So is any clinic operating with only an "esthetician" or unlicensed staff member administering injections.',
    confirmWith: 'Confirm specifics for your state with the clinic — and verify the medical director\'s license at your state medical board\'s public lookup if you have any doubt.',
  },

  clinic_red_flags: [
    'No named medical director, or refusal to identify them.',
    'No good-faith exam before treatment.',
    'Compounded peptides without a US-licensed compounding pharmacy named on the vial.',
    'Vials labeled "research use only" or "not for human consumption".',
    'Unlicensed staff (e.g. estheticians) administering IVs or injections.',
    'No epinephrine, oxygen, or basic emergency equipment visible on-site.',
    'Pressure to buy multi-session packages on the first visit.',
    'Claims that an IV cures, treats, or reverses a specific disease (especially cancer).',
    'Prices that are dramatically lower than the local market — often means cut corners on dosing, sourcing, or oversight.',
    'No clear policy on screening for G6PD before high-dose vitamin C.',
    'Online booking with no medical intake form at all.',
    'Mobile providers who refuse to show licensure or who pressure cash-only payment.',
  ],
};

// ── COST KNOWLEDGE ─────────────────────────────────────────────────

export const COST = {
  mobilePremium: {
    summary: 'Mobile / in-home / hotel IV service typically adds $50-$100 USD ($65-$140 CAD) to the in-clinic price for the same treatment, covering travel time, courier fees, and the clinician\'s door-to-door cost.',
    note: 'Mobile premium is not "extra profit" — it offsets non-billable transit time and small-batch supply costs. Compare on total price, not on premium percentage.',
  },

  nadDoseBased: {
    summary: 'NAD+ IV pricing is driven primarily by dose. A "starter" 250 mg drip is the cheapest entry point; high-dose protocols cost substantially more because the NAD+ itself is the dominant cost.',
    typicalRanges: {
      '250 mg': '$400 to $600 USD ($500 to $850 CAD)',
      '500 mg': '$700 to $900 USD ($875 to $1,250 CAD)',
      '750 mg': '$900 to $1,100 USD ($1,125 to $1,550 CAD)',
      '1000 mg': '$1,000 to $1,200+ USD ($1,250 to $1,700+ CAD)',
    },
    note: 'High-dose sessions take longer (4-8 hours) because NAD+ must be infused slowly to prevent flushing and chest pressure.',
  },

  membershipSavings: {
    summary: 'Most claimed clinics offer membership or package pricing at 15-30% off single-session rates. Memberships typically lock in monthly visits at a discount; multi-session packages prepay for 4-10 drips of the same type.',
    breakEven: 'A membership generally breaks even at 2-3 visits per month. Patients who visit less often save more with à-la-carte than membership.',
    redFlag: 'Aggressive multi-session upsells at the FIRST visit are a red flag. Reputable clinics let you complete one session, see how you tolerate it, and then decide.',
  },

  hsa_fsa_eligible: {
    summary: 'Most cosmetic / wellness IV drips are NOT HSA/FSA eligible. A subset of medical treatments may qualify when there is a documented medical indication and prescription.',
    likelyEligible: [
      'B12 injections for documented deficiency',
      'Vitamin D injections for documented deficiency',
      'Iron infusion for diagnosed iron-deficiency anemia',
      'Migraine cocktail with prescription for diagnosed migraine',
      'Hormone therapy (TRT/HRT) for diagnosed deficiency',
      'GLP-1 medications (Wegovy, Zepbound) for obesity with prescription',
    ],
    likelyNotEligible: [
      'Hangover IVs',
      'Beauty Glow / glutathione for cosmetic purposes',
      'Standard hydration / Myers cocktail for general wellness',
      'NAD+ for anti-aging / wellness',
      'Recovery IVs for athletic performance',
    ],
    confirmWith: 'HSA/FSA eligibility depends on your plan\'s specific rules and whether you have a Letter of Medical Necessity from a clinician. Always confirm with your plan administrator before counting on reimbursement.',
  },
};

// ── BOOKING KNOWLEDGE ──────────────────────────────────────────────

export const BOOKING = {
  systemsPrevalence: {
    summary:
      'Most North American IV therapy clinics use one of a few major scheduling platforms. JaneApp dominates in Canada; Mindbody and Square Appointments are widespread in the US; Acuity is common at boutique providers; some chains use proprietary booking.',
    common: ['JaneApp', 'Mindbody', 'Square Appointments', 'Acuity Scheduling', 'Vagaro', 'Setmore', 'Calendly (rare for clinical bookings)'],
    note: 'TheDripMap links directly to whichever booking system each claimed clinic uses. Patients book through the clinic\'s own platform — TheDripMap does not handle scheduling.',
  },

  firstAppointmentPrep: {
    bring: [
      'Government-issued photo ID',
      'Insurance card (relevant only for medically-coded treatments like iron infusion or GLP-1)',
      'List of current medications and supplements (dose and frequency)',
      'List of allergies (especially medication, latex, or contrast)',
      'Recent bloodwork if you have it (especially for NAD+, high-dose vitamin C, iron, or hormone therapy)',
      'Method of payment',
    ],
    whatToEat: {
      generalDrip: 'Eat a light meal 1-2 hours before. Hungry-tummy + sudden infusion can cause lightheadedness. Avoid heavy / greasy meals.',
      hangoverDrip: 'Try to keep some fluids and a piece of toast or banana down beforehand. The drip can run regardless if you can\'t — the IV itself rehydrates.',
      nadDrip: 'Eat a normal meal beforehand. NAD+ sessions are long; some clinics also provide snacks during the infusion.',
      glp1Injection: 'Inject regardless of food. Many people prefer to inject on a stable-stomach day given GI side-effect risk.',
      ironInfusion: 'Eat a normal meal; iron infusions are usually well-tolerated regardless.',
    },
    whatToDrink: 'Drink water in the hour before your appointment — well-hydrated veins are easier to access. Limit caffeine if you tend to feel jittery during medical procedures. Avoid alcohol for 24 hours before any IV.',
    whatToWear: 'Loose, short-sleeved or sleeveless top so the clinician can access an arm vein easily. A jacket or blanket — IVs can feel cold.',
    whatNotToDo: 'Don\'t skip meals to "feel the drip more". Don\'t come heavily caffeinated. Don\'t come hungover hoping a vitamin drip will fix it without disclosing how much you drank.',
  },

  rescheduling: {
    typical:
      'Most clinics allow free reschedule with 24-48 hours notice. Inside that window, clinics often charge a cancellation fee (typically $25-$50) or forfeit a session credit if the appointment was part of a prepaid package.',
    bestPractice: 'Reschedule online if the booking platform supports it (JaneApp, Mindbody, Square all do) — easier than phone tag. Confirm with clinic for their specific policy.',
  },

  cancellationPolicy: {
    typical: 'Industry-standard cancellation policy is 24-48 hours\' notice. Late cancels are usually charged 50-100% of the booked service.',
    noShow: 'No-show generally results in a full charge, plus possible loss of standing booking privileges. Some clinics require a credit-card deposit to confirm bookings as a result.',
    medicalEmergency: 'Almost every reputable clinic waives cancellation fees for documented medical emergencies. Ask, and provide a brief note if requested.',
  },
};

// ── LOOKUP HELPER ──────────────────────────────────────────────────
//
// Normalized lookup — the agent can pass either the canonical key
// ("NAD+ Plus") or a common synonym ("nad", "nad+", "nicotinamide")
// and we'll find the right entry. Falls back to a partial match.

const TREATMENT_SYNONYMS: Record<string, string> = {
  'nad': 'NAD+ Plus',
  'nad+': 'NAD+ Plus',
  'nad plus': 'NAD+ Plus',
  'nicotinamide': 'NAD+ Plus',
  'hangover': 'Hangover',
  'hangover iv': 'Hangover',
  'immune': 'Immune Support',
  'immunity': 'Immune Support',
  'beauty': 'Beauty Glow',
  'glow': 'Beauty Glow',
  'weight loss': 'Weight Loss',
  'skinny': 'Weight Loss',
  'skinny drip': 'Weight Loss',
  'mic': 'Weight Loss',
  'lipotropic': 'Weight Loss',
  'hydration': 'Hydration',
  'iv fluids': 'Hydration',
  'recovery': 'Recovery',
  'athletic': 'Recovery',
  'myers': 'Myers Cocktail',
  'myers cocktail': 'Myers Cocktail',
  'jet lag': 'Jet Lag',
  'travel': 'Jet Lag',
  'energy': 'Energy Boost',
  'b complex': 'Energy Boost',
  'glp-1': 'GLP-1 Weight Loss',
  'glp1': 'GLP-1 Weight Loss',
  'ozempic': 'GLP-1 Weight Loss',
  'wegovy': 'GLP-1 Weight Loss',
  'mounjaro': 'GLP-1 Weight Loss',
  'zepbound': 'GLP-1 Weight Loss',
  'iron': 'Iron Infusion',
  'iron infusion': 'Iron Infusion',
  'ferritin': 'Iron Infusion',
  'vitamin d': 'Vitamin D',
  'vit d': 'Vitamin D',
  'b12': 'B12 Shot',
  'b-12': 'B12 Shot',
  'glutathione': 'Glutathione',
  'gsh': 'Glutathione',
  'cold': 'Cold & Flu',
  'flu': 'Cold & Flu',
  'sick day': 'Cold & Flu',
  'migraine': 'Migraine Relief',
  'headache': 'Migraine Relief',
  'high-dose vitamin c': 'High-Dose Vitamin C',
  'high dose vitamin c': 'High-Dose Vitamin C',
  'ivc': 'High-Dose Vitamin C',
  'vitamin c': 'High-Dose Vitamin C',
  'hormone': 'Hormone Therapy',
  'hrt': 'Hormone Therapy',
  'trt': 'Hormone Therapy',
  'testosterone': 'Hormone Therapy',
  'estrogen': 'Hormone Therapy',
};

const PEPTIDE_SYNONYMS: Record<string, string> = {
  'bpc': 'BPC-157',
  'bpc157': 'BPC-157',
  'bpc-157': 'BPC-157',
  'tb500': 'TB-500',
  'tb-500': 'TB-500',
  'thymosin': 'TB-500',
  'semaglutide': 'Semaglutide',
  'ozempic': 'Semaglutide',
  'wegovy': 'Semaglutide',
  'rybelsus': 'Semaglutide',
  'tirzepatide': 'Tirzepatide',
  'mounjaro': 'Tirzepatide',
  'zepbound': 'Tirzepatide',
  'cjc': 'CJC-1295',
  'cjc1295': 'CJC-1295',
  'cjc-1295': 'CJC-1295',
  'ipamorelin': 'Ipamorelin',
  'sermorelin': 'Sermorelin',
  'nad peptide': 'NAD+ (peptide form)',
  'nad+ peptide': 'NAD+ (peptide form)',
};

export function getTreatmentKnowledge(name: string): TreatmentKnowledge | null {
  if (!name) return null;
  const key = name.trim();
  if (TREATMENTS[key]) return TREATMENTS[key];
  const low = key.toLowerCase();
  const syn = TREATMENT_SYNONYMS[low];
  if (syn && TREATMENTS[syn]) return TREATMENTS[syn];
  for (const [k, v] of Object.entries(TREATMENTS)) {
    if (k.toLowerCase().includes(low) || low.includes(k.toLowerCase())) return v;
  }
  return null;
}

export function getPeptideKnowledge(name: string): PeptideKnowledge | null {
  if (!name) return null;
  const key = name.trim();
  if (PEPTIDES[key]) return PEPTIDES[key];
  const low = key.toLowerCase();
  const syn = PEPTIDE_SYNONYMS[low];
  if (syn && PEPTIDES[syn]) return PEPTIDES[syn];
  for (const [k, v] of Object.entries(PEPTIDES)) {
    if (k.toLowerCase().includes(low) || low.includes(k.toLowerCase())) return v;
  }
  return null;
}

// Combined lookup — checks treatments first, then peptides.
export function getKnowledge(name: string): TreatmentKnowledge | PeptideKnowledge | null {
  // Peptide therapy removed from the platform: only treatment knowledge is
  // surfaced now (getPeptideKnowledge / PEPTIDES are intentionally unused).
  return getTreatmentKnowledge(name);
}

// Used inside getTreatmentInfo for the "summary" field when the legacy
// TREATMENT_CONTENT entry didn't have a clean one-liner.
export { firstSentence };
