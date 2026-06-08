import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { saveDrafts } from '../../../../src/lib/draft-saver';
import { BACKLINK_TEMPLATES, BacklinkTargetType, getTemplate } from '../../../../src/lib/backlink-templates';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MODEL = 'claude-sonnet-4-20250514';
const DAILY_MAX_DRAFTS = 5; // hard ceiling regardless of how many got researched

interface ResearchRow {
  id: string;
  url: string;
  domain: string;
  target_type: BacklinkTargetType;
  page_title: string | null;
  contact_name: string | null;
  contact_email: string | null;
  article_to_pitch: string;
  reason: string;
}

interface PersonalizedDraft {
  subject: string;
  body: string;
}

async function personalize(row: ResearchRow): Promise<PersonalizedDraft | null> {
  const template = getTemplate(row.target_type);
  if (!template) return null;

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');

  const prompt = `Personalize this outreach email template for a specific backlink target.

TARGET
  • Page title: ${row.page_title || 'unknown'}
  • Domain: ${row.domain}
  • Contact name (if known): ${row.contact_name || 'unknown'}
  • Why this target is a fit: ${row.reason}
  • Article we are pitching: https://www.thedripmap.com/blog/${row.article_to_pitch}

TEMPLATE SUBJECT
${template.subject}

TEMPLATE BODY
${template.body}

YOUR JOB
1. Replace every {{placeholder}} with content drawn from the target context above (use the | fallback if you cannot personalize confidently). Do not invent specifics — only use what's in the target context.
2. Keep the structure, length, and tone of the template. Do NOT add new paragraphs or new links.
3. The result should sound like a thoughtful one-to-one email, not a templated blast.
4. Keep the signature exactly as in the template.

Return ONLY a minified JSON object with this shape (no markdown, no prose):
{"subject":"...","body":"..."}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40000);
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
        max_tokens: 1500,
        system:
          'You personalize cold outreach emails. You never invent specifics about the recipient. You preserve the template structure exactly. You respond ONLY with valid minified JSON.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Anthropic ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    const blocks = (data.content as Array<{ type: string; text?: string }>) || [];
    const text = blocks
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text!)
      .join('');
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]+?)```/);
    const body = fenceMatch ? fenceMatch[1] : text;
    const start = body.indexOf('{');
    const end = body.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(body.slice(start, end + 1)) as { subject?: string; body?: string };
    if (typeof parsed.subject !== 'string' || typeof parsed.body !== 'string') return null;
    return { subject: parsed.subject, body: parsed.body };
  } finally {
    clearTimeout(timer);
  }
}

// GET /api/cron/backlink-drafts
// Vercel Cron entrypoint. For each backlink_targets row with status='researched'
// AND a contact_email, personalizes the template via Claude, saves the result as
// a Gmail draft in info@thedripmap.com, then flips status to 'drafted'.
// Hubert reviews + sends manually from his Gmail inbox.
//
// Auth: same Bearer ${CRON_SECRET} pattern.
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
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP_USER/SMTP_PASS required' }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('backlink_targets')
    .select('id, url, domain, target_type, page_title, contact_name, contact_email, article_to_pitch, reason')
    .eq('status', 'researched')
    .not('contact_email', 'is', null)
    .order('researched_at', { ascending: true })
    .limit(DAILY_MAX_DRAFTS);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data || []) as ResearchRow[];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'no researched targets with contact_email', drafted: 0 });
  }

  // Personalize all in parallel (each ~5-10s).
  const personalized = await Promise.allSettled(rows.map((r) => personalize(r)));

  type DraftJob = { row: ResearchRow; draft: PersonalizedDraft };
  const jobs: DraftJob[] = [];
  const failures: { url: string; error: string }[] = [];

  rows.forEach((row, idx) => {
    const result = personalized[idx];
    if (result.status === 'fulfilled' && result.value) {
      jobs.push({ row, draft: result.value });
    } else {
      const err =
        result.status === 'rejected'
          ? result.reason instanceof Error
            ? result.reason.message
            : String(result.reason)
          : 'personalize returned null';
      failures.push({ url: row.url, error: err });
    }
  });

  if (jobs.length === 0) {
    return NextResponse.json({ ok: false, drafted: 0, failures });
  }

  // Save all drafts in one IMAP connection.
  const draftResults = await saveDrafts(
    jobs.map((j) => ({
      from: 'TheDripMap <info@thedripmap.com>',
      to: j.row.contact_email!,
      replyTo: 'info@thedripmap.com',
      subject: j.draft.subject,
      text: j.draft.body,
    }))
  );

  // Flip status for each successful draft.
  const drafted: string[] = [];
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const draftRes = draftResults[i];
    if (!draftRes.ok) {
      failures.push({ url: job.row.url, error: draftRes.error || 'draft save failed' });
      continue;
    }
    const { error: updErr } = await supabase
      .from('backlink_targets')
      .update({ status: 'drafted', drafted_at: new Date().toISOString() })
      .eq('id', job.row.id);
    if (updErr) {
      failures.push({ url: job.row.url, error: `db update: ${updErr.message}` });
      continue;
    }
    drafted.push(job.row.url);
  }

  return NextResponse.json({
    ok: true,
    date: new Date().toISOString().slice(0, 10),
    eligible: rows.length,
    drafted: drafted.length,
    failures,
    targetTypeCounts: Object.fromEntries(
      Object.keys(BACKLINK_TEMPLATES).map((t) => [
        t,
        rows.filter((r) => r.target_type === t).length,
      ])
    ),
  });
}
