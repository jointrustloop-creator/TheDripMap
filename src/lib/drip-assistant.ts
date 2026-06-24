// Drip Assistant — the brains behind TheDripMap's chat agent.
//
// Kept separate from the API route so it can be white-labeled later: a
// clinic-specific assistant would just call buildSystemPrompt({ clinicName,
// clinicScope }) and reuse the same tools (scoped to one clinic's data).
//
// Tools query Supabase with the service-role key (server-side only).

import { getServiceSupabase } from './supabase';
import { TREATMENT_CONTENT } from './treatment-content';
import { getStatus } from './hours';
import { getKnowledge } from './agent-knowledge-base';

export interface AssistantClinic {
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  reviews: number | null;
  verified: boolean; // 5/5 safety verified
  claimed: boolean;
  mobile: boolean;
  website: string | null;
  phone: string | null;
  distanceMi: number | null; // straight-line miles from the user, when known
  bookingUrl?: string | null; // deep link to the clinic's online booking system (claimed clinics only)
}

export interface NearCoords { lat: number; lng: number }

function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Side-by-side comparison payload — emitted by compare_providers so the
// widget can render a small comparison table inside the chat.
export interface ComparePayload {
  providers: Array<{
    name: string;
    slug: string | null;
    city: string | null;
    state: string | null;
    rating: number | null;
    reviewCount: number | null;
    safetyVerified: boolean;
    claimed: boolean;
    treatments: string[];
    priceRange: string;
    distanceMi: number | null;
    bookable: boolean;
    phone: string | null;
  }>;
}

export interface ToolOutcome {
  forModel: string; // JSON/text the model reads
  clinics?: AssistantClinic[]; // structured cards for the UI
  comparison?: ComparePayload; // optional side-by-side payload for the widget
}

const SAFETY_FLAGS = [
  'verifiedMedicalDirector', 'verifiedClinician', 'verifiedCompoundingPharmacy',
  'verifiedLiabilityInsurance', 'verifiedStateBoard',
];

// Canadian provinces (full names — match what's stored in providers.state).
const CANADIAN_PROVINCES = new Set([
  'Ontario', 'British Columbia', 'Alberta', 'Quebec', 'Manitoba',
  'Nova Scotia', 'Saskatchewan', 'New Brunswick',
  'Newfoundland and Labrador', 'Prince Edward Island',
  'Northwest Territories', 'Nunavut', 'Yukon',
]);
function isCanadianState(state: string | null | undefined): boolean {
  return !!state && CANADIAN_PROVINCES.has(state.trim());
}
function countryOfState(state: string | null | undefined): 'CA' | 'US' {
  return isCanadianState(state) ? 'CA' : 'US';
}
function currencyForCountry(country: 'CA' | 'US'): 'CAD' | 'USD' {
  return country === 'CA' ? 'CAD' : 'USD';
}

// Treatment term -> keywords matched against name/description/specialties.
const TREATMENT_KEYWORDS: Record<string, string[]> = {
  hangover: ['hangover', 'rehydrate', 'recovery', 'detox'],
  nad: ['nad', 'nicotinamide', 'anti-aging', 'longevity'],
  immune: ['immune', 'immunity', 'vitamin c', 'zinc'],
  beauty: ['beauty', 'glow', 'glutathione', 'skin'],
  weight: ['weight', 'semaglutide', 'tirzepatide', 'mic', 'lipo', 'metabolism'],
  hydration: ['hydration', 'hydrate', 'saline', 'fluids'],
  recovery: ['recovery', 'athletic', 'sport', 'amino'],
  myers: ['myers', 'cocktail'],
  'jet lag': ['jet', 'travel', 'timezone', 'flight'],
  energy: ['energy', 'b12', 'b-complex', 'fatigue'],
};

function keywordsFor(treatment: string): string[] {
  const t = (treatment || '').toLowerCase();
  for (const [k, kws] of Object.entries(TREATMENT_KEYWORDS)) {
    if (t.includes(k) || kws.some((kw) => t.includes(kw))) return kws;
  }
  return t ? [t] : [];
}

function isMobileProvider(p: { type?: string | null; specialties?: string[] | null; mobile_service?: boolean | null }): boolean {
  if (p.mobile_service) return true;
  if ((p.type || '').toLowerCase() === 'mobile') return true;
  return (p.specialties || []).some((s) => (s || '').toLowerCase().includes('mobile'));
}

interface ProviderRow {
  name: string; slug: string | null; city: string | null; state: string | null;
  rating: number | string | null; reviews: number | string | null;
  is_featured: boolean | null; type: string | null; specialties: string[] | null;
  mobile_service: boolean | null; website: string | null; phone: string | null;
  description: string | null; working_hours: Record<string, unknown> | null; id: string;
  latitude?: number | string | null; longitude?: number | string | null;
  online_booking_url?: string | null;
}

function toClinic(p: ProviderRow, verified: boolean, distanceMi: number | null = null): AssistantClinic {
  return {
    name: p.name, slug: p.slug, city: p.city, state: p.state,
    rating: p.rating != null ? Number(p.rating) : null,
    reviews: p.reviews != null ? Number(p.reviews) : null,
    verified, claimed: !!p.is_featured, mobile: isMobileProvider(p),
    website: p.website, phone: p.phone,
    distanceMi: distanceMi != null ? Math.round(distanceMi * 10) / 10 : null,
    bookingUrl: p.online_booking_url || null,
  };
}

const NEAR_RADIUS_MI = 60; // "near me" search radius when only coordinates are known

