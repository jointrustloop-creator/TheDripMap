// scripts/enrich-top20.js
//
// Enrich the top 20 unclaimed providers by fetching each clinic's website,
// extracting services / phone / address / description, and updating Supabase.
//
// Reads:  scripts/top20.json  (produced by scripts/top-unclaimed-providers.js)
// Writes: providers table in Supabase
//
// Heuristic extractor — fetches the homepage + a likely "services"/"menu" page,
// strips HTML, then matches a catalog of known IV-therapy services and pulls
// the first plausible phone/address.

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

// ---------- Service catalog ------------------------------------------------
// Each entry: [canonical name, ...alias regexes]
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

// Phone regex — North American
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\b([2-9][0-9]{2})\)?[\s.-]?([2-9][0-9]{2})[\s.-]?([0-9]{4})\b/g;

// Address regex — looks for street number + name + suite/city/state/zip
const ADDR_RE = /\b\d{1,6}\s+[A-Z][A-Za-z0-9.'\- ]{2,60}\s+(?:St(?:reet)?|Ave(?:nue)?|Blvd|Boulevard|Rd|Road|Dr(?:ive)?|Ln|Lane|Pl(?:ace)?|Pkwy|Parkway|Hwy|Highway|Way|Ct|Court|Ter(?:race)?|Cir|Circle|Sq|Square|Plaza|Suite|Ste)\b[,\s][^\n]{0,120}?\b[A-Z]{2}\s+\d{5}(?:-\d{4})?/g;

// HTML strip — fairly aggressive, keeps text-ish content.
function stripHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/?(p|br|div|li|tr|td|h[1-6]|section|article)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

async function fetchWithTimeout(url, ms = 15000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ac.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TheDripMapBot/1.0; +https://thedripmap.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html') && !ct.includes('text')) return { ok: false, error: `bad content-type: ${ct}` };
    const text = await res.text();
    return { ok: true, html: text };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  } finally {
    clearTimeout(t);
  }
}

// Find candidate inner URLs (services / menu / drips / pricing / about / contact)
function findInternalLinks(html, baseUrl) {
  const u = new URL(baseUrl);
  const origin = u.origin;
  const out = new Set();
  const re = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    let abs;
    try { abs = new URL(href, baseUrl).toString(); } catch { continue; }
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
  for (const [name, re] of SERVICE_CATALOG) {
    if (re.test(text)) found.add(name);
  }
  return [...found];
}

function extractPhone(text) {
  const m = text.match(PHONE_RE);
  if (!m) return null;
  // dedupe & take first sensible
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
  if (!m) return null;
  return m[0].replace(/\s+/g, ' ').trim();
}

// Build a description: prefer meta description, then take a paragraph that
// mentions IV/hydration/wellness/clinic. Trim to 80-180 words.
function extractDescription(html, text, providerName, city) {
  // try meta description
  let metaDesc = null;
  const mMeta = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']{40,500})["']/i)
             || html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']{40,500})["']/i);
  if (mMeta) metaDesc = mMeta[1].trim();

  // candidate paragraphs from stripped text
  const paras = text.split(/\n+/).map(s => s.trim()).filter(s => s.length > 80 && s.length < 1200);
  const SERVICE_HINT = /(iv|drip|hydrat|infus|wellness|vitamin|clinic|therapy|medspa|med\s*spa|nad|myers|recover|immun)/i;
  const scored = paras
    .map(p => ({ p, score: (SERVICE_HINT.test(p) ? 2 : 0) + (p.toLowerCase().includes(city.toLowerCase()) ? 1 : 0) + Math.min(p.split(/\s+/).length / 50, 2) }))
    .sort((a, b) => b.score - a.score);

  let body = '';
  if (metaDesc && SERVICE_HINT.test(metaDesc) && metaDesc.split(/\s+/).length >= 25) {
    body = metaDesc;
  } else if (scored.length && scored[0].score >= 2) {
    body = scored[0].p;
    // append next paragraph if first is too short
    if (body.split(/\s+/).length < 60 && scored[1]) body += ' ' + scored[1].p;
  } else if (metaDesc) {
    body = metaDesc;
  } else if (scored.length) {
    body = scored[0].p;
  } else {
    return null;
  }

  // Clean
  body = body.replace(/\s+/g, ' ').trim();
  // Remove URL-y junk
  body = body.replace(/https?:\/\/\S+/g, '').trim();
  // Truncate to ~180 words at sentence boundary
  const words = body.split(/\s+/);
  if (words.length > 180) {
    let cut = words.slice(0, 180).join(' ');
    const lastDot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    if (lastDot > 400) cut = cut.slice(0, lastDot + 1);
    body = cut;
  }
  const wc = body.split(/\s+/).length;
  if (wc < 40) return null;
  return body;
}

function isHomepageBetter(currentDesc, newDesc) {
  if (!newDesc) return false;
  if (!currentDesc) return true;
  // only overwrite if substantially better
  const cw = currentDesc.split(/\s+/).length;
  const nw = newDesc.split(/\s+/).length;
  return nw > cw + 20;
}

