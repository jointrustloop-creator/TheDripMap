/**
 * Regression test: nothing internal may reach the public provider shape.
 *
 * WHY (2026-08-24): a clinic owner's email address was served in the page
 * source of her public listing. enrichProvider stripped decision_drivers by
 * DENYLIST, so `disclosures` (added the day before, carrying provenance text
 * like "Email reply from Roberta Harvey BScN RN, owner, roberta@...") published
 * itself by default. Tri-Health was shipping 13 internal fields including
 * prescriber_verification and safety_evidence.
 *
 * The allowlist fixed that instance. This test is what stops the NEXT one.
 * decision_drivers is where internal state accumulates by design, so the leak
 * was never really about one field: it was about a rule that fails open. A
 * comment asking the next person to be careful is not a control. Run this
 * before shipping anything that touches enrichProvider or adds a field.
 *
 * It tests the OUTPUT, not the code, because every failure this project has hit
 * in the last two days looked correct in the source and wrong in the artifact.
 *
 * Run: npx tsx scripts/_test-public-shape-leaks.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
import { enrichProvider } from '../src/lib/data';

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

/** Fields that must never appear anywhere in the serialized public shape. */
const FORBIDDEN_KEYS = [
  'manage_token',      // grants edit access to a listing via /finish/[token]
  'manage',            // the questionnaire answers, and embeds the token
  'disclosures',       // provenance: who told us what, verbatim, with contacts
  'safety_evidence',   // raw register-read notes, internal wording
  'prescriber_verification', // a named third party's registration record
  'email_source',      // where we found a clinic's address
  'outreach_sent',
  'outreach_sent_at',
  'followup_sent',
  'reply_category',
  'needs_human',
];

/** An address in the public shape is a leak regardless of which field held it. */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,24}/g;
// Image filenames legitimately contain "@2x". They are not addresses.
const NOT_AN_EMAIL = /@\d+x\.(png|jpe?g|gif|webp|avif|svg)/i;

function findEmails(json: string): string[] {
  return [...new Set(json.match(EMAIL_RE) || [])].filter((e) => !NOT_AN_EMAIL.test(e));
}

(async () => {
  // Sample broadly: claimed and unclaimed, verified and not, both countries,
  // because the fields that leak differ by how much history a row has.
  let all: any[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await s.from('providers').select('*').range(f, f + 999);
    if (error) { console.error('READ FAIL', error.message); process.exit(1); }
    if (!data || !data.length) break;
    all = all.concat(data);
    if (data.length < 1000) break;
  }

  const withDD = all.filter((p) => p.decision_drivers && Object.keys(p.decision_drivers).length);
  const claimed = all.filter((p) => p.is_claimed);
  const sample = [...new Set([...withDD.slice(0, 60), ...claimed.slice(0, 30), ...all.slice(0, 30)])];

  console.log(`rows in table: ${all.length}`);
  console.log(`sampled through enrichProvider: ${sample.length}\n`);

  const failures: string[] = [];
  let richest = { slug: '', before: 0, after: 0 };

  for (const row of sample) {
    const pub = enrichProvider(row) as any;
    const json = JSON.stringify(pub);

    for (const key of FORBIDDEN_KEYS) {
      // Match the serialized key, not a substring of some value.
      if (json.includes(`"${key}":`)) failures.push(`${row.slug}: published forbidden field "${key}"`);
    }
    for (const e of findEmails(json)) {
      failures.push(`${row.slug}: published an email address (${e})`);
    }

    const before = Object.keys(row.decision_drivers || {}).length;
    const after = Object.keys(pub.decision_drivers || {}).length;
    if (before > richest.before) richest = { slug: row.slug, before, after };
  }

  console.log(`most internal state on one row: ${richest.slug} — ${richest.before} fields stored, ${richest.after} published`);

  if (failures.length) {
    console.error(`\nFAIL: ${failures.length} leak(s)\n`);
    for (const f of [...new Set(failures)].slice(0, 25)) console.error('  ' + f);
    process.exit(1);
  }
  console.log('\nPASS: no forbidden field and no email address in any public shape.');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
