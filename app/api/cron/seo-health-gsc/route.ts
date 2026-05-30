// Layer B — weekly GSC report.
//
// Schedule: 11:00 UTC weekly Monday (= 7am ET).
//   In vercel.json we set "0 11 * * 1" so this fires only on Mondays.
// Auth: Bearer ${CRON_SECRET}.
// Query params:
//   ?test=1 → force-run and force-email regardless of day.
//
// Behavior:
//   1. Fetch sitemap URLs (we reuse the same crawler library — single source
//      of truth for the URL pool the URL Inspection sampler rotates through).
//   2. Build the GSC report (or a stub if credentials are missing).
//   3. Email it to info@thedripmap.com.
//
// Note on the choice to make this a separate route from Layer A:
//   - Different cadence (Mon-only vs daily) and a different time budget.
//   - GSC API can be slow + flaky; keeping it isolated avoids dragging down
//     Layer A's daily run reliability.

import { NextResponse } from 'next/server';
import { fetchSitemapUrls } from '../../../../src/lib/seo-health-crawler';
import { buildGscReport } from '../../../../src/lib/seo-health-gsc';
import { buildLayerBEmail } from '../../../../src/lib/seo-health-email';
import { sendMail } from '../../../../src/lib/mailer';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

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
  const todayIso = new Date().toISOString().slice(0, 10);

  const sitemapUrls = await fetchSitemapUrls();
  const report = await buildGscReport(sitemapUrls);

  const body = buildLayerBEmail(report, todayIso);

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
    forceTest,
    reportKind: report.kind,
    sitemapUrls: sitemapUrls.length,
    subject: body.subject,
    email: emailResult,
    // Echo the human-readable text so the caller can see the report inline.
    reportPreview: body.text.slice(0, 4000),
  });
}
