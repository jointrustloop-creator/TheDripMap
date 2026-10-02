import { describe, expect, it } from 'vitest';
import { computeTransparencyScore } from '../src/lib/transparency-score';

const base = (consult: string) => ({
  decision_drivers: { manage: { firstVisit: { consult } } },
  description: '',
});

const screening = (row: Record<string, unknown>) =>
  computeTransparencyScore(row).checks.find((c) => c.key === 'screening')!.passed;

const business = (row: Record<string, unknown>) =>
  computeTransparencyScore(row).checks.find((c) => c.key === 'business')!.passed;

describe('business details check', () => {
  const contact = { phone: '250-618-5777', website: 'https://example.ca', city: 'Nanaimo', address: null };
  it('lets a mobile-only service use its city in place of a street address', () => {
    expect(business({ ...contact, decision_drivers: { manage: { delivery: ['Mobile / at-home'] } } })).toBe(true);
    expect(business({ ...contact, mobile_service: true })).toBe(true);
    expect(business({ ...contact, type: 'Mobile' })).toBe(true);
    expect(business({ ...contact, type: 'Both' })).toBe(false);
  });
  it('still requires the address from a clinic with a storefront', () => {
    expect(business({ ...contact, decision_drivers: { manage: { delivery: ['In-clinic', 'Mobile / at-home'] } } })).toBe(false);
    expect(business({ ...contact, decision_drivers: { manage: { delivery: ['In-clinic'] } } })).toBe(false);
    expect(business({ ...contact })).toBe(false);
    expect(business({ ...contact, address: '12 Front St', decision_drivers: { manage: { delivery: ['In-clinic'] } } })).toBe(true);
  });
  it('never passes without phone or website', () => {
    expect(business({ ...contact, phone: '', mobile_service: true })).toBe(false);
    expect(business({ ...contact, website: '', mobile_service: true })).toBe(false);
  });
});

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
