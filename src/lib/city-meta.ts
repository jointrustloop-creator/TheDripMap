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
        'Vancouver is the second-largest IV therapy market on TheDripMap, with clinics serving Vancouver proper, the North Shore, Burnaby, and Richmond. The local mix runs across hydration, NAD+, immune support, glutathione, Myers cocktail, and beauty drips, and a notable share of listed clinics offer mobile in-home and hotel service. British Columbia reorganized its health professions regulation under the Health Professions and Occupations Act in 2026. The British Columbia College of Nurses and Midwives (BCCNM) regulates RNs, NPs, LPNs, and registered psychiatric nurses, and BC LPNs may perform IV therapy with the appropriate education within the BCCNM standards. The College of Physicians and Surgeons of BC (CPSBC) regulates physicians, who sign the directives nurse-led clinics follow. Naturopathic doctors in BC are regulated by the College of Complementary Health Professionals of BC (CCHPBC), the successor to the former CNPBC, and ND-led IV is common in Vancouver, Victoria, and Kelowna. The BC ND scope differs from Ontario, so confirm what a specific clinic is authorized to deliver. General information only, not legal or medical advice. Always confirm suitability and clinician credentials with the clinic before booking.',
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
          'Each Vancouver clinic sets its own pricing, so check the individual clinic listing for current rates. As a general market guide, wellness drips like hydration and Myers cocktail tend to sit in the low to mid hundreds, with NAD+ protocols typically running higher because of the longer session and the dose. Always confirm with the clinic before booking.',
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
        'Toronto is the largest IV therapy market on TheDripMap, with clinics serving downtown Toronto, North York, Scarborough, Etobicoke, and the surrounding GTA. The local mix runs across hydration, hangover recovery, Myers cocktail, NAD+, immune support, and beauty drips, and a substantial subset of the listed clinics offer mobile in-home or hotel service across the GTA. Administering an IV is a regulated activity in Ontario. The College of Physicians and Surgeons of Ontario (CPSO) regulates physicians, the College of Nurses of Ontario (CNO) regulates RNs, NPs, and RPNs, and the College of Naturopaths of Ontario (CONO) authorizes naturopathic doctors who have passed the Intravenous Infusion Therapy (IVIT) Exam to administer a defined set of IV substances on inspected premises. Most wellness IV in Toronto is delivered either by an RN under a medical directive signed by a physician or NP, or by a CONO-authorized ND on CONO-inspected premises. Both models are legitimate. General information only, not legal or medical advice. Always confirm suitability and clinician credentials with the clinic before booking.',
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
          'Each Toronto clinic sets its own pricing, so check the individual clinic listing for current rates. As a general market guide, wellness drips like hydration and Myers cocktail tend to sit in the low to mid hundreds, with NAD+ protocols typically running higher because of the longer session and the dose. Always confirm with the clinic before booking.',
      },
      {
        question: 'Do Toronto clinics offer mobile or in-home IV therapy?',
        answer:
          'Yes. Mobile IV therapy across the GTA is mature, with providers serving downtown Toronto, North York, Scarborough, Etobicoke, and the surrounding suburbs including Mississauga, Markham, Vaughan, Richmond Hill, Brampton, Oakville, and Burlington. Look for the Mobile Service tag in the listings.',
      },
      {
        question: 'How much does an iron infusion cost in Toronto?',
        answer:
          'Iron infusion pricing in Toronto varies meaningfully by clinic and by whether the infusion is delivered as a wellness service or as a medical service for diagnosed iron-deficiency anemia. As a general market guide, private iron infusions at IV clinics typically sit in the mid hundreds of CAD per session, with the exact price depending on the dose, the iron formulation, and whether a physician consult is bundled. If your family doctor has documented iron-deficiency anemia, ask whether an OHIP-covered hospital outpatient route is available before paying privately. Always confirm current pricing with the clinic.',
      },
      {
        question: 'What does a bachelorette or group IV in Toronto cost?',
        answer:
          'Bachelorette and group IV bookings in Toronto are usually quoted per person with a minimum head count, typically three to six guests. Per-person rates are commonly discounted compared to the solo walk-in price for the same drip, particularly on hydration and Myers-style cocktails. Mobile providers add a travel and setup fee on top of the per-person drip, which scales with the distance from central Toronto. Confirm the minimum group size, the per-person rate, and any travel fee with the clinic before booking.',
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

  'north-york': {
    faqs: [
      {
        question: 'How much does an iron infusion cost in North York?',
        answer:
          'Iron infusion pricing in North York varies by clinic, by whether the session is delivered as a wellness or medical service, and by the iron formulation and dose. As a general market guide, private iron infusions at North York IV clinics tend to sit in the mid hundreds of CAD per session, with a physician or naturopath consult sometimes bundled. If you have a documented diagnosis of iron-deficiency anemia, ask your family doctor about an OHIP-covered hospital outpatient route before paying privately. Confirm current pricing with the clinic.',
      },
      {
        question: 'What does a bachelorette or group IV in North York cost?',
        answer:
          'Group bookings in North York are usually quoted per person with a minimum head count, typically three to six guests. Per-person rates are commonly lower than solo walk-in pricing for the same drip, particularly on hydration and Myers-style cocktails. Mobile providers serving the north GTA add a travel and setup fee on top of the per-person rate. Confirm the minimum group size, per-person price, and any travel fee with the clinic.',
      },
    ],
  },

  mississauga: {
    faqs: [
      {
        question: 'What does a bachelorette or group IV in Mississauga cost?',
        answer:
          'Group bookings in Mississauga are usually quoted per person with a minimum head count, typically three to six guests. Per-person rates are commonly lower than the solo walk-in price for the same drip, and Mississauga clinics often sit slightly below comparable Toronto pricing on hydration and Myers-style cocktails. Mobile providers serving Peel region add a travel and setup fee on top of the per-person rate, which scales with the venue distance. Confirm group minimum, per-person rate, and travel fee with the clinic before booking.',
      },
    ],
  },

  oakville: {
    faqs: [
      {
        question: 'How much does an iron infusion cost in Oakville?',
        answer:
          'Iron infusion pricing in Oakville varies by clinic, by whether the session is delivered as a wellness or medical service, and by the iron formulation and dose. As a general market guide, private iron infusions at Oakville IV clinics tend to sit in the mid hundreds of CAD per session, often slightly above the broader GTA average given the local pricing landscape. If you have a documented diagnosis of iron-deficiency anemia, ask your family doctor about an OHIP-covered hospital outpatient route before paying privately. Always confirm current pricing with the clinic.',
      },
      {
        question: 'What does a bachelorette or wedding-day IV in Oakville cost?',
        answer:
          'Group and wedding-day bookings in Oakville are usually quoted per person with a minimum head count, typically three to six guests. Per-person rates are commonly lower than solo walk-in pricing for the same drip. Mobile providers serving the Oakville and Burlington waterfront add a travel and setup fee on top of the per-person rate. Confirm group minimum, per-person price, and any travel fee with the clinic before booking.',
      },
    ],
  },

  'richmond-hill': {
    faqs: [
      {
        question: 'How much does an iron infusion cost in Richmond Hill?',
        answer:
          'Iron infusion pricing in Richmond Hill varies by clinic, by whether the session is delivered as a wellness or medical service, and by the iron formulation and dose. As a general market guide, private iron infusions at Richmond Hill IV clinics tend to sit in the mid hundreds of CAD per session, broadly in line with the wider York region. If you have a documented diagnosis of iron-deficiency anemia, ask your family doctor about an OHIP-covered hospital outpatient route before paying privately. Confirm current pricing with the clinic.',
      },
      {
        question: 'What does a bachelorette or wedding-day IV in Richmond Hill cost?',
        answer:
          'Group bookings in Richmond Hill are usually quoted per person with a minimum head count, typically three to six guests. Per-person rates are commonly lower than solo walk-in pricing for the same drip. Mobile providers serving north York region add a travel and setup fee on top of the per-person rate, which scales with the venue distance. Confirm group minimum, per-person price, and any travel fee with the clinic.',
      },
    ],
  },

  burlington: {
    faqs: [
      {
        question: 'How much does an iron infusion cost in Burlington?',
        answer:
          'Iron infusion pricing in Burlington varies by clinic, by whether the session is delivered as a wellness or medical service, and by the iron formulation and dose. As a general market guide, private iron infusions at Burlington IV clinics tend to sit in the mid hundreds of CAD per session, broadly in line with the wider Halton region. If you have a documented diagnosis of iron-deficiency anemia, ask your family doctor about an OHIP-covered hospital outpatient route before paying privately. Confirm current pricing with the clinic.',
      },
      {
        question: 'What does a bachelorette or wedding-day IV in Burlington cost?',
        answer:
          'Group bookings in Burlington are usually quoted per person with a minimum head count, typically three to six guests. Per-person rates are commonly lower than the solo walk-in price for the same drip. Mobile providers serving the Burlington and Oakville waterfront add a travel and setup fee on top of the per-person rate. Confirm group minimum, per-person price, and any travel fee with the clinic.',
      },
    ],
  },
  'calgary': {
    regulationNote: {
      headline: `Who can administer IV therapy in Alberta`,
      body: `In Alberta, IV therapy is provided by licensed clinicians under the province's health-profession colleges: physicians, nurse practitioners and registered nurses, and naturopathic doctors who hold intravenous certification. The clinics listed here operate with licensed clinical staff. This is general information, not legal or medical advice, so confirm credentials with the clinic before booking.`,
    },
    useCases: [
      { key: 'recovery', title: `Best for hangover and athletic recovery`, blurb: `Same-day and mobile drips for recovery after a night out, Stampede, or a hard training block.`, matchAny: ['hangover', 'recovery', 'rehydrate', 'athletic', 'amino'], maxResults: 5 },
      { key: 'wellness', title: `Best for ongoing wellness and immunity`, blurb: `Maintenance protocols, Myers cocktails, and immune-support drips for regular use.`, matchAny: ['myers', 'immune', 'wellness', 'vitamin', 'glutathione'], maxResults: 5 },
      { key: 'energy', title: `Best for energy and NAD+`, blurb: `Higher-dose energy and longevity protocols, including NAD+ and B-complex drips.`, matchAny: ['nad', 'energy', 'b12', 'b-complex'], maxResults: 5 },
      { key: 'mobile', title: `Best for in-home and hotel mobile drips`, blurb: `Bring the drip to your home, office, or hotel across Calgary and nearby communities.`, matchAny: ['mobile', 'in-home', 'concierge', 'hotel'], maxResults: 5 },
    ],
    faqs: [
      { question: `How much does IV therapy cost in Calgary?`, answer: `Most Calgary clinics charge about $150 to $300 CAD for a standard hydration or wellness drip. NAD+ protocols typically run $350 to $900 depending on dose, and mobile in-home service usually adds $50 to $100. These are typical ranges, so confirm the current price directly with the clinic.` },
      { question: `Is IV therapy legal in Calgary?`, answer: `Yes. In Alberta, IV therapy is administered by licensed physicians, nurse practitioners, registered nurses, and naturopathic doctors with intravenous certification, working under the province's health-profession colleges. Every clinic listed here operates with licensed clinical staff. Confirm credentials with the clinic before booking.` },
      { question: `Is mobile IV therapy available in Calgary?`, answer: `Yes. Many Calgary providers offer mobile service that brings the drip to your home, office, or hotel, including nearby communities like Airdrie and Cochrane. Look for the mobile option in the listings and confirm the service area and any travel fee when you book.` },
      { question: `How do I choose the best IV therapy in Calgary?`, answer: `Start with your goal. Recovery and hydration drips suit a night out or hard training, Myers cocktails and immune drips suit ongoing wellness, and NAD+ suits energy and longevity goals. Compare the clinics listed here by what they offer and their reviews, then confirm the protocol with the clinic. TheDripMap is a matching platform, not a medical provider.` },
    ],
    links: {
      treatments: ['hydration', 'nad-plus', 'hangover', 'myers-cocktail'],
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
