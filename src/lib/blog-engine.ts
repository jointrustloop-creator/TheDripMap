/**
 * Blog engine: the Mon/Thu authority-post generator, moved onto Vercel so it
 * runs with nobody's laptop open (PLAN-6, 2026-08-28).
 *
 * DESIGN RULES (each traces to a standing decision or a hard lesson):
 *  - AUTO-PUBLISH on QA pass, per the 2026-07-11 operator mandate ("blogs
 *    auto-publish, spot-check"). QA fail -> email + skip. NEVER publish a
 *    failing post.
 *  - Every factual claim must come from the FACTS BLOCK we build from live
 *    Supabase data. The QA gate rejects clinic-name mentions that are not in
 *    the facts block (2026-06-10 sleep-mode lesson: templated content invents
 *    things; assert grounding on OUTPUT, not intent).
 *  - No dollar figures at all in v1 (we have no price table to ground them;
 *    the price posts stay operator-written). Regex-gated.
 *  - No en/em dashes, never the word "directory" (house style; we are a
 *    "matching platform"), meta_title <=60, meta_description <=160.
 *  - City name must appear >=3 times in the body (the literal check that
 *    would have caught the 24 "undefined" city pages).
 *  - Market superlatives ("one of the highest ... per-capita") are rejected;
 *    they slipped to prod once before.
 *  - Internal links are allowlisted per topic and verified against the built
 *    allowlist; a link to a page we do not serve fails QA.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getCityPriceIndex } from './price-index-data';

export interface BlogTopic {
  slug: string;
  workingTitle: string;
  category: string;
  /** 'city' topics get a live facts block for this city; 'evergreen' get site-wide facts. */
  kind: 'city' | 'evergreen';
  city?: string; // display name, e.g. 'Winnipeg'
  citySlug?: string; // /cities/<slug>
  angle: string; // one-paragraph brief for the model
  relatedCities: string[];
  /**
   * When set, the facts block carries the dated Price Index rows for this city
   * and the post MAY quote those dollar figures, and only those (2026-09-21:
   * cost queries are the largest unserved demand in Search Console, and the
   * index is the one price source we can stand behind).
   */
  priceCitySlug?: string;
}

/**
 * The queue, in publish order. The route picks the first slug that does not
 * already exist in blog_posts, so re-runs and manual inserts are both safe.
 * Cities chosen 2026-08-28: every one has a /cities page and 6+ active
 * listings, and none has an existing best-iv-therapy post.
 */
