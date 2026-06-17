import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegram } from '../../../src/lib/telegram';
import { setEnabled, readEnabled, readDailyCap, todaySentCount } from '../../../src/lib/outreach-autopilot';

export const dynamic = 'force-dynamic';

// POST /api/telegram  (Telegram Bot webhook)
//
// Operator controls for the outreach autopilot:
//   /stop    set the flag false (kill switch)
//   /start   set the flag true
//   /status  report flag + today's send count
//
// Register once with Telegram (see docs/outreach-autopilot.md):
//   setWebhook url=https://www.thedripmap.com/api/telegram
//              secret_token=$TELEGRAM_WEBHOOK_SECRET
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(req: Request) {
  // Telegram echoes the secret in this header on every webhook call.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ ok: false, error: 'bad secret' }, { status: 401 });
  }

  let update: any;
  try { update = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  const msg = update?.message || update?.edited_message || update?.channel_post;
  const chatId = String(msg?.chat?.id ?? '');
  const text = String(msg?.text || '').trim();

  // Only the operator's own chat may flip the switch.
  const allowed = process.env.TELEGRAM_CHAT_ID;
  if (allowed && chatId && chatId !== String(allowed)) {
    return NextResponse.json({ ok: true, ignored: 'unauthorized chat' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Handles "/stop", "/stop@MyBot", "/stop please", etc.
  const cmd = text.toLowerCase().split(/[\s@]/)[0];

  if (cmd === '/stop') {
    await setEnabled(supabase, false);
    await sendTelegram('Autopilot outreach is now OFF. No more sends until you send /start.');
  } else if (cmd === '/start') {
    await setEnabled(supabase, true);
    await sendTelegram('Autopilot outreach is now ON. Sends resume in the next business-hours batch.');
  } else if (cmd === '/status') {
    const [on, cap, today] = await Promise.all([
      readEnabled(supabase), readDailyCap(supabase), todaySentCount(supabase),
    ]);
    await sendTelegram(`Autopilot is ${on ? 'ON' : 'OFF'}. Sent today: ${today} of cap ${cap}.`);
  }

  return NextResponse.json({ ok: true });
}
