/**
 * Fix the 4 blog posts I created today that have two FAQ-schema issues:
 *   1. Literal `<script type="application/ld+json">...</script>` block in
 *      the markdown body — ReactMarkdown renders this as visible text.
 *   2. FAQ questions formatted as `**Question?**` (bold) — the auto-FAQ
 *      parser at app/blog/[slug]/page.tsx:223 expects `### Question?` (h3),
 *      so no FAQPage JSON-LD is generated.
 *
 * Fix:
 *   - Strip the literal <script> block from the end of content.
 *   - Within the "## Frequently Asked Questions" section only, convert
 *     `**Question text?**\n<answer>` blocks to `### Question text?\n\n<answer>`.
 *
 * Verifies post-fix that the parser would now extract Q/A pairs.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const TODAY_SLUGS = [
  'best-iv-therapy-clinics-canada-2026',
  'is-iv-therapy-a-scam-what-the-science-says',
  'canadian-iv-clinic-regulations-2026',
  '7-questions-before-iv-therapy',
];

function fixContent(content) {
  let out = content;

  // 1. Strip the literal <script type="application/ld+json">...</script> block.
  //    (Match non-greedy from the opening to the closing tag, including
  //    surrounding whitespace.)
  const beforeLen = out.length;
  out = out.replace(/\s*<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*$/i, '\n');
  const stripped = beforeLen !== out.length;

  // 2. Within the FAQ section, convert `**Question?**\n<answer>` to
  //    `### Question?\n\n<answer>`. Limit the conversion to text AFTER the
  //    "## Frequently Asked Questions" heading so we don't accidentally
  //    upgrade any bold-question prose in the body.
  const faqHeadingRe = /(##\s+Frequently\s+Asked\s+Questions\s*\n+)/i;
  const faqHeadingMatch = out.match(faqHeadingRe);
  let qConverted = 0;
  if (faqHeadingMatch) {
    const idx = faqHeadingMatch.index + faqHeadingMatch[0].length;
    const before = out.slice(0, idx);
    let faqBody = out.slice(idx);
    // Pattern: lines that are exactly **Question text?** at the start of a
    // line (allowing leading whitespace). The question mark is required.
    faqBody = faqBody.replace(/^\*\*([^*\n]+\?)\*\*$/gm, (_full, q) => {
      qConverted++;
      return '### ' + q;
    });
    out = before + faqBody;
  }

  return { content: out, stripped, qConverted };
}

function verifyParser(content) {
  // Mirror the regex from app/blog/[slug]/page.tsx:218-243.
  const faqStartMatch = content.match(/##\s+Frequently asked questions[\s\S]*$/i);
  if (!faqStartMatch) return { ok: false, reason: 'no FAQ heading found' };
  const faqBlock = faqStartMatch[0];
  const qaPattern = /###\s+([^\n]+)\n+([\s\S]+?)(?=\n###\s+|\n##\s+|<!--|$)/g;
  const qas = [];
  let m;
  while ((m = qaPattern.exec(faqBlock)) !== null) {
    const q = m[1].trim();
    const a = m[2].trim().replace(/\n+/g, ' ');
    if (q && a) qas.push({ q, a: a.slice(0, 80) });
  }
  return { ok: qas.length > 0, qa_count: qas.length, qa_preview: qas };
}

(async () => {
  const receipt = { phase: 'fix-today-faq', timestamp: new Date().toISOString(), updated: [], skipped: [], errors: [] };

  for (const slug of TODAY_SLUGS) {
    const { data: row } = await sb.from('blog_posts').select('id, content').eq('slug', slug).maybeSingle();
    if (!row) {
      console.log('= [not in DB] ' + slug);
      receipt.skipped.push({ slug, reason: 'not in DB' });
      continue;
    }
    const original = row.content || '';
    const fix = fixContent(original);
    if (fix.content === original) {
      console.log('= [no changes needed] ' + slug);
      receipt.skipped.push({ slug, reason: 'no changes' });
      continue;
    }
    const verify = verifyParser(fix.content);
    console.log('+ ' + slug);
    console.log('    stripped_literal_script=' + fix.stripped + '  bold_to_h3_converted=' + fix.qConverted);
    console.log('    parser verify: ok=' + verify.ok + ' qa_count=' + (verify.qa_count || 0));
    if (!verify.ok) {
      console.log('    !! PARSER WOULD STILL MISS Q/A — skipping DB update');
      receipt.errors.push({ slug, reason: 'parser still fails', verify });
      continue;
    }
    const { error } = await sb.from('blog_posts').update({
      content: fix.content,
      last_updated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }).eq('id', row.id);
    if (error) {
      console.log('    !! DB update failed: ' + error.message);
      receipt.errors.push({ slug, error: error.message });
      continue;
    }
    receipt.updated.push({ slug, stripped: fix.stripped, q_converted: fix.qConverted, qa_count_after: verify.qa_count, qa_preview: verify.qa_preview });
  }

  console.log();
  console.log('Updated: ' + receipt.updated.length + ' | Skipped: ' + receipt.skipped.length + ' | Errors: ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'fix-today-faq-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
