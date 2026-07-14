/**
 * W1 Onboarding Engine: templates + queue helpers.
 *
 * The onboarding email is the ONLY auto-send email on the platform, and it
 * fires ONLY when ONBOARDING_AUTOSEND below is true. The template must be
 * operator-approved before the gate is flipped
 * (scripts/_autopilot-templates-for-approval.md, Template B).
 *
 * While the gate is false, claim verification still enqueues a row in
 * onboarding_requests with status 'pending_send' so nothing is lost; the
 * operator (or the flipped gate) sends later.
 *
 * Em/en dash policy: no em-dash or en-dash characters in any outgoing
 * string. Same rule as outreach-templates.ts.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { sendMail } from './mailer';
import { manageUrlForProvider } from './manage-token';

// HARD GATE. Flip to true only after the operator approves Template B.
// With SEND_5Q_WITH_CONFIRMATION below, the standalone auto-send path is not
// used; the 5 questions ride along with the verification confirmation instead.
export const ONBOARDING_AUTOSEND = false;

// 2026-06-13 (operator-approved): merge the 5-questions onboarding email INTO
// the claim verification confirmation email, so a freshly verified clinic gets
// ONE email at the moment of verify instead of a separate follow-up. The
// verify handler calls sendVerificationOnboardingEmail() below. Flip to false
// to fall back to the old behaviour (bland confirmation + gated 5q).
export const SEND_5Q_WITH_CONFIRMATION = true;

const SITE_URL = 'https://www.thedripmap.com';
const OPERATOR_EMAIL = 'info@thedripmap.com';

export const ONBOARDING_TEMPLATE_ID = 'onboarding_5q_v1';
export const ONBOARDING_NUDGE_TEMPLATE_ID = 'onboarding_nudge_v1';

export interface OnboardingProvider {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
}

export function buildOnboardingEmail(p: OnboardingProvider, ownerName: string | null | undefined, finishUrl: string): {
  subject: string;
  text: string;
} {
  const first = (ownerName || '').trim().split(/\s+/)[0] || 'there';
  const city = (p.city || '').trim() || 'your area';
  return {
    subject: `You're confirmed as owner of ${p.name}. Earn your Safety Verified badge next`,
    text: `Hi ${first},

Great news, you've confirmed ownership of ${p.name} and your listing is live at ${SITE_URL}/providers/${p.slug}.

One short step makes it stand out: complete your safety questionnaire to earn your Safety Verified badge. That is the gold shield patients look for, and it visibly lifts your listing above unverified clinics when people in ${city} are choosing a clinic. Safety Verified reflects your written answers to our questionnaire, not an independent medical audit.

It is all quick multiple choice plus a few photos, about two minutes, on your own private page:

${finishUrl}

The page is always yours. Bookmark it and update anything anytime.

Thanks again, and welcome.

TheDripMap
${OPERATOR_EMAIL}
`,
  };
}

export function buildOnboardingNudge(p: OnboardingProvider, ownerName: string | null | undefined, finishUrl: string): {
  subject: string;
  text: string;
} {
  const first = (ownerName || '').trim().split(/\s+/)[0] || 'there';
  return {
    subject: `Two minutes to earn your Safety Verified badge on TheDripMap`,
    text: `Hi ${first},

Quick nudge for ${p.name}: completing your safety questionnaire earns your Safety Verified badge, the gold shield patients look for when they pick a clinic. It is all quick multiple choice and a few photos, about two minutes, on your own private page:

${finishUrl}

No rush, your listing stays live either way. The page is always there when you're ready.

TheDripMap
${OPERATOR_EMAIL}
`,
  };
}

/**
 * Enqueue an onboarding row for a freshly verified clinic and, if the gate
 * is open, send the onboarding email (copy to operator).
 *
 * Never throws: claim verification must not fail because of onboarding.
 * Tolerates the onboarding_requests table not existing yet (pre-migration).
 */
