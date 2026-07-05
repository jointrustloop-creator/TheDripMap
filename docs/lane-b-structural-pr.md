# Lane B structural PR: ready for your review

**Branch:** `structural/seo-eeat-foundation` (commit 4c7a755)
**Create the PR here (one click, body below is ready to paste):**
https://github.com/jointrustloop-creator/TheDripMap/compare/main...structural/seo-eeat-foundation

Vercel builds a preview automatically for the branch; the preview link appears
on the PR / in your Vercel dashboard once you open it.

**What to look at in the preview:**
1. Any guide, e.g. `/guide/iv-therapy-memberships-packages-canada`: byline row
   under the H1 (author, updated date, "How we verify clinics"), and the
   "About this guide" methodology box after the FAQ.
2. `/cities/toronto`: breadcrumb reads Home / Canada / Ontario / Toronto, and a
   new "IV therapy guides for Toronto patients" block near the bottom.
3. `/providers/bay-wellness-centre-vancouver` (claimed) and
   `/providers/drip-lounge-surrey` (unclaimed): breadcrumb reads
   Home / Canada / British Columbia / City / Clinic.
4. `/about`: new "How We Verify Clinics" section (the #how-we-verify anchor
   every guide links to).

---

## Ready-to-paste PR body

Title: `structural: E-E-A-T components, geo breadcrumbs, internal-link modules (Lane B)`

This is the Lane B structural foundation for the category-ownership mission.
Template and component layer only; no content rewrites, no new pages except a
section added to /about.

### E-E-A-T (guides)
- New `GuideByline` component: visible author byline, medical-reviewer slot
  (renders only when a reviewer is set), visible last-updated date, and a
  "How we verify clinics" link on every guide.
- New `MethodologyNote` footer block on every guide: independent matching
  platform statement, methodology link, no-medical-advice line.
- `Guide` interface gains `author` / `lastUpdated` / `reviewedBy`; all 7 guides
  stamped with honest dates from their content commits.
- Article JSON-LD now carries author name, `dateModified`, and `reviewedBy`.
- New `/about#how-we-verify` methodology section, the trust reference the
  whole site links to.

### Geo breadcrumbs + schema dedupe
- Canadian city pages: Home / Canada / Province / City (links `/canada` and the
  province page). Canadian provider pages: same trail plus the clinic.
- Bug fixed along the way: every provider page was emitting TWO INCONSISTENT
  BreadcrumbList schemas (a hand-rolled one saying Home/Cities/... and the
  BreadcrumbNav one saying Home/IV Therapy/...). Now exactly one per page,
  always matching the visible trail.
- Claimed listings previously had breadcrumb schema but NO visible breadcrumb;
  they now render one above the hero.

### Internal-link modules
- New `RelatedGuides` component on Canadian city pages: guides that name the
  city rank first, and the module links `/canada`, so Canadian authority flows
  hub-and-spoke between the guide cluster and the geo cluster.

### Verification done before opening this PR
- All four render paths checked on a dev server (guide, city, unclaimed
  provider, claimed provider): exactly 1 BreadcrumbList each, exactly 1 H1
  each, byline/methodology render, Canada + province links resolve.
- Server components only, zero client JS added, fixed-height byline row
  (no layout shift).
- esbuild syntax checks pass on all 7 touched files.

### Files
- new: `src/components/GuideByline.tsx`, `src/components/RelatedGuides.tsx`
- modified: `src/lib/guides.ts`, `app/guide/[slug]/page.tsx`,
  `app/cities/[slug]/page.tsx`, `app/providers/[slug]/page.tsx`,
  `app/about/page.tsx`

Once merged, Lane A begins Layer 2 (guide upgrades) and Layer 3 (city pages)
in city-tier order under the existing autopilot cadence.
