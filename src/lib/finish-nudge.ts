/**
 * Owner "finish your listing" nudge (Activation Plan, 2026-09-09).
 *
 * After the Clinic Activation Engine has read a claimed clinic's website and
 * staged its treatments on decision_drivers.proposed, the owner gets ONE email:
 * what we pre-filled, how strong their page is today, what is still blank, and
 * their private finish link. The whole ask is "confirm or fix, two minutes".
 *
 * Rails (all enforced in buildFinishNudgeQueue, none of them optional):
 *  - claimed Canadian clinics only, with an email that has not bounced
 *  - BOTH suppression tables are read; any error fails closed
 *  - one nudge ever per clinic for this format (decision_drivers.finish_nudge)
 *  - a page already at 100 percent Profile Strength gets nothing
 *  - orphan claim stubs are skipped (no real owner behind them)
 *  - safety answers are never mentioned as pre-filled, because they never are
 *
 * Copy rules: no em or en dashes, "matching platform" never "directory", the
 * badge is never offered for sale, sender is Deborah.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { assessCompleteness, type Completeness, type CompletenessRow } from './display-complete';
import { manageUrlForProvider } from './manage-token';

const SITE = 'https://www.thedripmap.com';
const MAILING = 'TheDripMap, Caledon, Ontario, Canada';
const SENDER = 'Deborah';
const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const FINISH_NUDGE_TEMPLATE_ID = 'finish_nudge_v1';

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function joinNatural(arr: string[]): string {
  if (arr.length <= 1) return arr[0] || '';
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
}
const unsubUrl = (email: string) => `${SITE}/api/newsletter/unsubscribe/${encodeURIComponent(email)}`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Owners typed all sorts of things into the "your name" box: "Front Desk",
// the clinic's own name, "Info". Greeting those as "Hi Front," reads as a
// mail merge gone wrong, so anything that is not plausibly a person's first
// name falls back to the team greeting.
const NOT_A_PERSON = /^(front|desk|team|office|admin|info|reception|clinic|owner|manager|staff|hello|contact|dr\.?)$/i;
function firstNameOf(ownerName: string | null, clinicName: string): string | null {
  const first = (ownerName || '').trim().split(/\s+/)[0] || '';
  if (!first || NOT_A_PERSON.test(first)) return null;
  if (clinicName.toLowerCase().startsWith(first.toLowerCase())) return null;
  return first;
}

/** The facts the email is written from. Everything here is already on the row. */
export interface FinishNudgeInput {
  name: string;
  slug: string;
  city: string;
  ownerName: string | null;
  email: string;
  finishUrl: string;
  /** Treatments the engine staged for the owner to confirm. */
  stagedCount: number;
  /** How many of those carry a price. */
  stagedWithPrice: number;
  /** True when the engine filled opening hours from the clinic's own site. */
  hoursFromSite: boolean;
  completeness: Completeness;
}

export interface FinishNudgeEmail {
  subject: string;
  previewText: string;
  text: string;
  html: string;
}

/**
 * Six-segment Profile Strength bar (one per display-complete item), the same
 * padded-<td> construction as the outreach renderer so Outlook honours it.
 */
function segmentsHtml(c: Completeness): string {
  const cells: string[] = [];
  c.items.forEach((item, i) => {
    cells.push(
      `<td width="30" height="8" style="width:30px;height:8px;background-color:${item.present ? '#0F6E56' : '#D5E3DD'};border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>`,
    );
    if (i < c.items.length - 1) cells.push('<td width="5" style="width:5px;font-size:0;line-height:0;">&nbsp;</td>');
  });
  return cells.join('');
}