async function enrichOne(provider, index, total) {
  const name = provider.name;
  let website = provider.website;
  // decode any percent-encoded query string nonsense
  try { website = decodeURIComponent(website); } catch { /* ignore */ }
  // strip everything after a stray % that's not a valid escape
  website = website.replace(/%3F.*$/i, '').replace(/%2F/gi, '/');

  console.log(`[${index + 1}/${total}] Fetching ${name} — ${website}...`);

  const home = await fetchWithTimeout(website);
  if (!home.ok) {
    console.log(`  ⚠ Skipped: fetch failed (${home.error})`);
    return { id: provider.id, skipped: true, reason: home.error };
  }

  // Pull a few internal sub-pages to enrich service detection
  const subs = findInternalLinks(home.html, website);
  let combinedHtml = home.html;
  let combinedText = stripHtml(home.html);
  for (const sub of subs) {
    const r = await fetchWithTimeout(sub, 12000);
    if (r.ok) {
      combinedHtml += '\n' + r.html;
      combinedText += '\n\n' + stripHtml(r.html);
    }
  }

  const services = extractServices(combinedText);
  const phone = extractPhone(combinedText);
  const address = extractAddress(combinedText);
  const description = extractDescription(home.html, combinedText, name, provider.city || '');

  // Build update payload — only set fields we improved
  const update = {};
  let descNote = 'kept';
  if (isHomepageBetter(provider.description, description)) {
    update.description = description;
    descNote = `set (${description.split(/\s+/).length} words)`;
  }

  let specNote = 'kept';
  if (services.length >= 2 && (!provider.specialties || provider.specialties.length === 0)) {
    update.specialties = services;
    specNote = `[${services.join(', ')}]`;
  } else if (services.length >= 2 && Array.isArray(provider.specialties) && services.length > provider.specialties.length) {
    update.specialties = services;
    specNote = `[${services.join(', ')}]`;
  }

  let phoneNote = 'kept';
  if (!provider.phone && phone) {
    update.phone = phone;
    phoneNote = `set ${phone}`;
  }

  let addrNote = 'kept';
  if (!provider.address && address) {
    update.address = address;
    addrNote = `set`;
  }

  if (Object.keys(update).length === 0) {
    console.log(`  - No improvements found (services:${services.length}, phone:${phone?'y':'n'}, addr:${address?'y':'n'}, desc:${description?description.split(/\s+/).length+'w':'n'})`);
    return { id: provider.id, updated: false, services, phone, address, description };
  }

  const { error } = await supabase.from('providers').update(update).eq('id', provider.id);
  if (error) {
    console.log(`  ✗ DB update failed: ${error.message}`);
    return { id: provider.id, skipped: true, reason: 'db: ' + error.message };
  }

  console.log(`  ✓ description: ${descNote}, specialties: ${specNote}, phone: ${phoneNote}, address: ${addrNote}`);
  return {
    id: provider.id,
    updated: true,
    fields: Object.keys(update),
    services,
    phone,
    address,
    description,
  };
}

async function main() {
  const file = path.resolve('scripts/top20.json');
  const providers = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`Enriching ${providers.length} providers...\n`);

  const results = [];
  // Process sequentially (per task spec for clear live progress) — 20 sites is fine.
  for (let i = 0; i < providers.length; i++) {
    try {
      const r = await enrichOne(providers[i], i, providers.length);
      results.push(r);
    } catch (e) {
      console.log(`  ✗ Crash on ${providers[i].name}: ${e.message}`);
      results.push({ id: providers[i].id, skipped: true, reason: 'exception: ' + e.message });
    }
  }

  // Summary
  const updated = results.filter(r => r.updated);
  const skipped = results.filter(r => r.skipped);
  const noop = results.filter(r => !r.updated && !r.skipped);

  const gotDesc = updated.filter(r => r.fields.includes('description')).length;
  const gotSpec = updated.filter(r => r.fields.includes('specialties')).length;
  const gotPhone = updated.filter(r => r.fields.includes('phone')).length;
  const gotAddr = updated.filter(r => r.fields.includes('address')).length;

  console.log('\n========== SUMMARY ==========');
  console.log(`Total providers       : ${providers.length}`);
  console.log(`Successfully enriched : ${updated.length}`);
  console.log(`No improvements found : ${noop.length}`);
  console.log(`Skipped (errors)      : ${skipped.length}`);
  console.log('');
  console.log(`Got new descriptions  : ${gotDesc} of ${providers.length}`);
  console.log(`Got new specialties   : ${gotSpec} of ${providers.length}`);
  console.log(`Got new phone numbers : ${gotPhone} of ${providers.length}`);
  console.log(`Got new addresses     : ${gotAddr} of ${providers.length}`);
  if (skipped.length) {
    console.log('\nSkipped reasons:');
    for (const s of skipped) console.log(`  - ${s.id}: ${s.reason}`);
  }

  fs.writeFileSync(path.resolve('scripts/enrich-top20-results.json'), JSON.stringify(results, null, 2));
  console.log('\nResults written to scripts/enrich-top20-results.json');
}

main().catch(e => { console.error(e); process.exit(1); });
