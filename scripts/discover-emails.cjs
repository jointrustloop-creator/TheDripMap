// Bulk email discovery: visits clinic websites and extracts contact emails.
// Updates providers.email directly in Supabase on hit. Skips placeholders.

require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const candidates = JSON.parse(fs.readFileSync('C:/Users/Dell/Desktop/TheDripMap/scripts/email-discovery-batch.json', 'utf8'));

const TIMEOUT_MS = 8000;
const CONCURRENCY = 10;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PLACEHOLDER_PATTERNS = [
  /example\.com$/i, /your.*@/i, /name@(domain|email|company)/i, /placeholder/i,
  /sentry\.io$/i, /wixpress\.com$/i, /godaddy\.com$/i, /squarespace\.com$/i,
  /\.png$/i, /\.jpg$/i, /\.svg$/i, /\.webp$/i, /\.css$/i, /\.js$/i,
  /^u003[ce]/i, /^[0-9]+@/, /^test@/i, /^noreply@/i, /^no-reply@/i, /^donotreply@/i,
  /^abuse@/i, /^postmaster@/i, /^webmaster@/i, /^dns-admin@/i, /^hostmaster@/i,
  /^press@/i, /^privacy@/i, /^legal@/i,
];

const PRIORITY = ['info', 'contact', 'hello', 'admin', 'office', 'team', 'support', 'reception', 'frontdesk', 'appointments', 'bookings', 'help'];

function score(email) {
  const local = email.split('@')[0].toLowerCase();
  const i = PRIORITY.indexOf(local);
  return i >= 0 ? i : 999;
}

function isPlaceholder(email) {
  return PLACEHOLDER_PATTERNS.some((re) => re.test(email));
}

function extractEmails(html, domainHint) {
  const found = new Set();
  // Plain regex
  const matches = html.match(EMAIL_RE) || [];
  for (const m of matches) {
    const e = m.toLowerCase().trim();
    if (e.length > 60) continue;
    if (isPlaceholder(e)) continue;
    found.add(e);
  }
  // Also catch HTML-encoded mailto links
  const mailtoRe = /mailto:([^"'<>\s]+)/gi;
  let mm;
  while ((mm = mailtoRe.exec(html)) !== null) {
    const e = decodeURIComponent(mm[1]).toLowerCase().split('?')[0].trim();
    if (e.includes('@') && !isPlaceholder(e)) found.add(e);
  }
  const arr = [...found];
  if (arr.length === 0) return null;
  // Prefer emails on the clinic's own domain
  if (domainHint) {
    const ownDomain = arr.filter((e) => e.endsWith('@' + domainHint));
    if (ownDomain.length) return ownDomain.sort((a, b) => score(a) - score(b))[0];
  }
  return arr.sort((a, b) => score(a) - score(b))[0];
}

async function fetchWithTimeout(url, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html') && !ct.includes('text')) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function getDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function discoverForClinic(c) {
  const domain = getDomain(c.website);
  // 1. homepage
  let html = await fetchWithTimeout(c.website);
  if (!html) return { slug: c.slug, email: null, source: 'site_dead' };
  let found = extractEmails(html, domain);
  if (found) return { slug: c.slug, email: found, source: 'homepage' };
  // 2. /contact
  const tryPaths = ['/contact', '/contact-us', '/contact.html', '/about', '/about-us'];
  const base = c.website.replace(/\/$/, '');
  for (const p of tryPaths) {
    html = await fetchWithTimeout(base + p);
    if (html) {
      found = extractEmails(html, domain);
      if (found) return { slug: c.slug, email: found, source: 'contact_page' };
    }
  }
  return { slug: c.slug, email: null, source: 'no_email_found' };
}

async function runPool(items, concurrency, worker) {
  const results = [];
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      const r = await worker(items[i], i);
      results[i] = r;
      if ((i + 1) % 10 === 0) console.log(`  …${i + 1}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, next));
  return results;
}

(async () => {
  console.log(`Discovering emails for ${candidates.length} clinics (concurrency ${CONCURRENCY})...`);
  const t0 = Date.now();
  const results = await runPool(candidates, CONCURRENCY, discoverForClinic);
  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

  const found = results.filter((r) => r.email);
  const notFound = results.filter((r) => !r.email);
  console.log(`Emails found: ${found.length} / ${candidates.length} (${((found.length / candidates.length) * 100).toFixed(0)}%)`);
  console.log(`Sources:`);
  const bySource = {};
  results.forEach((r) => { bySource[r.source] = (bySource[r.source] || 0) + 1; });
  for (const [k, v] of Object.entries(bySource)) console.log(`  ${k}: ${v}`);

  // Bulk update Supabase
  console.log(`\nUpdating Supabase...`);
  let updated = 0;
  for (const r of found) {
    const { error } = await supabase.from('providers')
      .update({ email: r.email })
      .eq('slug', r.slug);
    if (error) console.error(`  ✗ ${r.slug}: ${error.message}`);
    else updated++;
  }
  console.log(`✓ Updated ${updated} provider rows with discovered emails`);

  // Save full report
  fs.writeFileSync(
    'C:/Users/Dell/Desktop/TheDripMap/scripts/email-discovery-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log('Report saved to scripts/email-discovery-results.json');
})().catch((e) => { console.error('FATAL:', e); process.exit(1); });
