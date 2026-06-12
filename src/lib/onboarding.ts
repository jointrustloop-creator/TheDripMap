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

// HARD GATE. Flip to true only after the operator approves Template B.
export const ONBOARDING_AUTOSEND = false;

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

export function buildOnboardingEmail(p: OnboardingProvider, ownerName?: string | null): {
  subject: string;
  text: string;
} {
  const first = (ownerName || '').trim().split(/\s+/)[0] || 'there';
  const city = (p.city || '').trim() || 'your area';
  return {
    subject: `You're verified on TheDripMap. Five quick questions to finish your listing`,
    text: `Hi ${first},

${p.name} is now verified on TheDripMap. Nice to have you.

Verified clinics with a complete profile get noticeably more clicks and calls than bare listings, so we'd like to fill yours in properly. Five questions. A few sentences each is plenty, and you can answer right in a reply to this email.

1. Who will patients meet? Who places the IVs, and who provides the medical oversight? Names and credentials (RN, NP, ND, MD), with one line of background per person. Something like "Dr. Megan Maycher, ND, 10 years in IV nutrient therapy" is perfect.

2. What are your three most popular drips, and what do they typically cost? Name, a rough or "from" price, and how long a session usually takes. A range is fine. We never hold you to exact pricing.

3. What does a first visit look like? Do new patients get a consultation or health screening first, how long should they budget, and what do most first-timers not expect?

4. Where do your IV ingredients come from, and how are they prepared? For example, a licensed compounding pharmacy or pharmaceutical wholesaler, prepared fresh on site. Patients ask us this more than anything except price.

5. How do patients pay, and what can they claim? Do you issue receipts for extended health benefits, do you direct bill, and do you take HSA/FSA? Is there a membership or package, or simply pay per visit?

Two more things while you're at it:

- Your logo (PNG or SVG is ideal)
- Two or three photos: your treatment space, your team at work, your front door. Real photos beat stock every time, and listings with photos get far more bookings.

Reply whenever suits you this week. We'll have your updated listing live within two business days of hearing back, and we'll send you the link to review before anything else changes.

Thanks again for verifying. Patients in ${city} are already finding you.

TheDripMap
${OPERATOR_EMAIL}
${SITE_URL}/providers/${p.slug}
`,
  };
}

export function buildOnboardingNudge(p: OnboardingProvider, ownerName?: string | null): {
  subject: string;
  text: string;
} {
  const first = (ownerName || '').trim().split(/\s+/)[0] || 'there';
  return {
    subject: `Still want your TheDripMap listing filled in?`,
    text: `Hi ${first},

Quick nudge on the five questions I sent last week for ${p.name}. A few sentences and a couple of photos is all we need, and your listing goes from placeholder to complete within two business days.

If now is a bad time, no problem, your verified listing stays live either way. Reply whenever you're ready.

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

    const email = buildOnboardingEmail(provider, ownerName);
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