export function buildFinishNudge(input: FinishNudgeInput): FinishNudgeEmail {
  const { name, ownerName, email, finishUrl, stagedCount, stagedWithPrice, hoursFromSite, completeness } = input;
  const greeting = `Hi ${firstNameOf(ownerName, name) || `${name} team`},`;
  const missingLabels = completeness.missing.map((m) => m.label.toLowerCase());
  const strength = completeness.strength;

  const paras: string[] = [];
  let subject: string;
  let previewText: string;
  if (stagedCount > 0) {
    const withPrices = stagedWithPrice > 0 ? ` (${stagedWithPrice} with prices)` : '';
    subject = `We pre-filled ${plural(stagedCount, 'treatment')} for ${name}. Two minutes to confirm`;
    previewText = `Your treatment list is ready to confirm. Nothing shows until you save it.`;
    paras.push(`Quick one about ${name}. We read your website and pre-filled ${plural(stagedCount, 'treatment')}${withPrices} on your TheDripMap page. Nothing shows to patients until you confirm it, so the next step is yours: open your page, check the list, remove anything we got wrong, and save.`);
  } else {
    subject = `${name} is ${strength} percent complete on TheDripMap`;
    previewText = `Patients compare clinics on what a page shows. Two minutes fills the blanks.`;
    paras.push(`Quick one about ${name}. Your TheDripMap page is ${strength} percent complete. Patients compare clinics on what a page shows before they book, so a blank costs you bookings you never see.`);
  }
  if (hoursFromSite) {
    paras.push('We also added your opening hours from your own site, so patients no longer see a blank there. If they have changed, the page lets you fix them in a few taps.');
  }

  const scoreLine = completeness.complete
    ? `Profile Strength ${strength} percent. Every detail patients compare is now on your page.`
    : `Profile Strength ${strength} percent. Still blank: ${joinNatural(missingLabels)}.`;

  const tailParas = [
    'Everything lives on your private page. No login, no password, the link below is yours to keep and reopen any time.',
  ];
  const closing = `If something on the pre-filled list is wrong, delete it there or just reply to this email and I will fix it for you.`;

  const footerText = `You are receiving this because you claimed ${name} on TheDripMap, the Canadian IV therapy matching platform. ${MAILING}. To stop these listing updates, unsubscribe here: ${unsubUrl(email)}`;

  const text = [
    greeting,
    ...paras,
    scoreLine,
    ...tailParas,
    `Finish your listing: ${finishUrl}`,
    closing,
    'Warm regards,',
    `${SENDER}\nFounder, TheDripMap\nthedripmap.com`,
    footerText,
  ].join('\n\n');

  const p = (t: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3D4F49;">${escapeHtml(t)}</p>`;
  const html =
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>`
    + `<body style="margin:0;padding:0;background-color:#F4F7F5;">`
    + `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(previewText)}</div>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F7F5;"><tr><td align="center" style="padding:32px 16px;">`
    + `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">`
    + `<tr><td style="padding:0 8px 18px;"><img src="${SITE}/logo.png" alt="TheDripMap" width="150" style="display:block;border:0;max-width:150px;height:auto;"></td></tr>`
    + `<tr><td style="background-color:#FFFFFF;border-radius:16px;padding:36px 40px;font-family:${FONT};">`
    + `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#1A2B26;">${escapeHtml(greeting)}</p>`
    + paras.map(p).join('')
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F7F4;border-radius:12px;"><tr><td style="padding:20px 24px;">`
    + `<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0F6E56;">Your page today</p>`
    + `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${segmentsHtml(completeness)}</tr></table>`
    + `<p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#3D4F49;">${escapeHtml(scoreLine)}</p>`
    + `</td></tr></table>`
    + `<div style="height:24px;line-height:24px;font-size:0;">&nbsp;</div>`
    + tailParas.map(p).join('')
    + `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 0;"><tr><td align="center" style="background-color:#0F6E56;border-radius:10px;">`
    + `<a href="${finishUrl}" style="display:inline-block;padding:14px 34px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;">Finish your listing</a>`
    + `</td></tr></table>`
    + `<p style="margin:12px 0 28px;text-align:center;font-size:12.5px;color:#6E837B;">About two minutes, no login needed</p>`
    + p(closing)
    + `<p style="margin:0;font-size:15px;color:#3D4F49;">Warm regards,</p>`
    + `<p style="margin:4px 0 0;font-size:15px;line-height:1.5;color:#1A2B26;"><strong>${SENDER}</strong><br><span style="font-size:13.5px;color:#6E837B;">Founder, TheDripMap</span><br><a href="${SITE}" style="font-size:13.5px;color:#0F6E56;text-decoration:none;">thedripmap.com</a></p>`
    + `</td></tr>`
    + `<tr><td style="padding:22px 24px 0;font-size:12px;line-height:1.6;color:#8A9C94;text-align:center;font-family:${FONT};">`
    + `You are receiving this because you claimed ${escapeHtml(name)} on TheDripMap, the Canadian IV therapy matching platform.<br>`
    + `${escapeHtml(MAILING)} &nbsp;&middot;&nbsp; <a href="${unsubUrl(email)}" style="color:#8A9C94;text-decoration:underline;">Unsubscribe</a>`
    + `</td></tr>`
    + `</table></td></tr></table></body></html>`;

  return { subject, previewText, text, html };
}

export interface FinishNudgeCandidate {
  id: string;
  slug: string;
  name: string;
  city: string;
  to: string;
  ownerName: string | null;
  strength: number;
  stagedCount: number;
  email: FinishNudgeEmail;
}

export interface FinishNudgeCounts {
  claimed_ca: number;
  eligible: number;
  already_nudged: number;
  complete: number;
  no_email: number;
  bounced: number;
  suppressed: number;
  orphan_stub: number;
}

interface ProviderRow extends CompletenessRow {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  email: string | null;
  email_bounced: boolean | null;
  website?: string | null;
  decision_drivers?: (CompletenessRow['decision_drivers'] & {
    source?: string;
    hours_source?: string;
    finish_nudge?: { sent_at?: string };
    proposed?: { treatments?: Array<{ canonical?: string | null; price?: string | null }> };
  }) | null;
}

