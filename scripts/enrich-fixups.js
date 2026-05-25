// scripts/enrich-fixups.js
// 1) Re-extract descriptions for providers whose first description looks like
//    a customer testimonial (first-person, "I", "She is", "He is", review-y).
// 2) Make a final attempt at the one site still returning 403.

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SERVICE_CATALOG = [
  ['Hangover Recovery', /hangover/i],
  ['NAD+', /\bnad\+?\b|nicotinamide adenine/i],
  ['Myers Cocktail', /myer'?s?\s*cocktail/i],
  ['Beauty Glow', /beauty\s*(glow|drip|iv)|glow\s*(drip|iv)|glutathione/i],
  ['Immune Support', /immun(e|ity)\s*(boost|support|drip|iv)|immunity/i],
  ['Hydration', /hydrat(ion|e)\b/i],
  ['Recovery', /\b(athletic\s*)?recovery\b|performance\s*recovery|post[- ]workout/i],
  ['Energy Boost', /energy\s*(boost|drip|iv)|b[- ]?complex\s*energy/i],
  ['Jet Lag', /jet\s*lag/i],
  ['B12', /\bb[- ]?12\b|vitamin\s*b12/i],
  ['Vitamin C', /\bvitamin\s*c\b|high[- ]?dose\s*vitamin\s*c/i],
  ['Weight Loss', /weight\s*loss|semaglutide|tirzepatide|ozempic|wegovy|lipo[- ]?b/i],
  ['Migraine Relief', /migraine|headache\s*relief/i],
  ['Anti-Aging', /anti[- ]?aging|longevity/i],
  ['Skin / Aesthetics', /botox|filler|microneedling|aesthetic|medspa|med\s*spa|facial/i],
  ['Mobile IV', /mobile\s*iv|in[- ]?home|concierge\s*iv|we\s*come\s*to\s*you/i],
  ['Food Poisoning Relief', /food\s*poisoning|stomach\s*flu|nausea\s*relief/i],
  ['Pregnancy Support', /pregnan(cy|t)|morning\s*sickness/i],
  ['Glutathione', /glutathione/i],
  ['Iron Infusion', /iron\s*(infusion|drip)/i],
  ['Vitamin D', /vitamin\s*d\b/i],
  ['Wellness IV', /wellness\s*(drip|iv|infusion)/i],
];
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\b([2-9][0-9]{2})\)?[\s.-]?([2-9][0-9]{2})[\s.-]?([0-9]{4})\b/g;
const ADDR_RE = /\b\d{1,6}\s+[A-Z][A-Za-z0-9.'\- ]{2,60}\s+(?:St(?:reet)?|Ave(?:nue)?|Blvd|Boulevard|Rd|Road|Dr(?:ive)?|Ln|Lane|Pl(?:ace)?|Pkwy|Parkway|Hwy|Highway|Way|Ct|Court|Ter(?:race)?|Cir|Circle|Sq|Square|Plaza|Suite|Ste)\b[,\s][^\n]{0,120}?\b[A-Z]{2}\s+\d{5}(?:-\d{4})?/g;

function stripHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/?(p|br|div|li|tr|td|h[1-6]|section|article)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'cross-site',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'Referer': 'https://www.google.com/',
};

async function fetchSite(url, ms = 20000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ac.signal, headers: BROWSER_HEADERS });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const text = await res.text();
    return { ok: true, html: text };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  } finally { clearTimeout(t); }
}

function findInternalLinks(html, baseUrl) {
  const u = new URL(baseUrl);
  const origin = u.origin;
  const out = new Set();
  const re = /href=["']([^"']+)["']/gi; let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    let abs; try { abs = new URL(href, baseUrl).toString(); } catch { continue; }
    if (!abs.startsWith(origin)) continue;
    const lower = abs.toLowerCase();
    if (/(service|menu|drip|iv-?menu|iv-?therap|treatment|pricing|prices|about|contact|locations?)/.test(lower)) {
      out.add(abs.split('#')[0]);
    }
  }
  return [...out].slice(0, 4);
}

function extractServices(text) { const f = new Set(); for (const [n, r] of SERVICE_CATALOG) if (r.test(text)) f.add(n); return [...f]; }
function extractPhone(text) {
  const m = text.match(PHONE_RE); if (!m) return null;
  for (const raw of m) { const d = raw.replace(/\D/g, ''); if (d.length === 10 || d.length === 11) { const x = d.length === 11 ? d.slice(1) : d; return `+1 ${x.slice(0, 3)}-${x.slice(3, 6)}-${x.slice(6)}`; } }
  return null;
}
function extractAddress(text) { ADDR_RE.lastIndex = 0; const m = ADDR_RE.exec(text); return m ? m[0].replace(/\s+/g, ' ').trim() : null; }

// Patterns that signal a customer testimonial / review, not a clinic description.
const REVIEW_RX = /\b(i\s+(?:am|was|have|love|recommend|came|tried|went|visited|started)|she\s+(?:is|was)|he\s+(?:is|was)|my\s+(?:experience|skin|husband|wife|appointment)|highly\s+recommend|five\s+stars|begging\s+you|stars\b|verified\s+(?:google\s+)?review|—\s*[A-Z][a-z]+\b)/i;

function isLikelyReview(p) { return REVIEW_RX.test(p); }

