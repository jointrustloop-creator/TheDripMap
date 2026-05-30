// Unified email sender for TheDripMap.
//
// Prefers Workspace Gmail SMTP (via Nodemailer) when SMTP_USER + SMTP_PASS
// are configured — that's free and uses the user's own info@ inbox so
// deliverability is best-in-class. Falls back to Resend when SMTP isn't
// set up, so existing deployments keep working without env changes.
//
// All routes (contact, message-clinic, notify-operator, subscribe,
// testimonials, upgrade-request, verify-claim) should import sendMail
// from here instead of constructing email clients themselves.

import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export interface MailPayload {
  from: string; // e.g. 'TheDripMap <info@thedripmap.com>'
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string; // Optional HTML body (text is still required as fallback).
}

export interface MailResult {
  ok: boolean;
  provider: 'smtp' | 'resend' | 'none';
  id?: string;
  error?: string;
}

let smtpTransporter: nodemailer.Transporter | null = null;

function getSmtpTransporter(): nodemailer.Transporter | null {
  if (smtpTransporter) return smtpTransporter;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false', // default true (port 465 SSL)
    auth: { user, pass },
  });
  return smtpTransporter;
}

export async function sendMail(payload: MailPayload): Promise<MailResult> {
  // 1. Try SMTP (Workspace Gmail) first if configured.
  const transporter = getSmtpTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: payload.from,
        to: payload.to,
        replyTo: payload.replyTo,
        subject: payload.subject,
        text: payload.text,
        ...(payload.html ? { html: payload.html } : {}),
      });
      return { ok: true, provider: 'smtp', id: info.messageId };
    } catch (err) {
      console.error('sendMail SMTP error', err);
      // Fall through to Resend if SMTP fails (don't lose the email)
    }
  }

  // 2. Fall back to Resend if API key set.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: payload.from,
        to: payload.to,
        ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
        subject: payload.subject,
        text: payload.text,
        ...(payload.html ? { html: payload.html } : {}),
      });
      if (result?.error) {
        return { ok: false, provider: 'resend', error: result.error.message };
      }
      return { ok: true, provider: 'resend', id: result?.data?.id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, provider: 'resend', error: msg };
    }
  }

  return {
    ok: false,
    provider: 'none',
    error: 'No mail provider configured (set SMTP_USER+SMTP_PASS or RESEND_API_KEY)',
  };
}
