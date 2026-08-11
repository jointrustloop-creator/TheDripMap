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
import { withUtm } from '../lib/utm';

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
  title?: string;
  /**
   * Surface this link lives on, used as utm_campaign on outbound clinic links
   * (website + booking). Defaults to 'listing'. tel:/directions links are not
   * clinic websites, so UTM is only applied to website_click / book_click.
   */
  utmCampaign?: string;
  children: React.ReactNode;
};

// Outbound links that land on the CLINIC's own site get referral attribution.
// call_click (tel:) and directions_click (Google Maps) are not the clinic site.
const UTM_EVENTS = new Set(['website_click', 'book_click']);

export default function TrackedLink({
  providerId,
  eventType,
  href,
  className,
  target,
  rel,
  ariaLabel,
  title,
  utmCampaign,
  children,
}: Props) {
  const finalHref = UTM_EVENTS.has(eventType) ? withUtm(href, utmCampaign || 'listing') : href;
  return (
    <a
      href={finalHref}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      title={title}
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