function extractDescription(html, text, name, city) {
  let metaDesc = null;
  const mMeta = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']{40,500})["']/i)
             || html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']{40,500})["']/i);
  if (mMeta) metaDesc = mMeta[1].trim();

  const paras = text.split(/\n+/).map(s => s.trim()).filter(s => s.length > 80 && s.length < 1200);
  const SERVICE_HINT = /(iv|drip|hydrat|infus|wellness|vitamin|clinic|therapy|medspa|med\s*spa|nad|myers|recover|immun|aesthetic)/i;
  const scored = paras
    .filter(p => !isLikelyReview(p))
    .map(p => ({
      p,
      score:
        (SERVICE_HINT.test(p) ? 3 : 0) +
        (p.toLowerCase().includes((city || '').toLowerCase()) ? 1 : 0) +
        (new RegExp((name || '').split(/\s+/)[0], 'i').test(p) ? 1 : 0) +
        Math.min(p.split(/\s+/).length / 50, 2)
    }))
    .sort((a, b) => b.score - a.score);

  let body = '';
  if (metaDesc && SERVICE_HINT.test(metaDesc) && metaDesc.split(/\s+/).length >= 25 && !isLikelyReview(metaDesc)) {
    body = metaDesc;
  } else if (scored.length && scored[0].score >= 3) {
    body = scored[0].p;
    if (body.split(/\s+/).length < 60 && scored[1]) body += ' ' + scored[1].p;
  } else if (metaDesc && !isLikelyReview(metaDesc)) {
    body = metaDesc;
  } else if (scored.length) {
    body = scored[0].p;
  } else { return null; }

  body = body.replace(/\s+/g, ' ').trim().replace(/https?:\/\/\S+/g, '').trim();
  const words = body.split(/\s+/);
  if (words.length > 180) {
    let cut = words.slice(0, 180).join(' ');
    const lastDot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    if (lastDot > 400) cut = cut.slice(0, lastDot + 1);
    body = cut;
  }
  if (body.split(/\s+/).length < 40) return null;
  return body;
}

// Providers whose current description was contaminated by reviews — re-do them.
const REDO_DESC_IDS = new Set([
  'ce1d3860-b664-4af3-9471-9068b10a91d0', // IVme Milwaukee — current desc was a review quote
]);

// The one still-blocked site, plus alternate URL strategies.
const FINAL_ATTEMPT_IDS = new Set([
  '8466a0aa-29f2-4e6e-94a6-5db3f2d36df0', // Revive Therapy & Aesthetics
]);

async function main() {
  const all = JSON.parse(fs.readFileSync(path.resolve('scripts/top20.json'), 'utf8'));
  const targets = all.filter(p => REDO_DESC_IDS.has(p.id) || FINAL_ATTEMPT_IDS.has(p.id));
  console.log(`Fixup pass on ${targets.length} providers...\n`);

  for (let i = 0; i < targets.length; i++) {
    const provider = targets[i];
    let website = provider.website;
    try { website = decodeURIComponent(website); } catch {}
    website = website.replace(/%3F.*$/i, '').replace(/%2F/gi, '/');

    console.log(`[${i + 1}/${targets.length}] Re-fetching ${provider.name} — ${website}...`);
    let home = await fetchSite(website);
    if (!home.ok && FINAL_ATTEMPT_IDS.has(provider.id)) {
      // try www / non-www toggle
      const alt = website.includes('://www.') ? website.replace('://www.', '://') : website.replace('://', '://www.');
      console.log(`     retrying alternate host: ${alt}`);
      home = await fetchSite(alt);
    }
    if (!home.ok) {
      console.log(`  ⚠ Skipped: ${home.error}`);
      continue;
    }
    const subs = findInternalLinks(home.html, website);
    let combinedText = stripHtml(home.html);
    for (const sub of subs) {
      const r = await fetchSite(sub, 15000);
      if (r.ok) combinedText += '\n\n' + stripHtml(r.html);
    }

    const services = extractServices(combinedText);
    const phone = extractPhone(combinedText);
    const address = extractAddress(combinedText);
    const description = extractDescription(home.html, combinedText, provider.name, provider.city || '');

    const update = {};
    let descNote = 'kept', specNote = 'kept', phoneNote = 'kept', addrNote = 'kept';
    // For redo IDs we always overwrite the bad description if the new one is clean & sufficient.
    if (description && (REDO_DESC_IDS.has(provider.id) || !provider.description)) {
      update.description = description; descNote = `set (${description.split(/\s+/).length} words)`;
    }
    if (services.length >= 2 && (!provider.specialties || provider.specialties.length === 0 || FINAL_ATTEMPT_IDS.has(provider.id))) {
      update.specialties = services; specNote = `[${services.join(', ')}]`;
    }
    if (!provider.phone && phone) { update.phone = phone; phoneNote = `set ${phone}`; }
    if (!provider.address && address) { update.address = address; addrNote = 'set'; }

    if (Object.keys(update).length === 0) {
      console.log(`  - No improvements found`);
      continue;
    }
    const { error } = await supabase.from('providers').update(update).eq('id', provider.id);
    if (error) { console.log(`  ✗ DB failed: ${error.message}`); continue; }
    console.log(`  ✓ description: ${descNote}, specialties: ${specNote}, phone: ${phoneNote}, address: ${addrNote}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
