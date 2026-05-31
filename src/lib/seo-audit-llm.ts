// Pillars 1–3 of the IV-clinic SEO audit, generated in a single Anthropic
// call so we keep token cost + latency tight. The model takes the basic crawl
// output + detected city/services + a slice of our blog corpus, and returns:
//
//   1. Paste-ready on-page fixes (real title tag, meta description, H1 copy)
//   2. Missing high-intent pages ({treatment} IV therapy in {city}) with
//      title + meta + 150-word outline for each
//   3. Patient-voice questions (top 10 questions IV patients in this city ask
//      that the site doesn't answer) — tone grounded by our blog excerpts
//
// Always returns valid JSON via the parseLlmResult() guard so the UI never
// blows up on a malformed response. If the API key is missing OR the call
// fails, we return a stub with state='stubbed' so the UI can render a clear
// "AI section unavailable" notice rather than silently dropping pillars.

import { getServiceSupabase } from './supabase';

const MODEL = 'claude-sonnet-4-20250514';

export interface PasteReadyFix {
  /** Short label of the issue (e.g. "Title tag", "Meta description"). */
  field: string;
  /** What the site has now (truncated). Empty string if missing. */
  current: string;
  /** The actual replacement copy the owner can paste, written for THIS clinic. */
  fix: string;
  /** Why it matters — one short sentence. */
  why: string;
  /** Rough impact, 1-3 (3 = biggest). */
  impact: 1 | 2 | 3;
}

export interface MissingPageRecommendation {
  /** URL slug the page should live at (e.g. "/nad-iv-therapy-toronto"). */
  suggestedPath: string;
  /** Paste-ready <title>. */
  title: string;
  /** Paste-ready meta description. */
  metaDescription: string;
  /** Paste-ready H1. */
  h1: string;
  /** ~150-word page outline (markdown bullets). */
  outline: string;
  /** Why this page matters — one sentence on search intent. */
  intent: string;
}

export interface PatientQuestion {
  /** The verbatim question (as a patient would type it). */
  question: string;
  /** One-line "why patients ask this" with city/service context. */
  why: string;
  /** Suggested page format to answer it ("blog post", "FAQ row", "landing page"). */
  format: string;
}

export interface LlmAuditResult {
  state: 'ok' | 'stubbed' | 'error';
  /** Only present when state==='stubbed' / 'error'. */
  reason?: string;
  /** Pillar 1. */
  pasteReadyFixes: PasteReadyFix[];
  /** Pillar 2. */
  missingPages: MissingPageRecommendation[];
  /** Pillar 3. */
  patientQuestions: PatientQuestion[];
  /** Single hero-impact sentence ("You're invisible for N searches in X"). */
  impactHeadline: string;
}

export interface BlogCorpusEntry {
  slug: string;
  title: string;
  firstParagraph: string;
}

/**
 * Pull a slice of our published blog corpus (title + first paragraph) to
 * ground the LLM's tone and topic coverage. We cap at ~30 posts to keep the
 * prompt under ~3k tokens. Any city-tagged posts get priority so the model
 * sees how we already cover the clinic's market.
 */
