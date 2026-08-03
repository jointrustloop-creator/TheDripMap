# City Rescue Treatment (Toronto v1, 2026-08)

The upgrade applied to /cities/toronto to attack "iv therapy toronto" (position ~76
at the time). Calgary and Vancouver are the approved fast-followers, each as its
own PR. No cities beyond these three; the kill-list holds.

## The treatment (what Toronto got)

1. **Canonical consolidation.** Every blog roundup competing for the head term
   canonicals to the city hub. Toronto had three competitors; two were already
   consolidated, `iv-therapy-toronto-complete-guide` was the miss (fixed in the
   Toronto PR via BLOG_CANONICAL_OVERRIDES). Long-tail posts (nad-toronto,
   hangover-toronto, yorkville) keep self-canonicals: different intent.
2. **Answer-first block** directly under the H1: one snippet-ready paragraph with
   live counts, price-index low/median/high, review average, mobile count. All
   figures computed at render, nothing hardcoded.
3. **Full price table on the city page** (not just the headline median): per
   treatment low/median/high + contributing-clinic counts, methodology note,
   snapshot date, and Dataset JSON-LD. Gated on a published Price Index snapshot.
4. **Neighborhood coverage block** with live per-city counts + internal links
   (Toronto: the 9 GTA cities). Pushes authority through the hub-and-spoke.
5. **Data-driven FAQ pricing answer**: the FAQPage cost answer uses the real
   Price Index figures wherever a snapshot exists.
6. **Compliance fix**: the city snapshot no longer conflates Claimed with Safety
   Verified (independent badges, reported separately).

## Fast-follower checklist: Calgary (PR 2)

- [x] Price Index snapshot exists (6 clinics, 3 treatments, June 2026) — the
      table + Dataset schema + FAQ answer light up automatically (data-gated).
- [ ] Canonical audit: grep blog slugs/titles for "calgary"; any head-term
      roundup (`best-iv-therapy-calgary-2026` is already consolidated) that
      self-canonicals gets an override.
- [ ] Neighborhood block: Airdrie, Cochrane, Okotoks, Chestermere counts — add a
      Calgary-gated block only if >=3 of those have listings; otherwise skip
      (NearbyCities already covers it).
- [ ] Refresh the Calgary price collection (3 rows is thin; a re-run should
      reach more treatments before we brag about the table).

## Fast-follower checklist: Vancouver (PR 3)

- [ ] BLOCKER: no Price Index snapshot yet. Run the price collection for
      Vancouver first (scripts/price-index/build-city.cjs vancouver); the page
      modules are data-gated and render automatically once the snapshot lands
      with >=3 clinics per treatment.
- [ ] Canonical audit: `best-iv-therapy-vancouver-2026` already consolidated;
      check for other head-term Vancouver posts.
- [ ] Neighborhood block: North Vancouver, Burnaby, Richmond, Surrey, West
      Vancouver, Langley counts (all have listings; likely qualifies).

## Measurement

GSC named group: /cities/toronto + /cities/calgary + /cities/vancouver.
Baseline (2026-08): "iv therapy toronto" pos ~76, city page CTR 0.41%.
Check at +4 weeks after each PR deploys.
