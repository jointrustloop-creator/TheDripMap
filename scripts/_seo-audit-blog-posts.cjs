/**
 * Full SEO audit of every blog post in blog_posts.
 *
 * Categories:
 *   META          meta_title (50-60 char target), meta_description
 *                 (150-160 char target), excerpt presence, image_url
 *                 present + reachable.
 *   SCHEMA        FAQPage auto-parser would extract Q/A pairs (>=3),
 *                 no literal <script> blocks in content.
 *   STRUCTURE     h2 count (>=4), h3 count, leading prose paragraph,
 *                 word count (>=800), no em-dashes/en-dashes, no
 *                 leftover "directory" wording.
 *   INTERNAL      at least 3 internal links to /clinics, /cities,
 *                 /treatments, /search.
 *   CANADA        For posts whose slug or title references a Canadian
 *                 city/topic: contains "CONO", "CCHPBC", "CNDA",
 *                 "CRNA", "BCCNM", "OIIQ", "CAD" or "Canada" mentions.
 *   HYGIENE      no "fabricated quote" pattern (a `"..."` sentence
 *                 followed by paraphrased attribution).
 *
 * Output: per-post issue list + summary + receipt JSON.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const CA_CITIES = ['toronto', 'vancouver', 'calgary', 'edmonton', 'ottawa', 'montreal', 'winnipeg', 'halifax', 'mississauga', 'brampton', 'markham', 'oakville', 'burlington', 'hamilton', 'north-york', 'richmond-hill', 'yorkville', 'canada', 'canadian', 'gta', 'ontario', 'quebec', 'alberta', 'british-columbia'];

function wordCount(s) {
  return (s || '').trim().split(/\s+/).filter(Boolean).length;
}

function isCanadaPost(p) {
  const s = (p.slug + ' ' + (p.title || '')).toLowerCase();
  return CA_CITIES.some((c) => s.includes(c));
}

function countH(content, level) {
  // Match ^## (h2) or ^### (h3) etc at start of line
  const re = new RegExp('^' + '#'.repeat(level) + '\\s', 'gm');
  return (content.match(re) || []).length;
}

function countInternalLinks(content) {
  // Match markdown links to relative paths starting with /clinics, /cities, /treatments, /search, /for-clinics, /symptoms.
  // Allow the path segment to be followed by /, ?, ), or # so that "/search)" and "/search?q=..." also count.
  const re = /\]\((https?:\/\/(www\.)?thedripmap\.com)?\/(clinics|cities|treatments|search|for-clinics|symptoms|iv-therapy|tools|blog|resources)(\/|\?|\)|#)/g;
  return (content.match(re) || []).length;
}

function countFaqQAs(content) {
  const faqStartMatch = content.match(/##\s+Frequently asked questions[\s\S]*$/i);
  if (!faqStartMatch) return 0;
  const faqBlock = faqStartMatch[0];
  const qaPattern = /###\s+([^\n]+)\n+([\s\S]+?)(?=\n###\s+|\n##\s+|<!--|$)/g;
  let count = 0;
  let m;
  while ((m = qaPattern.exec(faqBlock)) !== null) count++;
  return count;
}

function auditPost(p) {
  const c = p.content || '';
  const issues = [];

  // META
  if (!p.meta_title) issues.push({ cat: 'META', sev: 'high', msg: 'meta_title missing' });
  else if (p.meta_title.length < 30) issues.push({ cat: 'META', sev: 'med', msg: 'meta_title too short (' + p.meta_title.length + ' chars; aim 50-60)' });
  else if (p.meta_title.length > 70) issues.push({ cat: 'META', sev: 'med', msg: 'meta_title too long (' + p.meta_title.length + ' chars; aim 50-60)' });

  if (!p.meta_description) issues.push({ cat: 'META', sev: 'high', msg: 'meta_description missing' });
  else if (p.meta_description.length < 110) issues.push({ cat: 'META', sev: 'med', msg: 'meta_description short (' + p.meta_description.length + ' chars; aim 150-160)' });
  else if (p.meta_description.length > 180) issues.push({ cat: 'META', sev: 'med', msg: 'meta_description long (' + p.meta_description.length + ' chars; aim 150-160)' });

  if (!p.excerpt) issues.push({ cat: 'META', sev: 'med', msg: 'excerpt missing' });
  if (!p.image_url) issues.push({ cat: 'META', sev: 'med', msg: 'image_url missing (no hero image)' });

  // SCHEMA
  const hasLiteralScript = /<script\s+type="application\/ld\+json">/i.test(c);
  if (hasLiteralScript) issues.push({ cat: 'SCHEMA', sev: 'high', msg: 'literal <script ld+json> block in body (renders visible)' });
  const faqCount = countFaqQAs(c);
  if (/##\s+Frequently asked questions/i.test(c) && faqCount === 0) issues.push({ cat: 'SCHEMA', sev: 'high', msg: 'has FAQ heading but parser extracts 0 Q/A (likely bold-Q format)' });
  if (faqCount > 0 && faqCount < 3) issues.push({ cat: 'SCHEMA', sev: 'low', msg: 'only ' + faqCount + ' FAQ Q/A (aim 4-6 for richer schema)' });

  // STRUCTURE
  const wc = wordCount(c);
  if (wc < 600) issues.push({ cat: 'STRUCTURE', sev: 'high', msg: 'short post (' + wc + ' words; aim 800+)' });
  else if (wc < 800) issues.push({ cat: 'STRUCTURE', sev: 'low', msg: 'short-ish (' + wc + ' words; aim 800+)' });
  const h2 = countH(c, 2);
  if (h2 < 4) issues.push({ cat: 'STRUCTURE', sev: 'med', msg: 'few h2 sections (' + h2 + '; aim 4+)' });
  if (countH(c, 1) > 0) issues.push({ cat: 'STRUCTURE', sev: 'med', msg: 'h1 in content body (page title is the h1; body should start at h2)' });
  if (/[—–]/.test(c)) issues.push({ cat: 'STRUCTURE', sev: 'med', msg: 'contains em-dash or en-dash (operator rule: ASCII only)' });
  if (/\bdirectory\b/i.test(c)) issues.push({ cat: 'STRUCTURE', sev: 'low', msg: 'still contains "directory" word' });

  // INTERNAL LINKS
  const links = countInternalLinks(c);
  if (links < 3) issues.push({ cat: 'INTERNAL', sev: 'med', msg: 'only ' + links + ' internal links (aim 3+)' });

  // CANADA POSTS
  if (isCanadaPost(p)) {
    const regulators = ['CONO', 'CNO', 'CCHPBC', 'BCCNM', 'CNDA', 'CRNA', 'OIIQ'];
    const hasReg = regulators.some((r) => c.includes(r));
    if (!hasReg && /regulat|license|legal|administer/i.test(c)) {
      issues.push({ cat: 'CANADA', sev: 'low', msg: 'CA-targeted post discusses regulation but names no provincial regulator (CONO/CCHPBC/CNDA/CRNA/BCCNM/CNO/OIIQ)' });
    }
    const cadMentions = (c.match(/\$\d|CAD|Canadian dollar/g) || []).length;
    if (/pric|cost|fee/i.test(c) && cadMentions === 0) {
      issues.push({ cat: 'CANADA', sev: 'low', msg: 'CA-targeted post discusses pricing but uses no CAD or $ figures' });
    }
  }

  // HYGIENE - fabricated quote sniff (quote followed by attribution + year)
  const fabPattern = /"[^"]+"\s+(?:in|from|of)?\s*\d{4}/;
  if (fabPattern.test(c)) {
    const sample = (c.match(fabPattern) || [''])[0].slice(0, 100);
    issues.push({ cat: 'HYGIENE', sev: 'low', msg: 'possible verbatim-quote-with-year pattern (' + sample + '...)' });
  }

  return issues;
}

(async () => {
  const { data: all } = await sb.from('blog_posts').select('id, slug, title, content, excerpt, meta_title, meta_description, image_url, category, date').range(0, 999);
  console.log('Auditing ' + all.length + ' blog posts...');
  console.log();

  const results = [];
  let clean = 0;
  const byCat = { META: 0, SCHEMA: 0, STRUCTURE: 0, INTERNAL: 0, CANADA: 0, HYGIENE: 0 };
  const bySev = { high: 0, med: 0, low: 0 };
  for (const p of all) {
    const issues = auditPost(p);
    if (issues.length === 0) clean++;
    else {
      for (const i of issues) {
        byCat[i.cat] = (byCat[i.cat] || 0) + 1;
        bySev[i.sev] = (bySev[i.sev] || 0) + 1;
      }
    }
    results.push({ slug: p.slug, title: p.title, isCA: isCanadaPost(p), issues });
  }

  // Highest-severity-first report
  console.log('=== SUMMARY ===');
  console.log('Posts audited: ' + all.length);
  console.log('Posts clean (no issues): ' + clean);
  console.log('Issues by severity: high=' + bySev.high + '  med=' + bySev.med + '  low=' + bySev.low);
  console.log('Issues by category:');
  for (const [c, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) console.log('  ' + c.padEnd(12) + ' ' + n);
  console.log();

  // High-severity drill-down
  console.log('=== HIGH SEVERITY ===');
  const highPosts = results.filter((r) => r.issues.some((i) => i.sev === 'high'));
  for (const r of highPosts.slice(0, 50)) {
    const highIs = r.issues.filter((i) => i.sev === 'high');
    console.log('  ' + r.slug);
    for (const i of highIs) console.log('     [' + i.cat + '] ' + i.msg);
  }
  if (highPosts.length > 50) console.log('  ...and ' + (highPosts.length - 50) + ' more high-severity posts');
  console.log();

  // CA-specific issues
  console.log('=== CA-SPECIFIC ISSUES ===');
  const caIssues = results.filter((r) => r.isCA && r.issues.some((i) => i.cat === 'CANADA'));
  for (const r of caIssues.slice(0, 40)) {
    const caIs = r.issues.filter((i) => i.cat === 'CANADA');
    console.log('  ' + r.slug);
    for (const i of caIs) console.log('     ' + i.msg);
  }
  if (caIssues.length > 40) console.log('  ...and ' + (caIssues.length - 40) + ' more CA-flagged posts');
  console.log();

  // Schema issues drill
  console.log('=== SCHEMA ISSUES (FAQ missed / literal script residue) ===');
  const schemaPosts = results.filter((r) => r.issues.some((i) => i.cat === 'SCHEMA' && i.sev === 'high'));
  for (const r of schemaPosts) {
    const sIs = r.issues.filter((i) => i.cat === 'SCHEMA');
    console.log('  ' + r.slug);
    for (const i of sIs) console.log('     ' + i.msg);
  }
  if (schemaPosts.length === 0) console.log('  None.');
  console.log();

  // Save receipt
  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'seo-audit-blog-posts-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify({ summary: { audited: all.length, clean, bySev, byCat }, results }, null, 2));
  console.log('Receipt: ' + outPath);
})();
