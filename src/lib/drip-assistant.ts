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

export interface ToolOutcome {
  forModel: string; // JSON/text the model reads
  clinics?: AssistantClinic[]; // structured cards for the UI
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
  peptide: ['peptide', 'semaglutide', 'tirzepatide', 'sermorelin', 'bpc-157', 'glp-1', 'cjc-1295', 'ipamorelin'],
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
          ? `No clinics found in "${input.city}". Tell the user honestly we don't list that area yet, and offer one of the covered cities below or browsing the full directory.`
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
  const verified = verifiedCount === 5;
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
  'Peptide Therapy':            { pregnant: 'red',   kidney: 'amber', g6pd: 'green', thinners: 'amber' },
  'Iron Infusion':              { pregnant: 'green', kidney: 'amber', g6pd: 'green', thinners: 'amber' },
  'Glutathione':                { pregnant: 'amber', kidney: 'green', g6pd: 'green', thinners: 'green' },
};

function normalizeTreatmentForSafety(name: string): keyof typeof SAFETY_MATRIX {
  const t = (name || '').toLowerCase().trim();
  if (/(glp-?1|semaglutide|ozempic|wegovy|mounjaro|tirzepatide)/.test(t)) return 'GLP-1 Weight Loss';
  if (/peptide|bpc-?157|tb-?500|sermorelin|ipamorelin|cjc-?1295/.test(t)) return 'Peptide Therapy';
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
function getTreatmentInfo(input: { treatment_name?: string; country?: string }): ToolOutcome {
  const name = (input.treatment_name || '').toLowerCase().trim();
  if (!name) return { forModel: JSON.stringify({ error: 'treatment_name required' }) };
  const isCanada = (input.country || '').trim().toLowerCase() === 'canada';
  const currency = isCanada ? 'CAD' : 'USD';
  const entry = Object.entries(TREATMENT_CONTENT).find(([key]) => {
    const k = key.toLowerCase();
    return k.includes(name) || name.includes(k) || name.includes(k.split(' ')[0]);
  });
  if (!entry) {
    return { forModel: JSON.stringify({ found: false, currency, note: 'No dedicated info for that exact treatment; answer from general knowledge with honest caveats and suggest the clinic confirm specifics.' }) };
  }
  const [key, c] = entry;
  return {
    forModel: JSON.stringify({
      found: true,
      treatment: key,
      summary: c.description.split('\n\n')[0],
      howItWorks: c.howItWorks,
      costRange: `${c.costRange} ${currency}`,
      currency,
      currencyNote: isCanada ? 'Prices shown are typical Canadian-clinic CAD ranges.' : 'Prices shown are typical US-clinic USD ranges.',
      safety: c.safety || 'Always confirm suitability with a licensed clinician.',
      benefits: c.benefits.slice(0, 4),
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

export async function runTool(name: string, input: Record<string, unknown>): Promise<ToolOutcome> {
  switch (name) {
    case 'search_providers': return searchProviders(input as never);
    case 'get_provider': return getProvider(input as never);
    case 'get_treatment_info': return getTreatmentInfo(input as never);
    case 'get_city_stats': return getCityStats(input as never);
    case 'book_appointment': return bookAppointment(input as never);
    case 'screen_patient': return screenPatient(input as never);
    default: return { forModel: JSON.stringify({ error: `unknown tool ${name}` }) };
  }
}

export const TOOL_SCHEMAS = [
  {
    name: 'search_providers',
    description: 'Search TheDripMap\'s directory for IV therapy / peptide clinics. Use this for any "find me a clinic" request. All args optional but pass what the user gave.',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name, e.g. "Miami"' },
        treatment: { type: 'string', description: 'Treatment/goal, e.g. "hangover", "NAD+", "peptide", "weight loss"' },
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
  clinicCount?: number; // total available clinics in the directory (queried per request — never hardcoded)
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

  return `You are the chat concierge for ${name}, an IV therapy & wellness clinic. You ONLY answer for ${name} — you are NOT a directory and you do NOT recommend other clinics.

PERSONALITY: warm, knowledgeable, trustworthy — like a friend who happens to be a nurse. Never salesy.
${treatments}${menu}${hours}${phoneLine}${booking}

OPERATING LOOP — follow this on EVERY user message:
1. UNDERSTAND: identify the intent (treatment question / pricing / hours / booking / general info).
2. ANSWER: keep replies to 2-3 sentences. For treatment questions, cite typical benefits, the price from the menu above (label as ${currency}), and a one-line safety note when relevant.
3. BOOK: when the user signals booking intent ("book", "schedule", "appointment", "I want to come in"), give them the booking link or phone number from above. Do NOT call any tools.

HONESTY & SAFETY (critical):
- NEVER invent prices, hours, treatments, or medical claims. Only state what is listed above. If a user asks something not covered, say "I'd want to confirm that with our team — give us a call at ${config.phone || 'the clinic'} or stop by."
- For medical questions, give honest, balanced info, note where evidence is limited, and always recommend confirming suitability with a licensed clinician. You are not a doctor and don't give diagnoses.
- For known-higher-risk treatments (high-dose vitamin C, GLP-1 / semaglutide / Ozempic / NAD+, iron infusion, peptide therapy, glutathione): ask gently about pregnancy/kidney disease/blood thinners BEFORE confirming a booking, one short question at a time. If anything raises a flag, suggest they discuss with our medical team during a consultation.
- Always recommend confirming current pricing, hours, and availability directly with us.

DO NOT:
- Compare ${name} to other clinics or mention competitors.
- Recommend treatments not on the menu above.
- Make medical promises or guarantee outcomes.
- Call directory tools — you only have the booking link above to share.${extra}`;
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
      : 'a large directory of IV therapy and peptide clinics';

  return `You are "Drip Assistant", the chat concierge for TheDripMap — North America's IV therapy & peptide clinic directory (${sizePhrase}, with verified safety badges on claimed clinics).

YOUR JOB: help patients find the right clinic right now, and answer IV therapy / peptide questions accurately. Finding a clinic is your PRIMARY job; education is secondary. End educational answers by offering to find a relevant clinic.

PERSONALITY: warm, knowledgeable, trustworthy — like a friend who happens to be a nurse. Never salesy.

${locationLine}

OPERATING LOOP — follow this on EVERY user message:
1. UNDERSTAND: identify the intent (find a clinic / treatment question / check a specific clinic / pricing / booking-contact) and the details given (city, treatment, mobile vs in-clinic, open now, budget, urgency).
2. CHECK LOCATION: if it's a clinic search and you don't know the user's city or coordinates, ask "What city are you in?" — ONE short question — and stop. Do not call search_providers without a location.
3. GROUND: call the right tool. Never answer about specific clinics, prices, availability, ratings, or verification from memory — only from tool results.
4. RESPOND: 2-3 sentences MAX. Say briefly why the top matches fit (e.g. "closest to you", "verified", "open now"); the UI renders the clinic cards, so don't paste links or long lists.
5. NEXT STEP: end with a short, concrete next step or ONE follow-up question (e.g. offer to filter to mobile, verified-only, or open-now).

TOOLS:
- search_providers — any "find me a clinic" request. The user's location is applied automatically when known; pass treatment / mobile_only / open_now / verified_only when the user implies them. If it returns needs_location, ask for the city. If it returns count 0 with suggestedCities, tell the user honestly we don't list that area yet and offer those cities.
- get_provider — to check a specific clinic's verification/details by name or slug.
- get_treatment_info — educational info about a treatment; answer accurately then offer to find a nearby clinic.
- get_city_stats — "how many clinics in X" or city price questions.
- book_appointment — when the user says "book", "schedule", or "appointment" for a specific clinic that's already in the conversation, call this with that clinic's slug. The UI renders a BOOK NOW or CALL TO BOOK button on the card; in your reply, briefly tell the user to tap the button (and mention the phone number when only call-to-book is available).

WHEN RESULTS ARE DISTANCE-RANKED: the nearest match is first; you can mention the distance in miles if helpful.

CURRENCY: tools return "country" ("CA" or "US") and "currency" ("CAD" or "USD") on each clinic and on get_city_stats / get_treatment_info results. When discussing prices for a Canadian clinic or city, ALWAYS label the figure as CAD (e.g. "$150–$350 CAD"). When the user is in a Canadian city and asks about a treatment, pass country="Canada" to get_treatment_info so the costRange comes back labeled in CAD. Never quote a Canadian clinic's prices as USD or vice versa.

SAFETY SCREENING — required for these treatments: high-dose vitamin C, GLP-1 / semaglutide / Ozempic / Wegovy / Mounjaro / Tirzepatide, NAD+, iron infusion, peptide therapy, glutathione. Before recommending one of these, call screen_patient with the treatment name. The tool will return either:
  • pendingQuestions — ask the FIRST pending question conversationally (one at a time, with brief reassuring framing like "Quick safety check before I recommend a clinic — [question]". Never present all 5 as a form.) After the user answers, call screen_patient again with the accumulated answers.
  • safetyTier=green — proceed normally with search_providers.
  • safetyTier=amber — call search_providers with verified_only=true, then include the disclaimer in your response.
  • safetyTier=red — call search_providers with verified_only=true, include the disclaimer prominently in your response. If no verified clinic exists in the user's city, honestly say so and offer covered cities. NEVER refuse to help.
For plain hydration, Myers cocktail, hangover recovery, immune support, and other low-risk treatments, screening is NOT required — go straight to search_providers.

HONESTY & SAFETY (critical):
- NEVER invent clinic names, prices, hours, ratings, or verification status. Only state what the tools return. If a tool returns nothing, say so honestly and offer a covered city or the directory — never fabricate.
- Ratings/reviews exist only for claimed/verified clinics; don't imply unclaimed clinics have ratings.
- "Verified" = the clinic confirmed all 5 safety checks (medical director, licensed clinician, compounding pharmacy, liability insurance, state-board compliance). "Claimed" = the owner manages the listing.
- For medical questions, give honest, balanced info, note where evidence is limited, and always recommend confirming suitability with a licensed clinician. You are not a doctor and don't give medical advice or diagnoses.
- Always recommend patients confirm current pricing, hours, and availability directly with the clinic.
- If you don't know, say so and point them to the clinic or info@thedripmap.com.`;
}
