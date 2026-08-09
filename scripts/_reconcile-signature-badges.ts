/**
 * _reconcile-signature-badges.ts  (2026-08)
 *
 * The two Signature Beauty Lounge clinics carried safety_verified=true with
 * blank attestations and no review (status null). The isSafetyVerified() helper
 * now hides their badge everywhere (display fixed). This reconcile puts them
 * into the /admin/badge-reviews queue as "completion requested" so their
 * re-review + email path exists, by setting safety_review_status='incomplete'
 * (the value /admin/badge-reviews renders as "completion requested").
 *
 * It does NOT touch safety_verified (left intact + reversible) and does NOT
 * touch Blue Cypress or Refresh Med Spa LA, which stay held under the US pause.
 *
 * Run:  npx tsx scripts/_reconcile-signature-badges.ts         (dry run)
 *       npx tsx scripts/_reconcile-signature-badges.ts --write (apply)
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';

const write = process.argv.includes('--write');
const SLUGS = ['signature-beauty-lounge-richmond-hill', 'signature-beauty-lounge-downtown-toronto'];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function main() {
  const { data, error } = await supabase
    .from('providers')
    .select('slug,name,country,safety_verified,safety_review_status')
    .in('slug', SLUGS);
  if (error) throw new Error(error.message);

  for (const p of data || []) {
    console.log(`${p.name} (${p.country}) | safety_verified=${p.safety_verified} status=${JSON.stringify(p.safety_review_status)}`);
    if (p.country !== 'Canada') {
      console.log('  SKIP: not Canadian (US clinics stay held).');
      continue;
    }
    if (!write) { console.log("  [dry run] would set safety_review_status='incomplete' (queue: completion requested)"); continue; }
    const { error: e2 } = await supabase
      .from('providers')
      .update({ safety_review_status: 'incomplete', safety_review_requested_at: new Date().toISOString() })
      .eq('slug', p.slug);
    console.log(e2 ? `  ERROR: ${e2.message}` : "  set safety_review_status='incomplete' -> now in /admin/badge-reviews as completion requested");
  }
  if (!write) console.log('\n[dry run] no writes. Re-run with --write to apply.');
}

main().catch((e) => { console.error(e); process.exit(1); });
