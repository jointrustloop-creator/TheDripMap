// One-off: upload the brand mark (pin + IV bag) variants to Supabase storage.
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const T = 'C:/Users/Dell/AppData/Local/Temp/';
const BUCKET = 'blog-images';
(async () => {
  for (const [local, key] of [
    ['largerlogo-mark.png', 'largerlogo-mark.png'],
    ['largerlogo-mark-white.png', 'largerlogo-mark-white.png'],
  ]) {
    const buf = fs.readFileSync(T + local);
    const { error } = await s.storage.from(BUCKET).upload(key, buf, { contentType: 'image/png', upsert: true, cacheControl: '31536000' });
    if (error) { console.log('FAIL', key, error.message); process.exit(1); }
    console.log('OK', key, `(${buf.length} bytes)`);
  }
})();