// Top covered cities — used to make honest "we don't have that area, try these" suggestions.
async function topCoveredCities(sb: ReturnType<typeof getServiceSupabase>, limit = 6): Promise<string[]> {
  const { data } = await sb.from('providers').select('city').neq('availability', false).not('city', 'is', null).limit(3000);
  const counts: Record<string, number> = {};
  for (const r of (data as { city: string | null }[]) || []) {
    const k = (r.city || '').trim();
    if (k) counts[k] = (counts[k] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([c]) => c);
}

// ── search_providers ────────────────────────────────────────────────
async function searchProviders(input: {
  city?: string; treatment?: string; mobile_only?: boolean; open_now?: boolean; verified_only?: boolean;
  near?: NearCoords;
}): Promise<ToolOutcome> {
  const sb = getServiceSupabase();
  const hasCity = !!(input.city && input.city.trim());
  const near =
    input.near && Number.isFinite(input.near.lat) && Number.isFinite(input.near.lng) ? input.near : null;

  // CRITICAL: never return random global results. If we have neither a city nor
  // coordinates, instruct the model to ask the user for their city first.
  if (!hasCity && !near && !input.verified_only) {
    return {
      forModel: JSON.stringify({
        needs_location: true,
        note: 'No location is known yet. Ask the user what city they are in (one short question) before searching. Do NOT guess a city or list clinics.',
      }),
    };
  }

  let q = sb
    .from('providers')
    .select('id, name, slug, city, state, rating, reviews, is_featured, type, specialties, mobile_service, website, phone, description, working_hours, latitude, longitude, online_booking_url')
    .neq('availability', false);
  if (hasCity) q = q.ilike('city', `%${input.city!.trim()}%`);
  if (input.verified_only) q = q.eq('is_featured', true);
  q = q
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(near && !hasCity ? 1500 : 200);

  const { data, error } = await q;
  if (error) return { forModel: JSON.stringify({ error: 'search failed' }) };
  let rows = (data as ProviderRow[]) || [];

  if (input.treatment) {
    const kws = keywordsFor(input.treatment);
    if (kws.length) {
      rows = rows.filter((p) => {
        const hay = `${p.name || ''} ${p.description || ''} ${(p.specialties || []).join(' ')}`.toLowerCase();
        return kws.some((kw) => hay.includes(kw));
      });
    }
  }
  if (input.mobile_only) rows = rows.filter(isMobileProvider);
  if (input.open_now) {
    // Strict: only include clinics whose hours we can confirm are open right
    // now. Unparseable / missing hours are excluded rather than silently shown
    // as open — the user asked for confirmed-open results.
    rows = rows.filter((p) => {
      try {
        const s = getStatus(p.working_hours as never);
        return s?.isOpen === true;
      } catch {
        return false;
      }
    });
  }

  // Attach straight-line distance when coordinates are known, then rank.
  const coordOf = (p: ProviderRow): [number, number] | null => {
    const lat = p.latitude != null ? Number(p.latitude) : NaN;
    const lng = p.longitude != null ? Number(p.longitude) : NaN;
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  };
  let ranked = rows.map((r) => {
    const c = coordOf(r);
    const dist = near && c ? haversineMi(near.lat, near.lng, c[0], c[1]) : null;
    return { r, dist };
  });

  if (near) {
    let inRange = ranked.filter((x) => x.dist != null);
    // When the user only gave coordinates (no city), keep results within a sane radius.
    if (!hasCity) inRange = inRange.filter((x) => (x.dist as number) <= NEAR_RADIUS_MI);
    inRange.sort((a, b) => {
      if (!!b.r.is_featured !== !!a.r.is_featured) return (b.r.is_featured ? 1 : 0) - (a.r.is_featured ? 1 : 0);
      return (a.dist as number) - (b.dist as number);
    });
    // If nothing has coordinates / nothing in range, fall back to the unranked set
    // (still city-scoped if a city was given) rather than showing nothing wrong.
    ranked = inRange.length ? inRange : ranked.filter((x) => x.dist == null);
  }

  if (ranked.length === 0) {
    const suggestedCities = await topCoveredCities(sb);
    return {
      forModel: JSON.stringify({
        count: 0,
        clinics: [],
        note: hasCity
          ? `No clinics found in "${input.city}". Tell the user honestly we don't list that area yet, and offer one of the covered cities below or browsing the full matching platform.`
          : 'No clinics found near those coordinates. Ask for a city or suggest a covered city below.',
        suggestedCities,
      }),
    };
  }

  // verified = claimed + all 5 safety flags. Look up profiles for the top slice.
  const top = ranked.slice(0, 6);
  const claimedIds = top.filter((x) => x.r.is_featured).map((x) => x.r.id);
  const verifiedSet = new Set<string>();
  if (claimedIds.length) {
    const { data: profs } = await sb.from('operator_profiles').select('clinic_id, profile_data').in('clinic_id', claimedIds);
    for (const pr of (profs as { clinic_id: string; profile_data: Record<string, unknown> | null }[]) || []) {
      const pd = pr.profile_data || {};
      if (SAFETY_FLAGS.every((f) => pd[f] === true)) verifiedSet.add(pr.clinic_id);
    }
  }

  const clinics = top.slice(0, 4).map((x) => toClinic(x.r, verifiedSet.has(x.r.id), x.dist));
  const forModel = JSON.stringify({
    count: ranked.length,
    rankedBy: near ? 'distance' : 'relevance',
    clinics: clinics.map((c) => {
      const country = countryOfState(c.state);
      return {
        name: c.name, city: c.city, state: c.state, rating: c.rating, reviews: c.reviews,
        verified: c.verified, claimed: c.claimed, mobile: c.mobile, slug: c.slug,
        distanceMi: c.distanceMi,
        country, currency: currencyForCountry(country),
        hasOnlineBooking: !!c.bookingUrl,
      };
    }),
  });
  return { forModel, clinics };
}

// ── get_provider ────────────────────────────────────────────────────
async function getProvider(input: { slug?: string }): Promise<ToolOutcome> {
  if (!input.slug) return { forModel: JSON.stringify({ error: 'slug required' }) };
  const sb = getServiceSupabase();
  const { data: p } = await sb
    .from('providers')
    .select('id, name, slug, city, state, rating, reviews, is_featured, type, specialties, mobile_service, website, phone, description, working_hours')
    .eq('slug', input.slug)
    .maybeSingle();
  if (!p) {
    // Try a fuzzy name match so "is Refresh Med Spa verified?" works.
    const { data: alt } = await sb
      .from('providers')
      .select('id, name, slug, city, state, rating, reviews, is_featured, type, specialties, mobile_service, website, phone, description, working_hours, online_booking_url')
      .ilike('name', `%${input.slug.replace(/-/g, ' ')}%`)
      .order('is_featured', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!alt) return { forModel: JSON.stringify({ found: false }) };
    return providerOutcome(alt as ProviderRow, sb);
  }
  return providerOutcome(p as ProviderRow, sb);
}

async function providerOutcome(p: ProviderRow, sb: ReturnType<typeof getServiceSupabase>): Promise<ToolOutcome> {
  let verifiedCount = 0;
  if (p.is_featured) {
    const { data: prof } = await sb.from('operator_profiles').select('profile_data').eq('clinic_id', p.id).maybeSingle();
    const pd = (prof?.profile_data || {}) as Record<string, unknown>;
    verifiedCount = SAFETY_FLAGS.filter((f) => pd[f] === true).length;
  }
  // Badge gates on providers.safety_verified column only (2026-06-08).
  // verifiedCount is retained so the assistant can still mention "N/5 checks"
  // when describing where the clinic stands in the attestation flow.
  const verified = (p as { safety_verified?: boolean }).safety_verified === true;
  const clinic = toClinic(p, verified);
  const forModel = JSON.stringify({
    found: true, name: p.name, city: p.city, state: p.state,
    rating: clinic.rating, reviews: clinic.reviews,
    claimed: !!p.is_featured, safetyVerified: verified, verifiedChecks: `${verifiedCount}/5`,
    mobile: clinic.mobile, specialties: p.specialties || [],
    hasWebsite: !!p.website, slug: p.slug,
  });
  return { forModel, clinics: [clinic] };
}

// ── screen_patient ──────────────────────────────────────────────────
// Structured safety triage that runs BEFORE the model recommends a treatment
// with known contraindications. Never refuses help — only filters to safer
// options (claimed/verified clinics with medical-director oversight) when an
// answer flags a concern. The model accumulates the user's answers across
// turns and re-calls this tool each time.

type SafetyTier = 'green' | 'amber' | 'red';
type SafetyFlag = 'pregnant' | 'kidney' | 'g6pd' | 'thinners';

const SAFETY_MATRIX: Record<string, Record<SafetyFlag, SafetyTier>> = {
  'Standard Hydration / Myers': { pregnant: 'green', kidney: 'amber', g6pd: 'green', thinners: 'green' },
  'High-Dose Vitamin C':        { pregnant: 'amber', kidney: 'amber', g6pd: 'red',   thinners: 'green' },
  'NAD+':                       { pregnant: 'amber', kidney: 'amber', g6pd: 'green', thinners: 'green' },
  'GLP-1 Weight Loss':          { pregnant: 'red',   kidney: 'amber', g6pd: 'green', thinners: 'green' },
  'Iron Infusion':              { pregnant: 'green', kidney: 'amber', g6pd: 'green', thinners: 'amber' },
  'Glutathione':                { pregnant: 'amber', kidney: 'green', g6pd: 'green', thinners: 'green' },
};

function normalizeTreatmentForSafety(name: string): keyof typeof SAFETY_MATRIX {
  const t = (name || '').toLowerCase().trim();
  if (/(glp-?1|semaglutide|ozempic|wegovy|mounjaro|tirzepatide)/.test(t)) return 'GLP-1 Weight Loss';
  if (/high.?dose.?vit|ivc\b|^vit\.?\s*c$|vitamin\s*c\b/.test(t)) return 'High-Dose Vitamin C';
  if (/glutathione|gsh/.test(t)) return 'Glutathione';
  if (/iron|ferritin/.test(t)) return 'Iron Infusion';
  if (/nad/.test(t)) return 'NAD+';
  return 'Standard Hydration / Myers';
}

function maxSafetyTier(tiers: SafetyTier[]): SafetyTier {
  if (tiers.includes('red')) return 'red';
  if (tiers.includes('amber')) return 'amber';
  return 'green';
}

const SCREEN_QUESTIONS: Record<SafetyFlag, string> = {
  pregnant: 'Are you currently pregnant or breastfeeding?',
  kidney: 'Do you have any kidney disease or reduced kidney function?',
  g6pd: "Do you have G6PD deficiency? (No worries if you don't know — most people haven't been tested.)",
  thinners: 'Are you currently taking any blood thinners (warfarin, Eliquis, Plavix, daily aspirin, etc.)?',
};

interface ScreenInput {
  treatment_considering?: string;
  pregnant_or_breastfeeding?: boolean | null;
  kidney_disease?: boolean | null;
  g6pd_deficiency?: boolean | null;
  on_blood_thinners?: boolean | null;
  prior_iv_therapy?: boolean | null;
}

function screenPatient(input: ScreenInput): ToolOutcome {
  const treatment = normalizeTreatmentForSafety(input.treatment_considering || '');
  const matrix = SAFETY_MATRIX[treatment];

  // A flag is relevant for this treatment if its cell is amber or red. Green
  // cells are skipped — no point asking about G6PD for plain hydration.
  const relevant: Record<SafetyFlag, boolean> = {
    pregnant: matrix.pregnant !== 'green',
    kidney: matrix.kidney !== 'green',
    g6pd: matrix.g6pd !== 'green',
    thinners: matrix.thinners !== 'green',
  };
  const answers: Record<SafetyFlag, boolean | null | undefined> = {
    pregnant: input.pregnant_or_breastfeeding,
    kidney: input.kidney_disease,
    g6pd: input.g6pd_deficiency,
    thinners: input.on_blood_thinners,
  };

  const order: SafetyFlag[] = ['pregnant', 'kidney', 'g6pd', 'thinners'];
  const pendingQuestions: string[] = order
    .filter((f) => relevant[f] && answers[f] == null)
    .map((f) => SCREEN_QUESTIONS[f]);

  // Compute tier from "true" answers on relevant flags. False answers (user
  // does NOT have the condition) don't contribute to the tier.
  const tiers: SafetyTier[] = [];
  const redFlags: string[] = [];
  if (answers.pregnant === true && relevant.pregnant) {
    tiers.push(matrix.pregnant);
    if (matrix.pregnant === 'red') redFlags.push(`${treatment} is contraindicated in pregnancy/breastfeeding`);
    else if (matrix.pregnant === 'amber') redFlags.push(`${treatment} requires medical-director oversight in pregnancy/breastfeeding`);
  }
  if (answers.kidney === true && relevant.kidney) {
    tiers.push(matrix.kidney);
    if (matrix.kidney === 'red') redFlags.push(`${treatment} is contraindicated with kidney disease`);
    else if (matrix.kidney === 'amber') redFlags.push(`${treatment} requires kidney-function review before treatment`);
  }
  if (answers.g6pd === true && relevant.g6pd) {
    tiers.push(matrix.g6pd);
    if (matrix.g6pd === 'red') redFlags.push(`${treatment} is contraindicated with G6PD deficiency`);
    else if (matrix.g6pd === 'amber') redFlags.push(`${treatment} requires extra screening with G6PD deficiency`);
  }
  if (answers.thinners === true && relevant.thinners) {
    tiers.push(matrix.thinners);
    if (matrix.thinners === 'red') redFlags.push(`${treatment} requires anticoagulation clearance before treatment`);
    else if (matrix.thinners === 'amber') redFlags.push(`${treatment} needs the clinician to know about your blood thinner before treatment`);
  }

  const safetyTier: SafetyTier = tiers.length ? maxSafetyTier(tiers) : 'green';

  let disclaimer = '';
  if (safetyTier === 'red') {
    disclaimer = `Based on what you've shared, ${treatment} has a serious safety consideration — ${redFlags[0]}. Please confirm with the clinic's medical director before booking.`;
  } else if (safetyTier === 'amber') {
    disclaimer = `Based on what you've shared, ${treatment} is generally safe with proper medical oversight. Please confirm with the clinic's medical director before booking — they'll want to know about: ${redFlags.join('; ')}.`;
  }

  const note = pendingQuestions.length > 0
    ? "More screening questions still to ask. Ask the FIRST pending question conversationally — one at a time, with brief reassuring framing (not as a form). After the user answers, call screen_patient again with all known answers."
    : safetyTier === 'green'
      ? 'No safety concerns flagged. Proceed with the clinic search normally.'
      : "Proceed with search_providers (pass verified_only=true so we route to MD-led claimed clinics). Include the disclaimer in your response. NEVER refuse to help — this tool only filters to safer options. If no verified clinic exists in the user's city, say so honestly and offer covered cities.";

  return {
    forModel: JSON.stringify({
      treatment,
      safetyTier,
      redFlags,
      disclaimer,
      recommendedFilters: { verified_only: safetyTier !== 'green' },
      stillSearchable: true,
      pendingQuestions,
      priorIVTherapy: input.prior_iv_therapy ?? null,
      note,
    }),
  };
}

// ── get_treatment_info ──────────────────────────────────────────────
// Reads from the agent knowledge base (src/lib/agent-knowledge-base.ts)
// when available, falling back to TREATMENT_CONTENT otherwise. The
// knowledge base provides structured, sourced detail (FDA status,
// contraindications, dose-based pricing) the model can use in answers.
function getTreatmentInfo(input: { treatment_name?: string; country?: string }): ToolOutcome {
  const name = (input.treatment_name || '').toLowerCase().trim();
  if (!name) return { forModel: JSON.stringify({ error: 'treatment_name required' }) };
  const isCanada = (input.country || '').trim().toLowerCase() === 'canada';
  const currency = isCanada ? 'CAD' : 'USD';

  // Knowledge base lookup first — covers treatments with synonyms.
  const kb = getKnowledge(name);

  // Legacy TREATMENT_CONTENT lookup for the cost/safety fallback.
  const entry = Object.entries(TREATMENT_CONTENT).find(([key]) => {
    const k = key.toLowerCase();
    return k.includes(name) || name.includes(k) || name.includes(k.split(' ')[0]);
  });

  if (!kb && !entry) {
    return { forModel: JSON.stringify({ found: false, currency, note: 'No dedicated info for that exact treatment; answer from general knowledge with honest caveats and suggest the clinic confirm specifics.' }) };
  }

  const legacy = entry ? entry[1] : null;
  const legacyKey = entry ? entry[0] : null;
  const treatmentLabel = kb?.name || legacyKey || name;

  // Price: prefer knowledge-base CAD/USD pair when present, else legacy USD.
  const usdPrice = kb?.costRange.usd || legacy?.costRange || '';
  const cadPrice = kb?.costRange.cad || '';
  const costRangeForUser = isCanada
    ? (cadPrice || `${usdPrice} (CAD figure: confirm with clinic)`)
    : (usdPrice ? `${usdPrice} USD` : 'Confirm with clinic');

  // Details payload from the knowledge base (only emitted when present —
  // the model uses it to answer ingredient / mechanism / contraindication
  // / FDA-status questions without having to ask the clinic).
  const details = kb
    ? {
        ingredients: kb.ingredients,
        duration: kb.duration,
        howItWorks: kb.howItWorks,
        benefits: kb.benefits.slice(0, 6),
        contraindications: kb.contraindications,
        whoIsItFor: kb.whoIsItFor,
        whatToExpect: kb.whatToExpect,
        howSoon: kb.howSoon,
        frequency: kb.frequency,
        safetyNotes: kb.safetyNotes,
        fdaStatus: kb.fdaStatus,
        source: kb.source,
      }
    : null;

  return {
    forModel: JSON.stringify({
      found: true,
      treatment: treatmentLabel,
      summary: kb?.description || legacy?.description.split('\n\n')[0] || '',
      howItWorks: kb?.howItWorks || legacy?.howItWorks || '',
      costRange: costRangeForUser,
      currency,
      currencyNote: isCanada ? 'Prices shown are typical Canadian-clinic CAD ranges.' : 'Prices shown are typical US-clinic USD ranges.',
      safety: kb?.safetyNotes || legacy?.safety || 'Always confirm suitability with a licensed clinician.',
      benefits: (kb?.benefits || legacy?.benefits || []).slice(0, 4),
      fdaStatus: kb?.fdaStatus || null,
      details,
    }),
  };
}

// ── get_city_stats ──────────────────────────────────────────────────
async function getCityStats(input: { city?: string }): Promise<ToolOutcome> {
  if (!input.city) return { forModel: JSON.stringify({ error: 'city required' }) };
  const sb = getServiceSupabase();
  // Detect country by the modal state of providers in this city so prices are
  // labeled in the right currency (Canadian cities -> CAD, US cities -> USD).
  const { data: states } = await sb
    .from('providers')
    .select('state')
    .ilike('city', `%${input.city.trim()}%`)
    .neq('availability', false)
    .limit(100);
  const stateCounts: Record<string, number> = {};
  for (const r of (states as { state: string | null }[]) || []) {
    const s = (r.state || '').trim();
    if (s) stateCounts[s] = (stateCounts[s] || 0) + 1;
  }
  let modalState = '';
  let max = 0;
  for (const [k, n] of Object.entries(stateCounts)) if (n > max) { modalState = k; max = n; }
  const country = countryOfState(modalState);
  const currency = currencyForCountry(country);

  const { count: total } = await sb.from('providers').select('id', { count: 'exact', head: true }).ilike('city', `%${input.city.trim()}%`).neq('availability', false);
  const { count: verified } = await sb.from('providers').select('id', { count: 'exact', head: true }).ilike('city', `%${input.city.trim()}%`).eq('is_featured', true);
  return {
    forModel: JSON.stringify({
      city: input.city,
      country: country === 'CA' ? 'Canada' : 'United States',
      currency,
      totalProviders: total || 0,
      claimedProviders: verified || 0,
      typicalPriceRange: `Most IV drips run about $100–$350 ${currency} depending on the treatment; NAD+ and specialty drips cost more.`,
    }),
  };
}

// ── book_appointment ───────────────────────────────────────────────
// Returns the booking action for a specific clinic so the UI can render a
// prominent "BOOK NOW" or "CALL TO BOOK" button on the matching mini-card.
//
// Decision logic:
//   - online_booking_url present  -> recommend "book_online", button = "BOOK NOW"
//   - online_booking_url missing  -> recommend "call", button = "CALL TO BOOK"
//     (phone may also be null, in which case the UI should fall back to the
//     clinic's own website link or a "Contact" CTA — the chat can suggest
//     the user message us if neither exists).
async function bookAppointment(input: { slug?: string }): Promise<ToolOutcome> {
  if (!input.slug) return { forModel: JSON.stringify({ error: 'slug required' }) };
  const sb = getServiceSupabase();
  const { data: p } = await sb
    .from('providers')
    .select('id, name, slug, city, state, rating, reviews, is_featured, type, specialties, mobile_service, website, phone, description, working_hours, online_booking_url')
    .eq('slug', input.slug)
    .maybeSingle();

  if (!p) {
    return { forModel: JSON.stringify({ error: 'clinic not found', slug: input.slug }) };
  }
  const row = p as ProviderRow;
  const hasBookingUrl = !!row.online_booking_url;
  const recommendedAction: 'book_online' | 'call' = hasBookingUrl ? 'book_online' : 'call';
  const buttonLabel = hasBookingUrl ? 'BOOK NOW' : 'CALL TO BOOK';

  // Also produce a clinic card so the UI can pin a BOOK NOW button on it,
  // even if the user's previous search didn't surface this exact clinic.
  const clinic = toClinic(row, false);

  return {
    forModel: JSON.stringify({
      hasBookingUrl,
      bookingUrl: row.online_booking_url || null,
      phone: row.phone || null,
      clinicName: row.name,
      slug: row.slug,
      recommendedAction,
      buttonLabel,
      note: hasBookingUrl
        ? 'A BOOK NOW button has been rendered on the clinic card. Tell the user briefly that they can book directly with one tap.'
        : (row.phone
          ? 'No online booking yet — a CALL TO BOOK button has been rendered. Tell the user to call the clinic; mention the phone number in your reply.'
          : 'Neither online booking nor a phone is on file. Suggest they visit the clinic page or message TheDripMap for help.'),
    }),
    clinics: [clinic],
  };
}

// ── compare_providers ──────────────────────────────────────────────
// Side-by-side comparison of 2-3 provider slugs. Returns a structured
// payload the model uses to write a short 2-3 sentence comparison AND
// (separately, on the route side) a structured `comparison` payload the
// widget can render as a small table.
async function compareProviders(input: { slugs?: unknown }): Promise<ToolOutcome> {
  const rawSlugs = Array.isArray(input?.slugs) ? (input.slugs as unknown[]) : [];
  const slugs = rawSlugs
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter((s) => !!s)
    .slice(0, 3);
  if (slugs.length < 2) {
    return { forModel: JSON.stringify({ error: 'Need 2-3 provider slugs to compare' }) };
  }
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('providers')
    .select('id, name, slug, city, state, rating, reviews, is_featured, safety_verified, type, specialties, mobile_service, website, phone, description, working_hours, latitude, longitude, online_booking_url')
    .in('slug', slugs);
  if (error) return { forModel: JSON.stringify({ error: 'compare query failed' }) };
  const rows = (data as ProviderRow[]) || [];
  if (rows.length === 0) {
    return { forModel: JSON.stringify({ error: 'No providers found for those slugs', slugs }) };
  }

  // Verified set sourced from the providers.safety_verified column (2026-06-08).
  const verifiedSet = new Set<string>();
  for (const r of rows) {
    if ((r as { safety_verified?: boolean }).safety_verified === true) verifiedSet.add(r.id);
  }

  // Best-effort price lookup from TREATMENT_CONTENT — uses each clinic's first
  // matching specialty. If nothing matches we honestly say "varies".
  function priceFor(specialties: string[] | null): string {
    if (!specialties || specialties.length === 0) return 'varies';
    for (const sp of specialties) {
      const low = (sp || '').toLowerCase();
      for (const [key, content] of Object.entries(TREATMENT_CONTENT)) {
        if (low.includes(key.toLowerCase()) || key.toLowerCase().includes(low)) {
          return content.costRange;
        }
      }
    }
    return 'varies';
  }

  // Re-sort to match input slug order so the model's narrative matches the cards.
  const byInputOrder = slugs.map((s) => rows.find((r) => r.slug === s)).filter(Boolean) as ProviderRow[];
  const compared = byInputOrder.map((p) => {
    const verified = verifiedSet.has(p.id);
    return {
      name: p.name,
      slug: p.slug,
      city: p.city,
      state: p.state,
      rating: p.rating != null ? Number(p.rating) : null,
      reviewCount: p.reviews != null ? Number(p.reviews) : null,
      safetyVerified: verified, // 5/5 verified
      claimed: !!p.is_featured,
      treatments: (p.specialties || []).slice(0, 6),
      priceRange: priceFor(p.specialties),
      distanceMi: null as number | null, // distance not passed in; UI can fold in from the prior search
      bookable: !!p.online_booking_url,
      phone: p.phone || null,
    };
  });

  return {
    forModel: JSON.stringify({
      count: compared.length,
      providers: compared,
      note: 'Give a clear 2-3 sentence comparison highlighting the most useful differences (verified status, rating, bookable vs call-only, treatments offered, price range). End with: "Want me to book one of them?"',
    }),
    // Also produce clinic cards so the widget can pin BOOK/CALL CTAs on them.
    clinics: byInputOrder.map((p) => toClinic(p, verifiedSet.has(p.id))),
    comparison: { providers: compared },
  };
}

// ── get_availability_hint ──────────────────────────────────────────
// Reports whether a clinic is open right now. Strict — unparseable hours
// return 'hours_unknown' rather than silently asserting open.
async function getAvailabilityHint(input: { slug?: string }): Promise<ToolOutcome> {
  if (!input.slug) return { forModel: JSON.stringify({ error: 'slug required' }) };
  const sb = getServiceSupabase();
  const { data: p } = await sb
    .from('providers')
    .select('name, slug, working_hours')
    .eq('slug', input.slug)
    .maybeSingle();
  if (!p) return { forModel: JSON.stringify({ status: 'hours_unknown', reason: 'clinic not found' }) };
  const row = p as { name: string; slug: string; working_hours: Record<string, string> | null };
  const hours = row.working_hours;
  if (!hours || typeof hours !== 'object') {
    return { forModel: JSON.stringify({ status: 'hours_unknown', clinic: row.name, slug: row.slug }) };
  }

  // First, today's status using the existing helper.
  let todayStatus: { isOpen: boolean; text: string; todayHours: string } | null = null;
  try { todayStatus = getStatus(hours as Record<string, string>); } catch { todayStatus = null; }

  // Parse "9AM-5PM" style strings into start/end labels we can return.
  const parseRange = (s: string): { start: string; end: string } | null => {
    if (!s || typeof s !== 'string') return null;
    const parts = s.split('-').map((t) => t.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;
    // Sanity-check both ends parse to a known AM/PM time.
    const ok = parts.every((t) => /\d+(:\d+)?\s*(AM|PM)/i.test(t));
    return ok ? { start: parts[0], end: parts[1] } : null;
  };

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const todayKey = days[now.getDay()];
  const todayRange = parseRange(hours[todayKey] as string);

  if (todayStatus?.isOpen && todayRange) {
    return {
      forModel: JSON.stringify({
        status: 'open_now',
        clinic: row.name,
        slug: row.slug,
        closesAt: todayRange.end,
        todayHours: todayStatus.todayHours,
      }),
    };
  }

  // Closed — find the next opens-at: today (if not yet open) or next valid day.
  if (todayRange) {
    return {
      forModel: JSON.stringify({
        status: 'closed_now',
        clinic: row.name,
        slug: row.slug,
        opensAt: todayRange.start,
        opensWhen: 'today',
        todayHours: todayStatus?.todayHours || hours[todayKey],
      }),
    };
  }
  // Look ahead up to 7 days for the next day we can parse.
  for (let i = 1; i <= 7; i++) {
    const dKey = days[(now.getDay() + i) % 7];
    const range = parseRange(hours[dKey] as string);
    if (range) {
      return {
        forModel: JSON.stringify({
          status: 'closed_now',
          clinic: row.name,
          slug: row.slug,
          opensAt: range.start,
          opensWhen: dKey,
        }),
      };
    }
  }
  return { forModel: JSON.stringify({ status: 'hours_unknown', clinic: row.name, slug: row.slug }) };
}

// ── capture_lead ────────────────────────────────────────────────────
// Stores a lead so we can notify the user when we add a clinic in their
// city. Validates email. NEVER invent the user's email — only call this
// tool when the user explicitly volunteers one. source defaults to
// 'agent_no_coverage' (the original brief case).
//
// Implementation note: writes primarily to public.leads. If that table
// doesn't yet exist in this environment, falls back to public.inquiries
// with a structured marker so the lead is never lost.
function isEmailShape(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

async function captureLead(input: { email?: string; city?: string; treatment?: string; source?: string }): Promise<ToolOutcome> {
  const email = (input.email || '').trim().toLowerCase();
  const city = (input.city || '').trim().slice(0, 80) || null;
  const treatment = (input.treatment || '').trim().slice(0, 80) || null;
  const source = (input.source || 'agent_no_coverage').trim().slice(0, 60) || 'agent_no_coverage';
  if (!email || !isEmailShape(email)) {
    return { forModel: JSON.stringify({ ok: false, error: 'invalid_email', note: 'Ask the user for a valid email; do not retry without a clean address.' }) };
  }
  const sb = getServiceSupabase();
  const nowIso = new Date().toISOString();

  // Try the dedicated leads table first.
  try {
    const { data, error } = await sb
      .from('leads')
      .insert({ email, city, treatment, source, created_at: nowIso })
      .select('id')
      .maybeSingle();
    if (!error && data) {
      return { forModel: JSON.stringify({ ok: true, leadId: (data as { id: string }).id, source }) };
    }
    // If error indicates table missing, fall through. Otherwise log + fall through too.
    if (error) console.warn('captureLead: leads insert failed —', error.message);
  } catch (e) {
    console.warn('captureLead: leads insert threw —', e instanceof Error ? e.message : String(e));
  }

  // Fallback: inquiries (already used as the project-wide lead store).
  try {
    const { data, error } = await sb
      .from('inquiries')
      .insert({
        name: 'Drip Assistant Lead',
        email,
        phone: null,
        message: `[AGENT LEAD] source=${source} city=${city || '(n/a)'} treatment=${treatment || '(n/a)'}`,
        listing_id: null,
        created_at: nowIso,
      })
      .select('id')
      .maybeSingle();
    if (error) {
      return { forModel: JSON.stringify({ ok: false, error: error.message || 'insert_failed' }) };
    }
    return { forModel: JSON.stringify({ ok: true, leadId: (data as { id: string } | null)?.id || null, source, fallback: 'inquiries' }) };
  } catch (e) {
    return { forModel: JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }) };
  }
}

export async function runTool(name: string, input: Record<string, unknown>): Promise<ToolOutcome> {
  switch (name) {
    case 'search_providers': return searchProviders(input as never);
    case 'get_provider': return getProvider(input as never);
    case 'get_treatment_info': return getTreatmentInfo(input as never);
    case 'get_city_stats': return getCityStats(input as never);
    case 'book_appointment': return bookAppointment(input as never);
    case 'screen_patient': return screenPatient(input as never);
    case 'compare_providers': return compareProviders(input as never);
    case 'get_availability_hint': return getAvailabilityHint(input as never);
    case 'capture_lead': return captureLead(input as never);
    default: return { forModel: JSON.stringify({ error: `unknown tool ${name}` }) };
  }
}

export const TOOL_SCHEMAS = [
  {
    name: 'search_providers',
    description: 'Search TheDripMap\'s matching platform for IV therapy clinics. Use this for any "find me a clinic" request. All args optional but pass what the user gave.',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name, e.g. "Miami"' },
        treatment: { type: 'string', description: 'Treatment/goal, e.g. "hangover", "NAD+", "weight loss"' },
        mobile_only: { type: 'boolean', description: 'true if the user wants mobile/at-home/hotel service' },
        open_now: { type: 'boolean', description: 'true if the user wants somewhere open right now' },
        verified_only: { type: 'boolean', description: 'true to return only claimed/verified listings' },
      },
    },
  },
  {
    name: 'get_provider',
    description: 'Look up a specific clinic by slug or name to check its verification status, rating, and details.',
    input_schema: { type: 'object', properties: { slug: { type: 'string', description: 'Provider slug or clinic name' } }, required: ['slug'] },
  },
  {
    name: 'get_treatment_info',
    description: 'Get accurate educational info about an IV therapy treatment (what it is, how it works, cost, safety). Pass country="Canada" when the user is in a Canadian city so prices are labeled in CAD; defaults to USD otherwise.',
    input_schema: {
      type: 'object',
      properties: {
        treatment_name: { type: 'string' },
        country: { type: 'string', description: '"Canada" or "United States" — used to label the cost range in CAD vs USD. Defaults to USD.' },
      },
      required: ['treatment_name'],
    },
  },
  {
    name: 'get_city_stats',
    description: 'Get how many clinics TheDripMap lists in a city and a typical price range.',
    input_schema: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
  },
  {
    name: 'screen_patient',
    description: "Run a structured safety screening BEFORE recommending a treatment with known contraindications: high-dose vitamin C, GLP-1/semaglutide/Ozempic/Wegovy/Mounjaro/Tirzepatide, NAD+, iron infusion, peptide therapy, or glutathione. Call with the treatment_considering plus any safety answers the user has given so far (omit unknown fields). The tool returns pendingQuestions (ask the next one conversationally — one at a time, NOT as a form) or a safetyTier of green/amber/red with a disclaimer. NEVER refuses help — only filters to safer clinics. For amber/red, pass verified_only=true to search_providers next and include the disclaimer.",
    input_schema: {
      type: 'object',
      properties: {
        treatment_considering: { type: 'string', description: 'The treatment the user is considering, e.g. "high-dose vitamin C", "GLP-1", "NAD+", "iron infusion"' },
        pregnant_or_breastfeeding: { type: 'boolean', description: "true/false from the user; omit if not yet asked" },
        kidney_disease: { type: 'boolean', description: 'true/false from the user; omit if not yet asked' },
        g6pd_deficiency: { type: 'boolean', description: "true/false from the user; omit if not yet asked. If the user says they don't know, treat as false." },
        on_blood_thinners: { type: 'boolean', description: 'true/false from the user; omit if not yet asked' },
        prior_iv_therapy: { type: 'boolean', description: "true/false from the user; omit if not yet asked. Doesn't affect tier — used to soften tone for first-timers." },
      },
      required: ['treatment_considering'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Get the booking action for a specific clinic the user wants to book. Call this when the user says "book", "schedule", "appointment", or otherwise signals intent to book a specific clinic that has already been surfaced in chat. Returns either a bookable URL (renders a BOOK NOW button on the clinic card) or a phone number to call (renders a CALL TO BOOK button). Pass the clinic\'s slug.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The clinic\'s slug from a previous search_providers result.' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'compare_providers',
    description: 'Produce a structured side-by-side comparison of 2 or 3 clinics the user has just seen in the chat. Call this when the user says "compare", "vs", "which one is better", "show me a comparison", etc. Pass the clinic slugs from the prior search result (between 2 and 3). Returns rating, reviews, safety verified, claimed status, top treatments, price range, bookable yes/no, and phone for each. After the tool returns, give a 2-3 sentence comparison and end with "Want me to book one of them?".',
    input_schema: {
      type: 'object',
      properties: {
        slugs: {
          type: 'array',
          minItems: 2,
          maxItems: 3,
          items: { type: 'string' },
          description: 'Array of 2-3 provider slugs to compare, in display order.',
        },
      },
      required: ['slugs'],
    },
  },
  {
    name: 'get_availability_hint',
    description: 'Check whether a specific clinic is open right now from its stored working_hours. Returns one of: open_now (with closesAt), closed_now (with opensAt today or next open day), or hours_unknown. Use this when the user asks "are they open now" / "are they open today" / "what are their hours". Be strict — if hours are missing or unparseable, the tool returns hours_unknown; do not silently say "open".',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The clinic\'s slug.' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'capture_lead',
    description: 'Save the user\'s email so we can notify them when we add a clinic in their area (or for any other follow-up they explicitly volunteer their email for). Call ONLY when the user has typed an email address themselves — never invent an email. Use source="agent_no_coverage" (default) when we don\'t have clinics in their city; pass a different source string for other cases. Returns { ok, leadId } or { ok: false, error }.',
    input_schema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'The user\'s email address — must be supplied by the user, not invented.' },
        city: { type: 'string', description: 'The city the user is asking about (optional).' },
        treatment: { type: 'string', description: 'The treatment the user is interested in (optional).' },
        source: { type: 'string', description: 'Optional source tag; defaults to "agent_no_coverage".' },
      },
      required: ['email'],
    },
  },
];

