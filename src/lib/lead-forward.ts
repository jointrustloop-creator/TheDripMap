/**
 * Shared lead-forwarding primitives (extracted 2026-08-28 for Get Matched).
 * ONE implementation of "may this clinic receive a forwarded lead?" so the
 * message-clinic route and the get-matched route can never drift apart.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export type ForwardStatus =
  | 'sent'
  | 'shadow_would_send'
  | 'unclaimed'
  | 'no_email'
  | 'bounced'
  | 'orphan_stub'
  | 'suppressed'
  | 'opted_out'
  | 'no_provider'
  | 'junk_patient';

export interface ForwardProviderRow {
  id: string;
  name: string | null;
  slug?: string | null;
  city: string | null;
  email: string | null;
  email_bounced: boolean | null;
  is_claimed: boolean | null;
  decision_drivers: { source?: string } | null;
  forward_leads: boolean | null;
}

// Identification footer for every clinic-facing lead email (CASL: sender
// identification + a working unsubscribe mechanism).
export const CLINIC_MAIL_FOOTER = `--
TheDripMap, https://www.thedripmap.com, info@thedripmap.com
You are receiving this because your clinic's listing on TheDripMap is claimed and lead forwarding is on.
To stop receiving forwarded patient leads, reply with the word UNSUBSCRIBE, or turn off forwarding any time from your listing dashboard.`;

/**
 * Is this ALREADY-LOADED provider row eligible to receive a forwarded lead?
 * Returns the blocking status, or null when eligible. Suppression tables are
 * checked here (both, fail closed on error).
 */
export async function forwardBlocker(
  supabase: SupabaseClient,
  p: ForwardProviderRow,
): Promise<Exclude<ForwardStatus, 'sent' | 'shadow_would_send' | 'no_provider' | 'junk_patient'> | null> {
  if (p.is_claimed !== true) return 'unclaimed';
  if (p.decision_drivers?.source === 'orphan_claim_stub') return 'orphan_stub';
  if (p.forward_leads === false) return 'opted_out';
  if (!p.email) return 'no_email';
  if (p.email_bounced === true) return 'bounced';
  const lower = p.email.toLowerCase().trim();
  try {
    const [legacy, current] = await Promise.all([
      supabase.from('email_suppressions').select('email').eq('email', lower).maybeSingle(),
      supabase.from('outreach_suppressions').select('email').eq('email', lower).maybeSingle(),
    ]);
    if (legacy.error || current.error) return 'suppressed'; // fail closed
    if (legacy.data || current.data) return 'suppressed';
  } catch {
    return 'suppressed'; // fail closed
  }
  return null;
}

/** Append-only delivery ledger write. Best-effort: table may not exist yet. */
export async function recordLeadDelivery(
  supabase: SupabaseClient,
  row: {
    inquiry_id: string | null;
    provider_id: string;
    channel: 'auto_forward' | 'manual_relay';
    source: string;
    delivered_to: string | null;
  },
): Promise<void> {
  try {
    await supabase.from('lead_deliveries').insert(row);
  } catch {
    /* ledger is best-effort until the migration lands */
  }
}
