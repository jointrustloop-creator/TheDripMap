// Layer A — daily self-crawl tripwire.
//
// Pulls our own /sitemap.xml (and any nested sitemap indexes), then probes
// every URL: HEAD first; if 2xx, GET to parse head tags. Captures status,
// final URL after redirects, redirect chain length, canonical, noindex,
// title, meta description.
//
// Designed to be fast enough for ~2,142 URLs inside Vercel's 300s cron budget:
// - Concurrency cap of CRAWL_CONCURRENCY (default 24)
// - HEAD-only for redirect/status detection
// - GET only for 2xx where we need the <head>
// - Per-request timeout of 8s; total wall clock guard at TOTAL_BUDGET_MS

const SITE_URL = 'https://www.thedripmap.com';
const CRAWL_CONCURRENCY = 24;
const REQUEST_TIMEOUT_MS = 8000;
// Leave ~30s headroom under Vercel's 300s cap for diffing + email.
const DEFAULT_TOTAL_BUDGET_MS = 270_000;

// Paths where noindex is intentional and should NOT be flagged.
// These are admin tools, embedded widgets, JSON endpoints — never meant
// to appear in Google's index.
const NOINDEX_ALLOWLIST_PREFIXES = [
  '/admin/',
  '/tools/clinic-agent-',
  '/embed/',
  '/api/',
  '/onboarding/',
  '/dashboard',
  '/login',
  '/signup',
  '/verify-claim',
  '/apply-copy',
];

export interface CrawlResult {
  url: string;
  status: number; // HTTP status (0 if network error)
  finalUrl: string; // URL after redirects (same as url if none)
  redirectHops: number;
  canonical: string | null;
  noindex: boolean;
  title: string | null;
  metaDescription: string | null;
  error: string | null;
}

export interface CrawlSummary {
  totalUrls: number;
  crawledUrls: number;
  durationMs: number;
  truncated: boolean; // True if we hit the wall-clock budget
  results: CrawlResult[];
}

// ---------- sitemap fetch ----------

/**
 * Recursively walk a sitemap (handles sitemapindex → nested sitemap files).
 * Returns the deduped flat list of URLs.
 */
export async function fetchSitemapUrls(rootUrl = `${SITE_URL}/sitemap.xml`): Promise<string[]> {
  const seen = new Set<string>();
  const queue: string[] = [rootUrl];
  const allUrls = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);

    const xml = await fetchText(current);
    if (!xml) continue;

    // sitemapindex → nested sitemaps
    if (/<sitemapindex/i.test(xml)) {
      const nested = extractLocs(xml);
      for (const u of nested) queue.push(u);
      continue;
    }

    // urlset → leaf URLs
    const urls = extractLocs(xml);
    for (const u of urls) allUrls.add(u);
  }

  return Array.from(allUrls);
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), REQUEST_TIMEOUT_MS * 2);
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: { 'User-Agent': 'TheDripMap-SEO-Health/1.0' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractLocs(xml: string): string[] {
  const out: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    out.push(m[1].trim());
  }
  return out;
}

// ---------- per-URL probe ----------

async function probeUrl(url: string): Promise<CrawlResult> {
  const base: CrawlResult = {
    url,
    status: 0,
    finalUrl: url,
    redirectHops: 0,
    canonical: null,
    noindex: false,
    title: null,
    metaDescription: null,
    error: null,
  };

  // Manual redirect-chain walk via HEAD so we can count hops.
  let current = url;
  let hops = 0;
  let lastRes: Response | null = null;
  try {
    for (let i = 0; i < 6; i++) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), REQUEST_TIMEOUT_MS);
      lastRes = await fetch(current, {
        method: 'HEAD',
        redirect: 'manual',
        signal: ctl.signal,
        headers: { 'User-Agent': 'TheDripMap-SEO-Health/1.0' },
      });
      clearTimeout(timer);

      if (lastRes.status >= 300 && lastRes.status < 400) {
        const loc = lastRes.headers.get('location');
        if (!loc) break;
        const next = new URL(loc, current).toString();
        hops += 1;
        current = next;
        continue;
      }
      break;
    }
  } catch (err) {
    return {
      ...base,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  if (!lastRes) {
    return { ...base, error: 'no response' };
  }

  base.status = lastRes.status;
  base.finalUrl = current;
  base.redirectHops = hops;

  // For non-2xx we don't need to parse <head>.
  if (lastRes.status < 200 || lastRes.status >= 300) {
    return base;
  }

  // Get the HTML body for head-tag inspection.
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), REQUEST_TIMEOUT_MS);
    const getRes = await fetch(current, {
      signal: ctl.signal,
      headers: { 'User-Agent': 'TheDripMap-SEO-Health/1.0' },
    });
    clearTimeout(timer);
    if (!getRes.ok) return base;
    const html = await getRes.text();
    parseHead(html, base);
  } catch (err) {
    base.error = err instanceof Error ? err.message : String(err);
  }
  return base;
}

