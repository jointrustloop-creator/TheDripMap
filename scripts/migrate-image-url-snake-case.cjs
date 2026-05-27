// Copies camelCase imageUrl → snake_case image_url for any provider that
// has imageUrl populated but image_url NULL. Leaves both columns in place
// (the camelCase DROP is a manual ALTER TABLE — out of scope here).

require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Find candidates first so we can report exact count
  const { data: candidates, error: selErr } = await s.from('providers')
    .select('id, slug, imageUrl')
    .not('imageUrl', 'is', null)
    .is('image_url', null)
    .limit(1000);
  if (selErr) { console.error('Select error:', selErr.message); process.exit(1); }
  console.log(`Candidates to migrate: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log('Nothing to migrate. Done.');
    return;
  }

  // Update in batches of 50 (avoid huge .in() lists)
  let updated = 0, failed = 0;
  const BATCH = 50;
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    for (const row of batch) {
      const { error } = await s.from('providers')
        .update({ image_url: row.imageUrl })
        .eq('id', row.id);
      if (error) {
        console.error(`  ✗ ${row.slug}: ${error.message}`);
        failed++;
      } else {
        updated++;
      }
    }
    console.log(`  …${Math.min(i + BATCH, candidates.length)}/${candidates.length}`);
  }

  console.log(`\n✓ Migrated ${updated} rows, ${failed} failed`);

  // Verify
  const { count: remaining } = await s.from('providers').select('id', { count: 'exact', head: true })
    .not('imageUrl', 'is', null).is('image_url', null);
  console.log(`Remaining un-migrated: ${remaining}`);
})();
