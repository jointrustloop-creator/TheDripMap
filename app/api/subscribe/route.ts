import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const email = String(data?.email || '').trim().toLowerCase();
    const source = String(data?.source || 'unknown').trim();
    const city = data?.city ? String(data.city).trim() : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: insertError } = await supabase.from('inquiries').insert({
      name: 'Newsletter subscriber',
      email,
      phone: null,
      message: `[SUBSCRIBE] source=${source}${city ? ` city=${city}` : ''}`,
      listing_id: null,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
    }

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'TheDripMap <notifications@thedripmap.com>',
          to: 'info@thedripmap.com',
          subject: `New email subscriber from ${source}`,
          text: `Email: ${email}\nSource: ${source}${city ? `\nCity: ${city}` : ''}\n`,
        });
      } catch (emailErr) {
        console.error('Resend error:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
