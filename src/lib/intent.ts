/**
 * Intent events (Demand Pulse, Phase 0, 2026-09-12).
 *
 * What patients DO on the site, per clinic, beyond the six click events:
 *   impression        clinic shown in a search or city result set
 *   quiz_match        clinic shown as a quiz match
 *   compare_add       clinic added to the compare list
 *   view_src          which internal page sent a listing view (blog, city, search, index)
 *   reach_prices      visitor scrolled to the drip menu / prices
 *   reach_hours       visitor scrolled to hours
 *   reach_practitioner visitor scrolled to the care team
 *   reach_book        visitor scrolled to the booking block
 *   message_topic     what a patient message was about (category only)
 *
 * STORAGE, and why it looks odd: listing_events.event_type has a CHECK
 * constraint (view, book_click, call_click, website_click, directions_click,
 * message_click; verified 2026-09-12, 'booking_click' is NOT in it) and there
 * is no DDL access from the operator side, so intent rows ride in
 * listing_events under the CARRIER event type 'directions_click' (the rarest
 * real click) with the payload encoded in the `referrer` column as an `i:`
 * token. Every reader excludes rows whose referrer starts with 'i:' from
 * click metrics. scripts/create-intent-events.sql is the proper table; when
 * it can be applied, switch the writer and the reader here and nothing else
 * changes.
 *
 * Privacy: tokens carry a random per-tab session id, a city slug, a
 * treatment slug, a source path and a topic word. Never an email, name,
 * query string, or user agent.
 */

export const INTENT_CARRIER_EVENT = 'directions_click';
export const INTENT_PREFIX = 'i:';

export const INTENT_KINDS = [
  'impression', 'quiz_match', 'compare_add', 'view_src',
  'reach_prices', 'reach_hours', 'reach_practitioner', 'reach_book',
  'message_topic',
] as const;
export type IntentKind = (typeof INTENT_KINDS)[number];

export interface IntentFields {
  /** city slug, e.g. "mississauga" */
  c?: string;
  /** treatment slug, e.g. "nad-plus" */
  t?: string;
  /** per-tab session id (8 chars) */
  s?: string;
  /** internal source path, e.g. "/blog/alcohol-after-iv" (query stripped) */
  src?: string;
  /** message topic word */
  k?: string;
}

const SLUG_RE = /[^a-z0-9._\/-]+/g;
const MAX_TOKEN = 200;

function clean(v: unknown, max: number): string {
  return String(v || '').toLowerCase().trim().replace(SLUG_RE, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, max);
}

export function isIntentKind(k: unknown): k is IntentKind {
  return typeof k === 'string' && (INTENT_KINDS as readonly string[]).includes(k);
}

/** Build the referrer token. Returns null when the kind is unknown. */
export function encodeIntent(kind: IntentKind, f: IntentFields = {}): string | null {
  if (!isIntentKind(kind)) return null;
  const parts = [`${INTENT_PREFIX}${kind}`];
  const add = (key: keyof IntentFields, max: number) => { const v = clean(f[key], max); if (v) parts.push(`${key}=${v}`); };
  add('c', 40); add('t', 40); add('s', 12); add('src', 80); add('k', 20);
  return parts.join('|').slice(0, MAX_TOKEN);
}

export interface DecodedIntent extends IntentFields { kind: IntentKind }

export function decodeIntent(referrer: string | null | undefined): DecodedIntent | null {
  if (typeof referrer !== 'string' || !referrer.startsWith(INTENT_PREFIX)) return null;
  const [head, ...rest] = referrer.split('|');
  const kind = head.slice(INTENT_PREFIX.length);
  if (!isIntentKind(kind)) return null;
  const out: DecodedIntent = { kind };
  for (const p of rest) {
    const eq = p.indexOf('=');
    if (eq < 1) continue;
    const key = p.slice(0, eq) as keyof IntentFields;
    if (['c', 't', 's', 'src', 'k'].includes(key)) out[key] = p.slice(eq + 1);
  }
  return out;
}

/** Server-side validation of a client-supplied token. */
export const INTENT_TOKEN_RE = /^i:[a-z_]+(\|(c|t|s|src|k)=[a-z0-9._\/-]{1,80})*$/;
export function isValidIntentToken(token: unknown): token is string {
  return typeof token === 'string' && token.length <= MAX_TOKEN && INTENT_TOKEN_RE.test(token) && decodeIntent(token) !== null;
}

/** Topic of a patient message, category only. Never stores the text. */
export function classifyMessageTopic(text: string): string {
  const t = (text || '').toLowerCase();
  if (/\b(price|cost|how much|\$|fee|rate|expensive|cheap|afford)\b/.test(t)) return 'price';
  if (/\b(book|appointment|availab|open|tomorrow|today|weekend|slot|schedule|when)\b/.test(t)) return 'availability';
  if (/\b(mobile|at home|home visit|come to|house call|travel)\b/.test(t)) return 'mobile';
  if (/\b(safe|nurse|doctor|licens|licence|qualified|side effect|risk|pregnan|medication|condition)\b/.test(t)) return 'safety';
  if (/\b(insurance|receipt|coverage|benefit|claim)\b/.test(t)) return 'insurance';
  if (/\b(nad|myers|glutathione|vitamin c|iron|hangover|hydration|b12|immune)\b/.test(t)) return 'treatment';
  return 'other';
}
