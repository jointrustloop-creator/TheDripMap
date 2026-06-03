/**
 * TrackedLink
 *
 * Thin client wrapper around an <a> tag that fires a single analytics
 * event via sendBeacon BEFORE the browser navigates. Used for the
 * five action buttons on the provider page (book, call, website,
 * directions, message) so the parent page can stay a server component.
 *
 * Renders semantically identical markup to a bare <a> — caller
 * supplies className + children, so it drops in anywhere.
 */
'use client';

import React from 'react';
import { trackEvent } from '../lib/analytics-client';

type Props = {
  providerId: string;
  eventType:
    | 'book_click'
    | 'call_click'
    | 'website_click'
    | 'directions_click'
    | 'message_click';
  href: string;
  className?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  children: React.ReactNode;
};

export default function TrackedLink({
  providerId,
  eventType,
  href,
  className,
  target,
  rel,
  ariaLabel,
  children,
}: Props) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      className={className}
      onClick={() => {
        // Fire-and-forget. sendBeacon is queued by the browser even
        // when the next paint is a navigation — perfect for this case.
        trackEvent(providerId, eventType);
      }}
    >
      {children}
    </a>
  );
}
