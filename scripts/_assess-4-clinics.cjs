/**
 * Free 4-clinic listing assessment.
 *
 * Reads the resolved DB rows from .tmp-4clinic.json, fetches each clinic's
 * homepage + a few common subpages (/contact, /about, /services, /book,
 * /iv-therapy, /iv-vitamin-therapy), parses for:
 *
 *   - title tag, meta description, JSON-LD schema presence
 *   - mailto + tel links, structured contact info
 *   - any mention of NAP fields and IV services
 *
 * Then compares to the DB record (name, address, phone, services, hours)
 * and writes scripts/_assessment-4-clinics.md.
 *
 * Per the 2026-06-09 operator spec:
 *   - Public sources only (no Places API).
 *   - Mark anything we cannot confirm as "needs a manual Google check".
 *   - No medical or health claims.
 *   - Do not contact clinics; saved as a draft file only.
 *   - No em-dashes; commas or periods only.
 */
const fs = require('fs');
const https = require('https');

const records = JSON.parse(fs.readFileSync('./.tmp-4clinic.json', 'utf8'));

function get(url, depth = 0) {
  return new Promise((resolve) => {
    let parsed;
    try { parsed = new URL(url); } catch { return resolve({ ok: false, err: 'bad-url' }); }
    const req = https.request(url, {
      method: 'GET',
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TheDripMap-Audit/1.0; +https://www.thedripmap.com)',
        Accept: 'text/html,*/*',
      },
    }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 308) && res.headers.location && depth < 3) {
        res.resume();
        let next = res.headers.location;
        if (next.startsWith('/')) next = parsed.origin + next;
        return resolve(get(next, depth + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return resolve({ ok: false, err: 'http-' + res.statusCode });
      }
      const chunks = [];
      let size = 0;
      res.on('data', (c) => {
        size += c.length;
        if (size > 1500 * 1024) { req.destroy(); return; }
        chunks.push(c);
      });
      res.on('end', () => resolve({ ok: true, body: Buffer.concat(chunks).toString('utf8'), finalUrl: parsed.href }));
    });
    req.on('error', (e) => resolve({ ok: false, err: e.code || e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, err: 'timeout' }); });
    req.end();
  });
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}
function extractMetaDescription(html) {
  const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  return m ? m[1].trim() : null;
}
function hasJsonLd(html) {
  return /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
}
function extractJsonLdTypes(html) {
  const out = [];
  const rx = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = rx.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const collect = (n) => {
        if (Array.isArray(n)) { n.forEach(collect); return; }
        if (n && typeof n === 'object') {
          if (n['@type']) out.push(String(n['@type']));
          if (n['@graph']) collect(n['@graph']);
        }
      };
      collect(parsed);
    } catch (_) { /* ignore parse errors */ }
  }
  return Array.from(new Set(out));
}
function extractTelMailto(html) {
  const tels = [...html.matchAll(/<a[^>]+href=["']tel:([^"']+)["']/gi)].map(m => m[1]);
  const mails = [...html.matchAll(/<a[^>]+href=["']mailto:([^"']+)["']/gi)].map(m => m[1]);
  return { tels: Array.from(new Set(tels)), mails: Array.from(new Set(mails)) };
}
function digitsOnly(s) { return (s || '').replace(/\D/g, ''); }
function lower(s) { return (s || '').toLowerCase(); }
function tagsStripped(html) { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); }
function mentionsIv(text) {
  return /\b(iv (therapy|vitamin|drip|infusion|nutrient|nutrition)|intravenous|nad\+?|myers cocktail|glutathione|hydration drip|iron infusion)\b/i.test(text);
}
function hasBookingPath(html) {
  return /\b(book online|book now|schedule|appointment|reserve)\b/i.test(html);
}

function describeHours(working_hours) {
  if (!working_hours || typeof working_hours !== 'object') return 'absent';
  const keys = Object.keys(working_hours);
  if (keys.length === 0) return 'absent';
  return keys.length + ' day entries (' + keys.slice(0, 7).join(', ') + ')';
}

