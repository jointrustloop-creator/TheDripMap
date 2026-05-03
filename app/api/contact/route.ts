import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Always log to console for visibility in logs
    console.log('--- NEW CONTACT FORM SUBMISSION ---');
    console.log('Date:', new Date().toLocaleString());
    console.log('Name:', data.name);
    console.log('Email:', data.email);
    console.log('Subject:', data.subject);
    console.log('Message:', data.message);
    console.log('------------------------------------');

    // Save to Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase.from('inquiries').insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          message: `Subject: ${data.subject}\n\n${data.message}`,
          listing_id: null,
          created_at: new Date().toISOString()
        });
        console.log('Inquiry saved to Supabase.');
      } else {
        console.warn('Supabase credentials missing. Skipping DB insert.');
      }
    } catch (dbError) {
      console.error('Error saving inquiry to Supabase:', dbError);
    }

    // Send email notification if Resend is configured
    if (resend) {
      await resend.emails.send({
        from: 'TheDripMap Support <onboarding@resend.dev>',
        to: 'thedripmap@gmail.com',
        subject: `[TheDripMap] New ${data.subject}: ${data.name}`,
        text: `
          New message from contact form:
          
          Name: ${data.name}
          Email: ${data.email}
          Subject: ${data.subject}
          
          Message:
          ${data.message}
          
          ---
          Date: ${new Date().toLocaleString()}
        `,
      });
      console.log('Email notification sent via Resend.');
    } else {
      console.warn('RESEND_API_KEY not found. Skipping email notification.');
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process message' }, { status: 500 });
  }
}
