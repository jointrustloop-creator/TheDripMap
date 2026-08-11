# Monetization Tiers & Evidence-Based Outreach — Current-State Report (v1)

**Prepared:** 2026-08-11 · **Status:** REPORT ONLY. No migrations run, no ranking
changed, no email sent. Awaiting Hubert's approval per brief §12.

**Data window for every performance figure below:** rolling 30 days,
**2026-07-12 → 2026-08-11**. Card-click tracking shipped 2026-06-25 and booking
tracking 2026-07-06, so this window is **fully instrumented** — no
under-instrumented back-reach.

---

## 0. Headline finding (read this first)

**Segment A is empty. Under the §5 threshold (30-day views ≥ 25 AND actions ≥ 8),
zero clinics qualify today — claimed or unclaimed.**

The whole platform generated **653 events in 30 days** (552 views + 101 actions)
across ~1,600 listings. The evidence-based engine's premise ("pitch only clinics
whose listings are demonstrably producing traffic") is sound, but at current
traffic **there is nothing to pitch**: the outreach engine would send zero
Segment A emails.

The exact Montreal cluster the brief names as Segment A is real — it *is* the top
of the funnel — but every one of them is under the line, short on **views**, not
actions:

| Clinic | City | 30-day views | 30-day actions | Eligible? |
|---|---|---:|---:|---|
| MyBest Clinic Montreal | Montreal | 12 | 10 | No — views 12 < 25 |
| Drip Bar MTL | Montreal | 20 | 8 | No — views 20 < 25 |
| Wellness Mobile IV Montreal | Montreal | 19 | 7 | No — views 19 < 25, actions 7 < 8 |

**This is the one decision that gates the whole project:** either (a) recalibrate
the threshold to current traffic reality, or (b) treat the engine as built-and-
waiting and grow traffic before it has fuel. Recommendation in §7. Everything
else in the brief is buildable; this is the blocker.

---

## 1. Current-state audit — A/B/C/D under the §5 threshold

**Roster (live, 2026-08-11):** 1,626 providers total · **27 claimed** (brief said
26; live count is 27) · **6 featured** · 619 CA active · 993 US active.

| Segment | Definition | Count | Notes |
|---|---|---:|---|
| **A** | Unclaimed CA + upgrade-eligible (views≥25 **and** actions≥8) | **0** | Empty. Montreal cluster is closest (table above). |
| **B** | Unclaimed CA, brand-name interception (our page ranks p.1 for their name) | **Cannot compute** | Requires GSC per-page brand-query export — blocked (§11 / brief §11). Does not exist yet. |
| **C** | Unclaimed CA, no upgrade traffic (free-claim invite only) | **597** | Of these, 135 had ≥1 event in 30d; **462 had zero activity**. |
| **D** | Grandfathered (claimed + featured) | **27** | 17 had ≥1 event in 30d; **0 crossed the upgrade threshold**. |
| — | US (out of scope, brief §10) | 993 active | 67 had activity; ignored for this phase. |

**Where the (little) unclaimed-CA action volume actually is (30 days):**

| City | Unclaimed actions | Unclaimed views | # unclaimed listings |
|---|---:|---:|---:|
| Montreal | 36 | 79 | 15 |
| Halifax | 7 | 11 | 6 |
| Mississauga | 6 | 14 | 8 |
| Winnipeg | 5 | 10 | 6 |
| Edmonton | 4 | 12 | 9 |
| Toronto | 2 | 25 | 16 |

Montreal is ~35% of all unclaimed-CA action volume. It is the correct beachhead —
the brief's instinct is right — but even Montreal's best listing is at 20 views,
not 25. Toronto has views but almost no actions yet.

---

## 2. Segment A list, in full

**Empty.** No unclaimed CA clinic meets views ≥ 25 AND actions ≥ 8 in
2026-07-12 → 2026-08-11.

Nearest-to-eligible (the real "Segment A candidates" once the threshold or traffic
moves), with exact numbers and the gap:

