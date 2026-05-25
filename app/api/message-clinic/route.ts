import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // listing_id is left null because the existing FK points at the orphan
    // 'listings' table, not 'providers'. The clinic context is preserved in
    // the message body so leads aren't lost. Once the FK is repointed to
    // providers.id (scripts/fix-inquiries-fk.sql), we can set this field.
    const { error: insertError } = await supabase.from('inquiries').insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: `[Lead for ${data.clinicName} · clinicId=${data.clinicId}] ${data.message}`,
      listing_id: null,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const clinicUrl = data.clinicSlug
          ? `https://www.thedripmap.com/providers/${data.clinicSlug}`
          : 'https://www.thedripmap.com';

        const result = await resend.emails.send({
          from: 'TheDripMap <info@thedripmap.com>',
          to: 'info@thedripmap.com',
          replyTo: data.email,
          subject: `New patient lead: ${data.clinicName}`,
          text: `New patient inquiry for clinic: ${data.clinicName}
Listing: ${clinicUrl}

Patient details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}

Message:
${data.message}

---
This lead came through TheDripMap's "Message This Clinic" feature.
Forward this to the clinic if they're claimed, or use it to drive a claim conversion if they're not.
`,
        });

        if (result?.error) {
          console.error('Resend error:', result.error);
        }
      } catch (emailErr) {
        console.error('Resend send error:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Message clinic error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
