// One-off: upload transparent + white logo variants to Supabase storage.
// Source PNGs are generated in the OS temp dir by the knockout/whitelogo steps.
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const T = 'C:/Users/Dell/AppData/Local/Temp/';
const BUCKET = 'blog-images';

(async () => {
  const files = [
    ['largerlogo-transparent.png', 'largerlogo-transparent.png'],
    ['largerlogo-white.png', 'largerlogo-white.png'],
  ];
  for (const [local, key] of files) {
    const buf = fs.readFileSync(T + local);
    const { error } = await s.storage.from(BUCKET).upload(key, buf, {
      contentType: 'image/png', upsert: true, cacheControl: '31536000',
    });
    if (error) { console.log('FAIL', key, error.message); process.exit(1); }
    const { data } = s.storage.from(BUCKET).getPublicUrl(key);
    console.log('OK', key, '->', data.publicUrl, `(${buf.length} bytes)`);
  }
})();
