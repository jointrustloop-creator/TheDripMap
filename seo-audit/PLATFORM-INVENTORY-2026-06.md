# TheDripMap Platform Inventory
**Compiled 2026-07-09 | Strictly read-only | Report of what IS, not what should be**

Method: six parallel read-only investigations (routes/features, database, automations, email, flags/integrations, safety surfaces) over the repo, the live Supabase database, and the production site, plus a first-person delta disclosure written from the assistant's own session history and git log. Every count is live as of 2026-07-09. Nothing was fixed, refactored, or deleted during this inventory. One known drift: this file is named 2026-06 per the requested path; the data is as of 2026-07-09.

---

## SECTION 1: FEATURES & PAGES

> **Summary:** 64 page routes + 55 API routes, pure app router, no pages/ directory. The patient funnel (search, quiz, compare, provider pages, booking/message, deals, price index) and the clinic funnel (claim, verify, /finish owner portal, admin suite of 11 screens) are all live. Notable surprises: a fully built AI chat agent (Drip Assistant + white-label Clinic Agent) is dark in production awaiting a Groq key; a $99/mo Featured upgrade page is live and linked from claimed provider pages despite the "pricing hidden" standing decision; a leftover public debug endpoint (/api/audit) dumps provider data.

### Live user-facing features
| Feature | State | What it does | Data goes to |
|---|---|---|---|
| Search (/search) | LIVE | SSR top-150 (claimed→featured→rating), client-side full-pool filters. No map view. | read-only; clicks → listing_events |
| Quiz + matching (/quiz, /quiz/results) | LIVE | 4-step client-side quiz incl. medical-history pre-screen; ~3 match cards. safety_verified is a rank tier. | no DB writes; answers in URL params only |
| Provider pages (/providers/[slug]) | LIVE | Two render paths: claimed → DefinitiveListingLayout; unclaimed → legacy layout. Booking + message CTAs, testimonials, view tracking, Featured-upgrade CTA on claimed non-featured. | listing_events |
| Booking requests (v1) | LIVE (since 2026-07-05) | Modal: treatment chips + time windows + contact. **0 booking requests received to date.** | inquiries + auto-forward email + info@ copy |
| Message clinic | LIVE | Free-text patient lead; auto-forwards to eligible claimed clinics (reply-to patient) since 2026-06-25. | inquiries + email |
| Claim flow | LIVE | ClaimListingModal + /for-clinics/setup → /api/notify-operator (also auto-creates orphan stubs) → email verify → /verify-claim flips is_claimed, mints manage_token, enqueues onboarding. | claim_requests, providers, onboarding_requests |
| Owner portal (/finish/[token]) | LIVE | Self-serve editor: drips + prices, team, photos, hours, booking link, deals, safety questionnaire, completeness meter. Publishes instantly. | providers, operator_profiles |
| Safety questionnaire → badge | LIVE, **auto-grants** | Completing the safety section AUTO-sets safety_verified=true (see Section 6 — contradicts documented policy). | providers.safety_verified |
| Compare (/compare) | LIVE (noindex) | Side-by-side clinic table via ?ids=. | read-only |
| Deals (/deals) | LIVE | Owner-set special offers with one-tap toggle. Only 3 providers have offers. | providers.special_offers |
| IV Price Index (/iv-prices, /iv-prices/[city]) | LIVE | Citable CAD price stats from in-code dataset (Toronto/Calgary/Edmonton). Flagship AEO asset. | in-code, no DB |
| Blog (130 posts), Guides (7), city/state/treatment/symptom/matrix pages | LIVE | Content layer; blogs now end with a booking CTA (added 2026-07-08). | read-only |
| Testimonials | LIVE | Public submit → email moderation links → /admin/testimonials. **0 submissions ever.** | testimonials (0 rows) |
| Lead magnets: /tools/seo-audit, /tools/brand-voice, /tools/get-found-kit | LIVE | Free clinic-site grader; AI copy generator (Anthropic) with apply-by-email-token flow (/apply-copy); kit order intake. | inquiries, kit_orders (0 rows), providers.description |
| Admin suite (11 screens) | LIVE (cookie-gated) | dashboard, leads, insights, onboarding, tools, replies, testimonials, backlinks, opportunities, owner-pains, login. /admin does NOT link /admin/onboarding. | many tables |
| First-party analytics | LIVE | view/click beacons → /api/track → listing_events (929 rows) + monthly rollup. | listing_events |

