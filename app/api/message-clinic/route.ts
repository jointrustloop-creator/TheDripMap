import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../src/lib/mailer';

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

    // FK now correctly points at providers (repointed 2026-05-30 via
    // scripts/fix-inquiries-fk.sql). Setting listing_id lets us properly
    // attribute leads to their clinic via a join, instead of regex-parsing
    // the message body.
    const { error: insertError } = await supabase.from('inquiries').insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: `[Lead for ${data.clinicName} · clinicId=${data.clinicId}] ${data.message}`,
      listing_id: data.clinicId,
      created_at: new Date().toISOString(),
    });

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

    await sendMail({
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Message clinic error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
