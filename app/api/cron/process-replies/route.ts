/**
 * GET /api/cron/process-replies
 *
 * Inbound reply processor for TheDripMap outreach loop.
 * Schedule (vercel.json): "0 *\/2 * * *" = every 2 hours so replies
 * don't sit 24h before the operator sees them.
 *
 * TRACKING + FLAGGING ONLY. Does NOT auto-reply, does NOT auto-send,
 * does NOT change sending behaviour. The only "outbound" action is a
 * Telegram ping when a reply is classified as 'interested'.
 *
 * Pipeline:
 *   1. Read INBOX since email_replies_cursor.last_uid
 *   2. For each new message:
 *      - classify (deterministic for opt-out/bounce/auto-reply, light
 *        heuristic otherwise)
 *      - match to providers (sender / subject+domain; threading reserved)
 *      - insert one row in email_replies (idempotent via unique message_id)
 *      - update providers.reply_* per matched row (precedence enforced)
 *      - opt-out  -> insert email_suppressions row (reason=unsubscribe)
 *                   AND set providers.email_bounced=true on every match
 *      - bounce   -> insert email_suppressions row (reason=hard_bounce)
 *                   AND set providers.email_bounced=true on every match
 *      - interested -> Telegram ping
 *   3. Advance cursor to highest UID seen
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchNewReplies, type ParsedReply } from '../../../../src/lib/reply-imap';
import { classifyReply, buildSnippet, type ReplyCategory } from '../../../../src/lib/reply-classifier';
import { matchReply } from '../../../../src/lib/reply-matcher';
import { sendTelegram } from '../../../../src/lib/telegram';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Reply-status precedence (higher = stronger). The cron will not write
// a weaker status over a stronger one. Matches the operator brief:
// "a later auto-reply must NOT overwrite an earlier interested."
const STATUS_RANK: Record<string, number> = {
  none: 0,
  auto: 1,
  bounced: 2,
  unsubscribed: 3,
  replied: 4,
  question: 5,
  not_interested: 6,
  interested: 7,
};

function categoryToReplyStatus(cat: ReplyCategory): string {
  switch (cat) {
    case 'interested': return 'interested';
    case 'question': return 'question';
    case 'not_interested': return 'not_interested';
    case 'auto_reply': return 'auto';
    case 'bounce': return 'bounced';
    case 'unclear':
    default:
      return 'replied';
  }
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP_USER/SMTP_PASS required' }, { status: 500 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Read cursor
  const { data: cursorRow } = await supabase
    .from('email_replies_cursor')
    .select('last_uid')
    .eq('id', 1)
    .maybeSingle();
  const sinceUid = (cursorRow?.last_uid as number | null) ?? undefined;

  // 2. Fetch new replies via IMAP
  let parsed: ParsedReply[] = [];
  let highestUid: number | null = null;
  try {
    const fetched = await fetchNewReplies({ sinceUid, limit: 200, sinceDays: 7 });
    parsed = fetched.replies;
    highestUid = fetched.highestUid;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('process-replies IMAP error:', detail);
    return NextResponse.json({ error: 'IMAP fetch failed', detail }, { status: 502 });
  }

  const counts: Record<ReplyCategory, number> = {
    interested: 0,
    question: 0,
    not_interested: 0,
    auto_reply: 0,
    bounce: 0,
    unclear: 0,
  };
  let processed = 0;
  let alreadySeen = 0;
  const newSuppressions: { email: string; reason: string }[] = [];
  const telegramPings: string[] = [];

  for (const reply of parsed) {
    // Skip replies that came from our own outbound address.
    if (reply.fromEmail === (process.env.SMTP_USER || '').toLowerCase()) {
      continue;
    }

    // Idempotency: skip if message_id already in email_replies.
    const { data: existing } = await supabase
      .from('email_replies')
      .select('id')
      .eq('message_id', reply.messageId)
      .maybeSingle();
    if (existing) {
      alreadySeen += 1;
      continue;
    }

    // Classify
    const classification = classifyReply({
      subject: reply.subject,
      body: reply.body,
      fromEmail: reply.fromEmail,
      headers: reply.headers,
    });

    // Match to providers
    const match = await matchReply(supabase, {
      fromEmail: reply.fromEmail,
      subject: reply.subject,
      inReplyTo: reply.inReplyTo,
      references: reply.references,
    });

    // Build snippet (PII-safe, short)
    const snippet = buildSnippet(reply.body, 500);

    // Insert email_replies row
    const replyRow = {
      message_id: reply.messageId,
      in_reply_to: reply.inReplyTo,
      references_chain: reply.references,
      thread_id: reply.threadId,
      from_email: reply.fromEmail,
      from_name: reply.fromName,
      to_email: reply.toEmail,
      subject: reply.subject?.slice(0, 500) ?? null,
      snippet,
      received_at: reply.receivedAt,
      category: classification.category,
      needs_human: classification.needsHuman,
      matched_provider_ids: match.providerIds,
      matched_via: match.matchedVia,
      gmail_thread_url: reply.gmailThreadUrl,
    };
    const { error: insErr } = await supabase
      .from('email_replies')
      .insert(replyRow);
    if (insErr) {
      // Unique-violation = race condition; treat as already-seen.
      if (/duplicate key|unique/i.test(insErr.message)) {
        alreadySeen += 1;
        continue;
      }
      console.error('email_replies insert failed', insErr.message);
      continue;
    }
    processed += 1;
    counts[classification.category] += 1;

    // Suppression side-effects
    const lowerEmail = reply.fromEmail.toLowerCase();
    if (classification.category === 'not_interested' && /opt-out keyword/.test(classification.reason)) {
      const { error: supErr } = await supabase
        .from('email_suppressions')
        .insert({
          email: lowerEmail,
          reason: 'unsubscribe',
          source: 'reply',
          notes: classification.reason,
          source_message_id: reply.messageId,
        });
      // unique on email -> ignore conflict, already suppressed
      if (!supErr || /duplicate|unique/i.test(supErr.message)) {
        if (!supErr) newSuppressions.push({ email: lowerEmail, reason: 'unsubscribe' });
      } else {
        console.error('email_suppressions insert failed', supErr.message);
      }
      if (match.providerIds.length > 0) {
        await supabase
          .from('providers')
          .update({ email_bounced: true })
          .in('id', match.providerIds);
      }
    } else if (classification.category === 'bounce') {
      const { error: supErr } = await supabase
        .from('email_suppressions')
        .insert({
          email: lowerEmail,
          reason: 'hard_bounce',
          source: 'reply',
          notes: classification.reason,
          source_message_id: reply.messageId,
        });
      if (!supErr || /duplicate|unique/i.test(supErr.message)) {
        if (!supErr) newSuppressions.push({ email: lowerEmail, reason: 'hard_bounce' });
      } else {
        console.error('email_suppressions insert (bounce) failed', supErr.message);
      }
      if (match.providerIds.length > 0) {
        await supabase
          .from('providers')
          .update({ email_bounced: true })
          .in('id', match.providerIds);
      }
    }

    // Update providers.reply_* per matched provider, honouring precedence.
    if (match.providerIds.length > 0) {
      const newStatus = categoryToReplyStatus(classification.category);
      const newRank = STATUS_RANK[newStatus] ?? 0;

      // Pull current rows so we can apply precedence per-provider.
      const { data: existingProvs } = await supabase
        .from('providers')
        .select('id, reply_status, is_claimed, is_featured')
        .in('id', match.providerIds);
      for (const p of (existingProvs || []) as Array<{
        id: string;
        reply_status: string | null;
        is_claimed: boolean | null;
        is_featured: boolean | null;
      }>) {
        // Claimed/verified outranks any reply status; never downgrade.
        if (p.is_claimed || p.is_featured) continue;
        const currentRank = STATUS_RANK[p.reply_status || 'none'] ?? 0;
        if (newRank < currentRank) continue;
        await supabase
          .from('providers')
          .update({
            reply_status: newStatus,
            reply_received_at: reply.receivedAt,
            reply_snippet: snippet.slice(0, 280),
            reply_category: classification.category,
            reply_thread_url: reply.gmailThreadUrl,
            needs_human: classification.needsHuman,
          })
          .eq('id', p.id);
      }

      // Speed-to-lead Telegram ping for interested only. Fire-and-forget.
      if (classification.category === 'interested') {
        const { data: provRow } = await supabase
          .from('providers')
          .select('name')
          .eq('id', match.providerIds[0])
          .maybeSingle();
        const clinic = provRow?.name || '(no match)';
        const text = [
          'TheDripMap: interested reply',
          `Clinic: ${clinic}`,
          `From:   ${reply.fromEmail}`,
          `Re:     ${reply.subject || '(no subject)'}`,
          '',
          snippet.slice(0, 280),
          '',
          reply.gmailThreadUrl ? `Open: ${reply.gmailThreadUrl}` : '',
        ].filter(Boolean).join('\n');
        await sendTelegram(text);
        telegramPings.push(clinic);
      }
    }
  }

  // 3. Advance cursor
  if (highestUid !== null && highestUid !== undefined) {
    await supabase
      .from('email_replies_cursor')
      .update({ last_uid: highestUid, last_run_at: new Date().toISOString() })
      .eq('id', 1);
  } else {
    await supabase
      .from('email_replies_cursor')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', 1);
  }

  return NextResponse.json({
    ok: true,
    fetched: parsed.length,
    processed,
    alreadySeen,
    counts,
    newSuppressions,
    telegramPings,
    cursor: { lastUid: highestUid ?? sinceUid ?? null },
  });
}
