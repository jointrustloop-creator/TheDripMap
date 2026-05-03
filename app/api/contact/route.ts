import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Immediate logging for visibility
    console.log('--- CONTACT FORM SUBMISSION RECEIVED ---');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Payload:', JSON.stringify(data, null, 2));
    
    const envStatus = {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };
    console.log('Environment Status:', envStatus);

    // 1. Save to Supabase (Inquiries Table)
    let supabaseSuccess = false;
    try {
      if (envStatus.hasSupabaseUrl && envStatus.hasSupabaseServiceKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: dbError } = await supabase.from('inquiries').insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          message: `Subject: ${data.subject}\n\n${data.message}`,
          listing_id: null,
          created_at: new Date().toISOString()
        });

        if (dbError) {
          console.error('Supabase Insert Error:', dbError);
        } else {
          console.log('✓ Successfully saved to Supabase inquiries table.');
          supabaseSuccess = true;
        }
      } else {
        console.warn('MISSING SUPABASE CREDENTIALS - Skipping DB insert');
      }
    } catch (err) {
      console.error('CRITICAL ERROR during Supabase operation:', err);
    }

    // 2. Send email notification via Resend
    let emailSuccess = false;
    try {
      if (envStatus.hasResendKey) {
        const resendInstance = new Resend(process.env.RESEND_API_KEY);
        const { data: emailData, error: emailError } = await resendInstance.emails.send({
          from: 'TheDripMap Support <onboarding@resend.dev>',
          to: 'thedripmap@gmail.com',
          replyTo: data.email,
          subject: `[Contact Form] ${data.subject} from ${data.name}`,
          text: `
            New Contact Form Submission
            
            From: ${data.name}
            Email: ${data.email}
            Subject: ${data.subject}
            
            Message:
            ${data.message}
            
            ---
            Submitted at: ${new Date().toLocaleString()}
          `,
        });

        if (emailError) {
          console.error('Resend Email Error:', emailError);
        } else {
          console.log('✓ Email sent successfully:', emailData?.id);
          emailSuccess = true;
        }
      } else {
        console.warn('MISSING RESEND_API_KEY - Skipping email notification');
      }
    } catch (err) {
      console.error('CRITICAL ERROR during Resend operation:', err);
    }

    // Determine final status
    if (!supabaseSuccess && !emailSuccess) {
      return NextResponse.json({ 
        success: false, 
        message: 'Partial or complete failure - check server logs' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Message processed',
      details: { supabase: supabaseSuccess, email: emailSuccess }
    });

  } catch (error) {
    console.error('Uncaught Exception in /api/contact:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
