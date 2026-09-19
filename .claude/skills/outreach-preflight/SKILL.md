---
name: outreach-preflight
description: Run before sending ANY email to a clinic, owner or patient from TheDripMap. Checks that we are not asking for information we already hold or could look up ourselves, that the recipient and claims are real, and that the formatting and links are clean. Use whenever preparing outreach, a reply to an owner, a completion nudge, a batch send, or any new email template.
---

# Outreach preflight

Hubert, 2026-09-18: "make sure we are not asking anything that we have or can have answers to. I don't want to send any more emails that make no sense, we must get more organized."

An email that asks a clinic for something published on their own homepage does more damage than sending nothing. It tells the reader we did not look, which is the opposite of the reason they should trust a matching platform. Work through every gate below before a send. If a gate fails, fix the email, do not send and explain.

## Gate 1: do we already have it?

For every question the email asks, check in this order and stop at the first hit:

1. **Our own database.** Read the provider row. Check `services` (names and prices), `price_range`, `working_hours`, `medical_team`, `specialties`, `photos`, `image_url`, and `decision_drivers` (`manage`, `fact_fill`, `prebuilt`, `practitioner_source`, `cono_premise`).
2. **A parsing bug on our side.** A field can be verified and still absent from the row because our own code dropped it. This has happened twice: a practitioner name lost to a comma in "B.Sc., N.D.", and a credential that came out as the first degree because a dotted "N.D." has no trailing word boundary. If a fact "should" be there, grep the apply scripts before concluding the clinic never gave it.
3. **Their own website and booking page.** The clinic's domain and its Jane, Fresha or Mindbody page. A Jane booking page usually lists treatments WITH prices and often the practitioner.
4. **The regulator register.** CONO for Ontario IVIT premises, and the provincial college for a named practitioner and registration number.

Only what survives all four is a fair thing to ask for. In practice that is usually photos, and sometimes hours.

## Gate 2: is the ask worth an email?

- Never ask for more than three things. Name the single one that matters most and say why.
- If we filled the gap ourselves, the email is a **confirmation**, not a request: state what we published, cite where it came from, and offer to correct it. That email gets a far better response than a question.
- If nothing is missing, there is no email.

## Gate 3: is every claim in it true?

- Every fact about the clinic must be traceable to their own site, their booking page, or a regulator register. Never a directory, aggregator, review site or competitor.
- Never state a price, a practitioner or an opening time we have not seen in writing. A price that turns out to be for a consultation rather than a drip is a real harm to a real business.
- Numbers about their page (views, opens, completeness) must come from our own data, not be estimated. Nothing inflated.

## Gate 4: is the recipient right?

- Confirm the row's country before sending. Canadian city names collide with US ones constantly.
- Check BOTH `email_suppressions` and `outreach_suppressions`, and fail closed.
- Respect the two-touch cap. Check `outreach_sent`, `followup_sent`, and the `decision_drivers` marks (`warm_outreach`, `register_touch`, `personal_note`, `finish_nudge`).
- Never contact a row with a `discovery_flag` set. Those names are machine-extracted and unverified.
- Never contact Upper Room Clinic.

## Gate 5: does it read well?

- Sender is "Deborah, Founder, TheDripMap". No en dashes or em dashes anywhere; the send route rejects them.
- Say "matching platform", never "directory".
- Links use the labelled form `[Readable label](https://...)`. A raw finish link is a UUID plus a 32 character secret and looks like spam. A paragraph containing only a labelled link renders as a button. See `src/lib/email-render.ts`.
- Everything with a link goes through `scripts/_send-mail.ts`. The Gmail connector rewrites URLs into Google redirect strings and must never send.
- **The CASL block is automatic (since 2026-09-19).** `/api/admin/send-mail` appends identification, the Caledon mailing address and a one-click unsubscribe to every email (HTML and plain text) plus a `List-Unsubscribe` header, unless the call passes `transactional: true` (verification links and receipts only). Pass `clinicName` so the block names the clinic. Never paste a second footer into the body. Anything that does not go through send-mail (partb, warm, nudge in src/lib) carries its own block and must keep it.
- **Batches go over Resend, never Workspace SMTP.** Pass `channel: 'resend'` to `/api/admin/send-mail` for any send to more than one clinic, and space sends by 30 seconds. Workspace SMTP is for one-off replies only. Found 2026-09-18: 58 batch sends had gone over SMTP, which is a suspension risk for info@ and the likeliest reason 18 register emails got zero opens.

## Gate 6: approval

- A NEW format or copy gets one `[TEST]` copy to info@thedripmap.com, cc hubertzyworonek@gmail.com, before its first real use.
- EVERY batch, including approved formats, gets one rendered copy to the inbox BEFORE asking for the go, and the ask says the copy is there.
- Organic ranking and the Safety Verified badge are never for sale, and no email may imply otherwise.

## After sending

Record the touch on the provider row so the next run cannot repeat it, and log the send. Then check the inbox for replies at the start of every session; an owner's answer sitting unread for two days has happened and is not acceptable.