export const TOPIC_QUEUE: BlogTopic[] = [
  // 2026-09-21 demand queue, from the Search Console export of 2026-09-20:
  // cost queries (~900 impressions, 2 clicks), iron infusion (2,720 / 5),
  // NAD+ (3,800 / 2), glutathione Montreal (our best CTR), "how long does an
  // IV drip take" (position 65). Cost posts are grounded on the Price Index
  // via priceCitySlug; the rest carry no dollar figures.
  {
    slug: 'iv-therapy-cost-edmonton-2026',
    workingTitle: 'How Much Does IV Therapy Cost in Edmonton? Published Prices (2026)',
    category: 'Cost & Insurance',
    kind: 'city', city: 'Edmonton', citySlug: 'edmonton', priceCitySlug: 'edmonton',
    relatedCities: ['Edmonton', 'Calgary', 'Red Deer'],
    angle: 'Answer first: the published price range for a standard drip in Edmonton from the Price Index, then the per-drip table in prose, then what explains the gap (dose, volume and add-ons, who assesses you, mobile premium), what is usually not included (assessment fee, GST, memberships), and what to ask before paying. Close with how to check who prescribes on a clinic page. Quote only the index figures, dated.',
  },
  {
    slug: 'nad-iv-therapy-cost-toronto-2026',
    workingTitle: 'NAD+ IV Therapy in Toronto: What It Costs and What to Expect (2026)',
    category: 'Cost & Insurance',
    kind: 'city', city: 'Toronto', citySlug: 'toronto', priceCitySlug: 'toronto',
    relatedCities: ['Toronto', 'Mississauga', 'Vaughan'],
    angle: 'NAD+ is priced by dose, so the same menu word can mean a 250 mg or a 1,000 mg infusion; use the Toronto Price Index NAD+ row (and the standard drip row for contrast) to show the spread and explain it. Cover session length (a slow drip, often 2 hours or more), the flushing sensation clinics warn about, who should be assessed first, and what the evidence does and does not support, neutrally. No outcome promises.',
  },
  {
    slug: 'nad-iv-therapy-calgary-2026',
    workingTitle: 'NAD+ IV Therapy in Calgary: Cost, Time, and How to Choose a Clinic (2026)',
    category: 'Cost & Insurance',
    kind: 'city', city: 'Calgary', citySlug: 'calgary', priceCitySlug: 'calgary',
    relatedCities: ['Calgary', 'Edmonton', 'Red Deer'],
    angle: 'Same structure as the Toronto NAD+ post for Calgary: the index NAD+ row and standard drip row, dose as the price driver, session length, assessment first, evidence stated neutrally, and how to check the prescriber on a clinic page. Alberta scope note: physicians, nurse practitioners, and naturopathic doctors holding the College IV authorization.',
  },
  {
    slug: 'private-iron-infusion-ontario-2026',
    workingTitle: 'Private Iron Infusion in Ontario: How It Works, Who Gives It, and OHIP (2026)',
    category: 'Cost & Insurance',
    kind: 'evergreen',
    relatedCities: ['Oakville', 'Toronto', 'Mississauga'],
    angle: 'Iron infusion is a medical treatment for diagnosed iron deficiency, not a wellness drip. Explain the difference plainly: it needs bloodwork and a prescription, it is given in hospital outpatient clinics and by some private clinics, OHIP covers the hospital route while private clinics charge for the visit and the drug, and extended plans sometimes reimburse the drug. Describe how a private appointment typically works (referral or requisition, bloodwork, the infusion visit, monitoring). No prices. Point readers to ask their physician and to check the prescriber on any clinic page.',
  },
  {
    slug: 'iron-infusion-insurance-coverage-canada-2026',
    workingTitle: 'Is Iron Infusion Covered by Insurance in Canada? OHIP, Canada Life, Sun Life (2026)',
    category: 'Cost & Insurance',
    kind: 'evergreen',
    relatedCities: ['Toronto', 'Vancouver', 'Calgary'],
    angle: 'Answer the three questions people type: is iron infusion covered by OHIP (hospital route yes, private clinic visit no), by Canada Life and Sun Life (the iron drug may be a drug benefit with a prescription; the infusion fee usually is not; check the plan), and what paperwork helps (prescription, receipt with DIN, physician letter). Neutral, no plan-specific promises, no prices.',
  },
  {
    slug: 'glutathione-iv-montreal-2026',
    workingTitle: 'Glutathione IV in Montreal: What It Is, What to Ask, and Where to Look (2026)',
    category: 'City Guides',
    kind: 'city', city: 'Montreal', citySlug: 'montreal',
    relatedCities: ['Montreal', 'Laval', 'Toronto'],
    angle: 'Montreal is our highest click-through city for glutathione searches. Explain what glutathione IV is, what the evidence supports and does not (skin brightening claims are not established), Quebec scope (who may prescribe and administer), and how to compare Montreal clinics using the facts block clinics. No prices.',
  },
  {
    slug: 'how-long-does-an-iv-drip-take-2026',
    workingTitle: 'How Long Does an IV Drip Take? Times by Drip Type (2026)',
    category: 'Educational',
    kind: 'evergreen',
    relatedCities: ['Toronto', 'Vancouver', 'Calgary'],
    angle: 'A practical answer: a hydration or vitamin drip commonly runs 30 to 60 minutes, larger bags and high-dose vitamin C longer, NAD+ 2 hours or more because it must run slowly, plus check-in and assessment time. Explain what makes a drip run slower (dose, tolerance, vein), why a clinic should not rush it, and what to bring. No prices.',
  },
  {
    slug: 'who-can-legally-give-iv-alberta-2026',
    workingTitle: 'Who Can Legally Give IV Therapy in Alberta? (2026)',
    category: 'Educational',
    kind: 'evergreen',
    relatedCities: ['Calgary', 'Edmonton', 'Red Deer'],
    angle: 'Province edition of our best-performing post: in Alberta, physicians (CPSA), nurse practitioners and registered nurses (CRNA) within their scope and with an order, and naturopathic doctors who hold the College of Naturopathic Doctors of Alberta IV special authorization. Explain what a patient can check on each public register and what a clinic should be able to show. No prices, no legal advice beyond the registers.',
  },
  {
    slug: 'who-can-legally-give-iv-quebec-2026',
    workingTitle: 'Who Can Legally Give IV Therapy in Quebec? (2026)',
    category: 'Educational',
    kind: 'evergreen',
    relatedCities: ['Montreal', 'Laval', 'Quebec City'],
    angle: 'Quebec edition: physicians (CMQ), nurses (OIIQ) acting on a prescription, and the fact that naturopathy is not a regulated profession in Quebec, so a naturopath cannot prescribe or give IV therapy there. Explain what patients can check on the CMQ and OIIQ registers and what to ask a Montreal clinic. Neutral and careful. No prices.',
  },
  ...[
    ['Winnipeg', 'winnipeg', ['Winnipeg', 'Toronto', 'Calgary']],
    ['Burlington', 'burlington', ['Burlington', 'Hamilton', 'Oakville']],
    ['Vaughan', 'vaughan', ['Vaughan', 'Toronto', 'Richmond Hill']],
    ['Markham', 'markham', ['Markham', 'Toronto', 'Richmond Hill']],
    ['Brampton', 'brampton', ['Brampton', 'Mississauga', 'Toronto']],
    ['Victoria', 'victoria', ['Victoria', 'Vancouver', 'Burnaby']],
    ['Burnaby', 'burnaby', ['Burnaby', 'Vancouver', 'Surrey']],
    ['Surrey', 'surrey', ['Surrey', 'Vancouver', 'Burnaby']],
    ['Halifax', 'halifax', ['Halifax', 'Toronto', 'Montreal']],
  ].map(([city, citySlug, related]) => ({
    slug: `best-iv-therapy-${citySlug}-2026`,
    workingTitle: `Best IV Therapy in ${city} (2026): Clinics, Safety, and How to Choose`,
    category: 'City Guides',
    kind: 'city' as const,
    city: city as string,
    citySlug: citySlug as string,
    relatedCities: related as string[],
    angle:
      `A practical 2026 guide to IV therapy in ${city} for a first-time patient: what is actually offered locally, ` +
      `how to judge a clinic before booking (who administers, who prescribes, screening, emergency protocol), ` +
      `mobile vs in-clinic, and what provincial insurance does and does not cover. Ground every local claim in the facts block. ` +
      `Mention 3 to 5 of the listed clinics by name with their Google rating, presented neutrally (ratings are from Google, not our endorsement).`,
  })),
  {
    slug: 'how-to-choose-iv-therapy-clinic-canada-2026',
    workingTitle: 'How to Choose an IV Therapy Clinic in Canada (2026)',
    category: 'Educational',
    kind: 'evergreen',
    relatedCities: ['Toronto', 'Vancouver', 'Calgary'],
    angle:
      'A decision framework for choosing a clinic, built around transparency: the seven details a clinic should disclose ' +
      '(who administers, who prescribes/oversees, health screening before treatment, emergency protocol, ingredient sourcing, ' +
      'pricing published, staff credentials verifiable with a provincial regulator). Explain why each matters and how to check it yourself, ' +
      'including looking a nurse or ND up on the public register. No fear-mongering; calm and practical.',
  },
  {
    slug: 'iv-therapy-intake-screening-canada-2026',
    workingTitle: 'What a Good IV Clinic Asks Before Your First Drip',
    category: 'Educational',
    kind: 'evergreen',
    relatedCities: ['Toronto', 'Vancouver', 'Montreal'],
    angle:
      'What proper health screening before elective IV therapy looks like in Canada: the intake questions a careful clinic asks ' +
      '(medications, kidney and heart conditions, allergies, pregnancy), why a required intake step protects the patient, ' +
      'and the red flag of a clinic that will start a line on anyone with a credit card. Practical, not alarmist.',
  },
];

