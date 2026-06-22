// Render a curated city aggregate into (1) the exact TS literal to paste into
// src/lib/price-index-data.ts and (2) a human-review markdown. The review doc is
// the spot-check gate: hard experience says automated audits miss content-quality
// issues, so a person eyeballs this before the city ships.
const T = require('./treatments.cjs');

// Quote a string for a TS source literal: double quotes when it contains an
// apostrophe (e.g. Myers' Cocktail), single quotes otherwise. Matches the
// hand-written style already in price-index-data.ts.
function q(s) {
  return String(s).includes("'") ? JSON.stringify(s) : `'${s}'`;
}

function rowLiteral(r) {
  return `{ treatment: ${q(r.treatment)}, clinics: ${r.clinics}, low: ${r.low}, median: ${r.median}, high: ${r.high} }`;
}

// A starter note built from what got dropped for thinness. Flagged as editable;
// a human should confirm or replace it.
function defaultNote(agg) {
  const thin = agg.dropped
    .filter((d) => /below \d/.test(d.reason))
    .map((d) => d.treatment);
  if (!thin.length) return 'Ranges reflect published single-visit prices; some drips span both add-on pushes and full drips.';
  const list = thin.length === 1 ? thin[0] : `${thin.slice(0, -1).join(', ')} and ${thin[thin.length - 1]}`;
  return `${list} drips had too few published prices in this round to report a reliable range. Some ranges span both add-on pushes and full drips.`;
}

function toDatasetBlock({ citySlug, cityName, currency, asOf, agg, note }) {
  const h = agg.headline;
  const rows = agg.rows.map((r) => `      ${rowLiteral(r)},`).join('\n');
  return `  ${citySlug}: {
    city: ${q(cityName)},
    citySlug: ${q(citySlug)},
    asOf: ${q(asOf)},
    currency: ${q(currency)},
    clinicCount: ${agg.clinicCount},
    headline: ${rowLiteral(h)},
    rows: [
${rows}
    ],
    note: ${q(note || defaultNote(agg))},
  },`;
}

function toReviewMarkdown({ citySlug, cityName, currency, asOf, agg, note }) {
  const h = agg.headline;
  const pubTable = agg.rows
    .map((r) => `| ${r.treatment} | ${r.clinics} | $${r.low} | **$${r.median}** | $${r.high} |`)
    .join('\n');
  const dropTable = agg.dropped
    .sort((a, b) => b.clinics - a.clinics)
    .map((d) => `| ${d.treatment} | ${d.clinics} | $${d.low}-$${d.high} | ${d.reason} |`)
    .join('\n');

  const perClinic = Object.values(agg._byProvider || {})
    .filter((p) => (p.prices || []).length)
    .sort((a, b) => (b.prices || []).length - (a.prices || []).length)
    .map((p) => `- **${p.name}**${p.claimed ? ' _(claimed)_' : ''}: ${(p.prices || []).map((x) => `${x.treatment} $${x.price}`).join(', ')}`)
    .join('\n');

  return `# ${cityName} IV Price Index review (${asOf})

- City slug: \`${citySlug}\`  |  Currency: **${currency}**
- Clinics scraped: ${agg.clinicsScraped}  |  with at least one price: ${agg.clinicsWithAnyPrice}  |  **contributing a published price: ${agg.clinicCount}**
- Headline (standard drip): **$${h?.median}** median, $${h?.low}-$${h?.high} across ${h?.clinics} clinics

## Would publish (n >= ${T.MIN_CLINICS})

| Drip | Clinics | From | Median | High |
|---|--:|--:|--:|--:|
${pubTable}

## Dropped (below threshold or noise)

| Item | Clinics | Range | Reason |
|---|--:|---|---|
${dropTable || '| (none) | | | |'}

## Proposed note (editable)

> ${note || defaultNote(agg)}

## Per-clinic raw prices (sanity-check the pairings)

${perClinic || '_no prices extracted_'}

## Reviewer checklist (clear before shipping)

- [ ] Currency is correct for this city (${currency}).
- [ ] No membership / package / per-unit price leaked into a drip row.
- [ ] Headline "standard drip" range looks like a real single-visit vitamin drip.
- [ ] No unverifiable superlative or service-area claim in the note.
- [ ] Spot-check 3 clinics above against their live menu pages.
- [ ] Slug \`${citySlug}\` is not already in price-index-data.ts.
`;
}

module.exports = { toDatasetBlock, toReviewMarkdown, defaultNote };
