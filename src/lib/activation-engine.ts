/**
 * Clinic Activation Engine (Activation Plan step 3, 2026-09-09).
 *
 * The missing layer between a claimed listing and a complete one. Instead of
 * asking an owner to fill a form from scratch, we read their own website,
 * extract the facts a patient compares (treatments + prices, hours, contact,
 * booking link, practitioners), and STAGE them for the owner to confirm:
 * "We found these 14 treatments, these hours and these prices. Confirm or edit."
 *
 * Two tiers, by risk:
 *   AUTO-APPLIED when the live field is EMPTY (same policy the existing
 *   auto-enrich uses, now with provenance): phone, booking URL, opening hours
 *   (only when at least 5 days were read). Low-risk facts a patient needs.
 *   STAGED ONLY (decision_drivers.proposed) for the owner to confirm on /finish:
 *   treatments + prices, practitioners, mobile service. These are presented to
 *   patients as the clinic's own menu, so the clinic confirms them first.
 *
 * NEVER touched: the safety answers (who administers, who prescribes). Those
 * stay owner-attested + register-verified (docs/badge-standard.md). A scraped
 * "RN-led" line must never become an attestation.
 *
 * Every staged item carries the source URL, the fetch date and a verbatim
 * evidence snippet, so a stale price is never presented as ours.
 *
 * Runs server-side only (needs ANTHROPIC_API_KEY, present on Vercel). Never
 * throws; returns a structured result the admin UI renders.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5';

// JSON schema the extraction is held to (structured output). Nullable fields
// use ["type","null"] so the model can say "not on the page" explicitly.
const FACTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['treatments', 'hours', 'phone', 'booking_url', 'practitioners', 'mobile_service', 'notes'],
  properties: {
    treatments: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['raw', 'canonical', 'price', 'duration', 'evidence'],
        properties: {
          raw: { type: 'string' },
          canonical: { type: ['string', 'null'] },
          price: { type: ['string', 'null'] },
          duration: { type: ['string', 'null'] },
          evidence: { type: 'string' },
        },
      },
    },
    hours: {
      type: 'object', additionalProperties: false,
      required: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      properties: {
        mon: { type: ['string', 'null'] }, tue: { type: ['string', 'null'] }, wed: { type: ['string', 'null'] },
        thu: { type: ['string', 'null'] }, fri: { type: ['string', 'null'] }, sat: { type: ['string', 'null'] }, sun: { type: ['string', 'null'] },
      },
    },
    phone: { type: ['string', 'null'] },
    booking_url: { type: ['string', 'null'] },
    practitioners: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['name', 'credential', 'role', 'evidence'],
        properties: {
          name: { type: 'string' },
          credential: { type: ['string', 'null'] },
          role: { type: ['string', 'null'] },
          evidence: { type: 'string' },
        },
      },
    },
    mobile_service: { type: ['boolean', 'null'] },
    notes: { type: 'array', items: { type: 'string' } },
  },
} as const;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_PAGES = 6;
const MAX_TEXT_CHARS = 45_000;
const USER_AGENT = 'TheDripMap-Activation/1.0 (info@thedripmap.com)';

// The /finish form's drip vocabulary. Extracted menu items are mapped onto
// these so the owner's confirmation lands in the same fields the form writes.
export const CANONICAL_DRIPS = [
  "Myers' Cocktail", 'Hydration', 'NAD+', 'Glutathione', 'High-Dose Vitamin C',
  'Hangover Relief', 'Athletic Recovery', 'Immune / Cold & Flu', 'Beauty / Glow',
  'Energy / B12', 'Iron Infusion', 'Weight-Loss Support',
] as const;

export interface ProposedTreatment {
  raw: string;                 // as written on the site
  canonical: string | null;    // one of CANONICAL_DRIPS, or null if no honest match
  price: string | null;        // "$150" exactly as published, or null
  duration: string | null;
  evidence: string;            // verbatim snippet from the page
}
export interface ProposedPractitioner { name: string; credential: string | null; role: string | null; evidence: string }
export interface ExtractedFacts {
  treatments: ProposedTreatment[];
  hours: Record<string, string>;     // mon..sun -> "9:00 AM - 5:00 PM" | "Closed"
  phone: string | null;
  booking_url: string | null;
  practitioners: ProposedPractitioner[];
  mobile_service: boolean | null;
  notes: string[];
}
export interface ActivationResult {
  ok: boolean;
  providerId: string;
  sourceUrl: string | null;
  pagesRead: string[];
  autoApplied: string[];       // fields written directly (were empty)
  staged: { treatments: number; practitioners: number };
  errors: string[];
}

function s(v: unknown): string { return typeof v === 'string' ? v.trim() : ''; }

async function fetchText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: 'follow' });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    if (!/html|text/i.test(ct)) return null;
    return (await r.text()).slice(0, 400_000);
  } catch { return null; }
}

// HTML -> readable text. Keeps line breaks so prices stay next to their item.
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h[1-6]|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

// Same-host links likely to hold the menu, prices, team, hours or booking.
const CANDIDATE_RE = /menu|price|pricing|rates|service|treatment|drip|iv-|infusion|team|about|staff|our-doctor|practitioner|contact|hours|book/i;
function candidateLinks(html: string, base: URL): string[] {
  const out = new Set<string>();
  const re = /href=["']([^"'#?]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.size < 40) {
    try {
      const u = new URL(m[1], base);
      if (u.hostname !== base.hostname) continue;
      if (!CANDIDATE_RE.test(u.pathname)) continue;
      if (/\.(pdf|jpg|jpeg|png|gif|svg|css|js)$/i.test(u.pathname)) continue;
      u.hash = ''; u.search = '';
      out.add(u.toString());
    } catch { /* skip */ }
  }
  return [...out];
}

