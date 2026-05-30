// Layer B — Google Search Console API client.
//
// Authentication: service account JSON in env GSC_SERVICE_ACCOUNT_KEY.
// The service account email must be added as a user on the
// `sc-domain:thedripmap.com` (or `https://www.thedripmap.com/`) GSC property.
//
// If the key is missing the module returns a "stub" report so callers can
// still surface the setup steps without crashing. We never throw on missing
// credentials.
//
// Endpoints used:
//   POST searchanalytics/query        — top queries, top pages, totals
//   GET  sites/{siteUrl}/sitemaps     — submitted vs indexed
//   POST urlInspection/index:inspect  — rotating sample (50–100/run)
//
// Token minting uses google-auth-library (already in package.json).

import { JWT } from 'google-auth-library';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SEARCH_ANALYTICS_URL = (siteUrl: string) =>
  `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
const SITEMAPS_URL = (siteUrl: string) =>
  `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`;
const URL_INSPECT_URL = `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`;

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

// Recommended default property identifier. Domain properties are preferred
// because they cover both http/https and www/apex. Set GSC_PROPERTY in env
// to override.
const DEFAULT_PROPERTY = 'sc-domain:thedripmap.com';
const URL_INSPECTION_SITE = 'https://www.thedripmap.com/';
const URL_INSPECTION_BATCH = 50; // safely under daily quota
const ROTATION_CURSOR_TABLE = 'seo_health_gsc_cursor';

export type GscReport =
  | {
      kind: 'stub';
      message: string;
      setupSteps: string[];
    }
  | {
      kind: 'ok';
      property: string;
      data: {
        searchAnalytics: SearchAnalyticsSummary;
        sitemaps: SitemapEntry[];
        urlInspection: UrlInspectionSummary;
      };
    };

export interface SearchAnalyticsSummary {
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  wow: { clicks: number; impressions: number };
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

export interface SitemapEntry {
  path: string;
  submitted: number;
  indexed: number;
  warnings: number;
  errors: number;
  isPending: boolean;
}

export interface UrlInspectionSummary {
  sampled: number;
  totalEligible: number;
  nextCursor: number;
  buckets: Record<string, { count: number; examples: string[] }>;
}

export const SETUP_STEPS = [
  'In Google Cloud Console → IAM & Admin → Service Accounts → create a new service account (e.g. "thedripmap-gsc-reader").',
  'Open the service account → Keys tab → Add key → Create new key → JSON. Download the JSON file.',
  'In Google Cloud Console → APIs & Services → Library → enable the "Google Search Console API".',
  'In Search Console → Settings (gear icon) → Users and permissions → Add user → paste the service account email (looks like xxx@xxx.iam.gserviceaccount.com) → set permission to "Full" (or at least "Restricted" with read access).',
  'In Vercel → TheDripMap project → Settings → Environment Variables → add GSC_SERVICE_ACCOUNT_KEY with the FULL JSON contents of the downloaded key (paste the whole JSON object as the value).',
  'Optional: add GSC_PROPERTY=sc-domain:thedripmap.com if you want to override the default property identifier.',
  'Redeploy. Verify by running: curl -H "Authorization: Bearer $CRON_SECRET" "https://www.thedripmap.com/api/cron/seo-health-gsc?test=1"',
];

function stubReport(reason: string): GscReport {
  return {
    kind: 'stub',
    message: reason,
    setupSteps: SETUP_STEPS,
  };
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function parseServiceAccountKey(): { client_email: string; private_key: string } | null {
  const raw = process.env.GSC_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    if (!j.client_email || !j.private_key) return null;
    // Vercel sometimes strips real newlines from env vars; restore them.
    const private_key = String(j.private_key).replace(/\\n/g, '\n');
    return { client_email: j.client_email, private_key };
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  const creds = parseServiceAccountKey();
  if (!creds) return null;
  const jwt = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
  });
  const { access_token } = await jwt.authorize();
  return access_token || null;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateRange(daysBack: number, offset = 0): { startDate: string; endDate: string } {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - offset);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - daysBack + 1);
  return { startDate: iso(start), endDate: iso(end) };
}

async function searchAnalyticsQuery(
  token: string,
  property: string,
  body: Record<string, unknown>
): Promise<{ rows?: Array<{ keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }> }> {
  const res = await fetch(SEARCH_ANALYTICS_URL(property), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`searchAnalytics ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchSearchAnalytics(token: string, property: string): Promise<SearchAnalyticsSummary> {
  // Window 1: last 28 days. Window 2: the 28 days before that for WoW deltas.
  const recent = dateRange(28, 0);
  const previous = dateRange(28, 28);

  const [totalsRecent, totalsPrev, queriesRes, pagesRes] = await Promise.all([
    searchAnalyticsQuery(token, property, { ...recent, dimensions: [] }),
    searchAnalyticsQuery(token, property, { ...previous, dimensions: [] }),
    searchAnalyticsQuery(token, property, { ...recent, dimensions: ['query'], rowLimit: 10 }),
    searchAnalyticsQuery(token, property, { ...recent, dimensions: ['page'], rowLimit: 10 }),
  ]);

  const tR = totalsRecent.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const tP = totalsPrev.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  return {
    totals: {
      clicks: Math.round(tR.clicks),
      impressions: Math.round(tR.impressions),
      ctr: tR.ctr,
      position: tR.position,
    },
    wow: {
      clicks: Math.round(tR.clicks - tP.clicks),
      impressions: Math.round(tR.impressions - tP.impressions),
    },
    topQueries: (queriesRes.rows ?? []).map((r) => ({
      query: r.keys?.[0] ?? '',
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: r.ctr,
      position: r.position,
    })),
    topPages: (pagesRes.rows ?? []).map((r) => ({
      page: r.keys?.[0] ?? '',
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: r.ctr,
      position: r.position,
    })),
  };
}

