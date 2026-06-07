import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { saveDrafts, type DraftPayload } from '../../../../src/lib/draft-saver';

// POST /api/admin/queue-claimed-data-drafts
// Admin-only. Saves 3 personalized data-request drafts to info@thedripmap.com
// Gmail Drafts (one per claimed-provider owner). Does NOT send, Hubert reviews
// + sends manually so the tone is right and any info already received gets
// trimmed out before delivery. Important: NO mention of paid upgrades.
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
      to: 'info@refreshmedspala.com',
      replyTo: REPLY_TO,
      subject: 'Make your Refresh Med Spa LA listing on TheDripMap stunning',
      text: `Hi Dr. Kia,

Refresh Med Spa LA is now live and claimed on TheDripMap, congrats and welcome. (I just learned you're the medical director, even better.)

I want to make your listing as authentic and conversion-focused as possible. Right now I'm using only the info from your website, but a few details from you would take it from good to the best on the matching platform. Each item is optional:

1. 3-5 real photos (interior, treatment rooms, you and Nurse Fatima together if you have one), JPGs by reply, or links from your IG.

2. Your top 3 IV drips with starting prices (e.g. "Hangover $149, Myers $179, NAD+ $299"). Real prices help patients budget and trust you.

3. One sentence on what makes Refresh different. I'm leaning toward "MD-led aesthetic + wellness practice, nearly 20 years of combined medical expertise" but feel free to rewrite.

4. Any first-time visitor offer (10% off your first IV, free consultation, etc.), optional.

5. Your online booking URL if you have one.

6. A professional photo of you (Dr. Kia Rowhanian, MD) for the practitioner section, patients want to see who is caring for them.

Reply with whatever you have. I'll integrate it all and send you a preview before anything goes live.

Warmly,
TheDripMap Team
info@thedripmap.com`,
    },
    {
      from: FROM,
      to: 'info@bluecypressky.com',
      replyTo: REPLY_TO,
      subject: 'Make your Blue Cypress IV and Wellness listing on TheDripMap stunning',
      text: `Hi Mechelle,

Blue Cypress IV and Wellness is live and claimed on TheDripMap, thanks for being one of our earliest verified clinics in Kentucky.

I want to make your listing as authentic and conversion-focused as possible. Right now I'm using info from your Google profile and website, but a few details from you would take it from good to the best on the matching platform. Each item is optional:

1. 3-5 real photos (interior, treatment room, team, IV station), JPGs by reply, or links.

2. Your top 3 IV drips with starting prices (e.g. "Hangover $149, Myers $179, NAD+ $299"). Real prices help patients budget and trust you.

3. One sentence on what makes Blue Cypress different (locally-owned, mobile service, RN-led, etc.)

4. Any first-time visitor offer (10% off your first IV, free consultation, etc.), optional.

5. Your online booking URL if you have one.

6. Name and photo of your lead nurse practitioner or medical director, patients want to see who is caring for them.

Reply with whatever you have. I'll integrate it all and send you a preview before anything goes live.

Warmly,
TheDripMap Team
info@thedripmap.com`,
    },
    {
      from: FROM,
      to: 'info@signaturebeautylounge.ca',
      replyTo: REPLY_TO,
      subject: 'Make your Signature Beauty Lounge listings on TheDripMap stunning',
      text: `Hi Eva,

Both Signature Beauty Lounge locations (Downtown Toronto and Richmond Hill) are live and claimed on TheDripMap, thanks for being one of our earliest verified clinics in the GTA.

I want to make your listings as authentic and conversion-focused as possible. Right now I'm using info from your website, but a few details from you would take them from good to the best on the matching platform. Each item is optional:

1. 3-5 real photos per location (interior, treatment room, team, IV station), JPGs by reply, or links. If they're different between Downtown and Richmond Hill, please note which is which.

2. Your top 3 IV drips with starting prices (e.g. "Hangover $149 CAD, Myers $179, NAD+ $299"). Real prices help patients budget and trust you.

3. One sentence on what makes Signature different (Toronto's premier med spa for IV therapy, certified nurses, both locations, etc.)

4. Any first-time visitor offer (10% off your first IV, free consultation, etc.), optional.

5. Your online booking URL(s), same for both locations, or different.

6. Name and photo of your lead nurse or medical director, patients want to see who is caring for them.

Reply with whatever you have. I'll integrate it all and send you a preview before anything goes live.

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
