/**
 * September Sprint move 1, step 2: turn the missing CONO IVIT premises
 * (from scripts/_cono-ivit-harvest.ts -> %TEMP%/cono-ivit/missing-details.json)
 * into curated Canadian listings.
 *
 *   npx tsx scripts/_cono-ivit-insert.ts            dry run: resolve websites, print what would be inserted
 *   npx tsx scripts/_cono-ivit-insert.ts --write    insert
 *
 * Website: Firecrawl web search on "<name> <city> Ontario", first result that
 * is not an aggregator/social/directory domain. Email and phone come from the
 * register itself (the premises' registered contact). Every row carries the
 * register id, premise number, registrants and inspection status in
 * decision_drivers.cono_premise so the provenance is inspectable later.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import { createClient } from '@supabase/supabase-js';
import { slugify } from '../src/lib/data';
import { honestDescription } from '../src/lib/discovery';

const WRITE = process.argv.includes('--write');
const IN = path.join(process.env.TEMP || '.', 'cono-ivit', 'missing-details.json');
const KEY = process.env.FIRECRAWL_API_KEY || '';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SKIP_HOSTS = /(google\.|facebook\.|instagram\.|linkedin\.|yelp\.|yellowpages|thedripmap|ratemds|opencare|healthgrades|bing\.|wikipedia|alinityapp|collegeofnaturopaths|cand\.ca|indeed\.|glassdoor|tiktok|youtube|twitter|x\.com|mapquest|foursquare|411\.ca|canada411|cylex|nicelocal|zocdoc|medimap|healthlocator|211ontario|chamberofcommerce|wheree|yorkmaps|beautifi|healthline|birdeye|waze\.|creationent|janeapp\.com\/?$)/i;
const GENERIC_MAIL = /^(gmail|yahoo|hotmail|outlook|live|icloud|rogers|bell|bellnet|sympatico|cogeco|shaw|telus|me|aol|protonmail|ica)\.(com|ca|net|org)$/i;

// Most premises' registered email is on their own domain; that domain, if it
// serves a page, is the website. No search needed and no wrong picks.
async function siteFromEmail(email: string | null): Promise<string | null> {
  const domain = (email || '').split('@')[1]?.toLowerCase();
  if (!domain || GENERIC_MAIL.test(domain) || /ccnm\.edu|pthealth\.ca|tfm\.care/i.test(domain)) return null;
  for (const u of [`https://www.${domain}`, `https://${domain}`]) {
    try { const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(12_000), headers: { 'user-agent': 'Mozilla/5.0 (compatible; TheDripMapBot/1.0)' } }); if (r.ok) return new URL(r.url).origin; } catch { /* next */ }
  }
  return null;
}

interface Detail { rg: string; on: string; cn: string; crs: string; email: string | null; phone: string | null; address: string | null; postal: string | null; registrants: string[]; inspection: string | null }

// Reviewed by hand on the 2026-09-13 dry run: search picked a wrong or
// third-party site for these, so they get no website (the engine skips them
// and they take the plain first touch) or a corrected city.
const OVERRIDES: Record<string, { website?: null; city?: string }> = {
  'Doncrest Rehabilitation Centre': { website: null },
  'Beehive Wellness Clinic (Finchgate)': { website: null },
  'Schad Naturopathic Clinic': { website: null },
  'Vitality Health Management': { website: null },
  'Health Avenue (Toronto)': { website: null },
  'Push Pounds Sports Medicine': { website: null },
  'Supernatural': { website: null },
  'Etobicoke Naturopathic Clinic': { website: null },
  '1Med Health Solutions (Oxford)': { website: null },
  'WholeLife Naturopathic Clinic': { website: null },
  'Pain Care Clinics - Mississauga': { city: 'Mississauga' },
};

const cleanName = (s: string) => s.replace(/\s*-\s*\d{3,5}\s*$/, '').replace(/\s+/g, ' ').trim();

