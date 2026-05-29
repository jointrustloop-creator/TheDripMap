import { NextResponse } from 'next/server';
import { getServiceSupabase } from '../../../src/lib/supabase';
import { getCitySearches } from '../../../src/lib/city-search-data';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Scoring weights (must total 100). Every point measures a GENUINE, verifiable
// on-site SEO signal that affects how the clinic ranks and converts on Google —
// nothing here depends on being listed on TheDripMap. The directory listing is
// surfaced separately as an optional opportunity, never as part of the score,
// so the audit is honest and useful even to clinics that never join us.
const WEIGHTS = {
  https: 10,
  mobile: 15,
  speed: 20,
  meta: 15,
  schema: 15,
  headings: 10,
  social: 8,
  indexable: 7,
};

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface AuditCheck {
  key: keyof typeof WEIGHTS;
  label: string;
  status: CheckStatus;
  earned: number;
  max: number;
  detail: string;
  /** false when the check couldn't be measured (e.g. PageSpeed didn't
      respond). Excluded from the score denominator so we neither fake a
      number nor unfairly penalize for something we couldn't test. */
  counted?: boolean;
}

export interface AuditResult {
  url: string;
  finalUrl: string;
  reachable: boolean;
  city: string;
  score: number;
  grade: 'excellent' | 'good' | 'needs-work' | 'poor';
  checks: AuditCheck[];
  topFixes: { title: string; gain: number }[];
  listing: {
    listed: boolean;
    claimed: boolean;
    name: string | null;
    slug: string | null;
    city: string | null;
  };
  cityInsight: {
    name: string;
    searchesPerMonth: number;
    competitors: number;
  };
}

function normalizeUrl(raw: string): string | null {
  let u = (raw || '').trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try {
    return new URL(u).toString();
  } catch {
    return null;
  }
}

function bareHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    let u = raw.trim();
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return new URL(u).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

// Extract a <meta> content value by its name/property, tolerant of attribute
// order (many sites write content="..." before name="...").
function getMetaContent(html: string, names: string[]): string {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const isMatch = names.some((n) =>
      new RegExp(`(?:name|property)\\s*=\\s*["']${n}["']`, 'i').test(tag)
    );
    if (isMatch) {
      const m = tag.match(/content\s*=\s*["']([^"']*)["']/i);
      if (m) return m[1].trim();
    }
  }
  return '';
}

