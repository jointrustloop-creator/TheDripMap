import { describe, expect, it } from 'vitest';
import { classifyReply, ownText } from '../src/lib/reply-classifier';

// Regression guard for the 2026-08-23 false positives: our own footer's
// "unsubscribe" sat in the quoted history of an owner's reply and the
// classifier suppressed the owner (Nura, Glass Skin).
const QUOTED_FOOTER = [
  'Hi Deborah, yes please list our hours as 9 to 6 Monday to Friday.',
  'Thanks, Nura',
  '',
  'On Fri, Aug 22, 2026 at 3:10 PM Deborah <info@thedripmap.com> wrote:',
  '> Hi Nura, your listing is live.',
  '> To unsubscribe from these emails reply with unsubscribe.',
].join('\n');

describe('ownText', () => {
  it('drops everything from the first quote marker down', () => {
    expect(ownText(QUOTED_FOOTER)).not.toMatch(/unsubscribe/i);
    expect(ownText(QUOTED_FOOTER)).toMatch(/9 to 6/);
  });
  it('drops Outlook style quoted headers', () => {
    const t = 'Not now thanks\n\nFrom: Deborah\nSent: Monday\nunsubscribe';
    expect(ownText(t)).toBe('Not now thanks\n');
  });
});

describe('classifyReply', () => {
  it('does not opt out an owner because of our quoted footer', () => {
    const r = classifyReply({ subject: 'Re: your listing', body: QUOTED_FOOTER });
    expect(r.category).not.toBe('not_interested');
    expect(r.reason).not.toMatch(/opt-out/);
  });
  it('still opts out when the sender themselves says so', () => {
    const r = classifyReply({ subject: 'Re: your listing', body: 'Please unsubscribe me.\n\n> old thread' });
    expect(r.category).toBe('not_interested');
    expect(r.reason).toMatch(/opt-out/);
  });
});
