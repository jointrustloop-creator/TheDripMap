/**
 * September Sprint move 4: ONE personal note to a claimed owner whose page is
 * still incomplete. Not a campaign: each note names the exact blanks on their
 * page (from the one display-complete definition) and the one that matters
 * most, and offers to record answers by reply. Never twice to a clinic.
 *
 * Single clinic:
 *   npx tsx scripts/_finish-personal-note.ts --slug <slug> --preview
 *   npx tsx scripts/_finish-personal-note.ts --slug <slug> --test
 *   npx tsx scripts/_finish-personal-note.ts --slug <slug> --send
 *
 * Whole eligible batch (claimed CA, incomplete, never noted, mailable):
 *   npx tsx scripts/_finish-personal-note.ts --all --preview [--limit N]
 *   npx tsx scripts/_finish-personal-note.ts --all --send --confirm SEND [--limit N]
 *
 * Batch mode added 2026-09-15. It checks BOTH suppression tables and fails
 * closed (feedback_outreach_suppression_guard), refuses to send without an
 * explicit confirm, and marks decision_drivers.personal_note per clinic as it
 * goes so an interrupted run never re-mails anyone on the next attempt.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import { createClient } from '@supabase/supabase-js';
import { assessCompleteness, type CompletenessRow } from '../src/lib/display-complete';
import { manageUrlForProvider } from '../src/lib/manage-token';

const args = process.argv.slice(2);
const val = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const flag = (n: string) => args.includes(`--${n}`);
const slug = val('slug');
const ALL = flag('all');
const LIMIT = Number(val('limit')) || 100;
if (!slug && !ALL) { console.error('--slug <slug> or --all required'); process.exit(1); }

const TEMPLATE = 'finish_personal_note_v1';
const SEND_URL = 'https://www.thedripmap.com/api/admin/send-mail';

const LABEL: Record<string, string> = {
  contact: 'a phone number or booking link',
  hours: 'your opening hours',
  services: 'the treatments you offer',
  prices: 'at least one price',
  practitioner: 'the name of the practitioner who prescribes your IVs',
  photo: 'a photo or your logo',
};
const WHY: Record<string, string> = {
  prices: 'Prices are the line patients look for first, and a blank there is where most visitors stop reading.',
  practitioner: 'A named prescriber is the first thing patients check, and it is also what qualifies your page for Safety Verified review.',
  hours: 'Hours are the difference between a patient calling now and moving on.',
  photo: 'A real photo of the space is the fastest trust signal on the page.',
  services: 'Without a treatment list the page cannot appear in treatment searches.',
  contact: 'Without a phone or booking link there is nothing for a patient to do next.',
};
const joinNatural = (a: string[]) => a.length <= 1 ? a[0] || '' : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`;
const firstName = (name: string | null | undefined, clinic: string) => { const f = (name || '').trim().split(/\s+/)[0]; return f && !/^(front|desk|team|office|admin|info|reception|clinic|dr\.?)$/i.test(f) && !clinic.toLowerCase().startsWith(f.toLowerCase()) ? f : `${clinic} team`; };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = any;

interface Note { subject: string; text: string; missing: string[]; to: string }

async function buildNote(sb: Sb, p: Record<string, unknown>): Promise<Note | null> {
  const id = p.id as string;
  const { data: op } = await sb.from('operator_profiles').select('owner_name, profile_data').eq('clinic_id', id).maybeSingle();
  const { data: ob } = await sb.from('onboarding_requests').select('owner_name').eq('provider_id', id).maybeSingle();
  const c = assessCompleteness({ ...(p as CompletenessRow), operator_profile: op || null });
  if (c.complete) return null;
  const dd = (p.decision_drivers || {}) as Record<string, unknown>;
  const finishUrl = await manageUrlForProvider(sb, id);
  if (!finishUrl) return null;
  const missing = c.missing.map((m) => m.key);
  const top = missing.includes('prices') ? 'prices' : missing.includes('practitioner') ? 'practitioner' : missing[0];
  const opens = Number(dd.finishOpenCount || 0);
  const name = firstName(ob?.owner_name || op?.owner_name, p.name as string);
  const text = `Hi ${name},

A quick personal one from me, not a campaign. ${opens >= 3 ? `You have opened your ${p.name} page ${opens} times but nothing has been saved yet, so I assume something in the form got in the way.` : `Your ${p.name} page is ${c.strength} percent complete.`} It is missing ${joinNatural(missing.map((k) => LABEL[k] || k))}.

If I had to pick one: ${LABEL[top]}. ${WHY[top]}

Two ways to finish, whichever is easier. This link opens your own page, with no login and no account to create:

[Finish your listing](${finishUrl})

Or just reply to this email with the answers in plain words and I will enter them for you today.

If the form itself is giving you trouble, tell me what happened and I will fix it.

Warm regards,

Deborah
Founder, TheDripMap
thedripmap.com`;
  const subject = `${p.name}: the ${missing.length === 1 ? 'one thing' : `${missing.length} things`} still missing from your page`;
  return { subject, text, missing, to: String(p.email || '').trim() };
}

async function deliver(sb: Sb, p: Record<string, unknown>, note: Note, isTest: boolean): Promise<boolean> {
  const TOKEN = (process.env.ACTIVATION_RUN_TOKEN || '').trim();
  const to = isTest ? 'info@thedripmap.com' : note.to;
  const body = isTest ? `[TEST of ${TEMPLATE}, rendered for ${p.name}; the real one would go to ${p.email}]\n\n${note.text}` : note.text;
  const r = await fetch(SEND_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ to, subject: isTest ? `[TEST] ${note.subject}` : note.subject, text: body, cc: isTest ? 'hubertzyworonek@gmail.com' : undefined }),
  });
  console.log(isTest ? 'TEST' : 'SENT', p.slug, r.status, (await r.text()).slice(0, 140));
  if (!r.ok || isTest) return false;
  const dd = (p.decision_drivers || {}) as Record<string, unknown>;
  await sb.from('providers').update({
    decision_drivers: { ...dd, personal_note: { sent_at: new Date().toISOString(), template: TEMPLATE, missing: note.missing } },
  }).eq('id', p.id as string);
  fs.appendFileSync(path.join(os.tmpdir(), 'personal-notes.log'), `${new Date().toISOString()} ${p.slug} ${to}\n`);
  return true;
}

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

  // ---- single clinic (unchanged behaviour) ----
  if (!ALL) {
    const { data: p } = await sb.from('providers').select('*').eq('slug', slug!).maybeSingle();
    if (!p) { console.error('no such provider'); process.exit(1); }
    const dd = (p.decision_drivers || {}) as Record<string, unknown>;
    if ((dd.personal_note as { sent_at?: string } | undefined)?.sent_at && flag('send')) { console.log('personal note already sent to this clinic'); return; }
    const note = await buildNote(sb, p);
    if (!note) { console.log('already complete, or no private link'); return; }
    if (flag('preview')) { console.log('SUBJECT:', note.subject, '\n\n' + note.text); return; }
    await deliver(sb, p, note, flag('test'));
    return;
  }

  // ---- whole eligible batch ----
  const { data: rows, error } = await sb.from('providers').select('*')
    .eq('country', 'Canada').eq('is_claimed', true).eq('is_hidden', false);
  if (error) throw new Error(error.message);

  const candidates = (rows || []).filter((p: Record<string, unknown>) => {
    const dd = (p.decision_drivers || {}) as Record<string, unknown>;
    if (!p.email || p.email_bounced) return false;
    return !(dd.personal_note as { sent_at?: string } | undefined)?.sent_at;
  });

  // Suppression guard: BOTH lists, fail closed.
  const emails = candidates.map((p: Record<string, unknown>) => String(p.email).toLowerCase().trim());
  const suppressed = new Set<string>();
  if (emails.length) {
    for (const table of ['email_suppressions', 'outreach_suppressions']) {
      const { data: s, error: se } = await sb.from(table).select('email').in('email', emails);
      if (se) { console.error(`suppression check failed on ${table}: ${se.message}`); process.exit(1); }
      for (const r of s || []) suppressed.add(String(r.email).toLowerCase().trim());
    }
  }

  const isSend = flag('send');
  if (isSend && val('confirm') !== 'SEND') { console.error('refusing to send without --send --confirm SEND'); process.exit(1); }

  let queued = 0; let sent = 0; let skipped = 0;
  for (const p of candidates) {
    if (queued >= LIMIT) break;
    if (suppressed.has(String(p.email).toLowerCase().trim())) { skipped++; continue; }
    const note = await buildNote(sb, p);
    if (!note) { skipped++; continue; }          // complete, or no private link
    if (/[–—]/.test(note.subject + note.text)) { console.error(`DASH in copy for ${p.slug}`); process.exit(1); }
    queued++;
    if (flag('preview')) {
      console.log(`\n=== ${p.name} -> ${p.email}  [missing: ${note.missing.join(', ')}]\nSUBJECT: ${note.subject}\n\n${note.text}\n`);
      continue;
    }
    if (await deliver(sb, p, note, flag('test'))) sent++;
    if (flag('test')) break;                      // one rendered copy is enough
    await new Promise((res) => setTimeout(res, 1200));
  }
  console.log(`\neligible ${candidates.length} | queued ${queued} | skipped ${skipped} (complete, no link, or suppressed)${isSend ? ` | sent ${sent}` : ''}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
