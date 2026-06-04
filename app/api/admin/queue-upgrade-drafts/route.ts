import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { saveDrafts, type DraftPayload } from '../../../../src/lib/draft-saver';

// POST /api/admin/queue-upgrade-drafts
// Admin-only. Saves 2 personalized soft-pitch drafts to info@thedripmap.com
// Gmail Drafts, one for Mechelle (Blue Cypress KY), one for Eva (Signature
// Beauty Lounge, both locations).
//
// Tone: warm check-in, ask if listing is working for them, gently mention
// enhanced featured placement is rolling out, offer a chat. NO hard $ pitch,
// NO "$99/month", let them ask "what does it cost?" naturally.
//
// Drafts NOT sent, Hubert reviews + sends manually so the language feels
// right and any context (e.g. they just replied to a separate thread) is
// taken into account before delivery.
export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP_USER/SMTP_PASS required' }, { status: 500 });
  }

  const FROM = 'TheDripMap <info@thedripmap.com>';
  const REPLY_TO = 'info@thedripmap.com';

  const payloads: DraftPayload[] = [
    {
      from: FROM,
      to: 'info@bluecypressky.com',
      replyTo: REPLY_TO,
      subject: 'A quick chat about Blue Cypress on TheDripMap?',
      text: `Hi Mechelle,

Blue Cypress has been one of our verified-and-claimed clinics for a few months now, thank you for being one of the earliest supporters of TheDripMap in Kentucky.

I wanted to reach out personally to ask: how's it been going? Has the listing brought you any patient inquiries?

We're starting to roll out enhanced featured placement for clinics that want extra visibility (top of city pages, priority in our matching results, the ability to feature your top drips with real prices, and a few other things). Before we open it more broadly, I'd love to chat about whether it might be a good fit for Blue Cypress.

Reply whenever works. No pressure, just want to make sure the listing is actually doing its job for you.

Warmly,
TheDripMap Team
info@thedripmap.com`,
    },
    {
      from: FROM,
      to: 'info@signaturebeautylounge.ca',
      replyTo: REPLY_TO,
      subject: 'A quick chat about Signature Beauty Lounge on TheDripMap?',
      text: `Hi Eva,

Signature Beauty Lounge (Downtown Toronto + Richmond Hill) has been claimed on TheDripMap for a while now, thanks for being one of the earliest verified clinics in the GTA.

I wanted to reach out personally to ask: how's it been going? Have you seen any patient inquiries come through from either listing?

We're starting to roll out enhanced featured placement for clinics that want extra visibility (top of city pages, priority in our matching results, the ability to feature your top drips with real prices, and the option to spotlight both locations differently if you'd like). Before we open it more broadly, I'd love to chat about whether it might be a good fit for Signature Beauty.

Reply whenever works. No pressure, just want to make sure the listings are actually doing their job for you.

Warmly,
TheDripMap Team
info@thedripmap.com`,
    },
  ];

  try {
    const results = await saveDrafts(payloads);
    return NextResponse.json({
      ok: true,
      drafted: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
