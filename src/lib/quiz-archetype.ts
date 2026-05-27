// Quiz Archetypes — shareable "Drip Type" personalities
//
// Maps quiz answers (goal, symptoms) → one of 6 personality archetypes.
// Each archetype has its own gradient palette + icon for the shareable
// 1080×1920 Instagram Story card generated at /api/quiz-card/[slug].

export interface ArchetypeIcon {
  // Single inline SVG path data, 24×24 viewBox, drawn in white at large
  // size on the share card. Keep paths simple — Satori (ImageResponse's
  // renderer) handles them but stroke caps must be explicit on the element.
  paths: string[];
  viewBox?: string;
}

export interface Archetype {
  slug: string;
  name: string; // "The Recovery Athlete"
  shortName: string; // "Recovery Athlete" — without "The" prefix for tighter contexts
  quote: string; // 2-line quote shown on the card
  gradient: {
    // Hex stops for the ImageResponse linear-gradient bg
    from: string;
    via?: string;
    to: string;
    // Tailwind class fragments for in-page hero (using same families)
    tailwind: string;
  };
  icon: ArchetypeIcon;
}

const ARCHETYPES: Record<string, Archetype> = {
  'recovery-athlete': {
    slug: 'recovery-athlete',
    name: 'The Recovery Athlete',
    shortName: 'Recovery Athlete',
    quote: 'You push hard.\nYour drips put you back together — faster than rest alone.',
    gradient: {
      from: '#14b8a6', // wellness-500
      via: '#0f766e',  // wellness-700
      to: '#064e3b',   // emerald-900
      tailwind: 'from-wellness-500 via-wellness-700 to-emerald-900',
    },
    icon: {
      // Lucide-style Dumbbell (simplified to 4 rect-like shapes via paths)
      paths: [
        'M6 8v8',
        'M10 8v8',
        'M14 8v8',
        'M18 8v8',
        'M3 12h2',
        'M19 12h2',
      ],
    },
  },
  'beauty-devotee': {
    slug: 'beauty-devotee',
    name: 'The Beauty Devotee',
    shortName: 'Beauty Devotee',
    quote: 'Glow is built from the inside out.\nYour secret has a needle and an IV bag.',
    gradient: {
      from: '#f472b6', // pink-400
      via: '#c026d3',  // fuchsia-600
      to: '#9f1239',   // rose-800
      tailwind: 'from-pink-400 via-fuchsia-600 to-rose-800',
    },
    icon: {
      // Lucide Sparkles, slightly simplified
      paths: [
        'M12 3 L13.5 9 L19.5 10.5 L13.5 12 L12 18 L10.5 12 L4.5 10.5 L10.5 9 Z',
        'M19 3 V6',
        'M21 4.5 H17.5',
        'M5 18 V21',
        'M6.5 19.5 H3.5',
      ],
    },
  },
  'brain-fog-fighter': {
    slug: 'brain-fog-fighter',
    name: 'The Brain-Fog Fighter',
    shortName: 'Brain-Fog Fighter',
    quote: "You're sharper than this.\nThe right drip clears the static in 45 minutes.",
    gradient: {
      from: '#8b5cf6', // violet-500
      via: '#4338ca',  // indigo-700
      to: '#0f172a',   // slate-900
      tailwind: 'from-violet-500 via-indigo-700 to-slate-900',
    },
    icon: {
      // Simplified Brain — two interlocking lobes
      paths: [
        'M9 4 C6 4 4 6 4 9 C4 10.5 4.5 11.5 5.5 12 C4.5 12.5 4 13.5 4 15 C4 18 6 20 9 20 L9 4 Z',
        'M15 4 C18 4 20 6 20 9 C20 10.5 19.5 11.5 18.5 12 C19.5 12.5 20 13.5 20 15 C20 18 18 20 15 20 L15 4 Z',
        'M9 12 L15 12',
      ],
    },
  },
  'immunity-shield': {
    slug: 'immunity-shield',
    name: 'The Immunity Shield',
    shortName: 'Immunity Shield',
    quote: "You're not waiting until you're sick.\nYour immune system runs offense.",
    gradient: {
      from: '#34d399', // emerald-400
      via: '#0d9488',  // teal-600
      to: '#155e75',   // cyan-800
      tailwind: 'from-emerald-400 via-teal-600 to-cyan-800',
    },
    icon: {
      // ShieldCheck — shield outline + interior check
      paths: [
        'M12 2 L4 5 V11 C4 16 7.5 20 12 22 C16.5 20 20 16 20 11 V5 L12 2 Z',
        'M8.5 12 L11 14.5 L15.5 9.5',
      ],
    },
  },
  'hangover-warrior': {
    slug: 'hangover-warrior',
    name: 'The Hangover Warrior',
    shortName: 'Hangover Warrior',
    quote: 'Last night was worth it.\nTomorrow starts in 45 minutes — not 45 hours.',
    gradient: {
      from: '#fbbf24', // amber-400
      via: '#ea580c',  // orange-600
      to: '#b91c1c',   // red-700
      tailwind: 'from-amber-400 via-orange-600 to-red-700',
    },
    icon: {
      // Wine glass — stem + bowl
      paths: [
        'M8 22 H16',
        'M12 15 V22',
        'M12 15 C9 15 7 13 7 10 C7 8 7.5 6 9 2 H15 C16.5 6 17 8 17 10 C17 13 15 15 12 15 Z',
        'M7 10 H17',
      ],
    },
  },
  'longevity-seeker': {
    slug: 'longevity-seeker',
    name: 'The Longevity Seeker',
    shortName: 'Longevity Seeker',
    quote: "You're playing the long game.\nNAD+ doesn't ask your age — only your ambition.",
    gradient: {
      from: '#38bdf8', // sky-400
      via: '#0891b2',  // cyan-600
      to: '#1e293b',   // slate-800
      tailwind: 'from-sky-400 via-cyan-600 to-slate-800',
    },
    icon: {
      // HeartPulse — heart shape with horizontal pulse line through middle
      paths: [
        'M19 14 C21 11 22 8 19.5 5.5 C17 3 14 4 12 7 C10 4 7 3 4.5 5.5 C2 8 3 11 5 14 L12 21 L19 14 Z',
        'M3 12 H7 L9 9 L13 15 L15 12 H21',
      ],
    },
  },
};

