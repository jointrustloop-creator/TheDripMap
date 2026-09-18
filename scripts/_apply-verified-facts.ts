/**
 * Apply the facts produced by the clinic-fact-fill workflow (2026-09-16).
 *
 * Every fact in facts.json was extracted from the clinic's OWN website or its
 * own booking domain, then independently re-fetched by a second agent that had
 * to find the quote itself or the fact was dropped. This script writes only
 * what survived that check, records where each value came from, and never
 * overwrites a value the clinic already gave us.
 *
 *   npx tsx scripts/_apply-verified-facts.ts            dry run, prints the diff
 *   npx tsx scripts/_apply-verified-facts.ts --apply    writes
 */
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import { createClient } from '@supabase/supabase-js';

const FACTS = 'C:/Users/Dell/AppData/Local/Temp/claude/C--Users-Dell-Desktop-TheDripMap/b8b614b3-d671-455a-bc8b-c8594569924b/scratchpad/facts.json';
const apply = process.argv.includes('--apply');
const SOURCE = 'website_verified 2026-09-16';

interface Fact { field: string; value: string; url: string; conf: string }
interface Clinic { slug: string; name: string; missing_before: string[]; verified: Fact[] }

/** No en or em dashes anywhere we publish. */
const dedash = (s: string) => s.replace(/\s*[\u2013\u2014]\s*/g, ' to ').replace(/\s+/g, ' ').trim();

/** "Myers Formula $180", "Glow IV $299 + HST", "A $240; B $195" -> [{name, price}] */
function parsePrices(value: string): Array<{ name: string; price: string }> {
  const out: Array<{ name: string; price: string }> = [];
  for (const chunk of dedash(value).split(/;|\u2022/)) {
    const m = chunk.match(/^\s*(.+?)\s*\$\s?([\d,]+(?:\.\d{1,2})?)(\s*to\s*\$?\s?[\d,]+(?:\.\d{1,2})?)?\s*(\+\s*HST)?\s*$/i);
    if (!m) continue;
    const name = m[1].replace(/[\s:,-]+$/, '').trim();
    if (!name || name.length > 90) continue;
    const price = `$${m[2]}${m[3] ? m[3].replace(/\s*to\s*\$?\s?/, ' to $') : ''}${m[4] ? ' + HST' : ''}`;
    out.push({ name, price });
  }
  return out;
}

/** "monday: 8:00 AM to 8:00 PM; tuesday: ..." -> {monday: "..."}; ignores prose. */
function parseHours(value: string): Record<string, string> | null {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const out: Record<string, string> = {};
  for (const part of dedash(value).split(';')) {
    const m = part.match(/^\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*:\s*(.+?)\s*$/i);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  }
  return days.every((d) => out[d]) ? out : null;
}

