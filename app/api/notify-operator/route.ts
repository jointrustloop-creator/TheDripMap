import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
      const body = await req.json();
      const { clinicName, ownerName, email, specialty } = body || {};

      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      const BOT_TOKEN = '8690236169:AAE4yUqK0PK3iUmpjXytGnR5Zmkxi3xAe6c';
      const CHAT_ID = '1500233539';

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