// Firecrawl fallback for JS-rendered sites that return an empty shell.
async function firecrawlText(url: string): Promise<string | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: false }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const md = j?.data?.markdown || j?.markdown;
    return typeof md === 'string' && md.trim().length > 200 ? md.slice(0, 120_000) : null;
  } catch { return null; }
}

/** Read the clinic's site: homepage + up to MAX_PAGES likely pages, as text. */
export async function readClinicSite(website: string): Promise<{ text: string; pages: string[]; sourceUrl: string }> {
  let start = website.trim();
  if (!/^https?:\/\//i.test(start)) start = 'https://' + start;
  const base = new URL(start);
  const pages: string[] = [];
  const chunks: string[] = [];

  // Per-page cap: a bloated homepage (SPA shells, mega-menus) must never eat
  // the whole budget and crowd out the /pricing or /services pages that hold
  // the menu. Total is still capped below.
  const PAGE_CHARS = 12_000;
  const homeHtml = await fetchText(start);
  let homeText = homeHtml ? stripHtml(homeHtml) : '';
  if (homeText.length < 500) {
    const fc = await firecrawlText(start);
    if (fc) homeText = fc;
  }
  if (homeText) { pages.push(start); chunks.push(`=== PAGE: ${start} ===\n${homeText.slice(0, PAGE_CHARS)}`); }

  // Menu/pricing pages first: they are the point of the read.
  const links = homeHtml ? candidateLinks(homeHtml, base) : [];
  links.sort((a, b) => Number(/menu|pric|rate|service|treatment|drip|infusion/i.test(b)) - Number(/menu|pric|rate|service|treatment|drip|infusion/i.test(a)));
  for (const link of links.slice(0, MAX_PAGES - 1)) {
    if (chunks.join('\n').length > MAX_TEXT_CHARS) break;
    const html = await fetchText(link);
    if (!html) continue;
    const t = stripHtml(html);
    if (t.length < 200) continue;
    pages.push(link);
    chunks.push(`=== PAGE: ${link} ===\n${t.slice(0, PAGE_CHARS)}`);
  }
  return { text: chunks.join('\n\n').slice(0, MAX_TEXT_CHARS), pages, sourceUrl: start };
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    let t = raw.trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) t = fence[1].trim();
    const a = t.indexOf('{'); const b = t.lastIndexOf('}');
    if (a >= 0 && b > a) t = t.slice(a, b + 1);
    return JSON.parse(t) as T;
  } catch { return null; }
}

