/**
 * Third touch to unclaimed Canadian clinics (Hubert 2026-09-20: "i don't mind
 * emailing all of our canadian clinics again even if it's 3rd touch, maybe
 * they didn't get our first 2 emails... clinics with views and clicks should
 * get different pitch").
 *
 * Two copies, one template id each, both short and with ONE ask (claim):
 *   third_touch_engaged_v1  clinics with real 90 day views or clicks, the
 *                           numbers come from listing_events (NULL safe)
 *   third_touch_cold_v1     everyone else, last touched 60+ days ago
 *
 * Guards: both suppression tables (fail closed), bounced, replied
 * not_interested/unsubscribed/closed/flagged, discovery_flag, orphan stubs,
 * any prior third touch (decision_drivers.third_touch), last touch inside the
 * cooldown. The CASL block and signature come from /api/admin/send-mail.
 * Real sends go over Resend, 30 s apart; the marks are written only after the
 * route returns ok (recorded-is-not-done).
 *
 *   npx tsx scripts/_third-touch.ts --segment engaged|cold --preview [--limit N]
 *   npx tsx scripts/_third-touch.ts --segment engaged --test [--slug x]
 *   npx tsx scripts/_third-touch.ts --segment engaged --send --confirm SEND --limit 50
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import { createClient } from '@supabase/supabase-js';
import { computeTransparencyScore } from '../src/lib/transparency-score';

const args = process.argv.slice(2);
const val = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const flag = (n: string) => args.includes(`--${n}`);
const SEGMENT = val('segment') === 'engaged' ? 'engaged' : val('segment') === 'cold' ? 'cold' : null;
if (!SEGMENT) { console.error('need --segment engaged|cold'); process.exit(1); }
const LIMIT = Number(val('limit')) || 50;
const BASE = 'https://www.thedripmap.com';
const COOLDOWN_DAYS = 45;
const TEMPLATE = SEGMENT === 'engaged' ? 'third_touch_engaged_v1' : 'third_touch_cold_v1';

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

// Plain words for the score checks, in the order patients ask.
const HUMAN: Record<string, string> = {
  oversight: 'who prescribes, checked against their register',
  administrator: 'who administers your IVs',
  screening: 'whether there is a health screening first',
  ingredients: 'what is in your drips',
  pricing: 'your prices',
  business: 'your address and phone',
  booking: 'how to book',
};
const ASK_ORDER = ['pricing', 'administrator', 'screening', 'ingredients', 'business', 'booking', 'oversight'];

function shownLine(p: Record<string, any>): string {
  const t = computeTransparencyScore(p);
  const passed = t.checks.filter((c) => c.passed).map((c) => HUMAN[c.key]);
  const missing = ASK_ORDER.filter((k) => t.checks.some((c) => c.key === k && !c.passed)).map((k) => HUMAN[k]);
  const have = passed.length ? `it already shows ${passed.slice(0, 3).join(', ')}` : 'it shows only your name and city';
  const need = missing.length ? ` What patients look for first and cannot see yet: ${missing.slice(0, 2).join(' and ')}.` : '';
  return `Your page is at ${t.score} of 7 on the details patients check before booking: ${have}.${need}`;
}

function openerFor(touches: number, withFact: boolean): string {
  const tail = withFact ? ', so this is the short version with one new fact.' : ', so this is the short version.';
  if (touches >= 2) return `I have written twice before and I know those emails may not have reached you${tail}`;
  if (touches === 1) return `I wrote once before and I know that email may not have reached you${tail}`;
  return withFact ? 'A short note with one fact you may not have seen.' : 'A short note, my first to you.';
}

function build(p: Record<string, any>, ev: { views: number; clicks: number }, touches: number) {
  const claimUrl = `${BASE}/providers/${p.slug}?claim=1`;
  const isCono = p.discovery_source === 'cono_ivit_register' || !!(p.decision_drivers || {}).cono_premise;
  if (SEGMENT === 'engaged') {
    // A clinic qualifies as engaged on views >= 3 OR clicks >= 1, so some of
    // these have a click but only one or two views. Leading with the view count
    // there writes our own worst headline ("was viewed 1 time"), which reads as
    // no demand at all and undersells a clinic that actually had someone try to
    // contact them. When the click is the stronger fact, lead with the click.
    const leadWithClick = ev.clicks > 0 && ev.views < 3;
    const activity = leadWithClick
      ? (ev.clicks === 1
          ? `In the last 90 days someone reading ${p.name}'s page on TheDripMap clicked through to call you, visit your site or book.`
          : `In the last 90 days patients reading ${p.name}'s page on TheDripMap clicked through to call you, visit your site or book ${plural(ev.clicks, 'time')}.`)
      : ev.clicks > 0
        ? `${p.name}'s page on TheDripMap was opened ${plural(ev.views, 'time')} in the last 90 days, with ${plural(ev.clicks, 'click')} through to call you, visit your site or book.`
        : `${p.name}'s page on TheDripMap was opened ${plural(ev.views, 'time')} in the last 90 days.`;
    const subject = leadWithClick
      ? `A patient clicked through to ${p.name} from TheDripMap`
      : `${p.name} was viewed ${plural(ev.views, 'time')} on TheDripMap this summer`;
    const text = `Hi ${p.name} team,

${openerFor(touches, true)}

${activity} That is real demand in ${p.city}, and it is landing on a page you have not touched yet.

${shownLine(p)}

Claiming takes about two minutes, there is no login and no charge, and what you add shows to patients right away. We do not sell ranking or placement.

[Claim ${p.name}](${claimUrl})

If you would rather I fix something first, reply and tell me what.

Deborah
Founder, TheDripMap`;
    return { subject, text };
  }
  const opener = isCono
    ? `${p.name} is on the College of Naturopaths of Ontario register of premises authorized for IV therapy, which is why it has a page on TheDripMap.`
    : `${p.name} has a page on TheDripMap, the Canadian matching platform where patients compare IV therapy clinics before they book.`;
  const subject = `${p.name}: your TheDripMap page is still unclaimed`;
  const text = `Hi ${p.name} team,

${openerFor(touches, false)}

${opener}

${shownLine(p)}

Claiming takes about two minutes, there is no login and no charge, and what you add shows to patients right away. We do not sell ranking or placement, and the page stays either way.

[Claim ${p.name}](${claimUrl})

If anything on the page is wrong, reply and I will fix it before you claim.

Deborah
Founder, TheDripMap`;
  return { subject, text };
}

async function main() {
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const ev = new Map<string, { views: number; clicks: number }>();
  for (let f = 0; ; f += 1000) {
    const { data, error } = await s.from('listing_events').select('provider_id, event_type').gte('created_at', since).or('referrer.is.null,referrer.not.like.i:%').range(f, f + 999);
    if (error) throw error;
    for (const e of data || []) { const c = ev.get(String(e.provider_id)) || { views: 0, clicks: 0 }; if (e.event_type === 'view') c.views++; else c.clicks++; ev.set(String(e.provider_id), c); }
    if (!data || data.length < 1000) break;
  }
  const rows: any[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await s.from('providers').select('*').eq('country', 'Canada').eq('is_hidden', false).eq('is_claimed', false).range(f, f + 999);
    if (error) throw error; rows.push(...(data || [])); if (!data || data.length < 1000) break;
  }
  const { data: s1, error: e1 } = await s.from('email_suppressions').select('email');
  const { data: s2, error: e2 } = await s.from('outreach_suppressions').select('email');
  if (e1 || e2) { console.error('suppression read failed, refusing to continue'); process.exit(1); }
  const sup = new Set([...(s1 || []), ...(s2 || [])].map((r: any) => String(r.email).toLowerCase()));

  const only = val('slug');
  const cutoff = Date.now() - COOLDOWN_DAYS * 86400000;
  const queue = rows.filter((p) => {
    if (only) return p.slug === only;
    const dd = p.decision_drivers || {};
    const email = String(p.email || '').toLowerCase();
    if (!email || p.email_bounced || sup.has(email)) return false;
    if (['not_interested', 'unsubscribed', 'closed', 'flagged', 'interested', 'question'].includes(p.reply_category || '')) return false; // replies get a person, not a template
    if (p.discovery_flag || dd.source === 'orphan_claim_stub') return false;
    if (dd.third_touch) return false;
    const lastTouch = [p.outreach_sent_at, dd.warm_outreach?.sent_at, dd.register_touch?.sent_at, dd.personal_note?.sent_at].filter(Boolean).map((d) => new Date(String(d)).getTime()).sort().pop() || 0;
    if (lastTouch > cutoff) return false;
    const e = ev.get(p.id) || { views: 0, clicks: 0 };
    const engaged = e.views >= 3 || e.clicks >= 1;
    return SEGMENT === 'engaged' ? engaged : !engaged;
  }).sort((a, b) => { const ea = ev.get(a.id) || { views: 0, clicks: 0 }, eb = ev.get(b.id) || { views: 0, clicks: 0 }; return (eb.views + eb.clicks * 3) - (ea.views + ea.clicks * 3); }).slice(0, LIMIT);

  console.log(`segment ${SEGMENT}: ${queue.length} queued (limit ${LIMIT}) of ${rows.length} unclaimed CA`);
  const TOKEN = (process.env.ACTIVATION_RUN_TOKEN || '').trim();
  let sent = 0;
  const touchesOf = (p: any) => { const dd = p.decision_drivers || {}; return (p.outreach_sent ? 1 : 0) + (p.followup_sent ? 1 : 0) + ['warm_outreach', 'register_touch', 'personal_note'].filter((k) => dd[k]).length; };
  for (const p of queue) {
    const e = ev.get(p.id) || { views: 0, clicks: 0 };
    const { subject, text } = build(p, e, touchesOf(p));
    if (/[–—]/.test(subject + text)) { console.error(`DASH in copy for ${p.slug}`); process.exit(1); }
    if (flag('preview')) { console.log(`\n=== ${p.name} (${p.city}) -> ${p.email} | v${e.views} c${e.clicks} touches ${touchesOf(p)}\nSUBJECT: ${subject}\n\n${text}\n`); continue; }
    const isTest = flag('test');
    if (!isTest && !(flag('send') && val('confirm') === 'SEND')) { console.error('refusing to send without --send --confirm SEND'); process.exit(1); }
    const to = isTest ? 'info@thedripmap.com' : String(p.email).trim();
    const body = isTest ? `[TEST of ${TEMPLATE}, rendered for ${p.name}; the real one would go to ${p.email}]\n\n${text}` : text;
    const r = await fetch(`${BASE}/api/admin/send-mail`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ to, subject: isTest ? `[TEST] ${subject}` : subject, text: body, cc: isTest ? 'hubertzyworonek@gmail.com' : undefined, channel: isTest ? 'auto' : 'resend', clinicName: p.name }),
    });
    const res = await r.text();
    let ok = false; try { ok = r.ok && JSON.parse(res).ok === true; } catch { ok = false; }
    console.log(isTest ? 'TEST' : (ok ? 'SENT' : 'FAILED'), p.slug, r.status, res.slice(0, 100));
    if (!isTest && ok) {
      const dd = p.decision_drivers || {};
      const sentAt = new Date().toISOString();
      // followup_sent_at is the column every OTHER system reads as "we last
      // talked to this clinic": the engine heartbeat, the weekly summary, the
      // cooldown checks in other outreach scripts. Writing only the JSON key
      // made 50 real sends invisible on 2026-09-20 and the heartbeat reported
      // outreach stalled. A touch is not recorded until this column moves too.
      await s.from('providers').update({
        followup_sent_at: sentAt,
        decision_drivers: { ...dd, third_touch: { sent_at: sentAt, template: TEMPLATE, views90d: e.views, clicks90d: e.clicks } },
      }).eq('id', p.id);
      sent++;
    }
    if (isTest) break;
    await new Promise((res2) => setTimeout(res2, 30000));
  }
  if (flag('send')) console.log(`\ndone: ${sent} sent`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
