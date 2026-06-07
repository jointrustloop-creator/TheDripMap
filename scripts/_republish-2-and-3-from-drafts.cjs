/**
 * Republish articles 2 and 3 to blog_posts using EXACT verbatim content
 * from the approved drafts in scripts/_drafts/. Does NOT regenerate.
 *
 * Extracts title, meta_title, meta_description, excerpt from the draft
 * file frontmatter; content is everything after the "---" divider.
 *
 * Does NOT touch articles 1, 4, or 5. Does NOT revalidate.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const NOW = new Date().toISOString();
const IMG_BASE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images';
const AUTHOR = 'TheDripMap Editorial Team';

const POSTS = [
  {
    slug: 'is-iv-therapy-a-scam-what-the-science-says',
    draft_file: 'scripts/_drafts/is-iv-therapy-a-scam-what-the-science-says.md',
    category: 'Treatment Guides',
    image_name: 'iv-therapy-vitamin-drip-citrus.jpg',
  },
  {
    slug: 'canadian-iv-clinic-regulations-2026',
    draft_file: 'scripts/_drafts/canadian-iv-clinic-regulations-2026.md',
    category: 'Treatment Guides',
    image_name: 'iv-therapy-clinical-medical-setting.jpg',
  },
];

function parseDraft(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const dividerIdx = raw.indexOf('\n---\n');
  if (dividerIdx === -1) throw new Error('No --- divider in ' + filePath);
  const header = raw.slice(0, dividerIdx);
  // Skip past divider + leading whitespace to body
  const body = raw.slice(dividerIdx + 5).replace(/^\s*\n/, '');

  // Pull title from the leading "# Title" line
  const titleMatch = header.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Pull excerpt
  const excerptMatch = header.match(/^_Excerpt:\s*([\s\S]+?)_$/m);
  const excerpt = excerptMatch ? excerptMatch[1].trim() : '';

  // Pull meta title
  const metaTitleMatch = header.match(/^_Meta title:\s*(.+?)_$/m);
  const meta_title = metaTitleMatch ? metaTitleMatch[1].trim() : '';

  // Pull meta description
  const metaDescMatch = header.match(/^_Meta description:\s*(.+?)_$/m);
  const meta_description = metaDescMatch ? metaDescMatch[1].trim() : '';

  return {
    title,
    excerpt,
    meta_title,
    meta_description,
    content: body.trimEnd(),
  };
}

(async () => {
  const receipt = {
    phase: 'republish-2-and-3-from-drafts',
    timestamp: NOW,
    republished: [],
    skipped_exists: [],
    errors: [],
  };

  for (const p of POSTS) {
    // Refuse to overwrite if a row exists (we deleted them earlier; this is safety)
    const { data: existing } = await sb.from('blog_posts').select('id, slug').eq('slug', p.slug).maybeSingle();
    if (existing) {
      console.log('= [slug exists, skipping safety] ' + p.slug);
      receipt.skipped_exists.push({ slug: p.slug });
      continue;
    }

    const parsed = parseDraft(p.draft_file);
    const imageUrl = IMG_BASE + '/' + p.image_name;

    const payload = {
      slug: p.slug,
      title: parsed.title,
      meta_title: parsed.meta_title,
      meta_description: parsed.meta_description,
      excerpt: parsed.excerpt,
      category: p.category,
      author: AUTHOR,
      image_url: imageUrl,
      date: NOW,
      last_updated: NOW,
      content: parsed.content,
      related_clinics: [],
      related_cities: [],
      metaTitle: parsed.meta_title,
      metaDescription: parsed.meta_description,
      imageUrl,
      authorImageUrl: null,
      reviewedBy: null,
      lastUpdated: NOW,
      relatedCities: [],
      relatedClinics: [],
    };

    const { data, error } = await sb.from('blog_posts').insert(payload).select('id, slug, title').single();
    if (error) {
      console.log('! ' + p.slug + ' failed: ' + error.message);
      receipt.errors.push({ slug: p.slug, error: error.message });
      continue;
    }
    receipt.republished.push({ id: data.id, slug: data.slug, title: data.title, content_chars: parsed.content.length });
    console.log('+ REPUBLISHED ' + p.slug + ' (id=' + data.id + ', ' + parsed.content.length + ' chars)');
  }

  console.log();
  console.log('Republished: ' + receipt.republished.length + ' | Skipped (already exists): ' + receipt.skipped_exists.length + ' | Errors: ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'republish-2-and-3-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
