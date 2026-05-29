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
}

export interface ToolOutcome {
  forModel: string; // JSON/text the model reads
  clinics?: AssistantClinic[]; // structured cards for the UI
}

const SAFETY_FLAGS = [
  'verifiedMedicalDirector', 'verifiedClinician', 'verifiedCompoundingPharmacy',
  'verifiedLiabilityInsurance', 'verifiedStateBoard',
];

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
}

function toClinic(p: ProviderRow, verified: boolean): AssistantClinic {
  return {
    name: p.name, slug: p.slug, city: p.city, state: p.state,
    rating: p.rating != null ? Number(p.rating) : null,
    reviews: p.reviews != null ? Number(p.reviews) : null,
    verified, claimed: !!p.is_featured, mobile: isMobileProvider(p),
    website: p.website, phone: p.phone,
  };
}

// ── search_providers ────────────────────────────────────────────────
async function searchProviders(input: {
  city?: string; treatment?: string; mobile_only?: boolean; open_now?: boolean; verified_only?: boolean;
}): Promise<ToolOutcome> {
  const sb = getServiceSupabase();
  let q = sb
    .from('providers')
    .select('id, name, slug, city, state, rating, reviews, is_featured, type, specialties, mobile_service, website, phone, description, working_hours')
    .neq('availability', false)
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(120);
  if (input.city) q = q.ilike('city', `%${input.city.trim()}%`);
  if (input.verified_only) q = q.eq('is_featured', true);

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
    rows = rows.filter((p) => {
      try { const s = getStatus(p.working_hours as never); return s?.isOpen !== false; } catch { return true; }
    });
  }

  // verified = claimed + all 5 safety flags. Look up profiles for the top slice.
  const top = rows.slice(0, 6);
  const claimedIds = top.filter((p) => p.is_featured).map((p) => p.id);
  const verifiedSet = new Set<string>();
  if (claimedIds.length) {
    const { data: profs } = await sb.from('operator_profiles').select('clinic_id, profile_data').in('clinic_id', claimedIds);
    for (const pr of (profs as { clinic_id: string; profile_data: Record<string, unknown> | null }[]) || []) {
      const pd = pr.profile_data || {};
      if (SAFETY_FLAGS.every((f) => pd[f] === true)) verifiedSet.add(pr.clinic_id);
    }
  }

  const clinics = top.slice(0, 4).map((p) => toClinic(p, verifiedSet.has(p.id)));
  const forModel = JSON.stringify({
    count: rows.length,
    clinics: clinics.map((c) => ({
      name: c.name, city: c.city, state: c.state, rating: c.rating, reviews: c.reviews,
      verified: c.verified, claimed: c.claimed, mobile: c.mobile, slug: c.slug,
    })),
    note: clinics.length === 0 ? 'No matching clinics found in our directory for that search.' : undefined,
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
      .select('id, name, slug, city, state, rating, reviews, is_featured, type, specialties, mobile_service, website, phone, description, working_hours')
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

// ── get_treatment_info ──────────────────────────────────────────────
function getTreatmentInfo(input: { treatment_name?: string }): ToolOutcome {
  const name = (input.treatment_name || '').toLowerCase().trim();
  if (!name) return { forModel: JSON.stringify({ error: 'treatment_name required' }) };
  const entry = Object.entries(TREATMENT_CONTENT).find(([key]) => {
    const k = key.toLowerCase();
    return k.includes(name) || name.includes(k) || name.includes(k.split(' ')[0]);
  });
  if (!entry) {
    return { forModel: JSON.stringify({ found: false, note: 'No dedicated info for that exact treatment; answer from general knowledge with honest caveats and suggest the clinic confirm specifics.' }) };
  }
  const [key, c] = entry;
  return {
    forModel: JSON.stringify({
      found: true, treatment: key,
      summary: c.description.split('\n\n')[0],
      howItWorks: c.howItWorks,
      costRange: c.costRange,
      safety: c.safety || 'Always confirm suitability with a licensed clinician.',
      benefits: c.benefits.slice(0, 4),
    }),
  };
}

// ── get_city_stats ──────────────────────────────────────────────────
async function getCityStats(input: { city?: string }): Promise<ToolOutcome> {
  if (!input.city) return { forModel: JSON.stringify({ error: 'city required' }) };
  const sb = getServiceSupabase();
  const { count: total } = await sb.from('providers').select('id', { count: 'exact', head: true }).ilike('city', `%${input.city.trim()}%`).neq('availability', false);
  const { count: verified } = await sb.from('providers').select('id', { count: 'exact', head: true }).ilike('city', `%${input.city.trim()}%`).eq('is_featured', true);
  return {
    forModel: JSON.stringify({
      city: input.city, totalProviders: total || 0, claimedProviders: verified || 0,
      typicalPriceRange: 'Most IV drips run about $100–$350 depending on the treatment; NAD+ and specialty drips cost more.',
    }),
  };
}

export async function runTool(name: string, input: Record<string, unknown>): Promise<ToolOutcome> {
  switch (name) {
    case 'search_providers': return searchProviders(input as never);
    case 'get_provider': return getProvider(input as never);
    case 'get_treatment_info': return getTreatmentInfo(input as never);
    case 'get_city_stats': return getCityStats(input as never);
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
    description: 'Get accurate educational info about an IV therapy treatment (what it is, how it works, cost, safety).',
    input_schema: { type: 'object', properties: { treatment_name: { type: 'string' } }, required: ['treatment_name'] },
  },
  {
    name: 'get_city_stats',
    description: 'Get how many clinics TheDripMap lists in a city and a typical price range.',
    input_schema: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
  },
];

export interface AssistantConfig {
  clinicName?: string; // set for a white-labeled, single-clinic assistant
}

export function buildSystemPrompt(config: AssistantConfig = {}): string {
  if (config.clinicName) {
    return `You are the assistant for ${config.clinicName}, an IV therapy clinic. Answer questions about ${config.clinicName}'s treatments, hours, and booking, and help patients decide if a treatment is right for them. Be warm, expert, and trustworthy. Never invent prices, hours, or medical claims — if unsure, tell them to confirm directly with the clinic. Add a brief safety note for medical questions.`;
  }
  return `You are "Drip Assistant", the chat guide for TheDripMap — North America's IV therapy & peptide clinic directory (1,030+ listed clinics, with verified safety badges on claimed clinics).

YOUR JOB: help patients find the right clinic right now, and answer IV therapy / peptide questions accurately. Finding a clinic is your PRIMARY job; education is secondary. End educational answers by offering to find a relevant clinic.

PERSONALITY: warm, knowledgeable, trustworthy — like a friend who happens to be a nurse. Never salesy. Concise (a few sentences, not essays).

HOW TO WORK:
- For "find me a clinic" requests, call search_providers with whatever the user gave (city, treatment, mobile, open now, verified). If they didn't give a city, ask for it.
- To check a specific clinic's verification/details, call get_provider.
- For treatment questions, call get_treatment_info, answer accurately, then offer to find a nearby clinic.
- Use get_city_stats for "how many clinics in X" or price questions.
- The UI shows clinic cards automatically from your search results — so don't paste long lists of links; briefly say why the top matches fit, then let the cards do the work.

HONESTY & SAFETY (critical):
- NEVER invent clinic names, prices, hours, ratings, or verification status. Only state what the tools return. If a tool returns nothing, say you couldn't find a match and suggest broadening the city or browsing the directory.
- "Verified" means the clinic confirmed all 5 of our safety checks (medical director, licensed clinician, compounding pharmacy, liability insurance, state-board compliance). "Claimed" means the owner manages the listing.
- For medical questions, give honest, balanced info, note where evidence is limited, and always recommend confirming suitability with a licensed clinician. You are not a doctor and do not give medical advice or diagnoses.
- Always recommend patients confirm current pricing, hours, and treatment availability directly with the clinic.
- If you don't know, say so and point them to the clinic or info@thedripmap.com.`;
}
