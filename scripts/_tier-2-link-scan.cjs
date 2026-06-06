/**
 * Tier 2: concurrent link-health scan across ALL providers.
 *
 * Runs HEAD (with GET fallback for HEAD-rejecters) at concurrency 10.
 * Flags any provider whose website is dead, returns a non-2xx, or
 * redirects to a different root domain (the most likely "wrong link"
 * symptom).
 *
 * Output: scripts/_receipts/tier-2-link-scan-<ts>.json with the full
 * per-provider verdict, plus a one-line summary to stdout.
 *
 * Rules: never delete, never modify. Report only.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const CONCURRENCY = 10;
const TIMEOUT_MS = 10000;
const USER_AGENT =
  'TheDripMap-LinkHealth/1.0 (+https://www.thedripmap.com/about; checking listing URL health)';

function rootDomain(u) {
  try {
    const url = new URL(u);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, opts = {}, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function probe(url, expectedDomain) {
  let method = 'HEAD';
  let status = 0;
  let finalUrl = url;
  let redirected = false;
  let error = null;
  try {
    let res = await fetchWithTimeout(url, {
      method,
      redirect: 'follow',
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,*/*' },
    });
    if (res.status === 405 || res.status === 501 || res.status === 403) {
      method = 'GET';
      res = await fetchWithTimeout(url, {
        method,
        redirect: 'follow',
        headers: { 'user-agent': USER_AGENT, accept: 'text/html,*/*' },
      });
    }
    status = res.status;
    finalUrl = res.url || url;
    redirected = res.redirected || rootDomain(url) !== rootDomain(finalUrl);
  } catch (e) {
    error = e.name === 'AbortError' ? 'timeout' : (e.message || 'fetch_error').slice(0, 80);
  }

  const finalDomain = rootDomain(finalUrl);
  const expDomain = rootDomain(expectedDomain || url);
  const domainMismatch = !!(finalDomain && expDomain && finalDomain !== expDomain);

  // Verdict
  let verdict = 'ok';
  let reason = null;
  if (error) {
    verdict = 'dead';
    reason = error;
  } else if (!status || status >= 500) {
    verdict = 'dead';
    reason = 'http_' + status;
  } else if (status === 404 || status === 410) {
    verdict = 'dead';
    reason = 'http_' + status;
  } else if (status >= 400) {
    verdict = 'suspicious';
    reason = 'http_' + status;
  } else if (domainMismatch) {
    verdict = 'redirect_off_domain';
    reason = 'expected=' + expDomain + ' final=' + finalDomain;
  }

  return { verdict, status, reason, method, finalUrl, redirected, domainMismatch };
}

async function fetchAllProviders() {
  const out = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await sb
      .from('providers')
      .select('id, slug, name, city, country, website, is_claimed')
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    out.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

async function processBatch(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run(idx) {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i]);
      if (i % 100 === 0) process.stderr.write('.');
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => run(0)));
  return results;
}

(async () => {
  const t0 = Date.now();
  const all = await fetchAllProviders();
  const withSite = all.filter((p) => p.website && /^https?:\/\//i.test(p.website));
  console.log('Total providers:', all.length, '| with website:', withSite.length);

  const results = await processBatch(withSite, async (p) => {
    const r = await probe(p.website, p.website);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      city: p.city,
      country: p.country,
      website: p.website,
      is_claimed: p.is_claimed,
      ...r,
    };
  });
  process.stderr.write('\n');

  const ok = results.filter((r) => r.verdict === 'ok').length;
  const suspicious = results.filter((r) => r.verdict === 'suspicious');
  const dead = results.filter((r) => r.verdict === 'dead');
  const offDomain = results.filter((r) => r.verdict === 'redirect_off_domain');
  const noWebsite = all.length - withSite.length;

  console.log();
  console.log('=== Summary ===');
  console.log('OK:', ok);
  console.log('Suspicious (4xx other than 404/410):', suspicious.length);
  console.log('Dead (timeout, network error, 404/410, 5xx):', dead.length);
  console.log('Redirect off-domain:', offDomain.length);
  console.log('No website on file:', noWebsite);
  console.log('Took:', ((Date.now() - t0) / 1000).toFixed(1) + 's');

  const receiptDir = path.join('scripts', '_receipts');
  fs.mkdirSync(receiptDir, { recursive: true });
  const outPath = path.join(receiptDir, 'tier-2-link-scan-' + Date.now() + '.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        run_at: new Date().toISOString(),
        totals: { all: all.length, withSite: withSite.length, ok, suspicious: suspicious.length, dead: dead.length, offDomain: offDomain.length, noWebsite },
        flagged: [...dead, ...offDomain, ...suspicious].map((r) => ({
          slug: r.slug,
          name: r.name,
          city: r.city,
          country: r.country,
          is_claimed: r.is_claimed,
          website: r.website,
          verdict: r.verdict,
          status: r.status,
          reason: r.reason,
          finalUrl: r.finalUrl,
        })),
      },
      null,
      2,
    ),
  );
  console.log('Receipt:', outPath);
})();
