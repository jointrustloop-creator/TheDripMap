/**
 * Append TheDripMap referral attribution to an outbound clinic URL so clinics
 * can see our referrals in their own analytics (Google Analytics, etc.).
 *
 * Safe by construction:
 *  - only touches absolute http/https URLs (never tel:, mailto:, or relative);
 *  - uses the URL API, so an existing query string on the clinic's link is
 *    preserved and our params are added, not concatenated blindly;
 *  - if the same utm_* key already exists it is overwritten (set), so we never
 *    produce a duplicate parameter;
 *  - any parse failure returns the original URL unchanged.
 */
export function withUtm(url: string, campaign: string): string {
  if (!url || !/^https?:\/\//i.test(url)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', 'thedripmap.com');
    u.searchParams.set('utm_medium', 'referral');
    u.searchParams.set('utm_campaign', campaign);
    return u.toString();
  } catch {
    return url;
  }
}
