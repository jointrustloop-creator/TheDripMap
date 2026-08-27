/**
 * Firecrawl-backed clinic discovery, the Google-Places-free path.
 *
 * WHY (2026-08-27): the weekly discovery cron has been dead for 43+ days
 * because the Places API rejects every call with REQUEST_DENIED — the Google
 * Cloud project has no billing account, and standing one up has repeatedly
 * stalled on the operator side ("no billing accounts exist"). Meanwhile the
 * Firecrawl key we already pay for found the +43 clinic batch in July and ran
 * the Quebec sweep. This ports that proven path into the server cron so
 * discovery refuels outreach supply with nobody's laptop open and no Google
 * dependency.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. Places gave us address, geo, rating and a
 * stable place_id; a web search gives none of those. So a Firecrawl-discovered
 * clinic is inserted lean (name, city, website, email, honest description) and
 * ranks accordingly until enrichment fills it in. It also cannot detect CLOSED
 * businesses, so the closed-flagging half of the Places flow simply does not
 * run here — never guessed at.
 *
 * ACCEPTANCE RULE (revised after the first dry run): the candidate's own page
 * must
 *   1. name an unambiguous IV-therapy service,
 *   2. name THE TARGET CITY ITSELF — a bare province or "Canada" is not
 *      enough, because we insert with city set and a Toronto clinic matching
 *      "Ontario" would be filed under Kitchener,
 *   3. not assert a US location (the veto that caught a Beverly Hills clinic
 *      and a Colorado "Quebec St" address in the Quebec pass).
 * An own-domain email is captured when present but NOT required: the first
 * dry run showed requiring it rejects essentially every real clinic (most
 * publish none), and the Places path never had emails either. A listing
 * without an email is still useful to patients; outreach just skips it.
 */

const TIMEOUT_MS = 12_000;
const MAX_SEARCHES = 4;
const MAX_VERIFY = 8;

/** Never a clinic: references, directories, socials, boookers, site builders. */
const NOT_A_CLINIC = /(wikipedia|webmd|healthline|merckmanuals|msdmanuals|yelp|yellowpages|pagesjaunes|tripadvisor|facebook|instagram|linkedin|tiktok|youtube|pinterest|reddit|quora|medium\.com|substack|indeed|glassdoor|groupon|booking|janeapp|mindbody|vagaro|fresha|wellnessliving|squarespace|wix|godaddy|shopify|webflow|clutch\.co|bbb\.org|thedripmap|google\.|gstatic|amazonaws)/i;

const IV_TERMS = /(vitaminoth[eé]rapie|intraveineu|intravenous|cocktail de myers|myers.{0,10}cocktail|nad\+|glutathion|IV drip|IV therapy|IV infusion|IV hydration|th[eé]rapie IV\b|perfusion (de |d')?vitamin|injection de vitamines|vitamin (iv|infusion|drip))/i;

const US_MARKER = /(beverly hills|los angeles|san francisco|new york city|california|texas|florida|arizona|nevada|illinois|georgia|,\s*(USA|U\.S\.A\.|United States)|\b\d{5}(-\d{4})?,?\s*(USA|United States)\b)/i;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}/g;
const BAD_LOCAL = /^(no-?reply|donotreply|postmaster|abuse|webmaster|mailer-daemon|sentry|example|user)/i;
const FILE_TAIL = /\.(png|jpe?g|gif|svg|webp|css|js|woff2?|ico|avif)$/i;

export interface FirecrawlFound {
  name: string;
  website: string;
  /** Optional: most clinics publish no address (measured ~5-9% do). A listing
   *  without an email is still a listing; outreach simply skips it. */
  email: string | null;
  phone: string | null;
}

export interface FirecrawlDiscoveryResult {
  found: FirecrawlFound[];
  searched: number;
  candidates: number;
  verified: number;
  notes: string[];
}

function rootDomain(host: string): string {
  const h = String(host || '').toLowerCase().replace(/^www\./, '');
  const p = h.split('.');
  if (p.length <= 2) return h;
  return /^(co|com|net|org|gouv|qc|on|bc|ab)\.[a-z]{2}$/i.test(p.slice(-2).join('.'))
    ? p.slice(-3).join('.')
    : p.slice(-2).join('.');
}

async function get(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'TheDripMapBot/1.0 (+https://www.thedripmap.com; clinic discovery)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-CA,en;q=0.9,fr-CA;q=0.8',
      },
    });
    if (!r.ok) return null;
    if (!(r.headers.get('content-type') || '').toLowerCase().includes('html')) return null;
    return await r.text();
  } catch {
    return null;
  }
}

const strip = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

