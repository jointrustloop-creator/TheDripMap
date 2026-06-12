/**
 * Single source of truth for outreach pool gating.
 *
 * Flip the array to switch outreach scope:
 *   - ['Canada']                    -> Canada-only (current setting, 2026-06-06)
 *   - ['Canada', 'United States']   -> Both (national)
 *   - []                            -> No country filter (all)
 *
 * Applies to:
 *   - /api/cron/daily-outreach      (daily 9am ET draft generation)
 *   - /api/cron/followup-outreach   (7-day follow-up draft generation)
 *   - /api/admin/regenerate-outreach (admin-triggered on-demand)
 *   - /api/admin/queue-outreach-drafts (legacy admin endpoint)
 *
 * Set 2026-06-06 to Canada-only after Search Console showed Canada
 * converting at 16x the US CTR. US outreach gets resumed once the
 * Canadian pipeline is fully running. Flip in one place: this file.
 */

export const OUTREACH_COUNTRY_FILTER: readonly string[] = ['Canada'];

/**
 * Master pause for OLD-TEMPLATE outreach draft creation and batch sends
 * across ALL paths: the two crons (which carry their own PAUSED consts)
 * AND the admin endpoints (regenerate-outreach, queue-outreach-drafts,
 * send-outreach-batch). Added 2026-06-12 after an unattended
 * regenerate-outreach?mode=next call created 8 Gmail drafts at 12:08
 * despite the cron pause: the admin endpoints were never gated.
 *
 * The W2 AUTOPILOT morning routine (approved new template, Gmail MCP
 * drafts) is NOT affected by this flag; it is governed by
 * scripts/_autopilot-approvals.md.
 */
export const OUTREACH_DRAFTS_PAUSED = true;

/**
 * Apply OUTREACH_COUNTRY_FILTER to any providers query. Returns the
 * builder unchanged when the filter is empty (national mode).
 *
 * Loosely typed so it slots into every Supabase query chain without
 * the caller importing generated Database types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyOutreachCountryFilter<T extends { eq: any; in: any }>(q: T): T {
  if (OUTREACH_COUNTRY_FILTER.length === 0) return q;
  if (OUTREACH_COUNTRY_FILTER.length === 1) {
    return q.eq('country', OUTREACH_COUNTRY_FILTER[0]) as T;
  }
  return q.in('country', OUTREACH_COUNTRY_FILTER as string[]) as T;
}

/** Human-readable label for logs + reports. */
export function outreachScopeLabel(): string {
  if (OUTREACH_COUNTRY_FILTER.length === 0) return 'all countries';
  return OUTREACH_COUNTRY_FILTER.join(', ');
}
