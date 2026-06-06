/**
 * Apply the 5 redirects the operator explicitly greenlit on 2026-06-06.
 *
 * These were in the JUDGMENT bucket from the original categorizer because
 * the brand-token check wasn't tight enough. Operator confirmed they are
 * same-business clean rebrands / domain changes.
 *
 * Reads finalUrl from the original Tier 2 scan receipt, writes a fresh
 * receipt with before/after per row.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const GREENLIT = [
  'modern-laser-medispa-moncton',
  'radiance-east-bay-aesthetics-pleasanton',
  'san-diego-iv-mobile-iv-therapy-san-diego',
  'thrive-natural-health-selkirk-naturopathic-maple-ridge',
  'thrive-wellness-center-sioux-city',
];

function latestScan() {
  const dir = path.join('scripts', '_receipts');
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('tier-2-link-scan-')).sort();
  return JSON.parse(fs.readFileSync(path.join(dir, files[files.length - 1]), 'utf8'));
}

(async () => {
  const scan = latestScan();
  const targets = scan.flagged.filter((r) => GREENLIT.includes(r.slug));
  console.log('Resolved', targets.length, 'of', GREENLIT.length, 'greenlit slugs in scan receipt');

  const receipt = { phase: 'redirect-apply-operator-greenlit', timestamp: new Date().toISOString(), updated: [] };
  for (const item of targets) {
    const { data: before } = await sb
      .from('providers')
      .select('id, slug, website')
      .eq('slug', item.slug)
      .single();
    if (!before) {
      console.log('  - ' + item.slug + ' NOT FOUND, skipping');
      continue;
    }
    if (before.website === item.finalUrl) {
      console.log('  = ' + item.slug + ' already at final URL');
      continue;
    }
    const { error } = await sb.from('providers').update({ website: item.finalUrl }).eq('id', before.id);
    if (error) {
      console.log('  ! ' + item.slug + ' update failed: ' + error.message);
      continue;
    }
    receipt.updated.push({ slug: item.slug, before: before.website, after: item.finalUrl });
    console.log('  ✓ ' + item.slug);
    console.log('      ' + before.website + '  ->  ' + item.finalUrl);
  }

  const outDir = path.join('scripts', '_receipts');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'redirect-apply-operator-greenlit-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt:', outPath);
})();
