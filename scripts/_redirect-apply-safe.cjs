/**
 * Apply the SAFE redirect URL updates from redirect-categorize-plan.json.
 * Adds enhanced-body-medical-dunedin manually since it's the operator's
 * own "typo fix" example and the categorizer's similarity heuristic
 * didn't catch it.
 *
 * For each provider: UPDATE website = finalUrl. JSON receipt with
 * before/after written for reversibility.
 *
 * Never deletes. Never modifies anything outside the website column.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Manually-promoted SAFE entries (operator's own examples that the heuristic
// classifier marked judgment because the brand-token Levenshtein wasn't tight
// enough).
const MANUAL_SAFE_SLUGS = new Set([
  'enhanced-body-medical-dunedin',
]);

(async () => {
  const planPath = path.join('scripts', '_receipts', 'redirect-categorize-plan.json');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

  // Pull operator-promoted entries out of judgment, push into safe.
  const promoted = plan.judgment.filter((j) => MANUAL_SAFE_SLUGS.has(j.slug));
  const finalSafe = [...plan.safe, ...promoted.map((p) => ({ ...p, _reason: 'operator example: typo fix' }))];
  const finalJudgment = plan.judgment.filter((j) => !MANUAL_SAFE_SLUGS.has(j.slug));

  const receipt = { phase: 'redirect-apply-safe', timestamp: new Date().toISOString(), updated: [], judgment: finalJudgment };

  for (const item of finalSafe) {
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
      console.log('  = ' + item.slug + ' already at final URL, skipping');
      continue;
    }
    const { error } = await sb
      .from('providers')
      .update({ website: item.finalUrl })
      .eq('id', before.id);
    if (error) {
      console.log('  ! ' + item.slug + ' update failed: ' + error.message);
      continue;
    }
    receipt.updated.push({
      slug: item.slug,
      before: before.website,
      after: item.finalUrl,
      reason: item._reason,
    });
    console.log('  ✓ ' + item.slug);
    console.log('      ' + before.website + '  ->  ' + item.finalUrl);
  }

  console.log();
  console.log('Updated: ' + receipt.updated.length);
  console.log('Flagged for operator review: ' + finalJudgment.length);

  const outPath = path.join('scripts', '_receipts', 'redirect-apply-safe-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt:', outPath);
})();