function pickEmail(html: string, root: string): string | null {
  const raw = [
    ...(html.match(/mailto:([^"'>\s?]+)/gi) || []).map((m) => m.replace(/^mailto:/i, '')),
    ...(html.match(EMAIL_RE) || []),
  ];
  let best: { email: string; score: number } | null = null;
  for (const c of raw) {
    const e = c.trim().toLowerCase().replace(/[.,;:)]+$/, '');
    if (FILE_TAIL.test(e)) continue;
    const [local, host] = e.split('@');
    if (!local || !host || BAD_LOCAL.test(local)) continue;
    if (NOT_A_CLINIC.test(host)) continue;
    if (rootDomain(host) !== root) continue;
    const score = /^(info|contact|hello|bonjour|admin|reception|frontdesk|office|booking)$/.test(local) ? 3 : 1;
    if (!best || score > best.score) best = { email: e, score };
  }
  return best ? best.email : null;
}

function titleOf(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const t = m[1].replace(/\s+/g, ' ').trim().split(/\s*[|\-–—]\s*/)[0].slice(0, 90).trim();
  return t || null;
}

function pickPhone(html: string): string | null {
  const text = strip(html);
  const m = text.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
  return m ? m[0].trim() : null;
}

/**
 * Search + verify for one city. `knownDomains` are root domains of every
 * provider already in the table (any city — a chain's second location should
 * dedupe on domain, not slip in because it was searched from a new city), and
 * `knownEmails` guard against re-inserting a listing under a new name.
 */
export async function firecrawlDiscover(
  apiKey: string,
  city: string,
  province: string | null,
  knownDomains: Set<string>,
  knownEmails: Set<string>,
): Promise<FirecrawlDiscoveryResult> {
  const notes: string[] = [];
  const queries = [
    `IV therapy clinic ${city}`,
    `IV drip ${city}`,
    `vitamin infusion clinic ${city}`,
    `NAD+ IV ${city}`,
  ].slice(0, MAX_SEARCHES);

  // THE CITY ITSELF, nothing looser. Province/Canada markers were tried and
  // rejected: they would let any Ontario clinic pass a Kitchener run and be
  // filed under the wrong city, since we insert with city set. US_MARKER still
  // vetoes independently. (province stays a parameter for the insert, not the
  // match.)
  void province;
  const cityRe = new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const domains = new Map<string, { url: string; title: string }>();
  let searched = 0;
  for (const q of queries) {
    try {
      const r = await fetch('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, limit: 10, location: 'Canada' }),
        signal: AbortSignal.timeout(20_000),
      });
      searched++;
      if (!r.ok) { notes.push(`search "${q}" HTTP ${r.status}`); continue; }
      const j = await r.json();
      const web = (j?.data?.web || j?.data || []) as Array<{ url?: string; title?: string }>;
      for (const hit of Array.isArray(web) ? web : []) {
        if (!hit.url) continue;
        let host: string;
        try { host = new URL(hit.url).hostname; } catch { continue; }
        const root = rootDomain(host);
        if (NOT_A_CLINIC.test(root) || NOT_A_CLINIC.test(hit.url)) continue;
        if (knownDomains.has(root)) continue;
        if (!domains.has(root)) domains.set(root, { url: `https://${host}`, title: hit.title || '' });
      }
    } catch (e) {
      notes.push(`search "${q}" ${e instanceof Error ? e.name : 'failed'}`);
    }
  }

  const found: FirecrawlFound[] = [];
  let verified = 0;
  for (const [root, cand] of [...domains.entries()].slice(0, MAX_VERIFY)) {
    const html = await get(cand.url);
    if (!html) continue;
    verified++;
    const text = strip(html);
    if (!IV_TERMS.test(text)) continue;
    if (US_MARKER.test(text)) continue;
    if (!cityRe.test(text)) continue;
    let email = pickEmail(html, root);
    let phone = pickPhone(html);
    if (!email) {
      // One extra fetch for the contact page; give up quietly if none.
      const h2 = await get(cand.url + '/contact');
      if (h2) {
        email = pickEmail(h2, root);
        if (!phone) phone = pickPhone(h2);
      }
    }
    // An email we already hold means this is an existing operator under a new
    // domain — dedupe, do not insert.
    if (email && knownEmails.has(email)) continue;
    const name = titleOf(html) || cand.title;
    if (!name || name.length < 3) continue;
    found.push({ name, website: cand.url, email: email || null, phone });
    if (email) knownEmails.add(email);
  }

  if (!domains.size) notes.push('no unknown domains surfaced — this angle may be mined out for this city');
  return { found, searched, candidates: domains.size, verified, notes };
}
