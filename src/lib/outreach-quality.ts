/**
 * Outreach quality filters and template helpers shared by the daily-outreach
 * cron, the followup-outreach cron, and any manual batch script.
 *
 * Three goals:
 *   1. Hard-reject junk / placeholder / catchall emails (john@doe.com,
 *      growth99 marketing catchalls, etc.) — these bounce or land nowhere
 *      useful and burn our info@ sending reputation.
 *   2. Soft-reject domain-mismatch emails (e.g. an IV clinic listing showing
 *      a contact email at a vendor's domain) — likely scraped from a booking
 *      widget rather than the clinic's own inbox.
 *   3. Centralise the CASL-compliant footer so every send (manual or cron)
 *      carries the same identification + mailing address + unsubscribe block.
 *
 * Conservative-by-default: when uncertain, KEEP the candidate. The filters
 * remove only the patterns we've actually seen bounce or mismatch.
 */

const KNOWN_FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.ca',
  'hotmail.com',
  'hotmail.ca',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'proton.me',
  'live.com',
  'msn.com',
  'rogers.com',
  'sympatico.ca',
  'telus.net',
  'shaw.ca',
]);

const KNOWN_VENDOR_CATCHALLS = [
  // CRM / booking / marketing platforms that show up as "contact" on clinic sites
  'growth99.com',
  'thryv.com',
  'janeapp.com',
  'jane.app',
  'mindbodyonline.com',
  'mywellnessliving.com',
  'wellnessliving.com',
  'meevo.com',
  'vagaro.com',
  'fresha.com',
  'mailerlite.com',
  'mailchimp.com',
  'constantcontact.com',
  'hubspot.com',
  'squarespace-mail.com',
  // Direct hit from tonight's pre-batch scrub
  'stagheaddesigns.com',
];

const KNOWN_PLACEHOLDER_LOCALS = new Set([
  'john', 'jane', 'test', 'tester', 'placeholder', 'noreply', 'no-reply',
  'donotreply', 'example', 'sample', 'admin@example', 'admin@admin',
]);

function emailDomain(e: string): string {
  const at = e.lastIndexOf('@');
  return at === -1 ? '' : e.slice(at + 1).toLowerCase().trim();
}

function rootDomain(host: string): string {
  return host.replace(/^www\./, '').split('.').slice(-2).join('.');
}

/**
 * Hard reject — return true if the email is junk / placeholder / catchall.
 * Should not be retried, should not even count as a "potentially delivered"
 * record. These get skipped from the candidate pool entirely.
 */
export function isJunkEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  const e = email.trim().toLowerCase();
  if (!e) return true;

  // Basic shape check (the existing filter)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return true;
  // Image-scrape garbage that has crept in
  if (/\.(jpe?g|png|gif|webp|svg)$/i.test(e)) return true;

  const local = e.split('@')[0];
  const domain = emailDomain(e);

  // Explicit junk placeholders
  if (e === 'john@doe.com' || e === 'jane@doe.com' || e === 'test@test.com') return true;
  if (KNOWN_PLACEHOLDER_LOCALS.has(local)) return true;

  // Example/test TLDs
  if (/^(example|test|invalid|localhost|local)\.(com|net|org|io|ca)$/i.test(domain)) return true;
  if (/(\.example|\.test|\.invalid|\.localhost)$/i.test(domain)) return true;

  // Vendor catchalls — these are marketing/CRM platforms, not the clinic's inbox
  for (const v of KNOWN_VENDOR_CATCHALLS) {
    if (domain === v || domain === 'www.' + v) return true;
  }

  return false;
}

/**
 * Soft reject — return true when the email's domain does not align with the
 * provider's own website domain. Likely a vendor email scraped from a booking
 * widget or a generic listing service. We skip these in this batch but do not
 * mark them as bounced — a different source might still find the real inbox.
 *
 * Returns false (no mismatch) when:
 *   - we don't have a website to compare against
 *   - the email is on a known free email domain (gmail, etc.) — the clinic
 *     legitimately uses gmail
 *   - the email domain shares the same root domain as the website
 */
export function isDomainMismatch(
  email: string | null | undefined,
  website: string | null | undefined
): boolean {
  if (!email || !website) return false;
  const e = email.trim().toLowerCase();
  if (!e || !/@/.test(e)) return false;
  const eDom = emailDomain(e);
  if (!eDom) return false;

  // Free email providers — always allowed
  if (KNOWN_FREE_EMAIL_DOMAINS.has(eDom)) return false;

  // Parse the website into a hostname
  let host = '';
  try {
    const w = website.trim();
    const withScheme = /^https?:\/\//i.test(w) ? w : 'https://' + w;
    host = new URL(withScheme).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return false; // unparseable website — give the email the benefit of the doubt
  }
  if (!host) return false;

  // Exact match or shared root domain → not a mismatch
  if (eDom === host) return false;
  if (rootDomain(eDom) === rootDomain(host)) return false;

  // Common pattern: clinic site lives on a subdomain (e.g. info@clinic.com but
  // website is booking.clinic.com). The root-domain check above catches this.
  // What we're left with is genuine mismatches like info@stagheaddesigns.com
  // attached to a listing whose website is something else entirely.
  return true;
}

/**
 * Outreach footer fragment. Drop into the bottom of any cold-outreach email.
 *
 * 2026-06-01: The mailing-address identification line was stripped at the
 * operator's request. This footer is intentionally NOT fully CASL-compliant —
 * sender + mailing address identification is omitted. The unsubscribe block is
 * preserved as a baseline-of-decency signal. Operator has accepted the tradeoff.
 */
export const CASL_FOOTER = `\nYou're receiving this because your clinic was identified as an IV therapy provider in our matching platform. To stop receiving these emails, reply with 'unsubscribe' in the subject line, or email info@thedripmap.com with 'unsubscribe'.`;
