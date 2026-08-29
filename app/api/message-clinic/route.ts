import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../src/lib/mailer';
import { isJunkEmail } from '../../../src/lib/outreach-quality';
import { renderLeadEmail } from '../../../src/lib/lead-forward';

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
  city: string | null;
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
      .select('id, name, city, email, email_bounced, is_claimed, decision_drivers, forward_leads')
      .eq('id', clinicId)
      .maybeSingle();
    if (full.error) {
      const lite = await supabase
        .from('providers')
        .select('id, name, city, email, email_bounced, is_claimed, decision_drivers')
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

    // Honeypot (lead engine v1). The form renders an invisible "website"
    // field humans never fill. A bot that fills it gets a fake success and
    // NOTHING is saved or emailed, so it cannot tell it was caught.
    if (typeof data.website === 'string' && data.website.trim() !== '') {
      return NextResponse.json({ success: true, forwardStatus: 'sent' });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      // Use service role here so the suppression-table reads work and
      // so we can update the inquiry row's forward_status post-insert.
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Rate cap (lead engine v1): the same patient email may create at most 5
    // inquiries in 24h across the whole site. Serverless-safe because it
    // counts rows, not memory. Fails OPEN on query error: a broken cap must
    // never block a real patient.
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: capError } = await supabase
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('email', String(data.email).trim())
        .gte('created_at', since);
      if (!capError && (count || 0) >= 5) {
        return NextResponse.json(
          { success: false, error: 'Too many messages from this email today. Please try again tomorrow or email info@thedripmap.com.' },
          { status: 429 }
        );
      }
    } catch { /* fail open */ }

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
        const rendered = renderLeadEmail({
          greeting: `Hi ${data.clinicName} team,`,
          previewText: booking
            ? `Booking request: ${booking.treatment} — reply to confirm a time.`
            : `New patient lead from TheDripMap — reply to answer them directly.`,
          paras: [
            booking
              ? `A patient on TheDripMap wants to book with you. Reply to this email to confirm a time and your reply will go directly to ${data.name}.`
              : `A patient on TheDripMap sent you a new lead. Reply to this email and your reply will go directly to ${data.name}.`,
          ],
          details: [
            ['Name', String(data.name)],
            ['Email', String(data.email)],
            ['Phone', data.phone ? String(data.phone) : 'Not provided'],
            ...(booking
              ? ([
                  ['Treatment', booking.treatment],
                  ['Availability', booking.times.length ? booking.times.join(', ') : 'Not specified'],
                ] as Array<[string, string]>)
              : []),
          ],
          requestText: String(data.message),
          buttonLabel: 'View your listing',
          buttonUrl: clinicUrl,
          clinicName: String(data.clinicName),
          clinicEmail: decision.clinicEmail,
        });
        await sendMail({
          from: 'TheDripMap <info@thedripmap.com>',
          to: decision.clinicEmail,
          replyTo: data.email,
          subject: booking
            ? `Booking request from TheDripMap: ${booking.treatment}, ${data.clinicName}`
            : `New patient lead from TheDripMap, ${data.clinicName}`,
          text: rendered.text,
          html: rendered.html,
        });
        // Lead ledger (lead engine v1): one append-only row per delivery so
        // "we sent you N patients this month" is provable per clinic. The
        // table may not exist until the operator pastes the migration;
        // failure here must never affect the patient or the clinic email.
        try {
          await supabase.from('lead_deliveries').insert({
            inquiry_id: insertedInquiryId,
            provider_id: data.clinicId,
            channel: 'auto_forward',
            source: booking ? 'booking' : 'message_clinic',
            delivered_to: decision.clinicEmail,
          });
        } catch { /* ledger is best-effort until the migration lands */ }
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

    // Patient alternatives (lead engine v1): when the lead could NOT go
    // straight to this clinic (unclaimed, bounced, opted out...), offer up to
    // 3 claimed clinics in the same city whose owners actually receive leads,
    // so the patient is never left waiting on a manual relay alone.
    let alternatives: Array<{ name: string; slug: string; city: string }> = [];
    if (decision.status !== 'sent' && decision.status !== 'shadow_would_send' && decision.provider?.city) {
      try {
        const { data: alts } = await supabase
          .from('providers')
          .select('name, slug, city')
          .eq('country', 'Canada')
          .eq('is_hidden', false)
          .eq('is_claimed', true)
          .ilike('city', decision.provider.city)
          .neq('id', data.clinicId)
          .not('email', 'is', null)
          .limit(3);
        alternatives = (alts || []).filter((a: { slug?: string }) => a.slug) as typeof alternatives;
      } catch { /* alternatives are best-effort */ }
    }

    return NextResponse.json({
      success: true,
      inquiryId: insertedInquiryId,
      forwardStatus: decision.status,
      alternatives,
    });
  } catch (error) {
    console.error('Message clinic error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
