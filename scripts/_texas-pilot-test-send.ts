/**
 * Texas pilot: build the US/Texas outreach queue and send ONE sample to
 * ourselves for format review. Sends NOTHING to any clinic and writes NOTHING
 * to the database.
 *
 * Operator rule (2026-08-23): any new email format or copy angle gets one
 * [TEST, format review] send to info@thedripmap.com with the operator cc'd
 * before its first real use. The Texas copy leans on state regulatory context,
 * so it is new copy and this is that send.
 *
 * Run: npx tsx scripts/_texas-pilot-test-send.ts          (dry run, prints only)
 *      npx tsx scripts/_texas-pilot-test-send.ts --send   (sends the one test)
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
import { computeOutreachQueue } from '../src/lib/partb-outreach';
import { sendMail } from '../src/lib/mailer';

const TEST_TO = 'info@thedripmap.com';
const TEST_CC = 'hubertzyworonek@gmail.com';
const DO_SEND = process.argv.includes('--send');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  const { drafts, counts } = await computeOutreachQueue(s, { market: 'US', states: ['Texas'] });
  console.log('TEXAS QUEUE');
  console.log('  qualifying   :', counts.qualifying);
  console.log('  capped out   :', counts.capped_out);
  console.log('  suppressed   :', counts.suppressed);
  console.log('  no email     :', counts.no_email);
  console.log('  bounced      :', counts.bounced);
  console.log('  skipped 0/7  :', counts.skipped_0of7);
  console.log('  dup address  :', counts.dup_same_email);

  if (!drafts.length) { console.error('No qualifying Texas drafts. Nothing to preview.'); process.exit(1); }

  const byScore: Record<number, number> = {};
  for (const d of drafts) byScore[d.score] = (byScore[d.score] || 0) + 1;
  console.log('  score spread :', JSON.stringify(byScore));

  // Preview the most common score so the sample represents the real batch.
  const modeScore = Number(Object.entries(byScore).sort((a, b) => b[1] - a[1])[0][0]);
  const sample = drafts.find((d) => d.score === modeScore) || drafts[0];

  console.log('\nSAMPLE CLINIC:', sample.name, '|', sample.city + ', Texas', '| score', sample.score + '/7');
  console.log('WOULD GO TO   :', sample.to, '(NOT sent by this script)');
  console.log('SUBJECT       :', sample.subject);
  console.log('\n----- PLAIN TEXT -----\n');
  console.log(sample.text);
  console.log('\n----------------------\n');

  if (!DO_SEND) { console.log('Dry run. Re-run with --send to email the test to ' + TEST_TO + ' cc ' + TEST_CC + '.'); return; }

  const result = await sendMail({
    from: 'TheDripMap <info@thedripmap.com>',
    to: TEST_TO,
    cc: TEST_CC,
    replyTo: 'info@thedripmap.com',
    subject: `[TEST, format review] ${sample.subject}`,
    text:
      `THIS IS A FORMAT REVIEW COPY. It was not sent to any clinic.\n`
      + `Real recipient would be: ${sample.name}, ${sample.city}, Texas (${sample.to}), scoring ${sample.score}/7.\n`
      + `Texas queue size: ${counts.qualifying} clinics.\n`
      + `${'-'.repeat(60)}\n\n${sample.text}`,
    html: sample.html,
    channel: 'auto',
  });
  console.log('SEND RESULT:', JSON.stringify(result));
  if (!result.ok) process.exit(1);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
