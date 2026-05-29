// Per-clinic Drip Assistant configurations.
//
// When the chat API receives ?clinic=<slug>, it loads the row from Supabase
// AND looks up an overlay config here. The overlay lets us hard-code a
// pretty clinic name, a curated treatment menu, opening hours, and any
// language tweaks that are specific to that clinic.
//
// The Supabase row provides: name, phone, online_booking_url, working_hours,
// website, address, city, state. The overlay is OPTIONAL — a brand-new
// white-label can launch with just the Supabase data.
//
// Add a new clinic: drop a key matching the provider's `slug`.

export interface WhitelabelConfig {
  /** Display name shown in the chat header and system prompt. Falls back to providers.name. */
  clinicName?: string;
  /** Logo URL — shown in the chat header when in white-label mode. */
  clinicLogo?: string;
  /** Headline list of treatments to surface in the system prompt. */
  treatments?: string[];
  /** Optional richer menu (used in the system prompt for price questions). */
  menu?: Array<{ name: string; price?: string; description?: string }>;
  /** Online booking deep link — falls back to providers.online_booking_url. */
  bookingUrl?: string;
  /** Human-readable hours line (e.g. "Mon-Fri 9-7, Sat 10-4, Sun closed"). */
  hours?: string;
  /** Phone — falls back to providers.phone. */
  phone?: string;
  /** Tagline shown under the clinic name in the chat header. */
  tagline?: string;
  /** Free-form extra instructions appended to the system prompt. */
  extraSystemPrompt?: string;
}

export const WHITELABEL_CONFIGS: Record<string, WhitelabelConfig> = {
  // Real claimed clinics — start as empty overlays; the public Supabase data
  // is enough to launch. Owners can layer their own copy on top later.
  'blue-cypress-iv-and-wellness-georgetown': {
    tagline: 'IV & Wellness · Georgetown, KY',
  },
  'refresh-med-spa-la-los-angeles': {
    tagline: 'Med Spa · Los Angeles, CA',
  },
  'signature-beauty-lounge-downtown-toronto': {
    tagline: 'Beauty Lounge · Toronto, ON',
  },
  'signature-beauty-lounge-richmond-hill': {
    tagline: 'Beauty Lounge · Richmond Hill, ON',
  },

  // Demo config used by /tools/clinic-agent-demo. Not a real clinic — fully
  // synthetic so we can show prospective owners exactly what their agent
  // will look like before they sign up.
  'drip-and-glow-wellness-toronto': {
    clinicName: 'Drip & Glow Wellness',
    tagline: 'IV Therapy & Wellness · Toronto, ON',
    clinicLogo: '/logo-mark.svg',
    treatments: [
      'Myers Cocktail',
      'Glow IV (glutathione)',
      'NAD+ Therapy',
      'Hangover Relief',
      'Immune Boost',
      'Weight Loss (semaglutide)',
    ],
    menu: [
      { name: 'Myers Cocktail', price: '$159 CAD', description: 'Classic recovery + immunity blend.' },
      { name: 'Glow IV', price: '$199 CAD', description: 'High-dose glutathione for skin clarity.' },
      { name: 'NAD+ 250mg', price: '$299 CAD', description: 'Cellular repair, energy, focus.' },
      { name: 'Hangover Relief', price: '$179 CAD', description: 'Fluids, anti-nausea, B-complex.' },
      { name: 'Immune Boost', price: '$149 CAD', description: 'Vitamin C, zinc, B-complex.' },
    ],
    bookingUrl: 'https://example.com/dripandglow/book',
    phone: '(416) 555-0142',
    hours: 'Mon-Fri 10am-7pm, Sat 10am-4pm, Sun closed',
  },
};

export function getWhitelabelConfig(slug: string | null | undefined): WhitelabelConfig | null {
  if (!slug) return null;
  return WHITELABEL_CONFIGS[slug] || null;
}
