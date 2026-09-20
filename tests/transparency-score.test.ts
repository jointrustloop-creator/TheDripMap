import { describe, expect, it } from 'vitest';
import { computeTransparencyScore } from '../src/lib/transparency-score';

const base = (consult: string) => ({
  decision_drivers: { manage: { firstVisit: { consult } } },
  description: '',
});

const screening = (row: Record<string, unknown>) =>
  computeTransparencyScore(row).checks.find((c) => c.key === 'screening')!.passed;

describe('health screening check', () => {
  it('accepts the form option "Required" and a recorded consultation sentence', () => {
    expect(screening(base('Required'))).toBe(true);
    expect(screening(base('Consultation with the nurse injector before treatment'))).toBe(true);
    expect(screening(base('Recommended'))).toBe(true);
  });
  it('rejects an explicit No and an empty answer', () => {
    expect(screening(base('No'))).toBe(false);
    expect(screening(base('Not required'))).toBe(false);
    expect(screening(base(''))).toBe(false);
  });
});
