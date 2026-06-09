/**
 * POST /api/get-found-kit-order
 *
 * Public endpoint, no auth. Accepts an intake submission from
 * /tools/get-found-kit/order and writes a row to public.kit_orders.
 * Then fires (best-effort) a Telegram ping and email to
 * info@thedripmap.com so the operator knows to generate a kit.
 *
 * Inputs (JSON body):
 *   clinicName   required
 *   city         required
 *   contactEmail required
 *   website      optional
 *   gbpUrl       optional
 *   notes        optional
 */
import { NextResponse } from 'next/server';
import { getServiceSupabase } from '../../../src/lib/supabase';
import { sendMail } from '../../../src/lib/mailer';

export const maxDuration = 20;
export const dynamic = 'force-dynamic';

interface IntakeBody {
  clinicName?: string;
  city?: string;
  contactEmail?: string;
  website?: string;
  gbpUrl?: string;
  notes?: string;
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

async function fireTelegram(text: string): Promise<void> {
  const tok = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!tok || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text }),
    });
  } catch (e) {
    console.error('telegram ping failed', e);
  }
}

export async function POST(req: Request) {
  let body: IntakeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const clinicName = (body.clinicName || '').trim();
  const city = (body.city || '').trim();
  const contactEmail = (body.contactEmail || '').trim().toLowerCase();
  const website = (body.website || '').trim() || null;
  const gbpUrl = (body.gbpUrl || '').trim() || null;
  const notes = (body.notes || '').trim() || null;

  if (!clinicName) return NextResponse.json({ error: 'clinicName required' }, { status: 400 });
  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 });
  if (!contactEmail || !isValidEmail(contactEmail)) {
    return NextResponse.json({ error: 'valid contactEmail required' }, { status: 400 });
  }

  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('kit_orders')
    .insert({
      clinic_name: clinicName,
      city,
      website,
      gbp_url: gbpUrl,
      contact_email: contactEmail,
      notes,
      status: 'new',
    })
    .select('id')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summaryLines = [
    `New Get Found Kit order`,
    `Clinic: ${clinicName}`,
    `City: ${city}`,
    `Email: ${contactEmail}`,
    website ? `Website: ${website}` : '',
    gbpUrl ? `GBP: ${gbpUrl}` : '',
    notes ? `Notes: ${notes}` : '',
    `Order ID: ${data.id}`,
  ].filter(Boolean).join('\n');

  // Best-effort notifications. Failures don't block the 200.
  await Promise.allSettled([
    sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      replyTo: contactEmail,
      subject: `[Get Found Kit] New order from ${clinicName} (${city})`,
      text: summaryLines,
    }),
    fireTelegram(summaryLines),
  ]);

  return NextResponse.json({ ok: true, orderId: data.id });
}