| Clinic | City | Views (need 25) | Actions (need 8) | Gap |
|---|---|---:|---:|---|
| MyBest Clinic Montreal | Montreal | 12 | 10 ✅ | needs +13 views |
| Drip Bar MTL | Montreal | 20 | 8 ✅ | needs +5 views |
| Wellness Mobile IV Montreal | Montreal | 19 | 7 | needs +6 views, +1 action |

Contact note from the brief holds: **MyBest and Drip Bar publish no email** — they
would be contact-form/phone, handled by Hubert. None can be pitched today because
none qualifies.

---

## 3. Proposed migration — DIFF ONLY, NOT APPLIED

Present for review. Do **not** paste until approved. Written for Postgres/Supabase,
additive and reversible, uses `IF NOT EXISTS` so it is safe to run once approved.

```sql
-- ============================================================================
-- PROPOSED — monetization tiers. NOT APPLIED. Requires Hubert approval (§12).
-- ============================================================================

-- 3.1 providers: tier + paid lifecycle + operator override + nightly score
DO $$ BEGIN
  CREATE TYPE provider_tier AS ENUM ('free', 'paid', 'grandfathered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS tier              provider_tier NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS tier_started_at   timestamptz,
  ADD COLUMN IF NOT EXISTS paid_since        timestamptz,
  ADD COLUMN IF NOT EXISTS paid_until        timestamptz,
  ADD COLUMN IF NOT EXISTS paid_slot_city    text,
  ADD COLUMN IF NOT EXISTS outreach_override boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completeness_score integer NOT NULL DEFAULT 0;

-- 3.2 Backfill grandfathered = the 27 claimed OR 6 featured; everything else free.
--     (Run inside the same migration, after the columns exist.)
UPDATE providers SET tier = 'grandfathered', tier_started_at = now()
  WHERE (is_claimed = true OR is_featured = true) AND tier = 'free';

-- 3.3 claim_requests.reminder_sent_at — the abandoned-claim reminder cron is
--     DEAD without this column (confirmed missing 2026-08-11). This is the same
--     column scripts/create-claim-reminder-column.sql was written for but never
--     pasted. Folding it in here per brief §7.
ALTER TABLE claim_requests
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- 3.4 listing_stats_30d — rolling 30-day per-provider rollup (see §4 for the
--     feasibility assessment). Materialized so pages/outreach read it cheaply;
--     refreshed nightly (needs a scheduler — pg_cron OR an existing cron route).
CREATE MATERIALIZED VIEW IF NOT EXISTS listing_stats_30d AS
SELECT
  e.provider_id,
  (now() - interval '30 days')                                             AS window_start,
  now()                                                                    AS window_end,
  count(*) FILTER (WHERE e.event_type = 'view')                            AS views,
  count(*) FILTER (WHERE e.event_type = 'website_click')                   AS website_clicks,
  count(*) FILTER (WHERE e.event_type = 'call_click')                      AS calls,
  count(*) FILTER (WHERE e.event_type = 'book_click')                      AS bookings,
  count(*) FILTER (WHERE e.event_type = 'directions_click')                AS directions,
  count(*) FILTER (WHERE e.event_type = 'message_click')                   AS messages,
  count(*) FILTER (WHERE e.event_type IN
    ('website_click','call_click','book_click','directions_click','message_click')) AS actions,
  (count(*) FILTER (WHERE e.event_type = 'view') >= 25
   AND count(*) FILTER (WHERE e.event_type IN
    ('website_click','call_click','book_click','directions_click','message_click')) >= 8) AS upgrade_eligible
FROM listing_events e
WHERE e.created_at >= now() - interval '30 days'
GROUP BY e.provider_id;

CREATE UNIQUE INDEX IF NOT EXISTS listing_stats_30d_pid ON listing_stats_30d (provider_id);
-- Nightly: REFRESH MATERIALIZED VIEW CONCURRENTLY listing_stats_30d;

-- 3.5 outreach_segment is a COMPUTED field (A/B/C/D), recomputed nightly.
--     Proposed as a nightly UPDATE, not a stored generated column, because
--     Segment B depends on GSC data that lives outside Postgres. Left as a
--     nightly job spec rather than DDL until the GSC source exists.
```

