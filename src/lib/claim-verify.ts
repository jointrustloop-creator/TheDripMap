/**
 * Claim verification core, shared by the public /verify-claim page (owner clicks
 * their emailed link) and the admin claims view (operator resolves a stuck claim
 * with a button). Single source of truth so the two paths can never drift.
 *
 *   verifyClaimByToken(token)  -> runs the full verification (flip is_claimed,
 *                                 stamp claimed_at, mint manage-token, mark the
 *                                 claim verified, fire enrichment + onboarding +
 *                                 operator email). Idempotent-safe: an already
 *                                 verified claim returns an 'already_verified'
 *                                 error instead of double-processing.
 *   resendVerificationEmail(id)-> re-sends the BEFORE-verify email for a pending
 *                                 claim (rescues a silent send failure).
 */
import { createClient } from '@supabase/supabase-js';
import { slugify } from './data';
import { sendMail } from './mailer';
import { autoEnrichProvider } from './auto-enrich';
import { enqueueOnboarding, sendVerificationOnboardingEmail, SEND_5Q_WITH_CONFIRMATION } from './onboarding';
import { ensureManageToken } from './manage-token';

const SITE_URL = 'https://www.thedripmap.com';

export type ClaimOutcome =
  | { status: 'success'; clinicName: string; providerSlug: string | null }
  | {
      status: 'error';
      reason: 'missing_token' | 'not_found' | 'already_verified' | 'expired' | 'server_error';
      providerSlug?: string | null;
      clinicName?: string;
    };

function serviceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function verifyClaimByToken(token: string | undefined): Promise<ClaimOutcome> {
  if (!token) return { status: 'error', reason: 'missing_token' };

  const supabase = serviceClient();
  if (!supabase) {
    console.error('Supabase env missing in verifyClaimByToken');
    return { status: 'error', reason: 'server_error' };
  }

  const { data: claim, error: claimErr } = await supabase
    .from('claim_requests')
    .select('id, listing_id, email, owner_name, owner_phone, expires_at, status')
    .eq('token', token)
    .maybeSingle();

  if (claimErr) {
    console.error('verify-claim: claim lookup error', claimErr);
    return { status: 'error', reason: 'server_error' };
  }
  if (!claim) return { status: 'error', reason: 'not_found' };
  if (claim.status === 'verified') return { status: 'error', reason: 'already_verified' };
  if (new Date(claim.expires_at) < new Date()) {
    const { data: prov } = await supabase
      .from('providers')
      .select('slug, name')
      .eq('id', claim.listing_id)
      .maybeSingle();
    return { status: 'error', reason: 'expired', providerSlug: prov?.slug || null, clinicName: prov?.name };
  }

  const { data: provider, error: provErr } = await supabase
    .from('providers')
    .select('id, name, slug, city, is_claimed')
    .eq('id', claim.listing_id)
    .maybeSingle();

  if (provErr || !provider) {
    console.error('verify-claim: provider lookup error', provErr);
    return { status: 'error', reason: 'server_error' };
  }
  if (provider.is_claimed) {
    return { status: 'error', reason: 'already_verified' };
  }

  // Stage 1 tier-split: claim flips is_claimed ONLY. is_featured stays false
  // until a manual operator upgrade or a paid Featured purchase.
  const { error: updProvErr } = await supabase
    .from('providers')
    .update({ is_claimed: true })
    .eq('id', provider.id);
  if (updProvErr) {
    console.error('verify-claim: provider update error', updProvErr);
    return { status: 'error', reason: 'server_error' };
  }

  // claimed_at: stamp the moment of claim, only when null so hand-set
  // grandfathered dates are never overwritten by a re-click. Non-fatal.
  await supabase
    .from('providers')
    .update({ claimed_at: new Date().toISOString() })
    .eq('id', provider.id)
    .is('claimed_at', null);

  // Durable /finish manage-token before the fire-and-forget enrichment reads
  // the row. Idempotent. Non-fatal.
  await ensureManageToken(supabase, provider.id);

  const { error: updClaimErr } = await supabase
    .from('claim_requests')
    .update({ status: 'verified', verified_at: new Date().toISOString() })
    .eq('id', claim.id);
  if (updClaimErr) {
    console.error('verify-claim: claim update error', updClaimErr);
  }

  // Fire-and-forget public-data enrichment. Errors logged, never thrown.
  Promise.resolve()
    .then(() => autoEnrichProvider(provider.id))
    .then((res) => {
      if (!res.ok) console.error('auto-enrich failed', { providerId: provider.id, errors: res.errors });
      else console.log('auto-enrich complete', { providerId: provider.id, filled: res.filled, skipped: res.skipped });
    })
    .catch((err) => console.error('auto-enrich crashed', err));

  const providerSlug = provider.slug || slugify(provider.name);
  const listingUrl = `${SITE_URL}/providers/${providerSlug}`;
  const onboardingProvider = { id: provider.id, name: provider.name, slug: providerSlug, city: provider.city };

  // W1 onboarding: the verification confirmation email IS the 5-questions email.
  let onboardingNote = '';
  if (SEND_5Q_WITH_CONFIRMATION) {
    const res = await sendVerificationOnboardingEmail(supabase, onboardingProvider, claim.email, claim.owner_name);
    onboardingNote = res.sent
      ? `The verification + 5-questions onboarding email was sent to ${claim.email}. Tracked in /admin/onboarding (status: sent), awaiting their reply.`
      : `Onboarding email was NOT sent (${res.error || 'unknown'}). Check /admin/onboarding.`;
    console.log('onboarding combined send', { providerId: provider.id, ...res });
  } else {
    Promise.resolve()
      .then(() => enqueueOnboarding(supabase, onboardingProvider, claim.email, claim.owner_name))
      .then((res) => console.log('onboarding enqueue', { providerId: provider.id, ...res }))
      .catch((err) => console.error('onboarding enqueue crashed', err));
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: claim.email,
      replyTo: 'info@thedripmap.com',
      subject: `Your claim for ${provider.name} is now Claimed on TheDripMap`,
      text: `Hi ${claim.owner_name || 'there'},

Your claim for ${provider.name} on TheDripMap is now Claimed. Your free listing is live with your own logo, contact info, and map.

View your listing: ${listingUrl}

TheDripMap Team
`,
    });
    onboardingNote = 'Legacy confirmation sent; 5-questions onboarding is queued (gated).';
  }

  await sendMail({
    from: 'TheDripMap <info@thedripmap.com>',
    to: 'info@thedripmap.com',
    replyTo: claim.email,
    subject: `Claim VERIFIED: ${provider.name}`,
    text: `A clinic claim has been verified.

Clinic: ${provider.name}
Owner name: ${claim.owner_name || 'Not provided'}
Owner email: ${claim.email}
Owner phone: ${claim.owner_phone || 'Not provided'}

Listing ID: ${provider.id}
Public listing: ${listingUrl}

${onboardingNote}

Status: claimed (free tier). Manually set is_featured=true if approved for a Featured upgrade.
`,
  });

  return { status: 'success', clinicName: provider.name, providerSlug: provider.slug || slugify(provider.name) };
}

