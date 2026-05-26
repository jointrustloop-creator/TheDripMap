import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.from('inquiries').insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: `Subject: ${data.subject}\n\n${data.message}`,
      listing_id: null,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const result = await resend.emails.send({
          from: 'TheDripMap <notifications@thedripmap.com>',
          to: 'info@thedripmap.com',
          replyTo: data.email,
          subject: `New contact form: ${data.subject || 'No subject'}`,
          text: `New contact form submission

Name: ${data.name || 'Not provided'}
Email: ${data.email || 'Not provided'}
Phone: ${data.phone || 'Not provided'}
Subject: ${data.subject || 'No subject'}

Message:
${data.message || '(empty)'}
`,
        });
        if (result?.error) {
          console.error('Resend returned error:', result.error);
          return NextResponse.json({
            success: true,
            debug_resend_response: result,
          });
        }
        return NextResponse.json({ success: true, debug_resend_response: result });
      } catch (emailErr) {
        console.error('Resend email error:', emailErr);
        return NextResponse.json({
          success: true,
          debug_email_error: String(emailErr),
          debug_email_error_detail: emailErr instanceof Error
            ? { message: emailErr.message, name: emailErr.name }
            : emailErr,
        });
      }
    }

    return NextResponse.json({ success: true, debug_note: 'RESEND_API_KEY not set in env' });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
