# IV Price Index pipeline

Turns published clinic menus into a dated, citable city price index. This is the
data engine behind `/iv-prices/[city]` and `src/lib/price-index-data.ts`. The
goal: **adding a new city is one command plus one human review.**

## Add a city

```bash
node scripts/price-index/build-city.cjs <city-slug>
```

Example: `node scripts/price-index/build-city.cjs calgary`

That pulls Calgary's clinics from Supabase, scrapes their public menus, and writes
three files to `.audit-tmp/price-index/`:

| file | what it is |
|---|---|
| `<slug>-raw.json` | resumable raw scrape (re-run to continue if it dies) |
| `<slug>-review.md` | **read this** — would-publish table, dropped items, per-clinic raw prices, reviewer checklist |
| `<slug>-dataset.ts.txt` | the exact block to paste into `price-index-data.ts` |

By default it ships **nothing**. You review the markdown, then either paste the
block yourself or re-run with `--write`.

### Flags

| flag | effect |
|---|---|
| `--from-cache` | skip scraping, just re-aggregate the existing raw JSON (fast) |
| `--limit N` | scrape at most N new clinics (testing / resuming) |
| `--as-of "June 2026"` | snapshot label (default: current month + year) |
| `--currency CAD\|USD` | override currency (default: derived from the city's country) |
| `--write` | splice the block into `price-index-data.ts` (new slugs only; never overwrites) |

## After `--write` (or pasting the block), finish the route

A new city needs three more one-line edits (kept manual on purpose, so a human
confirms the city is real before it goes live):

1. `app/sitemap.ts` — add `{ url: \`${baseUrl}/iv-prices/<slug>\`, priority: 0.8, changeFrequency: 'monthly', lastModified: new Date() }`
2. `next.config.mjs` — the `/iv-prices -> /iv-prices/toronto` redirect can point at whichever city is the flagship; no per-city redirect is needed (every covered slug renders directly).
3. Re-read the page copy: the hero, FAQ, schema and table all read from the data,
   so currency and numbers update automatically. Just sanity-check the rendered
   `/iv-prices/<slug>` on the Vercel preview.

## How it works

- **`treatments.cjs`** — all the knobs: treatment matchers, the publish map
  (raw key -> public label, which row is the headline), exclusion noise, price
  bounds, the `n >= 3` publish threshold. Tuning precision = editing this file.
- **`scrape.cjs`** — Supabase clinic list + the menu scraper. Windows + Node v24
  safe: sequential fetch, `AbortSignal` timeout, 600ms delay, partial write after
  every clinic so a silent worker death resumes cleanly.
- **`aggregate.cjs`** — raw -> curated: one price per clinic per drip, low/median/
  high across clinics, rounded, `n >= 3` filter, headline pinned first.
- **`emit.cjs`** — renders the TS block and the review markdown.
- **`build-city.cjs`** — the CLI that wires them together.

Reproducibility: running Toronto `--from-cache` reproduces the shipped index
exactly (10 drips, headline median $175, 17 clinics). The pipeline encodes the
same logic that produced the hand-reviewed v1.

## The funnel side (owner-verified prices)

Scraping is half of acquisition. The other half is owner-submitted prices from the
finish questionnaire (`app/finish/[token]`). Those are higher trust (the clinic
typed them) and should be **folded in on top of** scraped prices:

- Today this is **manual**: when a claimed clinic submits a menu with prices, add
  or correct that clinic's row in the raw JSON and re-run with `--from-cache`.
- Next step (not yet built): a `--include-owner-prices` source that reads verified
  prices from Supabase (the finish-listing answers) and merges them, marking those
  clinics as owner-verified so the index can show a trust marker. This closes the
  loop: the citable index drives claims, claims add verified prices, verified
  prices make the index better.

## Guardrails (baked into the review checklist)

- Only drips with `>= 3` clinics publish (no thin numbers).
- Prices are labelled as published clinic menus, in the city's currency, **not
  medical advice**. No efficacy claims anywhere in the data or copy.
- The per-clinic raw section exists so a reviewer can catch a mispaired package
  or membership price before it ships. Spot-checks beat automated audits.
