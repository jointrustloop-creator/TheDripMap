import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { clinicName, ownerName, email, specialty } = await req.json();

    const BOT_TOKEN = '8690236169:AAE4yUqK0PK3iUmpjXytGnR5Zmkxi3xAe6c';
    const CHAT_ID = '1500233539';

    const message = `🏥 New Clinic Signup!\n\nClinic: ${clinicName}\nOwner: ${ownerName}\nEmail: ${email}\nSpecialty: ${specialty}\n\nReview at: https://supabase.com/dashboard`;

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API error:', errorData);
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