async function fetchAndAssessSite(provider) {
  if (!provider.website) return { error: 'no-website' };
  let origin;
  try { origin = new URL(provider.website).origin; } catch { return { error: 'bad-website' }; }
  const paths = ['', '/contact', '/contact-us', '/about', '/services', '/book', '/booking', '/iv-therapy', '/iv-vitamin-therapy', '/iv', '/iv-drips'];
  const pagesTried = [];
  let homepage = null;
  let ivPage = null;
  const allHtml = [];

  for (const path of paths) {
    const url = origin + path;
    const r = await get(url);
    pagesTried.push({ path: path || '/', ok: r.ok, err: r.err });
    if (!r.ok) continue;
    if (path === '') homepage = { html: r.body, url: r.finalUrl };
    if (!ivPage && /\b(iv|intravenous)\b/i.test(path) && /\b(iv|intravenous)\b/i.test(r.body)) {
      ivPage = { html: r.body, url: r.finalUrl, path };
    }
    allHtml.push({ path: path || '/', html: r.body });
  }

  if (!homepage) return { error: 'homepage-unreachable', pagesTried };

  // Title + meta + schema (homepage). If we found a dedicated IV page,
  // include its title + meta separately.
  const homeTitle = extractTitle(homepage.html);
  const homeMeta = extractMetaDescription(homepage.html);
  const homeSchema = extractJsonLdTypes(homepage.html);

  let ivTitle = null, ivMeta = null, ivSchema = [];
  if (ivPage) {
    ivTitle = extractTitle(ivPage.html);
    ivMeta = extractMetaDescription(ivPage.html);
    ivSchema = extractJsonLdTypes(ivPage.html);
  }

  // Tel + mailto from any fetched page (use union).
  let tels = new Set();
  let mails = new Set();
  for (const p of allHtml) {
    const tm = extractTelMailto(p.html);
    tm.tels.forEach(t => tels.add(t));
    tm.mails.forEach(m => mails.add(m));
  }
  tels = Array.from(tels);
  mails = Array.from(mails);

  // Look for NAP signals in text
  const combinedText = tagsStripped(allHtml.map(p => p.html).join(' '));
  const ivMentioned = mentionsIv(combinedText);
  const bookingPath = hasBookingPath(allHtml.map(p => p.html).join(' '));

  // NAP check
  const dbPhoneDigits = digitsOnly(provider.phone);
  const sitePhoneMatchAny = tels.some(t => {
    const td = digitsOnly(t);
    return td.length >= 7 && (dbPhoneDigits.endsWith(td) || td.endsWith(dbPhoneDigits) || td === dbPhoneDigits);
  });
  // Also check raw phone digits in body text (catches non-tel: numbers)
  const dbPhoneInText = dbPhoneDigits.length >= 7 && combinedText.includes(dbPhoneDigits.slice(-7));

  const dbName = lower(provider.name);
  const nameLooseMatch = dbName && lower(combinedText).includes(dbName);

  // Address: check city + postal code presence + (loose) address tokens
  const tokens = (provider.address || '').toLowerCase().split(/[\s,]+/).filter(t => t.length >= 3);
  const tokensFound = tokens.filter(t => lower(combinedText).includes(t)).length;
  const tokensTotal = tokens.length;
  const postalCodeMatch = (provider.address || '').match(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/);
  const sitePostalMatch = postalCodeMatch && combinedText.toLowerCase().includes(postalCodeMatch[0].toLowerCase());

  // City mention
  const cityMatch = provider.city && lower(combinedText).includes(lower(provider.city));

  return {
    pagesTried,
    homeTitle, homeMeta, homeSchema,
    ivPagePath: ivPage?.path || null,
    ivTitle, ivMeta, ivSchema,
    tels, mails,
    sitePhoneMatchAny,
    dbPhoneInText,
    nameLooseMatch,
    tokensFound, tokensTotal,
    sitePostalMatch: !!sitePostalMatch,
    cityMatch: !!cityMatch,
    ivMentioned,
    bookingPath,
  };
}