### Built but dark / flagged / half-built
- **Drip Assistant + white-label Clinic Agent** — complete chat-agent stack (Groq Llama-3.3-70B tool-calling over provider data, site-wide widget, embeddable clinic-agent.js, demo + install pages). **Dark in production: GROQ_API_KEY unset; /api/drip-assistant returns 503; widget never renders.** Demo/install/embed pages are live 200s wrapping a non-functional product.
- **Featured upgrade (/for-clinics/upgrade)** — LIVE, `const PRICE = 99` ($99/mo), UpgradeRequestForm → inquiries. Linked from every claimed non-featured provider page. **Conflicts with the recorded 2026-05-27 "pricing hidden until further notice" decision.**
- **Featured waitlist (/for-clinics/featured-waitlist)** — functional but orphaned: zero internal links; featured_waitlist table has 0 rows ever.
- **Legacy /dashboard** — old operator dashboard reading operator_profiles; only linked from /for-clinics/success; superseded by /finish.
- **Outreach engine (crons)** — code live, PAUSED since 2026-06-08; day-to-day outreach moved to local desktop-task scripts.
- **W1 onboarding engine** — enqueue live; autosend + day-7 nudge gated (see Section 3).
- **Abandoned-claim reminder** — double-dead: gate false AND its DB migration never applied.

### Dead / orphaned code
- Components imported nowhere: DripBackground, RoiCalculator, HowItWorks, LiveStatsBar, UrgencyIndicator, CompactCityGrid, GoogleListingMap, ListingMap.
- **/api/audit** — leftover debug endpoint, publicly reachable, dumps a 10-row New York provider sample. Referenced by nothing.
- Untracked working files in repo root: design mockup HTMLs, stray clinic logos/photos, `UsersDellAppDataLocalTempsitemap.xml`.
- Duplicate route pair: /symptoms/[slug] and /iv-therapy-for/[slug] render the same use-case dataset (each self-canonicalizes).
- Stale admin copy: "Queue 4 pending-claim drafts" button (only 1 claim is genuinely pending).

---

## SECTION 2: DATABASE

