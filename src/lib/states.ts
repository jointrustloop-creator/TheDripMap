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
  { slug: 'ontario',    name: 'Ontario',     abbr: 'ON', country: 'Canada' },
];

export function getStateBySlug(slug: string): StateInfo | undefined {
  return STATES.find((s) => s.slug === slug.toLowerCase());
}
