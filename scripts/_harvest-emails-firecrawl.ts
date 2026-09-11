/**
 * Outreach fuel: find a contact email for Canadian clinics that have a website
 * but no email on record (or whose email bounced), by reading the rendered
 * site through Firecrawl (JS sites hide addresses from a plain fetch).
 *
 *   npx tsx scripts/_harvest-emails-firecrawl.ts            dry run -> scripts/_email-harvest-<date>.md
 *   npx tsx scripts/_harvest-emails-firecrawl.ts --write    write providers.email for ACCEPTED rows only
 *
 * Accepted = an address on the clinic's own domain (or any address when the
 * site lives on a builder domain such as janeapp / wixsite / squarespace), not
 * a generic platform address, and not the address that already bounced.
 * Sequential with a polite delay (Windows + Node v24 kills concurrent workers).
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > -1 ? Number(process.argv[i + 1]) : Infinity; })();
const KEY = process.env.FIRECRAWL_API_KEY || '';
if (!KEY) { console.error('FIRECRAWL_API_KEY missing in .env.local'); process.exit(1); }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OUT = path.join('scripts', `_email-harvest-${new Date().toISOString().slice(0, 10)}${WRITE ? '-WRITE' : ''}.md`);

const BUILDER_HOSTS = /janeapp|wixsite|squarespace|godaddysites|weebly|shopify|mybusiness|business\.site|linktr\.ee|clinicsites|nextdoor/i;
const JUNK = /(sentry|wixpress|wix\.com|example\.com|\.png|\.jpg|\.jpeg|\.svg|\.webp|\.gif|@2x|godaddy|squarespace\.com|shopify|schema\.org|w3\.org|domain\.com|email\.com|yourdomain|mysite|noreply|no-reply|donotreply|privacy@|abuse@|support@wix|jane\.app|janeapp\.com)/i;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function scrape(url: string): Promise<string> {
  try {
    const r = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown', 'links'], onlyMainContent: false }),
      signal: AbortSignal.timeout(40_000),
    });
    if (!r.ok) return '';
    const j = await r.json();
    const md = j?.data?.markdown || '';
    const links: string[] = j?.data?.links || [];
    return md + '\n' + links.join('\n');
  } catch { return ''; }
}

function emailsIn(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/mailto:([^"'?\s)>\]]+)/gi)) { try { found.add(decodeURIComponent(m[1]).toLowerCase()); } catch { /* skip */ } }
  for (const m of text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) found.add(m[0].toLowerCase());
  return [...found].filter((e) => !JUNK.test(e) && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e));
}

function rootDomain(host: string): string {
  const parts = host.replace(/^www\./, '').split('.');
  return parts.slice(-2).join('.');
}

async function main() {
  const { data: rows } = await sb.from('providers').select('id,slug,name,city,website,email,email_bounced').eq('country', 'Canada').eq('is_claimed', false).eq('is_hidden', false).not('website', 'is', null);
  const targets = (rows || []).filter((p) => p.website && (!p.email || p.email_bounced)).slice(0, LIMIT);
  const lines = [`# Email harvest ${WRITE ? '(WRITTEN)' : '(dry run)'} ${new Date().toISOString().slice(0, 16)}Z`, '', `${targets.length} clinic(s): no email or bounced, with a website.`, ''];
  const flush = () => fs.writeFileSync(OUT, lines.join('\n'));
  flush();
  let accepted = 0, written = 0;
  for (const [i, p] of targets.entries()) {
    let site = String(p.website).trim(); if (!/^https?:\/\//i.test(site)) site = 'https://' + site;
    let host = ''; try { host = new URL(site).hostname; } catch { lines.push(`## ${p.name} (${p.slug}): bad website ${p.website}`); flush(); continue; }
    const own = rootDomain(host); const builder = BUILDER_HOSTS.test(host);
    process.stdout.write(`[${i + 1}/${targets.length}] ${p.slug} ... `);
    let found: string[] = [];
    for (const u of [site, site.replace(/\/$/, '') + '/contact', site.replace(/\/$/, '') + '/contact-us']) {
      found = emailsIn(await scrape(u));
      if (found.length) break;
      await sleep(600);
    }
    const bounced = (p.email || '').toLowerCase();
    const onDomain = found.filter((e) => e.endsWith('@' + own) && e !== bounced);
    const pick = onDomain[0] || (builder ? found.find((e) => e !== bounced) : undefined) || null;
    const verdict = pick ? 'ACCEPT' : found.length ? 'REVIEW (off-domain only)' : 'none';
    console.log(`${verdict}${pick ? ' ' + pick : ''}`);
    lines.push(`## ${p.name}  (${p.slug}) ${p.city}`, `Site: ${site}${p.email_bounced ? `  |  bounced: ${p.email}` : ''}`, `Found: ${found.join(', ') || 'none'}`, `Verdict: ${verdict}${pick ? ' -> ' + pick : ''}`, '');
    if (pick) {
      accepted++;
      if (WRITE) {
        const { error } = await sb.from('providers').update({ email: pick, email_bounced: false, email_source: `firecrawl harvest ${new Date().toISOString().slice(0, 10)}` }).eq('id', p.id);
        if (error) {
          // email_source may not exist on this schema; retry without it.
          const { error: e2 } = await sb.from('providers').update({ email: pick, email_bounced: false }).eq('id', p.id);
          if (!e2) written++; else lines.push(`WRITE FAILED: ${e2.message}`);
        } else written++;
      }
    }
    flush();
    await sleep(600);
  }
  lines.push('', `Accepted: ${accepted} of ${targets.length}${WRITE ? `, written: ${written}` : ''}`);
  flush();
  console.log(`\nAccepted ${accepted} of ${targets.length}${WRITE ? `, written ${written}` : ''}. Report: ${OUT}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