export interface AssistantConfig {
  /** Clinic display name. Required to switch into white-label mode. */
  clinicName?: string;
  /** Slug — used so book_appointment knows which clinic to look up. */
  clinicSlug?: string;
  /** Curated treatments shown to the model so it can answer "what do you offer". */
  treatments?: string[];
  /** Optional menu with prices for "what does X cost" questions. */
  menu?: Array<{ name: string; price?: string; description?: string }>;
  /** Online booking URL the model should direct bookings to. */
  bookingUrl?: string | null;
  /** Phone fallback for call-to-book. */
  phone?: string | null;
  /** Free-text human-readable hours (e.g. "Mon-Fri 9-7, Sat 10-4, Sun closed"). */
  hours?: string;
  /** Currency label to use in prices ("USD" / "CAD"). Defaults to USD. */
  currency?: 'USD' | 'CAD';
  /** Verbatim extra instructions appended to the prompt. */
  extraSystemPrompt?: string;
}

export interface AssistantContext {
  city?: string | null; // user's detected/stated city
  hasCoords?: boolean; // true if the browser gave us precise coordinates
  clinicCount?: number; // total available clinics in the matching platform (queried per request — never hardcoded)
}

function buildWhitelabelPrompt(config: AssistantConfig): string {
  const name = config.clinicName!;
  const currency = config.currency || 'USD';
  const treatments = config.treatments && config.treatments.length
    ? `\nTREATMENTS OFFERED (only discuss these — if a user asks about something outside this list, tell them honestly to confirm with the clinic):\n${config.treatments.map((t) => `- ${t}`).join('\n')}`
    : '';
  const menu = config.menu && config.menu.length
    ? `\nMENU (with current prices in ${currency}):\n${config.menu.map((m) => `- ${m.name}${m.price ? ` — ${m.price}` : ''}${m.description ? ` (${m.description})` : ''}`).join('\n')}`
    : '';
  const hours = config.hours ? `\nHOURS: ${config.hours}` : '';
  const booking = config.bookingUrl
    ? `\nBOOKING: when the user wants to book, schedule, or make an appointment, give them this exact link: ${config.bookingUrl} — and tell them it opens our online booking. Do NOT call book_appointment, do NOT mention TheDripMap — just give the link.`
    : config.phone
    ? `\nBOOKING: we don't have online booking; tell users to call ${config.phone} to book. Do NOT call book_appointment.`
    : '';
  const phoneLine = config.phone ? `\nPHONE: ${config.phone}` : '';
  const extra = config.extraSystemPrompt ? `\n\n${config.extraSystemPrompt}` : '';

  return `You are the chat concierge for ${name}, an IV therapy & wellness clinic. You ONLY answer for ${name} — you are NOT a matching platform and you do NOT recommend other clinics.

PERSONALITY: warm, knowledgeable, trustworthy — like a friend who happens to be a nurse. Never salesy.
${treatments}${menu}${hours}${phoneLine}${booking}

OPERATING LOOP — follow this on EVERY user message:
1. UNDERSTAND: identify the intent (treatment question / pricing / hours / booking / general info).
2. ANSWER: keep replies to 2-3 sentences. For treatment questions, cite typical benefits, the price from the menu above (label as ${currency}), and a one-line safety note when relevant.
3. BOOK: when the user signals booking intent ("book", "schedule", "appointment", "I want to come in"), give them the booking link or phone number from above. Do NOT call any tools.

HONESTY & SAFETY (critical):
- NEVER invent prices, hours, treatments, or medical claims. Only state what is listed above. If a user asks something not covered, say "I'd want to confirm that with our team — give us a call at ${config.phone || 'the clinic'} or stop by."
- For medical questions, give honest, balanced info, note where evidence is limited, and always recommend confirming suitability with a licensed clinician. You are not a doctor and don't give diagnoses.
- For known-higher-risk treatments (high-dose vitamin C, GLP-1 / semaglutide / Ozempic / NAD+, iron infusion, glutathione): ask gently about pregnancy/kidney disease/blood thinners BEFORE confirming a booking, one short question at a time. If anything raises a flag, suggest they discuss with our medical team during a consultation.
- Always recommend confirming current pricing, hours, and availability directly with us.

DO NOT:
- Compare ${name} to other clinics or mention competitors.
- Recommend treatments not on the menu above.
- Make medical promises or guarantee outcomes.
- Call matching platform tools — you only have the booking link above to share.${extra}`;
}