// Re-send the BEFORE-verify verification email for a still-pending claim.
export async function resendVerificationEmail(
  claimId: string
): Promise<{ ok: boolean; error?: string; to?: string; verifyUrl?: string }> {
  const supabase = serviceClient();
  if (!supabase) return { ok: false, error: 'Supabase env missing' };

  const { data: claim } = await supabase
    .from('claim_requests')
    .select('id, listing_id, email, owner_name, token, expires_at, status')
    .eq('id', claimId)
    .maybeSingle();
  if (!claim) return { ok: false, error: 'claim_request not found' };
  if (claim.status === 'verified') return { ok: false, error: 'claim already verified' };
  if (new Date(claim.expires_at) < new Date()) return { ok: false, error: 'claim token expired' };

  const { data: prov } = await supabase.from('providers').select('name').eq('id', claim.listing_id).maybeSingle();
  const clinicName = prov?.name || 'your clinic';
  const verifyUrl = `${SITE_URL}/verify-claim?token=${encodeURIComponent(claim.token)}`;

  const result = await sendMail({
    from: 'TheDripMap <info@thedripmap.com>',
    to: claim.email,
    replyTo: 'info@thedripmap.com',
    subject: `Verify your claim for ${clinicName} on TheDripMap`,
    text: `Hi ${claim.owner_name || 'there'},

Thanks for submitting a claim for ${clinicName} on TheDripMap.

To confirm you are the rightful owner, click the link below:

${verifyUrl}

If you did not submit this claim, you can safely ignore this email.

TheDripMap Team
`,
  });
  if (!result.ok) {
    console.error('resendVerificationEmail FAILED', { to: claim.email, claimId, error: result.error });
  }
  return { ok: result.ok, error: result.error, to: claim.email, verifyUrl };
}
