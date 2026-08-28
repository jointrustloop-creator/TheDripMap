/**
 * GET /api/cron/blog-engine
 *
 * Mon/Thu authority blog post, generated and AUTO-PUBLISHED on Vercel
 * (PLAN-6, 2026-08-28). Replaces the laptop-bound `dripmap-authority-blog`
 * scheduled task as the publish path; the operator spot-checks after the fact
 * per the 2026-07-11 mandate.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 * Query params:
 *   ?dry=1   generate + QA but write nothing (the report email still sends)
 *   ?slug=x  force a specific topic from the queue (testing)
 *
 * Kill switch: BLOG_ENGINE_ENABLED=false skips the run (default enabled).
 *
 * Flow: pick the first queue topic whose slug is not yet in blog_posts ->
 * build a live facts block from Supabase -> one Claude call (JSON schema
 * output) -> hard QA gates in code -> publish on pass, email + skip on fail.
 * A QA failure NEVER publishes and NEVER retries silently; the email says
 * exactly which gate failed so the fix is a prompt/gate change, not a mystery.
 */
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sendMail } from '../../../../src/lib/mailer';
import { REPORT_TO } from '../../../../src/lib/report-recipient';
import {
  TOPIC_QUEUE,
  buildFacts,
  qaGates,
  systemPrompt,
  userPrompt,
  serviceSupabase,
  type GeneratedPost,
} from '../../../../src/lib/blog-engine';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const POST_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'meta_title', 'meta_description', 'excerpt', 'content_markdown'],
  properties: {
    title: { type: 'string', description: 'Post title, no year prefix games, includes the city for city guides' },
    meta_title: { type: 'string', description: 'SEO title, 60 characters or fewer' },
    meta_description: { type: 'string', description: 'SEO description, 160 characters or fewer' },
    excerpt: { type: 'string', description: '1-2 sentence listing blurb' },
    content_markdown: { type: 'string', description: 'Full post body in markdown, ## headings, 900-1600 words' },
  },
} as const;

async function report(subject: string, lines: string[]) {
  try {
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: REPORT_TO,
      subject,
      text: lines.join('\n'),
    });
  } catch {
    /* reporting must never fail the run */
  }
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (String(process.env.BLOG_ENGINE_ENABLED || 'true').toLowerCase() === 'false') {
    return NextResponse.json({ ok: true, skipped: 'BLOG_ENGINE_ENABLED=false' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

  const url = new URL(req.url);
  const dry = url.searchParams.get('dry') === '1';
  const forcedSlug = url.searchParams.get('slug');

  const sb = serviceSupabase();

  // Pick the first topic not already published. Safe against re-runs and
  // against the operator publishing one of these by hand in the meantime.
  const { data: existingRows } = await sb.from('blog_posts').select('slug');
  const existing = new Set((existingRows || []).map((r: { slug: string }) => r.slug));
  const topic = forcedSlug
    ? TOPIC_QUEUE.find((t) => t.slug === forcedSlug)
    : TOPIC_QUEUE.find((t) => !existing.has(t.slug));

  if (!topic) {
    await report('[TheDripMap] Blog engine: queue empty', [
      'Every topic in the blog engine queue has been published.',
      'Add topics to TOPIC_QUEUE in src/lib/blog-engine.ts to keep the Mon/Thu cadence.',
    ]);
    return NextResponse.json({ ok: true, skipped: 'queue empty' });
  }
  if (!forcedSlug && existing.has(topic.slug)) {
    return NextResponse.json({ ok: true, skipped: `already published: ${topic.slug}` });
  }

  const facts = await buildFacts(sb, topic);

  const client = new Anthropic({ apiKey });
  let post: GeneratedPost;
  try {
    const msg = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      system: systemPrompt(),
      output_config: { format: { type: 'json_schema', schema: POST_SCHEMA } },
      messages: [{ role: 'user', content: userPrompt(topic, facts) }],
    });
    if (msg.stop_reason === 'refusal') {
      await report(`[TheDripMap] Blog engine: model refusal on ${topic.slug}`, [
        `The model declined to generate "${topic.workingTitle}". Nothing was published.`,
      ]);
      return NextResponse.json({ ok: false, slug: topic.slug, error: 'refusal' }, { status: 502 });
    }
    const text = msg.content.find((b) => b.type === 'text')?.text || '';
    post = JSON.parse(text) as GeneratedPost;
  } catch (e) {
    const detail =
      e instanceof Anthropic.APIError ? `Anthropic ${e.status}: ${e.message}` : e instanceof Error ? e.message : 'unknown error';
    await report(`[TheDripMap] Blog engine FAILED: ${topic.slug}`, [
      `Generation for "${topic.workingTitle}" failed before QA. Nothing was published.`,
      `Error: ${detail}`,
      'The same topic will be retried automatically on the next scheduled run.',
    ]);
    return NextResponse.json({ ok: false, slug: topic.slug, error: detail }, { status: 502 });
  }

  const fails = qaGates(post, topic, facts);
  if (fails.length) {
    await report(`[TheDripMap] Blog engine: QA BLOCKED ${topic.slug}`, [
      `"${post.title}" failed ${fails.length} QA gate(s) and was NOT published:`,
      ...fails.map((f) => `- ${f}`),
      '',
      'The post was discarded. The same topic retries on the next run; if it keeps',
      'failing the same gate, the fix belongs in the prompt or the gate, not in a manual publish.',
    ]);
    return NextResponse.json({ ok: false, slug: topic.slug, qaFails: fails }, { status: 200 });
  }

  const nowIso = new Date().toISOString();
  if (!dry) {
    const { error } = await sb.from('blog_posts').insert({
      slug: topic.slug,
      title: post.title,
      content: post.content_markdown,
      excerpt: post.excerpt,
      category: topic.category,
      author: 'TheDripMap Editorial',
      date: nowIso,
      last_updated: nowIso,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      related_cities: topic.relatedCities,
    });
    if (error) {
      await report(`[TheDripMap] Blog engine: insert failed ${topic.slug}`, [
        `QA passed but the database insert failed: ${error.message}`,
      ]);
      return NextResponse.json({ ok: false, slug: topic.slug, error: error.message }, { status: 500 });
    }
  }

  const words = post.content_markdown.split(/\s+/).filter(Boolean).length;
  await report(`[TheDripMap] Blog engine ${dry ? '(DRY) ' : ''}published: ${post.title}`, [
    `${dry ? 'DRY RUN, nothing written. Would have published' : 'Published'}: ${post.title}`,
    `https://www.thedripmap.com/blog/${topic.slug}`,
    '',
    `Category: ${topic.category} | ${words} words | meta_title ${post.meta_title.length} chars | meta_description ${post.meta_description.length} chars`,
    `All QA gates passed (dashes, banned words, meta lengths, word count, no prices,`,
    `no superlatives, city grounding, link allowlist, clinic-name grounding).`,
    '',
    'Spot-check when you have a minute; the post is live now. Reply here if anything reads off.',
  ]);

  return NextResponse.json({ ok: true, dry, slug: topic.slug, title: post.title, words });
}
