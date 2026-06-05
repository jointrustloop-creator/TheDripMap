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
  'los-angeles': {
    regulationNote: {
      headline: 'Who can legally administer IV therapy in California',
      body:
        'IV administration in California is regulated under the Medical Practice Act and the Nursing Practice Act. Physicians, nurse practitioners, physician assistants, and registered nurses operating under appropriate physician orders can administer IV therapy in the state. Every clinic listed below operates with licensed clinical staff. This is general information, not legal or medical advice, and we recommend confirming credentials with the clinic before booking.',
    },
    useCases: [
      {
        key: 'hangover',
        title: 'Best for hangover recovery',
        blurb:
          'Same-day appointments or in-room mobile drips for fast morning-after recovery in LA.',
        matchAny: ['hangover', 'recovery', 'rehydrate', 'rehydration'],
        maxResults: 5,
      },
      {
        key: 'wellness',
        title: 'Best for ongoing wellness and immunity',
        blurb:
          'Clinics with regular maintenance protocols, Myers cocktails, and immune-support drips.',
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
        title: 'Best for in-home, hotel, and on-set mobile drips',
        blurb:
          'Bring the drip to your home, hotel, trailer, or studio anywhere across LA County.',
        matchAny: ['mobile', 'in-home', 'concierge', 'hotel'],
        maxResults: 5,
      },
    ],
    faqs: [
      {
        question: 'Is IV therapy legal in Los Angeles?',
        answer:
          'Yes. IV administration in California is regulated under the Medical Practice Act and the Nursing Practice Act. Physicians, nurse practitioners, physician assistants, and registered nurses operating under appropriate physician orders can administer IV therapy. All clinics listed on TheDripMap operate with licensed clinical staff. Confirm credentials with the clinic before booking.',
      },
      {
        question: 'Who can administer IV therapy in California?',
        answer:
          'In California, IV administration is performed by licensed physicians (MD or DO), nurse practitioners, physician assistants, and registered nurses working under physician orders or established standing orders. Naturopathic doctor scope in California is more limited than in some other states, so confirm directly with the clinic if you specifically want an ND-led drip.',
      },
      {
        question: 'How much does IV therapy cost in Los Angeles?',
        answer:
          'Standard hydration and wellness drips in LA typically run $175 to $400 USD. NAD+ protocols generally range from $700 to over $1,200 USD depending on dose. Mobile service (in-home, hotel, on-set) usually adds $50 to $150. Final pricing varies by clinic and protocol.',
      },
      {
        question: 'Do Los Angeles clinics offer mobile or in-home IV therapy?',
        answer:
          'Yes. Mobile IV therapy across LA County is mature, with providers serving West LA, Beverly Hills, Hollywood, Studio City, Santa Monica, Pasadena, the South Bay, and the surrounding metro. Many clinics also serve hotels and film sets. Look for the Mobile Service tag in the listings.',
      },
    ],
    links: {
      blogPosts: [
        {
          slug: 'best-iv-therapy-los-angeles-2026',
          label: '2026 guide: best IV therapy in Los Angeles',
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

  'new-york': {
    regulationNote: {
      headline: 'Who can legally administer IV therapy in New York State',
      body:
        'IV administration in New York is regulated by the New York State Education Department and the State Board of Nursing. Physicians, nurse practitioners, physician assistants, and registered nurses working under appropriate orders can administer IV therapy in the state. Every clinic listed below operates with licensed clinical staff. This is general information, not legal or medical advice, and we recommend confirming credentials with the clinic before booking.',
    },
    useCases: [
      {
        key: 'hangover',
        title: 'Best for hangover recovery',
        blurb:
          'Same-day clinic appointments or in-room mobile drips for fast morning-after recovery in NYC.',
        matchAny: ['hangover', 'recovery', 'rehydrate', 'rehydration'],
        maxResults: 5,
      },
      {
        key: 'wellness',
        title: 'Best for ongoing wellness and immunity',
        blurb:
          'Clinics with regular maintenance protocols, Myers cocktails, and immune-support drips.',
        matchAny: ['myers', 'immune', 'wellness', 'vitamin', 'glutathione'],
        maxResults: 5,
      },
      {
        key: 'energy',
        title: 'Best for energy, NAD+, and athletic recovery',
        blurb:
          'Higher-dose energy and recovery protocols, including NAD+ and amino-acid drips for high-output schedules.',
        matchAny: ['nad', 'energy', 'athletic', 'amino', 'performance'],
        maxResults: 5,
      },
      {
        key: 'mobile',
        title: 'Best for in-room, in-office, and in-home mobile drips',
        blurb:
          'Bring the drip to your apartment, hotel room, or midtown office anywhere across the five boroughs.',
        matchAny: ['mobile', 'in-home', 'concierge', 'hotel'],
        maxResults: 5,
      },
    ],
    faqs: [
      {
        question: 'Is IV therapy legal in New York?',
        answer:
          'Yes. IV administration in New York is regulated by the New York State Education Department and the State Board of Nursing. Physicians, nurse practitioners, physician assistants, and registered nurses working under appropriate orders can legally administer IV therapy. All clinics listed on TheDripMap operate with licensed clinical staff. Confirm credentials with the clinic before booking.',
      },
      {
        question: 'Who can administer IV therapy in New York State?',
        answer:
          'In New York, IV administration is performed by licensed physicians (MD or DO), nurse practitioners, physician assistants, and registered nurses working under physician orders. New York does not license naturopathic doctors as primary care providers, so IV drips in NY are typically delivered under the supervision of an MD, DO, or NP.',
      },
      {
        question: 'How much does IV therapy cost in New York City?',
        answer:
          'NYC pricing sits on the higher end of the US market. Standard hydration and wellness drips at Manhattan clinics typically run $200 to $450 USD. NAD+ protocols generally range from $700 to over $1,200 USD depending on dose. Outer-borough and mobile-focused providers are usually $50 to $100 lower. Final pricing varies by clinic and protocol.',
      },
      {
        question: 'Do New York clinics offer mobile or in-home IV therapy?',
        answer:
          'Yes. Mobile IV therapy across NYC is well-developed, with providers serving Manhattan apartments, hotels, and midtown offices, plus the surrounding boroughs of Brooklyn, Queens, the Bronx, and Staten Island. Many providers run extended-hours or near-24/7 service. Look for the Mobile Service tag in the listings.',
      },
    ],
    links: {
      blogPosts: [
        {
          slug: 'best-iv-therapy-new-york-2026',
          label: '2026 guide: best IV therapy in New York',
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

  vancouver: {
    regulationNote: {
      headline: 'Who can legally administer IV therapy in British Columbia',
      body:
        'IV administration is a regulated activity in British Columbia under the Health Professions Act. Physicians, registered nurses, nurse practitioners, and naturopathic physicians with the prescribing and infusion authority granted by the College of Complementary Health Professionals of BC (CCHPBC) can administer IV therapy in the province. Every clinic listed below operates with licensed clinical staff. This is general information, not legal or medical advice, and we recommend confirming credentials with the clinic before booking.',
      linkBlogSlug: 'who-can-legally-give-iv-canada-rules-by-province-2026',
      linkLabel: 'Read the full Canada IV therapy regulation guide',
    },
    useCases: [
      {
        key: 'hangover',
        title: 'Best for hangover recovery',
        blurb:
          'Same-day clinic appointments or in-room mobile drips for fast morning-after recovery in Vancouver.',
        matchAny: ['hangover', 'recovery', 'rehydrate', 'rehydration'],
        maxResults: 5,
      },
      {
        key: 'wellness',
        title: 'Best for ongoing wellness and immunity',
        blurb:
          'Clinics with regular maintenance protocols, Myers cocktails, and immune-support drips.',
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
          'Bring the drip to your home, hotel, or office anywhere across Vancouver, the North Shore, Burnaby, and Richmond.',
        matchAny: ['mobile', 'in-home', 'concierge', 'hotel'],
        maxResults: 5,
      },
    ],
    faqs: [
      {
        question: 'Is IV therapy legal in Vancouver?',
        answer:
          'Yes. IV administration is a regulated activity in British Columbia, but physicians, registered nurses, nurse practitioners, and naturopathic physicians with the appropriate prescribing and infusion authority can legally administer IV therapy. All clinics listed on TheDripMap operate with licensed clinical staff. Confirm credentials with the clinic before booking.',
      },
      {
        question: 'Can a naturopathic doctor give an IV in British Columbia?',
        answer:
          'Naturopathic physicians in BC can administer IV therapy when they hold the IV therapy and chelation prescribing authority granted through the College of Complementary Health Professionals of BC (CCHPBC). Not every ND has this authority, so confirm directly with the clinic if you specifically want an ND-led drip.',
      },
      {
        question: 'How much does IV therapy cost in Vancouver?',
        answer:
          'Standard hydration and wellness drips in Vancouver typically run $200 to $400 CAD. NAD+ protocols generally range from $500 to over $1,000 CAD depending on dose. Mobile (in-home or hotel) service usually adds $50 to $100. Final pricing varies by clinic and protocol.',
      },
      {
        question: 'Do Vancouver clinics offer mobile or in-home IV therapy?',
        answer:
          'Yes. Mobile IV therapy across Metro Vancouver is mature, with providers serving downtown Vancouver, the West End, Kitsilano, Yaletown, plus the North Shore, Burnaby, Richmond, and the surrounding Lower Mainland. Look for the Mobile Service tag in the listings.',
      },
    ],
    links: {
      blogPosts: [
        {
          slug: 'iv-therapy-vancouver-2026-guide',
          label: 'Complete 2026 Vancouver IV therapy guide',
        },
        {
          slug: 'nad-iv-therapy-vancouver-bc',
          label: 'NAD+ IV therapy in Vancouver: real BC pricing',
        },
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
