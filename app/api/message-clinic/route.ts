import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../src/lib/mailer';
import { isJunkEmail } from '../../../src/lib/outreach-quality';

// Auto-forward — LIVE 2026-06-25 (shadow mode 2026-06-12 → 2026-06-25).
//
// When ENABLE_AUTO_FORWARD=true, this route additionally sends the lead
// straight to the CLAIMED clinic owner's email so they hear from the
// patient with zero operator-in-the-middle delay. reply-to is set to the
// patient, so the clinic replies directly to them.
//
// Eligibility is decided by computeForwardDecision(): claimed + not an
// orphan stub + forward_leads !== false + a valid, non-bounced,
// non-suppressed email. Everything else (unclaimed, no_email, bounced,
// suppressed, opted_out) is recorded but NOT forwarded — the operator
// relays those manually. info@thedripmap.com is copied on EVERY lead
// regardless, so the go-live is monitored end to end.
//
// Operator approval is required to change this flag (granted 2026-06-25
// for the claimed-clinic go-live).
const ENABLE_AUTO_FORWARD = true;

type ForwardStatus =
  | 'sent'
  | 'shadow_would_send'
  | 'unclaimed'
  | 'no_email'
  | 'bounced'
  | 'orphan_stub'
  | 'suppressed'
  | 'opted_out'
  | 'no_provider'
  | 'junk_patient';

interface ProviderRow {
  id: string;
  name: string | null;
  email: string | null;
  email_bounced: boolean | null;
  is_claimed: boolean | null;
  decision_drivers: { source?: string } | null;
  forward_leads: boolean | null;
}

