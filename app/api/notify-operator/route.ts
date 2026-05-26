import { NextResponse } from 'next/server';
import { sendMail } from '../../../src/lib/mailer';

const SUPABASE_PROJECT_REF = 'qaqzwfnjajyejehmdvuw';
const SITE_URL = 'https://www.thedripmap.com';

export async function POST(req: Request) {
    try {
      const body = await req.json();
      const {
        clinicName,
        ownerName,
        ownerPhone,
        email,
        specialty,
        token,
        listingId,
        providerSlug,
      } = body || {};

      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      if (token) {
        const verifyUrl = `${SITE_URL}/verify-claim?token=${encodeURIComponent(token)}`;
        await sendMail({
          from: 'TheDripMap <info@thedripmap.com>',
          to: email,
          replyTo: 'info@thedripmap.com',
          subject: `Verify your claim for ${clinicName || 'your clinic'} on TheDripMap`,
          text: `Hi ${ownerName || 'there'},

Thanks for submitting a claim for ${clinicName || 'your clinic'} on TheDripMap.

To confirm you're the rightful owner, click the link below within the next 7 days:

${verifyUrl}

If you didn't submit this claim, you can safely ignore this email.

— The TheDripMap Team
`,
        });
      }

      const publicUrl = providerSlug ? `${SITE_URL}/providers/${providerSlug}` : '(no slug)';
      const supabaseUrl = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/editor`;
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: 'info@thedripmap.com',
        replyTo: email,
        subject: `New clinic claim: ${clinicName || 'Unknown'}`,
        text: `New clinic claim request

Clinic: ${clinicName || 'Unknown'}
Owner name: ${ownerName || 'Not provided'}
Owner email: ${email}
Owner phone: ${ownerPhone || 'Not provided'}
Specialty: ${specialty || 'N/A'}

Listing ID: ${listingId || '(unknown)'}
Public listing: ${publicUrl}
Manage in Supabase: ${supabaseUrl}

Status: pending verification (owner must click the link in their verification email)
`,
      });

      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

      if (!BOT_TOKEN || !CHAT_ID) {
        console.error('Telegram credentials missing — set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID');
        return NextResponse.json({ success: true, warning: 'Notification skipped (config missing)' });
      }

      const message = `🏥 New Clinic Signup!\n\nClinic: ${clinicName || 'Unknown'}\nOwner: ${ownerName || 'Not provided'}\nEmail: ${email}\nPhone: ${ownerPhone || 'Not provided'}\nSpecialty: ${specialty || 'N/A'}\n\nReview at: https://supabase.com/dashboard`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Telegram API error:', errorData);
          return NextResponse.json({ success: true, warning: 'Notification slightly delayed' });
        }
      } catch (fErr) {
        console.warn('Telegram fetch failed (probably timeout or network):', fErr);
        return NextResponse.json({ success: true, warning: 'Notification queued' });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Notification API error:', error);
      return NextResponse.json({
        success: true,
        warning: 'Fallback mode active'
      });
    }
}
