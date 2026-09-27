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
  // 2026-09-22: Youth Bar's CEO asked to be removed and was filed as a warm
  // lead because "can you" is a question and "Thank you," is positive.
  it('files a removal request as an opt-out, never as interested', () => {
    const r = classifyReply({
      subject: 'Re: Youth Bar was viewed 10 times on TheDripMap this summer',
      body: 'Hello, can you take us off this map? We longer offer IV drips.\n\nThank you\n\nManny\n\nOn Sun, Sep 20, 2026 TheDripMap wrote:\n> Hi Youth Bar team,',
    });
    expect(r.category).toBe('not_interested');
    expect(r.reason).toMatch(/opt-out/);
  });
  it('files "no longer offer" as not interested even with a thank you', () => {
    const r = classifyReply({ subject: 'Re: listing', body: 'Thank you, but we no longer offer IV therapy at this location.' });
    expect(r.category).toBe('not_interested');
  });
  // 2026-09-23: Hydro Oasis declined to claim; must never read as interested.
  it('files a polite decline as not interested', () => {
    const r = classifyReply({ subject: 'Re: your page', body: "Thank you for reaching out and for including us. We appreciate the information, but we're not interested in claiming or participating in the listing at this time.\n\nThank you for understanding." });
    expect(r.category).toBe('not_interested');
  });
});