/** "Dr. Jenna Dhillon, ND (Naturopathic Doctor) - no registration..." -> name + title */
function parsePractitioner(value: string): { name: string; title: string } | null {
  const head = dedash(value).split(/\s+(?:to|[-])\s+|\(/)[0].trim();
  // The credential tail can itself contain commas ("Dr. Mariah Pilling, B.Sc.,
  // N.D."). The first version required a comma-free tail and silently dropped
  // that clinic, which would have had us email VP Health asking for a
  // practitioner name we had already verified. Split on the FIRST comma and
  // keep the rest as the credential.
  const i = head.indexOf(',');
  if (i < 0) return null;
  const name = head.slice(0, i).trim();
  const tail = head.slice(i + 1).trim().replace(/\s*\(.*$/, '');
  if (!/^(?:Dr\.?\s+)?[A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){1,3}$/.test(name)) return null;
  if (name.split(/\s+/).length < 2) return null;   // need a surname
  // Keep the most specific regulated credential rather than a degree list.
  // Drop the dots BEFORE matching: "N.D." has no word boundary after the final
  // period, so a dotted credential slipped past and VP Health came out as
  // "BSC" (their first degree) instead of ND.
  const flat = tail.replace(/\./g, '');
  const cred = flat.match(/\b(NP-PHC|NP|ND|MD|DO|RN|CCFP)\b/i);
  const title = (cred ? cred[1] : flat.split(',')[0]).toUpperCase().trim().slice(0, 12);
  if (!title || title.length < 2) return null;
  return { name, title };
}

function parseServices(value: string): string[] {
  return dedash(value).split(/,|\|/).map((s) => s.replace(/\(.*?\)/g, '').trim())
    .filter((s) => s.length > 2 && s.length < 60).slice(0, 20);
}

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const clinics: Clinic[] = JSON.parse(fs.readFileSync(FACTS, 'utf8'));
  let changed = 0;

  for (const c of clinics) {
    if (!c.verified.length) { console.log(`\n-- ${c.name}: nothing verified, skipping`); continue; }
    const { data: p } = await sb.from('providers').select('*').eq('slug', c.slug).maybeSingle();
    if (!p) { console.log(`\n!! ${c.name}: slug ${c.slug} not found`); continue; }

    const dd = (p.decision_drivers || {}) as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    const notes: string[] = [];
    const prov: Record<string, string> = {};

    // ---- prices -> services entries + price_range ----
    const priced = c.verified.filter((f) => f.field === 'prices').flatMap((f) => parsePrices(f.value).map((x) => ({ ...x, url: f.url })));
    // An owner who has since filled in their own prices beats anything we read
    // off their website. DRS Mobile Therapy and Vida + Flow both completed
    // their listings while this run was going; do not append a second, scraped
    // price list next to the one they typed themselves.
    const ownerPriced = Array.isArray(p.services)
      && (p.services as Array<{ price?: string | null; source?: string }>).some((s) => s && /\$\s?\d/.test(String(s.price || '')) && s.source !== 'website_verified');
    if (priced.length && ownerPriced) {
      notes.push('prices SKIPPED (owner already supplied prices)');
    } else if (priced.length) {
      const existing = Array.isArray(p.services) ? (p.services as Array<{ name?: string; price?: string | null; source?: string }>) : [];
      const have = new Set(existing.map((s) => String(s.name || '').toLowerCase().trim()));
      const added = priced.filter((x) => !have.has(x.name.toLowerCase()));
      if (added.length) {
        update.services = [...existing, ...added.map((x) => ({ name: x.name, price: x.price, source: 'website_verified', source_url: x.url }))];
        notes.push(`+${added.length} priced services`);
        prov.prices = added[0].url;
      }
      if (!/\$\s?\d/.test(String(p.price_range || ''))) {
        // A price can be a RANGE ("$185 to $195"). Take every number it
        // contains, not the digits mashed together: stripping non-digits from
        // "$185 to $195" yields 185195, which produced the nonsense range
        // "$180200-195210" for Soma and Soul in the dry run.
        const nums = priced.flatMap((x) => (String(x.price).match(/\d[\d,]*(?:\.\d{1,2})?/g) || []).map((n) => Number(n.replace(/,/g, '')))).filter((n) => n > 0 && n < 100000);
        if (nums.length) {
          const lo = Math.min(...nums), hi = Math.max(...nums);
          update.price_range = lo === hi ? `$${lo}` : `$${lo}-${hi}`;
          notes.push(`price_range ${update.price_range}`);
        }
      }
    }

    // ---- practitioner -> medical_team ----
    const teamHas = Array.isArray(p.medical_team) && (p.medical_team as Array<{ name?: string }>).some((m) => m && m.name);
    if (!teamHas) {
      for (const f of c.verified.filter((x) => x.field === 'practitioner')) {
        if (f.conf === 'low') { notes.push(`practitioner SKIPPED (low confidence)`); break; }
        const parsed = parsePractitioner(f.value);
        if (!parsed) { notes.push('practitioner unparseable, skipped'); break; }
        update.medical_team = [{ name: parsed.name, title: parsed.title, role: 'Named on the clinic website', bio: '', source: SOURCE, source_url: f.url }];
        notes.push(`practitioner ${parsed.name}, ${parsed.title}`);
        prov.practitioner = f.url;
        break;
      }
    }

    // ---- hours ----
    const hasHours = p.working_hours && Object.keys(p.working_hours as object).length > 0;
    if (!hasHours) {
      for (const f of c.verified.filter((x) => x.field === 'hours')) {
        const h = parseHours(f.value);
        if (h) { update.working_hours = h; notes.push('hours (7 days)'); prov.hours = f.url; break; }
      }
    }

    // ---- services (names only) -> specialties ----
    const svc = c.verified.filter((f) => f.field === 'services').flatMap((f) => parseServices(f.value));
    if (svc.length) {
      const existing = Array.isArray(p.specialties) ? (p.specialties as string[]) : [];
      const merged = Array.from(new Set([...existing, ...svc]));
      if (merged.length > existing.length) { update.specialties = merged; notes.push(`+${merged.length - existing.length} specialties`); prov.services = c.verified.find((f) => f.field === 'services')!.url; }
    }

    if (!Object.keys(update).length) { console.log(`\n-- ${c.name}: nothing new to write`); continue; }
    update.decision_drivers = { ...dd, fact_fill: { at: SOURCE, sources: prov, applied: Object.keys(update).filter((k) => k !== 'decision_drivers') } };

    console.log(`\n== ${c.name} [${c.slug}]`);
    console.log(`   ${notes.join(' | ')}`);
    if (update.price_range) console.log(`   price_range: ${update.price_range}`);
    if (update.medical_team) console.log(`   team: ${JSON.stringify(update.medical_team)}`);
    if (update.working_hours) console.log(`   hours: ${JSON.stringify(update.working_hours)}`);
    if (update.services) console.log(`   services now ${(update.services as unknown[]).length}`);

    if (apply) {
      const { error } = await sb.from('providers').update(update).eq('id', p.id);
      console.log(error ? `   WRITE FAILED: ${error.message}` : '   written');
      if (!error) changed++;
    }
  }
  console.log(`\n${apply ? `applied to ${changed} clinics` : 'DRY RUN, nothing written'}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
