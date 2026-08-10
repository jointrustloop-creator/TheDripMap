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
const PRIORITY = ['Toronto', 'Mississauga', 'Vaughan', 'Richmond Hill', 'Markham', 'Brampton', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'];
// Cities with >= 20 listing_events views in the trailing 30 days get the
// "patients compared X times" line. Recompute periodically; static keeps the
// admin preview fast and the number honest (only real 20+ totals).
const CITY_20PLUS: Record<string, number> = { Montreal: 83, Toronto: 34, Mississauga: 24 };

const PHRASE: Record<string, string> = {
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
function caslSentence(name: string): string {
  return `You are receiving this because ${name} is listed on TheDripMap, the Canadian IV therapy matching platform. ${MAILING}. Reply with the word REMOVE and we will not contact you again.`;
}
function render(name: string, paras: string[], claimUrl: string): { text: string; html: string } {
  const text = [
    `Hi ${name} team,`,
    ...paras,
    `Claim your listing: ${claimUrl}`,
    'Warm regards,',
    `${SENDER}\nFounder, TheDripMap\nthedripmap.com`,
    caslSentence(name),
  ].join('\n\n');
  const pHtml = paras.map((t) => `<p style="margin:0 0 16px;">${escapeHtml(t)}</p>`).join('');
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;">`
    + `<p style="margin:0 0 16px;">Hi ${escapeHtml(name)} team,</p>`
    + pHtml
    + `<p style="margin:24px 0;"><a href="${claimUrl}" style="background:#0F6E56;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;display:inline-block;">Claim your listing</a></p>`
    + `<p style="margin:0;">Warm regards,</p>`
    + `<p style="margin:4px 0 0;">${SENDER}<br>Founder, TheDripMap<br><a href="${SITE}" style="color:#0F6E56;">thedripmap.com</a></p>`
    + `<p style="font-size:12px;color:#9ca3af;line-height:1.5;margin-top:24px;">${escapeHtml(caslSentence(name))}</p>`
    + `</div>`;
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

// Build the full qualifying list (ordered priority-cities-first). The admin
// route slices the next `limit` for the pending batch.
export async function computeOutreachQueue(supabase: any): Promise<{ drafts: OutreachDraft[]; counts: OutreachCounts }> {
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
    if (p.country !== 'Canada') { counts.us_excluded++; continue; }
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
    if (band === '0-2') {
      subject = `Patients are comparing ${p.city} IV clinics on TheDripMap`;
      paras.push(cityLine ? cityLine + viewLine : `Patients are comparing IV therapy clinics in ${p.city} on TheDripMap.` + viewLine);
      paras.push(`Right now your listing shows ${score} of the 7 transparency details patients look for before they book. The ${numWord(unmet.length)} not yet shown are ${joinNatural(unmetPhrases)}. Claiming your listing is free and takes a few minutes, and filling these in updates what patients see right away.`);
    } else {
      subject = `${p.name} shows ${score} of 7 transparency details on TheDripMap`;
      paras.push(`Your listing on TheDripMap already shows ${score} of 7 transparency details, which puts you ahead of most clinics in ${p.city}. You are ${numWord(unmet.length)} details away from a full 7 of 7: ${joinNatural(unmetPhrases)}.`);
      if (cityLine) paras.push(cityLine);
      if (viewLine) paras.push(viewLine.trim());
      paras.push('Claiming your listing is free and takes a few minutes, and adding those details completes your profile the moment you save.');
    }
    const { text, html } = render(p.name, paras, claimUrl);
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
  const paras = [
    'Patients in Toronto compared IV therapy clinics on TheDripMap 34 times in the last month.',
    'Right now your listing shows 1 of the 7 transparency details patients look for before they book. The six not yet shown are who provides medical oversight, who administers your IVs, whether there is a health screening before treatment, your pricing, your current business details, and how patients can book. Claiming your listing is free and takes a few minutes, and filling these in updates what patients see right away.',
  ];
  const { text, html } = render(toName, paras, claimUrlFor('urban-iv-toronto'));
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