async function fetchSitemaps(token: string, property: string): Promise<SitemapEntry[]> {
  const res = await fetch(SITEMAPS_URL(property), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`sitemaps ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    sitemap?: Array<{
      path: string;
      isPending?: boolean;
      contents?: Array<{ type: string; submitted: string; indexed: string }>;
      warnings?: string;
      errors?: string;
    }>;
  };
  return (json.sitemap ?? []).map((s) => {
    let submitted = 0;
    let indexed = 0;
    for (const c of s.contents ?? []) {
      submitted += Number(c.submitted) || 0;
      indexed += Number(c.indexed) || 0;
    }
    return {
      path: s.path,
      submitted,
      indexed,
      warnings: Number(s.warnings) || 0,
      errors: Number(s.errors) || 0,
      isPending: !!s.isPending,
    };
  });
}

async function inspectUrl(token: string, inspectionUrl: string, siteUrl: string) {
  const res = await fetch(URL_INSPECT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inspectionUrl, siteUrl }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { error: `${res.status}: ${t.slice(0, 100)}` };
  }
  return res.json();
}

async function loadCursor(): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;
  try {
    const { data } = await supabase
      .from(ROTATION_CURSOR_TABLE)
      .select('cursor')
      .eq('id', 1)
      .maybeSingle();
    return data?.cursor ?? 0;
  } catch {
    return 0;
  }
}

async function saveCursor(cursor: number): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase
      .from(ROTATION_CURSOR_TABLE)
      .upsert({ id: 1, cursor, updated_at: new Date().toISOString() });
  } catch {
    /* swallow */
  }
}

async function fetchUrlInspection(
  token: string,
  sitemapUrls: string[]
): Promise<UrlInspectionSummary> {
  const cursor = await loadCursor();
  const sample = sitemapUrls.length === 0
    ? []
    : Array.from({ length: Math.min(URL_INSPECTION_BATCH, sitemapUrls.length) }, (_, i) =>
        sitemapUrls[(cursor + i) % sitemapUrls.length]
      );

  const buckets: Record<string, { count: number; examples: string[] }> = {
    indexed: { count: 0, examples: [] },
    crawled_not_indexed: { count: 0, examples: [] },
    discovered_not_indexed: { count: 0, examples: [] },
    not_indexed_other: { count: 0, examples: [] },
    canonical_mismatch: { count: 0, examples: [] },
    not_found_404: { count: 0, examples: [] },
    inspection_error: { count: 0, examples: [] },
  };

  // Sequential to be polite to quota; sample is small (~50).
  for (const url of sample) {
    const raw = await inspectUrl(token, url, URL_INSPECTION_SITE);
    if ('error' in raw) {
      buckets.inspection_error.count += 1;
      if (buckets.inspection_error.examples.length < 5) buckets.inspection_error.examples.push(url);
      continue;
    }
    const result = raw?.inspectionResult?.indexStatusResult;
    if (!result) {
      buckets.inspection_error.count += 1;
      if (buckets.inspection_error.examples.length < 5) buckets.inspection_error.examples.push(url);
      continue;
    }
    const verdict: string = result.verdict || 'NEUTRAL';
    const coverageState: string = result.coverageState || '';
    const userCanonical: string = result.userCanonical || '';
    const googleCanonical: string = result.googleCanonical || '';
    const pageFetchState: string = result.pageFetchState || '';

    // Canonical mismatch: Google chose a different canonical than the site declared.
    if (userCanonical && googleCanonical && userCanonical !== googleCanonical) {
      buckets.canonical_mismatch.count += 1;
      if (buckets.canonical_mismatch.examples.length < 5)
        buckets.canonical_mismatch.examples.push(url);
    }

    if (pageFetchState === 'NOT_FOUND' || /404/.test(coverageState)) {
      buckets.not_found_404.count += 1;
      if (buckets.not_found_404.examples.length < 5) buckets.not_found_404.examples.push(url);
      continue;
    }

    if (verdict === 'PASS' && /Submitted and indexed|Indexed/i.test(coverageState)) {
      buckets.indexed.count += 1;
      if (buckets.indexed.examples.length < 5) buckets.indexed.examples.push(url);
      continue;
    }

    if (/Crawled - currently not indexed/i.test(coverageState)) {
      buckets.crawled_not_indexed.count += 1;
      if (buckets.crawled_not_indexed.examples.length < 5)
        buckets.crawled_not_indexed.examples.push(url);
      continue;
    }
    if (/Discovered - currently not indexed/i.test(coverageState)) {
      buckets.discovered_not_indexed.count += 1;
      if (buckets.discovered_not_indexed.examples.length < 5)
        buckets.discovered_not_indexed.examples.push(url);
      continue;
    }
    if (verdict !== 'PASS') {
      buckets.not_indexed_other.count += 1;
      if (buckets.not_indexed_other.examples.length < 5)
        buckets.not_indexed_other.examples.push(url);
    } else {
      buckets.indexed.count += 1;
      if (buckets.indexed.examples.length < 5) buckets.indexed.examples.push(url);
    }
  }

  const nextCursor = sitemapUrls.length === 0 ? 0 : (cursor + sample.length) % sitemapUrls.length;
  await saveCursor(nextCursor);

  return {
    sampled: sample.length,
    totalEligible: sitemapUrls.length,
    nextCursor,
    buckets,
  };
}

/**
 * Produce a full GSC report. If credentials are missing returns a stub.
 * `sitemapUrls` is used as the rotation pool for URL inspection.
 */
export async function buildGscReport(sitemapUrls: string[]): Promise<GscReport> {
  const creds = parseServiceAccountKey();
  if (!creds) {
    return stubReport(
      'GSC_SERVICE_ACCOUNT_KEY is not set. Layer B is stubbed until credentials are configured.'
    );
  }

  const property = process.env.GSC_PROPERTY || DEFAULT_PROPERTY;

  let token: string | null = null;
  try {
    token = await getAccessToken();
  } catch (err) {
    return stubReport(
      `Failed to mint a GSC access token: ${err instanceof Error ? err.message : String(err)}. Verify the service account JSON is valid and pasted correctly.`
    );
  }
  if (!token) return stubReport('Failed to mint a GSC access token (no token returned).');

  try {
    const [searchAnalytics, sitemaps, urlInspection] = await Promise.all([
      fetchSearchAnalytics(token, property),
      fetchSitemaps(token, property),
      fetchUrlInspection(token, sitemapUrls),
    ]);
    return {
      kind: 'ok',
      property,
      data: { searchAnalytics, sitemaps, urlInspection },
    };
  } catch (err) {
    return stubReport(
      `GSC API call failed: ${err instanceof Error ? err.message : String(err)}. Likely causes: the service account email isn't added as a user on the GSC property, or the Search Console API isn't enabled on the GCP project.`
    );
  }
}
