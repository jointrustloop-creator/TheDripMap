import React from 'react';
import Link from 'next/link';

/**
 * The single source of truth for what our verification signals DO and DO NOT
 * mean, shown at the point of display.
 *
 * WHY THIS EXISTS (liability hardening, 2026-08-23): the Terms page carries the
 * limitation-of-liability and "not medical advice" clauses, but a patient
 * reading a clinic page never sees the Terms. The badge, the regulator-premises
 * line, the transparency score and captured prices were all rendering with no
 * disclaimer beside them. A disclaimer buried a click away protects far less
 * than one sitting under the claim it qualifies.
 *
 * THE LINE WE HOLD, EVERYWHERE, WITHOUT EXCEPTION:
 *   - We report what a public register showed ON A DATE. That is a record of a
 *     lookup, not an endorsement, not a safety guarantee, not a recommendation.
 *   - Registers change after we check. Patients must confirm current status
 *     themselves, and we tell them exactly where.
 *   - Prices are the clinic's own published figures, captured on a date, not
 *     quotes and not offers.
 *   - Nothing here is medical advice, and nothing here says a clinic is "safe".
 *
 * Keep this wording aligned with docs/badge-standard.md. If the standard
 * changes, change it here in the same commit.
 */

type Variant = 'badge' | 'premises' | 'score' | 'prices' | 'listing';

const COPY: Record<Variant, string> = {
  badge:
    'Safety Verified records that we checked the prescriber named by this clinic against their public regulator register on the date shown. It is a record of that check, not an endorsement, a safety guarantee, or a recommendation to book.',
  premises:
    'This mirrors what the regulator published about these premises on the date shown. We do not inspect clinics ourselves and we do not vouch for conditions today.',
  score:
    'The Transparency Score reports what a clinic discloses and what we have verified. It is not a safety rating and not a quality ranking.',
  prices:
    'Prices are the clinic\'s own published figures, captured on the date shown. They are not quotes, they can change without notice, and consultation fees are often separate. Confirm the current price with the clinic.',
  listing:
    'Listing details come from the clinic and from public sources. We do not provide medical advice and we do not endorse any clinic. Confirm credentials, suitability and price with the clinic and your own clinician before booking.',
};

export function VerificationDisclaimer({
  variant,
  checkedAt,
  registerName,
  registerUrl,
  className = '',
}: {
  variant: Variant;
  /** ISO date or YYYY-MM-DD of the check, when the variant records one. */
  checkedAt?: string | null;
  /** e.g. "the CONO IVIT Premises Register" */
  registerName?: string | null;
  /** Public register URL so the reader can re-check for themselves. */
  registerUrl?: string | null;
  className?: string;
}) {
  const date = checkedAt ? String(checkedAt).slice(0, 10) : null;

  return (
    <p className={`text-[12px] leading-relaxed text-slate-500 ${className}`}>
      {COPY[variant]}
      {date && (
        <>
          {' '}
          Checked {date}
          {registerName ? ` on ${registerName}` : ''}.
        </>
      )}
      {registerUrl && (
        <>
          {' '}
          <a
            href={registerUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline underline-offset-2 hover:text-slate-700"
          >
            Check the register yourself
          </a>
          .
        </>
      )}{' '}
      <Link href="/verification" className="underline underline-offset-2 hover:text-slate-700">
        How we verify
      </Link>
      {' · '}
      <Link href="/terms" className="underline underline-offset-2 hover:text-slate-700">
        Terms
      </Link>
    </p>
  );
}

/**
 * One-line footer for any page that displays clinic information. Deliberately
 * plain and always present, so no listing page can ever render a claim about a
 * clinic without the qualifier travelling with it.
 */
export function ListingDataNotice({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[12px] leading-relaxed text-slate-500 ${className}`}>
      {COPY.listing}{' '}
      <Link href="/verification" className="underline underline-offset-2 hover:text-slate-700">
        How we verify
      </Link>
      {' · '}
      <Link href="/terms" className="underline underline-offset-2 hover:text-slate-700">
        Terms
      </Link>
    </p>
  );
}
