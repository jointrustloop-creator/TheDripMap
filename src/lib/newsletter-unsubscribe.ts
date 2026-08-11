/**
 * Shared handler for the newsletter unsubscribe endpoints.
 *
 * Two routes call this: the path form (/api/newsletter/unsubscribe/<email>,
 * the one the emails link to) and the legacy query form (?e=<email>). The path
 * form exists because a "?e=ab..." query is corrupted by quoted-printable MIME
 * encoding (it reads "=" + two hex chars as an escape), so the address has to
 * travel in the URL path where there is no "=" to misread.
 *
 * Adds the address to email_suppressions (the same list every send path reads),
 * idempotently, and returns a small confirmation page. No token: the only effect
 * is a suppression, so a stray click can never do harm.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export function unsubscribePage(title: string, body: string): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex,nofollow"/>
<title>${title} | TheDripMap</title></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f6f6f4;">
<div style="max-width:520px;margin:64px auto;background:#fff;border:1px solid #ececea;border-radius:14px;padding:32px;">
  <div style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">The Drip Map</div>
  <div style="height:3px;width:54px;background:#0F6E56;border-radius:2px;margin:8px 0 20px;"></div>
  <h1 style="font-size:20px;color:#0f172a;margin:0 0 10px;">${title}</h1>
  <p style="font-size:15px;line-height:1.6;color:#475569;margin:0;">${body}</p>
  <p style="margin:22px 0 0;"><a href="https://www.thedripmap.com" style="color:#0F6E56;font-weight:600;text-decoration:underline;">Back to TheDripMap</a></p>
</div></body></html>`;
  return new NextResponse(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export async function handleUnsubscribe(rawEmail: string | null | undefined): Promise<NextResponse> {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return unsubscribePage('Invalid link', 'That unsubscribe link is not valid. If you keep receiving emails you did not ask for, reply to any of them and we will remove you.');
  }

  const supUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supUrl || !key) {
    return unsubscribePage('Something went wrong', 'We could not process that right now. Please reply to any email from us and we will remove you by hand.');
  }
  const supabase = createClient(supUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // Already suppressed?
  const { data: existing } = await supabase
    .from('email_suppressions')
    .select('email')
    .eq('email', email)
    .limit(1);
  if (existing && existing.length > 0) {
    return unsubscribePage('You are unsubscribed', `${email} is already removed from our mailing list. You will not receive further newsletters.`);
  }

  const { error } = await supabase.from('email_suppressions').insert({
    email,
    reason: 'newsletter-unsubscribe',
    created_at: new Date().toISOString(),
  });
  if (error) {
    // Retry without optional columns in case the schema is leaner than expected.
    const retry = await supabase.from('email_suppressions').insert({ email });
    if (retry.error) {
      return unsubscribePage('Something went wrong', 'We could not process that automatically. Please reply to any email from us and we will remove you by hand.');
    }
  }

  return unsubscribePage('You are unsubscribed', `Done. ${email} will no longer receive the TheDripMap newsletter. If this was a mistake, just subscribe again from any page on the site.`);
}