async function findWebsite(name: string, city: string): Promise<string | null> {
  if (!KEY) return null;
  try {
    let r = await fetch('https://api.firecrawl.dev/v2/search', { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: `${name} ${city} Ontario`, limit: 6 }), signal: AbortSignal.timeout(30_000) });
    if (r.status === 429) { await sleep(8000); r = await fetch('https://api.firecrawl.dev/v2/search', { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: `${name} ${city} Ontario`, limit: 6 }), signal: AbortSignal.timeout(30_000) }); }
    if (!r.ok) { console.log(`   (firecrawl search ${r.status})`); return null; }
    const j = await r.json().catch(() => null);
    const hits: Array<{ url: string; title?: string }> = j?.data?.web || j?.data || [];
    const nameKey = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter((w) => w.length > 3 && !['clinic', 'health', 'wellness', 'naturopathic', 'centre', 'center', 'medical', 'the'].includes(w));
    for (const h of hits) {
      try {
        const u = new URL(h.url);
        if (SKIP_HOSTS.test(u.hostname + u.pathname)) continue;
        const hay = (u.hostname + ' ' + (h.title || '')).toLowerCase();
        if (nameKey.some((w) => hay.includes(w))) return `${u.protocol}//${u.hostname}`;
      } catch { /* skip */ }
    }
  } catch { /* no website */ }
  return null;
}

async function main() {
  const rows: Detail[] = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: slugsData } = await sb.from('providers').select('slug,email');
  const slugs = new Set((slugsData || []).map((r) => r.slug));
  // Same email as an existing listing = same business (e.g. a second premises
  // of a clinic we already list). Skip and report rather than duplicate.
  const knownEmails = new Set((slugsData || []).map((r) => String(r.email || '').toLowerCase().trim()).filter(Boolean));
  let inserted = 0, withSite = 0;
  for (const [i, d] of rows.entries()) {
    if (d.crs !== 'Active' || /^test premise/i.test(d.on)) continue;
    const name = cleanName(d.on);
    // City from the registered address (the register's city column is
    // sometimes the registrant's, e.g. a Mississauga premises filed as Toronto).
    const addrCity = (String(d.address || '').match(/,\s*([A-Za-z.' -]+),\s*ON/) || [])[1];
    const ov = OVERRIDES[cleanName(d.on)] || {};
    const city = (ov.city || addrCity || d.cn).trim();
    const email = d.email && d.email !== '-' && /@/.test(d.email) ? d.email.toLowerCase().trim() : null;
    if (email && knownEmails.has(email)) { console.log(`[${i + 1}/${rows.length}] SKIP ${name} (${city}): email already on a listing (${email})`); continue; }
    let slug = `${slugify(name)}-${slugify(city)}`;
    if (slugs.has(slug)) slug = `${slug}-ivit`;
    const website = ov.website === null ? null : (await siteFromEmail(email)) || (await findWebsite(name, city));
    if (website) withSite++;
    console.log(`[${i + 1}/${rows.length}] ${name} | ${city} | ${website || 'no site'} | ${email || 'no email'} | ${d.phone || '-'}`);
    if (WRITE) {
      const { error } = await sb.from('providers').insert({
        name, slug, city, state: 'Ontario', country: 'Canada',
        address: d.address, phone: d.phone && d.phone !== '-' ? d.phone : null, website, email,
        description: honestDescription(name, city),
        is_claimed: false, is_hidden: false,
        discovery_source: 'cono_ivit_register', discovery_flag: null, discovery_seen_at: new Date().toISOString(),
        decision_drivers: { source: 'cono_ivit_register', email_source: 'CONO IVIT Premises Register', cono_premise: { rg: d.rg, registered_name: d.on, registrants: d.registrants, inspection: d.inspection, postal: d.postal, harvested_at: new Date().toISOString().slice(0, 10) } },
      });
      if (error) console.log('   INSERT ERR', error.message); else { inserted++; slugs.add(slug); }
    }
    await sleep(700);
  }
  console.log(`\n${WRITE ? 'inserted' : 'would insert'} ${WRITE ? inserted : rows.filter((d) => d.crs === 'Active' && !/^test/i.test(d.on)).length}, websites found ${withSite}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
