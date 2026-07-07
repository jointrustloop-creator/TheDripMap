// B1 round 4 (2026-07-06) — GSC coverage drilldown showed the Toronto blog
// cluster partially unindexed (cannibalization). Survey found 2 city-topic
// posts with NO up-link to their city money page. This inserts one prominent
// blockquote link after the first paragraph of each. Backup first, idempotent,
// aborts if the post already links the city page.
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TARGETS = [
  {
    slug: 'myers-cocktail-toronto',
    cityPath: '/cities/toronto',
    block: `> **Comparing clinics?** See every verified IV therapy provider in Toronto, with Google ratings and typical prices, on our [Toronto IV therapy page](/cities/toronto).`,
  },
  {
    slug: 'iv-therapy-yorkville-toronto',
    cityPath: '/cities/toronto',
    block: `> **Comparing clinics?** Yorkville is one neighbourhood of a much bigger market. Browse every verified IV therapy provider in the city on our [Toronto IV therapy page](/cities/toronto).`,
  },
];

const BACKUP = path.join(__dirname, '_b1r4-toronto-uplinks-backup.json');

(async () => {
  const backup = { snapshotAt: new Date().toISOString(), backup: [] };
  for (const t of TARGETS) {
    const { data: row, error } = await s.from('blog_posts').select('slug,content').eq('slug', t.slug).single();
    if (error || !row) { console.error('ABORT: could not load', t.slug, error && error.message); process.exit(1); }
    if (row.content.includes(t.cityPath)) { console.log(t.slug, ': already links', t.cityPath, '- skip'); continue; }

    // Insert after the first paragraph: first double-newline that follows at
    // least 80 chars of body (skips the opening heading line).
    const firstHeadingEnd = row.content.indexOf('\n');
    let insertAt = row.content.indexOf('\n\n', firstHeadingEnd + 80);
    if (insertAt === -1) { console.error('ABORT: no paragraph break found in', t.slug); process.exit(1); }
    const updated = row.content.slice(0, insertAt) + '\n\n' + t.block + row.content.slice(insertAt);

    backup.backup.push({ slug: t.slug, original: row.content });
    fs.writeFileSync(BACKUP, JSON.stringify(backup, null, 1));

    const { error: e2, data: upd } = await s.from('blog_posts').update({ content: updated }).eq('slug', t.slug).select('slug');
    if (e2 || !upd || upd.length !== 1) { console.error('ABORT: update failed for', t.slug, e2 && e2.message); process.exit(1); }
    console.log(t.slug, ': up-link inserted (+' + (updated.length - row.content.length) + ' chars), backup saved');
  }
  console.log('Done. Backup:', BACKUP);
})();
