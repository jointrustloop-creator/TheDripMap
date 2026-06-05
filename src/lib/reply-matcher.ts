/**
 * reply-matcher.ts
 *
 * Given a parsed inbound reply, find which provider(s) it belongs to.
 *
 * Priority (matches the operator brief 1a/b/c):
 *   (a) Thread headers (In-Reply-To, References) against an
 *       outbound_message_log table. NOT WIRED in v1 because the daily-
 *       outreach + followup-outreach crons do not yet log outbound
 *       Message-IDs (Gmail rewrites the Message-Id on send for IMAP
 *       APPEND'd drafts, so capturing it cleanly needs a send-pipeline
 *       change). We still call this path so flipping it on later is a
 *       one-table-insert away from working.
 *   (b) Sender email -> providers.email (case-insensitive, exact).
 *   (c) "Re: <our subject>" + sender-domain vs provider.website domain.
 *
 * Shared-email case: when multiple providers share the same email
 * (multi-location operator), we return ALL matched provider IDs so the
 * audit row records every clinic the reply might apply to.
 *
 * Side-effect-free except for read queries against Supabase. Returns
 * the IDs + the mechanism that matched.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface MatchInput {
  fromEmail: string;
  subject?: string | null;
  inReplyTo?: string | null;
  references?: string[];
}

export type MatchedVia = 'thread' | 'sender' | 'subject' | 'manual' | 'none';

export interface MatchResult {
  providerIds: string[];
  matchedVia: MatchedVia;
  debug?: string;
}

// Strip "Re:", "Fwd:", "RE:", "FW:", etc. and trim. Leaves the brand
// portion of our outreach subjects intact for fuzzy matching.
function normalizeSubject(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/^(\s*(re|fw|fwd|aw|sv)\s*:\s*)+/i, '')
    .trim()
    .toLowerCase();
}

function domainOf(emailOrUrl: string | null | undefined): string {
  if (!emailOrUrl) return '';
  const s = emailOrUrl.toLowerCase().trim();
  const atIdx = s.indexOf('@');
  if (atIdx >= 0) return s.slice(atIdx + 1);
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export async function matchReply(
  supabase: SupabaseClient,
  input: MatchInput,
): Promise<MatchResult> {
  const from = (input.fromEmail || '').toLowerCase().trim();
  const subjectNorm = normalizeSubject(input.subject);

  // ---- (a) Thread headers -> outbound_message_log -----------------
  const messageIds = [
    ...(input.references || []),
    ...(input.inReplyTo ? [input.inReplyTo] : []),
  ]
    .map((m) => (m || '').trim())
    .filter(Boolean);

  if (messageIds.length > 0) {
    const { data, error } = await supabase
      .from('outbound_message_log')
      .select('provider_id, message_id')
      .in('message_id', messageIds);
    if (!error && data && data.length > 0) {
      const ids = Array.from(
        new Set(
          (data as Array<{ provider_id: string | null }>)
            .map((r) => r.provider_id)
            .filter((x): x is string => !!x),
        ),
      );
      if (ids.length > 0) {
        return { providerIds: ids, matchedVia: 'thread', debug: 'matched via outbound_message_log' };
      }
    }
  }

  // ---- (b) Sender email -> providers.email ------------------------
  if (from) {
    const { data, error } = await supabase
      .from('providers')
      .select('id, email, website')
      .ilike('email', from);
    if (!error && data && data.length > 0) {
      const ids = (data as Array<{ id: string }>).map((r) => r.id);
      return {
        providerIds: ids,
        matchedVia: 'sender',
        debug: `sender match on ${from} (${ids.length} provider${ids.length === 1 ? '' : 's'})`,
      };
    }
  }

  // ---- (c) Subject + domain ---------------------------------------
  // Our outreach subjects are:
  //   "Your <brand> listing on TheDripMap"
  //   "Your <brand> locations on TheDripMap"
  //   "Following up on your <brand> listing on TheDripMap"
  //   "Following up on your <brand> locations on TheDripMap"
  // After normalize, all of these end with "on thedripmap".
  if (subjectNorm.includes('on thedripmap') && from) {
    const senderDomain = domainOf(from);
    if (senderDomain) {
      // Pull a small pool of providers whose website domain matches the
      // sender's domain (catchall/forwarded inbox case). This is best-
      // effort, used only when the strict sender match failed.
      const { data, error } = await supabase
        .from('providers')
        .select('id, website')
        .ilike('website', `%${senderDomain}%`)
        .limit(20);
      if (!error && data && data.length > 0) {
        // Require an exact host match (the ilike '%domain%' could match
        // 'mydomain.com.au' for sender '@domain.com.au' which is fine,
        // but also 'otherdomain.com' for sender '@domain.com' which is
        // not. So filter strictly here.)
        const ids = (data as Array<{ id: string; website: string | null }>)
          .filter((r) => domainOf(r.website) === senderDomain)
          .map((r) => r.id);
        if (ids.length > 0) {
          return {
            providerIds: ids,
            matchedVia: 'subject',
            debug: `subject+domain match (${senderDomain})`,
          };
        }
      }
    }
  }

  return { providerIds: [], matchedVia: 'none', debug: 'no match' };
}
