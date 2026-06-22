// The knobs for the IV Price Index pipeline. Extending coverage or tuning
// precision = editing THIS file, not the scraper. Everything here was lifted
// from the validated Toronto extractor (.audit-tmp/_price-scrape-toronto.cjs)
// so re-running a city reproduces the shipped numbers.

// [regex, rawKey] context matchers. Precision over recall (this feeds a citable
// index). ORDER MATTERS: the first regex whose match touches a price's context
// window wins, so keep specific treatments above generic ones, and the catch-all
// "IV Drip (general)" last.
const MATCHERS = [
  [/myers/i, 'Myers Cocktail'],
  [/nad\b|nad\+/i, 'NAD+'],
  [/glutathion/i, 'Glutathione'],
  [/high.?dose.?(vitamin\s?)?c|vitamin\s?c\b|ascorbic/i, 'Vitamin C'],
  [/hydrat|rehydrat|\bsaline\b|\bfluids?\b/i, 'Hydration'],
  [/immun/i, 'Immune'],
  [/hangover/i, 'Hangover'],
  [/b-?12\b/i, 'B12'],
  [/beauty|\bglow\b|collagen|radian/i, 'Beauty'],
  [/athletic|performance|\brecovery\b/i, 'Athletic Recovery'],
  [/weight|metabolic|lipo|\bmic\b|slim/i, 'Weight Loss'],
  [/energy|b-?complex/i, 'Energy'],
  [/iv\s?drip|iv\s?therapy|iv\s?infusion|\bdrip\b|\binfusion\b/i, 'IV Drip (general)'],
];

// rawKey -> how it publishes. `display` is the public label shown on the page.
// `headline: true` pins the row as the answer-first standard drip (EXACTLY one
// entry should set it). A rawKey that matches during scraping but is NOT listed
// here is collected for the review doc but never published (treated as noise /
// not-yet-trusted). Hangover, Weight Loss and Energy are deliberately withheld:
// too few published prices and too much package/membership contamination so far.
const PUBLISH = {
  'IV Drip (general)': { display: 'Standard IV vitamin drip', headline: true },
  'Glutathione':       { display: 'Glutathione' },
  'Vitamin C':         { display: 'High-dose vitamin C' },
  'Hydration':         { display: 'Hydration' },
  'NAD+':              { display: 'NAD+' },
  'Myers Cocktail':    { display: "Myers' Cocktail" },
  'Immune':            { display: 'Immune support' },
  'B12':               { display: 'B12 injection' },
  'Athletic Recovery': { display: 'Athletic recovery' },
  'Beauty':            { display: 'Beauty / glow' },
};

// Context noise: a price whose surrounding text matches any of these is dropped
// (injectables, aesthetics, retail supplements, per-unit pricing, memberships).
const EXCLUDE = /botox|filler|kybella|belkyra|juvederm|dysport|\blaser\b|\bfacial\b|\bpeel\b|microneedl|\bprp\b|hydrafacial|membership|consultation|capsule|tablet|softgel|supplement|\bspray\b|\bcream\b|per unit|\/unit|\bsyringe\b|dermal|coolsculpt|\bwax\b|massage/i;

// $NNN / $N,NNN / $NNN.NN  (global; callers MUST reset .lastIndex before use)
const PRICE = /\$\s?\d{1,3}(?:,\d{3})?(?:\.\d{2})?/g;
const LINK = /href=["']([^"'#]+)["']/gi;
// In-page links worth following for a menu/price page.
const LINKHINT = /pric|menu|service|iv-|iv_|\bdrip|infusion|\brate|treatment|wellness|vitamin|therap/i;
// Common menu paths to try even if not linked from the homepage.
const GUESS = ['', '/pricing', '/services', '/menu', '/iv-menu', '/iv-therapy', '/iv-drips', '/iv-lounge', '/prices'];

const PRICE_MIN = 60;    // below this is almost always an add-on/booster, not a drip
const PRICE_MAX = 1500;  // above this is almost always a package/membership
const MIN_CLINICS = 3;   // publish threshold: a drip needs >=3 clinics to ship
const CTX_BEFORE = 85;   // chars of context scanned before a price
const CTX_AFTER = 35;    // chars of context scanned after a price

module.exports = {
  MATCHERS, PUBLISH, EXCLUDE, PRICE, LINK, LINKHINT, GUESS,
  PRICE_MIN, PRICE_MAX, MIN_CLINICS, CTX_BEFORE, CTX_AFTER,
};
