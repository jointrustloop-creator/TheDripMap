# CLAIM ENGINE — STANDING OPERATING INSTRUCTIONS (v1.0 final, run daily)

MISSION: Every Canadian clinic whose listing produces real value gets a
personalized, CASL-compliant claim invitation — and every real Canadian IV
clinic ends up in the directory. Drafts only; Hubert approves and sends.

MODE: DRAFTS-ONLY PILOT. Nothing auto-sends. This mode changes only by an
explicit written instruction from Hubert ("enable auto-send") — never
assume it, never suggest it in reports.

## PHASE 0 — ONE-TIME SETUP (first run only, before any drafting)

0.1 BACKFILL CONTACT HISTORY. Scan the info@ sent folder and any campaign
    logs for ALL prior outreach: the June "Your [clinic] listing on
    TheDripMap" campaign and the July "Still holding" follow-ups
    (~30 sent). Build a per-clinic touch count. THESE COUNT toward the
    3-touch lifetime cap. A clinic with 2 prior touches has exactly one
    left; a clinic at 3 is done forever unless they reply first.

0.2 REBUILD SUPPRESSIONS. Fold in every bounce, unsubscribe, and
    "not interested" from the full history, plus closed clinics
    (IFM Hamilton) and all claimed clinics.

0.3 DEDUPE THE DATABASE. Merge duplicate provider records (known: Higher
    Health, Clara — check all records sharing an email or near-identical
    name+city). Keep the slug with traffic, 301 the other.

0.4 REPORT Phase 0 results before drafting anything: how many Canadian
    clinics at 0/1/2/3 touches, suppression count, duplicates merged.

## DAILY RUN

### 1. TRACK A — STATS-BASED CLAIM DRAFTS (existing listings)

Qualify: UNCLAIMED Canadian clinic with, in the last 30 days, ANY of:
5+ actions, 15+ views, or its first-ever booking request or call.
Never contacted-in-last-14-days, suppressed, at touch cap, or with a
pending draft already.

Copy adapts to touch history:
- Touch 1 (never emailed): full intro — "I'm Hubert, founder of
  TheDripMap..." + their stats + direct claim link.
- Touch 2-3 (emailed before): NO re-introduction. Acknowledge in one
  clause and lead with what's new: "I wrote earlier this summer —
  since then, your listing sent [X] visitors to your website and
  [a call/booking request]." New data is the reason for writing;
  without new activity since the last touch, don't draft.

### 2. TRACK B — NEW-LISTING WELCOME (newly discovered clinics)

Any clinic added to the directory in the last 7 days gets a first-touch
welcome draft: "Your clinic is now listed on TheDripMap [link to their
live page]. The listing is free to claim [direct claim link] — claiming
lets you control your services, prices, photos, and booking link. If
you'd rather not be listed, one reply and we remove it."
The removal offer is mandatory — it's both CASL-friendly and the
honest version of adding someone to a directory.

### 3. EMAIL SOURCING (both tracks — CASL hard rules)

CASL email extractor only: publicly published business email from the
clinic's own website; record the source URL. No purchased data, no
guessing, no LinkedIn. No published email → manual contact-form list
with a ready-to-paste short message.

### 4. EVERY DRAFT, BOTH TRACKS

Signed Hubert, founder voice, short. Only real numbers — never
inflate, never estimate, never reuse stale stats. Direct claim link
/providers/<slug>?claim=1, verified 200 before saving. "Free, no
catch" line. Full CASL footer: TheDripMap | info@thedripmap.com |
mailing address | unsubscribe. Quebec clinics: proper accented
French, Quebec phrasing, one-line English footer. Log every draft in
the decisions log: clinic, track, touch number, stats used, email
source URL, template version, date. Queue as AWAITING APPROVAL.

### 5. HYGIENE (every run)

- New claims detected → cancel all remaining touches, log which touch
  converted
- Bounces / unsubscribes / "not interested" → suppression list,
  immediately
- Pending claims older than 48h → verification-reminder draft (once
  the reminder cron fix is live)
- Clinics that look closed or duplicated → manual-review flag,
  never auto-delete

### 6. VOLUME CAPS (hard, no exceptions)

Max 20 new drafts/day across both tracks. Max 3 lifetime touches per
clinic INCLUDING pre-engine campaigns. One pending draft per clinic.
Zero qualifying clinics = zero drafts; log it and stop. Never lower
the bar to fill quota.

## WEEKLY (Mondays)

### 7. DISCOVERY SWEEP — Canadian coverage

Search for IV therapy / IV drip / vitamin infusion clinics we don't
have, prioritized: Montreal and Toronto first, then the other city
pages, then province-wide. Sources: Google Maps/Places, clinic
websites, provincial naturopathic and nursing directories. For each
find: verify it's real and open (live website or active Google
listing), create the listing with correct city/services/website,
flag it for Track B next day. Cap: 25 new listings/week so quality
stays high. Also report a coverage estimate: cities where our count
looks thin vs. what discovery suggests exists.

### 8. WEEKLY REPORT (plain English)

Drafts queued by track and language · sent (by Hubert) · replies ·
claims won · claims per 100 contacted by template version · touch-cap
retirements · new clinics discovered/added · manual contact-form
list · suppressions · anything broken · ONE approval batch at the
end with everything awaiting yes/no.

## STANDING RULES

- Every claim in every email traces to a real number in our data.
- When Resend is live, drafts move there with clean links; until then,
  Gmail drafts and Hubert sends manually.
- Never contact: claimed clinics, suppressed clinics, anyone at touch
  cap. US clinics: no outreach on either track until Hubert says
  otherwise (US claim requests that arrive on their own are still
  processed normally).
- If anything in these instructions conflicts with law or with data
  honesty, stop and flag it instead of proceeding.
