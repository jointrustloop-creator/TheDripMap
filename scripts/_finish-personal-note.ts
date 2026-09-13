/**
 * September Sprint move 4: ONE personal note to a claimed owner who opened the
 * finish page but never saved. Not a campaign: each note names the exact
 * blanks on their page (from the one display-complete definition) and the
 * one that matters most, and offers to record answers by reply. Sent one at a
 * time through the platform mailer (clean links), never twice to a clinic.
 *
 *   npx tsx scripts/_finish-personal-note.ts --slug <slug> --preview       print the note
 *   npx tsx scripts/_finish-personal-note.ts --slug <slug> --test          [TEST] copy to info@ + operator cc
 *   npx tsx scripts/_finish-personal-note.ts --slug <slug> --send          the real one (after the operator's go)
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
if (!slug) { console.error('--slug required'); process.exit(1); }

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

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: p } = await sb.from('providers').select('*').eq('slug', slug!).maybeSingle();
  if (!p) { console.error('no such provider'); process.exit(1); }
  const { data: op } = await sb.from('operator_profiles').select('owner_name, profile_data').eq('clinic_id', p.id).maybeSingle();
  const { data: ob } = await sb.from('onboarding_requests').select('owner_name').eq('provider_id', p.id).maybeSingle();
  const c = assessCompleteness({ ...(p as CompletenessRow), operator_profile: op || null });
  if (c.complete) { console.log('already complete'); return; }
  const dd = (p.decision_drivers || {}) as Record<string, unknown>;
  if ((dd.personal_note as { sent_at?: string } | undefined)?.sent_at && flag('send')) { console.log('personal note already sent to this clinic'); return; }
  const finishUrl = await manageUrlForProvider(sb, p.id);
  const missing = c.missing.map((m) => m.key);
  const top = missing.includes('prices') ? 'prices' : missing.includes('practitioner') ? 'practitioner' : missing[0];
  const opens = Number(dd.finishOpenCount || 0);
  const name = firstName(ob?.owner_name || op?.owner_name, p.name);
  const text = `Hi ${name},

A quick personal one from me, not a campaign. ${opens >= 3 ? `You have opened your ${p.name} page ${opens} times but nothing has been saved yet, so I assume something in the form got in the way.` : `Your ${p.name} page is ${c.strength} percent complete.`} It is missing ${joinNatural(missing.map((k) => LABEL[k] || k))}.

If I had to pick one: ${LABEL[top]}. ${WHY[top]}

Two ways to finish, whichever is easier:

1. Your private page, two minutes, no login: ${finishUrl}
2. Reply to this email with the answers in plain words and I will enter them for you today.

If the form itself is giving you trouble, tell me what happened and I will fix it.

Warm regards,

Deborah
Founder, TheDripMap
thedripmap.com`;
  const subject = `${p.name}: the ${missing.length === 1 ? 'one thing' : `${missing.length} things`} still missing from your page`;
  if (flag('preview')) { console.log('SUBJECT:', subject, '\n\n' + text); return; }
  const TOKEN = (process.env.ACTIVATION_RUN_TOKEN || '').trim();
  const to = flag('test') ? 'info@thedripmap.com' : String(p.email || '').trim();
  const body = flag('test') ? `[TEST of finish_personal_note_v1, rendered for ${p.name}; the real one would go to ${p.email}]\n\n${text}` : text;
  const r = await fetch('https://www.thedripmap.com/api/admin/send-mail', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ to, subject: flag('test') ? `[TEST] ${subject}` : subject, text: body, cc: flag('test') ? 'hubertzyworonek@gmail.com' : undefined }) });
  console.log(flag('test') ? 'TEST' : 'SENT', r.status, (await r.text()).slice(0, 200));
  if (flag('send') && r.ok) {
    await sb.from('providers').update({ decision_drivers: { ...dd, personal_note: { sent_at: new Date().toISOString(), template: 'finish_personal_note_v1', missing } } }).eq('id', p.id);
    fs.appendFileSync(path.join(os.tmpdir(), 'personal-notes.log'), `${new Date().toISOString()} ${slug} ${to}\n`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
