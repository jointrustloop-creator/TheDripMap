// First-edition patient newsletter for TheDripMap.
//
// Sent over the SAME Resend infrastructure the Part B outreach uses (never
// Workspace SMTP), from a patient-appropriate address (hello@thedripmap.com),
// reply-to info@. Nothing here sends on its own: the admin screen computes the
// clean queue + renders each subscriber's exact email, and the operator clicks
// approve. See app/api/admin/newsletter/route.ts and the /admin/newsletter UI.
//
// Rules baked in:
//  - Subscribers live in `inquiries` rows whose message starts with "[SUBSCRIBE]".
//  - Exclude internal addresses (@thedripmap.com, the operator's own gmail),
//    clinic addresses (any email that matches a provider record), and US
//    subscribers. The CA test is fail-closed: an unrecognized city is held back
//    for review, never auto-mailed.
//  - Copy is warm, patient-facing, NO medical claims, NO dashes, and says
//    "matching platform", never "directory".

import type { SupabaseClient } from '@supabase/supabase-js';
import { slugify } from './data';
import { PRICE_INDEX } from './price-index-data';

export const SITE = 'https://www.thedripmap.com';
export const MAILING = 'TheDripMap, Caledon, Ontario, Canada';
export const EDITION = 'first';
export const GREEN = '#0F6E56';

// ── Links used in the body (all real, all Canada-first) ───────────────────────
const LINK_PRICE_HUB = `${SITE}/iv-prices`;
const LINK_TRANSPARENCY = `${SITE}/transparency`;
const LINK_CHOOSE_GUIDE = `${SITE}/blog/how-to-find-medical-director-iv-therapy-clinic`;

// ── Subscriber classification ────────────────────────────────────────────────
const INTERNAL_RE = /@thedripmap\.com$/i;
const INTERNAL_EXACT = new Set(['hubertzyworonek@gmail.com']);
// Cities we have actually seen that are US. Fail-closed: unknown cities are held
// for review, so this denylist only needs the ones that would otherwise slip in.
const US_DENY = new Set(['san luis obispo', 'murrieta']);
// Canadian places that are real but may not have their own provider rows yet.
const CA_EXTRA = new Set(['township of noble', 'ontario', 'london', 'noble']);
const CA_PROVINCE_TOKENS = new Set([
  'ontario', 'british columbia', 'alberta', 'quebec', 'québec', 'manitoba',
  'saskatchewan', 'nova scotia', 'new brunswick', 'newfoundland and labrador',
  'newfoundland', 'prince edward island', 'northwest territories', 'yukon', 'nunavut',
  'on', 'bc', 'ab', 'qc', 'mb', 'sk', 'ns', 'nb', 'nl', 'pe', 'nt', 'yt', 'nu',
]);

// Greater Toronto Area cities anchor to the Toronto Price Index page.
const GTA = new Set([
  'toronto', 'north york', 'etobicoke', 'scarborough', 'mississauga', 'brampton',
  'vaughan', 'markham', 'richmond hill', 'oakville', 'burlington', 'ajax', 'pickering',
  'whitby', 'oshawa', 'aurora', 'newmarket', 'king city', 'whitchurch-stouffville',
  'caledon', 'milton', 'georgetown', 'thornhill', 'concord', 'maple', 'woodbridge',
]);

export interface NewsletterSubscriber {
  email: string;
  city: string | null;
  signupSource: string;
  signupDate: string; // YYYY-MM-DD
}

export interface NewsletterDraft {
  to: string;
  city: string | null;
  subject: string;
  text: string;
  html: string;
  priceCity: string; // the anchor city named in the Price Index card
  localLine: string | null; // the personalized city line, if any
  alreadySent: boolean;
}

export interface NewsletterQueue {
  drafts: NewsletterDraft[];
  excluded: { email: string; city: string | null; reason: string }[];
  counts: { total: number; clean: number; excluded: number; alreadySent: number };
}

function dollars(n: number): string {
  return `$${Math.round(n)}`;
}

// The Price Index anchor for a subscriber. A city with its own page uses its own
// numbers; a GTA/Ontario city anchors to Toronto (our largest sample) and links
// the Toronto page; everyone else sees the Toronto sample but links the national
// hub. The card always names the anchor city truthfully.
function priceAnchorFor(city: string | null): {
  cityLabel: string; low: number; median: number; high: number; clinics: number; link: string;
} {
  const slug = slugify(city || '');
  const lower = (city || '').trim().toLowerCase();
  let key = 'toronto';
  let link = LINK_PRICE_HUB;
  if (slug && PRICE_INDEX[slug]) {
    key = slug;
    link = `${SITE}/iv-prices/${slug}`;
  } else if (GTA.has(lower) || lower === 'ontario') {
    key = 'toronto';
    link = `${SITE}/iv-prices/toronto`;
  }
  const idx = PRICE_INDEX[key] || PRICE_INDEX['toronto'];
  const h = idx.headline;
  return { cityLabel: idx.city, low: h.low, median: h.median, high: h.high, clinics: h.clinics, link };
}