export interface TopicFacts {
  /** Prose block handed to the model as its ONLY permitted source of local facts. */
  block: string;
  /** Clinic names the post is allowed to mention. */
  allowedClinicNames: string[];
  /** Relative internal links the post may use. */
  linkAllowlist: string[];
  /** Dollar amounts that appear in the facts block; the only ones a post may quote. */
  allowedDollarFigures: number[];
}

/** The Price Index rows as prose the model can quote, plus the figures the QA gate will accept. */
function priceFacts(citySlug: string): { lines: string[]; figures: number[]; link: string } | null {
  const idx = getCityPriceIndex(citySlug);
  if (!idx) return null;
  const figures = new Set<number>();
  const lines = [
    `PRICE INDEX for ${idx.city} (${idx.asOf}, ${idx.currency}, published clinic menu prices, one representative price per clinic per drip; ${idx.clinicCount} clinics publish at least one price). You may quote these dollar figures and no others:`,
    ...idx.rows.map((r) => { figures.add(r.low); figures.add(r.median); figures.add(r.high); return `- ${r.treatment}: ${r.clinics} clinics, low $${r.low}, median $${r.median}, high $${r.high}`; }),
    idx.note ? `Index note: ${idx.note}` : '',
    `Full index page: /iv-prices/${idx.citySlug}. Always say prices are published menu prices, dated ${idx.asOf}, not quotes, and that dose and add-ons explain most gaps.`,
  ].filter(Boolean);
  return { lines, figures: [...figures], link: `/iv-prices/${idx.citySlug}` };
}

