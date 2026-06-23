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

// Chain identity: same registrable domain in one city = one chain. Falls back
// to a normalized brand name when a domain wasn't captured (older raw caches).
function chainKey(p) {
  if (p.domain) return 'd:' + p.domain;
  const n = (p.name || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|inc|ltd|clinic|wellness|health|centre|center|spa|medical|aesthetics|iv|therapy|and|of|co|mobile|downtown|uptown|north|south|east|west|central|location|\d+)\b/g, '')
    .replace(/\s+/g, ' ').trim();
  return 'n:' + (n || (p.name || '').toLowerCase());
}

function aggregate(byProvider) {
  // Collapse chains FIRST: multiple locations of one brand in the same city
  // share a menu, so counting each location separately would let a single chain
  // clear the n>=MIN gate on its own and narrow/skew the distribution. Group by
  // chainKey and keep one representative (min) price per treatment per chain.
  const chains = {};
  for (const p of Object.values(byProvider)) {
    const k = chainKey(p);
    (chains[k] ||= { prices: {}, members: [] }).members.push(p.name || '');
    const cp = chains[k].prices;
    for (const x of p.prices || []) if (cp[x.treatment] == null || x.price < cp[x.treatment]) cp[x.treatment] = x.price;
  }
  // one representative price per CHAIN per treatment
  const byKey = {};
  for (const c of Object.values(chains)) {
    for (const [treatment, price] of Object.entries(c.prices)) (byKey[treatment] ||= []).push(price);
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

  // honest clinic count: CHAINS (deduped) contributing at least one published price
  const publishedKeys = new Set(Object.entries(T.PUBLISH).map(([k]) => k));
  const clinicCount = Object.values(chains).filter((c) =>
    Object.keys(c.prices).some((tk) => publishedKeys.has(tk) && byKey[tk]?.length >= T.MIN_CLINICS)
  ).length;

  // chains collapsed from >1 location (surfaced in the review doc for transparency)
  const mergedChains = Object.values(chains).filter((c) => c.members.length > 1).map((c) => c.members);

  return {
    rows: published,
    headline: headline || published[0] || null,
    dropped,
    clinicCount,
    clinicsScraped: Object.keys(byProvider).length,
    chainsAfterDedup: Object.keys(chains).length,
    mergedChains,
    clinicsWithAnyPrice: Object.values(byProvider).filter((p) => (p.prices || []).length).length,
  };
}

module.exports = { aggregate, median };