export function buildSystemPrompt(config: AssistantConfig = {}, ctx: AssistantContext = {}): string {
  if (config.clinicName) {
    return buildWhitelabelPrompt(config);
  }

  const locationLine = ctx.city
    ? `USER LOCATION: ${ctx.city}${ctx.hasCoords ? ' (precise GPS coordinates available — searches are automatically distance-ranked from the user).' : ' (stated by the user).'} Use this for "near me" requests without asking again.`
    : ctx.hasCoords
    ? `USER LOCATION: precise GPS coordinates are available, so "near me" searches are automatically distance-ranked. You may proceed without asking for a city.`
    : `USER LOCATION: UNKNOWN. For any "find a clinic / near me" request you MUST first ask one short question — "What city are you in?" — and wait for the answer before searching. Never guess a city and never list clinics without a location.`;

  // Directory size — injected per request from a live Supabase count so the
  // assistant never claims an outdated number. If the count fetch failed at
  // the call site, fall back to a neutral phrasing rather than guessing a
  // figure (per "never hardcode this number" rule).
  const sizePhrase =
    typeof ctx.clinicCount === 'number' && ctx.clinicCount > 0
      ? `${ctx.clinicCount.toLocaleString()}+ listed clinics`
      : 'a large matching platform for IV therapy clinics';

  return `You are "Drip Assistant", the chat concierge for TheDripMap — Canada's IV therapy matching platform (${sizePhrase}, with verified safety badges on claimed clinics).

YOUR JOB: help patients find the right clinic right now, and answer IV therapy questions accurately. Finding a clinic is your PRIMARY job; education is secondary. End educational answers by offering to find a relevant clinic.

PERSONALITY:
- Warm but efficient. Like a knowledgeable friend who happens to be a nurse — not a salesperson.
- Never say "Great question!" or "Certainly!"
- Never use bullet points in responses — write in natural conversational sentences.
- Keep responses under 3 sentences unless explaining a complex treatment.
- Always end with one clear next step.
- Never push a clinic the user didn't ask about.
- If user seems nervous — acknowledge it.
- If user asks about safety — take it seriously, never minimize concerns.
- If a question is genuinely medical — be honest: "That's a question for the medical director at the clinic."

THINGS YOU MUST NEVER DO:
- Never diagnose or treat a medical condition.
- Never say a treatment will cure something.
- Never recommend ignoring a doctor's advice.
- Never make up clinic names, hours, or prices.
- Never pretend to know something it doesn't.
- Never push a booking if user seems hesitant.

${locationLine}

CONVERSATION FLOW — follow this on EVERY user message:
1. UNDERSTAND — single clarifying question if needed.
2. SAFETY SCREEN — for NAD+ / GLP-1 / high-dose vit C / iron, ask the single combined screening question and route flagged users to MD-led verified-only clinics.
3. FIND AND PRESENT — top 3 clinic cards with name + rating + distance + verified badge + key specialty match + BOOK NOW button or CALL button.
4. CLOSE THE LOOP — "Would you like me to help you compare these three, or would you like to book one of them?"
5. FOLLOW THROUGH — after a recommendation, ask if there's anything else the user wants to know before booking (e.g., what to eat beforehand, how long it takes).

OPERATING LOOP — follow this on EVERY user message:
1. UNDERSTAND: identify the intent (find a clinic / treatment question / check a specific clinic / pricing / booking-contact) and the details given (city, treatment, mobile vs in-clinic, open now, budget, urgency).
2. CHECK LOCATION: if it's a clinic search and you don't know the user's city or coordinates, ask "What city are you in?" — ONE short question — and stop. Do not call search_providers without a location.
3. GROUND: call the right tool. Never answer about specific clinics, prices, availability, ratings, or verification from memory — only from tool results.
4. RESPOND: 2-3 sentences MAX. Say briefly why the top matches fit (e.g. "closest to you", "verified", "open now"); the UI renders the clinic cards, so don't paste links or long lists.
5. NEXT STEP: end with a short, concrete next step or ONE follow-up question (e.g. offer to compare these three, filter to mobile, verified-only, or open-now).

TOOLS:
- search_providers — any "find me a clinic" request. The user's location is applied automatically when known; pass treatment / mobile_only / open_now / verified_only when the user implies them. If it returns needs_location, ask for the city. If it returns count 0 with suggestedCities, tell the user honestly we don't list that area yet and offer those cities OR offer to capture their email via capture_lead so we can notify them when we add a clinic.
- get_provider — to check a specific clinic's verification/details by name or slug.
- get_treatment_info — educational info about a treatment; answer accurately then offer to find a nearby clinic. Pulls structured detail from the agent knowledge base.
- get_city_stats — "how many clinics in X" or city price questions.
- book_appointment — when the user says "book", "schedule", or "appointment" for a specific clinic that's already in the conversation, call this with that clinic's slug. The UI renders a BOOK NOW or CALL TO BOOK button on the card; in your reply, briefly tell the user to tap the button (and mention the phone number when only call-to-book is available).
- compare_providers — when the user says "compare", "vs", "which is better", call this with the 2-3 slugs from the prior search. Give a 2-3 sentence narrative comparison after the tool returns; end with "Want me to book one of them?".
- get_availability_hint — when the user asks "are they open right now / today" for a specific clinic, call this with the slug. If it returns hours_unknown, say so honestly — never invent hours.
- capture_lead — ONLY when the user explicitly types an email address themselves and wants to be notified about a city / treatment we don't yet cover. Never invent or assume an email. Validates the email shape and saves it; tell the user we'll be in touch when something matches.

WHEN RESULTS ARE DISTANCE-RANKED: the nearest match is first; you can mention the distance in miles if helpful.

CURRENCY: tools return "country" ("CA" or "US") and "currency" ("CAD" or "USD") on each clinic and on get_city_stats / get_treatment_info results. When discussing prices for a Canadian clinic or city, ALWAYS label the figure as CAD (e.g. "$150–$350 CAD"). When the user is in a Canadian city and asks about a treatment, pass country="Canada" to get_treatment_info so the costRange comes back labeled in CAD. Never quote a Canadian clinic's prices as USD or vice versa.

SAFETY SCREENING — required for these treatments: high-dose vitamin C, GLP-1 / semaglutide / Ozempic / Wegovy / Mounjaro / Tirzepatide, NAD+, iron infusion, glutathione. Before recommending one of these, call screen_patient with the treatment name. The tool will return either:
  • pendingQuestions — ask the FIRST pending question conversationally (one at a time, with brief reassuring framing like "Quick safety check before I recommend a clinic — [question]". Never present all 5 as a form.) After the user answers, call screen_patient again with the accumulated answers.
  • safetyTier=green — proceed normally with search_providers.
  • safetyTier=amber — call search_providers with verified_only=true, then include the disclaimer in your response.
  • safetyTier=red — call search_providers with verified_only=true, include the disclaimer prominently in your response. If no verified clinic exists in the user's city, honestly say so and offer covered cities. NEVER refuse to help.
For plain hydration, Myers cocktail, hangover recovery, immune support, and other low-risk treatments, screening is NOT required — go straight to search_providers.

HONESTY & SAFETY (critical):
- NEVER invent clinic names, prices, hours, ratings, or verification status. Only state what the tools return. If a tool returns nothing, say so honestly and offer a covered city or the matching platform — never fabricate.
- Ratings/reviews exist only for claimed/verified clinics; don't imply unclaimed clinics have ratings.
- "Verified" = the clinic confirmed all 5 safety checks (medical director, licensed clinician, compounding pharmacy, liability insurance, state-board compliance). "Claimed" = the owner manages the listing.
- For medical questions, give honest, balanced info, note where evidence is limited, and always recommend confirming suitability with a licensed clinician. You are not a doctor and don't give medical advice or diagnoses.
- Always recommend patients confirm current pricing, hours, and availability directly with the clinic.
- If you don't know, say so and point them to the clinic or info@thedripmap.com.`;
}