/** One Claude call: site text -> strictly factual JSON, with evidence. */
export async function extractFacts(text: string, clinicName: string, city: string): Promise<ExtractedFacts | { error: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { error: 'ANTHROPIC_API_KEY not configured on this server' };
  const prompt = `You are extracting FACTS about one IV therapy clinic from the text of its own website. You never infer, guess, round, or invent. If something is not literally on the page, leave it null or empty. Every extracted item must carry a short verbatim evidence snippet copied from the text.

CLINIC: ${clinicName} (${city})

CANONICAL TREATMENT NAMES (map each menu item to exactly one of these, or null if no honest match):
${CANONICAL_DRIPS.map((d) => `- ${d}`).join('\n')}

Respond with ONLY minified JSON, exactly these keys:
{
 "treatments": [{"raw": "name as written", "canonical": "one canonical name or null", "price": "$NNN exactly as published or null", "duration": "as written or null", "evidence": "verbatim snippet"}],
 "hours": {"mon": "9:00 AM - 5:00 PM or Closed", "tue": "...", "wed": "...", "thu": "...", "fri": "...", "sat": "...", "sun": "..."},
 "phone": "digits as published or null",
 "booking_url": "full URL of an online booking page/system or null",
 "practitioners": [{"name": "full name as written", "credential": "RN | NP | ND | MD | etc or null", "role": "as written or null", "evidence": "verbatim snippet"}],
 "mobile_service": true | false | null,
 "notes": ["anything a human reviewer should know, e.g. prices shown as 'from', membership pricing, page looked outdated"]
}

RULES
- treatments: only IV drips, injections and infusions actually listed. Include the price ONLY if a dollar figure sits next to that item; ranges are fine ("$150-$250"). Add-on boosters are not treatments.
- canonical: map ONLY intravenous drips/infusions to a canonical name. Intramuscular shots and injections (anything marked IM, "shot", "injection") must have canonical null, even if the substance matches (a $75 glutathione IM shot is not the glutathione IV drip).
- hours: include a day only if its hours are a literal clock range (e.g. "9:00 AM - 5:00 PM") or the word Closed. Phrases like "by appointment" or "available upon request" are NOT hours: put null for that day and mention it in notes.
- mobile_service: true only if in-home/mobile service is offered NOW. "Coming soon" or "launching" means null.
- practitioners: named clinical people only (nurses, NPs, NDs, physicians, medical directors). Never owners or staff without a clinical credential unless clearly stated as clinical.
- Never include anything about safety, licensing status, or regulatory standing; that is verified elsewhere.

WEBSITE TEXT:
${text}`;

  try {
    // Structured output (same pattern as the blog engine): the model is held
    // to this schema, so a long menu can never come back as truncated or
    // prose-wrapped JSON. 16k output budget covers a 30-item menu with evidence.
    const client = new Anthropic({ apiKey: key, timeout: 100_000 });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: 'You extract verifiable facts from a business website into strict JSON. You never invent, infer or embellish.',
      output_config: { format: { type: 'json_schema', schema: FACTS_SCHEMA } },
      messages: [{ role: 'user', content: prompt }],
    });
    if (msg.stop_reason === 'refusal') return { error: 'model refused the extraction' };
    const out = msg.content.find((b) => b.type === 'text')?.text || '';
    const parsed = out ? safeJsonParse<Partial<ExtractedFacts>>(out) : null;
    if (!parsed) return { error: `model returned no parseable JSON (stop=${msg.stop_reason}, first 160 chars: ${out.slice(0, 160).replace(/\s+/g, ' ')})` };

    const money = (v: unknown) => { const t = s(v); return /\$\s?\d/.test(t) ? t : null; };
    // Belt to the prompt's suspender: an IM shot / injection never maps to a drip.
    const isShot = (raw: unknown) => /\bIM\b|injection|\bshot\b/i.test(s(raw));
    const canon = (v: unknown, raw?: unknown) => { const t = s(v); return !isShot(raw) && (CANONICAL_DRIPS as readonly string[]).includes(t) ? t : null; };
    const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const hours: Record<string, string> = {};
    for (const d of DAYS) { const h = s((parsed.hours as Record<string, unknown> | undefined)?.[d]); if (h) hours[d] = h.slice(0, 40); }
    return {
      treatments: (Array.isArray(parsed.treatments) ? parsed.treatments : []).map((t) => ({
        raw: s(t?.raw).slice(0, 80), canonical: canon(t?.canonical, t?.raw), price: money(t?.price), duration: s(t?.duration).slice(0, 30) || null, evidence: s(t?.evidence).slice(0, 200),
      })).filter((t) => t.raw && t.evidence).slice(0, 30),
      hours,
      phone: s(parsed.phone).replace(/[^\d+()\-\s]/g, '').slice(0, 30) || null,
      booking_url: /^https?:\/\/[^\s.]+\.[^\s]+/i.test(s(parsed.booking_url)) ? s(parsed.booking_url) : null,
      practitioners: (Array.isArray(parsed.practitioners) ? parsed.practitioners : []).map((p) => ({
        name: s(p?.name).slice(0, 80), credential: s(p?.credential).slice(0, 40) || null, role: s(p?.role).slice(0, 60) || null, evidence: s(p?.evidence).slice(0, 200),
      })).filter((p) => p.name && p.evidence).slice(0, 12),
      mobile_service: typeof parsed.mobile_service === 'boolean' ? parsed.mobile_service : null,
      notes: (Array.isArray(parsed.notes) ? parsed.notes : []).map((n) => s(n)).filter(Boolean).slice(0, 8),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'extraction failed' };
  }
}

/**
 * Run the engine for one claimed clinic: read site -> extract -> auto-apply the
 * empty low-risk facts with provenance -> stage the rest for owner confirmation.
 */
