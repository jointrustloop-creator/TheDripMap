/**
 * Fast live-site audit (2026-09-20, Hubert: "bring any and all mistakes to
 * the front"). Fetches the key public pages and checks rendered text for the
 * error classes we have shipped before. Read-only. Writes
 * .audit-tmp/site-audit-<date>.md
 *
 *   npx tsx scripts/_site-audit-crawl.ts
 */
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';

const SITE = 'https://www.thedripmap.com';
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TheDripMap site audit (info@thedripmap.com)' };

const CHECKS: Array<{ id: string; re: RegExp; why: string }> = [
  { id: 'dash', re: /[–—]/, why: 'en/em dash in rendered copy (house style)' },
  { id: 'directory', re: /\bdirector(y|ies)\b/i, why: '"directory" wording (must be matching platform)' },
  { id: 'undefined', re: /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b(?![a-z])/, why: 'template leak' },
  { id: 'dollar0', re: /\$0\b|\$NaN|from \$undefined/, why: 'bad price' },
  { id: 'double-space-punct', re: /\s[,.]\s|\.\./, why: 'stray punctuation' },
  { id: 'claimed-verified', re: /Claimed (&|and) verified/i, why: 'retired wording' },
  { id: 'cure', re: /\b(cures?|cured|detox(ify|ification)?|anti-?aging)\b/i, why: 'claim language on the kill list' },
  { id: 'book-directly', re: /book directly|fill up fastest/i, why: 'retired promise' },
  { id: 'lorem', re: /lorem ipsum|\bTODO\b|\bFIXME\b|placeholder text/, why: 'placeholder' },
  { id: 'us-template', re: /cold and flu season, bouncing back from a hangover/i, why: 'US city template leaked into a CA page' },
  { id: 'empty-count', re: /\b0 clinics\b|Compare 0 /i, why: 'zero count rendered' },
  { id: 'template-visit', re: /Licensed clinical staff look after you|Most visits take about 30 to 60 minutes/i, why: 'generic first-visit template presented as clinic fact (audit C6-5)' },
  { id: 'template-faq', re: /designed for rapid recovery and cellular health/i, why: 'generic unclaimed FAQ template (audit C6-10)' },
  { id: 'medical-director-rn', re: /RN\s*[·|]\s*Medical Director/i, why: 'RN labelled Medical Director (audit C6-4)' },
];

function textOf(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');
}

async function main() {
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: claimed } = await s.from('providers').select('slug').eq('is_claimed', true).eq('is_hidden', false).eq('country', 'Canada');
  const { data: sample } = await s.from('providers').select('slug').eq('is_claimed', false).eq('is_hidden', false).eq('country', 'Canada').not('city', 'is', null).limit(400);
  const unclaimed = (sample || []).filter((_, i) => i % 40 === 0).map((r) => `/providers/${r.slug}`);
  const pages = [
    '/', '/cities', '/canada', '/about', '/deals', '/for-clinics', '/verification', '/search', '/explore', '/treatments', '/iv-prices', '/iv-prices/toronto', '/iv-prices/calgary', '/iv-prices/edmonton', '/canadian-iv-therapy-report', '/states/ontario', '/states/british-columbia', '/states/alberta', '/blog', '/faq', '/contact', '/get-matched', '/quiz',
    ...['toronto', 'mississauga', 'richmond-hill', 'vancouver', 'calgary', 'edmonton', 'ottawa', 'montreal', 'hamilton', 'winnipeg', 'burlington', 'richmond', 'bedford', 'victoria', 'halifax', 'london', 'brampton', 'markham', 'vaughan', 'oakville'].map((c) => `/cities/${c}`),
    ...['hydration', 'nad-plus', 'myers-cocktail', 'hangover', 'immune-support', 'beauty-glow', 'recovery', 'weight-loss', 'high-dose-vitamin-c', 'glutathione'].map((t) => `/treatments/${t}`),
    ...['nad-plus/toronto', 'myers-cocktail/vancouver', 'hydration/calgary', 'immune-support/ottawa'].map((x) => `/iv-therapy/${x}`),
    ...(claimed || []).map((r) => `/providers/${r.slug}`),
    ...unclaimed,
  ];
  const out: string[] = [`# Live site audit ${new Date().toISOString().slice(0, 10)}`, '', `${pages.length} pages`, ''];
  const summary: Record<string, number> = {};
  let bad = 0;
  for (const path of pages) {
    let html = ''; let status = 0;
    try { const r = await fetch(SITE + path, { headers: UA, redirect: 'manual' }); status = r.status; html = await r.text(); } catch (e) { out.push(`- ${path}: FETCH FAIL ${e instanceof Error ? e.message : e}`); bad++; continue; }
    if (status !== 200) { out.push(`- ${path}: HTTP ${status}`); bad++; continue; }
    const text = textOf(html);
    const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
    const hits: string[] = [];
    if (!title) hits.push('no <title>'); else if (title.length > 65) hits.push(`title ${title.length} chars`);
    if (!/<meta name="description"/i.test(html)) hits.push('no meta description');
    if (/<meta name="robots" content="[^"]*noindex/i.test(html) && !/\/(search|explore|compare|quiz|get-matched|contact)/.test(path)) hits.push('noindex');
    const h1s = (html.match(/<h1[\s>]/gi) || []).length; if (h1s !== 1) hits.push(`h1 count ${h1s}`);
    for (const c of CHECKS) {
      const m = text.match(c.re);
      if (m) { const i = text.indexOf(m[0]); hits.push(`${c.id}: "...${text.slice(Math.max(0, i - 60), i + 60).trim()}..."`); summary[c.id] = (summary[c.id] || 0) + 1; }
    }
    const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]).filter((u) => /^https?:/.test(u) && !/_next\/image|thedripmap\.com\/(logo|icon|images)/.test(u));
    let broken = 0;
    for (const u of imgs.slice(0, 6)) { try { const r = await fetch(u, { method: 'HEAD', headers: UA }); if (r.status >= 400) broken++; } catch { broken++; } }
    if (broken) hits.push(`${broken} broken image(s)`);
    if (hits.length) { bad++; out.push(`- ${path}${title ? ` ("${title.slice(0, 70)}")` : ''}`); for (const h of hits) out.push(`    - ${h}`); }
    await new Promise((r) => setTimeout(r, 250));
  }
  out.unshift(`Pages with findings: ${bad}. By check: ${JSON.stringify(summary)}`, '');
  fs.mkdirSync('.audit-tmp', { recursive: true });
  fs.writeFileSync(`.audit-tmp/site-audit-${new Date().toISOString().slice(0, 10)}.md`, out.join('\n'));
  console.log(out.slice(0, 2).join('\n'));
  console.log(out.filter((l) => l.startsWith('- ')).length, 'pages listed');
}
main().catch((e) => { console.error(e); process.exit(1); });