export function getArchetype(slug: string): Archetype | null {
  return ARCHETYPES[slug] || null;
}

export function getAllArchetypes(): Archetype[] {
  return Object.values(ARCHETYPES);
}

// Map quiz answers → archetype. Symptoms take priority over goal so a
// user who picked 'brain-fog' but with goal=nad-plus still gets the
// Brain-Fog Fighter (more specific). Default falls back to Longevity Seeker.
export function pickArchetype(input: {
  goal?: string;
  symptoms?: string[];
}): Archetype {
  const { goal, symptoms } = input;

  // Symptom-driven precedence
  if (symptoms && symptoms.length > 0) {
    const s = symptoms[0].toLowerCase();
    if (/hangover|drinking|hungover/.test(s)) return ARCHETYPES['hangover-warrior'];
    if (/brain.?fog|fatigue|exhaust|tired|focus/.test(s)) return ARCHETYPES['brain-fog-fighter'];
    if (/sick|flu|cold|immun|virus|catch/.test(s)) return ARCHETYPES['immunity-shield'];
    if (/wedding|event|glow|beauty|skin|pre.?event|date/.test(s)) return ARCHETYPES['beauty-devotee'];
    if (/workout|athlet|race|marathon|game|muscle|sore|train/.test(s)) return ARCHETYPES['recovery-athlete'];
    if (/aging|long|nad|energy|longevity/.test(s)) return ARCHETYPES['longevity-seeker'];
  }

  // Goal fallback
  switch ((goal || '').toLowerCase()) {
    case 'hangover':
    case 'hydration':
      return ARCHETYPES['hangover-warrior'];
    case 'recovery':
      return ARCHETYPES['recovery-athlete'];
    case 'beauty-glow':
      return ARCHETYPES['beauty-devotee'];
    case 'immune-support':
    case 'myers-cocktail':
      return ARCHETYPES['immunity-shield'];
    case 'nad-plus':
    case 'weight-loss':
      return ARCHETYPES['longevity-seeker'];
    default:
      return ARCHETYPES['longevity-seeker'];
  }
}
