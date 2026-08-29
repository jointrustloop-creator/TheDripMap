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
}

/**
 * The queue, in publish order. The route picks the first slug that does not
 * already exist in blog_posts, so re-runs and manual inserts are both safe.
 * Cities chosen 2026-08-28: every one has a /cities page and 6+ active
 * listings, and none has an existing best-iv-therapy post.
 */
export const TOPIC_QUEUE: BlogTopic[] = [
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
    ];
    return { block: lines.join('\n'), allowedClinicNames: top.map((p) => p.name), linkAllowlist };
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
  ].join('\n');
  return { block, allowedClinicNames: [], linkAllowlist };
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

  // No dollar figures: v1 topics carry no price payload, so any price is invented.
  if (/\$\s?\d/.test(all)) fails.push('contains a dollar figure (no price data was supplied)');

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
    '- Never state any price or dollar figure.',
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
