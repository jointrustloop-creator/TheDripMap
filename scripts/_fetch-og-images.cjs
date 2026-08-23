/**
 * og:image ingestion for active Canadian providers without a real image.
 *
 * Fetches each clinic's homepage, extracts og:image / twitter:image, validates
 * the candidate (absolute https, 200, image/*, 10KB-5MB) and records it in
 * .audit-tmp/_og-images.json. Capture-only by default; --load writes validated
 * URLs into providers.image_url (only where still null/stock) and stamps
 * decision_drivers.image_source by MERGING into existing decision_drivers.
 *
 *   node scripts/_fetch-og-images.cjs               # capture all pending
 *   node scripts/_fetch-og-images.cjs --limit 30    # capture first 30 (pilot)
 *   node scripts/_fetch-og-images.cjs --load        # apply validated URLs (operator only)
 *
 * HOUSE PATTERN (hard-learned, Windows + Node v24): SEQUENTIAL fetches only,
 * AbortController 15s timeout, 600ms polite delay, partial JSON written after
 * EVERY clinic so a silent death is resumable (already-done slugs are skipped).
 */
const fs = require('fs');
const path = require('path');

// .env.local lives at the repo root; in a git worktree it may only exist in the
// main checkout, so walk upward from the script location until found.
(() => {
  let dir = path.join(__dirname, '..');
  for (let i = 0; i < 6; i++) {
    const p = path.join(dir, '.env.local');
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p, override: true });
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
})();

const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const LOAD = process.argv.includes('--load');
const limitIdx = process.argv.indexOf('--limit');
const LIMIT = limitIdx > -1 ? parseInt(process.argv[limitIdx + 1], 10) : Infinity;

const OUT_DIR = path.join(__dirname, '..', '.audit-tmp');
const OUT = path.join(OUT_DIR, '_og-images.json');
const UA = 'Mozilla/5.0 (compatible; TheDripMapBot/1.0; +https://www.thedripmap.com)';
const DELAY_MS = 600;
const TIMEOUT_MS = 15000;
const MIN_BYTES = 10 * 1024;
const MAX_BYTES = 5 * 1024 * 1024;

// Canada detection tolerant of country/state variants (same pattern as _ca-drafts.cjs).
const CAabbr = new Set(['on', 'bc', 'ab', 'qc', 'mb', 'sk', 'ns', 'nb', 'nl', 'pe', 'nt', 'yt', 'nu']);
const CAname = new Set(['ontario', 'british columbia', 'alberta', 'quebec', 'manitoba', 'saskatchewan', 'nova scotia', 'new brunswick', 'newfoundland and labrador', 'newfoundland', 'prince edward island', 'northwest territories', 'yukon', 'nunavut']);
const isCA = (r) => {
  const c = (r.country || '').trim().toLowerCase();
  if (/^(ca|can|canada)$/.test(c)) return true;
  if (/^(us|usa|united states.*)$/.test(c)) return false;
  const st = (r.state || '').trim().toLowerCase();
  return CAabbr.has(st) || CAname.has(st);
};

// "No real image" = null OR a stock/placeholder/monogram URL. The shared
// Unsplash/picsum fillers on unclaimed rows count as stock (matches the
// isStock treatment in the card components).
const isStockUrl = (u) => !u || /placeholder|monogram|stock|unsplash\.com|picsum/i.test(u);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function timedFetch(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: '*/*', ...(opts.headers || {}) },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

