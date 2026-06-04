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
  | 'medical_director_match';

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
};

export const TARGET_TYPES: BacklinkTargetType[] = [
  'nursing_school',
  'healthcare_law',
  'wellness_publication',
  'nurse_entrepreneur',
  'medical_director_match',
];

export function getTemplate(type: string): BacklinkTemplate | null {
  return (BACKLINK_TEMPLATES as Record<string, BacklinkTemplate>)[type] || null;
}
