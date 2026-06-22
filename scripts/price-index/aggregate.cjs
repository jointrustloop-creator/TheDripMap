// Turn a raw scrape (byProvider) into a curated CityPriceIndex: collapse to one
// price per clinic per drip (already done by the scraper), aggregate low/median/
// high across clinics, rename to public labels, round to whole dollars, drop
// anything under the publish threshold, and pin the headline drip first.
const T = require('./treatments.cjs');

function median(arr) {
  const b = [...arr].sort((x, y) => x - y);
  const n = b.length;
  return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
}

function aggregate(byProvider) {
  // collect every clinic's representative price per rawKey
  const byKey = {};
  for (const p of Object.values(byProvider)) {
    for (const x of p.prices || []) (byKey[x.treatment] ||= []).push(x.price);
  }

  const published = [];
  const dropped = [];
  let headline = null;

  for (const [rawKey, arr] of Object.entries(byKey)) {
    const stat = {
      rawKey,
      clinics: arr.length,
      low: Math.round(Math.min(...arr)),
      median: Math.round(median(arr)),
      high: Math.round(Math.max(...arr)),
    };
    const pub = T.PUBLISH[rawKey];
    if (!pub) {
      dropped.push({ ...stat, treatment: rawKey, reason: 'not in PUBLISH map (noise / not trusted)' });
      continue;
    }
    const row = { treatment: pub.display, clinics: stat.clinics, low: stat.low, median: stat.median, high: stat.high };
    if (stat.clinics < T.MIN_CLINICS) {
      dropped.push({ ...row, reason: `only ${stat.clinics} clinic(s), below ${T.MIN_CLINICS}` });
      continue;
    }
    if (pub.headline) headline = row;
    published.push(row);
  }

  // headline first, then by clinic count desc, then median desc
  published.sort((a, b) => {
    if (a === headline) return -1;
    if (b === headline) return 1;
    return b.clinics - a.clinics || b.median - a.median;
  });

  // honest clinic count: clinics contributing at least one PUBLISHED price
  const publishedKeys = new Set(Object.entries(T.PUBLISH).map(([k]) => k));
  const clinicCount = Object.values(byProvider).filter((p) =>
    (p.prices || []).some((x) => publishedKeys.has(x.treatment) && byKey[x.treatment]?.length >= T.MIN_CLINICS)
  ).length;

  return {
    rows: published,
    headline: headline || published[0] || null,
    dropped,
    clinicCount,
    clinicsScraped: Object.keys(byProvider).length,
    clinicsWithAnyPrice: Object.values(byProvider).filter((p) => (p.prices || []).length).length,
  };
}

module.exports = { aggregate, median };
