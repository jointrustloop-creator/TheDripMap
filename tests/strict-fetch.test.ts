/**
 * Regression test for the indexation guarantee (brief of 2026-09-18, item 7).
 *
 * The bug class: a data fetch fails, the page receives an empty array, treats
 * it as "zero clinics", emits robots noindex, and ISR caches that. The guard is
 * strict mode on the fetchers: on failure they THROW DataUnavailableError, so
 * the render fails and the last good cached page keeps serving.
 *
 * Two things are asserted here:
 *   1. the guard itself: failIfStrict throws in strict mode and is silent
 *      otherwise, and the thrown error is the typed DataUnavailableError;
 *   2. the pages that gate robots on a count actually pass strict: true
 *      (a static check of the source, so nobody can quietly drop the flag).
 *
 *   npx vitest run
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { failIfStrict, DataUnavailableError } from '../src/lib/supabase-health';

describe('strict fetch guard', () => {
  it('throws a typed DataUnavailableError in strict mode', () => {
    expect(() => failIfStrict(true, 'getListingsByCity', new Error('fetch failed'))).toThrow(DataUnavailableError);
    try {
      failIfStrict(true, 'getListingsByCity', new Error('boom'));
    } catch (e) {
      expect((e as Error).name).toBe('DataUnavailableError');
      expect((e as Error).message).toContain('getListingsByCity');
      expect((e as Error).message).toContain('boom');
    }
  });

  it('is silent when strict is off or undefined (tolerant callers keep their [] fallback)', () => {
    expect(() => failIfStrict(false, 'x', new Error('e'))).not.toThrow();
    expect(() => failIfStrict(undefined, 'x', new Error('e'))).not.toThrow();
  });
});

describe('pages that emit noindex fetch in strict mode', () => {
  const read = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

  it('city page passes strict: true to getListingsByCity', () => {
    const src = read('app/cities/[slug]/page.tsx');
    const calls = src.match(/getListingsByCity\([^)]*\)/g) || [];
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c).toContain('strict: true');
  });

  it('treatment-city page passes strict: true to getListingsByServiceAndCity', () => {
    const src = read('app/iv-therapy/[treatment]/[city]/page.tsx');
    const calls = src.match(/getListingsByServiceAndCity\([^)]*\)/g) || [];
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c).toContain('strict: true');
  });

  it('the fetchers honour the flag (failIfStrict sits in their catch blocks)', () => {
    const src = read('src/lib/data.ts');
    for (const fn of ['getListingsByCity', 'getListingsByServiceAndCity']) {
      const start = src.indexOf(`export async function ${fn}`);
      expect(start).toBeGreaterThan(-1);
      const next = src.indexOf('\nexport ', start + 10);
      const body = src.slice(start, next === -1 ? undefined : next);
      expect(body).toContain('failIfStrict(opts?.strict');
    }
  });
});