export async function runActivation(
  sb: SupabaseClient,
  providerId: string,
  opts: { dryRun?: boolean } = {},
): Promise<ActivationResult & { facts?: ExtractedFacts; wouldApply?: Record<string, unknown> }> {
  const result: ActivationResult & { facts?: ExtractedFacts; wouldApply?: Record<string, unknown> } =
    { ok: false, providerId, sourceUrl: null, pagesRead: [], autoApplied: [], staged: { treatments: 0, practitioners: 0 }, errors: [] };
  const { data: p, error } = await sb.from('providers').select('id, name, city, website, phone, online_booking_url, working_hours, is_claimed, decision_drivers').eq('id', providerId).maybeSingle();
  if (error || !p) { result.errors.push(error?.message || 'provider not found'); return result; }
  if (!p.website) { result.errors.push('no website on record'); return result; }

  const site = await readClinicSite(p.website as string);
  result.sourceUrl = site.sourceUrl; result.pagesRead = site.pages;
  if (site.text.length < 300) { result.errors.push('could not read enough text from the website'); return result; }

  const facts = await extractFacts(site.text, (p.name as string) || 'the clinic', (p.city as string) || '');
  if ('error' in facts) { result.errors.push(facts.error); return result; }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {};
  const empty = (v: unknown) => v == null || (typeof v === 'string' && !v.trim()) || (typeof v === 'object' && Object.keys(v as object).length === 0);

  // AUTO-APPLY, only into empty fields, with provenance. A phone that cannot be
  // a real North American number (an earlier scrape once stored 409-100-0188,
  // exchange 100 does not exist) counts as empty: patients need to reach them.
  const validNanp = (v: unknown) => /^\+?1?[\s.-]?\(?[2-9]\d{2}\)?[\s.-]?[2-9]\d{2}[\s.-]?\d{4}$/.test(s(v));
  if (facts.phone && validNanp(facts.phone) && (empty(p.phone) || !validNanp(p.phone))) {
    update.phone = facts.phone; result.autoApplied.push(empty(p.phone) ? 'phone' : 'phone (replaced invalid)');
  }
  if (facts.booking_url && empty(p.online_booking_url)) { update.online_booking_url = facts.booking_url; result.autoApplied.push('online_booking_url'); }
  // Hours auto-apply only when at least 5 days are REAL hours: a clock range or
  // "Closed". "By appointment" / "upon request" never counts (the model is told
  // to null those, this is the belt to that suspender).
  // A real day = "Closed", or two clock times (with a dash, "to", or just a
  // space between them: sites print "9AM 5PM" in table cells).
  const realDay = (h: string) => /closed/i.test(h) || /\d{1,2}(:\d{2})?\s*(am|pm)?\s*(?:[-–]|to|\s)\s*\d{1,2}(:\d{2})?\s*(am|pm)/i.test(h);
  const realHours = Object.fromEntries(Object.entries(facts.hours).filter(([, h]) => realDay(h)));
  if (Object.keys(realHours).length >= 5 && empty(p.working_hours)) { update.working_hours = realHours; result.autoApplied.push('working_hours'); }

  // Re-read decision_drivers right before writing (same race guard auto-enrich uses).
  const { data: fresh } = await sb.from('providers').select('decision_drivers').eq('id', providerId).maybeSingle();
  const dd = (fresh?.decision_drivers && typeof fresh.decision_drivers === 'object') ? (fresh.decision_drivers as Record<string, unknown>) : {};
  const priorFields = Array.isArray(dd.enriched_fields) ? (dd.enriched_fields as string[]) : [];
  update.decision_drivers = {
    ...dd,
    proposed: {
      source_url: site.sourceUrl,
      pages: site.pages,
      fetched_at: now,
      model: MODEL,
      status: 'pending_owner_review',
      treatments: facts.treatments,
      practitioners: facts.practitioners,
      mobile_service: facts.mobile_service,
      hours: facts.hours,
      phone: facts.phone,
      booking_url: facts.booking_url,
      notes: facts.notes,
    },
    ...(result.autoApplied.length
      ? {
          enrichment_source: 'activation_engine',
          enriched_at: now,
          enriched_fields: Array.from(new Set([...priorFields, ...result.autoApplied])),
          ...(result.autoApplied.includes('working_hours') ? { hours_source: `website:${site.sourceUrl} ${now.slice(0, 10)}` } : {}),
        }
      : {}),
  };
  result.staged = { treatments: facts.treatments.length, practitioners: facts.practitioners.length };

  // Dry run: everything computed, nothing written. Used to preview a batch for
  // the operator before any listing changes.
  if (opts.dryRun) {
    result.ok = true;
    result.facts = facts;
    const { decision_drivers: _dd, ...wouldApply } = update;
    void _dd;
    result.wouldApply = wouldApply;
    return result;
  }

  const { error: uErr } = await sb.from('providers').update(update).eq('id', providerId);
  if (uErr) { result.errors.push(uErr.message); return result; }
  result.ok = true;
  return result;
}
