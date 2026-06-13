# Home + /for-clinics Copy and SEO/AI-Engine Audit

Date: 2026-06-12. Status: proposal, nothing changed. Companion to the chat
summary. Execute on a branch as PR #5 after operator approval.

## Verdict
The design language is genuinely strong and the safety positioning (Earned,
never bought) is a real differentiator. The gaps are: (1) zero
machine-quotable copy for AI engines, (2) a meta title that truncates,
(3) /for-clinics runs on unverifiable hardcoded numbers when we now have
real, honest ones, and (4) two retired-flow CTAs still live on /for-clinics.

## HOME PAGE

### Keep (it works)
- H1 "Find the right IV therapy clinic." with serif accent: clean, on-intent.
- The Safety Verified manifesto section: best copy on the site, strong
  E-E-A-T, honest disclaimer line.
- Internal-link architecture: treatments, situations, cities, guides, blog.
- Site-wide WebSite + Organization JSON-LD with consistent naming.

### Fix 1: meta title truncates (HIGH)
Current (89 chars): IV Therapy Clinics Near Me - Find and Compare 1,478+
Providers | The Drip Map
Proposed (59 chars): IV Therapy Near Me: Compare 1,478+ Verified Clinics |
The Drip Map
(keep dynamic count; "Verified" is our differentiator and a CTR word)

### Fix 2: no FAQ block or FAQPage schema (HIGH, the AI-engine win)
AI engines (and Google AI Overviews) cite pages with extractable
question-answer copy. Phase 0 research already gives us the top patient
questions. Add a compact "Before you book" FAQ section (6 questions) above
the footer + FAQPage JSON-LD:
1. How much does IV therapy cost? (typical $100-400 band by drip, Canada
   anchors Vancouver $120-350 / Calgary $150-200 / Toronto $190-399, link
   cost guide)
2. Is IV therapy safe? (safe when administered by licensed clinicians with
   medical oversight; what Safety Verified checks; link guide)
3. Who should administer an IV drip? (RN/NP/ND with IV authorization;
   regulator names per region)
4. How long does a session take? (30-60 min typical, NAD+ longer)
5. Does insurance cover IV therapy? (Canada: extended health naturopathic
   benefit when ND-administered; US: HSA/FSA sometimes; link insurance post)
6. How do I find a good IV clinic near me? (the match quiz + what to check)
Every answer: 2-3 plain sentences, generic cost framing, no medical claims.

### Fix 3: add one answer-first paragraph near the hero (MEDIUM)
A single indexable sentence block AI engines can lift:
"The Drip Map is North America's IV therapy matching platform. We list
{N} clinics across {M} cities in the US and Canada, verify safety
practices in writing, and match you to the right clinic and drip in under
60 seconds."

### Fix 4: llms.txt (LOW, cheap)
public/llms.txt describing the site, key URLs (search, cities, treatments,
guides), and the data we hold. Emerging convention; zero risk.

## /FOR-CLINICS PAGE

### Fix 5: unverifiable hardcoded stats (HIGH, trust + staleness risk)
- "19,700 monthly patient searches": hardcoded, unsourced.
- "+83% week-over-week search growth": hardcoded; cannot stay true.
- "Canadian markets converting at 12.5x the US rate": hardcoded; the code
  comment elsewhere says 16x; pick none.
Replace the strip with live-DB numbers + one honest measured claim:
clinics listed (live), cities (live), claimed clinics (live), and:
"On our own measured traffic, listings with real prices and named
practitioners get many times more patient clicks than bare ones."

### Fix 6: meta description superlative + wrong scope (HIGH)
Current: "Join the nation's #1 IV therapy matching platform..."
- "nation's" is wrong (US + Canada), "#1" is unverifiable.
Proposed: "Claim your free listing on North America's IV therapy matching
platform. {N}+ clinics listed. Add your drips, prices, team, and photos,
and reach patients searching in your city."

### Fix 7: retired-flow CTAs still live (DECISION NEEDED)
- Featured-waitlist block (WAITLIST flow retired per operator).
- "Run free SEO audit" block (SEO Audit lead-gen on the retired list).
Options: remove both blocks, or keep until the flows are formally killed.
Recommend: remove the waitlist block (conflicts with pricing-hidden
posture), keep the SEO audit block only if the tool still works.

### Fix 8: benefit-card copy (MEDIUM)
"SEO Dominance ... boost your own clinical presence online" is vague.
Proposed three cards:
- Patients, not impressions: "High-intent patients comparing IV clinics in
  your city. Your listing is where they decide."
- Your page, complete: "Drip menu with your real prices, your team and
  credentials, photos, hours, booking link. We build it with you."
- The Safety Verified badge: "Answer our safety questionnaire and earn the
  badge patients filter by. Never sold, only earned."

### Fix 9: FAQPage schema for clinic owners (MEDIUM)
6 questions: Is it free? (yes) What does claiming change? How do I earn
Safety Verified? Can I update prices? How do patients contact me? How do I
remove my listing? Plus FAQPage JSON-LD.

## Execution
One branch (copy-seo-home-forclinics), PR #5: metadata changes, FAQ
sections + schema on both pages, stat-strip replacement with live queries,
benefit-card rewrite, llms.txt, optional waitlist-block removal. No new
pages (kill-list respected), no medical claims, generic cost framing,
matching platform wording throughout.
