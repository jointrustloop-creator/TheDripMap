-- Contact-log campaign/channel fields (operator task 2026-08-16).
--
-- WHY: 10 emails were sent by hand from info@thedripmap.com via the Gmail API
-- on 2026-08-16 (badge-renewal asks + a patient lead forward). They bypassed
-- both the Resend mailer and the drafts flow, so nothing recorded them. Without
-- a record, automation has no way to know these clinics have an active
-- conversation, and the contact history on each listing is wrong.
--
-- The existing outbound_message_log has (message_id, provider_id, to_email,
-- subject, sent_at, kind, template_id, body_preview) but no notion of WHICH
-- SYSTEM sent it, WHICH CAMPAIGN it belonged to, or whether it should count
-- against the two-touch cold-outreach cap.
--
-- IMPORTANT: the two-touch marketing cap is computed from
-- providers.outreach_sent + providers.followup_sent (see src/lib/partb-outreach.ts),
-- NOT from this table. counts_toward_cap is therefore a DECLARATION for humans
-- and future tooling: compliance/relationship mail (badge renewals) and
-- transactional mail (patient lead forwards) must never be counted as one of
-- the two cold-outreach touches. Recording here deliberately does not, and must
-- not, flip outreach_sent.
--
-- Paste in the Supabase SQL editor. The logging script is TOLERANT of these
-- columns being absent: it falls back to kind/template_id, so it can run before
-- this paste and the backfill below reconciles the shapes afterwards.

alter table public.outbound_message_log
  add column if not exists channel           text,          -- 'resend' | 'gmail_manual' | 'gmail_draft'
  add column if not exists campaign          text,          -- e.g. 'badge_renewal_aug2026', 'lead_forward'
  add column if not exists counts_toward_cap boolean not null default true;

comment on column public.outbound_message_log.counts_toward_cap is
  'false for transactional + compliance/relationship mail (lead forwards, badge renewals). The cap itself lives on providers.outreach_sent/followup_sent; this flags intent so a send is never miscounted as cold outreach.';

create index if not exists outbound_message_log_campaign_idx
  on public.outbound_message_log (campaign, sent_at desc);
create index if not exists outbound_message_log_provider_idx
  on public.outbound_message_log (provider_id, sent_at desc);

-- Batch-level audit log gets the same campaign dimension.
alter table public.email_send_log
  add column if not exists campaign text;

-- Backfill: before these columns existed the logging script encoded the pair
-- into template_id as 'gmail_manual:<campaign>' (the `kind` column carries a
-- CHECK constraint this batch does not belong to). Split those rows apart.
update public.outbound_message_log
   set channel  = split_part(template_id, ':', 1),
       campaign = split_part(template_id, ':', 2)
 where template_id like 'gmail_manual:%'
   and (channel is null or campaign is null);

update public.outbound_message_log
   set counts_toward_cap = false
 where campaign in ('badge_renewal_aug2026', 'lead_forward');
