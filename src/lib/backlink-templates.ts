// Backlink outreach email templates, one per target_type.
// The research cron tags each target with a target_type. The drafts cron
// picks the template, asks Claude to personalize the {{placeholders}}
// using the page_title / contact_name / reason from research, and saves
// the result as a Gmail draft for human review.

export type BacklinkTargetType =
  | 'nursing_school'
  | 'healthcare_law'
  | 'wellness_publication'
  | 'nurse_entrepreneur'
  | 'medical_director_match'
  // NYC patient-facing flywheel (added 2026-06-05). These target consumer-side
  // channels that send patient traffic to the NYC city page + the
  // best-iv-therapy-new-york-2026 guide, instead of the B2B operator content.
  | 'nyc_wellness_blog'
  | 'nyc_fitness_studio'
  | 'nyc_hospitality_concierge'
  | 'nyc_local_press'
  | 'nyc_corporate_wellness';

export interface BacklinkTemplate {
  subject: string;
  body: string;
  preferredArticles: string[]; // article slugs that fit this target type
}

const SIGNATURE = `\nTheDripMap Team\nhttps://www.thedripmap.com`;

export const BACKLINK_TEMPLATES: Record<BacklinkTargetType, BacklinkTemplate> = {
  nursing_school: {
    subject: 'Free Resource for Your Students Interested in IV Therapy Entrepreneurship',
    body: `Hi {{contact_name | "Professor"}},

I came across {{page_title}} on the {{organization_name}} site. It's one of the better entrepreneurship resources I've seen for nursing students considering opening their own practice.

We just published two pieces that might be useful for the students you mention exploring this path:

  • IV Therapy Laws by State 2026:
    https://www.thedripmap.com/blog/iv-therapy-laws-by-state-2026
  • Real Startup Cost Breakdown:
    https://www.thedripmap.com/blog/how-much-does-it-cost-to-open-iv-therapy-clinic

Both are free, no signup, and cite their sources (state nursing boards, AMA position papers, etc.). If either is a fit for your resources page, I'd be grateful for the link, and happy to send a summary blurb you can drop in directly.

Either way, thank you for the work you do training the next generation of nurse-entrepreneurs.${SIGNATURE}`,
    preferredArticles: [
      'iv-therapy-laws-by-state-2026',
      'how-much-does-it-cost-to-open-iv-therapy-clinic',
      'how-to-start-iv-therapy-business-2026',
    ],
  },
  healthcare_law: {
    subject: 'Data Resource: IV Therapy Laws by State 2026',
    body: `Hi {{contact_name | "there"}},

I read {{page_title}}. Useful framing of how scope-of-practice rules cross over into the IV therapy market.

We just finished a state-by-state breakdown of IV therapy laws (good-faith exam requirements, who can administer, medical-director rules) sourced from state nursing/medical boards. It might be a citable resource for future pieces on this topic:

  https://www.thedripmap.com/blog/iv-therapy-laws-by-state-2026

We also have a startup-cost piece for the operations side if it's relevant:
  https://www.thedripmap.com/blog/how-much-does-it-cost-to-open-iv-therapy-clinic

No spin, happy to take feedback if anything reads off. If either is a fit for your readers, a link would mean a lot.${SIGNATURE}`,
    preferredArticles: [
      'iv-therapy-laws-by-state-2026',
      'how-much-does-it-cost-to-open-iv-therapy-clinic',
    ],
  },
  wellness_publication: {
    subject: 'Citable Research: IV Therapy Startup Costs 2026',
    body: `Hi {{contact_name | "Editor"}},

{{page_title}} was a thoughtful read. The angle on {{topic_hook | "the wellness boom"}} matched a lot of the founder conversations we've had this year.

We just published a startup-cost breakdown for IV therapy clinics with real 2026 numbers (equipment, medical director, build-out, insurance) sourced from operators and state boards rather than industry vendors:

  https://www.thedripmap.com/blog/how-much-does-it-cost-to-open-iv-therapy-clinic

If you're ever working on a piece about the business side of wellness, it might be a useful citation. Happy to send the data in any format you'd prefer.${SIGNATURE}`,
    preferredArticles: [
      'how-much-does-it-cost-to-open-iv-therapy-clinic',
      'how-to-start-iv-therapy-business-2026',
      'how-to-get-patients-iv-therapy-clinic-without-ads',
    ],
  },
  nurse_entrepreneur: {
    subject: 'Resource for your community: IV therapy startup playbook',
    body: `Hi {{contact_name | "there"}},

I follow what you're building at {{organization_name}}. {{specific_observation | "The founder support is genuinely useful."}}

A lot of nurse-entrepreneurs we talk to are looking at IV therapy as their first practice but get stuck on the legal + budget side. We just put together two pieces that have been getting passed around in those Slack groups:

  • IV Therapy Laws by State 2026:
    https://www.thedripmap.com/blog/iv-therapy-laws-by-state-2026
  • How to Get Patients Without Paid Ads:
    https://www.thedripmap.com/blog/how-to-get-patients-iv-therapy-clinic-without-ads

If you ever round up resources for the community, these are free + linkable. No tracking, no email gate.${SIGNATURE}`,
    preferredArticles: [
      'iv-therapy-laws-by-state-2026',
      'how-to-get-patients-iv-therapy-clinic-without-ads',
      'how-to-start-iv-therapy-business-2026',
    ],
  },
  medical_director_match: {
    subject: 'Guide we wrote for clinic operators looking for a medical director',
    body: `Hi {{contact_name | "there"}},

{{page_title}} clearly answers a real pain point. The operator side of medical director sourcing rarely gets written about honestly.

I run TheDripMap (directory of IV therapy clinics across the US and Canada). We get questions about medical director match weekly, so we wrote a guide explaining what to look for, typical fee structures, and red flags, pulled from our conversations with operators in 30+ markets:

  https://www.thedripmap.com/blog/how-to-find-medical-director-iv-therapy-clinic

If it's a useful complement to your page, a link would be appreciated. Equally happy to be a referral resource the other direction.${SIGNATURE}`,
    preferredArticles: [
      'how-to-find-medical-director-iv-therapy-clinic',
      'iv-therapy-laws-by-state-2026',
    ],
  },

  // ---------- NYC patient-facing flywheel ----------
  nyc_wellness_blog: {
    subject: 'NYC IV therapy resource for your readers',
    body: `Hi {{contact_name | "there"}},

I enjoyed {{page_title}} on {{organization_name}}. The angle on {{topic_hook | "NYC wellness"}} matched what we've been hearing from readers searching for IV therapy in the city.

We just refreshed our 2026 guide to IV therapy in New York: who can legally administer it under NY State law, what to expect at price points across Manhattan and the outer boroughs, and how to vet a clinic before booking:

  https://www.thedripmap.com/blog/best-iv-therapy-new-york-2026

We also keep a maintained directory of every IV clinic in NYC with verified-credential filters:

  https://www.thedripmap.com/cities/new-york

If either is a fit for a roundup or resources page, a link would mean a lot. No tracking, no email gate, both are free.${SIGNATURE}`,
    preferredArticles: [
      'best-iv-therapy-new-york-2026',
    ],
  },

  nyc_fitness_studio: {
    subject: 'IV recovery resource for your members',
    body: `Hi {{contact_name | "there"}},

{{specific_observation | "Your members train hard, so recovery comes up often."}} A lot of NYC fitness clients ask about IV therapy as part of their post-workout or pre-event recovery routine, and there's no shortage of clinics in the city, so the question is usually "which one is safe and worth it."

We maintain a free directory of every IV therapy clinic in NYC with credential filters, mobile-service flags, and price ranges:

  https://www.thedripmap.com/cities/new-york

Plus a 2026 guide that walks through what to look for (medical director, RN-led drips, transparent pricing):

  https://www.thedripmap.com/blog/best-iv-therapy-new-york-2026

If your members would find either useful, we'd be grateful for a mention on your resources page. Happy to send a short blurb you can drop in.${SIGNATURE}`,
    preferredArticles: [
      'best-iv-therapy-new-york-2026',
    ],
  },

  nyc_hospitality_concierge: {
    subject: 'Resource for guests asking about in-room IV therapy',
    body: `Hi {{contact_name | "there"}},

I run TheDripMap, the IV therapy directory for the US and Canada. We hear from a fair number of NYC visitors searching for in-room or hotel-delivered IV drips, usually after a flight or a long event night, and we know concierge desks field the same questions.

We keep a maintained list of NYC clinics that offer mobile and in-room service, with verified clinical staff:

  https://www.thedripmap.com/cities/new-york

Plus a 2026 guide that explains what guests can expect from a typical drip, NY State who-can-administer rules, and price ranges:

  https://www.thedripmap.com/blog/best-iv-therapy-new-york-2026

If a link from your guest resources page makes sense, a mention would be appreciated. Equally happy to be a referral resource the other way if you want a verified concierge partner list.${SIGNATURE}`,
    preferredArticles: [
      'best-iv-therapy-new-york-2026',
    ],
  },

  nyc_local_press: {
    subject: 'Source for your IV therapy coverage in NYC',
    body: `Hi {{contact_name | "there"}},

I read {{page_title}}. {{topic_hook | "Your coverage of the NYC wellness market"}} has been some of the most grounded reporting on the space.

I run TheDripMap, an IV therapy directory covering the US and Canada. We track every NYC clinic, their credentials, and pricing, and we just published a 2026 New York guide pulling together who can legally administer IV therapy under NY State rules, average prices across the boroughs, and red flags to watch for:

  https://www.thedripmap.com/blog/best-iv-therapy-new-york-2026

If a future piece touches IV therapy, hangover recovery, or the broader NYC wellness industry, we're a free source for data, market commentary, or operator quotes. Happy to provide whatever's useful, with no expectation either way.${SIGNATURE}`,
    preferredArticles: [
      'best-iv-therapy-new-york-2026',
    ],
  },

  nyc_corporate_wellness: {
    subject: 'IV therapy benefit resource for NYC employers',
    body: `Hi {{contact_name | "there"}},

{{specific_observation | "The corporate wellness work you do in NYC is exactly the kind of context where this lands."}} A growing number of NYC employers are asking about IV therapy as a recovery and wellness perk, and the legal-side and clinical-side answers aren't always easy to find.

We maintain a free directory of NYC IV clinics (credential filters, mobile/in-office service flags, transparent pricing):

  https://www.thedripmap.com/cities/new-york

Plus a 2026 guide covering NY State regulation, typical pricing, and what to look for in a clinic partner:

  https://www.thedripmap.com/blog/best-iv-therapy-new-york-2026

If you ever build a wellness vendor resource for clients, we'd be grateful for the mention. Happy to support program design questions either way.${SIGNATURE}`,
    preferredArticles: [
      'best-iv-therapy-new-york-2026',
    ],
  },
};

export const TARGET_TYPES: BacklinkTargetType[] = [
  'nursing_school',
  'healthcare_law',
  'wellness_publication',
  'nurse_entrepreneur',
  'medical_director_match',
  'nyc_wellness_blog',
  'nyc_fitness_studio',
  'nyc_hospitality_concierge',
  'nyc_local_press',
  'nyc_corporate_wellness',
];

// Subset of TARGET_TYPES that the daily backlink-research cron is allowed to
// auto-discover candidates for via web_search. The NYC patient-side types are
// intentionally EXCLUDED — pitches to wellness editors, fitness studio comms
// leads, hotel concierges, and local press are too high-touch to entrust to an
// AI-found candidate. Those targets are inserted manually by an operator after
// real research (see scripts/backlink-seeds/nyc.md); once inserted, the daily
// drafts cron picks them up and renders the matching template the same way.
export const AUTO_RESEARCH_TYPES: BacklinkTargetType[] = [
  'nursing_school',
  'healthcare_law',
  'wellness_publication',
  'nurse_entrepreneur',
  'medical_director_match',
];

export function getTemplate(type: string): BacklinkTemplate | null {
  return (BACKLINK_TEMPLATES as Record<string, BacklinkTemplate>)[type] || null;
}
