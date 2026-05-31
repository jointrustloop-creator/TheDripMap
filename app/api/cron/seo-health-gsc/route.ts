// Sunday weekly SEO digest.
//
// Schedule: Sunday 00:00 UTC = Sunday 8pm ET (during EDT). vercel.json sets
//   "0 0 * * 1" which in UTC is Monday 00:00 — which lands at Sunday 8pm ET.
// Auth: Bearer ${CRON_SECRET}.
// Query params:
//   ?test=1      → force-email regardless of day.
//   ?skipCrawl=1 → skip the inline Layer A crawl and rely on the stored baseline.
//
// Flow:
//   1. Run a fresh Layer A crawl inline (so the report is current this week).
//      Falls back to the stored baseline if the crawl errors out.
//   2. Build the GSC report (returns stub if GSC_SERVICE_ACCOUNT_KEY isn't set).
//   3. Combine both into one good / bad / ugly digest.
//   4. Email it to info@thedripmap.com.

import { NextResponse } from 'next/server';
import {
  crawlUrls,
  detectIssues,
  fetchSitemapUrls,
  Issue,
} from '../../../../src/lib/seo-health-crawler';
import { loadBaseline } from '../../../../src/lib/seo-health-baseline';
import { buildGscReport } from '../../../../src/lib/seo-health-gsc';
import { buildSundayDigestEmail } from '../../../../src/lib/seo-health-email';
import { sendMail } from '../../../../src/lib/mailer';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function prettyDate(d = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
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
  const skipCrawl = url.searchParams.get('skipCrawl') === '1';
  const todayIso = new Date().toISOString().slice(0, 10);
  const today = prettyDate();

  // 1. Sitemap (always — feeds both the GSC URL Inspection sampler and the
  //    Layer A crawl).
  const sitemapUrls = await fetchSitemapUrls();

  // 2. Layer A: prefer a fresh inline crawl. Fall back to the stored baseline
  //    if the crawl is skipped, errors, or returns nothing.
  type CrawlPayload = {
    totalUrls: number;
    crawledUrls: number;
    truncated: boolean;
    durationMs: number;
    issues: Issue[];
    asOfIso: string;
    fresh: boolean;
  };
  let crawlPayload: CrawlPayload | null = null;
  let crawlError: string | null = null;
  if (!skipCrawl && sitemapUrls.length > 0) {
    try {
      // Budget: 200s on the crawl leaves ~80s for GSC + email.
      const summary = await crawlUrls(sitemapUrls, {
        concurrency: 24,
        totalBudgetMs: 200_000,
      });
      const issues = detectIssues(summary);
      crawlPayload = {
        totalUrls: summary.totalUrls,
        crawledUrls: summary.crawledUrls,
        truncated: summary.truncated,
        durationMs: summary.durationMs,
        issues,
        asOfIso: new Date().toISOString(),
        fresh: true,
      };
    } catch (err) {
      crawlError = err instanceof Error ? err.message : String(err);
    }
  }
  if (!crawlPayload) {
    const baseline = await loadBaseline();
    if (baseline) {
      const issues: Issue[] = baseline.issues.map((i) => ({
        type: i.type,
        url: i.url,
        detail: i.detail,
      }));
      crawlPayload = {
        totalUrls: baseline.totalUrls,
        crawledUrls: baseline.totalUrls,
        truncated: false,
        durationMs: 0,
        issues,
        asOfIso: baseline.lastRunIso,
        fresh: false,
      };
    }
  }

  // 3. GSC report (stubbed when key missing).
  const gscReport = await buildGscReport(sitemapUrls);

  // 4. Build the digest email.
  const body = buildSundayDigestEmail({
    gscReport,
    crawl: crawlPayload,
    todayIso,
    prettyDate: today,
  });

  let emailResult: { ok: boolean; provider?: string; error?: string } | null = null;
  try {
    const res = await sendMail({
      from: 'TheDripMap SEO <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      subject: body.subject,
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

  return NextResponse.json({
    ok: true,
    today: todayIso,
    prettyDate: today,
    forceTest,
    sitemapUrls: sitemapUrls.length,
    crawl: crawlPayload
      ? {
          fresh: crawlPayload.fresh,
          crawledUrls: crawlPayload.crawledUrls,
          totalUrls: crawlPayload.totalUrls,
          issues: crawlPayload.issues.length,
          truncated: crawlPayload.truncated,
          durationMs: crawlPayload.durationMs,
          asOfIso: crawlPayload.asOfIso,
        }
      : null,
    crawlError,
    gscKind: gscReport.kind,
    subject: body.subject,
    email: emailResult,
    reportPreview: body.text.slice(0, 4000),
  });
}

