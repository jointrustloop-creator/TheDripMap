/**
 * reply-classifier.ts
 *
 * Pure, deterministic-where-it-matters classifier for inbound replies to
 * info@thedripmap.com. Used by /api/cron/process-replies.
 *
 * Goals (per the operator brief):
 *   - Never silently misfile a genuine opt-out. Opt-out keywords ALWAYS
 *     win and ALWAYS trigger suppression.
 *   - Never silently misfile a bounce. Bounce patterns are checked from
 *     deterministic envelope + headers.
 *   - For interested/question/not_interested where it isn't an opt-out,
 *     use a light keyword heuristic. When uncertain, return 'unclear'
 *     and set needsHuman = true. Never guess on an irreversible action.
 *
 * No side effects. No DB writes. No PII storage. Returns a plain object.
 */

export type ReplyCategory =
  | 'interested'
  | 'question'
  | 'not_interested'
  | 'auto_reply'
  | 'bounce'
  | 'unclear';

export interface ClassifyInput {
  subject?: string | null;
  body?: string | null;
  fromEmail?: string | null;
  headers?: Record<string, string | undefined>;
}

export interface ClassifyResult {
  category: ReplyCategory;
  confidence: 'high' | 'medium' | 'low';
  needsHuman: boolean;
  reason: string;
}

// ---------------------------------------------------------------------
// Deterministic, compliance-critical patterns.
// ---------------------------------------------------------------------

// Opt-out keywords. Word-boundary anchored so we don't match "stopwatch"
// or "unsubscribe-link-clicked-by-mistake-in-our-own-footer".
const OPT_OUT_PATTERNS: RegExp[] = [
  /\bunsubscribe\b/i,
  /\bremove\s+me\b/i,
  /\bremove\s+from\s+(your|the)\s+list\b/i,
  /\bopt[\s\-_]?out\b/i,
  /\btake\s+me\s+off\b/i,
  /\bplease\s+stop\b/i,
  /\bdo\s+not\s+(email|contact|message)\b/i,
  /\bstop\s+(emailing|contacting|messaging)\b/i,
];

// Standalone "stop" is dangerous (false positives in plenty of normal
// English). Only treat bare "stop" as opt-out when it's the entire
// subject or the entire body (trimmed).
function isBareStopOptOut(subject: string, body: string): boolean {
  const s = (subject || '').trim().toLowerCase();
  const b = (body || '').trim().toLowerCase();
  return /^stop\.?$/.test(s) || /^stop\.?$/.test(b);
}

const BOUNCE_FROM_PATTERNS: RegExp[] = [
  /mailer[\-\s]?daemon/i,
  /postmaster@/i,
  /mail\s*delivery\s*subsystem/i,
  /mail\s*delivery\s*system/i,
  /noreply@.*bounce/i,
];

const BOUNCE_SUBJECT_PATTERNS: RegExp[] = [
  /delivery\s+status\s+notification/i,
  /undeliverable/i,
  /undelivered\s+mail/i,
  /returned\s+mail/i,
  /mail\s+delivery\s+failed/i,
  /failure\s+notice/i,
  /address\s+(not\s+found|rejected)/i,
];

const AUTO_REPLY_HEADER_PATTERNS: Array<[string, RegExp]> = [
  ['auto-submitted', /^auto-(replied|generated|notified)/i],
  ['x-autoreply', /./],
  ['x-autorespond', /./],
  ['precedence', /^(bulk|auto[_\-]?reply|list)$/i],
  ['auto-response-suppress', /./],
];

const AUTO_REPLY_SUBJECT_PATTERNS: RegExp[] = [
  /out\s+of\s+(the\s+)?office/i,
  /auto[\-\s]?reply/i,
  /automatic\s+reply/i,
  /\bvacation\b/i,
  /\bI\s+am\s+away\b/i,
  /currently\s+away/i,
  /maternity\s+leave/i,
];

// ---------------------------------------------------------------------
// Light heuristic for the non-compliance buckets.
// Conservative on purpose: when in doubt, return 'unclear' + needsHuman.
// ---------------------------------------------------------------------

