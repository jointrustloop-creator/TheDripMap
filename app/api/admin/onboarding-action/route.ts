/**
 * POST /api/admin/onboarding-action
 *
 * Operator-clicked actions on the W1 onboarding queue (/admin/onboarding).
 * Admin-cookie authenticated. Accepts form posts from the queue page.
 *
 * Actions:
 *   send_now              - send the onboarding email for one pending_send row.
 *                           Works EVEN while the ONBOARDING_AUTOSEND gate is
 *                           closed, because this is an explicit operator click,
 *                           not automation. Used for the first-run batch.
 *   park                  - mark a row parked with a reason (never published).
 *   unpark                - return a parked row to replied state.
 *   mark_replied          - record that a reply came in (stamps reply_received_at).
 *   mark_published        - record that the listing was updated from the answers.
 *   flip_safety_verified  - set providers.safety_verified = true for ONE provider.
 *                           This route is the operator's click; automation never
 *                           calls it. Scoped UPDATE with a SELECT-first check.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { sendMail } from '../../../../src/lib/mailer';
import { buildOnboardingEmail } from '../../../../src/lib/onboarding';
import { manageUrlForProvider } from '../../../../src/lib/manage-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const action = String(form.get('action') || '');
  const requestId = String(form.get('request_id') || '');
  if (!requestId) return NextResponse.json({ error: 'request_id required' }, { status: 400 });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // SELECT first: every action operates on exactly one known row.
  const { data: row, error: rowErr } = await sb
    .from('onboarding_requests')
    .select('id, provider_id, owner_email, owner_name, status')
    .eq('id', requestId)
    .maybeSingle();
  if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'request not found' }, { status: 404 });

  const back = NextResponse.redirect(new URL('/admin/onboarding', req.url), 303);

  if (action === 'send_now') {
    if (row.status !== 'pending_send') {
      return NextResponse.json({ error: `cannot send from status ${row.status}` }, { status: 400 });
    }
    if (!row.owner_email) {
      return NextResponse.json({ error: 'row has no owner_email' }, { status: 400 });
    }
    const { data: provider } = await sb
      .from('providers')
      .select('id, name, slug, city, is_claimed')
      .eq('id', row.provider_id)
      .maybeSingle();
    if (!provider) return NextResponse.json({ error: 'provider not found' }, { status: 404 });
    if (provider.is_claimed !== true) {
      return NextResponse.json({ error: 'provider is not claimed; refusing to send' }, { status: 400 });
    }
    const finishUrl = (await manageUrlForProvider(sb, provider.id)) || `https://www.thedripmap.com/providers/${provider.slug}`;
    const email = buildOnboardingEmail(provider, row.owner_name, finishUrl);
    const res = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: row.owner_email,
      replyTo: 'info@thedripmap.com',
      subject: email.subject,
      text: email.text,
    });
    if (!res.ok) return NextResponse.json({ error: `send failed: ${res.error}` }, { status: 500 });
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      replyTo: row.owner_email,
      subject: `[onboarding sent] ${email.subject} (${provider.name})`,
      text: email.text,
    });
    await sb
      .from('onboarding_requests')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('status', 'pending_send');
    return back;
  }

  if (action === 'park') {
    const reason = String(form.get('reason') || 'parked by operator');
    await sb
      .from('onboarding_requests')
      .update({ status: 'parked', parked_reason: reason })
      .eq('id', row.id);
    return back;
  }

  if (action === 'unpark') {
    await sb
      .from('onboarding_requests')
      .update({ status: 'replied', parked_reason: null })
      .eq('id', row.id)
      .eq('status', 'parked');
    return back;
  }

  if (action === 'mark_replied') {
    await sb
      .from('onboarding_requests')
      .update({ status: 'replied', reply_received_at: new Date().toISOString() })
      .eq('id', row.id);
    return back;
  }

  if (action === 'mark_published') {
    await sb
      .from('onboarding_requests')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', row.id);
    return back;
  }

  if (action === 'flip_safety_verified') {
    // Operator's explicit click. SELECT-first, single-row scope, and only
    // flips false -> true (never the reverse via this route).
    const { data: provider } = await sb
      .from('providers')
      .select('id, name, safety_verified, is_claimed')
      .eq('id', row.provider_id)
      .maybeSingle();
    if (!provider) return NextResponse.json({ error: 'provider not found' }, { status: 404 });
    if (provider.is_claimed !== true) {
      return NextResponse.json({ error: 'provider is not claimed; refusing to flip' }, { status: 400 });
    }
    if (provider.safety_verified === true) return back; // idempotent
    const { error: updErr, count } = await sb
      .from('providers')
      .update({ safety_verified: true }, { count: 'exact' })
      .eq('id', provider.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    if (count !== null && count !== 1) {
      return NextResponse.json({ error: `unexpected update scope: ${count} rows` }, { status: 500 });
    }
    return back;
  }

  return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
}
