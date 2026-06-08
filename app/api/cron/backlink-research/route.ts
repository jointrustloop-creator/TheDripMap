import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AUTO_RESEARCH_TYPES, BacklinkTargetType, BACKLINK_TEMPLATES } from '../../../../src/lib/backlink-templates';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MODEL = 'claude-sonnet-4-6';
const DAILY_TARGET = 5;
const MIN_DA = 20;

// Rotate target type by day-of-year so we naturally vary the kind of
// outreach without manual tuning. Same type ~once every N days where N is
// AUTO_RESEARCH_TYPES.length. NYC patient-side types are intentionally
// excluded from auto-rotation (see backlink-templates.ts).
function todaysTargetType(): BacklinkTargetType {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return AUTO_RESEARCH_TYPES[dayOfYear % AUTO_RESEARCH_TYPES.length];
}

interface CandidateFromAI {
  url: string;
  domain: string;
  page_title: string;
  contact_name: string | null;
  contact_email: string | null;
  domain_authority: number;
  reason: string;
  already_links?: boolean;
}

// Only the AUTO_RESEARCH_TYPES need queries — the NYC patient-side types are
// inserted by a human operator after manual research, never auto-discovered.
const SEARCH_QUERIES: Partial<Record<BacklinkTargetType, string[]>> = {
  nursing_school: [
    'nursing school entrepreneurship resources IV therapy',
    'nursing program student resources starting a wellness business',
    'BSN MSN entrepreneur resources page',
  ],
  healthcare_law: [
    'healthcare law blog IV therapy scope of practice 2026',
    'medical aesthetics regulations attorney blog',
    'wellness clinic legal compliance blog',
  ],
  wellness_publication: [
    'wellness publication startup costs IV therapy',
    'health business magazine IV drip industry trends',
    'beauty wellness editorial resources page',
  ],
  nurse_entrepreneur: [
    'nurse entrepreneur community resources IV therapy',
    'nurse practitioner side business matching platform',
    'NP business owner support group resources',
  ],
  medical_director_match: [
    'medical director services IV therapy clinic',
    'medical director matching wellness clinic',
    'MD oversight aesthetic medical practice',
  ],
};

const ARTICLE_DESCRIPTIONS: Record<string, string> = {
  'iv-therapy-laws-by-state-2026':
    'State-by-state breakdown of IV therapy regulations, good-faith exam requirements, scope of practice, and medical director rules.',
  'how-much-does-it-cost-to-open-iv-therapy-clinic':
    'Real 2026 startup budget for IV therapy clinics — equipment, medical director, build-out, insurance.',
  'how-to-start-iv-therapy-business-2026':
    'Step-by-step guide for opening an IV therapy clinic in 2026 (licensing, location, operations).',
  'how-to-get-patients-iv-therapy-clinic-without-ads':
    '8 marketing strategies for IV therapy clinics that do not rely on paid ads.',
  'how-to-find-medical-director-iv-therapy-clinic':
    'Guide to sourcing, vetting, and structuring agreements with an IV-therapy medical director.',
};

async function callClaudeWithSearch(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);

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
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 6,
          },
        ],
        system:
          'You are a backlink research analyst. You find genuine, link-worthy pages where TheDripMap content would add value. You never recommend low-quality directories, link farms, AI-spam sites, or pages that obviously do not accept outside links. You always return valid minified JSON only.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Anthropic ${res.status}: ${t.slice(0, 300)}`);
    }
    const data = await res.json();
    // Concatenate all text blocks (web_search tool returns alternating tool_use + text blocks).
    const blocks = (data.content as Array<{ type: string; text?: string }>) || [];
    const text = blocks
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text!)
      .join('\n');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function extractJsonArray(raw: string): unknown[] {
  // The model occasionally wraps the array in ```json fences or adds prose.
  // Strip both safely.
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]+?)```/);
  const body = fenceMatch ? fenceMatch[1] : raw;
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(body.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rootDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

// GET /api/cron/backlink-research
// Vercel Cron entrypoint. Discovers 3-5 backlink candidates daily for one
// target type (rotated by day-of-year), filters out anything we already link
// to or has DA<20, and inserts the rest into backlink_targets with
// status='researched'. The drafts cron handles emails the next morning.
//
// Auth: same Bearer ${CRON_SECRET} pattern as other crons.
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Existing URLs/domains to avoid re-suggesting.
  const { data: existing } = await supabase
    .from('backlink_targets')
    .select('url, domain');
  const existingUrls = new Set((existing || []).map((r) => r.url.toLowerCase()));
  const existingDomains = new Set((existing || []).map((r) => r.domain));

  const targetType = todaysTargetType();
  const template = BACKLINK_TEMPLATES[targetType];
  const queries = SEARCH_QUERIES[targetType];
  if (!queries || queries.length === 0) {
    // Defensive: today's target type has no auto-research queries configured.
    // This should not happen for any type in AUTO_RESEARCH_TYPES, so log it
    // and skip the run rather than crash or send a malformed prompt.
    return NextResponse.json({
      ok: true,
      skipped: true,
      targetType,
      reason: 'no auto-research queries for this target type',
    });
  }
  const articleList = template.preferredArticles
    .map((slug) => `  • ${slug}: ${ARTICLE_DESCRIPTIONS[slug] || ''}`)
    .join('\n');

  const prompt = `Find ${DAILY_TARGET} genuine backlink candidates for TheDripMap (an IV therapy clinic matching platform) of type: ${targetType.replace(/_/g, ' ')}.

