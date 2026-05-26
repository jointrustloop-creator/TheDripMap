# TheDripMap — Status Report (2026-05-26)

Generated against live Supabase + current codebase + live prod.

---

## 1. DATABASE STATE

### Providers
- **Total active providers:** 771 (`availability != false`)
- **Claimed listings (`is_featured = true`):** 3
  - `signature-beauty-lounge-richmond-hill` — Richmond Hill, Canada
  - `signature-beauty-lounge-downtown-toronto` — Toronto, Canada
  - `blue-cypress-iv-and-wellness-georgetown` — Georgetown, US

### Top 20 states/provinces by provider count
| Count | State / Country |
|---|---|
| 156 | California, US |
| 60  | Texas, US |
| 55  | New York, US |
| 55  | Florida, US |
| 46  | ON (Canada — abbr) |
| 42  | New Jersey, US |
| 35  | Alabama, US |
| 28  | Virginia, US |
| 23  | Illinois, US |
| 23  | Alberta, Canada |
| 18  | Kentucky, US |
| 16  | Washington, US |
| 15  | District Of Columbia, US |
| 15  | Nevada, US |
| 13  | Ontario, Canada (full name — dupes ON above) |
| 13  | British Columbia, Canada |
| 12  | Missouri, US |
| 12  | Wisconsin, US |
| 12  | Manitoba, Canada |
| 11  | Arkansas, US |

⚠️ Ontario is split between `ON` and `Ontario` values — should normalise.

