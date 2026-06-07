require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await sb.from('blog_posts').select('id, slug, title, content, excerpt, meta_title, meta_description, metaTitle, metaDescription').range(0, 999);
  const re = /directory/i;
  const hits = [];
  for (const p of data) {
    const fields = { content: p.content, excerpt: p.excerpt, meta_title: p.meta_title, meta_description: p.meta_description, metaTitle: p.metaTitle, metaDescription: p.metaDescription };
    const hitFields = [];
    for (const [k, v] of Object.entries(fields)) {
      if (v && re.test(v)) {
        const matches = (v.match(/directory/gi) || []).length;
        hitFields.push({ field: k, count: matches });
      }
    }
    if (hitFields.length) hits.push({ slug: p.slug, title: p.title, fields: hitFields });
  }
  console.log('Total blog posts scanned: ' + data.length);
  console.log('Posts containing "directory" (case-insensitive): ' + hits.length);
  console.log();
  for (const h of hits) {
    console.log(h.slug);
    for (const f of h.fields) console.log('  ' + f.field + ': ' + f.count);
  }
  console.log();
  console.log('=== SAMPLE EXCERPTS OF EACH MATCH (one line of context) ===');
  for (const h of hits) {
    const { data: row } = await sb.from('blog_posts').select('content').eq('slug', h.slug).single();
    const lines = (row.content || '').split('\n');
    const matchLines = lines.filter((l) => /directory/i.test(l));
    console.log('--- ' + h.slug + ' (' + matchLines.length + ' lines) ---');
    for (const l of matchLines.slice(0, 30)) console.log('  ' + l.trim().slice(0, 220));
  }
})();