Use the web_search tool. Run 2-3 queries from this list to discover candidates:
${queries.map((q) => `  - "${q}"`).join('\n')}

For each candidate, pick the single best-fit article from this list to pitch:
${articleList}

A GOOD candidate is:
  • A real organization page (school department, blog post, resources page, or community hub) — not the homepage
  • A site whose readers genuinely benefit from the linked article
  • A site that already links to outside resources (so a link request is plausible)
  • Domain authority roughly ≥ ${MIN_DA} (estimate honestly — university .edu, .gov, established publication ≈ 60+; small niche blog ≈ 25-40)

A BAD candidate is:
  • Generic directories, link farms, AI-generated spam sites, pure SEO sites
  • Homepages or marketing pages with no resources/blog component
  • Pages that already link to thedripmap.com (check with web_search)
  • Pages where adding an outside link would be obviously off-topic

For contact_email: extract from the page if visible, or from a /contact, /about, or /staff page on the same domain. If you cannot find a confident email, return null — do NOT guess.

Return ONLY a minified JSON array of exactly ${DAILY_TARGET} objects (or fewer if you genuinely cannot find that many), each with this shape:

[{"url":"https://example.edu/resources","domain":"example.edu","page_title":"Nursing Entrepreneurship Resources","contact_name":"Dr. Jane Smith","contact_email":"jsmith@example.edu","domain_authority":62,"reason":"They maintain a public resources page for nursing students exploring private practice — our state-laws article is a natural fit alongside their existing links.","already_links":false,"article_to_pitch":"iv-therapy-laws-by-state-2026"}]

Rules:
- Return ONLY the JSON array. No prose, no markdown fences.
- domain MUST be the root domain (e.g. "example.edu", not "www.example.edu" or full URL).
- domain_authority is an integer estimate (skip the candidate if you would estimate <${MIN_DA}).
- article_to_pitch MUST be one of: ${template.preferredArticles.join(', ')}.
- contact_email is null if you cannot verify it from the site.
- already_links must be true if web_search shows the site already links to thedripmap.com.`;

  const candidates: CandidateFromAI[] = [];
  let parseError: string | undefined;

  try {
    const raw = await callClaudeWithSearch(prompt);
    const parsed = extractJsonArray(raw);
    for (const item of parsed) {
      const c = item as Record<string, unknown>;
      const url = typeof c.url === 'string' ? c.url : null;
      const domain = typeof c.domain === 'string' ? c.domain : null;
      const page_title = typeof c.page_title === 'string' ? c.page_title : null;
      const contact_email = typeof c.contact_email === 'string' ? c.contact_email : null;
      const contact_name = typeof c.contact_name === 'string' ? c.contact_name : null;
      const reason = typeof c.reason === 'string' ? c.reason : null;
      const article_to_pitch = typeof c.article_to_pitch === 'string' ? c.article_to_pitch : null;
      const domain_authority =
        typeof c.domain_authority === 'number' ? Math.floor(c.domain_authority) : 0;
      const already_links = c.already_links === true;
      if (!url || !domain || !page_title || !reason || !article_to_pitch) continue;
      if (domain_authority < MIN_DA) continue;
      if (already_links) continue;
      candidates.push({
        url,
        domain,
        page_title,
        contact_name,
        contact_email,
        reason,
        domain_authority,
        already_links,
      });
    }
  } catch (err) {
    parseError = err instanceof Error ? err.message : String(err);
  }

  // Dedup + insert.
  const inserted: { url: string; domain: string }[] = [];
  const skipped: { url: string; why: string }[] = [];

  for (const c of candidates) {
    const urlLower = c.url.toLowerCase();
    const rd = rootDomain(c.url) || c.domain.toLowerCase();
    if (existingUrls.has(urlLower)) {
      skipped.push({ url: c.url, why: 'duplicate url' });
      continue;
    }
    if (existingDomains.has(rd)) {
      skipped.push({ url: c.url, why: 'duplicate domain' });
      continue;
    }
    const articleSlug = template.preferredArticles.includes(c.url) // type guard fallback
      ? c.url
      : template.preferredArticles[0];

    const insertRow = {
      url: c.url,
      domain: rd,
      target_type: targetType,
      page_title: c.page_title,
      contact_name: c.contact_name,
      contact_email: c.contact_email,
      article_to_pitch: articleSlug,
      reason: c.reason,
      domain_authority: c.domain_authority,
      already_links: c.already_links || false,
      status: 'researched',
    };
    const { error } = await supabase.from('backlink_targets').insert(insertRow);
    if (error) {
      skipped.push({ url: c.url, why: `db: ${error.message}` });
      continue;
    }
    inserted.push({ url: c.url, domain: rd });
    existingUrls.add(urlLower);
    existingDomains.add(rd);
  }

  return NextResponse.json({
    ok: true,
    date: new Date().toISOString().slice(0, 10),
    targetType,
    candidatesReturned: candidates.length,
    inserted: inserted.length,
    skipped,
    parseError,
  });
}
