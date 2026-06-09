/**
 * POST /api/admin/queue-pending-claim-drafts
 *
 * Drafts 4 manual follow-up emails for the 5 rows currently in
 * claim_requests (the two Knead rows are deduped to one recipient):
 *
 *   1. BeYouty Medical Spa  - token expired 2026-06-08, ask to re-submit
 *   2. Tri-Health Wellness  - 5-day nudge, 1d remaining
 *   3. Insight Naturopathic - already is_claimed=true, send activation tips
 *   4. Knead Therapy Clinic - 4-day nudge, 2d remaining, mention dedupe
 *
 * Operator clicks the button on /admin/tools, this endpoint saves the
 * 4 drafts to Gmail Drafts, operator reviews and sends each manually.
 *
 * Auth: admin cookie OR Authorization: Bearer $CRON_SECRET.
 * Idempotent: deletes prior drafts with the same subject before saving.
 */
import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { saveDrafts, deleteDraftsBySubject, type DraftPayload } from '../../../../src/lib/draft-saver';

export const maxDuration = 60;

const FROM = 'TheDripMap <info@thedripmap.com>';
const REPLY_TO = 'info@thedripmap.com';

async function isAuthorized(req: Request): Promise<boolean> {
  if (await isAdminRequest()) return true;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${expected}`;
}

function assertNoFancyDashes(label: string, s: string) {
  const re = /[‒–—―]/;
  if (re.test(s)) throw new Error(`Em/en-dash detected in ${label}`);
}

const DRAFTS: { to: string; subject: string; text: string }[] = [
  {
    to: 'beyoutymedspa@gmail.com',
    subject: 'BeYouty Medical Spa claim link expired - want a fresh one?',
    text: [
      'Hi Corinna,',
      '',
      'Quick heads up: the verification link you got from us last week (June 1) has now expired. The window we use for those links is 7 days, and we have not yet seen a verified click.',
      '',
      'No problem on our end. If you still want to claim the BeYouty Medical Spa listing on TheDripMap, just reply to this email and we will generate a brand new verification link and resend it. Takes about a minute.',
      '',
      'Listing: https://www.thedripmap.com/providers/beyouty-medical-spa-los-alamitos',
      '',
      'Claiming the listing earns "Claimed" status, which lets you edit services, hours, photos, and respond to testimonials. Safety Verified is a separate, optional step earned only after we confirm your medical director, licensed staff, and liability insurance.',
      '',
      'Talk soon,',
      'TheDripMap',
      'info@thedripmap.com',
    ].join('\n'),
  },
  {
    to: 'admin@trihealth.ca',
    subject: 'Tri-Health Wellness claim - one day left on your verification link',
    text: [
      'Hi Dr. Granzotto,',
      '',
      'Just a gentle reminder that the verification link you started for Tri-Health Wellness Centre on TheDripMap expires tomorrow (June 9). I do not see a verified click yet, so if you still want to claim the listing you would need to click the link from the original email we sent you on June 2.',
      '',
      'If the original email got buried or you would like a fresh link, just reply here and we will resend it. No pressure either way.',
      '',
      'Listing: https://www.thedripmap.com/providers/tri-health-wellness-centre-vaughan',
      '',
      'Verifying earns "Claimed" status, which lets you update services, hours, and photos. Safety Verified is a separate, optional step earned only after we confirm your medical director, licensed staff, and liability insurance.',
      '',
      'TheDripMap',
      'info@thedripmap.com',
    ].join('\n'),
  },
  {
    to: 'reception@insightnaturopathic.com',
    subject: 'Insight Naturopathic is now Claimed - quick activation tips',
    text: [
      'Hi Insight team,',
      '',
      'Your claim went through on June 3 and your Insight Naturopathic Clinic listing on TheDripMap is now Claimed. You can edit services, hours, photos, and respond to testimonials. Welcome.',
      '',
      'A few quick wins to get the most out of the listing while you are still on the free tier:',
      '',
      '1. Add photos - claimed listings can show up to 3 photos. Listings with photos get noticeably more clicks than ones without.',
      '2. Confirm your hours and services - the page renders whatever we have in the DB. If anything looks off, reply and we will update it.',
      '3. Ask happy patients to share a testimonial - claimed clinics can collect testimonials directly on TheDripMap.',
      '',
      'Listing: https://www.thedripmap.com/providers/insight-naturopathic-clinic-toronto',
      '',
      'No reply needed unless you want to make a change. Just wanted to make sure the welcome was on record.',
      '',
      'TheDripMap',
      'info@thedripmap.com',
    ].join('\n'),
  },
  {
    to: 'info@kneadtherapy.ca',
    subject: 'Knead Therapy claim on TheDripMap - 2 days left to verify',
    text: [
      'Hi Dr. Winchester,',
      '',
      'Thanks for starting a claim on Knead Therapy Clinic on TheDripMap. I saw you submitted twice on June 4, both rows landed in our queue, that is fine, we will merge them automatically.',
      '',
      'Your verification link expires June 11. If you have not clicked through yet, please check the inbox at info@kneadtherapy.ca for the email titled "Verify your TheDripMap listing." It will be from info@thedripmap.com.',
      '',
      'If the email is missing or you would like a fresh link, reply here and we will resend.',
      '',
      'Listing: https://www.thedripmap.com/providers/knead-therapy-clinic-nanaimo',
      '',
      'Verifying earns "Claimed" status, which lets you edit services, hours, and photos. Safety Verified is a separate, optional step earned only after we confirm your medical director, licensed staff, and liability insurance.',
      '',
      'TheDripMap',
      'info@thedripmap.com',
    ].join('\n'),
  },
];

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP_USER/SMTP_PASS required' }, { status: 500 });
  }

  // Guard: every string is em-dash free.
  for (const d of DRAFTS) {
    try {
      assertNoFancyDashes('subject', d.subject);
      assertNoFancyDashes('body', d.text);
    } catch (err) {
      return NextResponse.json({
        error: err instanceof Error ? err.message : String(err),
        to: d.to,
        subject: d.subject,
      }, { status: 500 });
    }
  }

  // Idempotency: wipe any prior draft with the exact same subject so re-runs
  // don't pile up duplicates in Gmail Drafts.
  let deleted = 0;
  try {
    for (const d of DRAFTS) {
      deleted += await deleteDraftsBySubject(d.subject);
    }
  } catch (err) {
    return NextResponse.json(
      { error: `delete failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }

  const payloads: DraftPayload[] = DRAFTS.map((d) => ({
    from: FROM,
    to: d.to,
    replyTo: REPLY_TO,
    subject: d.subject,
    text: d.text,
  }));

  let results;
  try {
    results = await saveDrafts(payloads);
  } catch (err) {
    return NextResponse.json(
      { error: `saveDrafts failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    drafted: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    deletedPriorDrafts: deleted,
    recipients: payloads.map((p) => ({ to: p.to, subject: p.subject })),
    results,
  });
}