async function fetchSite(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    // Use a real browser UA + headers. Many clinic sites sit behind a WAF
    // (Cloudflare etc.) that blocks unknown bots, so a non-browser UA would
    // get challenged and we'd unfairly score the site as unreachable.
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const html = (await res.text()).slice(0, 600_000); // cap to keep parsing cheap
    return { ok: res.ok, finalUrl: res.url || url, html, status: res.status };
  } catch (err) {
    return {
      ok: false,
      finalUrl: url,
      html: '',
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

// Google PageSpeed Insights (Lighthouse) performance score, 0–1. Returns null
// if the API is slow/unavailable so the audit degrades gracefully.
async function getPageSpeed(url: string): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const key = process.env.PAGESPEED_API_KEY;
    const api =
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}` +
      `&strategy=mobile&category=performance${key ? `&key=${key}` : ''}`;
    const res = await fetch(api, { signal: controller.signal });
    if (!res.ok) return null;
    const json = await res.json();
    const score = json?.lighthouseResult?.categories?.performance?.score;
    return typeof score === 'number' ? score : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface ProviderMatch {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  website: string | null;
  image_url: string | null;
  description: string | null;
  specialties: string[] | null;
  rating: number | string | null;
  reviews: number | string | null;
  is_featured: boolean | null;
}

export async function POST(req: Request) {
  let body: { url?: string; city?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const url = normalizeUrl(body.url || '');
  const city = (body.city || '').trim();
  if (!url) {
    return NextResponse.json({ error: 'Please enter a valid website URL.' }, { status: 400 });
  }

  // Fetch the site and kick off PageSpeed in parallel.
  const site = await fetchSite(url);
  const psiPromise = site.ok ? getPageSpeed(site.finalUrl) : Promise.resolve(null);

  const html = site.html;
  const reachable = site.ok && html.length > 0;

  // --- Check 1: HTTPS ---
  const isHttps = /^https:/i.test(site.finalUrl);
  const httpsCheck: AuditCheck = {
    key: 'https',
    label: 'HTTPS secure',
    max: WEIGHTS.https,
    earned: isHttps ? WEIGHTS.https : 0,
    status: isHttps ? 'pass' : 'fail',
    detail: isHttps
      ? 'Your site loads over a secure HTTPS connection.'
      : 'Your site is not served over HTTPS - Google flags this as "Not Secure".',
  };

  // --- Check 2: Mobile-friendly (heuristic) ---
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*>/i);
  const hasDeviceWidth = viewportMatch ? /width\s*=\s*device-width/i.test(viewportMatch[0]) : false;
  let mobileEarned = 0;
  let mobileStatus: CheckStatus = 'fail';
  let mobileDetail = 'No mobile viewport tag found - your site likely renders poorly on phones.';
  if (hasDeviceWidth) {
    mobileEarned = WEIGHTS.mobile;
    mobileStatus = 'pass';
    mobileDetail = 'Responsive viewport detected - your site adapts to mobile screens.';
  } else if (viewportMatch) {
    mobileEarned = Math.round(WEIGHTS.mobile * 0.6);
    mobileStatus = 'warn';
    mobileDetail = 'A viewport tag exists but is missing width=device-width - mobile rendering may be off.';
  }
  const UNREACHABLE = 'We couldn\'t load your site (it may be blocking automated checks). This didn\'t count toward your score.';
  const mobileCheck: AuditCheck = {
    key: 'mobile',
    label: 'Mobile-friendly',
    max: WEIGHTS.mobile,
    earned: reachable ? mobileEarned : 0,
    status: reachable ? mobileStatus : 'warn',
    detail: reachable ? mobileDetail : UNREACHABLE,
  };

  // --- Check 3: Schema markup ---
  const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  const hasMicrodata = /itemscope|itemtype=/i.test(html);
  let schemaEarned = 0;
  let schemaStatus: CheckStatus = 'fail';
  let schemaDetail = 'No structured data found - search engines can\'t read your business details.';
  if (hasJsonLd) {
    schemaEarned = WEIGHTS.schema;
    schemaStatus = 'pass';
    schemaDetail = 'JSON-LD structured data found - helps Google show rich results.';
  } else if (hasMicrodata) {
    schemaEarned = Math.round(WEIGHTS.schema * 0.6);
    schemaStatus = 'warn';
    schemaDetail = 'Basic microdata found, but no JSON-LD - the modern, preferred format.';
  }
  const schemaCheck: AuditCheck = {
    key: 'schema',
    label: 'Schema markup',
    max: WEIGHTS.schema,
    earned: reachable ? schemaEarned : 0,
    status: reachable ? schemaStatus : 'warn',
    detail: reachable ? schemaDetail : UNREACHABLE,
  };

  // --- Check 4: Page speed ---
  // Only ever report a REAL Google PageSpeed (Lighthouse) score. If PSI doesn't
  // respond, we don't fabricate an estimate — the check is marked "not measured"
  // (counted: false) and excluded from the score so we neither fake a number nor
  // unfairly penalize the clinic.
  const psi = await psiPromise;
  const speedMeasured = psi != null;
  const speed100 = speedMeasured ? Math.round(psi * 100) : 0;
  const speedCheck: AuditCheck = {
    key: 'speed',
    label: 'Page speed (mobile)',
    max: WEIGHTS.speed,
    earned: speedMeasured ? Math.round(psi * WEIGHTS.speed) : 0,
    counted: speedMeasured,
    status: !speedMeasured ? 'warn' : psi >= 0.75 ? 'pass' : psi >= 0.5 ? 'warn' : 'fail',
    detail: speedMeasured
      ? `Google PageSpeed score: ${speed100}/100 on mobile.`
      : "We couldn't get a live Google PageSpeed score right now, so this wasn't counted in your score.",
  };

  // --- Check 5: Title + meta description ---
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
  const desc = getMetaContent(html, ['description', 'og:description']);
  let metaEarned = 0;
  const metaParts: string[] = [];
  if (title.length >= 10 && title.length <= 70) {
    metaEarned += 5;
    metaParts.push('title looks good');
  } else if (title.length > 0) {
    metaEarned += 2;
    metaParts.push(title.length < 10 ? 'title too short' : 'title too long');
  } else {
    metaParts.push('no title tag');
  }
  if (desc.length >= 50 && desc.length <= 160) {
    metaEarned += 5;
    metaParts.push('meta description looks good');
  } else if (desc.length > 0) {
    metaEarned += 2;
    metaParts.push(desc.length < 50 ? 'meta description too short' : 'meta description too long');
  } else {
    metaParts.push('no meta description');
  }
  const metaCheck: AuditCheck = {
    key: 'meta',
    label: 'Title & meta description',
    max: WEIGHTS.meta,
    earned: reachable ? metaEarned : 0,
    status: !reachable ? 'warn' : metaEarned >= 9 ? 'pass' : metaEarned >= 4 ? 'warn' : 'fail',
    detail: reachable ? metaParts.join(' | ') : UNREACHABLE,
  };

  // --- Check: H1 heading ---
  const h1Matches = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Count = h1Matches.length;
  let headingsEarned = 0;
  let headingsStatus: CheckStatus = 'fail';
  let headingsDetail = 'No H1 heading found — search engines use your main heading to understand the page.';
  if (h1Count === 1) {
    headingsEarned = WEIGHTS.headings;
    headingsStatus = 'pass';
    headingsDetail = 'A single, clear H1 heading was found — good for SEO clarity.';
  } else if (h1Count > 1) {
    headingsEarned = Math.round(WEIGHTS.headings * 0.6);
    headingsStatus = 'warn';
    headingsDetail = `Found ${h1Count} H1 headings — ideally use exactly one main H1 per page.`;
  }
  const headingsCheck: AuditCheck = {
    key: 'headings',
    label: 'Page heading (H1)',
    max: WEIGHTS.headings,
    earned: reachable ? headingsEarned : 0,
    status: reachable ? headingsStatus : 'warn',
    detail: reachable ? headingsDetail : UNREACHABLE,
  };

  // --- Check: Social / Open Graph tags ---
  const ogTitle = getMetaContent(html, ['og:title']);
  const ogImage = getMetaContent(html, ['og:image']);
  let socialEarned = 0;
  let socialStatus: CheckStatus = 'fail';
  let socialDetail = 'No Open Graph tags — links to your site show no preview image or title when shared.';
  if (ogTitle && ogImage) {
    socialEarned = WEIGHTS.social;
    socialStatus = 'pass';
    socialDetail = 'Open Graph title and image found — your links preview nicely when shared.';
  } else if (ogTitle || ogImage) {
    socialEarned = Math.round(WEIGHTS.social * 0.5);
    socialStatus = 'warn';
    socialDetail = 'Partial Open Graph tags — add both og:title and og:image for clean social previews.';
  }
  const socialCheck: AuditCheck = {
    key: 'social',
    label: 'Social preview tags',
    max: WEIGHTS.social,
    earned: reachable ? socialEarned : 0,
    status: reachable ? socialStatus : 'warn',
    detail: reachable ? socialDetail : UNREACHABLE,
  };

  // --- Check: Indexability (no noindex) + canonical ---
  const robotsMeta = getMetaContent(html, ['robots']).toLowerCase();
  const isNoindex = /noindex/.test(robotsMeta);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  let indexEarned = 0;
  let indexStatus: CheckStatus = 'fail';
  let indexDetail = '';
  if (isNoindex) {
    indexEarned = 0;
    indexStatus = 'fail';
    indexDetail = 'Your homepage has a "noindex" tag — Google is being told not to list it at all. This is critical.';
  } else if (hasCanonical) {
    indexEarned = WEIGHTS.indexable;
    indexStatus = 'pass';
    indexDetail = 'Page is indexable and sets a canonical URL — clean signals for Google.';
  } else {
    indexEarned = Math.round(WEIGHTS.indexable * 0.6);
    indexStatus = 'warn';
    indexDetail = 'Page is indexable, but no canonical tag was found — add one to avoid duplicate-content issues.';
  }
  const indexCheck: AuditCheck = {
    key: 'indexable',
    label: 'Indexable by Google',
    max: WEIGHTS.indexable,
    earned: reachable ? indexEarned : 0,
    status: reachable ? indexStatus : 'warn',
    detail: reachable ? indexDetail : UNREACHABLE,
  };

  // --- Listing lookup (powers checks 6 & 7 + city insight) ---
  const host = bareHost(site.finalUrl) || bareHost(url);
  let provider: ProviderMatch | null = null;
  try {
    const sb = getServiceSupabase();
    if (host) {
      const { data } = await sb
        .from('providers')
        .select(
          'id, name, slug, city, website, image_url, description, specialties, rating, reviews, is_featured'
        )
        .ilike('website', `%${host}%`)
        .limit(10);
      provider =
        ((data as ProviderMatch[]) || []).find((p) => bareHost(p.website) === host) || null;
    }
  } catch (err) {
    console.error('SEO audit provider lookup failed:', err);
  }

  const listed = !!provider;
  const claimed = !!provider?.is_featured;

  // The TheDripMap listing is intentionally NOT a scored check — it's surfaced
  // separately (result.listing) as an optional opportunity, so the score reflects
  // only the clinic's genuine on-site SEO health.
  const checks: AuditCheck[] = [
    httpsCheck,
    mobileCheck,
    speedCheck,
    metaCheck,
    schemaCheck,
    headingsCheck,
    socialCheck,
    indexCheck,
  ];

  // Score over the checks we could actually measure. Normally every check is
  // counted and the denominator is 100; when a check is "not measured" (e.g.
  // PageSpeed didn't respond) it's dropped from both sides and the score is
  // rescaled, so an unmeasurable check never silently costs points.
  const counted = checks.filter((c) => c.counted !== false);
  const earnedSum = counted.reduce((s, c) => s + c.earned, 0);
  const maxSum = counted.reduce((s, c) => s + c.max, 0) || 100;
  const score = Math.max(0, Math.min(100, Math.round((earnedSum / maxSum) * 100)));
  const grade: AuditResult['grade'] =
    score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs-work' : 'poor';

  // Top fixes: biggest point gaps, framed as concrete, genuine SEO actions.
  const FIX_COPY: Record<keyof typeof WEIGHTS, string> = {
    speed: 'Improve mobile page speed — compress images and reduce render-blocking scripts',
    schema: 'Add LocalBusiness JSON-LD schema so Google can show rich results (hours, rating, address)',
    meta: 'Write a strong homepage title (≤60 chars) and meta description (~150 chars)',
    mobile: 'Add a responsive viewport meta tag so your site works on phones',
    https: 'Install an SSL certificate so your site loads securely over HTTPS',
    headings: 'Add one clear H1 heading that names your clinic and city',
    social: 'Add Open Graph tags (og:title, og:image) so shared links show a preview',
    indexable: 'Make sure the homepage is indexable (no noindex) and sets a canonical URL',
  };
  const topFixes = checks
    .filter((c) => c.counted !== false)
    .map((c) => ({ key: c.key, gain: c.max - c.earned }))
    .filter((f) => f.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 3)
    .map((f) => ({ title: FIX_COPY[f.key], gain: f.gain }));

  // City insight — real demand + competitor count from our DB.
  const cityName = city || provider?.city || '';
  let competitors = 0;
  if (cityName) {
    try {
      const sb = getServiceSupabase();
      const { count } = await sb
        .from('providers')
        .select('id', { count: 'exact', head: true })
        .ilike('city', cityName);
      competitors = count || 0;
    } catch {
      competitors = 0;
    }
  }

  const result: AuditResult = {
    url,
    finalUrl: site.finalUrl,
    reachable,
    city: cityName,
    score,
    grade,
    checks,
    topFixes,
    listing: {
      listed,
      claimed,
      name: provider?.name || null,
      slug: provider?.slug || null,
      city: provider?.city || null,
    },
    cityInsight: {
      name: cityName,
      searchesPerMonth: getCitySearches(cityName),
      competitors,
    },
  };

  return NextResponse.json(result);
}