export async function enqueueOnboarding(
  sb: SupabaseClient,
  provider: OnboardingProvider,
  ownerEmail: string,
  ownerName?: string | null
): Promise<{ queued: boolean; sent: boolean; error?: string }> {
  try {
    // Upsert-by-unique(provider_id): a re-verify must not duplicate or
    // re-send. Insert and treat conflict as "already queued".
    const { error: insErr } = await sb.from('onboarding_requests').insert({
      provider_id: provider.id,
      owner_email: ownerEmail,
      owner_name: ownerName || null,
      status: 'pending_send',
    });
    if (insErr) {
      // 23505 = unique violation (already queued) -> stop, do not re-send.
      if ((insErr as { code?: string }).code === '23505') {
        return { queued: false, sent: false, error: 'already queued' };
      }
      // 42P01 = table missing (migration not applied yet).
      return { queued: false, sent: false, error: insErr.message };
    }

    if (!ONBOARDING_AUTOSEND) {
      return { queued: true, sent: false };
    }

    const finishUrl = (await manageUrlForProvider(sb, provider.id)) || `${SITE_URL}/providers/${provider.slug}`;
    const email = buildOnboardingEmail(provider, ownerName, finishUrl);
    const res = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: ownerEmail,
      replyTo: OPERATOR_EMAIL,
      subject: email.subject,
      text: email.text,
    });
    if (res.ok) {
      // Operator copy, separate send so a CC bounce can't kill the primary.
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: OPERATOR_EMAIL,
        replyTo: ownerEmail,
        subject: `[onboarding sent] ${email.subject} (${provider.name})`,
        text: email.text,
      });
      await sb
        .from('onboarding_requests')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('provider_id', provider.id)
        .eq('status', 'pending_send');
      return { queued: true, sent: true };
    }
    return { queued: true, sent: false, error: res.error };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('enqueueOnboarding failed', msg);
    return { queued: false, sent: false, error: msg };
  }
}

/**
 * Post-verification combined send: the verification confirmation email IS the
 * 5-questions onboarding email (one touch at the moment of verify). Records the
 * onboarding_requests row for W1 tracking, sends the email to the owner, and
 * marks the row 'sent'. Used by verify-claim when SEND_5Q_WITH_CONFIRMATION is
 * true.
 *
 * Never throws: claim verification must never fail because of onboarding.
 *
 * Idempotent: if a row already exists for this provider (e.g. a re-verify),
 * we do NOT re-send. The verify handler also short-circuits on is_claimed
 * before reaching here, so this is belt-and-suspenders.
 */
export async function sendVerificationOnboardingEmail(
  sb: SupabaseClient,
  provider: OnboardingProvider,
  ownerEmail: string,
  ownerName?: string | null
): Promise<{ sent: boolean; error?: string }> {
  try {
    const { error: insErr } = await sb.from('onboarding_requests').insert({
      provider_id: provider.id,
      owner_email: ownerEmail,
      owner_name: ownerName || null,
      status: 'pending_send',
    });
    if (insErr && (insErr as { code?: string }).code === '23505') {
      // Already queued/sent for this provider -> do not re-send.
      return { sent: false, error: 'already queued' };
    }
    // Any other insert error (e.g. table missing pre-migration) is logged but
    // we still send the email so a freshly verified owner is never left without
    // their confirmation. The mark-sent update below simply no-ops if no row.
    if (insErr) {
      console.error('onboarding_requests insert non-fatal error', insErr.message);
    }

    const finishUrl = (await manageUrlForProvider(sb, provider.id)) || `${SITE_URL}/providers/${provider.slug}`;
    const email = buildOnboardingEmail(provider, ownerName, finishUrl);
    const res = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: ownerEmail,
      replyTo: OPERATOR_EMAIL,
      subject: email.subject,
      text: email.text,
    });
    if (!res.ok) return { sent: false, error: res.error };

    await sb
      .from('onboarding_requests')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('provider_id', provider.id)
      .eq('status', 'pending_send');
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('sendVerificationOnboardingEmail failed', msg);
    return { sent: false, error: msg };
  }
}
