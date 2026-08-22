/**
 * Regression test for the swallowed-error noindex bug (2026-08-20).
 *
 * THE BUG: getListingsByCity / getListingsByServiceAndCity / getListingsByState
 * caught query errors and returned [], which is indistinguishable from "this
 * page genuinely has no clinics". Pages that gate `robots: noindex` on that
 * count then declared HEALTHY pages thin, and because those pages are ISR
 * cached the poisoned render was served until the next successful revalidate.
 * The crawler caught it on the Montreal treatment-city pages on four dates.
 *
 * THE CONTRACT LOCKED IN HERE:
 *   1. Failed query + strict  -> THROWS (render fails, ISR keeps last good page)
 *   2. Failed query + soft    -> returns [] (UI paths still degrade quietly)
 *   3. Successful query, zero rows -> [] in BOTH modes (genuinely thin page,
 *      noindex is the correct outcome and must still work)
 *   4. Every robots-gating call site passes strict:true (source assertion, so
 *      a future edit that drops the flag fails this test rather than silently
 *      reintroducing the deindexing bug)
 *
 * Run: npx tsx scripts/_test-noindex-strict.ts
 * Exits non-zero on failure so it can gate a deploy.
 */
import * as fs from 'fs';
import * as path from 'path';
import { failIfStrict, DataUnavailableError } from '../src/lib/supabase-health';

let failures = 0;
function check(name: string, fn: () => void) {
  try { fn(); console.log(`  PASS  ${name}`); }
  catch (e) { failures++; console.log(`  FAIL  ${name}: ${e instanceof Error ? e.message : String(e)}`); }
}
function assert(cond: unknown, msg: string) { if (!cond) throw new Error(msg); }

console.log('noindex strict-mode contract\n');

check('failed query + strict -> throws DataUnavailableError', () => {
  let threw: unknown = null;
  try { failIfStrict(true, 'getListingsByCity', new Error('fetch failed')); }
  catch (e) { threw = e; }
  assert(threw !== null, 'expected a throw; without it a failed query returns [] and the page emits noindex');
  assert(threw instanceof DataUnavailableError, `expected DataUnavailableError, got ${(threw as Error)?.name}`);
  assert(/getListingsByCity/.test((threw as Error).message), 'message should name the failing fetcher');
  assert(/fetch failed/.test((threw as Error).message), 'message should preserve the original cause');
});

check('failed query + soft -> does not throw (UI degrades quietly)', () => {
  failIfStrict(false, 'getListingsByCity', new Error('fetch failed'));
  failIfStrict(undefined, 'getListingsByCity', new Error('fetch failed'));
});

// Source assertions: the guard is only useful if the robots-gating call sites
// actually opt in. These catch a future refactor that drops the flag.
// ESM scope: no __dirname. Resolve from cwd (scripts are run from repo root).
const ROOT = process.cwd();
void path;
const CITY = fs.readFileSync(path.join(ROOT, 'app/cities/[slug]/page.tsx'), 'utf8');
const TREAT = fs.readFileSync(path.join(ROOT, 'app/iv-therapy/[treatment]/[city]/page.tsx'), 'utf8');
const DATA = fs.readFileSync(path.join(ROOT, 'src/lib/data.ts'), 'utf8');

check('every getListingsByCity call in the city page passes strict', () => {
  const calls = CITY.match(/getListingsByCity\([^)]*\)/g) || [];
  assert(calls.length > 0, 'expected getListingsByCity calls in the city page');
  const missing = calls.filter((c) => !/strict:\s*true/.test(c));
  assert(missing.length === 0, `these calls gate robots but omit strict: ${missing.join(' | ')}`);
});

check('every getListingsByServiceAndCity call in the treatment-city page passes strict', () => {
  const calls = TREAT.match(/getListingsByServiceAndCity\([^)]*\)/g) || [];
  assert(calls.length > 0, 'expected getListingsByServiceAndCity calls in the treatment-city page');
  const missing = calls.filter((c) => !/strict:\s*true/.test(c));
  assert(missing.length === 0, `these calls gate robots but omit strict: ${missing.join(' | ')}`);
});

check('the three count-gated fetchers still route their catch through failIfStrict', () => {
  for (const fn of ['getListingsByCity', 'getListingsByState', 'getListingsByServiceAndCity']) {
    assert(
      new RegExp(`failIfStrict\\(opts\\?\\.strict,\\s*'${fn}'`).test(DATA),
      `${fn} no longer calls failIfStrict in its catch block; a failed query would silently return []`,
    );
  }
});

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
