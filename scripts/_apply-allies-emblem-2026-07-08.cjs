// Swap Allies Integrated Health logo from the wide wordmark to her square
// brand emblem (2026-07-08). The wordmark SVG (viewBox 273x37, 7.4:1) rendered
// as a thin strip in the 92px square logo slot and read as a "wrong/weird"
// logo. Her favicon asset is a clean square starburst emblem (626x600) that
// fills the slot correctly. Fetches it, safety-scans, uploads, updates the DB.
// Supersedes _apply-allies-logo-2026-07-08.cjs (which applied the wordmark).
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PROVIDER_ID = 'd8a1f9c0-1d50-443f-9a7d-9b7da600f2bb';
const SOURCE = 'https://alliesintegrated.health/wp-content/uploads/2025/02/Allies-Health-fav-icon.svg';
const BUCKET = 'blog-images';
const TARGET = 'allies-integrated-health-victoria-emblem.svg';
const PUBLIC_URL = `https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/${BUCKET}/${TARGET}`;

(async () => {
  const r = await fetch(SOURCE, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) { console.error('ABORT: fetch', r.status); process.exit(1); }
  const svg = await r.text();
  if (!/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)?<svg[\s>]/i.test(svg)) { console.error('ABORT: not an SVG'); process.exit(1); }
  if (/<\s*script[\s>]/i.test(svg) || /on(load|click|error|mouseover)\s*=/i.test(svg) || /javascript\s*:/i.test(svg) || /<\s*foreignObject/i.test(svg)) {
    console.error('ABORT: unsafe SVG'); process.exit(1);
  }
  console.log('emblem SVG safety scan: clean,', svg.length, 'bytes');

  const { data: before, error: e0 } = await supabase.from('providers').select('id, image_url, "imageUrl"').eq('id', PROVIDER_ID).single();
  if (e0 || !before) { console.error('ABORT: read', e0 && e0.message); process.exit(1); }
  console.log('BEFORE:', JSON.stringify(before));

  const up = await supabase.storage.from(BUCKET).upload(TARGET, Buffer.from(svg, 'utf8'), { contentType: 'image/svg+xml', upsert: true });
  if (up.error) { console.error('ABORT: upload', up.error.message); process.exit(1); }
  const head = await fetch(PUBLIC_URL, { method: 'HEAD' });
  if (!head.ok) { console.error('ABORT: public URL', head.status); process.exit(1); }

  const { data: upd, error: e1 } = await supabase.from('providers').update({ image_url: PUBLIC_URL, imageUrl: PUBLIC_URL }).eq('id', PROVIDER_ID).select('id');
  if (e1 || !upd || upd.length !== 1) { console.error('ABORT: update', e1 && e1.message); process.exit(1); }
  console.log('provider updated to emblem (1 row). Done:', PUBLIC_URL);
})();