function dbDataQuality(provider) {
  const issues = [];
  const solid = [];
  if (provider.address) solid.push('address');
  else issues.push('address missing');
  if (provider.phone) solid.push('phone');
  else issues.push('phone missing');
  if (provider.email) solid.push('email');
  else issues.push('email missing');
  if (provider.website) solid.push('website');
  else issues.push('website missing');
  if (provider.working_hours && Object.keys(provider.working_hours).length) solid.push('hours');
  else issues.push('hours missing');
  if ((Array.isArray(provider.services) && provider.services.length) || (Array.isArray(provider.specialties) && provider.specialties.length)) solid.push('services/specialties');
  else issues.push('services list thin or empty');
  if (provider.description) solid.push('description');
  else issues.push('description missing');
  return { solid, issues };
}

function classifyOpportunity(dbq, siteFindings) {
  if (siteFindings.error) {
    return { rec: 'maybe', because: 'website unreachable (' + siteFindings.error + '), this alone may be a real gap worth confirming manually' };
  }
  const gaps = [];
  if (!siteFindings.ivMentioned) gaps.push('IV services not mentioned on website');
  if (!siteFindings.bookingPath) gaps.push('no clear booking or contact CTA detected');
  if (!siteFindings.ivPagePath) gaps.push('no dedicated IV therapy page detected');
  if (!siteFindings.homeTitle) gaps.push('homepage missing <title>');
  if (!siteFindings.homeMeta) gaps.push('homepage missing meta description');
  if (siteFindings.homeSchema.length === 0) gaps.push('no JSON-LD structured data on homepage');
  if (!siteFindings.sitePhoneMatchAny && !siteFindings.dbPhoneInText) gaps.push('DB phone not found on site (potential NAP mismatch)');
  if (!siteFindings.sitePostalMatch && !siteFindings.cityMatch) gaps.push('DB address city/postal not found on site (potential NAP mismatch)');
  if (dbq.issues.length > 0) gaps.push('our DB record gaps: ' + dbq.issues.join(', '));

  // High-tier opportunity: 3+ real fixable gaps. Low: 0 real gaps. Mid: 1-2.
  if (gaps.length >= 3) return { rec: 'yes', because: gaps.length + ' fixable gaps surfaced from public sources', gaps };
  if (gaps.length === 0) return { rec: 'no', because: 'site + DB look healthy on free signals; no clear Get Found pitch from what we can see', gaps };
  return { rec: 'maybe', because: gaps.length + ' fixable gaps, may be worth a careful conversation', gaps };
}

