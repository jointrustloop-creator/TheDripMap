/**
 * Normalized drip vocabulary (INTERNAL ONLY — operator-approved 2026-08-14).
 *
 * ~25 canonical substances + 12 named formulas that collapse essentially all
 * house-brand menu variance observed in the 30-clinic Canadian menu sample
 * (docs/research/patient-pain-research-2026-08.md). Used for normalizing
 * captured menus (clinic_drips) and, later, internal menu-scope review.
 *
 * cono_table2_status — whether a substance appears in Table 2 of Ontario's
 * General Regulation (O. Reg. 168/15), which defines and limits what an
 * Ontario ND may administer by injection. RULES (badge-standard SSOT §5):
 *  - We do NOT republish Table 2; statuses here are internal review aids only.
 *  - 'not_listed' is recorded ONLY where a source explicitly said so (CONO's
 *    own regulatory guidance: Table 2 does not include ozone, blood, plasma,
 *    EDTA/salts of EDTA, or oxygen). Everything else is 'unknown' until an
 *    operator verifies against the current regulation — never guessed.
 *  - Any flag derived from this is RELATIVE to an ND prescriber, never
 *    absolute, and the what-happens-next process is still an SSOT open item.
 *  - NO public surface may render these statuses (operator ruling).
 */

export type Table2Status = 'listed_verified' | 'not_listed' | 'unknown';

export interface CanonicalIngredient {
  id: string;               // stable snake_case key
  name: string;
  synonyms: string[];       // lowercase match terms seen on real menus
  class: 'fluid' | 'vitamin' | 'mineral' | 'antioxidant' | 'amino' | 'iron' | 'rx' | 'other';
  rx: boolean;              // prescription drug in Canada
  cono_table2_status: Table2Status;
  table2_source?: string;   // required when status !== 'unknown'
}

const CONO_GUIDANCE_SRC =
  'CONO Prescription and Non-prescription Drugs and Substances Information (2024): Table 2 does not include ozone, blood, plasma, EDTA/salts of EDTA, or oxygen.';

