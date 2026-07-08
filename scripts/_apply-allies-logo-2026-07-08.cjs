// Apply Allies Integrated Health's real logo (2026-07-08). Owner claimed and
// verified 2026-07-07; the listing was rendering the initials monogram because
// enrichment left a stock Unsplash imageUrl, which the layout correctly
// refuses to show as a logo. Fetches the official SVG from her site, scans it
// for scripts/handlers, uploads to Supabase Storage, then updates
// image_url + imageUrl with a BEFORE snapshot printed for rollback.
// Pattern: scripts/_apply-5-clinic-logos.cjs (operator-approved 2026-06-12).
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PROVIDER_ID = 'd8a1f9c0-1d50-443f-9a7d-9b7da600f2bb';
const SOURCE = 'https://alliesintegrated.health/wp-content/uploads/2025/03/allies-integrated-health-logo.svg';
const BUCKET = 'blog-images';
const TARGET = 'allies-integrated-health-victoria-logo.svg';
const PUBLIC_URL = `https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/${BUCKET}/${TARGET}`;

(async () => {
  const r = await fetch(SOURCE, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) { console.error('ABORT: fetch', r.status); process.exit(1); }
  const svg = await r.text();
  console.log('fetched', svg.length, 'bytes');
  if (!/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)?<svg[\s>]/i.test(svg)) { console.error('ABORT: not an SVG'); process.exit(1); }
  if (/<\s*script[\s>]/i.test(svg) || /on(load|click|error|mouseover)\s*=/i.test(svg) || /javascript\s*:/i.test(svg) || /<\s*foreignObject/i.test(svg)) {
    console.error('ABORT: unsafe SVG content'); process.exit(1);
  }
  console.log('SVG safety scan: clean');

  const { data: before, error: e0 } = await supabase.from('providers').select('id, slug, image_url, "imageUrl"').eq('id', PROVIDER_ID).single();
  if (e0 || !before) { console.error('ABORT: read', e0 && e0.message); process.exit(1); }
  console.log('BEFORE:', JSON.stringify(before));

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(TARGET, Buffer.from(svg, 'utf8'), { contentType: 'image/svg+xml', upsert: true });
  if (upErr) { console.error('ABORT: upload', upErr.message); process.exit(1); }
  const head = await fetch(PUBLIC_URL, { method: 'HEAD' });
  if (!head.ok) { console.error('ABORT: public URL not readable', head.status); process.exit(1); }
  console.log('uploaded + publicly readable:', PUBLIC_URL);

  const { data: upd, error: e1 } = await supabase.from('providers')
    .update({ image_url: PUBLIC_URL, imageUrl: PUBLIC_URL })
    .eq('id', PROVIDER_ID).select('id');
  if (e1 || !upd || upd.length !== 1) { console.error('ABORT: update', e1 && e1.message, 'rows:', upd && upd.length); process.exit(1); }
  console.log('providers row updated (1 row). Done.');
})();
