/**
 * Pre-filter for the 2026-08-22 Quebec French-language discovery pass.
 * Drops hospitals/public health, booking-platform + vendor domains, directories,
 * news/blog-only, US/foreign TLD chains, and anything already in providers.
 * Writes .audit-tmp/_ca-qc-fr-survivors.json for agent verification.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const IN = path.join(__dirname, '..', '.audit-tmp', '_ca-scrape-qc-fr-candidates.json');
const OUT = path.join(__dirname, '..', '.audit-tmp', '_ca-qc-fr-survivors.json');

// Booking platforms, vendors, directories, marketplaces, social, aggregators.
const VENDOR = /^(wellnessliving|janeapp|jane\.app|mindbody|mindbodyonline|vagaro|fresha|booksy|square|squareup|setmore|acuityscheduling|calendly|gotostage|clinicmaster|medesync|omnimed|rendezvoussante|clicsante|bonjour-sante|gorendezvous|simplybook|noterro|owlpractice|zocdoc|opencare|ratemds|yelp|yellowpages|pagesjaunes|canada411|411|foursquare|tripadvisor|facebook|instagram|linkedin|twitter|x|tiktok|youtube|pinterest|reddit|quora|google|maps|bing|amazon|ebay|etsy|shopify|wix|squarespace|weebly|wordpress|blogspot|medium|substack|groupon|tuango|dealfind|indeed|glassdoor|jobillico|kijiji|craigslist|marketplace|yellowpages\.ca)\./i;

// Hospitals, universities, government, public health, professional colleges, insurers.
const PUBLIC = /(chum|chusj|chuq|chus|ciusss|cisss|santemontreal|quebec\.ca|gouv\.qc|canada\.ca|gc\.ca|inspq|inesss|ramq|msss|hopital|hospital|mcgill|umontreal|ulaval|usherbrooke|uqtr|uqam|concordia|polymtl|hec\.ca|cegep|college|ordre|cmq\.org|opq\.org|oiiq|opdq|professionsante|sunlife|manuvie|manulife|croixbleue|desjardins|bluecross)/i;

// News, encyclopedic, pure content, pharma/retail, health-info portals.
const CONTENT = /(radio-canada|ici\.radio|lapresse|journaldemontreal|journaldequebec|lesoleil|ledevoir|tvanouvelles|noovo|cbc|ctvnews|globalnews|montrealgazette|narcity|wikipedia|wikimedia|passeportsante|santelog|doctissimo|webmd|healthline|mayoclinic|clevelandclinic|nih\.gov|ncbi|pubmed|sciencedirect|researchgate|jeancoutu|uniprix|familiprix|brunet|pharmaprix|shoppersdrugmart|proxim|costco|walmart|amazon|well\.ca|vitaminshoppe|iherb|bodybuilding|gnc)/i;

// Foreign TLDs and obvious non-Canadian chains.
const FOREIGN_TLD = /\.(uk|us|fr|be|ch|au|nz|ie|de|es|it|nl|se|no|dk|pl|br|mx|in|ae|sg|za)$/i;

const SEED_DIRECTORIES = /(thedripmap|driphydration|ivhealth|mobileiv|drip-?bar|ivdirectory|clinics?directory|annuaire|repertoire|top10|meilleur|best-?of|comparatif)/i;

function classify(d) {
  if (VENDOR.test(d + '.')) return 'vendor/booking-platform';
  if (PUBLIC.test(d)) return 'hospital/public/institution';
  if (CONTENT.test(d)) return 'news/content/retail';
  if (FOREIGN_TLD.test(d)) return 'foreign TLD';
  if (SEED_DIRECTORIES.test(d)) return 'directory/aggregator';
  return null;
}

(async () => {
  const cands = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const all = Object.values(cands);

  // Live providers, for domain + email dedupe.
  let provs = [], from = 0;
  while (true) {
    const { data, error } = await s.from('providers').select('name,city,state,website,email').range(from, from + 999);
    if (error) throw error;
    provs = provs.concat(data || []);
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  const root = (u) => { try { const h = new URL(u).hostname.toLowerCase().replace(/^www\./, ''); const p = h.split('.'); if (p.length > 2 && /^(co|com|qc|on|bc|ab|gov|org|net)$/.test(p[p.length-2])) return p.slice(-3).join('.'); return p.slice(-2).join('.'); } catch { return null; } };
  const haveDomains = new Set(provs.map(p => p.website && root(p.website)).filter(Boolean));
  const haveEmails = new Set(provs.map(p => (p.email || '').toLowerCase()).filter(Boolean));

  const dropped = {}, survivors = [];
  for (const c of all) {
    if (haveDomains.has(c.domain)) { dropped['already listed'] = (dropped['already listed'] || 0) + 1; continue; }
    const why = classify(c.domain);
    if (why) { dropped[why] = (dropped[why] || 0) + 1; continue; }
    survivors.push(c);
  }

  console.log('candidates:', all.length);
  console.log('dropped:'); Object.entries(dropped).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  ', k, v));
  console.log('survivors:', survivors.length);

  fs.writeFileSync(OUT, JSON.stringify({ survivors, haveDomains: [...haveDomains], haveEmails: [...haveEmails] }, null, 2));
  console.log('->', OUT);
  survivors.forEach(x => console.log('  ', x.domain, '|', (x.titles[0] || '').slice(0, 70)));
})();
