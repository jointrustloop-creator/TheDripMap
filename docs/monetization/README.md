# TheDripMap Monetization Playbook (activated 2026-08-07, "go on all")

Operator approved all lanes on 2026-08-07, explicitly lifting the 2026-05-27
pricing-hidden rule for Featured sales (private pitches first; public pricing
pages are a separate, later decision). Goal: $10K/mo by Nov 20, 2026.

## Lane 1 — Founding Featured (live, pitching)

- Product: pinned top-3 placement on the clinic's city page + homepage featured
  row + Featured label. Max 3 Featured per city (scarcity is real).
- FOUNDING RATE: $49/mo, locked for as long as the clinic keeps it,
  first 10 claimed clinics only. Regular rate after: $99/mo.
- No contract, cancel anytime. The free listing stays free forever regardless.
- Payment v1: invoice + Interac e-transfer (no Stripe needed to start).
- Flip `is_featured=true` on YES + payment. FEATURED_UPGRADE_ENABLED stays as-is
  until a self-serve flow is wanted.
- Grandfathered featured (Bay Wellness, Diamond, Signature x2, Blue Cypress,
  Refresh LA): stay free for now; revisit after first 10 founding sales.
- Pitched 2026-08-07 (top 8 by 90d engagement): Bar Beauty, Erin Mills, DRS
  Mobile, Knead, Nature's Touch, Tri-Health, Vida+Flow, UNITY. Remaining claimed
  clinics get pitched as their stats grow (engine surfaces them).

## Lane 2 — The Drip Sheet (B2B trade newsletter + sponsors)

- Audience: Canadian IV clinic operators (database: 1,100+ business emails,
  same CASL implied-consent basis + unsubscribe as all outreach).
- Cadence: 2x/month. One sponsor slot per issue: $250-500.
- Assets: issue #0 draft + sponsor kit in this folder. Supplier prospect list
  in drip-sheet-prospects.md (real, verified companies only).

## Lane 3 — Founder funnel (open-an-IV-clinic) -> referral fees

- Page: /for-clinics/open-a-clinic (built 2026-08-07), captures leads into
  inquiries with [FOUNDER-LEAD] tag; surfaced in daily report.
- Monetization: refer to medical directors / ND consultants / compounding
  pharmacies at $500-1,500 per successful match. Partners TBD (Drip Sheet
  sponsors are the natural pool).

## Lane 4 — Get Found Kit ($149 one-time)

- Productized listing optimization: personalized audit + Google Business
  checklist + drip-menu copy pass. Generated largely by existing tooling
  (admin generate-get-found-kit + /tools/seo-audit).
- Offer at claim time + to claimed clinics. Definition: get-found-kit.md.

## Lane 5 — US Featured (parked)

- Do NOT pitch US until CA proves the price point (operator decision).
- When opened: same playbook, $99+ from day one, US clinics expect to pay.

## Revenue model (honest)

- Featured: 8 pitched -> expect 2-4 founding yes = $98-196 MRR now, path to
  $1-2K as claims grow + rate normalizes to $99.
- Drip Sheet: first sponsor = $500-1,000/mo at 2 issues.
- Referrals: 1-2/mo = $1-3K lumpy.
- Kits: 2-5/mo = $300-750.
- Target $3-6K/mo by October; SEO compounding + US unlock close the rest.
