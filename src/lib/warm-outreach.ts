/**
 * Warm outreach, "give first" (Activation Plan step 5, 2026-09-10).
 *
 * To UNCLAIMED Canadian clinics whose page patients already open on
 * TheDripMap (and the handful the advisor's Search Console read named): we
 * run the activation engine on their website FIRST, then write to say what we
 * found and ask them to claim and confirm. The email leads with what was built
 * for them, not with a request.
 *
 * Rails:
 *  - unclaimed, Canada, has email, not bounced, not in either suppression
 *    table (fail closed), no reply category that means "stop"
 *  - the engine must have run (decision_drivers.proposed) so the "we found"
 *    line is true; nothing is claimed about a site we did not read
 *  - one warm email ever per clinic (decision_drivers.warm_outreach.sent_at)
 *  - the two-touch cold cap is respected by default. A clinic already at two
 *    touches is only included when the operator explicitly allows a third,
 *    "give first" touch (allowThirdTouch), and the copy then says up front
 *    that we wrote before.
 *
 * Copy rules: no em or en dashes, "matching platform" never "directory", the
 * badge is never for sale, sender is Deborah.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const SITE = 'https://www.thedripmap.com';
const MAILING = 'TheDripMap, Caledon, Ontario, Canada';
const SENDER = 'Deborah';
const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const VIEW_WINDOW_DAYS = 90;
const MIN_VIEWS = 3;

export const WARM_OUTREACH_TEMPLATE_ID = 'warm_outreach_v1';

// Google Search impressions for the 3 months to 2026-09, from the outside
// advisor's Search Console read (GOAL.md, "What the GSC data said"). These are
// the only clinics we can honestly tell "your page appeared in Google N times";
// everyone else gets the first-party views line only. Refresh when a new read
// arrives; never guess a number.
const GSC_IMPRESSIONS_3MO: Record<string, number> = {
  'inside-health-clinic-oakville': 1241,
  'edmonton-iron-clinic-edmonton': 406,
  'the-gray-clinic-winnipeg': 258,
  'timeless-health-clinic-mississauga': 256,
  'amre-aesthetics-and-wellness-burnaby': 151,
  'revive-iv-and-wellness-regina': 140,
};

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function joinNatural(arr: string[]): string {
  if (arr.length <= 1) return arr[0] || '';
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
}
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const unsubUrl = (email: string) => `${SITE}/api/newsletter/unsubscribe/${encodeURIComponent(email)}`;
const claimUrlFor = (slug: string) => `${SITE}/providers/${slug}?claim=1`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface WarmOutreachInput {
  name: string;
  slug: string;
  city: string;
  email: string;
  views90d: number;
  gscImpressions: number | null;
  /** What the engine found on their site. */
  found: { treatments: number; withPrices: number; hours: boolean; booking: boolean; readOn: string /* YYYY-MM-DD */ };
  /** Prior cold touches (0, 1 or 2). Two means this is the explicit third, "give first" touch. */
  priorTouches: number;
  firstTouchAt: string | null;
}

export interface WarmOutreachEmail { subject: string; previewText: string; text: string; html: string }

