// "Who We Serve" audience landing pages (/for/[audience]).
//
// These are COMMERCIAL / local-intent pages ("find a clinic near you, open
// now") and are deliberately distinct from the informational /iv-therapy-for/*
// use-case pages (the science deep-dives). Overlapping topics cross-link to
// their /iv-therapy-for/* counterpart so the two reinforce each other on
// Google instead of competing for the same keyword.
//
// Most audiences are consumer-facing (kind: 'patient', the default). The
// practitioners page is a recruitment page (kind: 'provider') — it hides the
// patient clinic-discovery sections and points its CTAs at the claim flow.

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

export interface AudienceCta {
  label: string;
  href: string;
}

export interface Audience {
  slug: string;
  navLabel: string; // label in the "Who We Serve" nav dropdown
  serviceTag: string; // passed to getListingsByService
  kind?: 'patient' | 'provider'; // default 'patient'
  eyebrow: string;
  h1: string;
  h1Accent: string; // rendered in emerald serif italic
  heroSub: string;
  heroImage: string;
  metaTitle: string;
  metaDescription: string;
  targetKeyword: string;
  // Optional hero CTA overrides (provider variant points these at the claim flow)
  primaryCta?: AudienceCta;
  secondaryCta?: AudienceCta;
  trustChips?: string[];
  benefitsHeading: string;
  benefits: AudienceBenefit[];
  lookForHeading: string;
  lookFor: string[];
  compare?: { left: AudienceCompare; right: AudienceCompare };
  hideClinics?: boolean; // provider variant hides the "top clinics" section
  popularCities: { name: string; slug: string }[];
  relatedDeepDive?: { label: string; href: string }; // cross-link to /iv-therapy-for/*
  guidesHref: string;
  faqs: { question: string; answer: string }[];
  // Bottom CTA: provider variant uses a custom claim CTA instead of the quiz CTA.
  bottomCta?: { title: string; subtitle: string; buttonLabel: string; href: string };
  quizTitle?: string;
  quizSubtitle?: string;
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
      { icon: 'Droplets', title: '100% absorbed', body: 'Fluids go straight into your bloodstream, bypassing a queasy stomach that can barely keep water down.' },
      { icon: 'Zap', title: 'B-vitamins restore energy', body: 'A B-complex blend supports your liver as it clears the night before — and helps lift the fog.' },
      { icon: 'HeartPulse', title: 'Anti-nausea support', body: 'Most hangover drips can add anti-nausea medication so you can actually get on with your day.' },
      { icon: 'Timer', title: 'Relief in under an hour', body: 'A typical session runs 45–60 minutes. Many people report feeling noticeably better before it even ends.' },
    ],
    lookForHeading: 'What to look for in a hangover clinic',
    lookFor: [
      'A licensed physician (MD) or nurse practitioner providing medical oversight',
      'A registered nurse (RN) — not a technician — placing your IV',
      'Transparent, upfront pricing with no surprise add-on fees',
      'Open late or fast mobile dispatch to your home, hotel, or Airbnb',
    ],
    compare: {
      left: { heading: 'Mobile (comes to you)', points: ['Treats you in your home, hotel, or Airbnb', 'Ideal when you can barely get out of bed', 'No driving while you recover', 'Great for groups — bachelor/ette parties and weddings'] },
      right: { heading: 'In-clinic (you go to them)', points: ['Often a lower price per session', 'Walk-in or same-hour appointments', 'Faster if a clinic is close by', 'Relax in a lounge-style drip bar'] },
    },
    popularCities: [
      { name: 'Las Vegas', slug: 'las-vegas' },
      { name: 'Miami', slug: 'miami' },
      { name: 'New York', slug: 'new-york' },
      { name: 'Toronto', slug: 'toronto' },
    ],
    relatedDeepDive: { label: 'The science: does an IV really help a hangover?', href: '/iv-therapy-for/hangover' },
    guidesHref: '/guide',
    faqs: [
      { question: 'How do I find a hangover IV clinic open near me right now?', answer: 'Enter your city in the search above to see top-rated clinics in your area, or take our 60-second quiz. Many clinics offer same-day in-clinic appointments, and mobile providers can often come to your home or hotel within a couple of hours.' },
      { question: 'Is a hangover IV better than just drinking water?', answer: 'IV fluids are delivered directly into your bloodstream, so they rehydrate you far faster than oral fluids — especially if you feel too nauseous to drink. The added B-vitamins, electrolytes, and optional anti-nausea support address symptoms water alone can\'t.' },
      { question: 'Can I get a hangover IV at my hotel or home?', answer: 'Yes. Many mobile IV services come to your hotel room, Airbnb, or home — which is popular with travelers in cities like Las Vegas and Miami, and with wedding parties recovering the morning after.' },
      { question: 'How much does a hangover IV cost?', answer: 'Prices typically range from about $150 to $350 depending on the ingredients and whether you choose in-clinic or mobile service. Mobile visits usually cost a bit more for the convenience.' },
      { question: 'How quickly will I feel better?', answer: 'Most people report a meaningful improvement in headache and nausea within 30 to 60 minutes — often before the drip even finishes.' },
      { question: 'How do I know a hangover clinic is safe?', answer: 'Look for a clinic with a licensed medical director (MD or NP) and a registered nurse administering your IV. On TheDripMap, look for clinics that display verified safety details on their profile.' },
    ],
    quizTitle: 'Not sure which hangover drip you need?',
    quizSubtitle: 'Answer a few quick questions and we\'ll match you to the right IV therapy clinic near you.',
  },

  {
    slug: 'patients',
    navLabel: 'Patients & Wellness Seekers',
    serviceTag: 'IV Therapy',
    eyebrow: 'Patients & Wellness Seekers',
    h1: 'Find the right IV therapy clinic',
    h1Accent: 'for your needs.',
    heroSub:
      'IV therapy can help with energy, hydration, immunity, recovery and more — but the clinic you choose matters as much as the drip. Compare verified providers near you and get matched to the right one in 60 seconds.',
    heroImage: `${SUPABASE_BASE_URL}iv-therapy-group-clinic.jpg`,
    metaTitle: 'IV Therapy Near You — Find a Trusted, Verified Clinic | TheDripMap',
    metaDescription:
      'New to IV therapy? Compare verified IV clinics near you, learn what to look for, and get matched to the right provider for your goals in 60 seconds.',
    targetKeyword: 'iv therapy near me',
    benefitsHeading: 'How TheDripMap helps you choose',
    benefits: [
      { icon: 'Search', title: 'Compare real clinics', body: 'Browse verified providers near you with real ratings, services, and hours — not paid ads.' },
      { icon: 'ShieldCheck', title: 'See who is verified', body: 'We surface clinics with confirmed medical oversight so you can book with confidence.' },
      { icon: 'Sparkles', title: 'Match in 60 seconds', body: 'Answer a few questions and we recommend the best-fit clinic for your goals.' },
      { icon: 'Heart', title: 'Built around your goals', body: 'Energy, hydration, immunity, recovery, beauty — find clinics that specialize in what you need.' },
    ],
    lookForHeading: 'What to look for before you book',
    lookFor: [
      'A licensed physician (MD) or nurse practitioner overseeing care',
      'A registered nurse (RN) placing your IV',
      'Clear pricing and a published menu of drips',
      'Honest reviews and a complete, real clinic profile',
    ],
    popularCities: [
      { name: 'New York', slug: 'new-york' },
      { name: 'Los Angeles', slug: 'los-angeles' },
      { name: 'Toronto', slug: 'toronto' },
      { name: 'Miami', slug: 'miami' },
    ],
    relatedDeepDive: { label: 'Explore every IV treatment we cover', href: '/treatments' },
    guidesHref: '/guide',
    faqs: [
      { question: 'Is IV therapy safe?', answer: 'When administered by qualified medical staff, IV therapy is generally well tolerated. The most important factor is the clinic: choose one with a licensed medical director and a registered nurse administering your drip. Always disclose your medical history and medications first.' },
      { question: 'How do I choose the right clinic?', answer: 'Compare clinics near you on ratings, services, transparency, and verified medical oversight. Our 60-second quiz can match you to a best-fit provider based on your goals and location.' },
      { question: 'How much does IV therapy cost?', answer: 'Most sessions range from about $100 to $350 depending on the drip and your city. Specialty drips like NAD+ cost more. Many clinics offer memberships or packages.' },
      { question: 'Do I need a referral or prescription?', answer: 'For most wellness drips, no referral is needed — you book directly with the clinic. The clinic\'s medical team screens you for safety before treatment.' },
      { question: 'How does TheDripMap matching work?', answer: 'You answer a few quick questions about your goals, location, and preferences, and we recommend clinics that best fit — free, with no obligation to book.' },
    ],
    quizTitle: 'Not sure where to start?',
    quizSubtitle: 'Answer 5 quick questions and we\'ll match you to the right IV therapy clinic near you.',
  },

  {
    slug: 'athletes',
    navLabel: 'Athletes & Performance',
    serviceTag: 'Recovery',
    eyebrow: 'Athletes & Performance',
    h1: 'IV therapy for athletic performance',
    h1Accent: 'and recovery.',
    heroSub:
      'From pre-event hydration to post-event recovery, athletes use IV therapy to rehydrate fast, replenish electrolytes and amino acids, and bounce back sooner. Find clinics near you that specialize in performance.',
    heroImage: `${SUPABASE_BASE_URL}iv-therapy-sports-recovery.jpg`,
    metaTitle: 'IV Therapy for Athletes — Performance & Recovery Clinics Near You | TheDripMap',
    metaDescription:
      'IV therapy for athletic performance and recovery. Find clinics near you offering pre-event hydration, post-event recovery, and NAD+ for endurance.',
    targetKeyword: 'iv therapy for athletes',
    benefitsHeading: 'Why athletes use IV therapy',
    benefits: [
      { icon: 'Droplets', title: 'Pre-event hydration', body: 'Top off fluids and electrolytes before a race or game so you start fully hydrated.' },
      { icon: 'Dumbbell', title: 'Post-event recovery', body: 'Amino acids and magnesium support muscle repair and help ease post-exercise soreness.' },
      { icon: 'Zap', title: 'NAD+ for endurance', body: 'Many endurance athletes use NAD+ to support cellular energy and stamina.' },
      { icon: 'Activity', title: 'Flush metabolic byproducts', body: 'Deep hydration helps clear lactic acid and other byproducts that drive fatigue.' },
    ],
    lookForHeading: 'What to look for in a recovery clinic',
    lookFor: [
      'Medical oversight from an MD or nurse practitioner',
      'A registered nurse (RN) administering your drip',
      'Clean, clearly-labeled ingredients (important if you\'re drug-tested)',
      'Transparent pricing and athlete or membership packages',
    ],
    compare: {
      left: { heading: 'Pre-event', points: ['Hydrate and load electrolytes 24–48h before', 'Supports stamina and reduces cramping risk', 'Great before marathons, fights, and tournaments'] },
      right: { heading: 'Post-event', points: ['Amino acids and magnesium for muscle repair', 'Rehydrate and flush lactic acid', 'Get back to training sooner'] },
    },
    popularCities: [
      { name: 'Los Angeles', slug: 'los-angeles' },
      { name: 'New York', slug: 'new-york' },
      { name: 'Miami', slug: 'miami' },
      { name: 'Austin', slug: 'austin' },
    ],
    relatedDeepDive: { label: 'The science of IV therapy for sports recovery', href: '/iv-therapy-for/sports-recovery' },
    guidesHref: '/guide',
    faqs: [
      { question: 'When should an athlete get an IV — before or after?', answer: 'Both work. A pre-event drip 24–48 hours out tops off hydration and electrolytes; a post-event drip helps with muscle repair and clearing fatigue byproducts.' },
      { question: 'Is IV therapy allowed for competitive athletes?', answer: 'Rules vary by sport and governing body — some restrict IV volume or specific substances. If you\'re drug-tested, choose a clinic with clearly-labeled ingredients and check your sport\'s anti-doping rules.' },
      { question: 'What\'s in an athletic recovery drip?', answer: 'Typically a saline base with electrolytes, B-vitamins, magnesium, and amino acids like glutamine and arginine. Some add NAD+ for endurance support.' },
      { question: 'How much does it cost?', answer: 'Athletic recovery drips usually run about $175 to $350, with some clinics offering athlete packages or memberships.' },
    ],
    quizTitle: 'Find your performance drip',
    quizSubtitle: 'Answer a few questions and we\'ll match you to a recovery-focused clinic near you.',
  },

  {
    slug: 'business-travelers',
    navLabel: 'Business Travelers',
    serviceTag: 'Jet Lag',
    eyebrow: 'Business Travelers',
    h1: 'IV therapy for jet lag',
    h1Accent: 'and travel recovery.',
    heroSub:
      'Land sharp, not sluggish. IV therapy rehydrates you after long flights, resets your energy, and supports your immune system before you travel — many providers come straight to your hotel.',
    heroImage: `${SUPABASE_BASE_URL}iv-therapy-jet-lag.jpg`,
    metaTitle: 'IV Therapy for Jet Lag & Travel Recovery — Clinics Near You | TheDripMap',
    metaDescription:
      'Beat jet lag with IV therapy. Find clinics and mobile providers near major travel hubs offering hydration, energy, and immune support — delivered to your hotel.',
    targetKeyword: 'iv therapy for jet lag',
    benefitsHeading: 'Why travelers use IV therapy',
    benefits: [
      { icon: 'Droplets', title: 'Rehydrate after flights', body: 'Cabin air is dehydrating. An IV restores fluids and electrolytes fast so you feel human on arrival.' },
      { icon: 'Zap', title: 'Reset your energy', body: 'B-vitamins and a tailored blend help you push past the fog of a red-eye or time-zone change.' },
      { icon: 'ShieldCheck', title: 'Immune support before flights', body: 'A vitamin-C and zinc drip is a popular pre-travel booster before packed flights and long trips.' },
      { icon: 'Plane', title: 'Delivered to your hotel', body: 'Many mobile providers come to your hotel or Airbnb — ideal between meetings.' },
    ],
    lookForHeading: 'What to look for on the road',
    lookFor: [
      'A licensed MD or nurse practitioner overseeing care',
      'A registered nurse (RN) administering your drip',
      'Fast mobile dispatch to your hotel, plus clear arrival windows',
      'Transparent pricing with no surprise travel surcharges',
    ],
    compare: {
      left: { heading: 'Mobile to your hotel', points: ['No travel while you recover', 'Perfect between meetings or after a red-eye', 'Great for groups traveling together'] },
      right: { heading: 'In-clinic near the airport', points: ['Often lower cost', 'Walk-in on a layover', 'Relaxing lounge setting'] },
    },
    popularCities: [
      { name: 'New York', slug: 'new-york' },
      { name: 'Los Angeles', slug: 'los-angeles' },
      { name: 'Las Vegas', slug: 'las-vegas' },
      { name: 'Miami', slug: 'miami' },
    ],
    relatedDeepDive: { label: 'The science of IV therapy for jet lag', href: '/iv-therapy-for/jet-lag' },
    guidesHref: '/guide',
    faqs: [
      { question: 'Does IV therapy actually help jet lag?', answer: 'Jet lag is worsened by dehydration and disrupted routines. Rehydrating quickly and replenishing B-vitamins helps many travelers feel more alert — though good sleep and light exposure still matter most.' },
      { question: 'Can a provider come to my hotel?', answer: 'Yes — mobile IV services operate in most major travel hubs and will come to your hotel room or Airbnb, usually within a couple of hours.' },
      { question: 'Should I get an IV before or after flying?', answer: 'Both are common: an immune-support drip before a big trip, and a hydration/energy drip on arrival to shake off the flight.' },
      { question: 'How much does it cost?', answer: 'Expect roughly $150 to $350, with mobile hotel visits costing a bit more for the convenience.' },
    ],
    quizTitle: 'Traveling soon?',
    quizSubtitle: 'Answer a few questions and we\'ll match you to a clinic or mobile provider near your destination.',
  },

  {
    slug: 'seniors',
    navLabel: 'Seniors & Longevity',
    serviceTag: 'Wellness',
    eyebrow: 'Seniors & Longevity',
    h1: 'IV therapy for healthy aging',
    h1Accent: 'and longevity.',
    heroSub:
      'As we age, hydration, nutrient absorption, and cellular energy all matter more. IV therapy — including NAD+ — is popular for healthy aging. Safety and medical oversight matter most, so we help you find MD-led clinics.',
    heroImage: `${SUPABASE_BASE_URL}iv-therapy-immunity.jpg`,
    metaTitle: 'IV Therapy for Seniors & Longevity — MD-Led Clinics Near You | TheDripMap',
    metaDescription:
      'IV therapy for healthy aging and longevity, including NAD+. Learn the safety considerations and find MD-led clinics near you. Always talk to your doctor first.',
    targetKeyword: 'iv therapy for seniors',
    benefitsHeading: 'Why older adults consider IV therapy',
    benefits: [
      { icon: 'Zap', title: 'NAD+ & cellular health', body: 'NAD+ is widely used to support cellular energy and is a cornerstone of many longevity protocols.' },
      { icon: 'Droplets', title: 'Hydration & energy', body: 'Thirst cues fade with age; IV hydration restores fluids and can help with daily energy.' },
      { icon: 'ShieldCheck', title: 'Immune support', body: 'Vitamin and mineral blends are popular for supporting immune resilience.' },
      { icon: 'Heart', title: 'Better nutrient absorption', body: 'IV delivery bypasses a digestive system that absorbs some nutrients less efficiently with age.' },
    ],
    lookForHeading: 'Safety first — what to confirm',
    lookFor: [
      'Talk to your doctor first, especially about heart, kidney, or blood-pressure conditions and your medications',
      'Choose an MD-led clinic with a physician medical director',
      'A registered nurse (RN) administering your drip',
      'A clinic that reviews your full medical history before treatment',
    ],
    popularCities: [
      { name: 'Los Angeles', slug: 'los-angeles' },
      { name: 'New York', slug: 'new-york' },
      { name: 'San Diego', slug: 'san-diego' },
      { name: 'Toronto', slug: 'toronto' },
    ],
    relatedDeepDive: { label: 'NAD+ IV therapy explained', href: '/treatments/nad-plus' },
    guidesHref: '/guide',
    faqs: [
      { question: 'Is IV therapy safe for older adults?', answer: 'It can be, but safety depends on your health. Conditions affecting the heart, kidneys, or blood pressure — and certain medications — change what\'s appropriate. Always talk to your doctor first and choose a clinic with a physician medical director who reviews your history.' },
      { question: 'What should I ask my doctor before trying it?', answer: 'Ask whether IV fluids or specific nutrients (like high-dose vitamins or NAD+) are safe given your conditions and medications, and whether there are any volume or electrolyte concerns.' },
      { question: 'What is NAD+ and why is it popular for longevity?', answer: 'NAD+ is a coenzyme involved in cellular energy and repair that declines with age. Many longevity-focused clinics offer NAD+ drips; effects vary by person and research is ongoing.' },
      { question: 'How do I find an MD-led clinic?', answer: 'Search your city above and look for clinics that display a physician medical director and verified safety details on their TheDripMap profile.' },
    ],
    quizTitle: 'Considering IV therapy for healthy aging?',
    quizSubtitle: 'Answer a few questions and we\'ll point you to MD-led clinics near you. Always consult your doctor first.',
  },

  {
    slug: 'weddings',
    navLabel: 'Brides & Wedding Parties',
    serviceTag: 'Beauty',
    eyebrow: 'Brides & Wedding Parties',
    h1: 'IV therapy for brides',
    h1Accent: 'and wedding parties.',
    heroSub:
      'Glow for the big day and bounce back the morning after. From pre-wedding beauty drips to group recovery sessions delivered to your suite, find clinics that handle weddings and events.',
    heroImage: `${SUPABASE_BASE_URL}iv-therapy-event-prep.jpg`,
    metaTitle: 'IV Therapy for Weddings — Bridal Glow & Party Recovery | TheDripMap',
    metaDescription:
      'IV therapy for brides, wedding parties, and event recovery. Find clinics offering pre-wedding glow drips, morning-after recovery, and group bookings to your suite.',
    targetKeyword: 'iv therapy for wedding party',
    benefitsHeading: 'Why wedding parties book IV drips',
    benefits: [
      { icon: 'Sparkles', title: 'Pre-wedding glow', body: 'Beauty drips with glutathione, biotin, and vitamin C are popular in the days before the big event.' },
      { icon: 'Sun', title: 'Morning-after recovery', body: 'Rehydrate the whole party after the rehearsal dinner or reception so everyone feels their best.' },
      { icon: 'Droplets', title: 'Hydration for the big day', body: 'Long days in heels and heat are dehydrating — a drip keeps energy and skin looking fresh.' },
      { icon: 'Users', title: 'Group bookings to your suite', body: 'Many mobile providers treat the whole wedding party together in your hotel suite or Airbnb.' },
    ],
    lookForHeading: 'What to look for for your event',
    lookFor: [
      'Medical oversight from an MD or nurse practitioner',
      'A registered nurse (RN) administering each drip',
      'Group and mobile availability that fits your timeline',
      'Transparent pricing and clear group rates',
    ],
    compare: {
      left: { heading: 'Glow before', points: ['Beauty and hydration drips in the days prior', 'Glutathione, biotin, and vitamin C are popular', 'Best booked a few days out, not the morning of'] },
      right: { heading: 'Recover after', points: ['Rehydrate the morning after the reception', 'Anti-nausea and B-vitamins for the party', 'Mobile to your suite for the whole group'] },
    },
    popularCities: [
      { name: 'Las Vegas', slug: 'las-vegas' },
      { name: 'Miami', slug: 'miami' },
      { name: 'New York', slug: 'new-york' },
      { name: 'Toronto', slug: 'toronto' },
    ],
    relatedDeepDive: { label: 'IV therapy for event prep', href: '/iv-therapy-for/event-prep' },
    guidesHref: '/guide',
    faqs: [
      { question: 'When should the bride get a glow drip?', answer: 'Most clinics suggest a beauty/hydration drip a few days before the wedding rather than the morning of, so your skin and energy are at their best on the day.' },
      { question: 'Can a provider treat the whole wedding party at once?', answer: 'Yes — many mobile IV services do group sessions in a hotel suite or Airbnb, which is popular for bachelor/ette weekends and the morning after the reception.' },
      { question: 'How far in advance should I book?', answer: 'For weddings, book early — especially in busy destinations like Las Vegas and Miami — to secure your date and group size.' },
      { question: 'How much does a group booking cost?', answer: 'Per-person pricing is typically $150 to $350, with many providers offering group or party rates.' },
    ],
    quizTitle: 'Planning a wedding or event?',
    quizSubtitle: 'Answer a few questions and we\'ll match you to clinics that handle bridal glow and group recovery near you.',
  },

  {
    slug: 'practitioners',
    navLabel: 'Mobile IV Nurses & Practitioners',
    serviceTag: 'IV Therapy',
    kind: 'provider',
    hideClinics: true,
    eyebrow: 'For Nurses & Practitioners',
    h1: 'Run a mobile IV practice?',
    h1Accent: 'Get found by patients.',
    heroSub:
      'Join the TheDripMap network. List your mobile IV practice, earn a verified safety badge, and get in front of patients already searching in your city — free to start.',
    heroImage: `${SUPABASE_BASE_URL}iv-therapy-group-clinic.jpg`,
    metaTitle: 'List Your Mobile IV Practice — Join TheDripMap Network | TheDripMap',
    metaDescription:
      'Are you an IV therapy nurse or practitioner? Join the TheDripMap network, list your mobile IV practice, earn a verified badge, and reach patients searching in your city.',
    targetKeyword: 'list mobile iv practice',
    primaryCta: { label: 'List your practice', href: '/for-clinics/setup' },
    secondaryCta: { label: 'How it works', href: '/for-clinics' },
    trustChips: ['Free to list', 'Verified safety badges', 'Patients searching now'],
    benefitsHeading: 'Why list with TheDripMap',
    benefits: [
      { icon: 'Search', title: 'Get found by patients', body: 'Show up when patients search for IV therapy in your city and for the treatments you offer.' },
      { icon: 'BadgeCheck', title: 'Earn a verified badge', body: 'Confirm your medical oversight and credentials to display a safety badge that builds trust.' },
      { icon: 'Sparkles', title: 'Control your profile', body: 'Add your photos, services, hours, and description so patients see your practice at its best.' },
      { icon: 'TrendingUp', title: 'Free to start', body: 'Claim your listing and start receiving patient interest at no cost.' },
    ],
    lookForHeading: 'What you get',
    lookFor: [
      'A claimable profile with your photos, services, and hours',
      'A verified safety badge once your credentials are confirmed',
      'Visibility in your city and in treatment-specific searches',
      'Patient leads sent to you — free to begin',
    ],
    popularCities: [],
    guidesHref: '/for-clinics',
    faqs: [
      { question: 'Is it free to list my practice?', answer: 'Yes — claiming and listing your practice is free. You can add your photos, services, hours, and description and start appearing in patient searches at no cost.' },
      { question: 'How do I get the verified safety badge?', answer: 'During onboarding you provide details about your medical oversight (medical director, who administers IVs, insurance, compounding, and state-board compliance). Once confirmed, your profile displays the verified safety badge.' },
      { question: 'I\'m mobile-only — can I still list?', answer: 'Absolutely. Many providers on TheDripMap are mobile-only. You set your service area so patients searching your city can find and contact you.' },
      { question: 'How do patient leads work?', answer: 'Patients can view your profile and reach out directly. Claiming your listing ensures your real contact details, services, and photos are shown instead of a placeholder.' },
    ],
    bottomCta: {
      title: 'Ready to grow your practice?',
      subtitle: 'Claim your free listing and start reaching patients searching in your city today.',
      buttonLabel: 'Claim your listing',
      href: '/for-clinics/setup',
    },
  },
];

export function getAudienceBySlug(slug: string): Audience | undefined {
  return AUDIENCES.find((a) => a.slug === slug);
}
