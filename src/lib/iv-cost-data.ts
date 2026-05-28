// Real-world IV therapy price ranges (USD, out-of-pocket, single session unless
// noted), compiled May 2026 from a cross-section of US clinic price menus and
// independent pricing guides. These are directional RANGES, not quotes — actual
// price varies by city, provider, dose, add-ons, and membership status.
// Sources are surfaced on the page for transparency.

export interface IvCost {
  slug: string;
  name: string;
  low: number;
  typical: number;
  high: number;
  unit: 'session' | 'shot';
  blurb: string;
  note?: string;
  medical?: boolean; // usually a medical procedure, often insured (e.g. iron)
}

export const IV_COSTS: IvCost[] = [
  { slug: 'hydration', name: 'Basic Hydration / Saline', low: 85, typical: 125, high: 200, unit: 'session', blurb: '500mL–1L of saline to rehydrate. The simplest, cheapest drip on most menus.' },
  { slug: 'myers', name: "Myers' Cocktail", low: 150, typical: 200, high: 300, unit: 'session', blurb: 'The category benchmark — magnesium, B-vitamins, B12, calcium and vitamin C.' },
  { slug: 'hangover', name: 'Hangover Recovery', low: 150, typical: 200, high: 275, unit: 'session', blurb: 'Saline, anti-nausea, B-complex and electrolytes. A very common mobile request.' },
  { slug: 'immune', name: 'Immune Boost', low: 150, typical: 225, high: 330, unit: 'session', blurb: 'High-dose vitamin C with zinc and B-vitamins.' },
  { slug: 'energy', name: 'Energy / B-Complex', low: 135, typical: 185, high: 250, unit: 'session', blurb: 'B-complex, B12 and amino acids aimed at energy and focus.' },
  { slug: 'athletic', name: 'Athletic Recovery', low: 135, typical: 205, high: 335, unit: 'session', blurb: 'Magnesium, B-vitamins and amino acids for pre/post-event recovery.' },
  { slug: 'beauty', name: 'Beauty / Skin Glow', low: 200, typical: 275, high: 350, unit: 'session', blurb: 'Glutathione, biotin and vitamin C "glow" blends.' },
  { slug: 'vitamin-c', name: 'High-Dose Vitamin C', low: 100, typical: 175, high: 250, unit: 'session', blurb: 'Lower for 5–10g; immune/oncology-support doses cost more.' },
  { slug: 'glutathione', name: 'Glutathione', low: 150, typical: 250, high: 350, unit: 'session', blurb: 'Master antioxidant; price scales with dose (600mg → 2000mg).' },
  { slug: 'nad-250', name: 'NAD+ (250mg)', low: 250, typical: 300, high: 500, unit: 'session', blurb: 'Entry NAD+ dose; a 2–4 hour infusion. Price scales steeply with dose.' },
  { slug: 'nad-500', name: 'NAD+ (500mg)', low: 399, typical: 450, high: 700, unit: 'session', blurb: 'The common mid-tier NAD+ dose.' },
  { slug: 'nad-1000', name: 'NAD+ (1000mg)', low: 599, typical: 750, high: 1000, unit: 'session', blurb: 'High-dose NAD+; sometimes sold as multi-day protocols.' },
  { slug: 'magnesium', name: 'Magnesium', low: 30, typical: 100, high: 200, unit: 'session', blurb: 'Often a $25–35 add-on rather than a standalone session.', note: 'Most clinics sell magnesium as an add-on to a base drip.' },
  { slug: 'b12-shot', name: 'B12 Shot', low: 20, typical: 35, high: 75, unit: 'shot', blurb: 'An intramuscular shot, not a full IV.', note: 'Priced per shot — often a $25–35 add-on to a drip.' },
  { slug: 'mic-shot', name: 'Weight-Loss Support (MIC / Lipo)', low: 25, typical: 40, high: 75, unit: 'shot', blurb: 'Lipotropic (MIC) shot. Monthly programs run ~$99–179.', note: 'Priced per shot. Does not include semaglutide/GLP-1 programs.' },
  { slug: 'iron', name: 'Iron Infusion', low: 400, typical: 800, high: 4300, unit: 'session', medical: true, blurb: 'A medical procedure — not a wellness drip.', note: 'Usually billed through insurance; out-of-pocket varies widely by the iron drug used and the facility (hospital vs. infusion center).' },
];

// Modifiers applied on top of the base ranges.
export const MOBILE_PREMIUM = { low: 50, high: 100 }; // extra USD per at-home/hotel visit
export const MEMBERSHIP_DISCOUNT = { low: 0.15, high: 0.30 }; // members/pack-buyers typically pay this much less

export const PRICE_FACTORS: { title: string; body: string }[] = [
  { title: 'Ingredients & add-ons', body: 'Extra glutathione, B12, anti-nausea or high-dose actives each add $20–60 and push the total up fast.' },
  { title: 'NAD+ dose', body: 'The biggest swing within one treatment — 250mg vs 1000mg can quadruple the price.' },
  { title: 'City & location', body: 'Major metros (NYC, LA, SF) charge more than suburban or rural clinics due to rent and labor.' },
  { title: 'Mobile vs in-clinic', body: 'At-home/hotel concierge service adds roughly $50–100 per visit.' },
  { title: 'Provider type', body: 'Physician/RN-staffed clinics cost more than nurse-run IV bars; telehealth injection programs are cheapest.' },
  { title: 'Membership or package', body: 'Members and prepaid pack-buyers typically pay 15–30% less per session than walk-ins.' },
];

export const COST_METHODOLOGY =
  'These ranges were compiled in May 2026 from a cross-section of real US clinic price menus and independent pricing guides, normalized to single-session out-of-pocket figures. Where sources disagreed (common for NAD+, glutathione and iron), we report a consolidated low/typical/high rather than any single clinic\'s number. They are directional estimates, not quotes — actual prices vary by city, provider, exact dose, add-ons and membership status, and drift over time. Iron infusion is shown for reference only: it is usually a medical, insurance-billed procedure, hence its very wide band.';

export const COST_SOURCES: { label: string; url: string }[] = [
  { label: 'Onus IV — 2025 IV therapy cost guide', url: 'https://www.onusiv.com/blog/how-much-does-iv-therapy-cost' },
  { label: 'Hydrate IV Bar — price menu', url: 'https://hydrateivbar.com/pricing/' },
  { label: 'Lone Star IV Medics — packages', url: 'https://lonestarivmedics.com/iv-therapy-packages/' },
  { label: 'MD Infusions — NAD+ dose pricing', url: 'https://mdinfusions.com/nad-pricing/' },
  { label: 'GoodRx — iron infusion cost', url: 'https://www.goodrx.com/classes/iron-supplements/iron-infusion-cost' },
  { label: 'Bliss Mobile IV — mobile pricing & add-ons', url: 'https://www.blissmobileiv.com/how-much-does-iv-therapy-cost' },
  { label: 'Drip Hydration — membership plans', url: 'https://driphydration.com/iv-membership-plans/' },
];
