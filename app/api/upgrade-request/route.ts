import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const name = String(data?.name || '').trim();
    const email = String(data?.email || '').trim().toLowerCase();
    const phone = data?.phone ? String(data.phone).trim() : null;
    const clinicName = String(data?.clinicName || '').trim();
    const clinicUrl = data?.clinicUrl ? String(data.clinicUrl).trim() : null;
    const monthlyVolume = data?.monthlyVolume ? String(data.monthlyVolume).trim() : null;
    const notes = data?.notes ? String(data.notes).trim() : null;

    if (!name || !email || !clinicName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (name, email, clinic name).' },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Compose the message body so /admin/leads + email both have all context.
    const messageBody = `[UPGRADE REQUEST] Clinic: ${clinicName}
${clinicUrl ? `Current listing: ${clinicUrl}` : ''}
${monthlyVolume ? `Estimated monthly volume: ${monthlyVolume}` : ''}
${notes ? `Notes: ${notes}` : ''}`;

    const { error: insertError } = await supabase.from('inquiries').insert({
      name,
      email,
      phone,
      message: messageBody.trim(),
      listing_id: null,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('upgrade-request insert error:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'TheDripMap <notifications@thedripmap.com>',
          to: 'info@thedripmap.com',
          replyTo: email,
          subject: `🚀 Upgrade request: ${clinicName}`,
          text: `New Featured-upgrade request from a clinic.

Clinic: ${clinicName}
Owner name: ${name}
Owner email: ${email}
${phone ? `Owner phone: ${phone}` : ''}
${clinicUrl ? `Current listing: ${clinicUrl}` : ''}
${monthlyVolume ? `Estimated monthly patient volume: ${monthlyVolume}` : ''}
${notes ? `\nNotes from owner:\n${notes}` : ''}

—
Follow up within 24h. They expect to hear from us.
Reply directly to this email to reach them.

Manage all leads: https://www.thedripmap.com/admin/leads
`,
        });
      } catch (emailErr) {
        console.error('upgrade-request email error:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('upgrade-request error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
