// TheDripMap Transparency Score (2026-08).
//
// A 7 point score computed automatically from listing data. It reports
// DISCLOSURE FACTS ("this clinic publicly discloses X"), never safety or
// quality judgments. It sits BELOW Safety Verified, which stays human reviewed
// and is a separate, unchanged signal.
//
// IMPORTANT DATA NOTE: decision_drivers.manage (the /finish answers: team,
// firstVisit, drips) is stripped from the public/enriched provider shape by
// enrichProvider for security + payload reasons. Checks 1 to 4 depend on it,
// so the score MUST be computed server side from the RAW provider row and
// stored on the row (transparency_score, transparency_checks). Render surfaces
// read the stored value; they cannot recompute it because manage is gone.
//
// This module is pure and dependency free so both the app (server) and the
// nightly/edit recompute script can import the exact same logic (no drift).

export interface TransparencyCheck {
  key: string;
  label: string;   // plain, disclosure worded, no dashes, no medical claims
  passed: boolean;
}

export interface TransparencyResult {
  score: number;              // 0..7
  total: number;              // always 7
  checks: TransparencyCheck[];
  unmetLabels: string[];      // labels of checks not yet passed (for copy)
}

export const TRANSPARENCY_TOTAL = 7;

// The single shared tooltip line used everywhere the score appears.
export const TRANSPARENCY_TOOLTIP =
  'TheDripMap Transparency Score reports what a clinic publicly discloses. It is not a safety rating. Safety Verified is separate and reviewed by our team.';

// Ingredient level actives. Check 4 passes when the drip menu names specific
// ingredients (e.g. Glutathione, NAD, Vitamin C), not only branded blend names
// like "Myers' Cocktail" or "Hydration". Word boundary, case insensitive.
const INGREDIENT_RE = /\b(glutathione|nad\+?|vitamin\s*c|ascorbic|vitamin\s*d|vitamin\s*b|b-?12|b-?complex|methylcobalamin|magnesium|calcium|zinc|selenium|amino\s*acid|glutamine|taurine|arginine|lysine|carnitine|biotin|iron|ferric|saline|electrolyte|glutathi|alpha\s*lipoic|coq10|nicotinamide)\b/i;

// Words that indicate a screening/consult is disclosed as happening.
const SCREENING_YES = /\b(requir|recommend|yes|intake|screen|assess|consult)\b/i;
const SCREENING_NO = /^\s*(no|none|not required|n\/a)\s*$/i;

type Raw = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/**
 * Operator-verified prescriber record (2026-08-16 rule change). Stored at
 * decision_drivers.prescriber_verification by the /admin/badge-reviews
 * "record prescriber" action, and ONLY there — same human-only pattern as
 * safety_verified. Self-declared /finish answers never set it.
 *
 * Shape: { name, credential, reg_num, verified: true, verified_at, verified_by }
 */
export interface PrescriberVerification {
  name: string;
  credential: string;
  regNum: string;
  verifiedAt: string | null;
}

export function verifiedPrescriber(providerRaw: Raw | null | undefined): PrescriberVerification | null {
  const p = providerRaw || {};
  const dd = (p.decision_drivers && typeof p.decision_drivers === 'object' ? p.decision_drivers : {}) as Raw;
  const pv = (dd.prescriber_verification && typeof dd.prescriber_verification === 'object'
    ? dd.prescriber_verification : {}) as Raw;
  const name = str(pv.name);
  const regNum = str(pv.reg_num);
  if (pv.verified !== true || !name || !regNum) return null;
  return { name, credential: str(pv.credential), regNum, verifiedAt: str(pv.verified_at) || null };
}

/**
 * Compute the Transparency Score from a RAW provider row (must include
 * decision_drivers.manage; do NOT pass an enrichProvider() result here).
 */
