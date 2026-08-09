# Part B — Score-Powered Outreach: standing rules (2026-08)

Queued behind the Transparency Score PR merge. Drafts only; Hubert sends. At
staging: 25 per batch, Gmail label "Outreach/Score-Batch-[date]", highest-traffic
cities first, then most views within a city. Report counts (first-touch vs
follow-up-replacement, capped-out, suppressed, 0/7-skipped).

## Permanent rules
- **US market gate (2026-08):** NO outreach of any band to US clinics while
  US_MARKET_ENABLED is false. Filter every batch to country = Canada.
- **Blank vs answered-No (2026-08):** an unchecked item that is BLANK may be
  framed as "not yet shown". An item the clinic answered No to is a COMPLETED
  disclosure: never nudged, never framed as incomplete. Applies to all bands.
- **Two-touch hard cap:** 0 prior touches = new copy as first touch; 1 prior
  touch = new copy REPLACES the day-14 follow-up (their second and final); 2
  touches = SKIP (report count for operator's re-engagement decision).
- **Suppression:** replied, bounced, closed, flagged, unsubscribed all excluded
  (check email_suppressions + outreach_suppressions, fail closed).
- **Numbers are real or omitted:** view count line only if provider views >= 5;
  city "compared X times" line only if that city has >= 20 views in 30 days
  (currently only Montreal, Toronto, Mississauga qualify).
- **Never email a 0/7 clinic** whose listing has nothing true to say; report the
  count instead.
- **CASL footer:** sender ID (TheDripMap), full mailing address, opt-out, reason.
  BLOCKER: real street address still required (placeholder must be replaced
  before any send).

## Bands
- **0-2:** city attention first (real numbers), score second as "your listing
  currently shows X of 7 transparency details", framed as incomplete info, never
  a grade. Subject line does NOT contain the score.
- **3-5:** score-first, "so close" framing. Subject MAY include the score.
- **6/7 (personal, claimed owners):** "one detail away from 7/7". Flag each
  individually. Only nudge when the missing item is BLANK.

## 6/7 roster status (2026-08-09)
- DRS Mobile Therapy — missing Pricing (BLANK) -> nudge eligible
- Erin Mills Optimum Health — missing Pricing (BLANK) -> nudge eligible
- Allies Integrated Health — missing Pricing (BLANK) -> nudge eligible
- Bay Wellness Centre — missing Health screening (answered No) -> NO nudge (also
  excluded: active badge completion-request thread)
- Glow Wellness Clinic — US clinic -> excluded under the US market gate (also has
  an active courtesy-note thread)

Net 6/7 nudge band: DRS, Erin Mills, Allies (3 clinics), "add your pricing to
reach 7/7".

## Approved example copy
The three band examples (0-2 Drip Bar MTL, 3-5 Health First Group, 6 personal)
are approved with the Band 0-2 edit applied ("and your listing was viewed 20
times in the same period"). Full text in the session record; re-render at
staging with live numbers.
