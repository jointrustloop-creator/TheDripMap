/**
 * Single source of truth for treatment one-line definitions.
 *
 * Used by:
 *  - Drip menu chips on claimed listings (DefinitiveListingLayout.tsx)
 *  - Service chips on unclaimed listings (app/providers/[slug]/page.tsx)
 *  - Treatment x city pages (app/iv-therapy/[treatment]/[city]/page.tsx)
 *  - Treatments glossary page (/treatments)
 *
 * Definitions are tap-to-expand (not hover), server-rendered as <details> so
 * the full text is crawlable. Treatments without a match show no tooltip
 * (graceful degradation).
 *
 * Copy is verbatim from scripts/directory-submission-quick-fills.md lines
 * 4217-4247. Hyphens (-) are fine, em-dashes and en-dashes are not allowed.
 *
 * Slugs point to /iv-therapy/{slug}/{city} matrix pages — only slugs that
 * exist in MATRIX_TREATMENT_SLUGS (app/sitemap.ts) are linked. Treatments
 * without a corresponding slug simply omit the Learn more link.
 */

export interface TreatmentDefinition {
  /** Canonical display name. */
  name: string;
  /** One-line definition, no em/en dashes. */
  definition: string;
  /** Treatment-page slug for /iv-therapy/{slug} Learn more link. Optional. */
  slug?: string;
}

/**
 * Keyed by lowercased display name for case-insensitive lookup.
 */
export const TREATMENT_DEFINITIONS: Record<string, TreatmentDefinition> = {
  'myers cocktail': {
    name: 'Myers Cocktail',
    definition:
      'A classic blended IV of B vitamins, vitamin C, magnesium and calcium, one of the original IV drip formulas, commonly chosen for hydration and general wellness.',
    slug: 'myers-cocktail',
  },
  'nad+ therapy': {
    name: 'NAD+ therapy',
    definition:
      'A slow IV infusion of NAD+, a coenzyme found in every cell, popular in wellness and anti-aging circles.',
    slug: 'nad-plus',
  },
  'glutathione': {
    name: 'Glutathione',
    definition:
      'An antioxidant the body makes naturally, given by IV or injection and often part of skin-brightening and detox-style protocols.',
    slug: 'glutathione',
  },
  'hydration': {
    name: 'Hydration',
    definition:
      'A simple IV of saline or electrolyte fluids to restore fluid balance, commonly used after travel, exercise, illness or drinking.',
    slug: 'hydration',
  },
  'immune support': {
    name: 'Immune support',
    definition:
      'An IV usually built around high-dose vitamin C, zinc and B vitamins, chosen by people looking to support their immune system.',
    slug: 'immune-support',
  },
  'energy / b12': {
    name: 'Energy / B12',
    definition:
      'Infusions or injections featuring B vitamins, especially B12, commonly used to address everyday tiredness.',
    // No dedicated matrix slug for energy/B12 — omit Learn more link.
  },
  'beauty + glow': {
    name: 'Beauty + glow',
    definition:
      'Blends combining antioxidants like glutathione and vitamin C with biotin, aimed at the appearance of skin, hair and nails.',
    slug: 'beauty-glow',
  },
  'skin brightening': {
    name: 'Skin brightening',
    definition:
      'Usually glutathione-led protocols aimed at a more even, brighter complexion.',
    // Closest existing slug would be glutathione but the operator instructions
    // say omit when no clean match. Keeping omitted to be conservative.
    slug: 'glutathione',
  },
  'anti-aging': {
    name: 'Anti-aging',
    definition:
      'Antioxidant and NAD+ based formulas centered on cellular health and the visible signs of aging.',
    slug: 'nad-plus',
  },
  'hangover recovery': {
    name: 'Hangover recovery',
    definition:
      'A mix of IV fluids, anti-nausea or anti-inflammatory medication and vitamins used to rehydrate and ease hangover symptoms.',
    slug: 'hangover-recovery',
  },
  'weight loss': {
    name: 'Weight loss',
    definition:
      'IV or injection support, often B vitamins, amino-acid blends or prescription GLP-1 medications, used alongside a broader weight-management plan and clinical guidance.',
    slug: 'weight-loss',
  },
  'jet lag recovery': {
    name: 'Jet lag recovery',
    definition:
      'Hydration with B vitamins and electrolytes used to ease the fatigue and dehydration of long-haul travel.',
    slug: 'hydration',
  },
  'iron infusion': {
    name: 'Iron infusion',
    definition:
      'A medical IV that replenishes iron stores, typically for diagnosed iron deficiency, and usually requires bloodwork and clinician assessment first.',
    slug: 'iron-infusion',
  },
  'athletic recovery': {
    name: 'Athletic recovery',
    definition:
      'Fluids, amino acids and electrolytes used by active people to rehydrate and support recovery after training.',
    slug: 'athletic-recovery',
  },
  'vitamin injections (im)': {
    name: 'Vitamin injections (IM)',
    definition:
      'Quick intramuscular shots such as B12 or vitamin D, offered as a faster alternative to a full IV drip.',
    // No matrix slug for IM injections — omit.
  },
  'general wellness': {
    name: 'General wellness',
    definition:
      'A foundational vitamin-and-fluid drip for a broad top-up rather than one specific goal.',
    slug: 'myers-cocktail',
  },
};