export async function loadBlogCorpus(city: string): Promise<BlogCorpusEntry[]> {
  try {
    const sb = getServiceSupabase();
    const { data } = await sb
      .from('blog_posts')
      .select('slug, title, content, body, excerpt, meta_description, related_cities')
      .order('date', { ascending: false })
      .limit(120);
    const rows = (data || []) as Array<Record<string, unknown>>;
    if (!rows.length) return [];

    const cityLc = (city || '').toLowerCase().trim();

    const entries: BlogCorpusEntry[] = rows.map((r) => {
      const raw = String(r.content || r.body || r.excerpt || r.meta_description || '');
      // Strip markdown headings, links, html tags, then take the first ~280 chars.
      const para = raw
        .replace(/<[^>]+>/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 280);
      return {
        slug: String(r.slug || ''),
        title: String(r.title || ''),
        firstParagraph: para,
      };
    });

    // Sort: city-tagged first, then everything else.
    const scored = entries.map((e, idx) => {
      const tagged =
        cityLc &&
        (Array.isArray((rows[idx] as { related_cities?: unknown }).related_cities) &&
          ((rows[idx] as { related_cities?: unknown[] }).related_cities || []).some(
            (c) => String(c).toLowerCase().includes(cityLc),
          ));
      const titleHit = cityLc && e.title.toLowerCase().includes(cityLc);
      return { e, score: (tagged ? 2 : 0) + (titleHit ? 1 : 0) };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 30).map((s) => s.e);
  } catch {
    return [];
  }
}

export interface LlmAuditInput {
  url: string;
  city: string;
  /** Detected business name (best guess from <title> / H1 / og:site_name). */
  businessName: string;
  /** Detected services/treatments (from the HTML, ~6 max). */
  services: string[];
  /** Current title tag the site has (may be empty). */
  currentTitle: string;
  /** Current meta description (may be empty). */
  currentMeta: string;
  /** Current H1 text (may be empty). */
  currentH1: string;
  /** Short summary of failing on-page checks (e.g. "no schema, no og:image"). */
  failingChecks: string[];
  /** A trimmed HTML snippet for context (cap ~6k chars before sending). */
  pageSnippet: string;
  /** Blog corpus for grounding. */
  corpus: BlogCorpusEntry[];
  /** Listing demand in this city (real number from our table). */
  citySearchesPerMonth: number;
  /** Competitor count from our DB. */
  cityCompetitors: number;
}

function buildPrompt(i: LlmAuditInput): string {
  const corpusLines = i.corpus
    .slice(0, 25)
    .map((e, idx) => `${idx + 1}. ${e.title} — ${e.firstParagraph}`)
    .join('\n');

  return `You are an SEO consultant writing for ONE specific IV therapy clinic.
Your job: turn raw crawl data into PASTE-READY copy the clinic owner can copy in under 60 seconds.

CLINIC
- Website: ${i.url}
- Detected business name: ${i.businessName || '(not detected)'}
- City: ${i.city || '(not provided)'}
- Detected services: ${i.services.join(', ') || '(none detected)'}

LOCAL SEARCH DEMAND (real numbers from our directory's data)
- Monthly "iv therapy ${i.city || 'their city'}" searches: ${i.citySearchesPerMonth}
- Competing clinics in this city in our directory: ${i.cityCompetitors}

CURRENT ON-PAGE STATE
- Current <title>: ${i.currentTitle || '(missing)'}
- Current meta description: ${i.currentMeta || '(missing)'}
- Current H1: ${i.currentH1 || '(missing)'}
- Failing checks: ${i.failingChecks.join(', ') || 'none'}

OUR BLOG CORPUS (use this to match tone — we write warm, factual, plain-English. NEVER invent statistics or medical claims):
${corpusLines}

HOMEPAGE HTML SNIPPET (truncated):
${i.pageSnippet.slice(0, 5000)}

YOUR TASK — respond with ONLY valid minified JSON, no markdown, no commentary. Exactly these keys:

{
 "impactHeadline": "Single punchy sentence leading with patient-search impact. Use the real numbers above. Example: 'You're invisible for ~${i.citySearchesPerMonth} monthly searches for IV therapy in ${i.city || 'your city'}.' Never use a generic score statement.",
 "pasteReadyFixes": [
   {
     "field": "Title tag" | "Meta description" | "H1" | "Open Graph image" | "Schema markup" | string,
     "current": "exact current text (truncated to 100 chars) or empty if missing",
     "fix": "ACTUAL replacement copy written for THIS clinic in THIS city — never 'add a title tag', always the actual title",
     "why": "one short sentence on the SEO impact",
     "impact": 1 | 2 | 3
   }
 ],
 "missingPages": [
   {
     "suggestedPath": "url path like /nad-iv-therapy-toronto",
     "title": "paste-ready <title> for that page",
     "metaDescription": "paste-ready meta description, 130-160 chars",
     "h1": "paste-ready H1",
     "outline": "~150-word markdown outline with 4-6 bullet points covering what the page should contain",
     "intent": "one sentence on the search intent and why it converts"
   }
 ],
 "patientQuestions": [
   {
     "question": "the real question a patient in ${i.city || 'this city'} types into Google",
     "why": "one sentence on why patients ask this in this city/service context",
     "format": "blog post" | "FAQ row" | "landing page"
   }
 ]
}

RULES
- pasteReadyFixes: 3-6 items, ranked by impact. The "fix" field is the ACTUAL copy to paste — title tags 50-60 chars, meta descriptions 130-160 chars, H1 ≤ 70 chars. Include the city and 1-2 detected services in the title.
- missingPages: 3-5 high-intent pages the clinic does not already have. Prioritize "{treatment} IV therapy in {city}" patterns for treatments NOT already covered.
- patientQuestions: 8-10 questions. Should sound like real Google searches, not blog-post titles. Mix safety questions, price questions, comparison questions, and city-specific logistics.
- Never invent stats, certifications, awards, or testimonials.
- Use the city name literally. If city is missing, use a neutral placeholder like "your area".`;
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    let s = raw.trim();
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) s = fence[1].trim();
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start >= 0 && end > start) s = s.slice(start, end + 1);
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

