/**
 * Badge-reply detection (2026-08-16).
 *
 * On 2026-08-16 a badge-renewal batch went out by hand asking claimed clinics
 * for their prescriber's name, credential and college registration number.
 * Replies carrying those details are the highest-value mail we receive: each one
 * lets the operator record a verified prescriber at /admin/badge-reviews, which
 * restores that clinic's 7th transparency point. They must never sit unread in
 * the inbox, so the daily digest surfaces them as "BADGE REPLY, action needed".
 *
 * This module is pure and dependency free: the digest and the reply cron both
 * import the same detector, so a reply can never be judged differently in two
 * places. It reports SIGNALS FOUND, never a verification decision. Recording a
 * prescriber stays a human action (docs/badge-standard.md §6.1).
 */

/** Campaigns whose replies are worth flagging. Matches outbound_message_log.campaign. */
export const BADGE_CAMPAIGNS = ['badge_renewal_aug2026'];

export interface BadgeReplySignals {
  /** True when the text carries at least one prescriber-identity signal. */
  isBadgeReply: boolean;
  /** Short human-readable reasons, for the digest line. */
  signals: string[];
  /** Registration-number-looking strings, for the operator to check. */
  regNumbers: string[];
  /** Credentialed names, e.g. "Dr. Jane Smith" or "Jane Smith, ND". */
  names: string[];
}

// A college registration number in Canada is typically 4-7 digits, often
// introduced by a label or a college name. Bare numbers are NOT matched on
// their own: phone numbers, prices and dates would produce constant false
// positives, and a false "action needed" every day trains the operator to
// ignore the section.
const REG_LABELLED = /\b(?:reg(?:istration)?\.?\s*(?:no\.?|number|#)?|licen[cs]e\s*(?:no\.?|number|#)?|cpso|cno|cono|cchpbc|cnpbc|college\s*(?:no\.?|number|#)?)\s*[:#]?\s*(\d{4,7})\b/gi;

// Credentialed name forms: "Dr. Jane Smith", "Jane Smith, ND", "Jane Smith MD".
const NAME_WITH_TITLE = /\bDr\.?\s+[A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]+){0,2}/g;
const NAME_WITH_SUFFIX = /\b[A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]+){0,2},?\s+(?:MD|ND|NP|RN|FNP-BC|DO)\b/g;

// Bare credential mention, a weak signal on its own but useful alongside others.
const CREDENTIAL_WORD = /\b(?:MD|ND|NP|CPSO|CNO|CONO|CCHPBC|nurse practitioner|naturopath(?:ic)?\s+doctor|medical director|prescriber)\b/i;

function uniq(xs: string[]): string[] {
  return Array.from(new Set(xs.map((x) => x.trim()).filter(Boolean)));
}

/**
 * Inspect reply text for prescriber-identity signals. `text` should be the
 * subject plus body (or the stored snippet, which is enough in practice: owners
 * lead with the details when answering a three-question email).
 */
export function detectBadgeReply(text: string | null | undefined): BadgeReplySignals {
  const t = (text || '').slice(0, 8000);
  if (!t.trim()) return { isBadgeReply: false, signals: [], regNumbers: [], names: [] };

  const regNumbers = uniq(Array.from(t.matchAll(REG_LABELLED)).map((m) => m[1]));
  const names = uniq([
    ...Array.from(t.matchAll(NAME_WITH_TITLE)).map((m) => m[0]),
    ...Array.from(t.matchAll(NAME_WITH_SUFFIX)).map((m) => m[0]),
  ]);
  const hasCredentialWord = CREDENTIAL_WORD.test(t);

  const signals: string[] = [];
  if (regNumbers.length) signals.push(`registration number (${regNumbers.join(', ')})`);
  if (names.length) signals.push(`prescriber name (${names.slice(0, 3).join('; ')})`);
  if (!regNumbers.length && !names.length && hasCredentialWord) signals.push('credential mentioned, no name or number parsed');

  // A reply counts when it carries a registration number OR a credentialed
  // name. A lone credential word is reported as a signal but does not by itself
  // raise "action needed": "thanks, our MD will get back to you" is not an answer.
  const isBadgeReply = regNumbers.length > 0 || names.length > 0;
  return { isBadgeReply, signals, regNumbers, names };
}
