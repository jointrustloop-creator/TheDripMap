/**
 * POST /api/admin/badge-review-action
 *
 * Operator decisions on the Safety Verified review queue (/admin/badge-reviews).
 * Admin-cookie authenticated. Accepts form posts from the queue page.
 *
 * Safety Verified is human-reviewed (2026-07-25). Completing the /finish safety
 * section sets providers.safety_review_status = 'pending'; the badge (safety_verified)
 * only flips to true HERE, on an explicit operator approval.
 *
 * Actions:
 *   approve             - safety_verified = true, safety_review_status = 'approved',
 *                         stamps reviewed_at / reviewed_by.
 *   decline             - safety_review_status = 'declined' with a reason.
 *                         safety_verified stays false, so the badge does not render.
 *   request_completion  - safety_review_status = 'incomplete' + requested_at. The
 *                         clinic's answers are blank or thin, so instead of a
 *                         decline we ask them to finish. Emails the DRAFT to
 *                         info@thedripmap.com (never to the clinic): the operator
 *                         sends. Resubmitting via /finish returns them to 'pending'.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { sendMail } from '../../../../src/lib/mailer';
import { manageUrlForProvider } from '../../../../src/lib/manage-token';
import { buildCompletionRequestEmail, missingSafetyParts } from '../../../../src/lib/badge-review';
import { isSafetyComplete } from '../../../../src/lib/safety';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const action = String(form.get('action') || '');
  const providerId = String(form.get('provider_id') || '');
  if (!providerId) return NextResponse.json({ error: 'provider_id required' }, { status: 400 });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // SELECT first: operate on exactly one known provider.
  const { data: provider, error: rowErr } = await sb
    .from('providers')
    .select('id, name, slug, email, is_claimed, safety_verified, safety_review_status, decision_drivers')
    .eq('id', providerId)
    .maybeSingle();
  if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });
  if (!provider) return NextResponse.json({ error: 'provider not found' }, { status: 404 });

  const back = NextResponse.redirect(new URL('/admin/badge-reviews', req.url), 303);
  const nowIso = new Date().toISOString();
  const reviewedBy = 'operator';

  if (action === 'approve') {
    // The badge only ever turns on here, on a human decision, and only for a
    // claimed clinic. Single-row scoped update.
    if (provider.is_claimed !== true) {
      return NextResponse.json({ error: 'provider is not claimed; refusing to approve' }, { status: 400 });
    }
    // INTEGRITY GATE (2026-08): approval is IMPOSSIBLE without a complete safety
    // questionnaire. This makes safety_review_status='approved' a reliable proxy
    // for "questionnaire complete", which every public surface relies on (the
    // raw answers are stripped from client-facing objects, so the badge helper
    // cannot re-check them there — the guarantee has to be enforced here).
    const existingDD = (provider as { decision_drivers?: Record<string, unknown> }).decision_drivers || {};
    const manage = (existingDD as { manage?: unknown }).manage;
    if (!isSafetyComplete(manage)) {
      return NextResponse.json(
        { error: 'safety questionnaire is incomplete: need who administers IVs AND a qualified prescriber (MD/NP, or IVIT-authorized ND) named with a college registration number. An RN alone does not qualify. Cannot approve the badge.' },
        { status: 400 },
      );
    }
    // Approvals EXPIRE (2026-08 ruling): stamp a review-by date one year out so
    // the badge is re-checked rather than trusted forever. isSafetyVerified()
    // lapses the badge once this passes, returning the clinic to review.
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const { error: updErr, count } = await sb
      .from('providers')
      .update(
        {
          safety_verified: true,
          safety_review_status: 'approved',
          safety_reviewed_at: nowIso,
          safety_reviewed_by: reviewedBy,
          safety_review_reason: null,
          decision_drivers: { ...existingDD, safety_review_expires_at: expires },
        },
        { count: 'exact' },
      )
      .eq('id', provider.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    if (count !== null && count !== 1) {
      return NextResponse.json({ error: `unexpected update scope: ${count} rows` }, { status: 500 });
    }
    return back;
  }

  if (action === 'decline') {
    const reason = String(form.get('reason') || '').trim() || 'declined by operator';
    const { error: updErr } = await sb
      .from('providers')
      .update({
        safety_verified: false,
        safety_review_status: 'declined',
        safety_reviewed_at: nowIso,
        safety_reviewed_by: reviewedBy,
        safety_review_reason: reason,
      })
      .eq('id', provider.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    return back;
  }

  if (action === 'request_completion') {
    // Not a rejection: the clinic's safety answers are blank or thin, so we ask
    // them to finish. Badge stays off until they resubmit (which sets 'pending').
    const { error: updErr } = await sb
      .from('providers')
      .update({
        safety_verified: false,
        safety_review_status: 'incomplete',
        safety_review_requested_at: nowIso,
        safety_reviewed_by: reviewedBy,
      })
      .eq('id', provider.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // Build the draft and send it to the OPERATOR only. The operator sends the
    // real note to the clinic (drafts-only gate).
    const dd = (provider as { decision_drivers?: { manage?: unknown } }).decision_drivers;
    const finishUrl =
      (await manageUrlForProvider(sb, provider.id)) ||
      `https://www.thedripmap.com/providers/${(provider as { slug?: string }).slug || ''}`;
    const draft = buildCompletionRequestEmail({
      clinicName: provider.name as string,
      finishUrl,
      missing: missingSafetyParts(dd?.manage),
    });
    const clinicEmail = (provider as { email?: string }).email || '(no email on file)';
    try {
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: 'info@thedripmap.com',
        replyTo: 'info@thedripmap.com',
        subject: `[DRAFT, not sent] ${draft.subject}`,
        text: `This is a DRAFT for you to send. Intended recipient: ${clinicEmail}\n\nSubject: ${draft.subject}\n\n${draft.text}`,
      });
    } catch (e) {
      console.error('completion-request draft email failed', e instanceof Error ? e.message : e);
    }
    return back;
  }

  return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
}