### Other tables
| Table | Rows |
|---|---|
| `cities` | 305 total, 96 with `listings_count > 0` |
| `blog_posts` | 92 |
| `claim_requests` | 0 (UI submissions write here; route file doesn't) |
| `inquiries` | **1,387** (contact / message-clinic / subscribe) |
| `testimonials` | 0 |

⚠️ `inquiries` count is suspiciously high — likely contains stale test data from earlier debugging sessions. Worth auditing for real-vs-test split.

---

## 2. CODEBASE STATE

### Pages (35 routes)

| Section | Routes |
|---|---|
| Top-level | `/`, `/about`, `/contact`, `/privacy`, `/terms`, `/quiz`, `/search`, `/cities`, `/blog`, `/treatments`, `/symptoms`, `/states`, `/guide`, `/for-clinics`, `/iv-therapy-statistics`, `/iv-therapy-for`, `/compare`, `/verify-claim` |
| Dynamic | `/providers/[slug]`, `/cities/[slug]`, `/blog/[slug]`, `/treatments/[service]`, `/symptoms/[slug]`, `/states/[state]`, `/guide/[slug]`, `/iv-therapy-for/[slug]` |
| Alt SEO | `/iv-therapy/[state]`, `/iv-therapy/[state]/[city]`, `/iv-therapy/treatment/[service]` |
| Quiz | `/quiz`, `/quiz/results` |
| For-clinics | `/for-clinics`, `/for-clinics/setup`, `/for-clinics/success` |
| Admin | `/admin/login`, `/admin/testimonials` |
| Misc | `/dashboard` |

### API routes (13)
| Route | Purpose |
|---|---|
| `/api/contact` | contact form (writes to `inquiries`, emails) |
| `/api/message-clinic` | "Message This Clinic" button (writes to `inquiries`, emails) |
| `/api/notify-operator` | claim listing (emails owner + admin) |
| `/api/subscribe` | email-capture popup (writes to `inquiries`, emails) |
| `/api/testimonials/submit` | patient testimonial (writes to `testimonials`, emails) |
| `/api/testimonials/moderate` | one-click approve/reject from email |
| `/api/admin/login` | password → cookie |
| `/api/admin/logout` | clears cookie |
| `/api/admin/testimonials` | admin moderation actions |
| `/api/admin/resend-email` | Resend delivery-status diagnostic (admin-only) |
| `/api/admin/clean-blog` | (legacy) |
| `/api/audit` | (legacy) |
| `/api/revalidate` | on-demand ISR revalidation (needs `REVALIDATE_SECRET`) |

### Components
- **54 React components** in `src/components/` (cards, modals, navbars, listing controllers, etc.)

### Scripts (60+ files in `scripts/`)
Highlights: `db.js`, `assign-blog-images.js`, `audit-blog-links.js`, `geocode-missing-coords.js`, `submit-to-indexnow.js`, `link-operator-profiles.js`, `create-testimonials-table.sql`, `fix-inquiries-fk.sql`, plus 14 historical `enrich-*` / `insert-cluster-*` / `canada-providers-*.json` scripts.

### Environment variables (locally in `.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

(On Vercel additionally — per recent setup —`RESEND_API_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PASSWORD`. Missing: `REVALIDATE_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.)

### Recent commits (last 20)
| Commit | Date | Subject |
|---|---|---|
| c8b2fd9 | 2026-05-25 | Fix straggler: notify-operator FROM swap |
| b4c33b9 | 2026-05-25 | Email FROM: info@ → notifications@ |
| c1b3b76 | 2026-05-25 | Admin Resend diagnostic endpoint |
| 4e5d89e | 2026-05-25 | Logo bump h-14 md:h-16 |
| c5a420e | 2026-05-25 | NAD+ card image swap |
| 9de7cf1 | 2026-05-25 | Treatments index: image-bg cards |
| 0829420 | 2026-05-25 | Fix MapPin import (build fix) |
| 78a19f8 | 2026-05-25 | Search: auto-broaden to nationwide |
| df3c457 | 2026-05-25 | City pages: broaden to state + nationwide |
| 05b1eec | 2026-05-25 | Treatment pages: broaden to nationwide |
| 295b16f | 2026-05-25 | People-first hero images |
| ed4144e | 2026-05-25 | Blog cross-link footer |
| 82f9b49 | 2026-05-25 | Cities cross-link section |
| 336c8c0 | 2026-05-25 | Guide → Treatments cross-link |
| 4d27d25 | 2026-05-25 | /treatments index + nav swap |
| 5dc4b51 | 2026-05-25 | Surface /guide section |
| 266cb3c | 2026-05-25 | Search filter count bug fix |
| cd8af5d | 2026-05-25 | Header redesign — shrink logo, tighten nav |
| 178b082 | 2026-05-25 | Remove Unsplash attribution |
| 560680e | 2026-05-25 | Revert broken Unsplash URLs |

---

## 3. SEO STATE

### sitemap.ts generates
- `/`, `/search`, `/cities`, `/states`, `/guide`, `/quiz`, `/blog`, `/about`, `/for-clinics`, `/contact`, `/symptoms`, `/iv-therapy-statistics` (12 static)
- `/symptoms/{15 use-cases}`
- `/states/{6}` — florida, new-york, texas, california, virginia, ontario
- `/guide/{5}` — how-to-choose, cost-guide, vs-oral, first-time, mobile-vs-clinic
- `/cities/{96}` — only cities with `listings_count > 0`
- `/providers/{771}` — all active providers
- `/blog/{92}` — all posts

**Total sitemap entries:** ~1,007

### robots.txt (live)
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: https://www.thedripmap.com/sitemap.xml
```

### Hardcoded slug sets
| Type | Slugs |
|---|---|
| Treatments (10) | nad-plus, hangover, immune-support, beauty-glow, weight-loss, hydration, recovery, myers-cocktail, jet-lag, energy-boost (+ aliases: nad-plus-therapy, hangover-recovery, athletic-recovery, nad) |
| States (6) | florida, new-york, texas, california, virginia, ontario |
| Guides (5) | how-to-choose-iv-therapy-clinic, iv-therapy-cost-guide, iv-therapy-vs-oral-supplements, first-time-iv-therapy-what-to-expect, mobile-iv-therapy-vs-clinic |
| Symptoms / Use-cases (15) | hangover, jet-lag, fatigue, cold-and-flu, sports-recovery, migraine, weight-loss, skin-glow, stress, stomach-flu, immunity, morning-sickness, event-prep, dehydration, brain-fog |

---

## 4. CONTENT STATE

### Blog posts by category
| Count | Category |
|---|---|
| 25 | City Guides |
| 20 | Educational |
| 16 | IV Therapy |
| 13 | Treatment Guides |
| 6  | Cost & Insurance |
| 5  | Lifestyle & Wellness |
| 4  | Conditions & Symptoms |
| 1  | Use-Case |
| 1  | Guides |
| 1  | GUIDE |

⚠️ Three near-duplicate categories ("Guides", "GUIDE", "Educational") should be merged.

### City guide posts (22 of 25)
atlanta, boston, calgary, chicago, dallas, denver, edmonton, houston, las-vegas, los-angeles, miami, montreal, new-york, ottawa, philadelphia, phoenix, san-diego, san-francisco, seattle, toronto, vancouver, washington-dc

### Treatment guide posts (sample)
biotin, glutathione-benefits, glutathione-toronto, high-dose-vitamin-c, how-much-does-nad-plus-cost, iron, magnesium, myers (×4 variants), nad-plus-longevity, ozone, saline-at-home, vitamin-b12-deficiency, vitamin-c-guide

### Comparison / cost guides
how-much-does-iv-therapy-cost, hsa-fsa-iv-therapy-reimbursement, iv-therapy-insurance-coverage-canada, iv-therapy-insurance-coverage-united-states, iv-therapy-insurance-ontario, mobile-iv-vs-in-clinic-comparison, iv-therapy-vs-iv-vitamin-shots-explained, iv-therapy-vs-emergency-room-when-to-choose, b12-iv-vs-b12-injection-comparison

---

## 5. INTEGRATIONS

### Third-party services
| Service | Status | Notes |
|---|---|---|
| **Supabase** | ✅ live | DB + storage + auth. Service role key works both locally and on Vercel |
| **Resend** | ✅ live (sending) | Domain `thedripmap.com` verified. ⚠️ Receiving at `info@thedripmap.com` is broken (Workspace setup pending) |
| **Vercel** | ✅ live | Hosting + DNS for thedripmap.com (nameservers: ns1/ns2.vercel-dns.com) |
| **Google Workspace** | ⚠️ partial | MX points at Google. `info@` send works but receive doesn't — Gmail activation pending |
| **IndexNow** | ✅ deployed | Key file at `/185967dfe967397d54c61634cf10e4b4.txt`, 1138 URLs submitted to Bing |
| **Mapbox** | ✅ live | `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` on Vercel. Used by MapboxListingMap + SplitListingView |
| **Telegram** | ❌ not configured | `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` not set. notify-operator route degrades gracefully |
| **GA4** | ✅ live | `NEXT_PUBLIC_GA_MEASUREMENT_ID` is `G-4VCL3LPKYZ` (per earlier HTML inspection) |

### MCP servers available
- claude_ai_Gmail (auth required, not yet authed)
- claude_ai_Google_Calendar (not authed)
- claude_ai_Google_Drive (not authed)
- claude_ai_Supabase (not authed — direct supabase-js used instead)
- claude_ai_Twilio, Superhuman, CoCounsel (unused)

### Scripts as automations
~60 one-shot scripts in `scripts/` — most are import / enrichment / audit utilities. `db.js` is the everyday DB shell. `audit-blog-links.js` is re-runnable.

---

## 6. GOAL TRACKING (GOAL.md)

### Target
**$10,000/month by November 20, 2026** — 100 paying clinics × $100/mo avg.

### Monthly milestones
| Date | Target | Current |
|---|---|---|
| **June 1** | 5 paying | 0 ⚠️ |
| July 1 | 15 paying | — |
| Aug 1 | 30 paying | — |
| Sep 1 | 50 paying | — |
| Oct 1 | 75 paying | — |
| Nov 20 | 100 paying | — |

### Outreach status
- Mechelle (Blue Cypress) — info@bluecypressky.com — **not yet sent**
- Eva (Signature Beauty Lounge) — info@signaturebeautylounge.ca — **not yet sent**
- Top 20 unclaimed (drafts in `scripts/outreach-drafts.md`) — **not yet sent**

### Backlink checklist (from GOAL.md — all unchecked)
- [ ] Yelp for Business
- [ ] Foursquare
- [ ] Crunchbase
- [ ] BBB
- [ ] Manta
- [ ] YellowPages.ca
- [ ] AlternativeTo
- [ ] Wellness.com
- [ ] Hotfrog
- [ ] SaaSHub

(`scripts/directory-submission-quick-fills.md` has pre-filled copy ready for each.)

---

## 7. DESIGN STATUS

### Tier 1 (5 quick wins) — ✅ done
Tasks #20 — all shipped.

### Tier 2 (6 wins, A-F) — ✅ done
Tasks #21-26 — all shipped.

### Tier 3 (4 big moves) — ✅ done, 1 deferred
- Sticky claim rail ✅
- Per-city ROI calculator ✅
- Shareable quiz result controls ✅
- **Map-first city page layout — DEFERRED** (biggest scope)

### Major redesigns shipped (later)
- Claimed provider page — magazine hero, sticky right-rail, drip menu (#33-35)
- Operator profile linkage + "in their words" pull-quote (#42)
- 6 Tier 1-2 conversion improvements (contact form, message clinic, treatment→city, email capture, compare flow) (#43)
- Patient testimonial submission flow (#44)
- Admin moderation page + rating aggregation (#45)
- Quiz redesign — symptoms + safety pre-screen + plan-first results (#46)

### Today's work (2026-05-25 / 2026-05-26)
- Header redesign — logo size + nav wrap fix
- Search filter count display bug fix
- `/guide` index redesign + nav/footer surfacing
- `/treatments` new index + nav swap + footer overhaul
- `/cities` gradient cards redesign (photos deferred — sub-agent fabricated URLs)
- 4 hub cross-link sections (cities, treatments, guide, blog ↔ each other + quiz)
- People-first hero images
- Zero-result fallback on all 3 listing pages (treatments / cities / search)
- Treatments cards now image-backgrounds
- Email FROM swap `info@` → `notifications@` to defeat Gmail self-spoof drop

### Pending design moves
- Map-first city page layout (Tier 3 #4 deferred)
- Surface `/iv-therapy-for/` or redirect to `/symptoms/` (currently duplicate URL pattern)

---

## Top action items (sorted by impact on $10k goal)

1. **Fix Workspace Gmail receiving** at `info@thedripmap.com` so leads land somewhere checkable. Without this, every form submission is invisible.
2. **Send Mechelle + Eva outreach** (their drafts are ready in `scripts/outreach-drafts.md`).
3. **Submit to 6 high-DA directories** (`scripts/directory-submission-quick-fills.md` has copy-paste ready).
4. **Audit & clean `inquiries` table** — 1,387 rows is way more than expected for the traffic level. Probably stale test data masking real leads.
5. **Run `scripts/fix-inquiries-fk.sql`** to repoint Message This Clinic's `listing_id` FK at `providers` (lets us track per-clinic lead volume).
6. **Add `REVALIDATE_SECRET` to Vercel** so future DB-only changes can bust ISR cache without polling.
