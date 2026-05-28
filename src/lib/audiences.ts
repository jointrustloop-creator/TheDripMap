// "Who We Serve" audience landing pages (/for/[audience]).
//
// These are COMMERCIAL / local-intent pages ("find a clinic near you, open
// now") and are deliberately distinct from the informational /iv-therapy-for/*
// use-case pages (the science deep-dives). Overlapping topics cross-link to
// their /iv-therapy-for/* counterpart so the two reinforce each other on
// Google instead of competing for the same keyword.

const SUPABASE_BASE_URL =
  'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';

export interface AudienceBenefit {
  icon: string; // lucide icon name
  title: string;
  body: string;
}

export interface AudienceCompare {
  heading: string;
  points: string[];
}

export interface Audience {
  slug: string;
  navLabel: string; // label in the "Who We Serve" nav dropdown
  serviceTag: string; // passed to getListingsByService
  eyebrow: string;
  h1: string;
  h1Accent: string; // rendered in emerald serif italic
  heroSub: string;
  heroImage: string;
  metaTitle: string;
  metaDescription: string;
  targetKeyword: string;
  benefitsHeading: string;
  benefits: AudienceBenefit[];
  lookForHeading: string;
  lookFor: string[];
  compare?: { left: AudienceCompare; right: AudienceCompare }; // e.g. mobile vs in-clinic
  popularCities: { name: string; slug: string }[];
  relatedDeepDive?: { label: string; href: string }; // cross-link to /iv-therapy-for/*
  guidesHref: string; // "/guide" for now (Resources hub not built yet)
  faqs: { question: string; answer: string }[];
  quizTitle?: string;
  quizSubtitle?: string;
  mdLedOnly?: boolean;
}

export const AUDIENCES: Audience[] = [
  {
    slug: 'hangover-recovery',
    navLabel: 'Hangover Recovery',
    serviceTag: 'Hangover',
    eyebrow: 'Hangover Recovery',
    h1: 'Hungover? Find a hangover IV clinic',
    h1Accent: 'near you — open now.',
    heroSub:
      'Skip the slow misery of sipping water. A hangover IV rehydrates you, replenishes B-vitamins and electrolytes, and eases nausea — many people feel human again in under an hour. Mobile to your hotel or walk-in nearby.',
    heroImage: `${SUPABASE_BASE_URL}iv-therapy-hangover.jpg`,
    metaTitle: 'IV Therapy for Hangover Recovery — Find a Clinic Near You | TheDripMap',
    metaDescription:
      'Feeling rough? Find a top-rated hangover IV therapy clinic near you — mobile to your hotel or walk-in. Rehydrate, replenish B-vitamins and ease nausea in under an hour.',
    targetKeyword: 'hangover iv near me',
    benefitsHeading: 'Why an IV beats drinking water',
    benefits: [
      {
        icon: 'Droplets',
        title: '100% absorbed',
        body: 'Fluids go straight into your bloodstream, bypassing a queasy stomach that can barely keep water down.',
      },
      {
        icon: 'Zap',
        title: 'B-vitamins restore energy',
        body: 'A B-complex blend supports your liver as it clears the night before — and helps lift the fog.',
      },
      {
        icon: 'HeartPulse',
        title: 'Anti-nausea support',
        body: 'Most hangover drips can add anti-nausea medication so you can actually get on with your day.',
      },
      {
        icon: 'Timer',
        title: 'Relief in under an hour',
        body: 'A typical session runs 45–60 minutes. Many people report feeling noticeably better before it even ends.',
      },
    ],
    lookForHeading: 'What to look for in a hangover clinic',
    lookFor: [
      'A licensed physician (MD) or nurse practitioner providing medical oversight',
      'A registered nurse (RN) — not a technician — placing your IV',
      'Transparent, upfront pricing with no surprise add-on fees',
      'Open late or fast mobile dispatch to your home, hotel, or Airbnb',
    ],
    compare: {
      left: {
        heading: 'Mobile (comes to you)',
        points: [
          'Treats you in your home, hotel, or Airbnb',
          'Ideal when you can barely get out of bed',
          'No driving while you recover',
          'Great for groups — bachelor/ette parties and weddings',
        ],
      },
      right: {
        heading: 'In-clinic (you go to them)',
        points: [
          'Often a lower price per session',
          'Walk-in or same-hour appointments',
          'Faster if a clinic is close by',
          'Relax in a lounge-style drip bar',
        ],
      },
    },
    popularCities: [
      { name: 'Las Vegas', slug: 'las-vegas' },
      { name: 'Miami', slug: 'miami' },
      { name: 'New York', slug: 'new-york' },
      { name: 'Toronto', slug: 'toronto' },
    ],
    relatedDeepDive: {
      label: 'The science: does an IV really help a hangover?',
      href: '/iv-therapy-for/hangover',
    },
    guidesHref: '/guide',
    faqs: [
      {
        question: 'How do I find a hangover IV clinic open near me right now?',
        answer:
          'Enter your city in the search above to see top-rated clinics in your area, or take our 60-second quiz. Many clinics offer same-day in-clinic appointments, and mobile providers can often come to your home or hotel within a couple of hours.',
      },
      {
        question: 'Is a hangover IV better than just drinking water?',
        answer:
          'IV fluids are delivered directly into your bloodstream, so they rehydrate you far faster than oral fluids — especially if you feel too nauseous to drink. The added B-vitamins, electrolytes, and optional anti-nausea support address symptoms water alone can\'t.',
      },
      {
        question: 'Can I get a hangover IV at my hotel or home?',
        answer:
          'Yes. Many mobile IV services come to your hotel room, Airbnb, or home — which is popular with travelers in cities like Las Vegas and Miami, and with wedding parties recovering the morning after.',
      },
      {
        question: 'How much does a hangover IV cost?',
        answer:
          'Prices typically range from about $150 to $350 depending on the ingredients and whether you choose in-clinic or mobile service. Mobile visits usually cost a bit more for the convenience.',
      },
      {
        question: 'How quickly will I feel better?',
        answer:
          'Most people report a meaningful improvement in headache and nausea within 30 to 60 minutes — often before the drip even finishes.',
      },
      {
        question: 'How do I know a hangover clinic is safe?',
        answer:
          'Look for a clinic with a licensed medical director (MD or NP) and a registered nurse administering your IV. On TheDripMap, look for clinics that display verified safety details on their profile.',
      },
    ],
    quizTitle: 'Not sure which hangover drip you need?',
    quizSubtitle:
      'Answer a few quick questions and we\'ll match you to the right IV therapy clinic near you.',
  },
];

export function getAudienceBySlug(slug: string): Audience | undefined {
  return AUDIENCES.find((a) => a.slug === slug);
}
