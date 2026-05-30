// Layer A — daily SEO health tripwire.
//
// Schedule: 10:00 UTC daily (= 6am ET).
// Auth: Bearer ${CRON_SECRET}.
// Query params:
//   ?test=1  → force-send the email regardless of diff (smoke test).
//   ?weekly=1 → force the Monday digest output (also runs Monday automatically).
//
// Flow:
//   1. Fetch sitemap URLs.
//   2. Crawl with bounded concurrency.
//   3. Detect issues.
//   4. Diff against the stored baseline.
//   5. If NEW issues OR weekly digest day OR ?test=1 → send email.
//   6. Persist the new baseline.

import { NextResponse } from 'next/server';
import {
  crawlUrls,
  detectIssues,
  fetchSitemapUrls,
} from '../../../../src/lib/seo-health-crawler';
import {
  buildNewBaseline,
  diffIssues,
  loadBaseline,
  saveBaseline,
} from '../../../../src/lib/seo-health-baseline';
import { buildLayerAEmail, buildLayerASubject } from '../../../../src/lib/seo-health-email';
import { sendMail } from '../../../../src/lib/mailer';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function isMondayET(now = new Date()): boolean {
  // 10:00 UTC = 6am ET (or 5am ET during DST). Monday in ET is what we want.
  // Convert to America/New_York day-of-week.
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  }).format(now);
  return fmt === 'Mon';
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const forceTest = url.searchParams.get('test') === '1';
  const forceWeekly = url.searchParams.get('weekly') === '1';
  const todayIso = new Date().toISOString().slice(0, 10);
  const weekly = forceWeekly || isMondayET();

  // 1. Sitemap
  const sitemapUrls = await fetchSitemapUrls();
  if (sitemapUrls.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Sitemap returned 0 URLs — refusing to run crawl.' },
      { status: 500 }
    );
  }

  // 2. Crawl
  const summary = await crawlUrls(sitemapUrls, { concurrency: 24, totalBudgetMs: 240_000 });

  // 3. Detect
  const issues = detectIssues(summary);

  // 4. Diff
  const prior = await loadBaseline();
  const priorIssues = (prior?.issues ?? []).map((i) => ({
    type: i.type,
    url: i.url,
    detail: i.detail,
  }));
  const diff = diffIssues(priorIssues, issues);

  // 5. Decide whether to email
  const shouldEmail = forceTest || weekly || diff.newIssues.length > 0;

  let emailResult: { ok: boolean; provider?: string; error?: string } | null = null;
  let subjectMeta: { kind: string; subject: string } | null = null;

  if (shouldEmail) {
    const subjectInfo = buildLayerASubject(diff, weekly, todayIso);
    subjectMeta = subjectInfo;
    const body = buildLayerAEmail({
      diff,
      totalUrls: summary.totalUrls,
      crawledUrls: summary.crawledUrls,
      truncated: summary.truncated,
      durationMs: summary.durationMs,
      weekly,
      history: prior?.history ?? [],
      todayIso,
    });
    try {
      const res = await sendMail({
        from: 'TheDripMap SEO <info@thedripmap.com>',
        to: 'info@thedripmap.com',
        subject: subjectInfo.subject,
        text: body.text,
        html: body.html,
      });
      emailResult = { ok: res.ok, provider: res.provider, error: res.error };
    } catch (err) {
      emailResult = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // 6. Persist new baseline
  const newBaseline = buildNewBaseline(summary.totalUrls, issues, prior);
  const saveResult = await saveBaseline(newBaseline);

  return NextResponse.json({
    ok: true,
    today: todayIso,
    weekly,
    forceTest,
    sitemap: {
      totalUrls: summary.totalUrls,
      crawledUrls: summary.crawledUrls,
      durationMs: summary.durationMs,
      truncated: summary.truncated,
    },
    issues: {
      total: issues.length,
      new: diff.newIssues.length,
      carried: diff.carriedIssues.length,
      resolved: diff.resolvedIssues.length,
    },
    email: subjectMeta
      ? { ...subjectMeta, ...emailResult }
      : { sent: false, reason: 'No new issues, not weekly, not test' },
    baseline: saveResult,
  });
}