export function computeTransparencyScore(providerRaw: Raw | null | undefined): TransparencyResult {
  const p = providerRaw || {};
  const dd = (p.decision_drivers && typeof p.decision_drivers === 'object' ? p.decision_drivers : {}) as Raw;
  const manage = (dd.manage && typeof dd.manage === 'object' ? dd.manage : {}) as Raw;
  const team = (manage.team && typeof manage.team === 'object' ? manage.team : {}) as Raw;
  const firstVisit = (manage.firstVisit && typeof manage.firstVisit === 'object' ? manage.firstVisit : {}) as Raw;

  const services = arr(p.services);
  const specialties = arr(p.specialties).map((x) => str(x));
  const drips = arr(manage.drips);
  const description = str(p.description);

  // 1. Prescriber verified (RULE CHANGE 2026-08-16): this point ONLY counts
  //    when a named prescriber with a registration number has been human
  //    verified by the operator (decision_drivers.prescriber_verification,
  //    written solely by /admin/badge-reviews). Self-declared oversight
  //    answers no longer earn it, so the max self-declared score is 6/7.
  const check1 = verifiedPrescriber(p) !== null;

  // 2. Administering professional identified: at least one role stated.
  const whoPlaces = arr(team.whoPlaces).map((x) => str(x)).filter(Boolean);
  const check2 = whoPlaces.length > 0;

  // 3. Health screening disclosed: a consult/screening policy is stated as
  //    happening (not "No"). Falls back to description keywords.
  const consult = str(firstVisit.consult);
  const check3 =
    (consult !== '' && !SCREENING_NO.test(consult) && SCREENING_YES.test(consult)) ||
    /\b(consultation|health screening|intake|pre visit assessment|medical history)\b/i.test(description);

  // 4. Drip ingredients disclosed: the menu names ingredient level actives.
  const serviceNames = services
    .map((s) => (s && typeof s === 'object' ? str((s as Raw).name) : str(s)))
    .filter(Boolean);
  const dripNames = drips.map((d) => (d && typeof d === 'object' ? str((d as Raw).name) : str(d))).filter(Boolean);
  const allMenuText = [...serviceNames, ...specialties, ...dripNames, description].join(' ');
  const check4 = INGREDIENT_RE.test(allMenuText);

  // 5. Pricing published: a price range or any priced service is visible.
  const priceRange = str(p.price_range);
  const anyServicePrice = services.some(
    (s) => s && typeof s === 'object' && str((s as Raw).price) !== ''
  );
  const anyDripPrice = drips.some((d) => d && typeof d === 'object' && str((d as Raw).price) !== '');
  const check5 = priceRange !== '' || anyServicePrice || anyDripPrice;

  // 6. Business details confirmed: phone, address, and website all present.
  const check6 = str(p.phone) !== '' && str(p.address) !== '' && str(p.website) !== '';

  // 7. Booking path available: an online booking link OR any stated booking
  //    method (a phone is a valid booking method, so mobile/phone only clinics
  //    pass; this is the fairness rule).
  const check7 =
    str(p.online_booking_url) !== '' || str(p.phone) !== '' || str(firstVisit.booking) !== '';

  const checks: TransparencyCheck[] = [
    { key: 'oversight', label: 'Prescriber verified with their regulator', passed: check1 },
    { key: 'administrator', label: 'Administering professional identified', passed: check2 },
    { key: 'screening', label: 'Health screening disclosed', passed: check3 },
    { key: 'ingredients', label: 'Drip ingredients disclosed', passed: check4 },
    { key: 'pricing', label: 'Pricing published', passed: check5 },
    { key: 'business', label: 'Business details confirmed', passed: check6 },
    { key: 'booking', label: 'Booking path available', passed: check7 },
  ];

  const score = checks.reduce((n, c) => n + (c.passed ? 1 : 0), 0);
  const unmetLabels = checks.filter((c) => !c.passed).map((c) => c.label);

  return { score, total: TRANSPARENCY_TOTAL, checks, unmetLabels };
}

// Map each check to the /finish field an owner completes to earn it. Used by
// the owner facing "raise your score" hints and by outreach copy.
export const CHECK_TO_FINISH_FIELD: Record<string, string> = {
  oversight: 'Your prescriber\'s name and registration number (we verify it with the register)',
  administrator: 'Who administers your IVs',
  screening: 'First visit and screening',
  ingredients: 'Your drip menu',
  pricing: 'Drip prices',
  business: 'Phone, address, and website',
  booking: 'Booking link or method',
};
