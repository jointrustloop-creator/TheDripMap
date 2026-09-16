/**
 * Country guard for discovery (2026-09-11). Canadian city names collide with
 * London UK, Vancouver WA, Burlington VT/NC/MA, Hamilton NJ, Ottawa IL, Milton
 * MA, Victoria TX, Halifax UK: 22 such clinics reached the table before this
 * check. Lives in src/lib because a Next.js route file may only export HTTP
 * handlers (exporting it from the route broke the production build).
 */
// Every Canadian area code (2026). A 10-digit phone outside this set is not a
// Canadian clinic; toll-free (8xx) numbers are allowed because Canadian chains
// use them.
const CA_AREA_CODES = new Set(['204','226','236','249','250','263','289','306','343','354','365','367','368','382','387','403','416','418','428','431','437','438','450','460','468','474','506','514','519','548','579','581','584','587','600','604','613','639','647','672','683','705','709','742','753','778','780','782','807','819','825','867','873','879','902','905']);

// The ACTUAL toll-free NANP codes. This used to be the regex /^8[0-9]{2}$/,
// which waved through every 8xx area code: on 2026-09-15 that let "Premier
// MedSpa in Kingston, TN" (865, Tennessee) and a Golden Hill rehab centre (845,
// New York) into the table as Kingston, Ontario clinics.
const TOLL_FREE = new Set(['800', '833', '844', '855', '866', '877', '888', '822', '880', '881', '882', '883', '884', '885', '886', '887', '889']);

// US state names and postal abbreviations as they appear in a page title,
// e.g. "Premier MedSpa in Kingston, TN". Canadian city names collide with US
// ones constantly, and the title is often the only signal we have.
const US_STATES = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming'];
const US_ABBR = /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/;

export function notCanadianReason(phone: string | null | undefined, website: string | null | undefined, name?: string | null): string | null {
  const host = (() => { try { return new URL(String(website || '')).hostname.toLowerCase(); } catch { return ''; } })();
  if (/\.(uk|ie|au|nz)$/.test(host)) return `non-Canadian domain ${host}`;
  const n = String(name || '');
  if (n) {
    const m = n.match(US_ABBR);
    if (m) return `name names the US state ${m[1]}`;
    const lower = n.toLowerCase();
    const hit = US_STATES.find((s) => new RegExp(`\\b${s}\\b`).test(lower));
    if (hit) return `name names the US state ${hit}`;
  }
  const digits = String(phone || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  if (digits.length === 10) {
    const ac = digits.slice(0, 3);
    if (!CA_AREA_CODES.has(ac) && !TOLL_FREE.has(ac)) return `phone area code ${ac} is not Canadian`;
  } else if (digits.length && (digits.length === 11 || digits.length === 12) && !digits.startsWith('1')) {
    return `phone ${phone} is not a North American number`;
  }
  return null;
}

/**
 * Firecrawl takes the candidate name from the page <title>, which is often not
 * a business name at all ("Homepage", "Welcome to our site", "Home | ..."). A
 * junk name is worse than no row: outreach greets clinics by name, and the row
 * sits in the review queue forever. Reject at insert time instead.
 */
export function badCandidateName(name: string | null | undefined): string | null {
  const n = String(name || '').trim();
  if (n.length < 3) return 'name too short';
  if (n.length > 90) return 'name looks like a page title, not a business name';
  if (/^(home|homepage|welcome|index|untitled|main page|our services|services|about us?|contact us?)$/i.test(n)) return `generic page title "${n}"`;
  if (/^(home|welcome)\b/i.test(n)) return `generic page title "${n}"`;
  return null;
}

