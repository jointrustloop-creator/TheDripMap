// Find contact emails for top 20 unclaimed providers, update Supabase + outreach-drafts.md
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

const providers = JSON.parse(fs.readFileSync('scripts/top20.json', 'utf8'));
const draftsPath = 'scripts/outreach-drafts.md';
let drafts = fs.readFileSync(draftsPath, 'utf8');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Ch-Ua': '"Chromium";v="130", "Google Chrome";v="130"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Referer': 'https://www.google.com/',
};

const EMAIL_RE = /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24})\b/g;
const SKIP_DOMAINS = /(@example|@yoursite|@domain|@email|@2x|wixpress|sentry|@sentry|godaddy|@png|@jpg|@webp)/i;
const PREFERRED = /^(info|hello|contact|bookings?|admin|support|hi|reservations|appointments?|inquiries|hq)@/i;

function extractEmails(html) {
  const matches = new Set();
  let m;
  EMAIL_RE.lastIndex = 0;
  while ((m = EMAIL_RE.exec(html)) !== null) {
    const e = m[1].toLowerCase();
    if (SKIP_DOMAINS.test(e)) continue;
    if (e.includes('..')) continue;
    matches.add(e);
  }
  return [...matches];
}

function pickBest(emails) {
  if (emails.length === 0) return null;
  const preferred = emails.find((e) => PREFERRED.test(e));
  if (preferred) return preferred;
  return emails[0];
}

async function fetchHtml(url) {
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, html: await res.text() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function findEmailForProvider(p) {
  const baseUrl = p.website;
  if (!baseUrl) return { email: null, reason: 'no website' };

  // Try homepage first
  const home = await fetchHtml(baseUrl);
  if (home.ok) {
    const homeEmails = extractEmails(home.html);
    const picked = pickBest(homeEmails);
    if (picked) return { email: picked, source: 'homepage', allFound: homeEmails };
  }

  // Try contact pages
  const origin = (() => {
    try { return new URL(baseUrl).origin; } catch { return null; }
  })();
  if (!origin) return { email: null, reason: 'invalid url' };

  for (const path of ['/contact', '/contact-us', '/about', '/about-us', '/get-in-touch']) {
    const res = await fetchHtml(origin + path);
    if (!res.ok) continue;
    const emails = extractEmails(res.html);
    const picked = pickBest(emails);
    if (picked) return { email: picked, source: path, allFound: emails };
  }

  if (!home.ok) return { email: null, reason: `homepage HTTP ${home.status || home.error}` };
  return { email: null, reason: 'no email found on site' };
}

const results = [];
for (let i = 0; i < providers.length; i++) {
  const p = providers[i];
  process.stdout.write(`[${String(i + 1).padStart(2)}/20] ${p.name.padEnd(45).slice(0, 45)} ${(p.website || '').slice(0, 35).padEnd(35)} ... `);
  const r = await findEmailForProvider(p);
  results.push({ ...p, found: r });
  if (r.email) {
    console.log(`✓ ${r.email}`);
  } else {
    console.log(`⚠ ${r.reason}`);
  }
}

console.log('\n=== Applying Supabase updates ===');
let updatedDb = 0;
for (const r of results) {
  if (!r.found.email) continue;
  const { error } = await supabase
    .from('providers')
    .update({ email: r.found.email })
    .eq('id', r.id)
    .is('email', null);
  if (error) {
    console.log(`  ⚠ ${r.name}: ${error.message}`);
  } else {
    updatedDb++;
  }
}
console.log(`Updated ${updatedDb} providers in Supabase.`);

console.log('\n=== Updating outreach-drafts.md ===');
let updatedMd = 0;
for (const r of results) {
  if (!r.found.email) continue;
  // Find the block for this clinic by ID/slug match in the header line is unreliable;
  // safest: find the "no email on file" marker after the clinic name heading.
  // Match the heading line then the next "**To:** no email on file..." line.
  const cleanName = r.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const pattern = new RegExp(`(##.*${cleanName}[^\\n]*\\n\\*\\*To:\\*\\* )no email on file — find one manually`, 'i');
  if (pattern.test(drafts)) {
    drafts = drafts.replace(pattern, `$1${r.found.email}`);
    updatedMd++;
  } else {
    // Fallback: match by city + part of name
    console.log(`  ⚠ Could not locate ${r.name} in markdown for find-replace`);
  }
}
fs.writeFileSync(draftsPath, drafts);
console.log(`Replaced ${updatedMd} 'no email on file' lines in outreach-drafts.md`);

console.log('\n=== Final summary ===');
const found = results.filter((r) => r.found.email);
const missing = results.filter((r) => !r.found.email);
console.log(`Emails found: ${found.length}/20`);
console.log(`Emails not found: ${missing.length}/20`);
console.log('\nFound emails:');
for (const r of found) {
  console.log(`  ${r.found.email.padEnd(40)} ${r.name} (${r.city})`);
}
if (missing.length) {
  console.log('\nNot found:');
  for (const r of missing) {
    console.log(`  ${r.name.padEnd(45)} (${r.city}) — ${r.found.reason}`);
  }
}