function normalizeSite(website) {
  let w = (website || '').trim();
  if (!w) return null;
  if (!/^https?:\/\//i.test(w)) w = `https://${w}`;
  try {
    return new URL(w).href;
  } catch {
    return null;
  }
}

// Extract og:image / og:image:secure_url / twitter:image from raw HTML.
// Handles both attribute orders and single/double quotes.
function extractOgImage(html) {
  const metas = [];
  const tagRe = /<meta\b[^>]*>/gi;
  let m;
  while ((m = tagRe.exec(html))) metas.push(m[0]);
  const attr = (tag, name) => {
    const re = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i');
    const a = tag.match(re);
    return a ? a[1] : null;
  };
  const byKey = {};
  for (const tag of metas) {
    const key = (attr(tag, 'property') || attr(tag, 'name') || '').toLowerCase();
    const content = attr(tag, 'content');
    if (key && content && byKey[key] === undefined) byKey[key] = content.trim();
  }
  return (
    byKey['og:image:secure_url'] ||
    byKey['og:image'] ||
    byKey['twitter:image'] ||
    byKey['twitter:image:src'] ||
    null
  );
}

async function validateImage(url) {
  const res = await timedFetch(url, { headers: { accept: 'image/*,*/*;q=0.8' } });
  if (res.status !== 200) return { ok: false, reason: `status ${res.status}` };
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (!contentType.startsWith('image/')) return { ok: false, reason: `content-type ${contentType || 'missing'}` };
  let bytes = parseInt(res.headers.get('content-length') || '', 10);
  if (!Number.isFinite(bytes)) {
    const buf = await res.arrayBuffer();
    bytes = buf.byteLength;
  } else {
    try { res.body?.cancel?.(); } catch { /* best effort */ }
  }
  if (bytes < MIN_BYTES) return { ok: false, reason: `too small (${bytes} bytes)` };
  if (bytes > MAX_BYTES) return { ok: false, reason: `too large (${bytes} bytes)` };
  return { ok: true, contentType, bytes };
}

function loadOutput() {
  try {
    return JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch {
    return { started_at: new Date().toISOString(), results: {} };
  }
}

function saveOutput(data) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  data.updated_at = new Date().toISOString();
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
}

async function fetchCandidates() {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await s
      .from('providers')
      .select('id, slug, name, city, state, country, website, image_url')
      .eq('is_hidden', false)
      .not('website', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`providers select failed: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows.filter((r) => isCA(r) && (r.website || '').trim() !== '' && isStockUrl(r.image_url));
}

async function capture() {
  const out = loadOutput();
  const candidates = await fetchCandidates();
  console.log(`${candidates.length} active Canadian providers with a website and no real image.`);

  let processed = 0;
  for (const p of candidates) {
    if (processed >= LIMIT) break;
    if (out.results[p.slug]) continue; // resumable: already attempted
    processed++;

    const rec = {
      provider_id: p.id,
      slug: p.slug,
      website: p.website,
      og_image_url: null,
      content_type: null,
      bytes: null,
      status: null,
      fetched_at: new Date().toISOString(),
    };

    const site = normalizeSite(p.website);
    if (!site) {
      rec.status = 'bad_website_url';
    } else {
      try {
        const res = await timedFetch(site, { headers: { accept: 'text/html,*/*;q=0.8' } });
        if (res.status !== 200) {
          rec.status = `homepage_status_${res.status}`;
        } else {
          const html = await res.text();
          let candidate = extractOgImage(html);
          if (!candidate) {
            rec.status = 'no_og_image';
          } else {
            // Resolve relative URLs against the final page URL; require https.
            let abs = null;
            try {
              abs = new URL(candidate, res.url || site).href;
            } catch { /* unparsable */ }
            if (abs && abs.startsWith('http://')) abs = `https://${abs.slice('http://'.length)}`;
            if (!abs || !abs.startsWith('https://')) {
              rec.status = 'not_absolute_https';
            } else {
              try {
                const v = await validateImage(abs);
                if (v.ok) {
                  rec.og_image_url = abs;
                  rec.content_type = v.contentType;
                  rec.bytes = v.bytes;
                  rec.status = 'ok';
                } else {
                  rec.og_image_url = abs;
                  rec.status = `invalid_image: ${v.reason}`;
                }
              } catch (e) {
                rec.og_image_url = abs;
                rec.status = `image_fetch_error: ${e.name === 'AbortError' ? 'timeout' : e.message}`;
              }
            }
          }
        }
      } catch (e) {
        rec.status = `homepage_fetch_error: ${e.name === 'AbortError' ? 'timeout' : (e.cause && e.cause.code) || e.message}`;
      }
    }

    out.results[p.slug] = rec;
    saveOutput(out); // partial write after EVERY clinic (resumable)
    console.log(`[${processed}] ${p.slug}: ${rec.status}${rec.status === 'ok' ? ` (${rec.bytes} bytes)` : ''}`);
    await sleep(DELAY_MS);
  }

  const all = Object.values(out.results);
  const ok = all.filter((r) => r.status === 'ok').length;
  console.log(`\nDone. ${processed} processed this run; total attempted ${all.length}, validated og:image ${ok}.`);
}

async function load() {
  const out = loadOutput();
  const rows = Object.values(out.results).filter((r) => r.status === 'ok' && r.og_image_url);
  console.log(`--load: ${rows.length} validated og:image rows to consider.`);
  let applied = 0, skipped = 0, failed = 0;
  for (const r of rows) {
    // Re-check the live row: only overwrite a still-null/stock image_url.
    const { data: live, error: selErr } = await s
      .from('providers')
      .select('id, image_url, decision_drivers')
      .eq('id', r.provider_id)
      .single();
    if (selErr) {
      console.log(`  SKIP ${r.slug}: select failed (${selErr.message})`);
      failed++;
      continue;
    }
    if (!isStockUrl(live.image_url)) {
      skipped++;
      continue; // a real image landed since capture; never clobber it
    }
    // MERGE image_source into existing decision_drivers (never clobber other keys).
    const drivers = (live.decision_drivers && typeof live.decision_drivers === 'object' && !Array.isArray(live.decision_drivers))
      ? { ...live.decision_drivers }
      : {};
    drivers.image_source = { type: 'og_image', url: r.website, fetched_at: r.fetched_at };
    const { error: updErr } = await s
      .from('providers')
      .update({ image_url: r.og_image_url, decision_drivers: drivers })
      .eq('id', r.provider_id);
    if (updErr) {
      console.log(`  FAIL ${r.slug}: update failed (${updErr.message})`);
      failed++;
      continue;
    }
    applied++;
    console.log(`  APPLIED ${r.slug}`);
  }
  console.log(`\n--load done: ${applied} applied, ${skipped} skipped (already has real image), ${failed} failed.`);
}

(LOAD ? load() : capture()).catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
