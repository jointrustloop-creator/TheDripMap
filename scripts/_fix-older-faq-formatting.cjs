/**
 * Fix the 25 older blog posts where FAQ questions use "**Question?**"
 * (markdown bold) instead of "### Question?" (h3). The auto-FAQ-parser at
 * app/blog/[slug]/page.tsx:218-243 expects h3, so these posts silently
 * generate zero FAQPage JSON-LD.
 *
 * Programmatically identifies the affected posts by:
 *   - Has a "## Frequently Asked Questions" heading.
 *   - Parser would extract zero Q/A pairs from current content.
 *   - But there are bold-Q patterns in the FAQ section.
 *
 * Defensive: also strips any literal <script type="application/ld+json">
 * block if present (none expected in the older posts but cheap to handle).
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function verifyParser(content) {
  const faqStartMatch = content.match(/##\s+Frequently asked questions[\s\S]*$/i);
  if (!faqStartMatch) return { ok: false, qa_count: 0 };
  const faqBlock = faqStartMatch[0];
  const qaPattern = /###\s+([^\n]+)\n+([\s\S]+?)(?=\n###\s+|\n##\s+|<!--|$)/g;
  const qas = [];
  let m;
  while ((m = qaPattern.exec(faqBlock)) !== null) {
    const q = m[1].trim();
    const a = m[2].trim().replace(/\n+/g, ' ');
    if (q && a) qas.push({ q, a });
  }
  return { ok: qas.length > 0, qa_count: qas.length, qas };
}

function fixContent(content) {
  let out = content;
  const beforeLen = out.length;
  out = out.replace(/\s*<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*$/i, '\n');
  const stripped = beforeLen !== out.length;

  const faqHeadingRe = /(##\s+Frequently\s+Asked\s+Questions\s*\n+)/i;
  const faqHeadingMatch = out.match(faqHeadingRe);
  let qConverted = 0;
  if (faqHeadingMatch) {
    const idx = faqHeadingMatch.index + faqHeadingMatch[0].length;
    const before = out.slice(0, idx);
    let faqBody = out.slice(idx);
    faqBody = faqBody.replace(/^\*\*([^*\n]+\?)\*\*$/gm, (_full, q) => {
      qConverted++;
      return '### ' + q;
    });
    out = before + faqBody;
  }
  return { content: out, stripped, qConverted };
}

(async () => {
  const receipt = { phase: 'fix-older-faq', timestamp: new Date().toISOString(), updated: [], skipped: [], errors: [] };

  const { data: all } = await sb.from('blog_posts').select('id, slug, content, date').range(0, 999);
  console.log('Scanning ' + all.length + ' blog posts...');
  console.log();

  for (const p of all) {
    const c = p.content || '';
    // Identify: has FAQ heading, parser finds 0, but bold-Qs exist in FAQ section.
    const before = verifyParser(c);
    const faqHeadingMatch = c.match(/(##\s+Frequently\s+Asked\s+Questions\s*\n+)/i);
    if (!faqHeadingMatch) continue; // not affected
    if (before.qa_count > 0) continue; // already works
    const idx = faqHeadingMatch.index + faqHeadingMatch[0].length;
    const faqBody = c.slice(idx);
    const boldQs = (faqBody.match(/^\*\*[^*\n]+\?\*\*$/gm) || []).length;
    if (boldQs === 0) continue; // no bold Qs to convert

    const fix = fixContent(c);
    const verify = verifyParser(fix.content);
    if (!verify.ok) {
      console.log('!! ' + p.slug + ': parser still 0 after fix; skipping');
      receipt.errors.push({ slug: p.slug, reason: 'parser still 0 after fix' });
      continue;
    }

    const { error } = await sb.from('blog_posts').update({
      content: fix.content,
      last_updated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }).eq('id', p.id);
    if (error) {
      console.log('!! ' + p.slug + ': ' + error.message);
      receipt.errors.push({ slug: p.slug, error: error.message });
      continue;
    }
    receipt.updated.push({
      slug: p.slug,
      date: (p.date || '').slice(0, 10),
      stripped_literal_script: fix.stripped,
      bold_to_h3: fix.qConverted,
      qa_after: verify.qa_count,
    });
    console.log('+ ' + p.slug + ' (' + (p.date || '').slice(0, 10) + ')  bold_to_h3=' + fix.qConverted + '  qa_after=' + verify.qa_count + (fix.stripped ? '  [stripped <script>]' : ''));
  }

  console.log();
  console.log('Updated: ' + receipt.updated.length + ' | Errors: ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'fix-older-faq-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