export const INGREDIENTS: CanonicalIngredient[] = [
  // fluids
  { id: 'normal_saline', name: 'Normal saline', synonyms: ['saline', 'ns', 'sodium chloride'], class: 'fluid', rx: false, cono_table2_status: 'unknown' },
  { id: 'lactated_ringers', name: "Lactated Ringer's", synonyms: ['ringers', "ringer's", 'lactated'], class: 'fluid', rx: false, cono_table2_status: 'unknown' },
  { id: 'dextrose', name: 'Dextrose', synonyms: ['d5w', 'glucose'], class: 'fluid', rx: false, cono_table2_status: 'unknown' },
  // vitamins
  { id: 'vitamin_c', name: 'Vitamin C (ascorbic acid)', synonyms: ['ascorbic', 'vitamin c', 'vit c', 'high-dose c'], class: 'vitamin', rx: false, cono_table2_status: 'unknown' },
  { id: 'b_complex', name: 'B-complex', synonyms: ['b complex', 'b-complex', 'b vitamins'], class: 'vitamin', rx: false, cono_table2_status: 'unknown' },
  { id: 'b12', name: 'Vitamin B12', synonyms: ['b12', 'methylcobalamin', 'cyanocobalamin', 'hydroxocobalamin'], class: 'vitamin', rx: false, cono_table2_status: 'unknown' },
  { id: 'b6', name: 'Vitamin B6', synonyms: ['b6', 'pyridoxine'], class: 'vitamin', rx: false, cono_table2_status: 'unknown' },
  { id: 'b5', name: 'Vitamin B5', synonyms: ['b5', 'dexpanthenol', 'pantothenic'], class: 'vitamin', rx: false, cono_table2_status: 'unknown' },
  { id: 'biotin', name: 'Biotin', synonyms: ['biotin', 'b7'], class: 'vitamin', rx: false, cono_table2_status: 'unknown' },
  { id: 'folate', name: 'Folate', synonyms: ['folic acid', 'folate', 'b9'], class: 'vitamin', rx: false, cono_table2_status: 'unknown' },
  // minerals
  { id: 'magnesium', name: 'Magnesium', synonyms: ['magnesium', 'mag sulfate', 'magnesium chloride'], class: 'mineral', rx: false, cono_table2_status: 'unknown' },
  { id: 'calcium', name: 'Calcium', synonyms: ['calcium', 'calcium gluconate'], class: 'mineral', rx: false, cono_table2_status: 'unknown' },
  { id: 'zinc', name: 'Zinc', synonyms: ['zinc', 'zinc sulfate'], class: 'mineral', rx: false, cono_table2_status: 'unknown' },
  { id: 'selenium', name: 'Selenium', synonyms: ['selenium'], class: 'mineral', rx: false, cono_table2_status: 'unknown' },
  // antioxidant / specialty
  { id: 'glutathione', name: 'Glutathione', synonyms: ['glutathione', 'l-glutathione', 'gsh'], class: 'antioxidant', rx: false, cono_table2_status: 'unknown' },
  { id: 'nad', name: 'NAD+', synonyms: ['nad+', 'nad', 'nicotinamide adenine dinucleotide'], class: 'antioxidant', rx: false, cono_table2_status: 'unknown' },
  { id: 'alpha_lipoic_acid', name: 'Alpha-lipoic acid', synonyms: ['ala', 'alpha lipoic', 'lipoic acid'], class: 'antioxidant', rx: false, cono_table2_status: 'unknown' },
  { id: 'nac', name: 'N-acetylcysteine', synonyms: ['nac', 'n-acetyl cysteine', 'acetylcysteine'], class: 'antioxidant', rx: false, cono_table2_status: 'unknown' },
  { id: 'curcumin', name: 'Curcumin', synonyms: ['curcumin', 'turmeric'], class: 'antioxidant', rx: false, cono_table2_status: 'unknown' },
  // amino / lipotropic
  { id: 'amino_blend', name: 'Amino acid blend', synonyms: ['amino acids', 'amino blend'], class: 'amino', rx: false, cono_table2_status: 'unknown' },
  { id: 'taurine', name: 'Taurine', synonyms: ['taurine'], class: 'amino', rx: false, cono_table2_status: 'unknown' },
  { id: 'carnitine', name: 'L-carnitine', synonyms: ['carnitine', 'l-carnitine'], class: 'amino', rx: false, cono_table2_status: 'unknown' },
  { id: 'mic', name: 'MIC (methionine, inositol, choline)', synonyms: ['mic', 'lipotropic', 'methionine inositol choline'], class: 'amino', rx: false, cono_table2_status: 'unknown' },
  // iron + rx add-ons
  { id: 'iron', name: 'Iron (sucrose / derisomaltose / carboxymaltose)', synonyms: ['iron', 'venofer', 'monoferric', 'ferinject', 'injectafer', 'iron sucrose', 'ferric'], class: 'iron', rx: true, cono_table2_status: 'unknown' },
  { id: 'ondansetron', name: 'Ondansetron', synonyms: ['ondansetron', 'zofran', 'anti-nausea'], class: 'rx', rx: true, cono_table2_status: 'unknown' },
  { id: 'ketorolac', name: 'Ketorolac', synonyms: ['ketorolac', 'toradol'], class: 'rx', rx: true, cono_table2_status: 'unknown' },
  // explicitly NOT in Table 2 per CONO's own guidance (the only sourced negatives)
  { id: 'edta', name: 'EDTA (chelation)', synonyms: ['edta', 'chelation'], class: 'other', rx: true, cono_table2_status: 'not_listed', table2_source: CONO_GUIDANCE_SRC },
  { id: 'ozone', name: 'Ozone', synonyms: ['ozone', 'ozone therapy', '10-pass'], class: 'other', rx: false, cono_table2_status: 'not_listed', table2_source: CONO_GUIDANCE_SRC },
  { id: 'oxygen', name: 'Oxygen', synonyms: ['oxygen'], class: 'other', rx: false, cono_table2_status: 'not_listed', table2_source: CONO_GUIDANCE_SRC },
  { id: 'blood_products', name: 'Blood / plasma products', synonyms: ['blood', 'plasma', 'prp iv'], class: 'other', rx: true, cono_table2_status: 'not_listed', table2_source: CONO_GUIDANCE_SRC },
];