// ── Copy + HTML render ───────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface RenderInput {
  email: string;
  city: string | null;
  providerCount: number;
  claimedName: string | null;
}

export function renderNewsletter(input: RenderInput): { subject: string; text: string; html: string; priceCity: string; localLine: string | null } {
  const { email, city } = input;
  const anchor = priceAnchorFor(city);
  const subject = 'Welcome to TheDripMap, your first edition';

  // Personalized local line (skipped gracefully when we have no local data).
  let localLine: string | null = null;
  let localLink: string | null = null;
  if (city && input.providerCount > 0) {
    const slug = slugify(city);
    localLink = `${SITE}/cities/${slug}`;
    localLine = input.claimedName
      ? `You are in ${city}. We track ${input.providerCount} IV clinics there, including ${input.claimedName}, which keeps its own listing current.`
      : `You are in ${city}. We track ${input.providerCount} IV clinics there on the map.`;
  }

  const priceRange = `${dollars(anchor.low)} to ${dollars(anchor.high)}`;
  const priceMedian = `median ${dollars(anchor.median)}`;

  // ── Plain-text version (also the images-blocked fallback readers see) ──
  const textLines = [
    'Hi there,',
    '',
    'You signed up for TheDripMap a little while ago, and this is the very first note we have sent you. Thank you for your patience, and for caring enough about getting IV therapy right. Here is the useful part.',
    '',
    `THE IV PRICE INDEX`,
    `A standard IV vitamin drip in ${anchor.cityLabel} runs ${priceRange} (${priceMedian}), across ${anchor.clinics} clinics with published menus. No more guessing what it should cost.`,
    `See the Price Index: ${anchor.link}`,
    '',
    'HOW TO CHOOSE A CLINIC',
    'Not sure how to tell a careful clinic from a risky one? We wrote a plain guide to the questions worth asking before you book.',
    `Read the guide: ${LINK_CHOOSE_GUIDE}`,
    '',
  ];
  if (localLine && localLink) {
    textLines.push('NEAR YOU', localLine, `See ${city} clinics: ${localLink}`, '');
  }
  textLines.push(
    'NEW: THE TRANSPARENCY SCORE',
    'Every clinic now gets a simple score out of seven for how much it tells you up front, from who administers your drip to how it sets prices. It is the fastest way to see who has nothing to hide.',
    `How the score works: ${LINK_TRANSPARENCY}`,
    '',
    'That is it for the first edition. If there is something you wish we tracked, just reply. We read every note.',
    '',
    'Warmly,',
    'the team at TheDripMap',
    '',
    '----',
    `You are receiving this because you subscribed to updates at thedripmap.com.`,
    MAILING,
    `Unsubscribe: ${SITE}/api/newsletter/unsubscribe/${encodeURIComponent(email)}`,
  );
  const text = textLines.join('\n');

  // ── Branded HTML (lightweight, text-first, images-optional) ──
  // Unsubscribe uses a PATH segment, not a ?e= query param. A "?e=ab..." query
  // gets corrupted by quoted-printable MIME encoding, which reads the "=" plus
  // the next two hex-like chars as an escape (=AB -> byte 0xAB), mangling the
  // address. A path has no "=" so it survives every mail client intact.
  const unsubUrl = `${SITE}/api/newsletter/unsubscribe/${encodeURIComponent(email)}`;
  const btn = (href: string, label: string) =>
    `<a href="${href}" style="display:inline-block;background:${GREEN};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:10px;">${label}</a>`;
  const link = (href: string, label: string) =>
    `<a href="${href}" style="color:${GREEN};text-decoration:underline;font-weight:600;">${label}</a>`;

  const localBlock = localLine && localLink
    ? `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#334155;">${esc(localLine)} ${link(localLink, `See ${esc(city as string)} clinics`)}.</p>`
    : '';

  const html = `<!-- preheader -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">The IV Price Index, how to choose a clinic, and what makes us different.</div>
<div style="background:#f6f6f4;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #ececea;">
    <tr><td style="padding:26px 30px 0;">
      <!-- header: wordmark + thin brand-green accent line -->
      <div style="font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">The Drip Map</div>
      <div style="height:3px;width:54px;background:${GREEN};border-radius:2px;margin-top:8px;"></div>
    </td></tr>
    <tr><td style="padding:22px 30px 6px;">
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Hi there,</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#334155;">You signed up for TheDripMap a little while ago, and this is the very first note we have sent you. Thank you for your patience, and for caring enough about getting IV therapy right. Here is the useful part.</p>

      <!-- Price Index callout card (the data is the visual) -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #e2e8f0;border-radius:12px;background:#fbfcfb;">
        <tr><td style="padding:18px 20px;">
          <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;color:${GREEN};text-transform:uppercase;margin-bottom:8px;">The IV Price Index</div>
          <div style="font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${priceRange}</div>
          <div style="font-size:13px;font-weight:700;color:#64748b;margin:2px 0 10px;">${priceMedian}</div>
          <div style="font-size:14px;line-height:1.55;color:#475569;margin-bottom:14px;">What a standard IV vitamin drip actually costs in ${esc(anchor.cityLabel)}, across ${anchor.clinics} clinics with published menus. No more guessing.</div>
          ${btn(anchor.link, 'See the Price Index')}
        </td></tr>
      </table>

      <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#334155;"><strong>How to choose a clinic.</strong> Not sure how to tell a careful clinic from a risky one? We wrote a plain guide to the questions worth asking before you book. ${link(LINK_CHOOSE_GUIDE, 'Read the guide')}.</p>

      ${localBlock}

      <!-- Transparency Score callout card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #e2e8f0;border-radius:12px;background:#fbfcfb;">
        <tr><td style="padding:18px 20px;">
          <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;color:${GREEN};text-transform:uppercase;margin-bottom:8px;">New: the Transparency Score</div>
          <div style="font-size:14px;line-height:1.55;color:#475569;margin-bottom:12px;">Every clinic now gets a simple score out of seven for how much it tells you up front, from who administers your drip to how it sets prices. It is the fastest way to see who has nothing to hide.</div>
          ${link(LINK_TRANSPARENCY, 'How the score works')}
        </td></tr>
      </table>

      <p style="margin:0 0 4px;font-size:16px;line-height:1.6;color:#334155;">That is it for the first edition. If there is something you wish we tracked, just reply. We read every note.</p>
      <p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:#334155;">Warmly,<br/>the team at TheDripMap</p>
    </td></tr>
    <tr><td style="padding:22px 30px 26px;">
      <div style="border-top:1px solid #ececea;padding-top:16px;font-size:12px;line-height:1.6;color:#94a3b8;">
        You are receiving this because you subscribed to updates at thedripmap.com.<br/>
        ${esc(MAILING)}.<br/>
        <a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
      </div>
    </td></tr>
  </table>
</div>`;

  return { subject, text, html, priceCity: anchor.cityLabel, localLine };
}

