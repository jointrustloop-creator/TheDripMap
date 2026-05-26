import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../src/lib/mailer';

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
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const mailResult = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
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

    return NextResponse.json({ success: true, mail: mailResult });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
