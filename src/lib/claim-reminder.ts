/**
 * Abandoned-claim reminder: templates + gate.
 *
 * Recovers owners who submitted a claim (claim_requests row) but never clicked
 * the verification link, so the listing never went live. One reminder per claim
 * ever, tracked by claim_requests.reminder_sent_at.
 *
 * HARD GATE: CLAIM_REMINDER_AUTOSEND below. While false, the cron runs as a
 * dry-run (reports who it WOULD remind, sends nothing) so the operator can
 * review before flipping it on. Same email-safety discipline as the onboarding
 * autosend gate.
 *
 * Em/en-dash policy: no em-dash or en-dash characters in any outgoing string.
 */

// HARD GATE. Flip to true only after reviewing the dry-run output and the copy.
export const CLAIM_REMINDER_AUTOSEND = false;

// Only remind claims that have been pending at least this long, and no longer
// than the ceiling (so we never email someone about a months-dead claim).
export const REMIND_AFTER_DAYS = 3;
export const REMIND_CEILING_DAYS = 60;

export const OPERATOR_EMAIL = 'info@thedripmap.com';
const SITE_URL = 'https://www.thedripmap.com';

interface ClaimProvider {
  name: string;
  slug: string;
  city?: string | null;
}

function firstNameOf(ownerName: string | null | undefined): string {
  return (ownerName || '').trim().split(/\s+/)[0] || 'there';
}

// Verification link is still valid: one click finishes the claim.
export function buildClaimReminder(
  p: ClaimProvider,
  ownerName: string | null | undefined,
  verifyUrl: string,
): { subject: string; text: string } {
  const first = firstNameOf(ownerName);
  const city = (p.city || '').trim() || 'your area';
  return {
    subject: `Still want to claim ${p.name} on TheDripMap?`,
    text: `Hi ${first},

You started claiming your listing for ${p.name} on TheDripMap but did not finish. You are one click away. Use your private link below to confirm you are the owner and make your listing live:

${verifyUrl}

Once verified, you can add your photos, drips, and prices, and earn the Safety Verified badge that helps patients in ${city} choose you.

If you did not request this, you can safely ignore this email.

TheDripMap Team
${OPERATOR_EMAIL}
`,
  };
}

// Verification link has expired: send them back to start a fresh claim, which
// mints a new link instantly.
export function buildClaimRestart(
  p: ClaimProvider,
  ownerName: string | null | undefined,
): { subject: string; text: string } {
  const first = firstNameOf(ownerName);
  const claimUrl = `${SITE_URL}/providers/${p.slug}?claim=1`;
  return {
    subject: `Your claim link for ${p.name} expired, here is a fresh start`,
    text: `Hi ${first},

You started claiming your listing for ${p.name} on TheDripMap, but your verification link has expired. No problem. Start a fresh claim here and we will send you a new link right away:

${claimUrl}

Once verified, you can add your photos, drips, and prices, and earn the Safety Verified badge.

If you did not request this, you can safely ignore this email.

TheDripMap Team
${OPERATOR_EMAIL}
`,
  };
}