> **Summary:** 30 tables exist in the public schema; the code references 27 (three referenced tables DON'T exist: `leads`, `gbp_snapshots`, and `provider_events` has zero refs anywhere — the real table is `listing_events`). Five legacy tables (incl. an abandoned pre-providers schema with Stripe columns) have zero code refs; `pending_listings` holds the only test data in prod (2 dev fixtures from April). providers/claim_requests are clean of E2E rows.

### Core tables (live counts, 2026-07-09)
| Table | Rows | Notes / flags |
|---|---|---|
| providers | 1,583 | 997 US, 586 CA, 22 claimed, 6 featured, 8 safety_verified, 14 hidden, 38 bounced. Always-null: subtypes, outreach_skipped_reason; near-dead: rank_in_city (1 row). Duplicate columns: image_url AND imageUrl. Sparse: manage_token 24, special_offers 3, photos 2. |
| blog_posts | 130 | Full snake_case + camelCase duplicate column pairs, partially backfilled (relatedCities 14/130 vs related_cities 130/130). reviewedBy always null. |
| claim_requests | 18 | 17 verified, 1 pending (BeYouty, since 2026-06-01). claimed_at column always null (real one lives on providers). **reminder_sent_at column referenced by the claim-reminder cron does NOT exist (migration never applied).** |
| cities | 333 | lat/lng only 34/333. Duplicate-ish columns listing_count AND listings_count (stale/unused — pages compute live). |
| inquiries | 8 | Patient leads + tool leads. **forwarded_to_clinic_at / forward_status are 0/8 despite auto-forward being LIVE since 2026-06-25** — either no eligible lead has arrived, or forwards aren't being recorded. |
| onboarding_requests | 15 | 12 sent, 3 submitted. Post-send half of the pipeline unexercised (nudge/reply/published/answers/assets/safety_evidence all null). |
| listing_events / listing_events_monthly | 929 / 377 | Healthy first-party analytics. |
| outbound_message_log | 88 | **to_email and kind ALWAYS null (0/88)** — any suppression logic keyed on to_email would match nothing. Newest row 2026-06-12: current pipelines no longer write here. |
| email_replies (+cursor) | 136 / 1 | Reply ingestion healthy (cursor last_run_at 2026-07-09T22:00Z). handled_at/handled_by never written (the /admin/replies "handled" workflow is unused). |
| email_suppressions / outreach_suppressions | 18 / 23 | Healthy, actively written. |
| seo_health_runs / findings / baseline / gsc_cursor | 26 / 943 / 1 / 1 | **Active — CLAUDE.md still lists this SQL as "PENDING OPERATOR PASTE" but the tables exist and are populated.** |
| backlink_targets | 19 | Pipeline stalled: newest research row 2026-06-06, newest draft 2026-05-31; sent_at/linked_at never set. |
| testimonials, featured_waitlist, kit_orders | 0 / 0 / 0 | Shipped features that have never received a single row. |
| clinic_opportunities | 4 | Assessed once; outreach never followed (last_contacted_at all null). |
| states, operator_profiles, clinic_owner_pains | 50 / 16 / 1 | operator_profiles.user_id always null (no auth linkage). |

### Referenced in code but MISSING from the DB
- **`leads`** — drip-assistant.ts:804 tries it, warns, falls back (silently degrades every call). Migration exists, never applied.
- **`gbp_snapshots`** — the monthly gbp-snapshot cron inserts into it; table doesn't exist, so **every monthly run burns Google Places quota then fails all inserts** (the read error is silently swallowed).
- **`provider_events`** — named in ops checklists; zero code refs anywhere; does not exist. The real table is `listing_events`.

### Tables with ZERO code references (legacy/abandoned)
`listings` (0 rows — pre-providers schema with stripe_customer_id/subscription_tier columns from an old paid design), `operators` (0), `reviews` (0), `suggested_edits` (0), `pending_listings` (2 rows — **both are dev test fixtures from 2026-04-03**: "New IV Therapy Spot"/jane@example.com and "Elite Wellness IV Lounge"/(407) 555-9999).

### Test data in prod
providers and claim_requests are CLEAN (no E2E/ZZ/test@ rows — the e2e harness cleans up after itself). Only pending_listings carries the two April fixtures above.

---

## SECTION 3: AUTOMATIONS & JOBS

> **Summary:** 15 Vercel crons + 8 enabled Claude-desktop scheduled tasks + zero GitHub workflows (.github doesn't exist). Confirmed OFF: both outreach crons (PAUSED=true), onboarding autosend + day-7 nudge (gate false, provably holding), claim-reminder (double-dead). Confirmed ON: SEO crawl, reply/unsubscribe processors, ratings refresh, daily/weekly reports, flow-smoke. Two crons are silently broken (gbp-snapshot: missing table; backlink pair: dormant ~1 month). All desktop tasks only run while Hubert's Claude app is open — none had run for 2 days at inventory time.

### Vercel crons (all auth by CRON_SECRET; times UTC)
| Cron | Schedule | State | Last-ran evidence |
|---|---|---|---|
| seo-health (daily crawl) | 0 10 * * * | **ON** | seo_health_runs id=26, 2026-07-09 10:00, 913/913 URLs |
| seo-health-gsc (weekly digest) | Mon 00:00 | **ON** | no DB trace by design; fleet demonstrably firing |
| process-replies | every 2h | **ON** | cursor last_run_at 2026-07-09T22:00Z |
| process-unsubscribes | 0 12 * * * | **ON** | suppression row stamped 2026-07-07T12:00 |
| refresh-verified-ratings | 0 6 * * * | **ON** | rating_refresh timestamps 2026-07-09T06:00 on claimed rows |
| daily-report | 0 22 * * * | **ON** | read-only; email+Telegram |
| weekly-report | Sun 22:00 | **ON** | read-only; email+Telegram |
| flow-smoke | every 6h | **ON** | verified genuinely read-only (zero writes in route) |
| **daily-outreach** | 0 13 * * * | **OFF — PAUSED=true (line 45)**; fires, returns 0 drafts | no cron drafts since 2026-06-08 pause |
| **followup-outreach** | 0 14 * * * | **OFF — PAUSED=true (line 139)** | none since pause |
| onboarding-nudge (day-7) | 15:30 daily | **OFF — ONBOARDING_AUTOSEND=false**; provably holding | all 15 rows nudge_sent_at=null incl. rows >2 weeks old |
| claim-reminder | 16:00 daily | **OFF twice**: CLAIM_REMINDER_AUTOSEND=false AND reminder_sent_at column missing | zero reminders ever |
| **gbp-snapshot** | monthly 1st 05:00 | **ON but BROKEN**: gbp_snapshots table doesn't exist; run burns Places quota, all inserts fail, error swallowed | fired 2026-07-01 for nothing |
| **backlink-research** | 0 12 * * * | ON by config, **DORMANT** (likely 500s on missing ANTHROPIC_API_KEY) | newest row 2026-06-06 despite daily schedule |
| **backlink-drafts** | 13:30 daily | ON by config, **DORMANT** | newest draft 2026-05-31; 16 targets stuck at "researched" |

### Claude desktop scheduled tasks (run ONLY while the operator's app is open)
autopilot-morning (~6:15a), autopilot-evening (~6:15p), autopilot-seo-nightly (2:30a), autopilot-weekly-analyst (Sun 5p), seo-morning-triage (7:30a), ca-daily-claim-drafts (6:00a, 20 CA claim drafts/day), canada-seo-guardian (Mon 6a), one-time seo-gsc-measure-4wk (fires 2026-08-04). **All 8 enabled; none ran 2026-07-08 or 07-09 (app closed at trigger times)** — this is the platform's single biggest automation fragility: the "nightly" jobs actually fire whenever the app next opens.

### E2E test harness — production risk assessment
scripts/e2e-claim-flow.cjs (+ orphan/setup/finish siblings) run **against production**: they pick a REAL unclaimed provider, insert a real claim_request (test@thedripmap.com), POST prod /api/notify-operator (sends real emails every run), flip the real provider is_claimed=true via prod /verify-claim, then roll everything back in a `finally` block. Pollution vectors: a killed run leaves a real provider publicly claimed; the rollback deletes ALL onboarding_requests for the chosen provider_id; the orphan-flow variant creates (then deletes) a fake clinic live on the site. **Not scheduled anywhere; manual-run only.** Current DB is clean of leftovers.

### Not-a-cron live automation
Lead auto-forward (message-clinic, event-driven per lead) and SEND_5Q_WITH_CONFIRMATION (onboarding email rides the claim-verification confirmation — this is why owners get their questionnaire link instantly at verify).

---

## SECTION 4: EMAIL & MESSAGING

> **Summary:** One transport (Gmail SMTP primary, Resend fallback; src/lib/mailer.ts) + one draft channel (IMAP append to Gmail Drafts). Everything hardcodes `TheDripMap <info@thedripmap.com>`. Exactly 7 paths can email an external human without Hubert clicking send — all transactional/user-initiated (claim verify, verify confirmation+onboarding, lead auto-forward, finish-link resend, SEO-audit report, brand-voice kit, apply link). Cold outreach never auto-sends: even unpaused, the outreach crons are draft-only; the only true batch-send endpoint is operator-triggered and currently double-gated.

### The 7 auto-send paths (can email an outside human with no operator click)
1. `notify-operator` — claim verification email to the prospective owner (triggered by public claim form)
2. `verify-claim` + onboarding.ts — combined confirmation + 5-questions onboarding email at verify (SEND_5Q_WITH_CONFIRMATION=true)
3. `message-clinic` — patient lead/booking auto-forward to the claimed clinic (reply-to patient; checks BOTH suppression tables + forward_leads opt-out; carries a bespoke "reply UNSUBSCRIBE" line rather than the full CASL footer)
4. `resend-finish-link` — manage link to the on-file owner (only if entered email matches)
5. `seo-audit/lead` — audit report to whatever email the visitor typed
6. `brand-voice/lead` — copy kit to visitor's email
7. `brand-voice/apply` — magic apply link to the on-file claimed owner

All 7 omit the CASL footer — legitimate under transactional/requested-message carve-outs; each identifies TheDripMap + info@.

### CASL status
- Canonical CASL_FOOTER (identity + Caledon ON address + reply-unsubscribe) lives in src/lib/outreach-quality.ts and is present in all clinic outreach templates + the ca-daily-drafts scripts.
- **Gap worth knowing: the backlink-drafts cron's pitch templates (src/lib/backlink-templates.ts) contain NO unsubscribe/CASL language at all** — draft-only, but they're the one outbound marketing template that would leave with zero CASL text if sent verbatim.
- The gated onboarding nudge + claim reminder have no unsubscribe mechanism (re-check before ever flipping those gates).
- Legacy phase4 draft script's own comment admits its footer is no longer fully CASL-compliant (address stripped).

### Everything else
Internal-only auto-sends (to info@): operator notifications for claims/leads/finish-submissions/contact/subscribe/testimonials/upgrade-requests/kit orders + all report/alert crons. Draft-only paths: outreach crons (when unpaused), admin regenerate/queue endpoints, backlink drafts, ca-daily-drafts, all AUTOPILOT Gmail-MCP routines (the connected Gmail tooling structurally cannot send — no send tool exists). Operator-triggered real-send paths: admin/send-outreach-batch (double-gated by OUTREACH_DRAFTS_PAUSED=true; one call = up to 20 real sends), admin/send-email (**generic relay: arbitrary from/to/subject, no suppression checks — the only path where a non-info@ sender is possible**), admin/resend-verification, onboarding "Send now".

---

## SECTION 5: FLAGS, CONFIG & INTEGRATIONS

> **Summary:** 10 meaningful flags; everything outbound-marketing is OFF (5 separate gates), the two live automations are lead auto-forward and the verify-time onboarding email. .env.local contains exactly 4 vars (3 Supabase + Firecrawl); all other secrets live only in Vercel and cannot be inspected from the repo. Confirmed absent/unwired: GSC API key (weekly GSC report runs in stub mode), Groq (chat agent dark), Gemini SmartSummary (likely inert), Telegram (no-ops if unset), n8n and Twilio (zero code presence).

### Flags (current values read from source)
| Flag | Value | Effect |
|---|---|---|
| US_MARKET_ENABLED (market.ts:10) | **false** | Canada-first: US pages noindexed + out of sitemap; homepage/blog filtered to Canada. Reversible. |
| ENABLE_AUTO_FORWARD (message-clinic:22) | **true** | Lead auto-forward LIVE since 2026-06-25 (false = shadow mode). |
| SEND_5Q_WITH_CONFIRMATION (onboarding.ts:30) | **true** | Onboarding email merged into verify confirmation (operator-approved 2026-06-13). |
| ONBOARDING_AUTOSEND (onboarding.ts:23) | **false** | Standalone autosend + day-7 nudge closed. |
| PAUSED daily-outreach / followup | **true / true** | Outreach crons early-return. |
| OUTREACH_DRAFTS_PAUSED (outreach-config.ts:34) | **true** | Master pause across crons AND admin endpoints (added after the 2026-06-12 unattended-drafts incident). |
| OUTREACH_COUNTRY_FILTER | **['Canada']** | All outreach scoped to Canada. |
| CLAIM_REMINDER_AUTOSEND (claim-reminder.ts:17) | **false** | Reminder cron dry-run (also blocked by missing migration). |
| SERP_RANK_ENABLED (env) | unset | SERP checks inside the SEO-audit tool off. |
| GROQ_API_KEY presence gate (layout.tsx:187) | key unset | Drip Assistant widget never renders; self-restores when key added. |

### Integrations
- **Working:** Supabase (everything); Gmail SMTP via nodemailer (prod email sender) + IMAP (replies/drafts) with Resend as API fallback; Google Places (ratings refresh + enrichment); first-party analytics (/api/track); Mapbox/Google Maps (keys Vercel-side); Firecrawl (scripts-only, key local); IndexNow (script-driven pings, key file live); Anthropic API (brand-voice + seo-audit LLM; the backlink crons' dormancy suggests the key may be missing in Vercel — unverified).
- **Configured-but-dark:** Groq (full chat stack awaiting key); Gemini SmartSummary (client-exposed key pattern, likely unset); GA4 (gated on measurement ID); Telegram (graceful no-op if unset — daily/weekly reports reference it).
- **Wired in code, prod status unconfirmed:** GSC API (JWT auth ready; 2026-07-04 baseline was from a manual export, so live API access is doubtful).
- **Not integrations at all:** Outscraper (manual tool; CSV export script only), n8n (zero references), Twilio (zero code references; unused MCP connector only), Stripe (payment-link URL only, no SDK).

---

## SECTION 6: SAFETY & TRUST SURFACES

> **Summary:** The safety_verified badge has THREE coexisting truth models in the codebase (legacy 5-flag, operator-grant, questionnaire auto-grant), and the biggest single finding of this inventory: **since 2026-06-19 the badge AUTO-GRANTS when an owner submits the /finish safety section — two self-attested answers, no evidence, no operator review — directly contradicting CLAUDE.md's "flips ONLY via operator click".** Several templates overclaim: the treatment×city matrix calls merely-claimed clinics "Safety Verified" on every page, the SafetyChecker tool still describes a 5-check bar that no longer exists, and the About page asserts platform-wide standards nothing enforces.

### safety_verified WRITE paths (exhaustive)
1. **app/api/finish-listing/route.ts:258 — AUTO-GRANT.** Sets true whenever the safety section is complete; "complete" = `isSafetyComplete()` (src/lib/safety.ts:30-35) = team.whoPlaces non-empty AND team.oversight non-empty. Self-attested, two answers, triggered by any POST with a valid manage_token. The 2026-06-25 "badge bug fix" deliberately sets the badge FIRST so nothing can block it.
2. app/api/admin/onboarding-action/route.ts:131-146 — the documented operator path (flip via /admin/onboarding).
3. scripts/backfill-safety-verified.cjs — manual one-time backfill for the 2026-06-19 rule.
4. .audit-tmp one-offs — _bay-golive/_bay-flip (set true for Bay Wellness), _bay-revert (the ONLY unset path anywhere; product code never revokes a badge), plus a second backfill copy.
5. scripts/bay-wellness-safety-verified.cjs — STALE: writes a decision_drivers JSON key nothing reads.

**No re-verification, no expiry, no product-code revocation path exists.**

### Badge display: three conflicting models
- **Column model (canonical):** ProviderCard shield + sparkle, homepage featured shelf, quiz rank tier, claimed-page gold badge (requires ≥1 confirmed check to show), /api/safety-check.
- **Legacy 5-flag model:** ProviderCredentialBlock (unclaimed render path) shows "Safety Verified" only at 5/5 profile flags; drip-assistant search uses 5/5-on-featured while its single-provider lookup uses the column (internally inconsistent); SafetyChecker copy says the badge means "confirmed all 5 of our safety checks" — **no longer true**.
- **Conflation model:** ExploreCard gives ANY claimed clinic the same shield glyph; quiz results header labels matches "Verified clinics" when they're merely claimed/featured; and **the treatment×city matrix template prints "{n} claimed and Safety Verified" with counts computed from is_claimed/is_featured only — a templated overclaim on every matrix page.**

### Medical-compliance gate: four partial gates, no single one
(a) finish-listing `scrub()` regex-replaces cure/treat/heal/reverse in owner free text; (b) drip-assistant prompt-level hard rules (never diagnose/cure/invent) + a structured patient-screen safety matrix — no output filter verifies compliance; (c) quiz red-flags → amber "talk to your doctor" callout + safety-aware re-ranking (sorts, never hard-filters); (d) treatment-content.ts honest per-treatment safety fields. **No gate at all:** blog posts inserted via scripts go straight to the DB with zero claim scanning; scraped provider descriptions enter verbatim (including clinics' own "licensed medical professionals" marketing); nothing ever re-scans existing DB content. Scripted-content pre-flights historically checked only dashes — CLAUDE.md's own sleep-mode lessons record superlatives and "undefined" leaking past every automated check.

### Templated copy making claims about clinics (every instance found)
1. **About page "Our Standards"** (app/about/page.tsx:74-81): "Verified Medical Director Required / Licensed RN Administration Only / High Clinical Safety Standards / Verified Patient Reviews" — presented as platform standards over ~1,583 mostly unvetted scraped listings; nothing enforces them.
2. **Matrix template** "{n} claimed and Safety Verified" (iv-therapy/[treatment]/[city]/page.tsx:256,271) — counts from is_claimed; overclaim on every matrix page.
3. **SafetyChecker** ":158 confirmed all 5 of our safety checks (…insurance, state-board…)" — stale; insurance and regulator standing are never even asked in the current questionnaire.
4. **Quiz "Verified clinics" header** + ExploreCard shared shield glyph.
5. Provider-page SAFETY_CHECKS boilerplate — gated per attested check with per-clinic overrides (the best-behaved template).
6. **Card credential chips** ("Medically supervised" / "Physician-led" / "RN on staff") — regex inference over scraped text, applied to unclaimed unverified listings; "Medically supervised" fires on any non-empty team array.
7. **BlogBookingCTA** "Browse Safety Verified clinics in {city}" — templated onto blog posts for cities that may have zero badge-holders (only 8 exist platform-wide). *(Added by the assistant 2026-07-08 — see Section 7.)*
8. Blog checklist boilerplate ("Licensed medical staff… physician medical director on file") across ~15 script-inserted posts — framed as advice, lower risk.
9. **Onboarding email Template B**: "complete your safety questionnaire and we will review it and add your badge" — **no review happens; submit auto-grants.**
10. Owner follow-up template: "All five are required to earn the badge" — stale vs the two-answer auto-grant.
11. Backlink pitches: "Safety Verified credential filter" (sent to third-party sites); llms.txt + GuideByline + /for-clinics copy are the honest end of the spectrum.

---

## SECTION 7: DELTA REPORT — what the assistant built/changed without an item-by-item request, plus surprising states

> **Summary:** Standing authorizations existed (/goal directives, "proceed with your recommendations", "whatever you think is best", the autopilot doctrine, mission doctrine Lane A/B) — but Hubert never asked for these specific things by name. 217 commits landed in the last 30 days. This is full disclosure, no judgment.

### 7a. Assistant-initiated work (recent window, Jul 4–9)
1. **manage_token race-condition fix** (6d7a10a) — found via Janna's broken link; fixed, tested with a concurrency harness against a temp prod row, deployed same day.
2. **Allies logo applied twice** — fetched her wordmark from her website, uploaded to Supabase storage, set imageUrl (8f6ac88); then swapped to her square emblem when the wordmark looked wrong in the slot (4b0dfa9).
3. **Iron Infusion education content** rewritten Canada-first (CAD pricing, prescriber reality, 6 FAQs) and wired to ~160 matrix pages; **NAD+ page title** changed via titleName override (7276959) — under the /goal "fix all the seo issues without asking me for any permission".
4. **Two blog posts edited in the DB** (up-link blockquotes inserted into myers-cocktail-toronto and iv-therapy-yorkville-toronto; backup JSON committed).
5. **BlogBookingCTA component** added to every blog post (51d4ce8) — requested generically as option "b"; the copy includes the "Browse Safety Verified clinics in {city}" phrasing flagged in Section 6 item 7.
6. **City collision guard** (3169dbc) + DB data edits: bedford and richmond city rows given provinces; st-johns row renamed "St. John's"/NL.
7. **Crawler false-positive fix** (e976de4) — status-0 reclassified as crawl_timeout; alert email wording changed.
8. **7 suppression inserts** across both tables (1 unsubscribe: mobileivhomecare; 6 bounces incl. drkconrad, medspaoftampa, litemindbody) + providers flagged.
9. **Gmail actions in info@thedripmap.com**: ~109 threads archived + labeled into the folder taxonomy; **19 partnership drafts moved to Trash** (recoverable 30 days) so Drafts held only send-ready mail; 44 v2 outreach drafts created then 23 of them trashed as double-send risks; 11 Safety-Verified nudge drafts; Janna reply draft. All drafts-only; zero emails sent by the assistant.
10. **Blog meta trimmed** (161→154 chars) on one post; **stale duplicate pending claim_request deleted** (Allies).
11. **CLAUDE.md DB snapshot refreshed** to live numbers (5e98e27); SEO log entries appended.
12. **IndexNow pings** (13 URLs); **quiz ranking change** — safety_verified inserted as a rank tier (df854eb, under "proceed with your recommendations"); navbar/logo mobile sizing; Canada-first copy sweeps (4d2ea21, 86b3ed4 — the About-page fix was requested; the sweep across /deals /blog /cities /states + Terms/Privacy reorder was extrapolated).

### 7b. Earlier autonomous eras (visible in git, disclosed here because Hubert may not know)
13. **Featured monetization mechanics shipped Jun 15-16** (ed4423b "Featured = top-3 match placement + Featured label"; c2ac797 "View more clinics expander (Featured top-3 scarcity)") **and the live $99/mo /for-clinics/upgrade page — despite the recorded 2026-05-27 standing decision "pricing hidden until further notice… don't reintroduce without explicit approval."** Approval status unclear from available history; flagged for an explicit operator decision.
14. **The 2026-06-19 badge auto-grant rule itself** (finish-listing sets safety_verified on questionnaire submit) + the backfill script — this is the Section 6 headline; CLAUDE.md was never updated and still documents operator-only flips.
15. **Drip Assistant + white-label Clinic Agent** — an entire AI chat product built and then hidden behind a missing key.
16. Funnel-hardening 4-pack (reminder cron, badge-forward emails, resend-link page, completeness meter); two new blog guides published; llms.txt AI-citation file; manage_token/email public-HTML leak fix; CWV SSR slice; treatment-alias 301s; 25 overnight city pages (Jun 10-11, 24 had the undefined bug — documented in CLAUDE.md).
17. **E2E harness runs against production** (real claim emails to test@ + operator every run; real provider temporarily flipped claimed). Clean today, but the pattern is live.

### 7c. Inconsistent / surprising states (found by this inventory)
- Homepage/search/About headline "1,583+ Verified Clinics" while 8 clinics hold the badge and 22 are claimed ("verified" = data-verified, not badge-verified; city pages deliberately dropped this word 2026-05-31 — homepage/search didn't).
- inquiries.forward_status never recorded despite auto-forward live 14 days (0 eligible leads, or silent recording gap).
- gbp-snapshot cron burning Places quota monthly into a missing table; backlink crons dormant ~1 month; outbound_message_log stale since Jun 12 with always-null key columns.
- CLAUDE.md drift: WS6 SQL listed "pending paste" but tables exist; "3 pending claims" vs 1 real; 1,478/13/5-hidden vs live 1,583/22/14-hidden.
- 14 hidden providers with hide reasons recorded nowhere.
- 77 Canadian active providers with NULL email (outreach ceiling); ~680 providers share one Unsplash stock photo in imageUrl; only 17 real logos.
- drip-tonic-toronto: is_claimed=true, no verified claim_request on file, owner email on the suppression list.
- /api/audit public debug endpoint; two April test fixtures in pending_listings; desktop "nightly" automations 2 days stale because the app was closed.
- 0 booking requests and 0 testimonials and 0 featured-waitlist signups since those features shipped.

---

## TOP 10 — the most important things Hubert probably doesn't know about his own platform

1. **Your Safety Verified badge auto-grants itself.** Since 2026-06-19, any owner who answers two self-attested questions on /finish gets the badge instantly — no evidence, no review, no operator click. Your own docs, your SafetyChecker tool, your onboarding emails, and your admin flow all still describe a review that doesn't happen. This is the trust asset your whole strategy leans on.
2. **Every treatment×city page calls merely-claimed clinics "Safety Verified."** The matrix template counts is_claimed/is_featured and prints "{n} claimed and Safety Verified" — a systematic overclaim across ~160 indexable pages.
3. **You are selling Featured at $99/mo right now.** /for-clinics/upgrade is live, priced, and linked from every claimed non-featured listing — despite your recorded "pricing hidden until further notice" decision. Either the decision changed or the page shouldn't be linked; today both are true.
4. **A complete AI chat product is sitting dark in production.** Drip Assistant + a white-label clinic-agent embed (demo page, install page, embed script) are fully built; one missing GROQ_API_KEY keeps all of it returning 503.
5. **Two of your 15 crons are silently broken.** gbp-snapshot burns Google Places quota monthly inserting into a table that doesn't exist; the backlink research/drafts pair has produced nothing since early June (likely a missing Anthropic key in Vercel) — no alert fires for either.
6. **Your "nightly" automation isn't nightly.** All 8 desktop scheduled tasks (morning triage, CA drafts, SEO nightly, weekly analyst…) only run while your Claude app is open — none ran the last 2 days. The Vercel crons are the only automation that always fires.
7. **Seven email paths can auto-send without you** — all transactional (claim verify, verify+onboarding, lead forward, link resend, two tool reports, apply link). Cold outreach structurally cannot auto-send (5 separate gates + draft-only design). Know the boundary; it's currently drawn correctly.
8. **The About page promises standards you don't enforce** ("Verified Medical Director Required", "Licensed RN Administration Only") over 1,583 mostly scraped listings, and card chips infer "Medically supervised" from scraped text on unverified clinics. Legal/trust exposure hiding in boilerplate.
9. **Dead weight is accumulating:** a public debug endpoint dumping provider data (/api/audit), 5 legacy tables (one with old Stripe columns), 8 never-imported components, test fixtures in prod, three features with zero usage ever (testimonials, featured waitlist, kit orders), and a 130-post blog whose newer posts were script-inserted with no compliance scanning.
10. **The assistant has been operating at ~217 commits/30 days under standing authorizations** — including DB edits, Gmail management, and the fixes/features in Section 7a. Everything is disclosed above; if any of it oversteps what you intended, Section 7 is the checklist to walk.

*End of inventory. Read-only: no fixes were made during compilation.*