interface ProviderLite {
  name: string;
  rating: number | null;
  reviews: number | null;
  is_claimed: boolean;
  safety_verified: boolean;
}

export async function buildFacts(sb: SupabaseClient, topic: BlogTopic): Promise<TopicFacts> {
  const linkAllowlist = [
    '/cities',
    '/treatments',
    '/verification',
    '/iv-prices',
    '/quiz',
    '/blog/iv-therapy-insurance-coverage-canada',
    '/blog/who-can-legally-give-iv-canada-rules-by-province-2026',
    '/blog/7-questions-before-iv-therapy',
    ...topic.relatedCities.map((c) => `/cities/${c.toLowerCase().replace(/\s+/g, '-')}`),
  ];
  const price = topic.priceCitySlug ? priceFacts(topic.priceCitySlug) : null;
  if (price) linkAllowlist.push(price.link);
  const priceLines = price ? ['', ...price.lines] : [];
  const allowedDollarFigures = price ? price.figures : [];

  if (topic.kind === 'city' && topic.city) {
    const { data } = await sb
      .from('providers')
      .select('name,rating,reviews,is_claimed,safety_verified')
      .eq('country', 'Canada')
      .eq('is_hidden', false)
      .ilike('city', topic.city)
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(30);
    const provs = (data || []) as ProviderLite[];
    // Dedupe near-identical rows (e.g. "X" and "X (Dr. Y)") so the model is
    // never handed the same clinic twice.
    const seen: string[] = [];
    const top = provs
      .filter((p) => p.rating != null && (p.reviews || 0) >= 20)
      .filter((p) => {
        const n = p.name.toLowerCase();
        if (seen.some((s) => n.startsWith(s) || s.startsWith(n))) return false;
        seen.push(n);
        return true;
      })
      .slice(0, 6);
    const lines = [
      `City: ${topic.city}, Canada.`,
      `Active IV therapy listings we track in ${topic.city}: ${provs.length}.`,
      `Clinics you may mention BY NAME (Google rating / review count as of today):`,
      ...top.map(
        (p) =>
          `- ${p.name}: ${p.rating} stars from ${p.reviews} Google reviews${p.is_claimed ? ' (owner-verified listing on TheDripMap)' : ''}${p.safety_verified ? ' (holds our human-reviewed safety badge)' : ''}`,
      ),
      `Browse-all page for this city: /cities/${topic.citySlug}.`,
      ...priceLines,
    ];
    return { block: lines.join('\n'), allowedClinicNames: top.map((p) => p.name), linkAllowlist, allowedDollarFigures };
  }

  // Evergreen: site-wide grounding only.
  const { count } = await sb
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('country', 'Canada')
    .eq('is_hidden', false);
  const block = [
    `TheDripMap tracks ${count || 'hundreds of'} active IV therapy listings across Canada.`,
    `Each listing shows how much the clinic discloses across seven details patients compare before booking:`,
    `who administers, who prescribes or oversees, health screening before treatment, emergency protocol,`,
    `ingredient sourcing, published pricing, and staff credentials checkable with the provincial regulator.`,
    `Some clinics have had their prescriber checked against the public regulator register (see /verification).`,
    ...priceLines,
  ].join('\n');
  return { block, allowedClinicNames: [], linkAllowlist, allowedDollarFigures };
}

