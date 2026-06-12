# AUTOPILOT v1: Two Templates for One-Time Approval

Date: 2026-06-12. Status: AWAITING OPERATOR APPROVAL. Nothing sends until you
reply with a go on each. Per the standing rules: outreach NEVER auto-sends
(Gmail drafts only); the onboarding email is the ONLY auto-send and only
after you approve this exact text.

---

## A. Outreach claim email template (W2, drafts only)

Mechanics: one email per clinic ever. The {{personal_opener}} is written
fresh per clinic from their website + Google reviews, one or two sentences,
always something true and specific (a named practitioner, a signature drip,
a detail reviewers praise). No em-dashes. CASL footer appended for Canadian
sends. Goes to Gmail drafts by 6:45am Toronto; you send at 7am.

Subject: Your {{city}} clinic is already on TheDripMap

Hi {{first_name_or_team}},

{{personal_opener}}
[Example, Drip Wellness Calgary: "Your reviews keep mentioning the same
thing: nurses who explain everything before the first poke. That is rarer
than it should be."]

I run TheDripMap, the IV therapy matching platform for Canada and the US.
{{clinic_name}} is already listed, people searching IV therapy in {{city}}
are landing on this page right now:

{{provider_url}}

The listing is a bare placeholder. No photos, no prices, no team. Most
people who land on a thin profile click away to the next clinic.

Claiming it is free and takes about two minutes:

{{claim_url}}

Once you verify, we fill in the page properly: your logo, photos, your most
popular drips with your real prices, who is on your team, and the answers
patients actually search for. Clinics with complete pages get noticeably more
clicks than bare ones, we see it in our own data.

If you would rather we simply correct something on the listing, reply and
tell me what to change. And if you want the listing removed, one reply does
that too.

Warmly,
{{operator_name}}
TheDripMap
info@thedripmap.com

{{CASL_FOOTER}}

Notes for approval:
- No Featured/paid language anywhere (pricing hidden per standing decision,
  and the old template's WAITLIST paragraph is intentionally dropped).
- "Matching platform," never "directory."
- The removal offer is deliberate: it is honest, it defuses hostility, and
  it doubles as the CASL-friendly opt-out in plain words.

---

## B. Onboarding email, final text (W1, the ONLY auto-send, post-verification)

Sent automatically when a claim is verified, copy to info@thedripmap.com.
Variables: {{first_name}}, {{clinic_name}}, {{city}}, {{operator_name}}.
Full research behind the five questions: scripts/_phase0-onboarding-questions.md

Subject: You're verified on TheDripMap. Five quick questions to finish your listing

Hi {{first_name}},

{{clinic_name}} is now verified on TheDripMap. Nice to have you.

Verified clinics with a complete profile get noticeably more clicks and calls
than bare listings, so we'd like to fill yours in properly. Five questions.
A few sentences each is plenty, and you can answer right in a reply to this
email.

1. Who will patients meet? Who places the IVs, and who provides the medical
   oversight? Names and credentials (RN, NP, ND, MD), with one line of
   background per person. Something like "Dr. Megan Maycher, ND, 10 years in
   IV nutrient therapy" is perfect.

2. What are your three most popular drips, and what do they typically cost?
   Name, a rough or "from" price, and how long a session usually takes. A
   range is fine. We never hold you to exact pricing.

3. What does a first visit look like? Do new patients get a consultation or
   health screening first, how long should they budget, and what do most
   first-timers not expect?

4. Where do your IV ingredients come from, and how are they prepared? For
   example, a licensed compounding pharmacy or pharmaceutical wholesaler,
   prepared fresh on site. Patients ask us this more than anything except
   price.

5. How do patients pay, and what can they claim? Do you issue receipts for
   extended health benefits, do you direct bill, and do you take HSA/FSA? Is
   there a membership or package, or simply pay per visit?

Two more things while you're at it:

- Your logo (PNG or SVG is ideal)
- Two or three photos: your treatment space, your team at work, your front
  door. Real photos beat stock every time, and listings with photos get far
  more bookings.

Reply whenever suits you this week. We'll have your updated listing live
within two business days of hearing back, and we'll send you the link to
review before anything else changes.

Thanks again for verifying. Patients in {{city}} are already finding you.

{{operator_name}}
TheDripMap
info@thedripmap.com

Day-7 nudge (one only, then never again):

Subject: Still want your TheDripMap listing filled in?

Hi {{first_name}},

Quick nudge on the five questions I sent last week for {{clinic_name}}.
A few sentences and a couple of photos is all we need, and your listing
goes from placeholder to complete within two business days.

If now is a bad time, no problem, your verified listing stays live either
way. Reply whenever you're ready.

{{operator_name}}
TheDripMap

---

Approval needed: reply "approve A", "approve B", or "approve both", with any
edits. W1 build (PR #2) starts only after B is approved; W2 starts only
after A is approved.
