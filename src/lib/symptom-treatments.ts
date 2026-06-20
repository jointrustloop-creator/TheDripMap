// Quiz symptom → recommended treatment mapping.
//
// We deliberately frame these as commonly-paired protocols, not medical
// advice. Each entry also carries the keywords used to score clinics in
// matching.ts, so a single source of truth drives both the recommendation
// card on the results page and the per-clinic match scoring.

export interface SymptomOption {
  id: string;
  label: string;
  // 1-line subtitle shown under the option button
  desc: string;
  // Recommended treatment shown on the results page
  recommendedTreatment: {
    name: string;
    /** Short "what is it" line */
    what: string;
    /** Why this is commonly paired with this symptom */
    why: string;
    /** 3-4 concrete things the visitor should ask the clinic */
    askBeforeBooking: string[];
    /** Typical price range for context (USD, ballpark) */
    typicalCost: string;
    /** Typical session length */
    duration: string;
  };
  /** Keywords used by matching.ts to score clinics for this symptom */
  matchKeywords: string[];
}

export const SYMPTOMS: SymptomOption[] = [
  {
    id: 'wiped-out',
    label: "I'm wiped out",
    desc: 'Low energy, foggy, dragging through the day',
    recommendedTreatment: {
      name: 'Energy & B-Complex IV',
      what: 'A blend built around B12, B-complex, magnesium, and amino acids.',
      why: 'Most fatigue cases respond to a hydration + B-vitamin reset before you need anything stronger. Restores cellular energy without the cost of NAD+.',
      askBeforeBooking: [
        'Is methylcobalamin (active B12) included, not just cyanocobalamin?',
        'How much magnesium is in the bag?',
        'Will you check my blood pressure before infusion?',
      ],
      typicalCost: '$150 – $250',
      duration: '30 – 45 min',
    },
    matchKeywords: ['energy', 'b12', 'b-complex', 'b complex', 'fatigue', 'wellness', 'myers', 'cocktail'],
  },
  {
    id: 'fighting-cold',
    label: "I'm fighting a cold",
    desc: 'Run-down, scratchy throat, or recovering from illness',
    recommendedTreatment: {
      name: 'High-Dose Vitamin C + Zinc',
      what: 'High-dose vitamin C with zinc and often glutathione for immune support.',
      why: 'This protocol centers on higher-dose vitamin C with zinc, often alongside glutathione. Dosing varies by clinic, so ask the provider what is right for you.',
      askBeforeBooking: [
        'What is the vitamin C dose in grams?',
        'Do you screen for G6PD deficiency before high-dose vitamin C?',
        'Is glutathione push included or extra?',
      ],
      typicalCost: '$175 – $300',
      duration: '45 – 60 min',
    },
    matchKeywords: ['immune', 'vitamin c', 'zinc', 'wellness', 'glutathione', 'immunity', 'shield', 'defender'],
  },
  {
    id: 'hungover',
    label: "I'm hungover",
    desc: 'Need to feel human fast',
    recommendedTreatment: {
      name: 'Hangover Recovery Drip',
      what: '1L saline + anti-nausea (Zofran), B-complex, and toradol or similar for headache.',
      why: 'A common choice the morning after drinking. It pairs fluids with anti-nausea and B-complex; what is included varies by clinic.',
      askBeforeBooking: [
        'Is anti-nausea (Zofran) included or add-on?',
        'How quickly can you arrive if mobile?',
        'Do you screen for kidney issues before high-volume fluids?',
      ],
      typicalCost: '$150 – $300',
      duration: '30 – 45 min',
    },
    matchKeywords: ['hangover', 'hydration', 'recovery', 'rehydrate', 'detox', 'fluids', 'saline'],
  },
  {
    id: 'event-prep',
    label: 'Big event coming up',
    desc: 'Wedding, photoshoot, vacation, or special occasion',
    recommendedTreatment: {
      name: 'Beauty + Glow IV',
      what: 'Glutathione, biotin, vitamin C, and often a B-complex for skin/hair/nails.',
      why: 'Built around glutathione, biotin, and vitamin C. People often book it ahead of an event; what is included and how it is dosed varies by clinic.',
      askBeforeBooking: [
        'Is glutathione given IV or as a push at the end?',
        'How long before the event should I book — 24h, 48h, week-of?',
        'Is biotin actually included (some clinics charge separately)?',
      ],
      typicalCost: '$200 – $400',
      duration: '45 – 60 min',
    },
    matchKeywords: ['beauty', 'glow', 'glutathione', 'biotin', 'skin', 'collagen', 'hair'],
  },
  {
    id: 'flying',
    label: 'Flying soon or just landed',
    desc: 'Pre-flight prep or jet-lag recovery',
    recommendedTreatment: {
      name: 'Hydration + Immune IV',
      what: 'Generous fluids with vitamin C, zinc, and B-complex.',
      why: 'Air travel is dehydrating, so this drip leans on generous fluids plus vitamin C, zinc, and B-complex. What is included varies by clinic.',
      askBeforeBooking: [
        'Can you do mobile so I don\'t have to drive to a clinic?',
        'What time slots are open before my flight?',
        'Do you include a vitamin C push or oral support to take with me?',
      ],
      typicalCost: '$150 – $275',
      duration: '30 – 45 min',
    },
    matchKeywords: ['hydration', 'immune', 'jet', 'lag', 'travel', 'vitamin c', 'mobile'],
  },
  {
    id: 'workout-recovery',
    label: 'Recovering from a hard workout',
    desc: 'Sore, depleted, training for an event',
    recommendedTreatment: {
      name: 'Athletic Recovery IV',
      what: 'Saline, B-complex, amino acids (sometimes including BCAAs or taurine), and magnesium.',
      why: 'A hydration-and-electrolyte blend athletes commonly choose after hard training. It typically centers on fluids, B-complex, amino acids, and magnesium; the exact mix, and whether it fits your goals, varies by clinic.',
      askBeforeBooking: [
        'Do you include amino acids/BCAAs or is that an add-on?',
        'What\'s the magnesium dose?',
        'Is there an anti-inflammatory option (toradol) for race recovery?',
      ],
      typicalCost: '$175 – $325',
      duration: '45 – 60 min',
    },
    matchKeywords: ['recovery', 'athletic', 'sport', 'muscle', 'performance', 'amino', 'magnesium'],
  },
  {
    id: 'mental-sharp',
    label: 'I want to feel sharper',
    desc: 'Focus, clarity, executive performance',
    recommendedTreatment: {
      name: 'NAD+ Therapy',
      what: 'NAD+ (a coenzyme involved in cellular energy and DNA repair) infused slowly, usually 250-500 mg.',
      why: 'NAD+ levels decline with age, which is part of the appeal for anti-aging and longevity clinics. It requires a slow drip, so plan on being there 2+ hours.',
      askBeforeBooking: [
        'What dose are you administering? (250, 500, 750 mg)',
        'How slow is your drip — too fast can cause chest tightness',
        'Do you have a private room for the long session?',
      ],
      typicalCost: '$450 – $900',
      duration: '2 – 4 hours',
    },
    matchKeywords: ['nad', 'nicotinamide', 'anti-aging', 'longevity', 'cellular', 'rejuvenation', 'mental', 'cognitive'],
  },
  {
    id: 'skin-goals',
    label: 'Skin & glow goals',
    desc: 'Long-term skin clarity, brightening, anti-aging',
    recommendedTreatment: {
      name: 'Glutathione Series',
      what: 'High-dose glutathione, often paired with vitamin C and biotin. Usually done as a series (4-8 sessions).',
      why: 'Single sessions rarely produce visible results. The protocol most providers see results with is a weekly series for 4-8 weeks.',
      askBeforeBooking: [
        'Do you offer a discounted series package?',
        'What dose of glutathione per session?',
        'How quickly do most patients see results?',
      ],
      typicalCost: '$200 – $400 per session ($1.2k – $2.4k for a series)',
      duration: '45 – 60 min per session',
    },
    matchKeywords: ['beauty', 'glow', 'glutathione', 'skin', 'brightening', 'whitening', 'biotin'],
  },
  {
    id: 'iron',
    label: 'Iron or anemia — already diagnosed',
    desc: 'Blood test showed low iron or ferritin',
    recommendedTreatment: {
      name: 'Iron Infusion (Specialty)',
      what: 'Medical-grade iron formulation (Venofer, Injectafer, or Iron Sucrose) given over 15-60 minutes.',
      why: 'Oral iron is poorly absorbed and rough on the gut. IV iron raises ferritin much faster — but this is a medical procedure, not a wellness drip. Requires an MD or NP.',
      askBeforeBooking: [
        'Do you have a Medical Director or MD on-site for iron infusions?',
        'Which iron formulation do you use?',
        'Do you require recent bloodwork (ferritin + CBC) before infusion?',
      ],
      typicalCost: '$300 – $700',
      duration: '15 – 60 min (varies by formulation)',
    },
    matchKeywords: ['iron', 'anemia', 'ferritin', 'venofer', 'injectafer', 'medical'],
  },
  {
    id: 'just-curious',
    label: "Not sure — show me everything",
    desc: 'Browsing — help me understand options',
    recommendedTreatment: {
      name: 'Myers\' Cocktail',
      what: 'The original IV wellness drip — B vitamins, magnesium, calcium, and vitamin C. ~50 years of clinical use.',
      why: 'When you don\'t know what you need, Myers\' is the safe starting point. Most clinics offer it, it\'s well-tolerated, and it covers the most common deficiencies.',
      askBeforeBooking: [
        'What\'s in your Myers\' Cocktail — formulas vary clinic to clinic',
        'Do you offer a first-session discount?',
        'How will you decide if I need anything different next time?',
      ],
      typicalCost: '$150 – $275',
      duration: '30 – 45 min',
    },
    matchKeywords: ['myers', 'cocktail', 'wellness', 'b-complex', 'multivitamin', 'general'],
  },
];

export const SAFETY_FLAGS = [
  { id: 'pregnant', label: 'Pregnant or breastfeeding', flag: true },
  { id: 'kidney', label: 'Kidney condition', flag: true },
  { id: 'heart', label: 'Heart condition', flag: true },
  { id: 'blood-thinners', label: 'On blood thinners', flag: true },
  { id: 'diabetic', label: 'Diabetic', flag: true },
  { id: 'none', label: 'None of these apply', flag: false },
] as const;

export type SafetyFlagId = typeof SAFETY_FLAGS[number]['id'];

export function getSymptomById(id: string | undefined | null): SymptomOption | null {
  if (!id) return null;
  return SYMPTOMS.find((s) => s.id === id) || null;
}

export function getKeywordsForSymptom(id: string | undefined | null): string[] {
  const sym = getSymptomById(id);
  return sym?.matchKeywords || [];
}

/** Has the visitor flagged anything that warrants extra MD oversight in their search? */
export function hasSafetyFlag(flags: string[] | undefined | null): boolean {
  if (!flags || flags.length === 0) return false;
  return flags.some((f) => f && f !== 'none');
}