export function buildWarmOutreach(input: WarmOutreachInput): WarmOutreachEmail {
  const { name, slug, city, email, views90d, gscImpressions, found, priorTouches, firstTouchAt } = input;
  const claimUrl = claimUrlFor(slug);
  const greeting = `Hi ${name} team,`;

  const foundBits: string[] = [];
  if (found.treatments > 0) foundBits.push(`${plural(found.treatments, 'treatment')}${found.withPrices > 0 ? ` (${found.withPrices} with prices)` : ''}`);
  if (found.hours) foundBits.push('your opening hours');
  if (found.booking) foundBits.push('your booking link');
  const readDate = (() => { const d = new Date(found.readOn); return isNaN(d.getTime()) ? 'recently' : `on ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`; })();

  const paras: string[] = [];
  if (priorTouches > 0) {
    const d = firstTouchAt ? new Date(firstTouchAt) : null;
    const when = d && !isNaN(d.getTime()) ? ` in ${MONTHS[d.getUTCMonth()]}` : ' before';
    paras.push(`I wrote to you${when} about ${name}'s listing on TheDripMap. This time I am not writing with a question. We went ahead and built your profile.`);
  }
  const viewsLine = views90d >= MIN_VIEWS
    ? `Patients in ${city} opened ${name}'s page on TheDripMap ${views90d} times in the last ${VIEW_WINDOW_DAYS} days`
    : `Patients in ${city} compare IV therapy clinics on TheDripMap before they book`;
  const gscLine = gscImpressions ? `, and the page appeared in Google search ${gscImpressions.toLocaleString('en-CA')} times over the summer` : '';
  paras.push(`${viewsLine}${gscLine}. Rather than ask you to fill in a blank page, we did the first pass: we read your website ${readDate} and found ${joinNatural(foundBits)}. Every item is labelled with where we found it, and none of it shows to patients until you confirm it.`);

  const scoreLine = `Found on your site: ${joinNatural(foundBits)}. Still needs you: who administers your IVs and who prescribes, the two things patients ask about first and the two we never fill in for you.`;
  const tailParas = [
    'Claiming is free and takes about two minutes: confirm the list, remove anything we got wrong, add the two safety answers, and your page is complete. Complete pages are the ones patients call.',
  ];
  const closing = 'If you would rather I fix something before you claim, reply to this email and tell me what.';
  const subject = priorTouches >= 2
    ? `${name}: we went ahead and built your profile on TheDripMap`
    : `We built ${name}'s profile on TheDripMap. Claim it and confirm`;
  const previewText = `We read your website and pre-filled your page. Two minutes to confirm.`;
  const footerText = `You are receiving this because ${name} is listed on TheDripMap, the Canadian IV therapy matching platform. ${MAILING}. To stop receiving these emails, unsubscribe here: ${unsubUrl(email)}`;

  const text = [
    greeting, ...paras, scoreLine, ...tailParas,
    `Claim and confirm your listing: ${claimUrl}`,
    closing, 'Warm regards,', `${SENDER}\nFounder, TheDripMap\nthedripmap.com`, footerText,
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
    + `<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0F6E56;">What we built for you</p>`
    + `<p style="margin:0;font-size:14px;line-height:1.6;color:#3D4F49;">${escapeHtml(scoreLine)}</p>`
    + `</td></tr></table>`
    + `<div style="height:24px;line-height:24px;font-size:0;">&nbsp;</div>`
    + tailParas.map(p).join('')
    + `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 0;"><tr><td align="center" style="background-color:#0F6E56;border-radius:10px;">`
    + `<a href="${claimUrl}" style="display:inline-block;padding:14px 34px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;">Claim and confirm</a>`
    + `</td></tr></table>`
    + `<p style="margin:12px 0 28px;text-align:center;font-size:12.5px;color:#6E837B;">Free, about two minutes</p>`
    + p(closing)
    + `<p style="margin:0;font-size:15px;color:#3D4F49;">Warm regards,</p>`
    + `<p style="margin:4px 0 0;font-size:15px;line-height:1.5;color:#1A2B26;"><strong>${SENDER}</strong><br><span style="font-size:13.5px;color:#6E837B;">Founder, TheDripMap</span><br><a href="${SITE}" style="font-size:13.5px;color:#0F6E56;text-decoration:none;">thedripmap.com</a></p>`
    + `</td></tr>`
    + `<tr><td style="padding:22px 24px 0;font-size:12px;line-height:1.6;color:#8A9C94;text-align:center;font-family:${FONT};">`
    + `You are receiving this because ${escapeHtml(name)} is listed on TheDripMap, the Canadian IV therapy matching platform.<br>`
    + `${escapeHtml(MAILING)} &nbsp;&middot;&nbsp; <a href="${unsubUrl(email)}" style="color:#8A9C94;text-decoration:underline;">Unsubscribe</a>`
    + `</td></tr>`
    + `</table></td></tr></table></body></html>`;

  return { subject, previewText, text, html };
}

export interface WarmCandidate {
  id: string; slug: string; name: string; city: string; to: string;
  views90d: number; gscImpressions: number | null; priorTouches: number;
  found: WarmOutreachInput['found'];
  email: WarmOutreachEmail;
}
export interface WarmCounts {
  considered: number; eligible: number; capped_two_touch: number; no_engine_run: number; nothing_found: number;
  no_email: number; bounced: number; suppressed: number; replied: number; already_sent: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The warm queue: unclaimed CA clinics with views on TheDripMap in the last
 * 90 days (or a Search Console impression count on record), fully rendered.
 */
export async function buildWarmQueue(
  sb: SupabaseClient,
  opts: { only?: string[]; allowThirdTouch?: boolean; includeSent?: boolean } = {},
): Promise<{ candidates: WarmCandidate[]; counts: WarmCounts }> {
  const counts: WarmCounts = { considered: 0, eligible: 0, capped_two_touch: 0, no_engine_run: 0, nothing_found: 0, no_email: 0, bounced: 0, suppressed: 0, replied: 0, already_sent: 0 };

  const supp = new Set<string>();
  for (const t of ['email_suppressions', 'outreach_suppressions']) {
    const { data, error } = await sb.from(t).select('email').range(0, 4999);
    if (error) throw new Error(`Refusing to build warm queue: could not load ${t}: ${error.message}`);
    for (const r of (data as Array<{ email: string }>) || []) if (r.email) supp.add(r.email.toLowerCase().trim());
  }

  const since = new Date(Date.now() - VIEW_WINDOW_DAYS * 864e5).toISOString();
  const views: Record<string, number> = {};
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from('listing_events').select('provider_id').eq('event_type', 'view').gte('created_at', since).range(f, f + 999);
    if (!data?.length) break;
    for (const e of data as Array<{ provider_id: string }>) views[e.provider_id] = (views[e.provider_id] || 0) + 1;
    if (data.length < 1000) break;
  }

  let q = sb.from('providers')
    .select('id, slug, name, city, email, email_bounced, is_claimed, is_hidden, outreach_sent, outreach_sent_at, followup_sent, reply_category, needs_human, decision_drivers')
    .eq('country', 'Canada').eq('is_claimed', false).eq('is_hidden', false);
  if (opts.only?.length) q = q.in('slug', opts.only);
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);

  const candidates: WarmCandidate[] = [];
  for (const p of (rows as any[]) || []) {
    const v = views[p.id] || 0;
    const gsc = GSC_IMPRESSIONS_3MO[p.slug] ?? null;
    if (v < MIN_VIEWS && !gsc && !opts.only?.length) continue;
    counts.considered++;
    const dd = (p.decision_drivers || {}) as any;
    if (dd.warm_outreach?.sent_at && !opts.includeSent) { counts.already_sent++; continue; }
    const email = (p.email || '').toLowerCase().trim();
    if (!email) { counts.no_email++; continue; }
    if (p.email_bounced) { counts.bounced++; continue; }
    if (supp.has(email)) { counts.suppressed++; continue; }
    if (p.needs_human || ['not_interested', 'replied', 'closed', 'flagged', 'unsubscribed'].includes(String(p.reply_category || '').toLowerCase())) { counts.replied++; continue; }
    const touches = (p.outreach_sent ? 1 : 0) + (p.followup_sent ? 1 : 0);
    if (touches >= 2 && !opts.allowThirdTouch) { counts.capped_two_touch++; continue; }
    const proposed = dd.proposed;
    if (!proposed || !proposed.fetched_at) { counts.no_engine_run++; continue; }
    const seen = new Set<string>();
    let treatments = 0, withPrices = 0;
    for (const t of Array.isArray(proposed.treatments) ? proposed.treatments : []) {
      const c = typeof t?.canonical === 'string' ? t.canonical : '';
      if (!c || seen.has(c)) continue;
      seen.add(c); treatments++;
      if (typeof t?.price === 'string' && /\$\s?\d/.test(t.price)) withPrices++;
    }
    const enriched: string[] = Array.isArray(dd.enriched_fields) ? dd.enriched_fields : [];
    const found = { treatments, withPrices, hours: enriched.includes('working_hours'), booking: enriched.includes('online_booking_url'), readOn: String(proposed.fetched_at).slice(0, 10) };
    if (found.treatments === 0 && !found.hours && !found.booking) { counts.nothing_found++; continue; }
    const rendered = buildWarmOutreach({ name: p.name, slug: p.slug, city: p.city || 'your area', email, views90d: v, gscImpressions: gsc, found, priorTouches: touches, firstTouchAt: p.outreach_sent_at || null });
    candidates.push({ id: p.id, slug: p.slug, name: p.name, city: p.city || '', to: email, views90d: v, gscImpressions: gsc, priorTouches: touches, found, email: rendered });
  }
  candidates.sort((a, b) => (b.gscImpressions || 0) - (a.gscImpressions || 0) || b.views90d - a.views90d);
  counts.eligible = candidates.length;
  return { candidates, counts };
}

/** Merge-preserving mark: one warm email ever per clinic. Also advances the touch columns so the cold queue can never re-add them. */
export async function markWarmSent(sb: SupabaseClient, c: WarmCandidate, mailId?: string): Promise<void> {
  const { data } = await sb.from('providers').select('decision_drivers').eq('id', c.id).maybeSingle();
  const dd = (data?.decision_drivers && typeof data.decision_drivers === 'object') ? (data.decision_drivers as Record<string, unknown>) : {};
  const now = new Date().toISOString();
  const touchPatch = c.priorTouches === 0 ? { outreach_sent: true, outreach_sent_at: now } : c.priorTouches === 1 ? { followup_sent: true, followup_sent_at: now } : {};
  await sb.from('providers').update({
    ...touchPatch,
    decision_drivers: { ...dd, warm_outreach: { sent_at: now, template: WARM_OUTREACH_TEMPLATE_ID, mail_id: mailId || null, prior_touches: c.priorTouches } },
  }).eq('id', c.id);
}