export interface GeneratedPost {
  title: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  content_markdown: string;
}

/** Generic words that look like clinic-name tails but are fine in prose. */
const NAME_FALSE_POSITIVES =
  /^(Canadian|Canada|Provincial|Public|Google|Mobile|Health Canada|Registered|College|Nova Scotia Health|Alberta Health|Ontario Health|Winnipeg Regional Health|Island Health|Fraser Health|Vancouver Coastal Health|Interior Health|Shared Health|Manitoba Health|First Nations Health)\b/i;

/**
 * The hard gates. Returns [] when the post may publish; otherwise every reason
 * it may not. Test OUTPUT, not intent: each check exists because the failure
 * it prevents actually happened once.
 */
export function qaGates(post: GeneratedPost, topic: BlogTopic, facts: TopicFacts): string[] {
  const fails: string[] = [];
  const all = [post.title, post.meta_title, post.meta_description, post.excerpt, post.content_markdown].join('\n');

  if (/[–—]/.test(all)) fails.push('contains an en/em dash');
  if (/directory/i.test(all)) fails.push('contains the banned word "directory"');
  if (!post.meta_title || post.meta_title.length > 60) fails.push(`meta_title length ${post.meta_title?.length} (must be 1-60)`);
  if (!post.meta_description || post.meta_description.length > 160)
    fails.push(`meta_description length ${post.meta_description?.length} (must be 1-160)`);

  const words = post.content_markdown.split(/\s+/).filter(Boolean).length;
  if (words < 800 || words > 2200) fails.push(`word count ${words} (must be 800-2200)`);

  // Dollar figures: none unless the topic carries a Price Index payload, and
  // then only the figures that appear in it. Anything else is invented.
  const dollars = [...all.matchAll(/\$\s?(\d[\d,]*)/g)].map((m) => Number(m[1].replace(/,/g, '')));
  if (dollars.length && !facts.allowedDollarFigures.length) fails.push('contains a dollar figure (no price data was supplied)');
  for (const d of dollars) {
    if (facts.allowedDollarFigures.length && !facts.allowedDollarFigures.includes(d)) fails.push(`dollar figure $${d} is not in the Price Index facts`);
  }

  // Market superlatives that cannot be verified.
  if (/(one of the (highest|largest|biggest|most)|per[- ]capita|fastest[- ]growing market)/i.test(all))
    fails.push('contains an unverifiable market superlative');

  // City grounding: the city name must be woven through the body.
  if (topic.kind === 'city' && topic.city) {
    const n = (post.content_markdown.match(new RegExp(topic.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    if (n < 3) fails.push(`city name "${topic.city}" appears only ${n}x in body (min 3)`);
  }

  // Internal links must be on the allowlist. External links are not allowed at all.
  const links = [...post.content_markdown.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
  for (const href of links) {
    if (/^https?:\/\//i.test(href)) {
      fails.push(`external link not allowed: ${href}`);
    } else if (!facts.linkAllowlist.includes(href.replace(/[#?].*$/, ''))) {
      fails.push(`internal link not on allowlist: ${href}`);
    }
  }

  // Clinic-name grounding: any Business-Name-looking phrase ending in a clinic
  // word must be one we supplied. This is the fabrication tripwire.
  const nameRe =
    /\b([A-Z][\w'&’.-]*(?: [A-Z][\w'&’.-]*){0,5} (?:Clinic|Clinics|Spa|Medspa|MedSpa|Wellness|Lounge|Lab|Labs|Centre|Center|Aesthetics|Naturopathic|Hydration|Infusion|Drip|Bar|Med Spa))\b/g;
  const allowed = facts.allowedClinicNames.map((n) => n.toLowerCase());
  for (const m of post.content_markdown.matchAll(nameRe)) {
    const cand = m[1].trim();
    if (NAME_FALSE_POSITIVES.test(cand)) continue;
    const lc = cand.toLowerCase();
    if (!allowed.some((a) => a.includes(lc) || lc.includes(a))) {
      fails.push(`mentions a clinic-like name not in the facts block: "${cand}"`);
    }
  }

  return fails;
}

export function systemPrompt(): string {
  return [
    'You write for TheDripMap (thedripmap.com), a Canadian matching platform for IV therapy clinics.',
    'House rules, absolute:',
    '- Never use en dashes or em dashes anywhere. Use commas, periods, or the word "to".',
    '- Never use the word "directory". TheDripMap is a "matching platform".',
    '- Every local or numeric claim must come from the FACTS BLOCK in the user message. If a fact is not there, do not state it.',
    '- Never state any price or dollar figure unless the FACTS BLOCK contains a PRICE INDEX; then quote only those exact figures, always as published menu prices with their date.',
    '- Never name a clinic that is not listed in the facts block.',
    '- Never make medical claims; treatments are described neutrally and readers are pointed to the clinic prescriber and their own clinician.',
    '- No superlative market claims (largest, highest per-capita, fastest-growing).',
    '- Internal links only, in markdown, and only to paths in the LINK ALLOWLIST.',
    '- Tone: calm, specific, practical. The reader is a Canadian patient comparing clinics before booking. First person plural ("we track") is fine.',
    '- Google star ratings from the facts block may be cited, attributed to Google, never presented as our endorsement.',
    'You return the post as JSON matching the provided schema. content_markdown uses ## headings (no top-level H1; the site renders the title), 900 to 1600 words.',
  ].join('\n');
}

export function userPrompt(topic: BlogTopic, facts: TopicFacts): string {
  return [
    `Write the blog post "${topic.workingTitle}" (you may refine the title).`,
    '',
    'BRIEF:',
    topic.angle,
    '',
    'FACTS BLOCK (your only source of local facts):',
    facts.block,
    '',
    'LINK ALLOWLIST (relative paths only; use 3 to 6 of them where natural):',
    facts.linkAllowlist.join('\n'),
    '',
    'Also produce: meta_title (<=60 chars, includes the year 2026 where natural), meta_description (<=160 chars, concrete), and a 1-2 sentence excerpt.',
  ].join('\n');
}

export function serviceSupabase(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