(async () => {
  const lines = [];
  lines.push('# Free 4-clinic listing assessment, draft for operator review');
  lines.push('');
  lines.push('Generated 2026-06-09 from public sources only (own website plus our DB record). No Google Places API calls. No clinics were contacted; this is an internal draft.');
  lines.push('');
  lines.push('Hard honesty rule: GBP category, review count, and photo count are NOT in this report (need the Places API). Operator: see the "needs a manual Google check" list per clinic for the specific items to confirm by hand.');
  lines.push('');

  for (const p of records) {
    lines.push('---');
    lines.push('');
    lines.push('## ' + p.name);
    lines.push('');
    lines.push('Slug: /providers/' + p.slug + '  ');
    lines.push('City: ' + p.city + ', ' + p.state + ', ' + p.country + '  ');
    lines.push('Website: ' + (p.website || '(none)') + '  ');
    lines.push('DB phone: ' + (p.phone || '(none)') + '  ');
    lines.push('DB email: ' + (p.email || '(none)') + '  ');
    lines.push('DB address: ' + (p.address || '(none)') + '  ');
    lines.push('DB working_hours: ' + describeHours(p.working_hours));
    lines.push('');

    const dbq = dbDataQuality(p);
    const findings = await fetchAndAssessSite(p);

    if (findings.error) {
      lines.push('### Website assessment');
      lines.push('Site fetch failed: ' + findings.error + '.');
      if (findings.pagesTried) {
        lines.push('Pages tried: ' + findings.pagesTried.map(pt => pt.path + ' (' + (pt.ok ? 'ok' : (pt.err || 'fail')) + ')').join(', ') + '.');
      }
      lines.push('');
    } else {
      lines.push('### What is solid');
      const solid = [];
      if (findings.homeTitle) solid.push('homepage has a real <title>: ' + JSON.stringify(findings.homeTitle));
      if (findings.homeMeta) solid.push('homepage has a meta description (' + findings.homeMeta.length + ' chars)');
      if (findings.homeSchema.length > 0) solid.push('homepage emits JSON-LD types: ' + findings.homeSchema.join(', '));
      if (findings.ivPagePath) solid.push('dedicated IV page detected at ' + findings.ivPagePath);
      if (findings.ivTitle) solid.push('IV page has <title>: ' + JSON.stringify(findings.ivTitle));
      if (findings.ivMeta) solid.push('IV page has meta description (' + findings.ivMeta.length + ' chars)');
      if (findings.ivSchema.length > 0) solid.push('IV page emits JSON-LD types: ' + findings.ivSchema.join(', '));
      if (findings.tels.length > 0) solid.push('site has tel: links: ' + findings.tels.slice(0, 3).join(', '));
      if (findings.mails.length > 0) solid.push('site has mailto links: ' + findings.mails.slice(0, 3).join(', '));
      if (findings.sitePhoneMatchAny || findings.dbPhoneInText) solid.push('NAP phone matches between site and our DB');
      if (findings.sitePostalMatch) solid.push('DB postal code appears on the site');
      if (findings.cityMatch) solid.push('DB city appears on the site');
      if (findings.ivMentioned) solid.push('IV services are mentioned on the site');
      if (findings.bookingPath) solid.push('a booking or contact path is present in the page text');
      if (dbq.solid.length > 0) solid.push('our DB record has: ' + dbq.solid.join(', '));
      if (solid.length === 0) solid.push('(no positive signals captured; see gaps and manual-check list below)');
      for (const s of solid) lines.push('- ' + s);
      lines.push('');

      lines.push('### What is missing or inconsistent (real, fixable gaps)');
      const gaps = [];
      if (!findings.ivPagePath) gaps.push('no dedicated IV therapy page found at common paths (' + findings.pagesTried.map(pt => pt.path).join(', ') + ')');
      if (!findings.ivMentioned) gaps.push('IV services not mentioned in any fetched page');
      if (!findings.bookingPath) gaps.push('no clear booking or contact CTA detected in page text');
      if (!findings.homeTitle) gaps.push('homepage <title> is missing');
      if (!findings.homeMeta) gaps.push('homepage meta description is missing');
      if (findings.homeSchema.length === 0) gaps.push('homepage has no JSON-LD structured data');
      if (findings.ivPagePath && findings.ivSchema.length === 0) gaps.push('IV page has no JSON-LD structured data');
      if (!findings.sitePhoneMatchAny && !findings.dbPhoneInText) gaps.push('DB phone (' + (p.phone || 'n/a') + ') was NOT found on the site, potential NAP mismatch');
      if (!findings.sitePostalMatch && !findings.cityMatch) gaps.push('neither DB postal code nor city were found in site text, potential NAP mismatch');
      if (dbq.issues.length > 0) gaps.push('our DB record gaps: ' + dbq.issues.join(', '));
      if (gaps.length === 0) gaps.push('(none surfaced from free signals)');
      for (const g of gaps) lines.push('- ' + g);
      lines.push('');

      const verdict = classifyOpportunity(dbq, findings);
      lines.push('### Get Found read');
      lines.push('**' + verdict.rec.toUpperCase() + '**, ' + verdict.because + '.');
      lines.push('');

      lines.push('### Needs a manual Google check (not visible from free sources)');
      lines.push('- Google Business Profile primary category (is it set to "IV therapy service"?)');
      lines.push('- Total review count and average rating on Google');
      lines.push('- Number of photos on the GBP and whether the menu/services are filled in');
      lines.push('- Whether hours are listed on the GBP (not the website)');
      lines.push('- Whether the GBP claim status is current (verified ownership)');
      lines.push('');
    }
  }

  fs.writeFileSync('./scripts/_assessment-4-clinics.md', lines.join('\n'));
  fs.unlinkSync('./.tmp-4clinic.json');
  console.log('Wrote scripts/_assessment-4-clinics.md (' + lines.length + ' lines)');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