`outreach_segment` is intentionally **not** shipped as DDL: A/C/D are derivable in
SQL, but **B depends on GSC brand-query data that has no source yet**, so segment
assignment belongs in a nightly job once GSC is wired, not a generated column.

---

## 4. Can `listing_stats_30d` be built from existing tracking?

**Yes — the data is already captured. No new event types are required.** The
`listing_events` table records all six signals the threshold needs:

| §5 action | listing_events type | Present? |
|---|---|---|
| views | `view` | ✅ |
| website clicks | `website_click` | ✅ |
| calls | `call_click` | ✅ |
| bookings | `book_click` | ✅ |
| directions | `directions_click` | ✅ |
| messages | `message_click` | ✅ |

30-day tally observed in-window: view 552, website_click 83, book_click 6,
call_click 6, directions_click 3, message_click 3.

**What to know / what's missing:**

1. **`book_click` is a button click, not a confirmed booking.** There is no
   confirmed-booking event; booking *requests* ride the Message-Clinic pipeline
   as `[BOOKING]` inquiries. If "bookings" in the threshold is meant to be
   confirmed bookings, that signal does not exist. Recommend defining actions on
   the click events above (which is what the SQL does) and saying so explicitly.
2. **`message_click` is intent, not a sent message** (just fixed + relabeled in
   `/admin/insights`). If "messages" should mean *submitted* leads, count
   `inquiries` with the `[Lead for … clinicId=]` marker instead. Flag for Hubert:
   the brief's "messages" is ambiguous between the two. The SQL uses `message_click`
   for consistency with the other click actions; easy to switch.
3. **Nightly refresh needs a scheduler.** Supabase has no built-in mat-view
   refresher. Either enable `pg_cron` (`REFRESH MATERIALIZED VIEW CONCURRENTLY`)
   or add a Vercel cron route that calls it. Low effort; just needs a decision.
4. **`completeness_score` is computable from data we already store** (photos,
   menu prices, hours, booking link, phone, description length, safety
   questionnaire). The finish-listing flow already computes a completeness meter
   (`app/api/finish-listing`, `FinishListingForm`); formalize that same logic into
   the nightly `completeness_score` so the owner checklist and the paid-band gate
   read one number. No new capture needed.
5. **The 30-day rolling aggregation already exists in app code** (`getPerProviderCounts`,
   used by `/admin/insights` 30d view). The mat-view just moves it into Postgres
   so ranking and the owner dashboard don't recompute it per request.

Verdict: buildable now, entirely from existing tracking. The only genuine gap is
**definitional** (bookings/messages), not a data gap.

---

## 5. Conflicts between §4 and the current implementation

These are real and must be resolved before any ranking change ships.

### 5.1 Quiz — treatment/location match is a SOFT SORT, not a HARD FILTER (most important)
`app/quiz/results/page.tsx` (sortFn ~L260-278) sorts, in order:
`is_featured` → `offersRecommended` (treatment match) → `safety_verified` →
`is_claimed` → `rating`. Delivery preference (Mobile/In-Clinic) is applied "only
if it doesn't empty the set" (L243-244).

- **`is_featured` is sorted ABOVE treatment match.** So a paid/featured clinic that
  does **not** offer the recommended treatment currently ranks **above** an organic
  clinic that does. **This violates the brief's #1 non-negotiable — "paid buys
  position, never inclusion."** §4 requires a hard filter (active + serves region +
  offers treatment) *before* any tier sort. Today there is no hard filter; match is
  a tiebreaker.
- **No paid-band cap.** §4 caps the quiz at 2 paid clinics; current code has no cap
  (the top-3 slice could be 3 featured).
- **No completeness / verification gate on the paid band.** §4 requires paid-band
  members to be safety-verified AND completeness ≥ 70%; today `is_featured` floats
  to the top unconditionally (safety_verified is only a lower tiebreaker).

### 5.2 City pages / search — no slot caps, no completeness, tier proxy
`getListingsByCity` (`src/lib/data.ts` L296, L354, L446, L515) orders:
`is_featured` → `is_claimed` → `safety_verified` → `rating`.

- **No paid-slot cap** (§4: 3 slots for cities < 30 listings, 5 for Toronto /
  Montreal / Vancouver, then waitlist). Today unlimited featured float up.
