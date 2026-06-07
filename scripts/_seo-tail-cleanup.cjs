/**
 * Tail cleanup for the 14 SEO issues remaining after the META + INTERNAL
 * passes.
 *
 * INTERNAL: 11 posts have 2 internal links and need a 3rd. Add a
 * "Browse Canadian IV clinics in your city" link (or US equivalent if
 * the post is US-targeted) that augments the existing related section.
 *
 * META: 3 posts have meta_title just over 70 chars. Trim further to
 * <=60.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function trimMetaTitle(t, cap = 60) {
  if (!t || t.length <= cap) return t;
  const sepIdx = Math.max(t.lastIndexOf(' - '), t.lastIndexOf(' | '));
  if (sepIdx > 0 && sepIdx < cap) {
    const suffix = t.slice(sepIdx);
    const headRoom = cap - suffix.length;
    return (t.slice(0, headRoom).replace(/\s+\S*$/, '').trim()) + suffix;
  }
  return t.slice(0, cap).replace(/\s+\S*$/, '').trim();
}

const INTERNAL_FIX = [
  'how-to-start-iv-therapy-business-2026',
  'iv-therapy-laws-by-state-2026',
  'how-much-does-it-cost-to-open-iv-therapy-clinic',
  'hsa-fsa-iv-therapy-reimbursement-united-states',
  'how-to-get-patients-iv-therapy-clinic-without-ads',
  'how-to-find-medical-director-iv-therapy-clinic',
  '7-questions-before-iv-therapy',
  'is-iv-therapy-a-scam-what-the-science-says',
  'b12-iv-vs-b12-injection-comparison',
  'canadian-iv-clinic-regulations-2026',
  'ozone-iv-therapy-guide',
];
const META_FIX = ['best-iv-therapy-san-francisco-2026', 'saline-iv-therapy-at-home-guide', 'best-iv-therapy-montreal-2026'];

(async () => {
  const receipt = { phase: 'seo-tail-cleanup', timestamp: new Date().toISOString(), internal: [], meta: [], errors: [] };

  // INTERNAL: append a city-level link inside the existing Related section.
  console.log('=== INTERNAL TAIL ===');
  for (const slug of INTERNAL_FIX) {
    const { data: row } = await sb.from('blog_posts').select('id, content').eq('slug', slug).maybeSingle();
    if (!row) continue;
    const c = row.content || '';
    const relMatch = c.match(/## Related on TheDripMap\n\n((?:- \[[^\]]+\]\([^)]+\)\n)+)/);
    if (!relMatch) {
      console.log('!! ' + slug + ' (no Related section, skipping)');
      continue;
    }
    const block = relMatch[0];
    const slugLc = slug.toLowerCase();
    const isCanadian = /canadian|canada|toronto|vancouver|calgary|edmonton|ottawa|montreal|ontario|quebec|alberta/.test(slugLc);
    const newLink = isCanadian
      ? '- [Browse Canadian IV therapy cities](https://www.thedripmap.com/cities/)\n'
      : '- [Browse US IV therapy cities](https://www.thedripmap.com/cities/)\n';
    // Skip if already present
    if (block.includes(newLink.trim())) {
      console.log('= ' + slug + ' (link already present)');
      continue;
    }
    // Insert at the end of the list block (right before the trailing \n)
    const newBlock = block.replace(/(\n+)$/, '\n' + newLink + '$1');
    const newContent = c.replace(block, newBlock);
    const { error } = await sb.from('blog_posts').update({
      content: newContent,
      last_updated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }).eq('id', row.id);
    if (error) { console.log('!! ' + slug + ': ' + error.message); receipt.errors.push({ slug, op: 'internal', error: error.message }); continue; }
    receipt.internal.push({ slug, link_added: newLink.trim() });
    console.log('+ ' + slug.padEnd(56) + ' added /cities/');
  }

  // META: tighter title trim to <=60
  console.log();
  console.log('=== META TAIL ===');
  for (const slug of META_FIX) {
    const { data: row } = await sb.from('blog_posts').select('id, meta_title').eq('slug', slug).maybeSingle();
    if (!row || !row.meta_title) continue;
    const trimmed = trimMetaTitle(row.meta_title, 60);
    if (trimmed === row.meta_title) {
      console.log('= ' + slug + ' (already within cap)');
      continue;
    }
    const { error } = await sb.from('blog_posts').update({
      meta_title: trimmed,
      metaTitle: trimmed,
      last_updated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }).eq('id', row.id);
    if (error) { console.log('!! ' + slug + ': ' + error.message); receipt.errors.push({ slug, op: 'meta', error: error.message }); continue; }
    receipt.meta.push({ slug, title_before: row.meta_title.length, title_after: trimmed.length });
    console.log('+ ' + slug.padEnd(56) + ' title ' + row.meta_title.length + '->' + trimmed.length);
  }

  console.log();
  console.log('INTERNAL: ' + receipt.internal.length + ' | META: ' + receipt.meta.length + ' | Errors: ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'seo-tail-cleanup-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
