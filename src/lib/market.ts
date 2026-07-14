// Master switch for the US market.
//
// Default false: every US city page and US provider page renders
// robots:noindex,follow AND is excluded from the sitemap, so the site reads as
// Canada-only. Flipping this to true fully re-indexes US pages (removes the
// noindex, restores them to the sitemap) with NO other code change. That is the
// one-switch reversal for the future US phase.
//
// Canadian pages are never affected, in either state.
export const US_MARKET_ENABLED = false;

const CA_PROVINCE_ABBR = new Set(['on', 'bc', 'ab', 'qc', 'mb', 'sk', 'ns', 'nb', 'nl', 'pe', 'nt', 'yt', 'nu']);
const CA_PROVINCE_NAME = new Set([
  'ontario', 'british columbia', 'alberta', 'quebec', 'manitoba', 'saskatchewan',
  'nova scotia', 'new brunswick', 'newfoundland and labrador', 'newfoundland',
  'prince edward island', 'northwest territories', 'yukon', 'nunavut',
]);

export type Market = 'CA' | 'US' | 'unknown';

export const normalizeCountry = (c?: string | null): Market => {
  const s = (c || '').trim().toLowerCase();
  if (!s) return 'unknown';
  if (/^(ca|can|canada)$/.test(s)) return 'CA';
  if (/^(us|usa|u\.s\.?|united states.*)$/.test(s)) return 'US';
  return 'unknown';
};

export const isCanadianProvince = (state?: string | null): boolean => {
  const s = (state || '').trim().toLowerCase();
  return CA_PROVINCE_ABBR.has(s) || CA_PROVINCE_NAME.has(s);
};

// Decide a page's market. The Supabase country field wins; province is the
// documented fallback. Returns 'US' only when confidently US, so a Canadian
// page is never caught: CA country or CA province => 'CA'; truly ambiguous
// (no country, no recognizable state) => 'unknown', which is NOT noindexed.
export const marketOf = (args: { country?: string | null; state?: string | null }): Market => {
  const c = normalizeCountry(args.country);
  if (c !== 'unknown') return c;
  if (isCanadianProvince(args.state)) return 'CA';
  return args.state && args.state.trim() ? 'US' : 'unknown';
};

// True when this page must be noindexed: it is a US page and the US market is off.
export const isNoindexedUSPage = (args: { country?: string | null; state?: string | null }): boolean =>
  !US_MARKET_ENABLED && marketOf(args) === 'US';

// CLAIMED-US EXCEPTION (2026-07-14, operator approved). Provider pages ONLY:
// a US provider page whose owner has claimed it (is_claimed=true) is indexable
// even while the US market is off, and belongs in the sitemap. Rationale: a
// claimed page is rich, owner-maintained content (menu, prices, photos), and
// hiding it from Google guts the claim value-prop for US owners (e.g. the
// 2026-07-10 Miami Lakes claim). This is a handful of pages that grows only
// with claims, so it adds none of the thin-stub dilution that keeps the rest
// of the US market noindexed. US city/state/matrix/statistics pages are NOT
// excepted; they keep using isNoindexedUSPage.
export const isNoindexedUSProviderPage = (args: {
  country?: string | null;
  state?: string | null;
  isClaimed?: boolean | null;
}): boolean => isNoindexedUSPage(args) && args.isClaimed !== true;

// robots override for App Router generateMetadata. undefined = no override.
export const usMarketRobots = (args: { country?: string | null; state?: string | null }) =>
  isNoindexedUSPage(args) ? ({ index: false as const, follow: true as const }) : undefined;
