/**
 * Retroactive badge reconciliation (2026-07-25).
 * Safety Verified is now human-reviewed. Every badge granted by the old
 * auto-grant path (safety_verified=true with NO human review record) goes back
 * to pending: safety_verified -> false, safety_review_status -> 'pending'. The
 * badge stops rendering (render reads safety_verified) until the operator
 * approves it in /admin/badge-reviews.
 *
 * Run AFTER pasting scripts/create-badge-review-columns.sql.
 *   node scripts/_reconcile-badges.cjs           # DRY: list every affected clinic
 *   node scripts/_reconcile-badges.cjs --apply    # write (backs up first)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');
const BACKUP = path.join(__dirname, '..', '.audit-tmp', '_badge-reconcile-backup.json');

(async () => {
  // Detect whether the review columns exist yet.
  let hasReviewCols = true;
  {
    const { error } = await s.from('providers').select('safety_reviewed_at').limit(1);
    if (error && /safety_reviewed_at/.test(error.message || '')) hasReviewCols = false;
  }
  console.log(`review columns present: ${hasReviewCols}${hasReviewCols ? '' : ' (paste scripts/create-badge-review-columns.sql first to apply)'}`);

  const cols = 'id,name,slug,city,state,country,is_claimed,safety_verified' + (hasReviewCols ? ',safety_review_status,safety_reviewed_at,safety_reviewed_by' : '');
  const { data, error } = await s.from('providers').select(cols).eq('safety_verified', true);
  if (error) { console.log('FATAL', error.message); process.exit(1); }

  // Machine-granted = safety_verified true AND no human review record. Before the
  // columns exist, EVERY verified clinic is machine-granted (no reviewer path
  // could have run yet).
  const machineGranted = (data || []).filter((r) => !hasReviewCols || !r.safety_reviewed_at);
  console.log(`\nmachine-granted Safety Verified badges (no human review record): ${machineGranted.length}`);
  machineGranted.forEach((r) => console.log(`  ${r.is_claimed ? 'claimed' : 'UNCLAIMED'} | [${r.country}] ${r.name} (${[r.city, r.state].filter(Boolean).join(', ')})`));

  if (!APPLY) {
    console.log('\nDRY. Re-run with --apply to move these to pending (badge stops rendering until approved in /admin/badge-reviews). A backup is saved first.');
    return;
  }
  if (!hasReviewCols) { console.log('\nABORT: review columns missing. Paste create-badge-review-columns.sql, then re-run --apply.'); process.exit(1); }

  const backup = machineGranted.map((r) => ({ id: r.id, name: r.name, safety_verified: r.safety_verified, safety_review_status: r.safety_review_status || null }));
  fs.writeFileSync(BACKUP, JSON.stringify(backup, null, 1));
  console.log(`\nbacked up ${backup.length} rows -> ${BACKUP}`);

  let ok = 0;
  for (const r of machineGranted) {
    const { error: e } = await s.from('providers')
      .update({ safety_verified: false, safety_review_status: 'pending' })
      .eq('id', r.id);
    if (e) console.log(`  ERR ${r.name}: ${e.message}`); else ok++;
  }
  console.log(`\nRECONCILED ${ok}/${machineGranted.length} badges to pending. They now await approval in /admin/badge-reviews. Rollback: restore safety_verified from ${BACKUP}.`);
})().catch((e) => { console.log('FATAL', e.message); process.exit(1); });
