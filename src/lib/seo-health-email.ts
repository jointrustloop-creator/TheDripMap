// Email body builder for both SEO health layers.
//
// Layer A: groups Layer-A issues by type, lists NEW first then CARRIED,
// and shows first 10 URLs per type as clickable links.
// Weekly digest variant adds trend numbers + resolved-since-last-week list.
// Layer B: renders the GSC summary (search analytics, sitemaps, URL inspection
// sample) in plain English.

import { Issue, IssueType } from './seo-health-crawler';
import { BaselineDiff } from './seo-health-baseline';
import { GscReport } from './seo-health-gsc';

const ISSUE_LABELS: Record<IssueType, string> = {
  non_200: 'Non-200 responses (broken pages)',
  redirect_chain: 'Redirect chains longer than 1 hop',
  missing_canonical: 'Missing canonical tag',
  unexpected_noindex: 'Unexpected noindex',
  missing_title: 'Missing <title>',
  missing_meta: 'Missing meta description',
};

const ISSUE_ORDER: IssueType[] = [
  'non_200',
  'redirect_chain',
  'unexpected_noindex',
  'missing_canonical',
  'missing_title',
  'missing_meta',
];

const MAX_PER_GROUP = 10;

export interface LayerASubject {
  kind: 'alert' | 'digest' | 'allclear';
  subject: string;
}

export function buildLayerASubject(
  diff: BaselineDiff,
  weekly: boolean,
  todayIso: string
): LayerASubject {
  if (weekly) {
    if (diff.currentTotal === 0) {
      return { kind: 'allclear', subject: `[TheDripMap SEO] All clear — weekly digest ${todayIso}` };
    }
    return {
      kind: 'digest',
      subject: `[TheDripMap SEO] Weekly digest — ${diff.currentTotal} known issues on ${todayIso}`,
    };
  }
  if (diff.newIssues.length === 0) {
    return { kind: 'allclear', subject: `[TheDripMap SEO] No new issues on ${todayIso}` };
  }
  return {
    kind: 'alert',
    subject: `[TheDripMap SEO] ${diff.newIssues.length} new issues on ${todayIso}`,
  };
}