function parseHead(html: string, result: CrawlResult): void {
  // Only consider the <head>...</head> region if present (faster + safer).
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  const region = headMatch ? headMatch[0] : html.slice(0, 50_000);

  const titleMatch = region.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    result.title = titleMatch[1].replace(/\s+/g, ' ').trim() || null;
  }

  const descMatch =
    region.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
    region.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  if (descMatch) {
    result.metaDescription = descMatch[1].trim() || null;
  }

  const canonMatch =
    region.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
    region.match(/<link[^>]+href=["']([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i);
  if (canonMatch) {
    result.canonical = canonMatch[1].trim() || null;
  }

  const robotsMatch =
    region.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
    region.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']robots["'][^>]*>/i);
  if (robotsMatch && /noindex/i.test(robotsMatch[1])) {
    result.noindex = true;
  }
}

// ---------- crawler driver ----------

/**
 * Crawl a list of URLs with bounded concurrency and a total time budget.
 * If the budget runs out, returns partial results with truncated=true.
 */
export async function crawlUrls(
  urls: string[],
  opts: { concurrency?: number; totalBudgetMs?: number } = {}
): Promise<CrawlSummary> {
  const concurrency = opts.concurrency ?? CRAWL_CONCURRENCY;
  const totalBudgetMs = opts.totalBudgetMs ?? DEFAULT_TOTAL_BUDGET_MS;
  const start = Date.now();
  const results: CrawlResult[] = [];
  let cursor = 0;
  let aborted = false;

  async function worker() {
    while (!aborted) {
      const i = cursor++;
      if (i >= urls.length) return;
      if (Date.now() - start > totalBudgetMs) {
        aborted = true;
        return;
      }
      const r = await probeUrl(urls[i]);
      results.push(r);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
  await Promise.all(workers);

  return {
    totalUrls: urls.length,
    crawledUrls: results.length,
    durationMs: Date.now() - start,
    truncated: aborted,
    results,
  };
}

// ---------- flag detection ----------

export type IssueType =
  | 'non_200'
  | 'redirect_chain'
  | 'missing_canonical'
  | 'unexpected_noindex'
  | 'missing_title'
  | 'missing_meta';

export interface Issue {
  type: IssueType;
  url: string;
  detail: string;
}

export function detectIssues(summary: CrawlSummary): Issue[] {
  const issues: Issue[] = [];
  for (const r of summary.results) {
    // Non-200 (treat network errors as non-200 too).
    if (r.status === 0) {
      issues.push({
        type: 'non_200',
        url: r.url,
        detail: r.error || 'network error',
      });
      continue;
    }
    if (r.status >= 300) {
      // 3xx → only flag if redirect chain > 1 hop.
      if (r.status < 400 && r.redirectHops > 1) {
        issues.push({
          type: 'redirect_chain',
          url: r.url,
          detail: `${r.redirectHops} hops → ${r.finalUrl}`,
        });
      } else if (r.status >= 400) {
        issues.push({
          type: 'non_200',
          url: r.url,
          detail: `HTTP ${r.status}`,
        });
      }
      continue;
    }

    // 2xx → check head tags.
    const path = pathOf(r.url);
    const noindexOk = NOINDEX_ALLOWLIST_PREFIXES.some((p) => path.startsWith(p));

    if (r.noindex && !noindexOk) {
      issues.push({
        type: 'unexpected_noindex',
        url: r.url,
        detail: 'noindex on indexable page',
      });
    }
    if (!r.canonical) {
      issues.push({
        type: 'missing_canonical',
        url: r.url,
        detail: 'no <link rel="canonical">',
      });
    }
    if (!r.title) {
      issues.push({
        type: 'missing_title',
        url: r.url,
        detail: 'no <title>',
      });
    }
    if (!r.metaDescription) {
      issues.push({
        type: 'missing_meta',
        url: r.url,
        detail: 'no <meta name="description">',
      });
    }
  }
  return issues;
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}
