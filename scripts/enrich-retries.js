// scripts/enrich-retries.js
// Re-attempt the 5 providers that returned HTTP 403 on the first pass,
// using a realistic browser User-Agent.

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

const RETRY_IDS = new Set([
  'f74ec4c1-c6e5-408f-9f5c-f7aea84493bf', // Revitalize IV Solutions
  '7bb76c17-8752-405c-9d9e-104f1664a47e', // Hangover IV
  'fc505255-30fa-4980-8fe2-98474689ae33', // Immunity Center
  '8466a0aa-29f2-4e6e-94a6-5db3f2d36df0', // Revive Therapy & Aesthetics
  'b9dca761-41d5-4a79-abde-36afcc83ee07', // IV Drip 2 U
]);

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
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

async function fetchWithTimeout(url, ms = 20000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ac.signal, headers: BROWSER_HEADERS });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    const text = await res.text();
    return { ok: true, html: text };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  } finally {
    clearTimeout(t);
  }
}

function findInternalLinks(html, baseUrl) {
  const u = new URL(baseUrl);
  const origin = u.origin;
  const out = new Set();
  const re = /href=["']([^"']+)["']/gi;
  let m;
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

function extractServices(text) {
  const found = new Set();
  for (const [name, re] of SERVICE_CATALOG) if (re.test(text)) found.add(name);
  return [...found];
}
function extractPhone(text) {
  const m = text.match(PHONE_RE);
  if (!m) return null;
  for (const raw of m) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) {
      const d = digits.length === 11 ? digits.slice(1) : digits;
      return `+1 ${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    }
  }
  return null;
}
function extractAddress(text) {
  ADDR_RE.lastIndex = 0;
  const m = ADDR_RE.exec(text);
  return m ? m[0].replace(/\s+/g, ' ').trim() : null;
}
function extractDescription(html, text, city) {
  let metaDesc = null;
  const mMeta = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']{40,500})["']/i)
             || html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']{40,500})["']/i);
  if (mMeta) metaDesc = mMeta[1].trim();

  const paras = text.split(/\n+/).map(s => s.trim()).filter(s => s.length > 80 && s.length < 1200);
  const SERVICE_HINT = /(iv|drip|hydrat|infus|wellness|vitamin|clinic|therapy|medspa|med\s*spa|nad|myers|recover|immun)/i;
  const scored = paras
    .map(p => ({ p, score: (SERVICE_HINT.test(p) ? 2 : 0) + (p.toLowerCase().includes((city || '').toLowerCase()) ? 1 : 0) + Math.min(p.split(/\s+/).length / 50, 2) }))
    .sort((a, b) => b.score - a.score);

  let body = '';
  if (metaDesc && SERVICE_HINT.test(metaDesc) && metaDesc.split(/\s+/).length >= 25) body = metaDesc;
  else if (scored.length && scored[0].score >= 2) {
    body = scored[0].p;
    if (body.split(/\s+/).length < 60 && scored[1]) body += ' ' + scored[1].p;
  } else if (metaDesc) body = metaDesc;
  else if (scored.length) body = scored[0].p;
  else return null;

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
function isBetter(currentDesc, newDesc) {
  if (!newDesc) return false;
  if (!currentDesc) return true;
  return newDesc.split(/\s+/).length > currentDesc.split(/\s+/).length + 20;
}

async function main() {
  const all = JSON.parse(fs.readFileSync(path.resolve('scripts/top20.json'), 'utf8'));
  const targets = all.filter(p => RETRY_IDS.has(p.id));
  console.log(`Retrying ${targets.length} providers with browser headers...\n`);

  const results = [];
  for (let i = 0; i < targets.length; i++) {
    const provider = targets[i];
    let website = provider.website;
    try { website = decodeURIComponent(website); } catch {}
    website = website.replace(/%3F.*$/i, '').replace(/%2F/gi, '/');

    console.log(`[${i + 1}/${targets.length}] Fetching ${provider.name} — ${website}...`);
    const home = await fetchWithTimeout(website);
    if (!home.ok) {
      console.log(`  ⚠ Skipped: ${home.error}`);
      results.push({ id: provider.id, skipped: true, reason: home.error });
      continue;
    }
    const subs = findInternalLinks(home.html, website);
    let combinedText = stripHtml(home.html);
    for (const sub of subs) {
      const r = await fetchWithTimeout(sub, 15000);
      if (r.ok) combinedText += '\n\n' + stripHtml(r.html);
    }

    const services = extractServices(combinedText);
    const phone = extractPhone(combinedText);
    const address = extractAddress(combinedText);
    const description = extractDescription(home.html, combinedText, provider.city || '');

    const update = {};
    let descNote = 'kept', specNote = 'kept', phoneNote = 'kept', addrNote = 'kept';
    if (isBetter(provider.description, description)) { update.description = description; descNote = `set (${description.split(/\s+/).length} words)`; }
    if (services.length >= 2 && (!provider.specialties || provider.specialties.length === 0)) {
      update.specialties = services; specNote = `[${services.join(', ')}]`;
    }
    if (!provider.phone && phone) { update.phone = phone; phoneNote = `set ${phone}`; }
    if (!provider.address && address) { update.address = address; addrNote = 'set'; }

    if (Object.keys(update).length === 0) {
      console.log(`  - No improvements found (services:${services.length}, desc:${description?description.split(/\s+/).length+'w':'n'})`);
      results.push({ id: provider.id, updated: false, services });
      continue;
    }
    const { error } = await supabase.from('providers').update(update).eq('id', provider.id);
    if (error) {
      console.log(`  ✗ DB update failed: ${error.message}`);
      results.push({ id: provider.id, skipped: true, reason: 'db: ' + error.message });
      continue;
    }
    console.log(`  ✓ description: ${descNote}, specialties: ${specNote}, phone: ${phoneNote}, address: ${addrNote}`);
    results.push({ id: provider.id, updated: true, fields: Object.keys(update), services, phone, address, description });
  }

  const updated = results.filter(r => r.updated).length;
  const skipped = results.filter(r => r.skipped).length;
  console.log(`\n========== RETRY SUMMARY ==========`);
  console.log(`Retried        : ${targets.length}`);
  console.log(`Newly enriched : ${updated}`);
  console.log(`Still skipped  : ${skipped}`);
  fs.writeFileSync(path.resolve('scripts/enrich-retries-results.json'), JSON.stringify(results, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