// ── Queue computation ────────────────────────────────────────────────────────
export async function computeNewsletterQueue(supabase: SupabaseClient): Promise<NewsletterQueue> {
  // 1. All provider emails (to detect clinic subscribers) + CA city data.
  const caCities = new Set<string>();
  const providerCountByCity = new Map<string, number>();
  const claimedByCity = new Map<string, string>();
  const providerEmails = new Set<string>();
  {
    let from = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data } = await supabase
        .from('providers')
        .select('name, city, country, email, is_claimed, is_hidden')
        .range(from, from + 999);
      if (!data || data.length === 0) break;
      for (const p of data as Array<{ name?: string | null; city?: string | null; country?: string | null; email?: string | null; is_claimed?: boolean | null; is_hidden?: boolean | null }>) {
        if (p.email) providerEmails.add(String(p.email).trim().toLowerCase());
        if (p.is_hidden) continue;
        const isUS = String(p.country || '').trim().toLowerCase().startsWith('united');
        if (isUS) continue;
        const c = (p.city || '').trim();
        if (!c) continue;
        const lc = c.toLowerCase();
        caCities.add(lc);
        providerCountByCity.set(lc, (providerCountByCity.get(lc) || 0) + 1);
        if (p.is_claimed && p.name && !claimedByCity.has(lc)) claimedByCity.set(lc, p.name);
      }
      if (data.length < 1000) break;
      from += 1000;
    }
  }

  // 1b. Suppression list. This is what the unsubscribe link writes to, so it is
  //     what makes unsubscribe actually stick across editions: anyone here is
  //     dropped. Fail-closed on the primary table (email_suppressions) so a load
  //     error never risks mailing someone who opted out; outreach_suppressions
  //     is read too for parity but tolerated if absent.
  const suppressed = new Set<string>();
  {
    let f = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data, error } = await supabase.from('email_suppressions').select('email').range(f, f + 999);
      if (error) throw new Error(`Refusing to build newsletter queue: could not load email_suppressions: ${error.message}`);
      for (const r of (data as { email: string }[]) || []) if (r.email) suppressed.add(r.email.toLowerCase().trim());
      if (!data || data.length < 1000) break;
      f += 1000;
    }
    try {
      let g = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabase.from('outreach_suppressions').select('email').range(g, g + 999);
        if (error) break; // secondary list; tolerate absence
        for (const r of (data as { email: string }[]) || []) if (r.email) suppressed.add(r.email.toLowerCase().trim());
        if (!data || data.length < 1000) break;
        g += 1000;
      }
    } catch { /* secondary list; ignore */ }
  }

  // 2. Subscribers from inquiries [SUBSCRIBE], plus which have already been sent
  //    this edition (marker rows written after a successful send).
  const subs: NewsletterSubscriber[] = [];
  const sentEmails = new Set<string>();
  {
    let from = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data } = await supabase
        .from('inquiries')
        .select('email, message, created_at')
        .order('created_at', { ascending: false })
        .range(from, from + 999);
      if (!data || data.length === 0) break;
      for (const r of data as Array<{ email?: string | null; message?: string | null; created_at?: string | null }>) {
        const msg = r.message || '';
        const email = String(r.email || '').trim().toLowerCase();
        if (!email) continue;
        if (msg.startsWith(`[NEWSLETTER-SENT] edition=${EDITION}`) && msg.includes(email)) {
          sentEmails.add(email);
          continue;
        }
        if (!msg.startsWith('[SUBSCRIBE]')) continue;
        const city = (msg.match(/city=(.+)$/) || [])[1]?.trim() || null;
        const source = (msg.match(/source=(\S+)/) || [])[1] || 'unknown';
        subs.push({ email, city, signupSource: source, signupDate: (r.created_at || '').slice(0, 10) });
      }
      if (data.length < 1000) break;
      from += 1000;
    }
  }

  // 3. Classify + render. Dedupe by email (newest wins; list is newest-first).
  const seen = new Set<string>();
  const drafts: NewsletterDraft[] = [];
  const excluded: { email: string; city: string | null; reason: string }[] = [];
  let alreadySent = 0;

  const isCanadian = (city: string | null): boolean => {
    const lc = (city || '').trim().toLowerCase();
    if (!lc) return false;
    if (US_DENY.has(lc)) return false;
    if (caCities.has(lc)) return true;
    if (CA_PROVINCE_TOKENS.has(lc)) return true;
    if (CA_EXTRA.has(lc)) return true;
    return false;
  };

  for (const s of subs) {
    if (seen.has(s.email)) continue;
    seen.add(s.email);

    if (suppressed.has(s.email)) {
      excluded.push({ email: s.email, city: s.city, reason: 'unsubscribed / suppressed' });
      continue;
    }
    if (INTERNAL_RE.test(s.email) || INTERNAL_EXACT.has(s.email)) {
      excluded.push({ email: s.email, city: s.city, reason: 'internal address' });
      continue;
    }
    if (providerEmails.has(s.email)) {
      excluded.push({ email: s.email, city: s.city, reason: 'clinic address (not a patient)' });
      continue;
    }
    if (!isCanadian(s.city)) {
      const lc = (s.city || '').trim().toLowerCase();
      excluded.push({ email: s.email, city: s.city, reason: US_DENY.has(lc) ? 'US subscriber' : 'city not recognized as Canadian (held for review)' });
      continue;
    }

    const lc = (s.city || '').trim().toLowerCase();
    const r = renderNewsletter({
      email: s.email,
      city: s.city,
      providerCount: providerCountByCity.get(lc) || 0,
      claimedName: claimedByCity.get(lc) || null,
    });
    const wasSent = sentEmails.has(s.email);
    if (wasSent) alreadySent += 1;
    drafts.push({
      to: s.email,
      city: s.city,
      subject: r.subject,
      text: r.text,
      html: r.html,
      priceCity: r.priceCity,
      localLine: r.localLine,
      alreadySent: wasSent,
    });
  }

  return {
    drafts,
    excluded,
    counts: { total: subs.length, clean: drafts.length, excluded: excluded.length, alreadySent },
  };
}

// Record a successful send so the same subscriber is not mailed twice for this
// edition. Uses the existing inquiries table (no schema change); tolerant of
// insert failure so a DB hiccup never blocks the actual email that already went.
export async function recordNewsletterSent(supabase: SupabaseClient, email: string): Promise<void> {
  try {
    await supabase.from('inquiries').insert({
      name: 'Newsletter send log',
      email,
      phone: null,
      message: `[NEWSLETTER-SENT] edition=${EDITION} email=${email}`,
      listing_id: null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // best-effort; the email already sent
  }
}