interface RawLlmShape {
  impactHeadline?: unknown;
  pasteReadyFixes?: unknown;
  missingPages?: unknown;
  patientQuestions?: unknown;
}

function coerce(parsed: RawLlmShape | null, fallbackHeadline: string): LlmAuditResult {
  const safeArr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    state: 'ok',
    impactHeadline: typeof parsed?.impactHeadline === 'string' && parsed.impactHeadline.trim()
      ? parsed.impactHeadline.trim()
      : fallbackHeadline,
    pasteReadyFixes: safeArr<PasteReadyFix>(parsed?.pasteReadyFixes).slice(0, 8).map((f) => ({
      field: String(f.field || 'Fix'),
      current: String(f.current || ''),
      fix: String(f.fix || ''),
      why: String(f.why || ''),
      impact: ([1, 2, 3].includes(Number(f.impact)) ? Number(f.impact) : 2) as 1 | 2 | 3,
    })).filter((f) => f.fix.length > 0),
    missingPages: safeArr<MissingPageRecommendation>(parsed?.missingPages).slice(0, 6).map((p) => ({
      suggestedPath: String(p.suggestedPath || ''),
      title: String(p.title || ''),
      metaDescription: String(p.metaDescription || ''),
      h1: String(p.h1 || ''),
      outline: String(p.outline || ''),
      intent: String(p.intent || ''),
    })).filter((p) => p.title && p.suggestedPath),
    patientQuestions: safeArr<PatientQuestion>(parsed?.patientQuestions).slice(0, 12).map((q) => ({
      question: String(q.question || ''),
      why: String(q.why || ''),
      format: String(q.format || 'blog post'),
    })).filter((q) => q.question.length > 0),
  };
}

/**
 * Call Claude once to produce pillars 1-3. Always returns a structured
 * LlmAuditResult — stubbed or error states are surfaced explicitly so the
 * UI can render a clear notice rather than break.
 */
export async function runLlmAudit(input: LlmAuditInput): Promise<LlmAuditResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  const fallbackHeadline = input.city
    ? `You're missing ~${input.citySearchesPerMonth} monthly searches for IV therapy in ${input.city}.`
    : "Your homepage isn't optimized for the highest-intent IV therapy searches in your area.";

  if (!key) {
    return {
      state: 'stubbed',
      reason: 'ANTHROPIC_API_KEY is not configured on the server. The paste-ready fixes, missing-page recommendations, and patient-voice questions need the AI layer to generate.',
      pasteReadyFixes: [],
      missingPages: [],
      patientQuestions: [],
      impactHeadline: fallbackHeadline,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 50000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system:
          'You are a senior local SEO consultant specializing in IV therapy and medical wellness clinics. You produce paste-ready copy — never abstract advice. You never invent statistics, medical claims, certifications, or testimonials. You always respond with valid minified JSON only.',
        messages: [{ role: 'user', content: buildPrompt(input) }],
      }),
    });

    if (!res.ok) {
      const errText = (await res.text()).slice(0, 200);
      return {
        state: 'error',
        reason: `Anthropic ${res.status}: ${errText}`,
        pasteReadyFixes: [],
        missingPages: [],
        patientQuestions: [],
        impactHeadline: fallbackHeadline,
      };
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text) {
      return {
        state: 'error',
        reason: 'Empty response from AI layer.',
        pasteReadyFixes: [],
        missingPages: [],
        patientQuestions: [],
        impactHeadline: fallbackHeadline,
      };
    }

    const parsed = safeJsonParse<RawLlmShape>(text);
    if (!parsed) {
      return {
        state: 'error',
        reason: 'AI returned malformed JSON.',
        pasteReadyFixes: [],
        missingPages: [],
        patientQuestions: [],
        impactHeadline: fallbackHeadline,
      };
    }

    return coerce(parsed, fallbackHeadline);
  } catch (err) {
    return {
      state: 'error',
      reason: err instanceof Error ? err.message : String(err),
      pasteReadyFixes: [],
      missingPages: [],
      patientQuestions: [],
      impactHeadline: fallbackHeadline,
    };
  } finally {
    clearTimeout(timer);
  }
}
