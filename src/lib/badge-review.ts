/**
 * Safety Verified review states + the "request completion" email.
 *
 * Since 2026-07-25 the badge is human-reviewed. A clinic sits in one of:
 *   pending     - answers submitted, awaiting operator Approve / Decline
 *   incomplete  - operator asked the clinic to complete blank/thin answers.
 *                 Resubmitting through /finish returns them to 'pending'.
 *   approved    - operator approved; safety_verified = true (badge renders)
 *   declined    - operator declined with a reason; badge stays off
 *
 * The completion request is a DRAFT only. Nothing is auto-sent to a clinic.
 */

export type SafetyReviewStatus = 'pending' | 'incomplete' | 'approved' | 'declined';

const CASL_FOOTER = `--
TheDripMap, the IV therapy matching platform for Canada | info@thedripmap.com | Caledon, Ontario, Canada
You are receiving this because your clinic claimed its listing on TheDripMap. Reply 'unsubscribe' to stop hearing from us.`;

/**
 * Warm, non-punitive note asking a claimed clinic to finish its safety answers.
 * House style: no em/en dashes, no medical claims, "matching platform".
 */
export function buildCompletionRequestEmail(args: {
  clinicName: string;
  finishUrl: string;
  missing?: string[];
}): { subject: string; text: string } {
  const { clinicName, finishUrl, missing = [] } = args;
  const missingLine = missing.length
    ? `Looking at your listing, these are the parts we still need: ${missing.join(', ')}.`
    : 'Looking at your listing, the safety section is not filled in yet.';

  const text = `Hi ${clinicName} team,

Good news first: your listing is claimed and live on TheDripMap.

We have just moved the Safety Verified badge to a human review process. Every badge is now checked by our team rather than granted automatically, so it means more to the patients who look for it.

${missingLine} It takes about a minute to add them here:

${finishUrl}

Once you submit, we review within a week and your badge goes live if everything checks out. Nothing else changes about your listing in the meantime.

If anything looks off or you have questions, just reply to this note.

Warmly,
TheDripMap

${CASL_FOOTER}`;

  return { subject: `Finishing your Safety Verified review for ${clinicName}`, text };
}

/** Which safety answers are missing, in operator-readable words. */
export function missingSafetyParts(manage: unknown): string[] {
  const m = (manage && typeof manage === 'object' ? manage : {}) as {
    team?: { whoPlaces?: string[]; oversight?: string };
    sourcing?: string[];
  };
  const out: string[] = [];
  if (!Array.isArray(m.team?.whoPlaces) || m.team!.whoPlaces!.length === 0) out.push('who starts the IV');
  if (!m.team?.oversight || !String(m.team.oversight).trim()) out.push('your medical oversight');
  if (!Array.isArray(m.sourcing) || m.sourcing.length === 0) out.push('where your ingredients come from');
  return out;
}
