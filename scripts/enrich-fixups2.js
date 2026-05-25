// Final pass: try Beauty Lounge Peoria (had 1 service & no desc) and Revive (403).

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

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
  ['Skin / Aesthetics', /botox|filler|microneedling|aesthetic|medspa|med\s*spa|facial|lash|brow|wax|peel|hydrafacial/i],
  ['Mobile IV', /mobile\s*iv|in[- ]?home|concierge\s*iv|we\s*come\s*to\s*you/i],
  ['Food Poisoning Relief', /food\s*poisoning|stomach\s*flu|nausea\s*relief/i],
  ['Pregnancy Support', /pregnan(cy|t)|morning\s*sickness/i],
  ['Glutathione', /glutathione/i],
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

const BROWSER = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.google.com/',
  'Upgrade-Insecure-Requests': '1',
};

async function fetchSite(url, ms = 20000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ac.signal, headers: BROWSER });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, html: await res.text() };
  } catch (e) { return { ok: false, error: e.message || String(e) }; } finally { clearTimeout(t); }
}

function findInternalLinks(html, baseUrl) {
  const u = new URL(baseUrl); const origin = u.origin; const out = new Set();
  const re = /href=["']([^"']+)["']/gi; let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    let abs; try { abs = new URL(href, baseUrl).toString(); } catch { continue; }
    if (!abs.startsWith(origin)) continue;
    const lower = abs.toLowerCase();
    if (/(service|menu|drip|iv|treatment|pricing|prices|about|contact|locations?|spa|wellness|injectables)/.test(lower)) {
      out.add(abs.split('#')[0]);
    }
  }
  return [...out].slice(0, 6);
}
function extractServices(text) { const f = new Set(); for (const [n, r] of SERVICE_CATALOG) if (r.test(text)) f.add(n); return [...f]; }
function extractPhone(text) {
  const m = text.match(PHONE_RE); if (!m) return null;
  for (const raw of m) { const d = raw.replace(/\D/g, ''); if (d.length === 10 || d.length === 11) { const x = d.length === 11 ? d.slice(1) : d; return `+1 ${x.slice(0,3)}-${x.slice(3,6)}-${x.slice(6)}`; } }
  return null;
}
function extractAddress(text) { ADDR_RE.lastIndex = 0; const m = ADDR_RE.exec(text); return m ? m[0].replace(/\s+/g, ' ').trim() : null; }

const REVIEW_RX = /\b(i\s+(?:am|was|have|love|recommend|came|tried|went|visited|started)|she\s+(?:is|was)|he\s+(?:is|was)|my\s+(?:experience|skin|husband|wife|appointment)|highly\s+recommend|five\s+stars|begging\s+you|verified\s+(?:google\s+)?review|—\s*[A-Z][a-z]+\b)/i;

function extractDescription(html, text, name, city) {
  let metaDesc = null;
  const mMeta = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']{40,500})["']/i)
             || html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']{40,500})["']/i);
  if (mMeta) metaDesc = mMeta[1].trim();

  const paras = text.split(/\n+/).map(s => s.trim()).filter(s => s.length > 60 && s.length < 1500);
  const HINT = /(iv|drip|hydrat|infus|wellness|vitamin|clinic|therapy|medspa|med\s*spa|nad|myers|recover|immun|aesthetic|spa|skin|botox|filler|treatment|service|lash|wax|peel)/i;
  const scored = paras.filter(p => !REVIEW_RX.test(p))
    .map(p => ({ p, score: (HINT.test(p) ? 3 : 0) + (p.toLowerCase().includes((city||'').toLowerCase()) ? 1 : 0) + Math.min(p.split(/\s+/).length/50, 2) }))
    .sort((a, b) => b.score - a.score);

  let body = '';
  if (metaDesc && HINT.test(metaDesc) && metaDesc.split(/\s+/).length >= 20 && !REVIEW_RX.test(metaDesc)) body = metaDesc;
  else if (scored.length && scored[0].score >= 3) {
    body = scored[0].p;
    if (body.split(/\s+/).length < 60 && scored[1]) body += ' ' + scored[1].p;
  } else if (metaDesc && !REVIEW_RX.test(metaDesc)) body = metaDesc;
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
  return body.split(/\s+/).length < 30 ? null : body;
}

const TARGETS = [
  { id: 'a051cf35-adbb-4c58-b143-2a0b8e09da14', name: 'The Beauty Lounge Of Peoria', website: 'https://www.thebeautyloungeinpeoria.com/', city: 'Peoria' },
  { id: '8466a0aa-29f2-4e6e-94a6-5db3f2d36df0', name: 'Revive Therapy & Aesthetics', website: 'https://www.revivetherapyandaesthetics.com/', city: 'Morgan Hill' },
];

async function main() {
  for (let i = 0; i < TARGETS.length; i++) {
    const t = TARGETS[i];
    console.log(`[${i + 1}/${TARGETS.length}] Re-fetching ${t.name} — ${t.website}...`);
    let home = await fetchSite(t.website);
    if (!home.ok) {
      const alt = t.website.includes('://www.') ? t.website.replace('://www.', '://') : t.website.replace('://', '://www.');
      console.log(`     trying alternate host: ${alt}`);
      home = await fetchSite(alt);
    }
    if (!home.ok) { console.log(`  ⚠ Skipped: ${home.error}`); continue; }
    const subs = findInternalLinks(home.html, t.website);
    let combinedText = stripHtml(home.html);
    for (const sub of subs) { const r = await fetchSite(sub, 15000); if (r.ok) combinedText += '\n\n' + stripHtml(r.html); }

    const services = extractServices(combinedText);
    const phone = extractPhone(combinedText);
    const address = extractAddress(combinedText);
    const description = extractDescription(home.html, combinedText, t.name, t.city);

    const update = {};
    if (description) update.description = description;
    if (services.length >= 1) update.specialties = services;
    if (phone) update.phone = phone;
    if (address) update.address = address;

    if (Object.keys(update).length === 0) { console.log(`  - Nothing extracted`); continue; }
    const { error } = await supabase.from('providers').update(update).eq('id', t.id);
    if (error) { console.log(`  ✗ DB failed: ${error.message}`); continue; }
    console.log(`  ✓ description: ${description ? description.split(/\s+/).length + ' words' : 'none'}, specialties: [${services.join(', ')}], phone: ${phone ? 'set ' + phone : 'none'}, address: ${address ? 'set' : 'none'}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