async function computeForwardDecision(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  clinicId: string,
  patientEmail: string
): Promise<{
  status: ForwardStatus;
  clinicEmail: string | null;
  provider: ProviderRow | null;
}> {
  // Patient-side junk check first; cheapest, applies to all clinics.
  if (isJunkEmail(patientEmail)) {
    return { status: 'junk_patient', clinicEmail: null, provider: null };
  }
  // Resilient select: forward_leads only exists once the auto-forward
  // migration has been applied. If the column is absent the full select
  // errors, so we retry without it and treat forward_leads as its default
  // (true / opted-in). This keeps forwarding working pre- and post-migration.
  let provider: ProviderRow | null = null;
  {
    const full = await supabase
      .from('providers')
      .select('id, name, email, email_bounced, is_claimed, decision_drivers, forward_leads')
      .eq('id', clinicId)
      .maybeSingle();
    if (full.error) {
      const lite = await supabase
        .from('providers')
        .select('id, name, email, email_bounced, is_claimed, decision_drivers')
        .eq('id', clinicId)
        .maybeSingle();
      provider = lite.data
        ? ({ ...(lite.data as Record<string, unknown>), forward_leads: null } as ProviderRow)
        : null;
    } else {
      provider = (full.data as ProviderRow | null) ?? null;
    }
  }
  if (!provider) {
    return { status: 'no_provider', clinicEmail: null, provider: null };
  }
  if (provider.is_claimed !== true) {
    return { status: 'unclaimed', clinicEmail: null, provider };
  }
  if (provider.decision_drivers?.source === 'orphan_claim_stub') {
    return { status: 'orphan_stub', clinicEmail: null, provider };
  }
  if (provider.forward_leads === false) {
    return { status: 'opted_out', clinicEmail: null, provider };
  }
  if (!provider.email) {
    return { status: 'no_email', clinicEmail: null, provider };
  }
  if (provider.email_bounced === true) {
    return { status: 'bounced', clinicEmail: provider.email, provider };
  }
  const lower = provider.email.toLowerCase().trim();
  const [legacy, current] = await Promise.all([
    supabase.from('email_suppressions').select('email').eq('email', lower).maybeSingle(),
    supabase.from('outreach_suppressions').select('email').eq('email', lower).maybeSingle(),
  ]);
  if (legacy.data || current.data) {
    return { status: 'suppressed', clinicEmail: provider.email, provider };
  }
  return {
    status: ENABLE_AUTO_FORWARD ? 'sent' : 'shadow_would_send',
    clinicEmail: provider.email,
    provider,
  };
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data?.clinicId || !data?.clinicName || !data?.name || !data?.email || !data?.message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      // Use service role here so the suppression-table reads work and
      // so we can update the inquiry row's forward_status post-insert.
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Shadow-mode decision: figure out what auto-forward WOULD have done.
    const decision = await computeForwardDecision(supabase, data.clinicId, data.email);

    // V1 booking requests ride this same pipeline with a structured payload.
    // The [BOOKING] marker in the saved message lets /admin/leads and the
    // weekly report distinguish bookings without a schema migration.
    const booking =
      data.booking && typeof data.booking === 'object' && typeof data.booking.treatment === 'string' && data.booking.treatment
        ? {
            treatment: String(data.booking.treatment).slice(0, 120),
            times: Array.isArray(data.booking.times) ? data.booking.times.map(String).slice(0, 6) : [],
          }
        : null;

    const baseRow = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: `[${booking ? 'BOOKING · ' : ''}Lead for ${data.clinicName} · clinicId=${data.clinicId}] ${data.message}`,
      listing_id: data.clinicId,
      created_at: new Date().toISOString(),
    };
    // The 3 new columns are added in the same INSERT. If the SQL
    // migration hasn't been applied yet, the INSERT will error and we
    // fall back to the legacy row shape. Once the migration is in,
    // future inserts populate these fields.
    const shadowRow = {
      ...baseRow,
      forward_status: decision.status,
      forwarded_to_clinic_email:
        decision.status === 'sent' || decision.status === 'shadow_would_send'
          ? decision.clinicEmail
          : null,
      forwarded_to_clinic_at: decision.status === 'sent' ? new Date().toISOString() : null,
    };
    let insertError;
    let insertedInquiryId: string | null = null;
    {
      const r = await supabase.from('inquiries').insert(shadowRow).select('id').single();
      insertError = r.error;
      insertedInquiryId = (r.data?.id as string) || null;
    }
    if (insertError) {
      const msg = insertError.message || '';
      if (msg.includes('Could not find') || msg.includes('column') || msg.includes('schema cache')) {
        // The auto-forward SQL migration hasn't landed yet. Fall back.
        const r2 = await supabase.from('inquiries').insert(baseRow).select('id').single();
        insertError = r2.error;
        insertedInquiryId = (r2.data?.id as string) || null;
      }
    }
    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    const clinicUrl = data.clinicSlug
      ? `https://www.thedripmap.com/providers/${data.clinicSlug}`
      : 'https://www.thedripmap.com';

    // SHADOW MODE: never send to the clinic owner directly until the
    // operator flips ENABLE_AUTO_FORWARD. Even in non-shadow mode we
    // still send the operator notification so info@thedripmap.com
    // stays in the loop.
    let clinicForwardError: string | null = null;
    if (ENABLE_AUTO_FORWARD && decision.status === 'sent' && decision.clinicEmail) {
      try {
        await sendMail({
          from: 'TheDripMap <info@thedripmap.com>',
          to: decision.clinicEmail,
          replyTo: data.email,
          subject: booking
            ? `Booking request from TheDripMap: ${booking.treatment}, ${data.clinicName}`
            : `New patient lead from TheDripMap, ${data.clinicName}`,
          text: booking
            ? `Hi ${data.clinicName} team,

A patient on TheDripMap wants to book with you. Reply to this email to confirm a time and your reply will go directly to ${data.name}.

Booking request:
Treatment: ${booking.treatment}
Patient availability: ${booking.times.length ? booking.times.join(', ') : 'Not specified'}

Patient details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}

Full request:
${data.message}

Listing on TheDripMap: ${clinicUrl}

If you no longer want auto-forwarded leads, reply with the word UNSUBSCRIBE in the body.
`
            : `Hi ${data.clinicName} team,

A patient on TheDripMap sent you a new lead. Reply to this email and your reply will go directly to ${data.name}.

Patient details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}

Message:
${data.message}

Listing on TheDripMap: ${clinicUrl}

If you no longer want auto-forwarded leads, reply with the word UNSUBSCRIBE in the body.
`,
        });
      } catch (err) {
        clinicForwardError = err instanceof Error ? err.message : String(err);
        console.error('Forward to clinic failed:', clinicForwardError);
      }
    }

    // Operator notification (unchanged from prior behaviour, plus a
    // single new line summarizing the shadow-mode decision).
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      replyTo: data.email,
      subject: booking ? `New BOOKING request: ${data.clinicName}` : `New patient lead: ${data.clinicName}`,
      text: `New patient inquiry for clinic: ${data.clinicName}
Listing: ${clinicUrl}

Patient details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}

Message:
${data.message}

---
Auto-forward (${ENABLE_AUTO_FORWARD ? 'LIVE' : 'shadow mode'}): ${decision.status}${
        decision.clinicEmail ? ` · clinic email on file: ${decision.clinicEmail}` : ''
      }${clinicForwardError ? ` · forward attempt FAILED: ${clinicForwardError}` : ''}
This lead came through TheDripMap's "Message This Clinic" feature.
${
  ENABLE_AUTO_FORWARD
    ? 'Auto-forward is ON. If status above is "sent", the clinic already has this in their inbox.'
    : 'Auto-forward is in SHADOW MODE. Forward to the clinic manually if appropriate.'
}
`,
    });

    return NextResponse.json({
      success: true,
      inquiryId: insertedInquiryId,
      forwardStatus: decision.status,
    });
  } catch (error) {
    console.error('Message clinic error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