function groupByType(issues: Issue[]): Record<IssueType, Issue[]> {
  const out = {} as Record<IssueType, Issue[]>;
  for (const t of ISSUE_ORDER) out[t] = [];
  for (const i of issues) out[i.type].push(i);
  return out;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderGroupHtml(
  label: string,
  issues: Issue[],
  highlight: boolean
): string {
  if (issues.length === 0) return '';
  const shown = issues.slice(0, MAX_PER_GROUP);
  const more = issues.length - shown.length;
  const items = shown
    .map(
      (i) =>
        `<li><a href="${esc(i.url)}" style="color:#0F6E56;">${esc(i.url)}</a> <span style="color:#666;font-size:12px;">— ${esc(i.detail)}</span></li>`
    )
    .join('');
  const moreLine = more > 0 ? `<div style="color:#666;font-size:12px;margin-top:4px;">…and ${more} more</div>` : '';
  const bg = highlight ? 'background:#fff8e1;border-left:4px solid #d97706;' : 'background:#f6f8f7;border-left:4px solid #0F6E56;';
  return `
    <div style="margin:16px 0;padding:12px 16px;border-radius:6px;${bg}">
      <div style="font-weight:600;margin-bottom:8px;">${esc(label)} <span style="color:#666;font-weight:400;">(${issues.length})</span></div>
      <ul style="margin:0 0 0 18px;padding:0;font-size:13px;line-height:1.5;">${items}</ul>
      ${moreLine}
    </div>
  `;
}

function renderGroupText(label: string, issues: Issue[]): string {
  if (issues.length === 0) return '';
  const shown = issues.slice(0, MAX_PER_GROUP);
  const more = issues.length - shown.length;
  const lines = shown.map((i) => `  - ${i.url}  (${i.detail})`).join('\n');
  const moreLine = more > 0 ? `\n  ...and ${more} more` : '';
  return `\n${label} (${issues.length}):\n${lines}${moreLine}\n`;
}

export interface LayerAEmailBody {
  text: string;
  html: string;
}

export function buildLayerAEmail(params: {
  diff: BaselineDiff;
  totalUrls: number;
  crawledUrls: number;
  truncated: boolean;
  durationMs: number;
  weekly: boolean;
  history: Array<{ iso: string; totalIssues: number }>;
  todayIso: string;
}): LayerAEmailBody {
  const { diff, totalUrls, crawledUrls, truncated, durationMs, weekly, history, todayIso } = params;
  const newByType = groupByType(diff.newIssues);
  const carriedByType = groupByType(diff.carriedIssues);
  const last = history[history.length - 2]?.totalIssues;
  const trend =
    typeof last === 'number'
      ? diff.currentTotal === last
        ? `flat vs last run (${last})`
        : diff.currentTotal > last
          ? `↑ +${diff.currentTotal - last} vs last run`
          : `↓ ${last - diff.currentTotal} fewer vs last run`
      : 'no prior data';

  // HTML
  let html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:680px;margin:0 auto;color:#1a1a1a;">
      <h2 style="color:#0F6E56;margin:0 0 4px;">TheDripMap SEO health — ${esc(todayIso)}</h2>
      <div style="color:#555;font-size:13px;margin-bottom:16px;">
        Layer A · daily self-crawl<br/>
        Crawled <strong>${crawledUrls}</strong> of ${totalUrls} URLs in ${Math.round(durationMs / 1000)}s${truncated ? ' (budget hit — partial)' : ''}<br/>
        New: <strong style="color:#b91c1c;">${diff.newIssues.length}</strong> · Carried: ${diff.carriedIssues.length} · Resolved: ${diff.resolvedIssues.length} · Trend: ${esc(trend)}
      </div>
  `;

  if (diff.newIssues.length === 0 && !weekly) {
    html += `<div style="padding:16px;background:#ecfdf5;border-left:4px solid #059669;border-radius:6px;">No new issues since the last run. Nothing to act on.</div>`;
  }

  if (diff.newIssues.length > 0) {
    html += `<h3 style="margin:20px 0 4px;color:#b91c1c;">NEW issues</h3>`;
    for (const t of ISSUE_ORDER) {
      html += renderGroupHtml(ISSUE_LABELS[t], newByType[t], true);
    }
  }

  if (weekly && diff.carriedIssues.length > 0) {
    html += `<h3 style="margin:24px 0 4px;color:#444;">Carried over (existing)</h3>`;
    for (const t of ISSUE_ORDER) {
      html += renderGroupHtml(ISSUE_LABELS[t], carriedByType[t], false);
    }
  }

  if (weekly && diff.resolvedIssues.length > 0) {
    const shown = diff.resolvedIssues.slice(0, MAX_PER_GROUP);
    const more = diff.resolvedIssues.length - shown.length;
    html += `
      <h3 style="margin:24px 0 4px;color:#059669;">Resolved since last week (${diff.resolvedIssues.length})</h3>
      <ul style="margin:0 0 0 18px;padding:0;font-size:13px;line-height:1.5;color:#555;">
        ${shown.map((i) => `<li>${esc(i.url)} <span style="color:#888;">— was ${esc(i.type)}</span></li>`).join('')}
      </ul>
      ${more > 0 ? `<div style="color:#666;font-size:12px;margin-top:4px;">…and ${more} more</div>` : ''}
    `;
  }

  html += `</div>`;

  // Plain text
  let text = `TheDripMap SEO health — ${todayIso}\n`;
  text += `Layer A · daily self-crawl\n`;
  text += `Crawled ${crawledUrls} of ${totalUrls} URLs in ${Math.round(durationMs / 1000)}s${truncated ? ' (budget hit — partial)' : ''}\n`;
  text += `New: ${diff.newIssues.length} · Carried: ${diff.carriedIssues.length} · Resolved: ${diff.resolvedIssues.length} · Trend: ${trend}\n`;

  if (diff.newIssues.length === 0 && !weekly) {
    text += `\nNo new issues since the last run.\n`;
  }
  if (diff.newIssues.length > 0) {
    text += `\nNEW ISSUES\n----------`;
    for (const t of ISSUE_ORDER) {
      text += renderGroupText(ISSUE_LABELS[t], newByType[t]);
    }
  }
  if (weekly && diff.carriedIssues.length > 0) {
    text += `\nCARRIED OVER\n------------`;
    for (const t of ISSUE_ORDER) {
      text += renderGroupText(ISSUE_LABELS[t], carriedByType[t]);
    }
  }
  if (weekly && diff.resolvedIssues.length > 0) {
    text += `\nRESOLVED SINCE LAST WEEK (${diff.resolvedIssues.length})\n`;
    for (const i of diff.resolvedIssues.slice(0, MAX_PER_GROUP)) {
      text += `  - ${i.url}  (was ${i.type})\n`;
    }
    if (diff.resolvedIssues.length > MAX_PER_GROUP) {
      text += `  ...and ${diff.resolvedIssues.length - MAX_PER_GROUP} more\n`;
    }
  }

  return { text, html };
}

// ---------- Layer B (GSC) email body ----------

export interface LayerBEmailBody {
  text: string;
  html: string;
  subject: string;
}

export function buildLayerBEmail(report: GscReport, todayIso: string): LayerBEmailBody {
  if (report.kind === 'stub') {
    const subject = `[TheDripMap SEO] GSC report stubbed — setup required (${todayIso})`;
    const text = `Layer B (GSC) report — ${todayIso}\n\n${report.message}\n\n${report.setupSteps.join('\n')}\n`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;color:#1a1a1a;">
        <h2 style="color:#0F6E56;">TheDripMap SEO — Layer B (GSC)</h2>
        <p>${esc(report.message)}</p>
        <h3>Setup steps to enable</h3>
        <ol style="font-size:14px;line-height:1.6;">
          ${report.setupSteps.map((s) => `<li>${esc(s)}</li>`).join('')}
        </ol>
        <p style="color:#666;font-size:12px;">Once <code>GSC_SERVICE_ACCOUNT_KEY</code> is set in env, this cron will start producing real reports every Monday at 7am ET.</p>
      </div>
    `;
    return { subject, text, html };
  }

  const { searchAnalytics, sitemaps, urlInspection } = report.data;
  const subject = `[TheDripMap SEO] GSC weekly report — ${todayIso}`;

  // HTML
  let html = `
    <div style="font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;color:#1a1a1a;">
      <h2 style="color:#0F6E56;margin:0 0 4px;">TheDripMap SEO — GSC weekly report</h2>
      <div style="color:#555;font-size:13px;margin-bottom:16px;">Property: <strong>${esc(report.property)}</strong> · ${esc(todayIso)}</div>

      <h3 style="margin:18px 0 6px;">Search Analytics — last 28 days</h3>
      <table style="font-size:14px;border-collapse:collapse;width:100%;">
        <tr><td style="padding:4px 8px;color:#555;">Clicks</td><td style="padding:4px 8px;font-weight:600;">${searchAnalytics.totals.clicks}</td><td style="padding:4px 8px;color:${searchAnalytics.wow.clicks >= 0 ? '#059669' : '#b91c1c'};">${searchAnalytics.wow.clicks >= 0 ? '+' : ''}${searchAnalytics.wow.clicks} WoW</td></tr>
        <tr><td style="padding:4px 8px;color:#555;">Impressions</td><td style="padding:4px 8px;font-weight:600;">${searchAnalytics.totals.impressions}</td><td style="padding:4px 8px;color:${searchAnalytics.wow.impressions >= 0 ? '#059669' : '#b91c1c'};">${searchAnalytics.wow.impressions >= 0 ? '+' : ''}${searchAnalytics.wow.impressions} WoW</td></tr>
        <tr><td style="padding:4px 8px;color:#555;">CTR</td><td style="padding:4px 8px;font-weight:600;">${(searchAnalytics.totals.ctr * 100).toFixed(2)}%</td><td></td></tr>
        <tr><td style="padding:4px 8px;color:#555;">Avg position</td><td style="padding:4px 8px;font-weight:600;">${searchAnalytics.totals.position.toFixed(1)}</td><td></td></tr>
      </table>

      <h3 style="margin:18px 0 6px;">Top 10 queries</h3>
      <ol style="font-size:13px;line-height:1.5;padding-left:20px;">
        ${searchAnalytics.topQueries.map((q) => `<li>${esc(q.query)} — ${q.clicks} clicks, ${q.impressions} imp, pos ${q.position.toFixed(1)}</li>`).join('')}
      </ol>

      <h3 style="margin:18px 0 6px;">Top 10 pages</h3>
      <ol style="font-size:13px;line-height:1.5;padding-left:20px;">
        ${searchAnalytics.topPages.map((p) => `<li><a href="${esc(p.page)}" style="color:#0F6E56;">${esc(p.page)}</a> — ${p.clicks} clicks, ${p.impressions} imp</li>`).join('')}
      </ol>

      <h3 style="margin:18px 0 6px;">Sitemaps</h3>
      <ul style="font-size:13px;line-height:1.5;padding-left:20px;">
        ${sitemaps.map((s) => `<li>${esc(s.path)} — submitted ${s.submitted}, indexed ${s.indexed}${s.warnings ? `, warnings ${s.warnings}` : ''}${s.errors ? `, errors ${s.errors}` : ''}</li>`).join('')}
      </ul>

      <h3 style="margin:18px 0 6px;">URL Inspection sample (${urlInspection.sampled} of rotating ${urlInspection.totalEligible})</h3>
      <div style="color:#666;font-size:12px;margin-bottom:6px;">Cursor at index ${urlInspection.nextCursor} for next run.</div>
      <ul style="font-size:13px;line-height:1.5;padding-left:20px;">
        ${Object.entries(urlInspection.buckets)
          .filter(([, v]) => v.count > 0)
          .map(
            ([k, v]) =>
              `<li><strong>${esc(k)}</strong>: ${v.count}${v.examples.length ? ` — e.g. ${v.examples.slice(0, 3).map((u) => `<a href="${esc(u)}" style="color:#0F6E56;">${esc(u)}</a>`).join(', ')}` : ''}</li>`
          )
          .join('')}
      </ul>

      <p style="color:#666;font-size:12px;margin-top:24px;">
        Note: the full GSC "Why pages aren't indexed" breakdown isn't a single API endpoint —
        this report approximates it via the Sitemaps API + a rotating URL Inspection sample
        (~${urlInspection.sampled} URLs/run to respect daily quota). The cursor rotates each
        run so all sitemap URLs get inspected over time.
      </p>
    </div>
  `;

  // Plain text
  let text = `TheDripMap SEO — GSC weekly report — ${todayIso}\n`;
  text += `Property: ${report.property}\n\n`;
  text += `SEARCH ANALYTICS — last 28 days\n`;
  text += `  Clicks:      ${searchAnalytics.totals.clicks} (${searchAnalytics.wow.clicks >= 0 ? '+' : ''}${searchAnalytics.wow.clicks} WoW)\n`;
  text += `  Impressions: ${searchAnalytics.totals.impressions} (${searchAnalytics.wow.impressions >= 0 ? '+' : ''}${searchAnalytics.wow.impressions} WoW)\n`;
  text += `  CTR:         ${(searchAnalytics.totals.ctr * 100).toFixed(2)}%\n`;
  text += `  Avg pos:     ${searchAnalytics.totals.position.toFixed(1)}\n\n`;
  text += `TOP 10 QUERIES\n`;
  for (const q of searchAnalytics.topQueries) {
    text += `  - ${q.query}  —  ${q.clicks} clicks, ${q.impressions} imp, pos ${q.position.toFixed(1)}\n`;
  }
  text += `\nTOP 10 PAGES\n`;
  for (const p of searchAnalytics.topPages) {
    text += `  - ${p.page}  —  ${p.clicks} clicks, ${p.impressions} imp\n`;
  }
  text += `\nSITEMAPS\n`;
  for (const s of sitemaps) {
    text += `  - ${s.path}  —  submitted ${s.submitted}, indexed ${s.indexed}\n`;
  }
  text += `\nURL INSPECTION SAMPLE (${urlInspection.sampled} of ${urlInspection.totalEligible})\n`;
  text += `Cursor at index ${urlInspection.nextCursor} for next run.\n`;
  for (const [k, v] of Object.entries(urlInspection.buckets)) {
    if (v.count === 0) continue;
    text += `  - ${k}: ${v.count}\n`;
    for (const u of v.examples.slice(0, 3)) text += `      ${u}\n`;
  }
  text += `\nNote: the full GSC "Why pages aren't indexed" breakdown isn't a single API\nendpoint — this report approximates it via the Sitemaps API + a rotating URL\nInspection sample (~${urlInspection.sampled} URLs/run to respect daily quota).\n`;

  return { subject, text, html };
}
