/**
 * The Firecrawl discovery run itself, lifted out of app/api/cron/discovery so
 * it can be called from more than one place (2026-09-15). The cron route still
 * owns scheduling, auth and the combined report; this owns "search one city,
 * diff it against everything we already list, insert what is genuinely new".
 *
 * Route files may only export handlers, and a local operator run has no
 * CRON_SECRET, so the logic belongs in lib. scripts/_discovery-run.ts drives it
 * on demand with FIRECRAWL_API_KEY and the service-role key.
 */
import { sendMail } from './mailer';
import { REPORT_TO } from './report-recipient';
import { firecrawlDiscover } from './discovery-firecrawl';
import { honestDescription } from './discovery';
import { slugify } from './data';
import { notCanadianReason } from './discovery-guard';

/** Province for each rotation city, so inserts carry the right region. */
export const PROVINCE: Record<string, string> = {
  Toronto: 'Ontario', Mississauga: 'Ontario', Vaughan: 'Ontario', Brampton: 'Ontario',
  Ottawa: 'Ontario', Hamilton: 'Ontario', London: 'Ontario', Kitchener: 'Ontario',
  Vancouver: 'British Columbia', Victoria: 'British Columbia',
  Calgary: 'Alberta', Edmonton: 'Alberta',
  Montreal: 'Quebec', Halifax: 'Nova Scotia', Winnipeg: 'Manitoba',
  Burnaby: 'British Columbia', Surrey: 'British Columbia', Richmond: 'British Columbia',
  Kelowna: 'British Columbia', Abbotsford: 'British Columbia', Kamloops: 'British Columbia',
  Nanaimo: 'British Columbia',
  Markham: 'Ontario', 'Richmond Hill': 'Ontario', Oakville: 'Ontario', Burlington: 'Ontario',
  Guelph: 'Ontario', Windsor: 'Ontario', Barrie: 'Ontario', Oshawa: 'Ontario',
  'St. Catharines': 'Ontario', Waterloo: 'Ontario', Cambridge: 'Ontario', Sudbury: 'Ontario',
  'Quebec City': 'Quebec', Laval: 'Quebec', Gatineau: 'Quebec',
  'Red Deer': 'Alberta', Lethbridge: 'Alberta',
  Moncton: 'New Brunswick', Fredericton: 'New Brunswick',
  "St. John's": 'Newfoundland and Labrador',
};

export interface DiscoveryRunResult {
  ok: boolean; city: string; dry: boolean; source: string;
  searches: number; candidates: number; verified: number;
  created: number; names: string[]; notes: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runFirecrawl(sb: any, fcKey: string, city: string, province: string | null, dry: boolean, opts: { silent?: boolean } = {}): Promise<DiscoveryRunResult> {
  // Dedupe against EVERYTHING we already list: root domain of every website
  // (a chain's second location must match on domain, not city) and every email.
  const knownDomains = new Set<string>();
  const knownEmails = new Set<string>();
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from('providers').select('website,email').range(f, f + 999);
    if (!data || !data.length) break;
    for (const p of data as Array<{ website?: string | null; email?: string | null }>) {
      if (p.website) {
        try { knownDomains.add(new URL(p.website).hostname.toLowerCase().replace(/^www\./, '').split('.').slice(-2).join('.')); } catch { /* bad url */ }
      }
      if (p.email) knownEmails.add(p.email.toLowerCase().trim());
    }
    if (data.length < 1000) break;
  }

  const r = await firecrawlDiscover(fcKey, city, province, knownDomains, knownEmails);

  const created: string[] = [];
  const nowIso = new Date().toISOString();
  if (!dry) {
    for (const c of r.found) {
      // Country guard (2026-09-11). Canadian city names collide with London UK,
      // Vancouver WA, Burlington VT/NC/MA, Hamilton NJ, Ottawa IL, Milton MA,
      // Victoria TX, Halifax UK: 22 such clinics reached the table before this
      // check. A candidate whose phone area code is not Canadian, or whose site
      // is on a UK/AU/IE domain, is rejected and noted, never inserted.
      const notCanada = notCanadianReason(c.phone, c.website);
      if (notCanada) { r.notes.push(`rejected ${c.name}: ${notCanada}`); continue; }
      const slug = `${slugify(c.name)}-${slugify(city)}`;
      const { error } = await sb.from('providers').insert({
        name: c.name,
        slug,
        city,
        state: province,
        country: 'Canada',
        phone: c.phone,
        website: c.website,
        email: c.email,
        description: honestDescription(c.name, city),
        is_claimed: false,
        is_hidden: false,
        discovery_source: 'firecrawl',
        // Names come from page <title>s and are sometimes a service phrase, not
        // the business ("Ketamine Infusion Therapy" for Forbes Medi-Clinic in
        // the Moncton dry run). The flag keeps these OUT of the outreach queue
        // until a human confirms the name, because outreach greets clinics by
        // name and a wrong one reads as spam.
        discovery_flag: 'firecrawl_needs_review',
        discovery_seen_at: nowIso,
      });
      if (!error) created.push(c.name);
      else r.notes.push(`insert ${slug}: ${error.message}`);
    }
    await sb.from('discovery_runs').insert({
      city, source: 'firecrawl', api_calls: r.searched, results_seen: r.candidates,
      new_clinics: created.length, updated: 0, flagged: 0,
      notes: r.notes.join(' | ') || null,
    });
  }

  const lines = [
    `Discovery run ${dry ? '(DRY) ' : ''}for ${city} via Firecrawl (Google Places path is billing-blocked)`,
    '',
    `Searches: ${r.searched} · unknown domains surfaced: ${r.candidates} · pages verified: ${r.verified}`,
    `New clinics: ${created.length}${created.length ? ' -> ' + created.join(', ') : ''}`,
    '',
    'Each new clinic passed all three checks on its own site: an unambiguous IV',
    'service, the city named on the page (US locations vetoed), no directory or',
    'aggregator domains. Names are machine-extracted from page titles, so every',
    'insert is flagged firecrawl_needs_review and EXCLUDED from outreach until',
    'a human confirms the name. Firecrawl cannot see address/geo/ratings or',
    'detect closures; enrichment fills those in later. Nothing was deleted.',
    r.notes.length ? `Notes: ${r.notes.join(' | ')}` : '',
  ].filter(Boolean);

  // In a multi-city sweep the caller sends ONE combined report instead of a
  // separate email per city.
  if (!opts.silent) {
    try {
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: REPORT_TO,
        subject: `[TheDripMap] Discovery ${city}: ${created.length} new (Firecrawl)`,
        text: lines.join('\n'),
      });
    } catch { /* reporting must never fail the run */ }
  }

  return {
    ok: true, city, dry, source: 'firecrawl',
    searches: r.searched, candidates: r.candidates, verified: r.verified,
    created: created.length, names: created, notes: r.notes,
  };
}
