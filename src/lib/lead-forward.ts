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

// ---------------------------------------------------------------------------
// HTML renderer for clinic-facing LEAD emails, in the house design the
// operator approved 2026-08-23 (600px white card, table layout, inline styles,
// bulletproof padded-<td> button, one-click unsubscribe). NO raw URLs in the
// body — every link is a button or hyperlinked text (operator rule: "no ugly
// links", re-affirmed 2026-08-28). Plain-text alternative always produced.
// ---------------------------------------------------------------------------
const SITE = 'https://www.thedripmap.com';
const MAILING = 'TheDripMap, Caledon, Ontario, Canada';
const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Same one-click unsubscribe endpoint as outreach. It writes
// email_suppressions, which forwardBlocker reads, so one click genuinely
// stops forwarded leads too.
const unsubUrl = (email: string) => `${SITE}/api/newsletter/unsubscribe/${encodeURIComponent(email)}`;

export interface LeadEmailInput {
  /** e.g. "Hi Example Clinic team," */
  greeting: string;
  /** Inbox preview line, under ~90 chars. */
  previewText: string;
  /** Intro paragraphs above the details box. */
  paras: string[];
  /** Label/value rows rendered in the tinted details box. */
  details: Array<[string, string]>;
  /** The patient's own words, quoted under the details. */
  requestText?: string;
  buttonLabel: string;
  buttonUrl: string;
  /** Clinic identity for the footer. */
  clinicName: string;
  clinicEmail: string;
}

export function renderLeadEmail(i: LeadEmailInput): { text: string; html: string } {
  const text = [
    i.greeting,
    ...i.paras,
    i.details.map(([k, v]) => `${k}: ${v}`).join('\n'),
    ...(i.requestText ? [`Message:\n${i.requestText}`] : []),
    `${i.buttonLabel}: ${i.buttonUrl}`,
    CLINIC_MAIL_FOOTER,
  ].join('\n\n');

  const p = (t: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3D4F49;">${escapeHtml(t)}</p>`;
  const detailRow = ([k, v]: [string, string]) =>
    `<tr><td style="padding:3px 14px 3px 0;font-size:13.5px;font-weight:700;color:#0F6E56;white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td>` +
    `<td style="padding:3px 0;font-size:14px;line-height:1.5;color:#1A2B26;">${escapeHtml(v)}</td></tr>`;

  const html =
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>` +
    `<body style="margin:0;padding:0;background-color:#F4F7F5;">` +
    `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(i.previewText)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F7F5;"><tr><td align="center" style="padding:32px 16px;">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">` +
    `<tr><td style="padding:0 8px 18px;"><img src="${SITE}/logo.png" alt="TheDripMap" width="150" style="display:block;border:0;max-width:150px;height:auto;"></td></tr>` +
    `<tr><td style="background-color:#FFFFFF;border-radius:16px;padding:36px 40px;font-family:${FONT};">` +
    `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#1A2B26;">${escapeHtml(i.greeting)}</p>` +
    i.paras.map(p).join('') +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F7F4;border-radius:12px;"><tr><td style="padding:20px 24px;">` +
    `<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0F6E56;">Patient details</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0">${i.details.map(detailRow).join('')}</table>` +
    (i.requestText
      ? `<p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:#3D4F49;border-left:3px solid #0F6E56;padding-left:12px;">${escapeHtml(i.requestText)}</p>`
      : '') +
    `</td></tr></table>` +
    `<div style="height:24px;line-height:24px;font-size:0;">&nbsp;</div>` +
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3D4F49;">Just hit reply. Your answer goes straight to the patient.</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 0;"><tr><td align="center" style="background-color:#0F6E56;border-radius:10px;">` +
    `<a href="${i.buttonUrl}" style="display:inline-block;padding:14px 34px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;">${escapeHtml(i.buttonLabel)}</a>` +
    `</td></tr></table>` +
    `<p style="margin:24px 0 0;font-size:15px;line-height:1.5;color:#1A2B26;"><strong>TheDripMap</strong><br><a href="${SITE}" style="font-size:13.5px;color:#0F6E56;text-decoration:none;">thedripmap.com</a></p>` +
    `</td></tr>` +
    `<tr><td style="padding:22px 24px 0;font-size:12px;line-height:1.6;color:#8A9C94;text-align:center;font-family:${FONT};">` +
    `You are receiving this because ${escapeHtml(i.clinicName)}'s listing on TheDripMap is claimed and lead forwarding is on.<br>` +
    `${escapeHtml(MAILING)} &nbsp;&middot;&nbsp; <a href="${unsubUrl(i.clinicEmail)}" style="color:#8A9C94;text-decoration:underline;">Stop forwarded leads</a>` +
    `</td></tr>` +
    `</table></td></tr></table></body></html>`;

  return { text, html };
}

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
