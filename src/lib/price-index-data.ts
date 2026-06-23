// Dated snapshots of published IV-therapy prices, aggregated per city from
// public clinic menus. This is the source of truth for the /iv-prices/[city]
// pages and the citable "IV Therapy Price Index."
//
// Method: collect publicly published prices from a city's IV clinics, take one
// representative (lowest listed) price per clinic per drip, then report the low,
// median, and high across clinics. Only treatments with at least 3 clinics are
// published. Owner-verified prices from the finish questionnaire are folded in
// as coverage grows, and the snapshot is refreshed by re-running the collection.
//
// v1 = Toronto (17 clinics, June 2026). Add a city by appending to PRICE_INDEX
// after a collection run reaches >=3 clinics on enough treatments.

export interface PriceRow {
  treatment: string;
  clinics: number; // clinics contributing a price for this drip
  low: number;
  median: number;
  high: number;
}

export interface CityPriceIndex {
  city: string;
  citySlug: string;
  asOf: string; // human-readable snapshot date, e.g. "June 2026"
  currency: 'CAD' | 'USD'; // labels the page + schema; derived from the city's country
  clinicCount: number; // clinics contributing at least one published price
  headline: PriceRow; // the standard drip, used for the answer-first sentence + meta
  rows: PriceRow[];
  note?: string;
}

export const PRICE_INDEX: Record<string, CityPriceIndex> = {
  calgary: {
    city: 'Calgary',
    citySlug: 'calgary',
    asOf: 'June 2026',
    currency: 'CAD',
    clinicCount: 6,
    headline: { treatment: 'Standard IV vitamin drip', clinics: 3, low: 75, median: 200, high: 260 },
    rows: [
      { treatment: 'Standard IV vitamin drip', clinics: 3, low: 75, median: 200, high: 260 },
      { treatment: 'Hydration', clinics: 4, low: 85, median: 125, high: 200 },
      { treatment: 'NAD+', clinics: 3, low: 60, median: 150, high: 167 },
    ],
    note: "Immune support, Glutathione, Athletic recovery and Myers' Cocktail drips had too few published prices in this round to report a reliable range. Some ranges span both add-on pushes and full drips.",
  },
  toronto: {
    city: 'Toronto',
    citySlug: 'toronto',
    asOf: 'June 2026',
    currency: 'CAD',
    clinicCount: 17,
    headline: { treatment: 'Standard IV vitamin drip', clinics: 9, low: 119, median: 175, high: 399 },
    rows: [
      { treatment: 'Standard IV vitamin drip', clinics: 9, low: 119, median: 175, high: 399 },
      { treatment: 'Glutathione', clinics: 10, low: 60, median: 189, high: 389 },
      { treatment: 'High-dose vitamin C', clinics: 10, low: 60, median: 197, high: 300 },
      { treatment: 'Hydration', clinics: 5, low: 95, median: 200, high: 250 },
      { treatment: 'NAD+', clinics: 5, low: 79, median: 250, high: 799 },
      { treatment: "Myers' Cocktail", clinics: 4, low: 106, median: 250, high: 300 },
      { treatment: 'Immune support', clinics: 4, low: 65, median: 143, high: 250 },
      { treatment: 'B12 injection', clinics: 3, low: 199, median: 220, high: 319 },
      { treatment: 'Athletic recovery', clinics: 3, low: 125, median: 150, high: 199 },
      { treatment: 'Beauty / glow', clinics: 3, low: 349, median: 464, high: 470 },
    ],
    note: 'Energy and weight-loss drips had too few published prices in this round to report a reliable range. Glutathione and B12 ranges span both add-on pushes and full drips.',
  },
  edmonton: {
    city: 'Edmonton',
    citySlug: 'edmonton',
    asOf: 'June 2026',
    currency: 'CAD',
    clinicCount: 8,
    headline: { treatment: 'Standard IV vitamin drip', clinics: 7, low: 75, median: 150, high: 295 },
    rows: [
      { treatment: 'Standard IV vitamin drip', clinics: 7, low: 75, median: 150, high: 295 },
      { treatment: 'Hydration', clinics: 4, low: 125, median: 160, high: 175 },
      { treatment: 'Beauty / glow', clinics: 4, low: 60, median: 160, high: 200 },
    ],
    note: "Immune support, Myers' Cocktail, Glutathione, NAD+ and B12 injection drips had too few published prices in this round to report a reliable range. Some ranges span both add-on pushes and full drips.",
  },
};

export function getCityPriceIndex(slug: string): CityPriceIndex | null {
  return PRICE_INDEX[slug.toLowerCase()] || null;
}

export function priceIndexCitySlugs(): string[] {
  return Object.keys(PRICE_INDEX);
}