export interface CanonicalFormula {
  id: string;
  name: string;
  synonyms: string[];       // house-brand names observed on real Canadian menus
  typicalIngredients: string[]; // ingredient ids — OUR normalization, never the clinic's claim
}

export const FORMULAS: CanonicalFormula[] = [
  { id: 'myers', name: "Myers' Cocktail", synonyms: ['myers', 'myers cocktail', 'wellness cocktail', 'general wellness boost'], typicalIngredients: ['b_complex', 'b12', 'vitamin_c', 'magnesium', 'calcium'] },
  { id: 'hydration', name: 'Hydration', synonyms: ['hydration', 'saline drip', 'max hydration', 'hydromax', 'replenish'], typicalIngredients: ['normal_saline'] },
  { id: 'hangover', name: 'Hangover / Recovery', synonyms: ['hangover', 'recovery', 'ultraviv', 'vital reset', 'recovery max', 'after party'], typicalIngredients: ['normal_saline', 'b_complex', 'ondansetron'] },
  { id: 'immune', name: 'Immune / Cold & Flu', synonyms: ['immune', 'immunity', 'flu fighter', 'triple defense', 'immune defence', 'cold and flu'], typicalIngredients: ['vitamin_c', 'zinc', 'b_complex'] },
  { id: 'high_dose_c', name: 'High-Dose Vitamin C', synonyms: ['high dose vitamin c', 'ultra c', 'high c', 'mega c'], typicalIngredients: ['vitamin_c'] },
  { id: 'glutathione_push', name: 'Glutathione Push', synonyms: ['glutathione', 'glut glow', 'radiance', 'skin brightening', 'vitaglow', 'anti-aging iv'], typicalIngredients: ['glutathione'] },
  { id: 'nad_infusion', name: 'NAD+ Infusion', synonyms: ['nad', 'nad+', 'nad premium', 'nad therapy'], typicalIngredients: ['nad'] },
  { id: 'energy', name: 'Energy / B12', synonyms: ['energy', 'nrg', 'energizer', 'megaboost', 'b12 boost'], typicalIngredients: ['b12', 'b_complex', 'amino_blend'] },
  { id: 'beauty', name: 'Beauty / Glow', synonyms: ['beauty', 'glow', 'beauty boost', 'hair skin nails', 'biotinlixer'], typicalIngredients: ['biotin', 'glutathione', 'vitamin_c'] },
  { id: 'athletic', name: 'Athletic Recovery', synonyms: ['athletic', 'performance', 'sport recovery', 'athlete'], typicalIngredients: ['amino_blend', 'b_complex', 'magnesium'] },
  { id: 'iron_infusion', name: 'Iron Infusion', synonyms: ['iron infusion', 'iron iv', 'venofer', 'monoferric'], typicalIngredients: ['iron'] },
  { id: 'weight_loss', name: 'Weight-Loss Support', synonyms: ['weight loss', 'fat burner', 'slim', 'diet detox', 'metabolism'], typicalIngredients: ['mic', 'b12'] },
];

/** Match a menu name to a canonical formula (best-effort; null = unmatched). */
export function matchFormula(menuName: string): CanonicalFormula | null {
  const n = menuName.toLowerCase();
  let best: CanonicalFormula | null = null;
  let bestLen = 0;
  for (const f of FORMULAS) {
    for (const syn of f.synonyms) {
      if (n.includes(syn) && syn.length > bestLen) { best = f; bestLen = syn.length; }
    }
  }
  return best;
}

/** Match free text (a menu blurb / ingredient list) to canonical ingredients. */
export function matchIngredients(text: string): CanonicalIngredient[] {
  const t = text.toLowerCase();
  return INGREDIENTS.filter((i) => i.synonyms.some((s2) => t.includes(s2)));
}