/**
 * Normalize a service name for matching: lowercase, trim, collapse whitespace,
 * strip trailing punctuation and the common "IV" / "drip" / "infusion" /
 * "therapy" / "push" / "shot" suffixes so "Glutathione Push" matches
 * "Glutathione".
 */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]+$/g, '')
    .replace(/\s+(iv|i\.v\.|drip|infusion|therapy|push|shot|injection)$/i, '')
    .trim();
}

/**
 * Case-insensitive lookup with light fuzzy logic.
 * Returns null if no reasonable match exists.
 *
 * Matching strategy (in order):
 *   1. Exact lowercased match against the map key
 *   2. Match after stripping the "IV / drip / infusion / therapy" suffix
 *   3. Substring match: the service name contains the canonical key
 *      (e.g. "Glutathione Push" contains "glutathione")
 *   4. Substring match: the canonical key contains the service name
 *      (e.g. "B12" matches "Energy / B12")
 *
 * Mirrors the dedupe approach in DefinitiveListingLayout.tsx (dedupeCi).
 */
export function findDefinition(serviceName: string): TreatmentDefinition | null {
  if (!serviceName || typeof serviceName !== 'string') return null;
  const raw = serviceName.toLowerCase().trim();
  if (!raw) return null;

  // 1. Exact match.
  if (TREATMENT_DEFINITIONS[raw]) return TREATMENT_DEFINITIONS[raw];

  // 2. Normalized (suffix-stripped) match.
  const normalized = normalizeForMatch(serviceName);
  if (normalized && TREATMENT_DEFINITIONS[normalized]) {
    return TREATMENT_DEFINITIONS[normalized];
  }

  // 3 + 4. Substring match in either direction. Prefer longer keys first so
  // "NAD+ therapy" beats "NAD+" when both could match.
  const keys = Object.keys(TREATMENT_DEFINITIONS).sort(
    (a, b) => b.length - a.length
  );

  // Special aliases that don't match by substring alone.
  const aliases: Record<string, string> = {
    'nad+': 'nad+ therapy',
    'nad plus': 'nad+ therapy',
    'nad': 'nad+ therapy',
    'b12': 'energy / b12',
    'b-12': 'energy / b12',
    'energy': 'energy / b12',
    'hangover': 'hangover recovery',
    'recovery': 'athletic recovery',
    'beauty': 'beauty + glow',
    'glow': 'beauty + glow',
    'beauty glow': 'beauty + glow',
    'jet lag': 'jet lag recovery',
    'travel': 'jet lag recovery',
    'iron': 'iron infusion',
    'immune': 'immune support',
    'immunity': 'immune support',
    'myers': 'myers cocktail',
    'wellness': 'general wellness',
    'anti aging': 'anti-aging',
    'antiaging': 'anti-aging',
  };
  if (aliases[normalized] && TREATMENT_DEFINITIONS[aliases[normalized]]) {
    return TREATMENT_DEFINITIONS[aliases[normalized]];
  }
  if (aliases[raw] && TREATMENT_DEFINITIONS[aliases[raw]]) {
    return TREATMENT_DEFINITIONS[aliases[raw]];
  }

  // Substring match: service contains key.
  for (const key of keys) {
    if (key.length < 4) continue; // avoid noise like "iv" matches
    if (normalized.includes(key) || raw.includes(key)) {
      return TREATMENT_DEFINITIONS[key];
    }
  }

  // Substring match: key contains service (e.g. "B12" -> "Energy / B12").
  for (const key of keys) {
    if (normalized.length < 4) continue;
    if (key.includes(normalized) || key.includes(raw)) {
      return TREATMENT_DEFINITIONS[key];
    }
  }

  return null;
}

/**
 * Return all definitions in alphabetical order by canonical display name.
 * Used by the /treatments glossary page.
 */
export function getAllDefinitionsAlphabetical(): TreatmentDefinition[] {
  return Object.values(TREATMENT_DEFINITIONS).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
