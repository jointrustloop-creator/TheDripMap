/**
 * price_first_touch_v1: the FIRST email to a Canadian clinic we have never
 * written to, asking for one thing, one drip price, instead of a claim.
 *
 * Why (2026-09-27): every claim we ever earned came from a first email, and
 * the never-emailed pool is down to a handful. 150 third touches produced
 * zero. Clinics answer a one-line question by reply far more often than
 * they log in (Ketamind answered three rounds by email and never saved the
 * form). And the price is what the Price Index and the patient both need.
 *
 * Preflight (outreach-preflight skill) was run on 2026-09-27: each site was
 * read; none publishes a drip price; two candidates were dropped (site
 * unreachable, no IV mention). Rows come from a vetted JSON, never a query,
 * so a re-run cannot widen the audience by accident.
 *
 * Counts as touch 1 (sets outreach_sent). Harvested addresses are written to
 * the provider row only after a successful send, with email_source recorded.
 *
 *   npx tsx scripts/_price-first-touch.ts --preview
 *   npx tsx scripts/_price-first-touch.ts --test              [TEST] copy to info@ + cc operator, nothing to a clinic
 *   npx tsx scripts/_price-first-touch.ts --send --confirm SEND [--limit N]
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { manageUrlForProvider } from '../src/lib/manage-token';

const args = process.argv.slice(2);
const val = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const flag = (n: string) => args.includes(`--${n}`);
const LIMIT = Number(val('limit')) || 100;
const TEMPLATE = 'price_first_touch_v1';
const BASE = 'https://www.thedripmap.com';
const ROWS_FILE = '.audit-tmp/first-touch-rows-2026-09-27.json';
// Dropped at preflight: site unreachable / no IV mention on the site.
const DROP = new Set(['artistry-health-inc-hamilton', 'visage-clinical-beauty-winnipeg']);

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function build(p: { name: string; slug: string; city: string }, finishUrl: string) {
  const subject = `${p.name}: one price and your page works for you`;
  const text = `Hi ${p.name} team,

I run TheDripMap, the matching platform where patients across Canada compare IV therapy clinics before they book. ${p.name} has a page there.

[See your ${p.name} page](${BASE}/providers/${p.slug})

Right now that page shows no price, and price is the first thing a patient looks for. Most of them keep looking when they cannot see one.

Reply to this email with the price of one drip, a Myers' Cocktail or whichever you do most, and I will put it on your page today. That is the whole ask.

If you would rather do it yourself, your private page takes two minutes and needs no login:

[Add your prices and hours](${finishUrl})

There is no charge for any of this. We do not sell ranking or placement, and the page stays either way.

Deborah Triandafilou
Founder, TheDripMap`;
  return { subject, text };
}

async function main() {
  const rows = (JSON.parse(fs.readFileSync(ROWS_FILE, 'utf8')) as Array<{ id: string; slug: string; name: string; city: string; email: string; src: string }>)
    .filter((r) => !DROP.has(r.slug))
    .slice(0, LIMIT);

  // Fail-closed rails at send time, even though the JSON was vetted.
  const [s1, s2] = await Promise.all([s.from('email_suppressions').select('email'), s.from('outreach_suppressions').select('email')]);
  if (s1.error || s2.error) { console.error('suppression read failed, refusing'); process.exit(1); }
  const sup = new Set([...(s1.data || []), ...(s2.data || [])].map((r: any) => String(r.email).toLowerCase()));

  const TOKEN = (process.env.ACTIVATION_RUN_TOKEN || '').trim();
  if (!flag('preview') && !TOKEN) { console.error('ACTIVATION_RUN_TOKEN missing'); process.exit(1); }
  let sent = 0;
  console.log(`${rows.length} candidates (${TEMPLATE})`);
  for (const r of rows) {
    const { data: p } = await s.from('providers').select('id,slug,name,city,country,email,is_claimed,is_hidden,outreach_sent,followup_sent,discovery_flag,decision_drivers').eq('id', r.id).single();
    const dd = (p?.decision_drivers || {}) as Record<string, any>;
    const why = !p ? 'no row' : p.country !== 'Canada' ? 'not Canada' : p.is_claimed ? 'claimed' : p.is_hidden ? 'hidden' : p.discovery_flag ? 'discovery_flag'
      : (p.outreach_sent || p.followup_sent || dd.third_touch || dd.warm_outreach || dd.register_touch || dd.personal_note || dd.price_first_touch) ? 'already touched'
      : sup.has(r.email.toLowerCase()) ? 'suppressed' : null;
    if (why) { console.log('SKIP', r.name, ':', why); continue; }

    const finishUrl = await manageUrlForProvider(s, p!.id);
    if (!finishUrl) { console.log('SKIP', r.name, ': no finish link'); continue; }
    const { subject, text } = build({ name: p!.name, slug: p!.slug, city: p!.city }, finishUrl);
    if (/[–—]/.test(subject + text)) { console.error('DASH in copy for', r.slug); process.exit(1); }

    if (flag('preview')) { console.log(`\n=== ${p!.name} (${p!.city}) -> ${r.email} [${r.src}]\nSUBJECT: ${subject}\n\n${text}\n`); continue; }
    const isTest = flag('test');
    if (!isTest && !(flag('send') && val('confirm') === 'SEND')) { console.error('refusing to send without --send --confirm SEND'); process.exit(1); }
    const to = isTest ? 'info@thedripmap.com' : r.email;
    const res = await fetch(`${BASE}/api/admin/send-mail`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ to, subject: isTest ? `[TEST of ${TEMPLATE}, rendered for ${p!.name}; the real one would go to ${r.email}] ${subject}` : subject, text, cc: isTest ? 'hubertzyworonek@gmail.com' : undefined, channel: isTest ? 'auto' : 'resend', clinicName: p!.name }),
    });
    const body = await res.text();
    let ok = false; try { ok = res.ok && JSON.parse(body).ok === true; } catch { ok = false; }
    console.log(isTest ? 'TEST' : ok ? 'SENT' : 'FAILED', p!.slug, res.status, body.slice(0, 90));
    if (isTest) break;
    if (ok) {
      const at = new Date().toISOString();
      const update: Record<string, unknown> = {
        outreach_sent: true, outreach_sent_at: at,
        decision_drivers: { ...dd, price_first_touch: { sent_at: at, template: TEMPLATE, to: r.email }, ...(r.src === 'harvested' ? { email_source: `site harvest 2026-09-27 (${TEMPLATE})` } : {}) },
      };
      if (r.src === 'harvested' && !(p!.email && String(p!.email).trim())) update.email = r.email;
      const { error, count } = await s.from('providers').update(update, { count: 'exact' }).eq('id', p!.id);
      if (error || count !== 1) console.error('RECORD FAIL', r.slug, error?.message, count);
      sent++;
    }
    await new Promise((res2) => setTimeout(res2, 30000));
  }
  if (flag('send')) console.log(`\ndone: ${sent} sent`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
