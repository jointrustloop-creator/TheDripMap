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
  crawl_timeout: 'Crawler timeouts (page not read — usually cold cache, verify before acting)',
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
  'crawl_timeout',
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

// ---------- Sunday weekly digest (good / bad / ugly) ----------
//
// Combines the GSC report (when wired) with the most recent Layer A self-crawl
// to give one weekly "good / bad / ugly" snapshot. When GSC is stubbed, the
// Layer A data still produces a useful report; a clear banner explains the
// missing GSC pillar.

export interface SundayDigestInput {
  gscReport: GscReport;
  crawl: {
    totalUrls: number;
    crawledUrls: number;
    truncated: boolean;
    durationMs: number;
    issues: Issue[];
    asOfIso: string;
    fresh: boolean; // True if crawled inline during this run, false if read from baseline.
  } | null;
  todayIso: string;
  prettyDate: string; // e.g. "Sunday, May 30 2026"
}

export interface SundayDigestBody {
  subject: string;
  text: string;
  html: string;
}

function countByType(issues: Issue[]): Record<IssueType, Issue[]> {
  return groupByType(issues);
}

export function buildSundayDigestEmail(input: SundayDigestInput): SundayDigestBody {
  const { gscReport, crawl, todayIso, prettyDate } = input;

  const healthy = crawl ? Math.max(0, crawl.crawledUrls - crawl.issues.length) : 0;
  const issuesByType = crawl ? countByType(crawl.issues) : null;

  const subject = `[TheDripMap SEO] Weekly report — ${prettyDate}`;

  // ----- Build sections (text + html in parallel) -----

  const goodHtml: string[] = [];
  const badHtml: string[] = [];
  const uglyHtml: string[] = [];
  const goodText: string[] = [];
  const badText: string[] = [];
  const uglyText: string[] = [];

  // GOOD — Layer A wins
  if (crawl) {
    const pct = crawl.crawledUrls > 0 ? Math.round((healthy / crawl.crawledUrls) * 1000) / 10 : 0;
    goodHtml.push(`<li><strong>${healthy.toLocaleString()}</strong> of ${crawl.crawledUrls.toLocaleString()} URLs healthy <span style="color:#666;">(${pct}%)</span></li>`);
    goodText.push(`  • ${healthy} of ${crawl.crawledUrls} URLs healthy (${pct}%)`);
    goodHtml.push(`<li>Crawl completed in <strong>${Math.round(crawl.durationMs / 1000)}s</strong>${crawl.truncated ? ' <span style="color:#b91c1c;">(budget hit — partial)</span>' : ''}</li>`);
    goodText.push(`  • Crawl completed in ${Math.round(crawl.durationMs / 1000)}s${crawl.truncated ? ' (budget hit — partial)' : ''}`);
  } else {
    goodHtml.push(`<li style="color:#666;">No Layer A crawl data yet — the daily 6am ET crawl will populate this next.</li>`);
    goodText.push(`  • No Layer A crawl data yet — the daily 6am ET crawl will populate this next.`);
  }

  // GOOD — GSC wins (when wired)
  if (gscReport.kind === 'ok') {
    const sa = gscReport.data.searchAnalytics;
    const sm = gscReport.data.sitemaps;
    const ui = gscReport.data.urlInspection;

    const totalSubmitted = sm.reduce((a, s) => a + s.submitted, 0);
    const totalIndexed = sm.reduce((a, s) => a + s.indexed, 0);
    if (totalSubmitted > 0) {
      goodHtml.push(`<li><strong>${totalIndexed.toLocaleString()}</strong> of ${totalSubmitted.toLocaleString()} sitemap URLs indexed by Google</li>`);
      goodText.push(`  • ${totalIndexed} of ${totalSubmitted} sitemap URLs indexed by Google`);
    }

    if (sa.wow.clicks > 0) {
      goodHtml.push(`<li>Clicks <span style="color:#059669;font-weight:600;">↑ +${sa.wow.clicks}</span> week-over-week (${sa.totals.clicks} total · last 28 days)</li>`);
      goodText.push(`  • Clicks +${sa.wow.clicks} WoW (${sa.totals.clicks} total · last 28 days)`);
    }
    if (sa.wow.impressions > 0) {
      goodHtml.push(`<li>Impressions <span style="color:#059669;font-weight:600;">↑ +${sa.wow.impressions}</span> WoW (${sa.totals.impressions} total)</li>`);
      goodText.push(`  • Impressions +${sa.wow.impressions} WoW (${sa.totals.impressions} total)`);
    }

    const topQ = sa.topQueries.slice(0, 3);
    if (topQ.length) {
      const html = topQ
        .map((q) => `<strong>"${esc(q.query)}"</strong> (${q.clicks} clicks, pos ${q.position.toFixed(1)})`)
        .join('; ');
      goodHtml.push(`<li>Top queries: ${html}</li>`);
      goodText.push(`  • Top queries: ${topQ.map((q) => `"${q.query}" (${q.clicks} clicks, pos ${q.position.toFixed(1)})`).join('; ')}`);
    }

    if (ui.buckets.indexed?.count > 0) {
      goodHtml.push(`<li><strong>${ui.buckets.indexed.count}</strong> of ${ui.sampled} sampled URLs confirmed indexed by Google this week</li>`);
      goodText.push(`  • ${ui.buckets.indexed.count} of ${ui.sampled} sampled URLs confirmed indexed by Google this week`);
    }
  }

  // BAD — soft issues
  if (issuesByType) {
    if (issuesByType.missing_canonical.length > 0) {
      const n = issuesByType.missing_canonical.length;
      badHtml.push(`<li><strong>${n}</strong> URLs missing a canonical tag <span style="color:#666;">— Google may pick a different version</span></li>`);
      badText.push(`  • ${n} URLs missing a canonical tag — Google may pick a different version`);
    }
    if (issuesByType.missing_title.length > 0) {
      const n = issuesByType.missing_title.length;
      badHtml.push(`<li><strong>${n}</strong> URLs missing a &lt;title&gt; tag</li>`);
      badText.push(`  • ${n} URLs missing a <title> tag`);
    }
    if (issuesByType.missing_meta.length > 0) {
      const n = issuesByType.missing_meta.length;
      badHtml.push(`<li><strong>${n}</strong> URLs missing a meta description <span style="color:#666;">— Google generates its own</span></li>`);
      badText.push(`  • ${n} URLs missing a meta description — Google generates its own`);
    }
  }

  // BAD — GSC soft issues (when wired)
  if (gscReport.kind === 'ok') {
    const ui = gscReport.data.urlInspection;
    const sa = gscReport.data.searchAnalytics;

    if (ui.buckets.crawled_not_indexed?.count > 0) {
      const n = ui.buckets.crawled_not_indexed.count;
      badHtml.push(`<li><strong>${n}</strong> URLs Google crawled but chose not to index <span style="color:#666;">— content quality signal</span></li>`);
      badText.push(`  • ${n} URLs Google crawled but chose not to index — content quality signal`);
    }
    if (ui.buckets.discovered_not_indexed?.count > 0) {
      const n = ui.buckets.discovered_not_indexed.count;
      badHtml.push(`<li><strong>${n}</strong> URLs Google discovered but hasn't crawled yet</li>`);
      badText.push(`  • ${n} URLs Google discovered but hasn't crawled yet`);
    }

    // Low-CTR opportunities: rank well but few clicks.
    const opp = sa.topQueries.filter((q) => q.position <= 10 && q.impressions >= 50 && q.ctr < 0.02);
    if (opp.length > 0) {
      const top3 = opp.slice(0, 3);
      const html = top3.map((q) => `<strong>"${esc(q.query)}"</strong> (pos ${q.position.toFixed(1)}, ${(q.ctr * 100).toFixed(1)}% CTR)`).join('; ');
      badHtml.push(`<li>${opp.length} queries ranking page 1 with very low CTR <span style="color:#666;">— title/meta rewrite opportunity</span>: ${html}</li>`);
      badText.push(`  • ${opp.length} queries ranking page 1 with very low CTR: ${top3.map((q) => `"${q.query}" (pos ${q.position.toFixed(1)}, ${(q.ctr * 100).toFixed(1)}% CTR)`).join('; ')}`);
    }

    if (sa.wow.clicks < 0) {
      badHtml.push(`<li>Clicks <span style="color:#b91c1c;font-weight:600;">↓ ${sa.wow.clicks}</span> WoW (${sa.totals.clicks} total · last 28 days)</li>`);
      badText.push(`  • Clicks ${sa.wow.clicks} WoW (${sa.totals.clicks} total · last 28 days)`);
    }
  }

  // UGLY — hard breakage
  if (issuesByType) {
    if (issuesByType.non_200.length > 0) {
      const n = issuesByType.non_200.length;
      const examples = issuesByType.non_200.slice(0, 3).map((i) => `<a href="${esc(i.url)}" style="color:#0F6E56;">${esc(i.url)}</a>`).join(', ');
      uglyHtml.push(`<li><strong>${n}</strong> URLs returning non-200 status <span style="color:#666;">— ${examples}${n > 3 ? `, and ${n - 3} more` : ''}</span></li>`);
      uglyText.push(`  • ${n} URLs returning non-200 status — e.g. ${issuesByType.non_200.slice(0, 3).map((i) => i.url).join(', ')}${n > 3 ? `, and ${n - 3} more` : ''}`);
    }
    if (issuesByType.unexpected_noindex.length > 0) {
      const n = issuesByType.unexpected_noindex.length;
      const examples = issuesByType.unexpected_noindex.slice(0, 3).map((i) => `<a href="${esc(i.url)}" style="color:#0F6E56;">${esc(i.url)}</a>`).join(', ');
      uglyHtml.push(`<li><strong>${n}</strong> URLs blocking Google with unexpected noindex <span style="color:#666;">— ${examples}${n > 3 ? `, and ${n - 3} more` : ''}</span></li>`);
      uglyText.push(`  • ${n} URLs blocking Google with unexpected noindex`);
    }
    if (issuesByType.redirect_chain.length > 0) {
      const n = issuesByType.redirect_chain.length;
      uglyHtml.push(`<li><strong>${n}</strong> URLs with redirect chains longer than 1 hop <span style="color:#666;">— wastes Google's crawl budget</span></li>`);
      uglyText.push(`  • ${n} URLs with redirect chains longer than 1 hop — wastes Google's crawl budget`);
    }
  }

  if (gscReport.kind === 'ok') {
    const ui = gscReport.data.urlInspection;
    if (ui.buckets.not_found_404?.count > 0) {
      const n = ui.buckets.not_found_404.count;
      const examples = ui.buckets.not_found_404.examples.slice(0, 3).map((u) => `<a href="${esc(u)}" style="color:#0F6E56;">${esc(u)}</a>`).join(', ');
      uglyHtml.push(`<li>Google sees <strong>${n}</strong> URLs as 404 <span style="color:#666;">— ${examples}</span></li>`);
      uglyText.push(`  • Google sees ${n} URLs as 404`);
    }
    if (ui.buckets.canonical_mismatch?.count > 0) {
      const n = ui.buckets.canonical_mismatch.count;
      const examples = ui.buckets.canonical_mismatch.examples.slice(0, 3).map((u) => `<a href="${esc(u)}" style="color:#0F6E56;">${esc(u)}</a>`).join(', ');
      uglyHtml.push(`<li>Google chose a different canonical than declared on <strong>${n}</strong> URLs <span style="color:#666;">— ${examples}</span></li>`);
      uglyText.push(`  • Google chose a different canonical than declared on ${n} URLs`);
    }
    // Per-sitemap errors
    for (const s of gscReport.data.sitemaps) {
      if (s.errors > 0) {
        uglyHtml.push(`<li>Sitemap <code>${esc(s.path)}</code> has <strong>${s.errors}</strong> errors</li>`);
        uglyText.push(`  • Sitemap ${s.path} has ${s.errors} errors`);
      }
    }
  }

  // Empty-state for ugly
  if (uglyHtml.length === 0) {
    uglyHtml.push(`<li style="color:#059669;">Nothing critical — clean week.</li>`);
    uglyText.push(`  • Nothing critical — clean week.`);
  }
  if (badHtml.length === 0) {
    badHtml.push(`<li style="color:#059669;">No soft issues flagged.</li>`);
    badText.push(`  • No soft issues flagged.`);
  }
  if (goodHtml.length === 0) {
    goodHtml.push(`<li style="color:#666;">No data this week.</li>`);
    goodText.push(`  • No data this week.`);
  }

  // GSC stub banner
  const gscStubBanner = gscReport.kind === 'stub'
    ? `
      <div style="margin:16px 0;padding:12px 16px;background:#fef3c7;border-left:4px solid #d97706;border-radius:6px;font-size:13px;line-height:1.55;color:#78350f;">
        <strong>Search Console data is not wired yet.</strong> This report shows technical SEO from our own self-crawl only. To unlock Google's view (impressions, clicks, indexing reasons, query-level data), add <code>GSC_SERVICE_ACCOUNT_KEY</code> to Vercel — ~10 min one-time setup. Steps are at the bottom of this email.
      </div>
    `
    : '';

  const gscSetupSection = gscReport.kind === 'stub'
    ? `
      <h3 style="margin:24px 0 6px;color:#555;">Setup steps to unlock Search Console data</h3>
      <ol style="font-size:13px;line-height:1.6;color:#444;">
        ${gscReport.setupSteps.map((s) => `<li>${esc(s)}</li>`).join('')}
      </ol>
    `
    : '';

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:680px;margin:0 auto;color:#1a1a1a;padding:8px;">
      <h2 style="color:#0F6E56;margin:0 0 4px;">TheDripMap SEO Weekly</h2>
      <div style="color:#555;font-size:13px;margin-bottom:16px;">${esc(prettyDate)}</div>

      ${gscStubBanner}

      <div style="margin:16px 0;padding:14px 18px;border-radius:6px;background:#ecfdf5;border-left:4px solid #059669;">
        <div style="font-weight:700;color:#065f46;font-size:15px;margin-bottom:8px;">🟢 The Good</div>
        <ul style="margin:0 0 0 18px;padding:0;font-size:14px;line-height:1.65;">
          ${goodHtml.join('')}
        </ul>
      </div>

      <div style="margin:16px 0;padding:14px 18px;border-radius:6px;background:#fffbeb;border-left:4px solid #d97706;">
        <div style="font-weight:700;color:#92400e;font-size:15px;margin-bottom:8px;">🟡 The Bad</div>
        <ul style="margin:0 0 0 18px;padding:0;font-size:14px;line-height:1.65;">
          ${badHtml.join('')}
        </ul>
      </div>

      <div style="margin:16px 0;padding:14px 18px;border-radius:6px;background:#fef2f2;border-left:4px solid #b91c1c;">
        <div style="font-weight:700;color:#991b1b;font-size:15px;margin-bottom:8px;">🔴 The Ugly</div>
        <ul style="margin:0 0 0 18px;padding:0;font-size:14px;line-height:1.65;">
          ${uglyHtml.join('')}
        </ul>
      </div>

      ${gscSetupSection}

      <div style="color:#888;font-size:11px;margin-top:24px;border-top:1px solid #eee;padding-top:8px;">
        Sent automatically every Sunday at 8pm ET. Layer A self-crawl ${crawl ? (crawl.fresh ? 'ran fresh this report' : `from baseline ${esc(crawl.asOfIso)}`) : 'unavailable'}. ${gscReport.kind === 'ok' ? `GSC data from property ${esc(gscReport.property)}.` : 'GSC data unavailable (stub).'}
      </div>
    </div>
  `;

  const lines: string[] = [];
  lines.push(`TheDripMap SEO Weekly — ${prettyDate}`);
  lines.push('');
  if (gscReport.kind === 'stub') {
    lines.push('NOTE: Search Console data is not wired yet. This report shows technical SEO from our own self-crawl only.');
    lines.push('');
  }
  lines.push('🟢 THE GOOD');
  lines.push(...goodText);
  lines.push('');
  lines.push('🟡 THE BAD');
  lines.push(...badText);
  lines.push('');
  lines.push('🔴 THE UGLY');
  lines.push(...uglyText);
  if (gscReport.kind === 'stub') {
    lines.push('');
    lines.push('SETUP STEPS TO UNLOCK SEARCH CONSOLE DATA');
    gscReport.setupSteps.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
  }
  lines.push('');
  lines.push('—');
  lines.push(`Sent automatically every Sunday at 8pm ET. Layer A self-crawl ${crawl ? (crawl.fresh ? 'ran fresh this report' : `from baseline ${crawl.asOfIso}`) : 'unavailable'}.`);

  return { subject, text: lines.join('\n'), html };
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