async function ownerNameFor(sb: SupabaseClient, providerId: string): Promise<string | null> {
  // Where owners told us their name, newest source first.
  const { data: ob } = await sb.from('onboarding_requests').select('owner_name').eq('provider_id', providerId).maybeSingle();
  if (ob?.owner_name) return String(ob.owner_name);
  const { data: cr } = await sb.from('claim_requests').select('owner_name').eq('listing_id', providerId).eq('status', 'verified').order('verified_at', { ascending: false }).limit(1).maybeSingle();
  if (cr?.owner_name) return String(cr.owner_name);
  const { data: op } = await sb.from('operator_profiles').select('owner_name').eq('clinic_id', providerId).maybeSingle();
  if (op?.owner_name) return String(op.owner_name);
  return null;
}

/**
 * Every claimed Canadian clinic that should receive the nudge, fully rendered.
 * `only` restricts to slugs (operator batches); `includeNudged` lets a TEST
 * render reuse a clinic that already got the real one.
 */
export async function buildFinishNudgeQueue(
  sb: SupabaseClient,
  opts: { only?: string[]; includeNudged?: boolean } = {},
): Promise<{ candidates: FinishNudgeCandidate[]; counts: FinishNudgeCounts }> {
  const counts: FinishNudgeCounts = { claimed_ca: 0, eligible: 0, already_nudged: 0, complete: 0, no_email: 0, bounced: 0, suppressed: 0, orphan_stub: 0 };

  const supp = new Set<string>();
  for (const t of ['email_suppressions', 'outreach_suppressions']) {
    const { data, error } = await sb.from(t).select('email').range(0, 4999);
    if (error) throw new Error(`Refusing to build nudge queue: could not load ${t}: ${error.message}`);
    for (const r of (data as Array<{ email: string }>) || []) if (r.email) supp.add(r.email.toLowerCase().trim());
  }

  let q = sb
    .from('providers')
    .select('id, slug, name, city, email, email_bounced, website, phone, online_booking_url, working_hours, price_range, services, specialties, image_url, photos, medical_team, decision_drivers')
    .eq('is_claimed', true)
    .eq('country', 'Canada')
    .order('claimed_at', { ascending: false });
  if (opts.only && opts.only.length) q = q.in('slug', opts.only);
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);

  const candidates: FinishNudgeCandidate[] = [];
  for (const p of (rows as ProviderRow[]) || []) {
    counts.claimed_ca++;
    const dd = p.decision_drivers || {};
    if (dd.source === 'orphan_claim_stub') { counts.orphan_stub++; continue; }
    if (dd.finish_nudge?.sent_at && !opts.includeNudged) { counts.already_nudged++; continue; }
    const email = (p.email || '').toLowerCase().trim();
    if (!email) { counts.no_email++; continue; }
    if (p.email_bounced) { counts.bounced++; continue; }
    if (supp.has(email)) { counts.suppressed++; continue; }

    const { data: op } = await sb.from('operator_profiles').select('owner_name, profile_data').eq('clinic_id', p.id).maybeSingle();
    const completeness = assessCompleteness({ ...p, operator_profile: op || null });
    if (completeness.complete) { counts.complete++; continue; }

    const finishUrl = await manageUrlForProvider(sb, p.id);
    if (!finishUrl) continue; // no private link = nothing to send them to
    const treatments = Array.isArray(dd.proposed?.treatments) ? dd.proposed!.treatments! : [];
    const seen = new Set<string>();
    let stagedCount = 0;
    let stagedWithPrice = 0;
    for (const t of treatments) {
      const c = typeof t?.canonical === 'string' ? t.canonical : '';
      if (!c || seen.has(c)) continue;
      seen.add(c);
      stagedCount++;
      if (typeof t?.price === 'string' && /\$\s?\d/.test(t.price)) stagedWithPrice++;
    }
    const ownerName = await ownerNameFor(sb, p.id);
    const email_ = buildFinishNudge({
      name: p.name,
      slug: p.slug,
      city: p.city || '',
      ownerName,
      email,
      finishUrl,
      stagedCount,
      stagedWithPrice,
      hoursFromSite: typeof dd.hours_source === 'string' && dd.hours_source.startsWith('website:'),
      completeness,
    });
    candidates.push({ id: p.id, slug: p.slug, name: p.name, city: p.city || '', to: email, ownerName, strength: completeness.strength, stagedCount, email: email_ });
  }
  counts.eligible = candidates.length;
  return { candidates, counts };
}

/** Merge-preserving mark so the same clinic is never nudged twice. */
export async function markFinishNudgeSent(sb: SupabaseClient, providerId: string, mailId?: string): Promise<void> {
  const { data } = await sb.from('providers').select('decision_drivers').eq('id', providerId).maybeSingle();
  const dd = (data?.decision_drivers && typeof data.decision_drivers === 'object') ? (data.decision_drivers as Record<string, unknown>) : {};
  await sb.from('providers').update({
    decision_drivers: { ...dd, finish_nudge: { sent_at: new Date().toISOString(), template: FINISH_NUDGE_TEMPLATE_ID, mail_id: mailId || null } },
  }).eq('id', providerId);
}