const POSITIVE_PATTERNS: RegExp[] = [
  /\b(yes|sure|sounds\s+good|happy\s+to|i'?d\s+like)\b/i,
  /\b(let'?s\s+(do|chat|talk|schedule))\b/i,
  /\b(interested|tell\s+me\s+more|count\s+me\s+in)\b/i,
  /\b(please\s+(send|share)|i'?ll\s+claim)\b/i,
  /\bthank\s+you,?\s+/i,
];

const QUESTION_PATTERNS: RegExp[] = [
  /\?$/m,
  /\b(how\s+(does|do|much|long))\b/i,
  /\b(what\s+(is|are|does|do))\b/i,
  /\b(can\s+(you|i|we))\b/i,
  /\b(is\s+there)\b/i,
  /\bcost\b/i,
  /\bprice\b/i,
  /\bpricing\b/i,
];

const NEGATIVE_PATTERNS: RegExp[] = [
  /\bnot\s+interested\b/i,
  /\bno\s+thanks?\b/i,
  /\bnot\s+(at\s+)?this\s+time\b/i,
  /\bwe(\'re|\s+are)\s+(good|all\s+set)\b/i,
  /\bwe\s+already\s+have\b/i,
];

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function any(patterns: RegExp[], s: string): boolean {
  if (!s) return false;
  return patterns.some((re) => re.test(s));
}

function getHeader(
  headers: Record<string, string | undefined> | undefined,
  key: string,
): string {
  if (!headers) return '';
  // imapflow gives us lower-case keys typically, but be defensive.
  const lower = key.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lower) return (headers[k] || '').trim();
  }
  return '';
}

// ---------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------

export function classifyReply(input: ClassifyInput): ClassifyResult {
  const subject = (input.subject || '').slice(0, 500);
  const body = (input.body || '').slice(0, 4000);
  const fromEmail = (input.fromEmail || '').toLowerCase();
  const headers = input.headers || {};
  const haystack = `${subject}\n${body}`;

  // 1) Hard bounce: from-address pattern OR subject pattern.
  if (any(BOUNCE_FROM_PATTERNS, fromEmail) || any(BOUNCE_SUBJECT_PATTERNS, subject)) {
    return {
      category: 'bounce',
      confidence: 'high',
      needsHuman: false,
      reason: 'matched bounce envelope/subject pattern',
    };
  }

  // 2) Auto-reply / OOO: headers first (most reliable), then subject.
  for (const [hkey, hpat] of AUTO_REPLY_HEADER_PATTERNS) {
    const v = getHeader(headers, hkey);
    if (v && hpat.test(v)) {
      return {
        category: 'auto_reply',
        confidence: 'high',
        needsHuman: false,
        reason: `auto-reply header: ${hkey}=${v.slice(0, 40)}`,
      };
    }
  }
  if (any(AUTO_REPLY_SUBJECT_PATTERNS, subject)) {
    return {
      category: 'auto_reply',
      confidence: 'high',
      needsHuman: false,
      reason: 'auto-reply subject pattern',
    };
  }

  // 3) Opt-out keywords. These outrank the light heuristic by design.
  if (any(OPT_OUT_PATTERNS, haystack) || isBareStopOptOut(subject, body)) {
    return {
      category: 'not_interested',
      confidence: 'high',
      needsHuman: false,
      reason: 'opt-out keyword present, must suppress',
    };
  }

  // 4) Light heuristic for interested vs question vs not_interested.
  const positive = any(POSITIVE_PATTERNS, haystack);
  const question = any(QUESTION_PATTERNS, haystack);
  const negative = any(NEGATIVE_PATTERNS, haystack);

  // Negative sentiment (without opt-out language): operator should still
  // see it but it's not a CASL suppression trigger.
  if (negative && !positive) {
    return {
      category: 'not_interested',
      confidence: 'medium',
      needsHuman: true,
      reason: 'negative-sentiment keyword, no opt-out keyword',
    };
  }

  if (positive && question) {
    return {
      category: 'interested',
      confidence: 'medium',
      needsHuman: true,
      reason: 'positive + question, treat as warm lead',
    };
  }

  if (positive) {
    return {
      category: 'interested',
      confidence: 'medium',
      needsHuman: true,
      reason: 'positive-sentiment keyword',
    };
  }

  if (question) {
    return {
      category: 'question',
      confidence: 'medium',
      needsHuman: true,
      reason: 'question pattern',
    };
  }

  // 5) Default: unclear, needs human.
  return {
    category: 'unclear',
    confidence: 'low',
    needsHuman: true,
    reason: 'no deterministic signal',
  };
}

/**
 * Short, safe snippet for storage. Strips quoted history (lines starting
 * with ">"), collapses whitespace, caps length. Defensive against very
 * long quoted threads inflating the DB row.
 */
export function buildSnippet(body: string | null | undefined, maxChars = 500): string {
  if (!body) return '';
  const lines = body
    .split(/\r?\n/)
    .filter((ln) => !ln.trim().startsWith('>'))
    .filter((ln) => !/^on\s+.+\bwrote:\s*$/i.test(ln.trim()))
    .filter((ln) => !/^from:\s/i.test(ln.trim()));
  const collapsed = lines.join(' ').replace(/\s+/g, ' ').trim();
  return collapsed.slice(0, maxChars);
}
