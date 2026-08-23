// Part B score-powered outreach, sent via the platform's OWN mailer (sendMail),
// not Gmail drafts. Gmail mangled links and re-injected signatures on every
// save; the platform mailer sends clean HTML with real <a> anchors and the
// signature we author. Every send is gated behind an operator click on
// /admin/outreach (nothing here sends on its own).
//
// All approved rules are enforced here: three bands, human phrasing,
// blank-vs-answered-No (unchecked reads as "not yet shown", which for unclaimed
// listings is always blank), US market excluded, suppression list, two-touch
// cap, one-conversation-per-clinic (dedupe by email), 0/7 skipped.

/* eslint-disable @typescript-eslint/no-explicit-any */

const MAILING = 'TheDripMap, Caledon, Ontario, Canada';
const SITE = 'https://www.thedripmap.com';
const SENDER = 'Deborah';

export type OutreachMarket = 'CA' | 'US';

// State-specific regulatory context, used ONLY in US copy and ONLY for states
// where the law has been read and cited. An absent state gets no regulatory
// sentence at all, which is the safe default: we would rather send a plainer
// email than an inaccurate one. Nothing here is legal advice; each line states
// a published requirement and names it, and none of it tells a clinic what to
// do about it.
//
// TEXAS SOURCES (read 2026-08-23):
//   - 22 TAC 169.28, effective 2026-01-09: a facility performing delegated
//     medical acts must prominently display the delegating physician's name and
//     the complaint notice in public areas and treatment rooms, and personnel
//     performing delegated medical acts must wear name tags showing their name
//     and license or credentials.
//   - HB 3749, "Jenifer's Law", effective 2025-09-01, following the 2023 death
//     of Jenifer Cleveland after an IV infusion at a Wortham med spa: elective
//     IV therapy may be administered only by a physician, physician assistant,
//     APRN, or registered nurse, under physician supervision.
// Before adding a state here, read the statute or rule and record it the same
// way. Do not paraphrase from a summary.
interface RegContext {
  /** One or two sentences of published, cited fact. No advice, no urgency. */
  line: string;
  /** The register we check a prescriber against in that state. */
  register: string;
}
const REG_CONTEXT: Record<string, RegContext> = {
  Texas: {
    line:
      'Texas asks med spas to display their delegating physician\'s name where patients can see it, and staff performing delegated acts to wear their credentials. Since Jenifer\'s Law took effect in September 2025, only a physician, PA, APRN, or registered nurse may administer an elective IV.',
    register: 'the Texas Medical Board register',
  },
};
const PRIORITY = ['Toronto', 'Mississauga', 'Vaughan', 'Richmond Hill', 'Markham', 'Brampton', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'];
// Cities with >= 20 listing_events views in the trailing 30 days get the
// "patients compared X times" line. Recompute periodically; static keeps the
// admin preview fast and the number honest (only real 20+ totals).
const CITY_20PLUS: Record<string, number> = { Montreal: 83, Toronto: 34, Mississauga: 24 };

const PHRASE: Record<string, string> = {
  // The 2026-08-16 rule change renamed this check from "Medical oversight
  // disclosed" to "Prescriber verified with their regulator" but nothing added
  // the new key here, so phraseFor fell through to label.toLowerCase() and live
  // emails read "the five not yet shown are prescriber verified with their
  // regulator, ...". Both keys are kept: the old one so any row still carrying
  // the previous label renders correctly.
  'Prescriber verified with their regulator': 'who prescribes, checked against their public register',
  'Medical oversight disclosed': 'who provides medical oversight',
  'Administering professional identified': 'who administers your IVs',
  'Health screening disclosed': 'whether there is a health screening before treatment',
  'Drip ingredients disclosed': 'what is in your drips',
  'Pricing published': 'your pricing',
  'Business details confirmed': 'your current business details',
  'Booking path available': 'how patients can book',
};
const phraseFor = (label: string) => PHRASE[label] || label.toLowerCase();
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const numWord = (n: number) => (n >= 0 && n < 10 ? NUM[n] : String(n));
function joinNatural(arr: string[]): string {
  if (arr.length <= 1) return arr[0] || '';
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
}
const claimUrlFor = (slug: string) => `${SITE}/providers/${slug}?claim=1`;
function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// One-click unsubscribe (path form, QP-safe — a ?e= query gets mangled by
// quoted-printable MIME). Points at the shared newsletter unsubscribe endpoint,
// which writes to email_suppressions — the list every send path (including this
// one) reads. Replaces the old "Reply REMOVE" instruction (operator ruling
// 2026-08-11): a real one-click link is the CASL-preferred mechanism.
const unsubUrl = (email: string) => `${SITE}/api/newsletter/unsubscribe/${encodeURIComponent(email)}`;
// CASL (Canada) and CAN-SPAM (US) both require identification, a valid physical
// mailing address, and a working opt-out. The same footer satisfies both; only
// the descriptor changes, because "the Canadian IV therapy matching platform"
// would be inaccurate in a US inbox.
function caslText(name: string, email: string, market: OutreachMarket = 'CA'): string {
  const what = market === 'US' ? 'the IV therapy matching platform' : 'the Canadian IV therapy matching platform';
  return `You are receiving this because ${name} is listed on TheDripMap, ${what}. ${MAILING}. To stop receiving these emails, unsubscribe here: ${unsubUrl(email)}`;
}
const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * The seven-segment progress bar. Filled segments are the checks the clinic
 * already passes, so the owner sees their own progress rather than a scolding.
 * Built from padded <td> cells, not CSS bars, because Outlook drops CSS
 * backgrounds on divs but honours them on table cells.
 */
function segmentsHtml(score: number, total = 7): string {
  const cells: string[] = [];
  for (let i = 0; i < total; i++) {
    const on = i < score;
    cells.push(
      `<td width="30" height="8" style="width:30px;height:8px;background-color:${on ? '#0F6E56' : '#D5E3DD'};border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>`,
    );
    if (i < total - 1) cells.push('<td width="5" style="width:5px;font-size:0;line-height:0;">&nbsp;</td>');
  }
  return cells.join('');
}

export interface RenderInput {
  /** Full greeting line, e.g. "Hi Katy Wellness team," */
  greeting: string;
  /** Body paragraphs shown above the score module. */
  paras: string[];
  score: number;
  /** The sentence shown under the seven segments. */
  scoreLine: string;
  /** Paragraphs shown between the score module and the button. */
  tailParas: string[];
  claimUrl: string;
  email: string;
  name: string;
  market: OutreachMarket;
  /** Inbox preview line. Keep under about 90 characters. */
  previewText: string;
}

/**
 * THE single renderer for outreach email. Everything we send to a clinic goes
 * through here, in the house design the operator approved on 2026-08-23:
 * 600px, inline styles only, a padded-<td> bulletproof button, the seven
 * segment progress module, and a compliant footer. A plain-text alternative is
 * always produced alongside.
 *
 * Before this, the code mailer emitted a plainer HTML while the batch that
 * actually went out was hand-drafted in Gmail from the house template, so two
 * different-looking emails could both be "the outreach email" and neither was
 * the source of truth. One renderer means what we review is what sends.
 */
function render(input: RenderInput): { text: string; html: string } {
  const { greeting, paras, score, scoreLine, tailParas, claimUrl, email, name, market, previewText } = input;

  const text = [
    greeting,
    ...paras,
    scoreLine,
    ...tailParas,
    `Claim your listing: ${claimUrl}`,
    'Warm regards,',
    `${SENDER}\nFounder, TheDripMap\nthedripmap.com`,
    caslText(name, email, market),
  ].join('\n\n');

  const p = (t: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3D4F49;">${escapeHtml(t)}</p>`;
  const whatWeAre = market === 'US' ? 'the IV therapy matching platform' : 'the Canadian IV therapy matching platform';

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
    + `<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0F6E56;">Your listing today</p>`
    + `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${segmentsHtml(score)}</tr></table>`
    + `<p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#3D4F49;">${escapeHtml(scoreLine)}</p>`
    + `</td></tr></table>`
    + `<div style="height:24px;line-height:24px;font-size:0;">&nbsp;</div>`
    + tailParas.map(p).join('')
    + `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 0;"><tr><td align="center" style="background-color:#0F6E56;border-radius:10px;">`
    + `<a href="${claimUrl}" style="display:inline-block;padding:14px 34px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;">Claim your free listing</a>`
    + `</td></tr></table>`
    + `<p style="margin:12px 0 28px;text-align:center;font-size:12.5px;color:#6E837B;">Free, takes about two minutes</p>`
    + `<p style="margin:0;font-size:15px;color:#3D4F49;">Warm regards,</p>`
    + `<p style="margin:4px 0 0;font-size:15px;line-height:1.5;color:#1A2B26;"><strong>${SENDER}</strong><br><span style="font-size:13.5px;color:#6E837B;">Founder, TheDripMap</span><br><a href="${SITE}" style="font-size:13.5px;color:#0F6E56;text-decoration:none;">thedripmap.com</a></p>`
    + `</td></tr>`
    + `<tr><td style="padding:22px 24px 0;font-size:12px;line-height:1.6;color:#8A9C94;text-align:center;font-family:${FONT};">`
    + `You are receiving this because ${escapeHtml(name)} is listed on TheDripMap, ${whatWeAre}.<br>`
    + `${escapeHtml(MAILING)} &nbsp;&middot;&nbsp; <a href="${unsubUrl(email)}" style="color:#8A9C94;text-decoration:underline;">Unsubscribe</a>`
    + `</td></tr>`
    + `</table></td></tr></table></body></html>`;

  return { text, html };
}

export interface OutreachDraft {
  id: string;
  to: string;
  name: string;
  city: string;
  band: '0-2' | '3-5';
  score: number;
  touch: 'first' | 'followup-replacement';
  views: number;
  subject: string;
  text: string;
  html: string;
}

export interface OutreachCounts {
  qualifying: number;
  capped_out: number;
  suppressed: number;
  skipped_0of7: number;
  no_email: number;
  bounced: number;
  us_excluded: number;
  dup_same_email: number;
}

export interface QueueOptions {
  /** Which market to build for. Defaults to CA, so existing callers are unchanged. */
  market?: OutreachMarket;
  /**
   * US only: restrict to these states (e.g. ['Texas']). Enforced because US
   * copy leans on state regulatory context, and we only have verified context
   * for the states in REG_CONTEXT. Omit to allow every US state.
   */
  states?: string[];
}

/**
 * The markets the operator can pick on /admin/outreach. Defined once here so
 * the API and the UI cannot drift apart, and so a market can never be selected
 * that the queue builder does not understand.
 *
 * Every market runs the SAME rails: suppression tables, two-touch cap, 0/7
 * skip, one-conversation-per-email dedupe, default-paused kill switch, typed
 * confirmation code, and recordSentTouch on each success. A new market is a
 * filter, never an exemption.
 */
export const OUTREACH_MARKETS: Array<{ key: string; label: string; blurb: string; opts: QueueOptions }> = [
  { key: 'CA', label: 'Canada', blurb: 'The core market. 84 percent already first-touched.', opts: { market: 'CA' } },
  { key: 'US-TX', label: 'Texas (US pilot)', blurb: 'Measured test against the Canadian claim rate.', opts: { market: 'US', states: ['Texas'] } },
];

export function queueOptionsFor(key?: string | null): QueueOptions {
  const found = OUTREACH_MARKETS.find((m) => m.key === (key || 'CA'));
  return found ? found.opts : OUTREACH_MARKETS[0].opts;
}
export function marketLabelFor(key?: string | null): string {
  const found = OUTREACH_MARKETS.find((m) => m.key === (key || 'CA'));
  return found ? found.label : OUTREACH_MARKETS[0].label;
}

// Build the full qualifying list (ordered priority-cities-first). The admin
// route slices the next `limit` for the pending batch.
export async function computeOutreachQueue(
  supabase: any,
  opts: QueueOptions = {},
): Promise<{ drafts: OutreachDraft[]; counts: OutreachCounts }> {
  const market: OutreachMarket = opts.market || 'CA';
  const stateFilter = opts.states && opts.states.length ? new Set(opts.states) : null;
  const counts: OutreachCounts = { qualifying: 0, capped_out: 0, suppressed: 0, skipped_0of7: 0, no_email: 0, bounced: 0, us_excluded: 0, dup_same_email: 0 };

  const supp = new Set<string>();
  for (const t of ['email_suppressions', 'outreach_suppressions']) {
    let f = 0;
    for (;;) {
      const { data, error } = await supabase.from(t).select('email').range(f, f + 999);
      if (error) throw new Error(`Refusing to build queue: could not load ${t}: ${error.message}`);
      for (const r of (data as { email: string }[]) || []) if (r.email) supp.add(r.email.toLowerCase().trim());
      if (!data || data.length < 1000) break;
      f += 1000;
    }
  }

  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const pv: Record<string, number> = {};
  {
    let f = 0;
    for (;;) {
      const { data } = await supabase.from('listing_events').select('provider_id,event_type,created_at').eq('event_type', 'view').gte('created_at', since).range(f, f + 999);
      if (!data || !data.length) break;
      for (const e of data as { provider_id: string }[]) pv[e.provider_id] = (pv[e.provider_id] || 0) + 1;
      if (data.length < 1000) break;
      f += 1000;
    }
  }

  let P: any[] = [];
  {
    let g = 0;
    for (;;) {
      const { data } = await supabase.from('providers').select('id,name,slug,city,state,country,email,email_bounced,is_claimed,is_hidden,transparency_score,transparency_checks,outreach_sent,followup_sent,reply_category,needs_human,decision_drivers').range(g, g + 999);
      if (!data || !data.length) break;
      P = P.concat(data);
      if (data.length < 1000) break;
      g += 1000;
    }
  }

  const drafts: OutreachDraft[] = [];
  for (const p of P) {
    if (p.is_hidden || p.is_claimed) continue;
    if (market === 'CA') {
      if (p.country !== 'Canada') { counts.us_excluded++; continue; }
    } else {
      if (p.country !== 'United States') { counts.us_excluded++; continue; }
      if (stateFilter && !stateFilter.has(p.state)) { counts.us_excluded++; continue; }
    }
    const email = (p.email || '').toLowerCase().trim();
    if (!email) { counts.no_email++; continue; }
    if (p.email_bounced) { counts.bounced++; continue; }
    if (supp.has(email)) { counts.suppressed++; continue; }
    if (['not_interested', 'replied', 'closed', 'flagged', 'unsubscribed'].includes((p.reply_category || '').toLowerCase())) continue;
    if (p.needs_human) continue;
    if ((p.decision_drivers || {}).source === 'orphan_claim_stub') continue;
    const touches = (p.outreach_sent ? 1 : 0) + (p.followup_sent ? 1 : 0);
    if (touches >= 2) { counts.capped_out++; continue; }
    const score = p.transparency_score;
    if (score == null) continue;
    if (score === 0) { counts.skipped_0of7++; continue; }

    const unmet = (p.transparency_checks || []).filter((c: any) => !c.passed).map((c: any) => c.label);
    const unmetPhrases = unmet.map(phraseFor);
    const views = pv[p.id] || 0;
    const cityViews = CITY_20PLUS[p.city] || 0;
    const band: '0-2' | '3-5' = score <= 2 ? '0-2' : '3-5';
    const viewLine = views >= 5 ? ` Your listing was viewed ${views} times in the same period.` : '';
    const cityLine = cityViews >= 20 ? `Patients in ${p.city} compared IV therapy clinics on TheDripMap ${cityViews} times in the last month.` : '';
    const claimUrl = claimUrlFor(p.slug);

    let subject: string;
    const paras: string[] = [];
    if (market === 'US') {
      // US copy. Three differences from the Canadian version, all deliberate:
      // (1) it opens by saying the listing exists, because a US owner has
      // almost certainly never heard of us; (2) where we have verified state
      // regulatory context it says what that state already asks of them, which
      // makes the prescriber ask feel like zero work (the name is already on
      // their wall) rather than a favour to us; (3) it is honest that unclaimed
      // US pages are not indexed, since claiming is what changes that.
      const reg = REG_CONTEXT[p.state];
      const register = reg ? reg.register : 'their state medical board register';
      const openLine = `${p.name} is listed on TheDripMap, where patients compare IV therapy clinics before they book. Your page is live, it is free, and no one has claimed it yet.`;
      // The prescriber point is pulled OUT of the "not yet shown" list and given
      // its own sentence. Leaving it in made the paragraph say the same thing
      // twice, and it is the one point the owner cannot supply by filling a
      // form, so it reads better as an offer than as another item on their list.
      const ownUnmet = (p.transparency_checks || [])
        .filter((c: any) => !c.passed && c.key !== 'oversight')
        .map((c: any) => phraseFor(c.label));
      const scoreLine = `Your page shows ${score} of the 7 details patients compare. The ${numWord(ownUnmet.length)} you can add yourself are ${joinNatural(ownUnmet)}. The last one, your supervising physician, is the point we verify for you against ${register}, so the name and license number already posted in your clinic is all we need.`;
      const closeLine = `Claiming is free and takes about two minutes. While we build out the US, claimed listings are the only ones we open to search engines, so yours would be among the first in ${p.state}.`;

      if (band === '0-2') {
        subject = `Your ${p.city} listing on TheDripMap`;
      } else {
        subject = `${p.name} shows ${score} of 7 transparency details on TheDripMap`;
      }
      paras.push(openLine);
      if (reg) paras.push(`${reg.line} Patients have started checking for that themselves, and a listing is where they look first.`);

      const { text, html } = render({
        greeting: `Hi ${p.name} team,`,
        paras,
        score,
        scoreLine,
        tailParas: [closeLine],
        claimUrl,
        email: p.email,
        name: p.name,
        market,
        previewText: `Your listing shows ${score} of 7. Two minutes finishes it and we verify your physician for you.`,
      });
      drafts.push({ id: p.id, to: p.email, name: p.name, city: p.city, band, score, touch: touches === 1 ? 'followup-replacement' : 'first', views, subject, text, html, _prio: 999, _views: views } as any);
      continue;
    }
    // Canadian copy, unchanged in wording. It is only re-partitioned into the
    // three slots the house renderer expects: what goes above the score module,
    // the sentence inside it, and what goes below it before the button.
    let scoreLine: string;
    const tailParas: string[] = [];
    if (band === '0-2') {
      subject = `Patients are comparing ${p.city} IV clinics on TheDripMap`;
      paras.push(cityLine ? cityLine + viewLine : `Patients are comparing IV therapy clinics in ${p.city} on TheDripMap.` + viewLine);
      scoreLine = `Right now your listing shows ${score} of the 7 transparency details patients look for before they book. The ${numWord(unmet.length)} not yet shown are ${joinNatural(unmetPhrases)}.`;
      tailParas.push('Claiming your listing is free and takes a few minutes, and filling these in updates what patients see right away.');
    } else {
      subject = `${p.name} shows ${score} of 7 transparency details on TheDripMap`;
      if (cityLine) paras.push(cityLine);
      if (viewLine) paras.push(viewLine.trim());
      scoreLine = `Your listing on TheDripMap already shows ${score} of 7 transparency details, which puts you ahead of most clinics in ${p.city}. You are ${numWord(unmet.length)} details away from a full 7 of 7: ${joinNatural(unmetPhrases)}.`;
      tailParas.push('Claiming your listing is free and takes a few minutes, and adding those details completes your profile the moment you save.');
    }
    const { text, html } = render({
      greeting: `Hi ${p.name} team,`,
      paras,
      score,
      scoreLine,
      tailParas,
      claimUrl,
      email: p.email,
      name: p.name,
      market,
      previewText: `Your listing shows ${score} of 7, and two minutes finishes it.`,
    });
    drafts.push({ id: p.id, to: p.email, name: p.name, city: p.city, band, score, touch: touches === 1 ? 'followup-replacement' : 'first', views, subject, text, html, _prio: PRIORITY.indexOf(p.city) === -1 ? 999 : PRIORITY.indexOf(p.city), _views: views } as any);
  }

  drafts.sort((a: any, b: any) => a._prio - b._prio || b._views - a._views);

  // One conversation per clinic: dedupe by email.
  const seen = new Set<string>();
  const deduped: OutreachDraft[] = [];
  for (const d of drafts) {
    const k = d.to.toLowerCase().trim();
    if (seen.has(k)) { counts.dup_same_email++; continue; }
    seen.add(k);
    deduped.push(d);
  }
  counts.qualifying = deduped.length;
  return { drafts: deduped, counts };
}

// Render a single sample email for the "send test" preview, using a fixed
// example clinic so the operator can eyeball the format for their own address.
export function sampleTestEmail(toName = 'your clinic'): { subject: string; text: string; html: string } {
  const { text, html } = render({
    greeting: `Hi ${toName} team,`,
    paras: ['Patients in Toronto compared IV therapy clinics on TheDripMap 34 times in the last month.'],
    score: 1,
    scoreLine: 'Right now your listing shows 1 of the 7 transparency details patients look for before they book. The six not yet shown are who provides medical oversight, who administers your IVs, whether there is a health screening before treatment, your pricing, your current business details, and how patients can book.',
    tailParas: ['Claiming your listing is free and takes a few minutes, and filling these in updates what patients see right away.'],
    claimUrl: claimUrlFor('urban-iv-toronto'),
    email: 'sample@example.com',
    name: toName,
    market: 'CA',
    previewText: 'Your listing shows 1 of 7, and two minutes finishes it.',
  });
  return { subject: 'TEST: Patients are comparing Toronto IV clinics on TheDripMap', text, html };
}

// Record the touch after a successful send (so the two-touch cap advances and
// the clinic is not re-queued). touches 0 -> outreach_sent; touches 1 ->
// followup_sent (the second and final touch).
export async function recordSentTouch(supabase: any, providerId: string, touch: 'first' | 'followup-replacement') {
  const now = new Date().toISOString();
  const patch = touch === 'first'
    ? { outreach_sent: true, outreach_sent_at: now }
    : { followup_sent: true, followup_sent_at: now };
  await supabase.from('providers').update(patch).eq('id', providerId);
}
