// One-shot migration: strip the leading "# Title" line from every blog post
// whose markdown content starts with one. The page template at
// app/blog/[slug]/page.tsx already renders post.title as the canonical <h1>
// above the hero image — a leading H1 in the markdown becomes a second <h1>
// rendered below the image, which is bad for SEO + visually redundant.

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function stripLeadingH1(content) {
  // Find the FIRST non-blank line. If it starts with "# " (a single # followed
  // by space and NOT "## "), drop that line and any consecutive blank lines
  // after it. Everything else is left exactly as-is.
  const lines = content.split('\n');
  let i = 0;
  // Skip leading blank lines (rare but possible)
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i >= lines.length) return content;
  const first = lines[i];
  if (!first.trim().startsWith('# ') || first.trim().startsWith('## ')) {
    return content; // first non-blank line is not an H1
  }
  // Drop that line + any blank lines immediately after it
  let j = i + 1;
  while (j < lines.length && lines[j].trim() === '') j++;
  return [...lines.slice(0, i), ...lines.slice(j)].join('\n');
}

(async () => {
  const { data, error } = await s.from('blog_posts').select('slug, title, content').order('slug');
  if (error) { console.error('Fetch failed:', error); process.exit(1); }

  let scanned = 0;
  let fixed = 0;
  let skipped = 0;
  const failures = [];

  for (const p of data || []) {
    scanned++;
    const before = String(p.content || '');
    const after = stripLeadingH1(before);
    if (after === before) {
      skipped++;
      continue;
    }
    // Defensive sanity check — the new first heading should be ## or some
    // non-heading line.
    const firstHeadingAfter = after.split('\n').find((l) => l.trim().startsWith('#'));
    const firstHeadingIsH2OrDeeper =
      !firstHeadingAfter ||
      firstHeadingAfter.trim().startsWith('## ') ||
      firstHeadingAfter.trim().startsWith('### ');
    if (!firstHeadingIsH2OrDeeper) {
      failures.push({ slug: p.slug, reason: 'after fix, first heading is still an H1: ' + firstHeadingAfter });
      continue;
    }
    const { error: updErr } = await s
      .from('blog_posts')
      .update({ content: after, last_updated: new Date().toISOString() })
      .eq('slug', p.slug);
    if (updErr) {
      failures.push({ slug: p.slug, reason: 'update failed: ' + updErr.message });
      continue;
    }
    fixed++;
    console.log(`  ✓ ${p.slug}`);
  }

  console.log('\n--- Summary ---');
  console.log('Scanned:', scanned);
  console.log('Fixed:  ', fixed);
  console.log('Skipped:', skipped, '(no leading H1)');
  if (failures.length) {
    console.log('Failures:', failures.length);
    failures.forEach((f) => console.log('  ✗', f.slug, '|', f.reason));
  }
})();
