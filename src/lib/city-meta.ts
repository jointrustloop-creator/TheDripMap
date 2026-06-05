/**
 * city-meta.ts
 *
 * Per-city deep context that goes BEYOND the basic CityIntro (which only
 * carries 1-paragraph local context + pricing + popular treatments). This
 * adds:
 *
 *   - regulationNote: a callout box explaining who can legally administer
 *     IV therapy in the relevant jurisdiction. Optional internal link to
 *     a longer regulation blog post.
 *   - useCases: 3-5 curated groupings ("Best for hangover recovery",
 *     "Best for mobile in-home drips", etc.) rendered as sub-sections
 *     under the main listings. Each use-case has a matcher (services,
 *     specialties, description keywords, mobile flag) and a cap.
 *   - faqs: city-specific FAQs appended to the generic 3 so the FAQPage
 *     JSON-LD becomes a real ranking asset for "is iv therapy legal in
 *     {city}", "how much does iv therapy cost in {city}", etc.
 *   - links: blog posts + treatment slugs to surface in the internal-link
 *     rail at the bottom of the page.
 *
 * Toronto ships first as the gold-standard template. Other cities can be
 * added as their listings deepen; absence is silently ignored by the city
 * page (graceful degrade to the existing layout).
 *
 * IMPORTANT: All copy in this file is general information, not legal or
 * medical advice. Regulation summaries are framed accordingly. Pricing
 * ranges are described as typical and tied to "confirm with the clinic."
 * No promised medical outcomes.
 */
import { Provider } from '../types';

export interface CityRegulationNote {
  headline: string;
  body: string;
  linkBlogSlug?: string;
  linkLabel?: string;
}

export interface CityUseCase {
  key: string;
  title: string;
  blurb: string;
  // Matcher: any clinic whose services / specialties / description matches
  // any of these strings (case-insensitive) qualifies. Mobile flag is
  // matched directly when 'mobile' is in matchAny.
  matchAny: string[];
  maxResults?: number;
}

export interface CityFaq {
  question: string;
  answer: string;
}

export interface CityLinks {
  blogPosts?: { slug: string; label: string }[];
  treatments?: string[]; // slugs into /treatments/[slug]
}

export interface CityMeta {
  regulationNote?: CityRegulationNote;
  useCases?: CityUseCase[];
  faqs?: CityFaq[];
  links?: CityLinks;
}

const metas: Record<string, CityMeta> = {
  toronto: {
    regulationNote: {
      headline: 'Who can legally administer IV therapy in Ontario',
      body:
        'IV administration is a controlled act under the Regulated Health Professions Act in Ontario. Registered nurses, nurse practitioners, physicians, and naturopaths with the appropriate IV infusion authorization can legally administer IV therapy in the province. Every clinic listed below operates with licensed clinical staff. This is general information, not legal or medical advice, and we recommend confirming credentials with the clinic before booking.',
      linkBlogSlug: 'who-can-legally-give-iv-canada-rules-by-province-2026',
      linkLabel: 'Read the full Canada IV therapy regulation guide',
    },
    useCases: [
      {
        key: 'hangover',
        title: 'Best for hangover recovery',
        blurb:
          'Same-day appointments or in-room mobile drips that get you back on your feet after a long night.',
        matchAny: ['hangover', 'recovery', 'rehydrate', 'rehydration'],
        maxResults: 5,
      },
      {
        key: 'wellness',
        title: 'Best for ongoing wellness and immunity',
        blurb:
          'Clinics with regular maintenance protocols, Myers cocktails, and immune support drips.',
        matchAny: ['myers', 'immune', 'wellness', 'vitamin', 'glutathione'],
        maxResults: 5,
      },
      {
        key: 'energy',
        title: 'Best for energy, NAD+, and athletic recovery',
        blurb:
          'Higher-dose energy and recovery protocols, including NAD+ and amino-acid drips.',
        matchAny: ['nad', 'energy', 'athletic', 'amino', 'performance'],
        maxResults: 5,
      },
      {
        key: 'mobile',
        title: 'Best for in-home and hotel mobile drips',
        blurb:
          'Bring the drip to your condo, hotel room, or office anywhere across Toronto and the GTA.',
        matchAny: ['mobile', 'in-home', 'concierge', 'hotel'],
        maxResults: 5,
      },
    ],
    faqs: [
      {
        question: 'Is IV therapy legal in Toronto?',
        answer:
          'Yes. IV administration is a controlled act in Ontario, but registered nurses, nurse practitioners, physicians, and naturopaths with the appropriate authorization can legally administer IV therapy. All clinics listed on TheDripMap operate with licensed clinical staff. Confirm credentials with the clinic before booking.',
      },
      {
        question: 'Can a naturopathic doctor give an IV in Ontario?',
        answer:
          'Naturopathic doctors in Ontario can administer IV therapy when they hold the IV infusion authorization from the College of Naturopaths of Ontario (CONO). Not every ND has this authorization, so confirm directly with the clinic if you specifically want an ND-led drip.',
      },
      {
        question: 'How much does IV therapy cost in Toronto?',
        answer:
          'Standard hydration and wellness drips in Toronto typically run $175 to $350 CAD. NAD+ protocols generally range from $400 to over $1,000 CAD depending on dose. Mobile (in-home or hotel) service usually adds $50 to $100. Final pricing varies by clinic and protocol.',
      },
      {
        question: 'Do Toronto clinics offer mobile or in-home IV therapy?',
        answer:
          'Yes. Mobile IV therapy across the GTA is mature, with providers serving downtown Toronto, North York, Scarborough, Etobicoke, and the surrounding suburbs including Mississauga, Markham, Vaughan, Richmond Hill, Brampton, Oakville, and Burlington. Look for the Mobile Service tag in the listings.',
      },
    ],
    links: {
      blogPosts: [
        {
          slug: 'who-can-legally-give-iv-canada-rules-by-province-2026',
          label: 'Canada IV therapy regulation by province',
        },
      ],
      treatments: [
        'hangover-recovery',
        'myers-cocktail',
        'nad-plus-therapy',
        'immune-support',
        'hydration',
        'beauty-glow',
        'energy-boost',
        'athletic-recovery',
      ],
    },
  },
};

export function getCityMeta(slug: string): CityMeta | undefined {
  return metas[slug.toLowerCase()];
}

/**
 * Filter a pool of providers by a use case's matchers. Mobile is matched
 * via the boolean flag; all other strings are matched (case-insensitive)
 * against the clinic's services names + descriptions, specialties, and
 * the clinic description.
 */
export function filterByUseCase(
  providers: Provider[],
  useCase: CityUseCase
): Provider[] {
  const matchers = useCase.matchAny.map((m) => m.toLowerCase());
  const wantsMobile = matchers.includes('mobile');
  const out: Provider[] = [];

  for (const p of providers) {
    let matched = false;
    if (wantsMobile && p.mobile_service) matched = true;

    if (!matched) {
      const haystack = [
        p.description || '',
        ...(p.specialties || []),
        ...(p.services || []).map((s) => `${s.name} ${s.description || ''}`),
        ...(p.subtypes || []),
        p.category || '',
      ]
        .join(' ')
        .toLowerCase();

      for (const m of matchers) {
        if (m === 'mobile') continue; // handled above
        if (haystack.includes(m)) {
          matched = true;
          break;
        }
      }
    }

    if (matched) out.push(p);
    if (out.length >= (useCase.maxResults || 5)) break;
  }

  return out;
}
