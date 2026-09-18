/**
 * First touch for clinics we listed FROM the CONO IVIT premises register
 * (September Sprint move 1 fuel). These rows cannot use warm_outreach_v1: that
 * template opens with how many people viewed the page, and a page listed days
 * ago has no views yet. This one opens with the only fact that is already true
 * and verifiable: the College authorized this premises for IV therapy, and we
 * named the ND from that register.
 *
 * Template id: register_first_touch_v1. One touch per clinic, ever. Counts as
 * touch 1 against the two-touch cap (sets outreach_sent).
 *
 *   npx tsx scripts/_register-first-touch.ts --preview [--limit N]
 *   npx tsx scripts/_register-first-touch.ts --test [--slug x]     [TEST] copy to info@ + cc operator
 *   npx tsx scripts/_register-first-touch.ts --send --confirm SEND [--limit N]
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import { createClient } from '@supabase/supabase-js';
import { manageUrlForProvider } from '../src/lib/manage-token';

const args = process.argv.slice(2);
const val = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const flag = (n: string) => args.includes(`--${n}`);
const LIMIT = Number(val('limit')) || 100;
const TEMPLATE = 'register_first_touch_v1';
const BASE = 'https://www.thedripmap.com';

interface TeamMember { name?: string; title?: string; registration?: string; source?: string }

const firstName = (clinic: string) => `${clinic} team`;

/** "Dr. Chelsea Norma Beatrice Grant, ND" -> "Dr. Chelsea Grant, ND" */
function shortenName(full: string): string {
  const m = full.match(/^(Dr\.?\s+)?(.+?)(,\s*ND)?$/i);
  if (!m) return full;
  const parts = m[2].trim().split(/\s+/);
  const core = parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts.join(' ');
  return `${m[1] ? 'Dr. ' : ''}${core}${m[3] ? ', ND' : ''}`;
}

function buildEmail(p: { name: string; slug: string; city: string | null; medical_team: TeamMember[] }, finishUrl: string) {
  const team = (p.medical_team || []).filter((t) => t && t.name);
  const lead = team[0];
  const leadLine = team.length > 1
    ? `${shortenName(lead.name!)} (${lead.registration}) and ${team.length - 1} other naturopathic ${team.length - 1 === 1 ? 'doctor' : 'doctors'} on that authorization`
    : `${shortenName(lead.name!)} (${lead.registration})`;
  const subject = `We listed ${p.name} on TheDripMap from the Ontario IVIT register`;
  const text = `Hi ${firstName(p.name)},

I run TheDripMap, a matching platform where patients across Canada find IV therapy clinics.

${p.name} appears on the College of Naturopaths of Ontario register of premises authorized for intravenous infusion therapy, so I built you a page and named ${leadLine}. Nothing there is invented: the practitioner names and registration numbers come straight from the College register.

Your page is live here: ${BASE}/providers/${p.slug}

What it is missing is the part only you can give: the drips you actually offer, at least one price, and your opening hours. A patient who finds you today can see that you are authorized, but cannot tell what a visit costs, so most of them keep looking.

Two ways to fill it in, whichever is easier:

1. Your private page, two minutes, no login: ${finishUrl}
2. Reply to this email with the details in plain words and I will enter them for you.

There is no charge for any of this. We do not sell ranking or placement, and the listing stays whether you reply or not.

Warm regards,

Deborah
Founder, TheDripMap
thedripmap.com`;
  return { subject, text };
}

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.from('providers')
    .select('id, name, slug, city, email, email_bounced, medical_team, outreach_sent, followup_sent, discovery_flag, decision_drivers')
    .eq('discovery_source', 'cono_ivit_register').eq('country', 'Canada')
    .eq('is_claimed', false).eq('is_hidden', false);
  if (error) throw new Error(error.message);

  const only = val('slug');
  const eligible = (data || []).filter((p) => {
    if (only) return p.slug === only;
    const dd = (p.decision_drivers || {}) as Record<string, unknown>;
    if (!p.email || p.email_bounced) return false;
    if (p.outreach_sent || p.followup_sent) return false;          // two-touch cap: already touched
    if (dd.register_touch || dd.warm_outreach) return false;        // never twice
    if (p.discovery_flag) return false;                             // needs a human check first
    if (!(p.medical_team || []).some((t: TeamMember) => t && t.name)) return false; // the whole hook
    return true;
  }).slice(0, LIMIT);

  console.log(`eligible: ${eligible.length} of ${(data || []).length} CONO rows`);

  // Suppression guard: both lists, fail closed (feedback_outreach_suppression_guard).
  const emails = eligible.map((p) => String(p.email).toLowerCase().trim());
  const suppressed = new Set<string>();
  for (const table of ['email_suppressions', 'outreach_suppressions']) {
    const { data: s, error: se } = await sb.from(table).select('email').in('email', emails);
    if (se) { console.error(`suppression check failed on ${table}: ${se.message}`); process.exit(1); }
    for (const r of s || []) suppressed.add(String(r.email).toLowerCase().trim());
  }
  const queue = eligible.filter((p) => !suppressed.has(String(p.email).toLowerCase().trim()));
  if (suppressed.size) console.log(`suppressed: ${suppressed.size}`);

  const TOKEN = (process.env.ACTIVATION_RUN_TOKEN || '').trim();
  let sent = 0;
  for (const p of queue) {
    const finishUrl = await manageUrlForProvider(sb, p.id);
    if (!finishUrl) { console.log(`skip ${p.slug}: no private link`); continue; }
    const { subject, text } = buildEmail(p as never, finishUrl);
    if (/[–—]/.test(subject + text)) { console.error(`DASH in copy for ${p.slug}`); process.exit(1); }

    if (flag('preview')) { console.log(`\n=== ${p.name} -> ${p.email}\nSUBJECT: ${subject}\n\n${text}\n`); continue; }

    const isTest = flag('test');
    if (!isTest && !(flag('send') && val('confirm') === 'SEND')) { console.error('refusing to send without --send --confirm SEND'); process.exit(1); }
    const to = isTest ? 'info@thedripmap.com' : String(p.email).trim();
    const body = isTest ? `[TEST of ${TEMPLATE}, rendered for ${p.name}; the real one would go to ${p.email}]\n\n${text}` : text;
    const r = await fetch(`${BASE}/api/admin/send-mail`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
      // Real sends go over Resend (never Workspace SMTP for batches); the test
      // copy to our own inbox can use the default so it lands in Sent.
      body: JSON.stringify({ to, subject: isTest ? `[TEST] ${subject}` : subject, text: body, cc: isTest ? 'hubertzyworonek@gmail.com' : undefined, channel: isTest ? 'auto' : 'resend' }),
    });
    console.log(isTest ? 'TEST' : 'SENT', p.slug, r.status, (await r.text()).slice(0, 120));
    if (!isTest && r.ok) {
      const dd = (p.decision_drivers || {}) as Record<string, unknown>;
      await sb.from('providers').update({
        outreach_sent: true, outreach_sent_at: new Date().toISOString(),
        decision_drivers: { ...dd, register_touch: { sent_at: new Date().toISOString(), template: TEMPLATE } },
      }).eq('id', p.id);
      sent++;
    }
    if (isTest) break; // one rendered copy is enough
    // 18 near-identical emails in 40 seconds is a bulk signature. Space them.
    await new Promise((res) => setTimeout(res, 30000));
  }
  if (flag('send')) console.log(`\ndone: ${sent} sent`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
