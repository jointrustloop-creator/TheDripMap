/**
 * _transparency-recompute.ts  (Transparency Score, 2026-08)
 *
 * Computes the Transparency Score for EVERY provider from raw rows and writes
 * transparency_score + transparency_checks + transparency_scored_at back to the
 * providers table. This is the nightly + on-demand recompute (the /finish route
 * recomputes a single provider inline on save; this does the whole set).
 *
 * Run:  npx tsx scripts/_transparency-recompute.ts            (write mode)
 *       npx tsx scripts/_transparency-recompute.ts --dry      (report only)
 *       npx tsx scripts/_transparency-recompute.ts --dry --ca (CA distribution + spot checks)
 *
 * Imports the SAME computeTransparencyScore the app uses, so stored scores can
 * never drift from rendered ones.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
import { computeTransparencyScore, verifiedPrescriber } from '../src/lib/transparency-score';

const dry = process.argv.includes('--dry');
const caOnly = process.argv.includes('--ca');
// --verify: the E2E assertion for the 2026-08-16 prescriber gate. Reads what is
// actually STORED (what every render surface displays) and fails loudly if any
// listing shows 7/7 without an operator-verified prescriber. Exit code 1 on a
// violation so it can gate a deploy.
const verify = process.argv.includes('--verify');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function fetchAll() {
  const rows: Record<string, unknown>[] = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .range(from, from + page - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...(data as Record<string, unknown>[]));
    if (data.length < page) break;
    from += page;
  }
  return rows;
}

async function main() {
  const all = await fetchAll();
  const active = all.filter((p) => !p.is_hidden);

  if (verify) {
    // Assert against the STORED value, not a fresh computation: surfaces render
    // the stored column, so a stale-high stored score is exactly the failure
    // this check exists to catch.
    const storedSevens = active.filter((p) => Number(p.transparency_score) === 7);
    const illegal = storedSevens.filter((p) => verifiedPrescriber(p) === null);
    const legal = storedSevens.filter((p) => verifiedPrescriber(p) !== null);
    console.log(`Active listings: ${active.length}`);
    console.log(`Stored 7/7: ${storedSevens.length} (verified prescriber: ${legal.length}, WITHOUT: ${illegal.length})`);
    for (const p of legal) console.log(`  OK   ${p.slug} — ${verifiedPrescriber(p)!.name}, reg# ${verifiedPrescriber(p)!.regNum}`);
    for (const p of illegal) console.log(`  FAIL ${p.slug} — displays 7/7 with no verified prescriber`);
    // Drift check: stored vs computed, which would mean a recompute is overdue.
    const drift = active.filter((p) => typeof p.transparency_score === 'number'
      && p.transparency_score !== computeTransparencyScore(p).score);
    console.log(`Stored-vs-computed drift: ${drift.length}${drift.length ? ' (run without --verify to rewrite)' : ''}`);
    for (const p of drift.slice(0, 20)) {
      console.log(`  drift ${p.slug}: stored=${p.transparency_score} computed=${computeTransparencyScore(p).score}`);
    }
    if (illegal.length > 0) {
      console.log('\nVERIFY FAILED: listings render 7/7 without an operator-verified prescriber.');
      process.exit(1);
    }
    console.log('\nVERIFY PASSED: no listing renders 7/7 without an operator-verified prescriber.');
    return;
  }
  const ca = active.filter((p) => p.country === 'Canada');
  const scope = caOnly ? ca : active;

  // Distribution 0..7.
  const dist = new Array(8).fill(0);
  for (const p of scope) dist[computeTransparencyScore(p).score]++;

  console.log(`Scope: ${caOnly ? 'Canada active' : 'all active'} = ${scope.length} listings`);
  console.log('Score distribution (0..7):');
  for (let i = 0; i <= 7; i++) {
    const bar = '#'.repeat(Math.round((dist[i] / Math.max(1, scope.length)) * 40));
    console.log(`  ${i}/7  ${String(dist[i]).padStart(4)}  ${bar}`);
  }
  const claimed = scope.filter((p) => p.is_claimed);
  const avg = (set: Record<string, unknown>[]) =>
    set.length ? (set.reduce((n, p) => n + computeTransparencyScore(p).score, 0) / set.length).toFixed(2) : 'n/a';
  console.log(`Average score: all ${avg(scope)} | claimed ${avg(claimed)} | unclaimed ${avg(scope.filter((p) => !p.is_claimed))}`);

  if (caOnly) {
    // Spot check: 5 clinics, full check breakdown.
    const named = ['aafiyat-aesthetics-mississauga', 'knead-therapy-clinic-nanaimo', 'bay-wellness-centre-vancouver'];
    const extras = ca.filter((p) => !p.is_claimed).slice(0, 2).map((p) => p.slug as string);
    const spotSlugs = [...named, ...extras];
    console.log('\n=== SPOT CHECK (manual verification) ===');
    for (const slug of spotSlugs) {
      const p = ca.find((x) => x.slug === slug);
      if (!p) { console.log(`  MISSING ${slug}`); continue; }
      const r = computeTransparencyScore(p);
      console.log(`\n  ${p.name} (${p.city}) [${p.is_claimed ? 'claimed' : 'unclaimed'}] -> ${r.score}/7`);
      for (const c of r.checks) console.log(`     ${c.passed ? 'PASS' : 'miss'}  ${c.label}`);
    }
  }

  if (dry) {
    console.log('\n[dry run] no writes.');
    return;
  }

  // Write mode: persist score + checks.
  let written = 0;
  let colMissing = false;
  for (const p of all) {
    const r = computeTransparencyScore(p);
    const { error } = await supabase
      .from('providers')
      .update({
        transparency_score: r.score,
        transparency_checks: r.checks,
        transparency_scored_at: new Date().toISOString(),
      })
      .eq('id', p.id as string);
    if (error) {
      if (/column|schema cache|could not find/i.test(error.message)) { colMissing = true; break; }
      console.error('  write error', p.slug, error.message);
    } else {
      written++;
    }
  }
  if (colMissing) {
    console.log('\n[BLOCKED] transparency_* columns not found. Paste scripts/sql/transparency-score.sql first.');
    return;
  }
  console.log(`\nWrote scores for ${written} providers.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
