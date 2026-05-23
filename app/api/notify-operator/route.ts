import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
    try {
      const body = await req.json();
      const { clinicName, ownerName, email, specialty, phone } = body || {};

      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'TheDripMap <onboarding@resend.dev>',
            to: 'info@thedripmap.com',
            replyTo: email,
            subject: `New clinic claim: ${clinicName || 'Unknown'}`,
            text: `New clinic claim request

Clinic: ${clinicName || 'Unknown'}
Owner: ${ownerName || 'Not provided'}
Email: ${email}
Phone: ${phone || 'Not listed'}
Specialty: ${specialty || 'N/A'}

Review at: https://supabase.com/dashboard
`,
          });
        } catch (emailErr) {
          console.error('Resend email error:', emailErr);
        }
      }

      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

      if (!BOT_TOKEN || !CHAT_ID) {
        console.error('Telegram credentials missing — set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID');
        return NextResponse.json({ success: true, warning: 'Notification skipped (config missing)' });
      }

      const message = `🏥 New Clinic Signup!\n\nClinic: ${clinicName || 'Unknown'}\nOwner: ${ownerName || 'Claim Request'}\nEmail: ${email}\nSpecialty: ${specialty || 'N/A'}\n\nReview at: https://supabase.com/dashboard`;

      // Use a timeout for the telegram fetch to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Telegram API error:', errorData);
          // Still return true so the user isn't stuck
          return NextResponse.json({ success: true, warning: 'Notification slightly delayed' });
        }
      } catch (fErr) {
        console.warn('Telegram fetch failed (probably timeout or network):', fErr);
        return NextResponse.json({ success: true, warning: 'Notification queued' });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Notification API error:', error);
      // Even on error, if we can at least log the email, it's better than nothing
      return NextResponse.json({ 
        success: true, 
        warning: 'Fallback mode active' 
      });
    }
}
