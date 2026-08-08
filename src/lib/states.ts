export interface StateInfo {
  slug: string;
  name: string;
  abbr: string;
  country: 'US' | 'Canada';
}

export const STATES: StateInfo[] = [
  { slug: 'florida',    name: 'Florida',     abbr: 'FL', country: 'US' },
  { slug: 'new-york',   name: 'New York',    abbr: 'NY', country: 'US' },
  { slug: 'texas',      name: 'Texas',       abbr: 'TX', country: 'US' },
  { slug: 'california', name: 'California',  abbr: 'CA', country: 'US' },
  { slug: 'virginia',   name: 'Virginia',    abbr: 'VA', country: 'US' },
  // Canadian provinces. Only Ontario existed until 2026-08-08, so every
  // Canadian city page OUTSIDE Ontario rendered a breadcrumb (and a
  // BreadcrumbList JSON-LD entry) pointing at /states/<province>, which 404'd:
  // Calgary and Edmonton to /states/alberta, Vancouver and Victoria to
  // /states/british-columbia, Montreal to /states/quebec, and so on. That is
  // 294 active clinics' worth of cities linking into dead ends. Listed in
  // descending clinic count; territories are omitted until we list a clinic there.
  { slug: 'ontario',                   name: 'Ontario',                   abbr: 'ON', country: 'Canada' },
  { slug: 'british-columbia',          name: 'British Columbia',          abbr: 'BC', country: 'Canada' },
  { slug: 'alberta',                   name: 'Alberta',                   abbr: 'AB', country: 'Canada' },
  { slug: 'quebec',                    name: 'Quebec',                    abbr: 'QC', country: 'Canada' },
  { slug: 'manitoba',                  name: 'Manitoba',                  abbr: 'MB', country: 'Canada' },
  { slug: 'saskatchewan',              name: 'Saskatchewan',              abbr: 'SK', country: 'Canada' },
  { slug: 'nova-scotia',               name: 'Nova Scotia',               abbr: 'NS', country: 'Canada' },
  { slug: 'new-brunswick',             name: 'New Brunswick',             abbr: 'NB', country: 'Canada' },
  { slug: 'newfoundland-and-labrador', name: 'Newfoundland and Labrador', abbr: 'NL', country: 'Canada' },
];

export function getStateBySlug(slug: string): StateInfo | undefined {
  return STATES.find((s) => s.slug === slug.toLowerCase());
}