- **Organic band order differs from §4.** §4 organic = safety_verified →
  completeness → rating → distance → alphabetical. Current = is_featured →
  is_claimed → safety_verified → rating. Missing: completeness, distance,
  alphabetical; and `is_claimed` is used as a de-facto tier signal.

### 5.3 `tier` vs `is_featured` — the semantic overlap to reconcile
All current ranking keys on **`is_featured`**; the new model keys on **`tier = 'paid'`**.
The 6 grandfathered featured must "keep exactly what they have" (§3) — i.e. keep top
placement — but they are not paying. **Decision needed:** do grandfathered-featured
listings consume a city's finite paid slots, or sit above/outside the cap? This
changes both the slot math and the migration's backfill intent.

### 5.4 `reminder_sent_at` missing → abandoned-claim reminder cron is dead
Confirmed missing on `claim_requests` (2026-08-11). `app/api/cron/claim-reminder`
early-returns without it, so no owner ever gets a claim reminder. Included in the
proposed migration (§3.3). This is why claims sit unresolved.

### 5.5 Data correction to the brief's §7
The brief lists "three claims stranded on expired tokens (IV Alchemy, BeYouty,
Enfield)." As of 2026-08-11 that is stale:
- **IV Alchemy — RESOLVED today.** Verified via the real flow; `is_claimed=true`,
  claim `verified`. Now live.
- **BeYouty (Los Alamitos) and Enfield/New You (Tomball)** are the only 2 pending
  claims left, and **both are US** — correctly frozen through the US pause. Their
  tokens are not the blocker; the US pause is.

So there is currently **no stuck Canadian claim.** The systemic fix still matters
(a silent verification-send failure is what stranded IV Alchemy for 16 days); that
visibility fix + a one-click `/admin/claims` resolve button shipped separately on
2026-08-11 and are pending merge.

---

## 6. Owner-facing stats page (§7) — readiness

The brief calls this the highest-leverage item, and the plumbing largely exists:
- 30-day per-provider views/actions + breakdown: **exists** (`getPerProviderCounts`,
  surfaced in `/admin/insights`). Needs an owner-scoped, single-clinic view.
- Completeness checklist: **exists** in the finish flow; reuse for the dashboard.
- City-median comparison: derivable from `listing_stats_30d` once built.
- The "lands nowhere after claim" gap: the finish flow + manage-token already give
  owners a page; the missing piece is a stats dashboard at that destination.

No blocker here beyond building the view. It should ship **before** any outreach,
per the brief — and given Segment A is empty, the dashboard (which converts on the
clinic's own numbers) is the higher-value first build regardless.

---

## 7. Recommendations / decisions owed by Hubert

1. **Threshold recalibration (the gating decision).** At current traffic, views ≥ 25
   qualifies nobody. Options:
   - **Lower to views ≥ 15 AND actions ≥ 6** → captures the Montreal 3 immediately,
     giving the engine a real (small, high-intent) Segment A now.
   - **Keep 25/8 and grow traffic first** → engine stays built-and-waiting; focus
     shifts to SEO/traffic before monetization.
   - **Relative threshold** (e.g. top-N per city by actions) → always has members,
     self-scales with traffic.
   My recommendation: **lower to 15/6 for Montreal only as a pilot**, keep 25/8 as
   the national bar, and revisit monthly. This respects "never pitch on a promise"
   (15 views + 6 actions is still real demand) without waiting on traffic.
2. **Confirm grandfathered scope:** 27 claimed (not 26) + 6 featured. Backfill uses
   the live 27.
3. **Grandfathered-featured vs paid slots** (§5.3) — do they consume slots?
4. **Bookings/messages definition** (§4.1-4.2) — click events or confirmed/submitted?
5. **The §11 blockers** remain hard dependencies before any send: price, CASL
   mailing address, Resend on send.thedripmap.com, Workspace billing (card 6841),
   GSC export for Segment B.

Nothing in this report has been applied. On approval, suggested build order:
owner stats dashboard → `reminder_sent_at` + migration → `listing_stats_30d` +
nightly refresh → ranking changes (hard filter first) → outreach templates as
drafts.
