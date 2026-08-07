import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../src/lib/mailer';

// Founder-funnel lead capture (monetization Lane 3, 2026-08-07). Stores the
// lead in inquiries with a [FOUNDER-LEAD] tag (surfaced by the daily report /
// claim engine) and notifies info@. Mirrors /api/subscribe's pattern.
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const email = String(data?.email || '').trim().toLowerCase();
    const name = String(data?.name || '').trim().slice(0, 120);
    const province = String(data?.province || '').trim().slice(0, 60);
    const stage = String(data?.stage || '').trim().slice(0, 80);
    const note = String(data?.note || '').trim().slice(0, 600);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: insertError } = await supabase.from('inquiries').insert({
      name: name || 'Founder lead',
      email,
      phone: null,
      message: `[FOUNDER-LEAD] province=${province || '?'} stage=${stage || '?'}${note ? ` note=${note}` : ''}`,
      listing_id: null,
      created_at: new Date().toISOString(),
    });
    if (insertError) console.error('founder-lead insert error:', insertError);

    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      subject: `FOUNDER LEAD: ${name || email} (${province || 'province ?'})`,
      text: `Name: ${name || '(not given)'}\nEmail: ${email}\nProvince: ${province || '?'}\nStage: ${stage || '?'}\nNote: ${note || '(none)'}\n\nSource: /for-clinics/open-a-clinic`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('founder-lead error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
