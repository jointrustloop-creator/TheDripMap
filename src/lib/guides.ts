export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: { heading: string; paragraphs: string[] }[];
}

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
  relatedTreatments?: { name: string; slug: string }[];
  relatedCities?: { name: string; slug: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'how-to-choose-iv-therapy-clinic',
    title: 'How to Choose an IV Therapy Clinic — A Practical Guide',
    metaTitle: 'How to Choose an IV Therapy Clinic — Guide for Patients',
    metaDescription: 'Step-by-step guide to choosing a safe, effective IV therapy clinic. What credentials to look for, questions to ask, red flags to avoid.',
    intro: `Choosing the right IV therapy clinic is more important than most patients realize. While many clinics deliver a similar menu of drips, the medical oversight, sterility standards, ingredient sourcing, and overall experience vary widely. This guide walks through the criteria that actually matter, the questions you should ask before your first appointment, and the red flags that should make you walk away.`,
    sections: [
      {
        heading: 'Credentials and medical oversight',
        paragraphs: [
          `The single most important factor is who is actually administering and supervising your treatment. A reputable IV therapy clinic operates under the medical direction of a licensed physician (MD or DO), nurse practitioner (NP), or naturopath (where permitted). Treatments themselves are typically administered by Registered Nurses (RNs) or paramedics with IV certification.`,
          `Before booking, confirm that the clinic has a clearly named medical director, that ingredients are sourced from a licensed compounding pharmacy (not bulk online suppliers), and that the staff administering your IV is trained and licensed to do so in your jurisdiction.`,
        ],
      },
      {
        heading: 'Cleanliness, environment, and protocols',
        paragraphs: [
          `IV therapy is a medical procedure, not a spa service — even when delivered in a lounge environment. The clinic should follow infection-control standards comparable to a doctor's office: single-use sterile catheters, fresh tubing for every patient, sealed and refrigerated medications, and proper sharps disposal.`,
          `When you walk in, take a quick look. Is the space clean? Is the IV station set up after the previous patient leaves? Are gloves changed between clients? These small signals tell you a lot about whether the clinic takes safety seriously.`,
        ],
      },
      {
        heading: 'Transparency about ingredients and pricing',
        paragraphs: [
          `A good clinic publishes its drip menu with full ingredient lists and prices on its website. You should be able to see exactly what's in the "Hangover Recovery" or "NAD+ Plus" drip before you arrive, and what each add-on costs. Vague descriptions like "proprietary blend" or hidden pricing are red flags.`,
          `Reputable clinics will also discuss potential interactions with your medications, allergies, and existing conditions during intake — not skip it to keep the experience feeling spa-like.`,
        ],
      },
      {
        heading: 'Questions to ask before booking',
        bullets: [
          'Who is your medical director, and are they on site or just on file?',
          'Who will be inserting my IV — RN, NP, paramedic, or other?',
          'Where do you source your IV fluids and ingredients?',
          'Will you review my medications and medical history before treatment?',
          'What happens if I have a reaction during the drip?',
          'Can I see a full ingredient list and price for the drip I\'m considering?',
        ],
      },
      {
        heading: 'Red flags to walk away from',
        bullets: [
          'No identifiable medical director or unlicensed staff administering IVs',
          'Pressure to add expensive upgrades without explanation',
          'No medical intake — they just hook you up after a quick form',
          'Vague ingredient descriptions or "proprietary blends" with no quantities',
          'Reusing catheters, tubing, or single-use supplies',
          'Negative reviews specifically mentioning safety, hygiene, or staff training',
        ],
      },
      {
        heading: 'Reviews and reputation',
        paragraphs: [
          `Google reviews and word-of-mouth are decent proxies for clinic quality, but read carefully. Focus on reviews that mention specific details — staff names, the intake process, ingredient explanations — rather than generic five-star "felt great" reviews that could be from anyone. Pay closer attention to negative reviews; they often surface real problems that positive reviews paper over.`,
        ],
      },
    ],
    faqs: [
      {
        question: 'Do I need a doctor\'s referral to get IV therapy?',
        answer: 'No, most IV therapy clinics do not require a physician referral. However, the clinic itself should have a licensed medical director who has approved their standing protocols, and they should review your medical history and medications during intake.',
      },
      {
        question: 'Are IV therapy clinics regulated?',
        answer: 'Regulation varies significantly by state and country. Some jurisdictions require medical director oversight, RN administration, and licensed compounding sources; others are less strict. Always confirm the clinic is operating within your local regulations.',
      },
      {
        question: 'How much does a typical IV therapy session cost?',
        answer: 'Standard hydration and wellness drips usually range from $150 to $300. Specialized treatments like NAD+ therapy or high-dose vitamin C can run $400 to $1,200. Mobile (in-home) service typically adds $50 to $100 over in-clinic pricing.',
      },
    ],
    relatedTreatments: [
      { name: 'Hangover Recovery', slug: 'hangover-recovery' },
      { name: 'NAD+ Plus', slug: 'nad-plus' },
      { name: 'Myers Cocktail', slug: 'myers-cocktail' },
    ],
    relatedCities: [
      { name: 'Houston', slug: 'houston' },
      { name: 'New York', slug: 'new-york' },
      { name: 'Toronto', slug: 'toronto' },
    ],
  },

  {
    slug: 'iv-therapy-cost-guide',
    title: 'IV Therapy Cost Guide — What You\'ll Actually Pay',
    metaTitle: 'IV Therapy Cost Guide — Pricing by Treatment & Location',
    metaDescription: 'How much does IV therapy cost? Detailed pricing breakdown by treatment, location, and delivery method. Hangover drips to NAD+ infusions.',
    intro: `IV therapy pricing is one of the most opaque parts of the industry. Some clinics charge $99 for a basic drip, others charge $400 for what looks like the same thing on the menu. This guide breaks down what you should actually expect to pay for the most popular IV therapy treatments, what drives the price differences, and where the value typically sits.`,
    sections: [
      {
        heading: 'Typical price ranges by treatment',
        paragraphs: [
          `Most clinics structure their menu around 5 to 10 named drips. Pricing typically tracks with the cost of the active ingredients and the duration of the infusion. Here's the rough range you should expect across the major treatment categories.`,
        ],
        bullets: [
          'Basic hydration (saline only): $100–$200',
          'Myers Cocktail (B-complex, B12, C, calcium, magnesium): $150–$300',
          'Hangover recovery (fluids + B vitamins + anti-nausea): $150–$350',
          'Immune support (high-dose C + zinc + glutathione): $150–$300',
          'Energy / B12 boost: $125–$250',
          'Beauty / glow (glutathione + biotin + C): $200–$450',
          'Recovery / athletic (BCAAs + magnesium + antioxidants): $175–$400',
          'Weight loss / MIC (lipotropics + L-carnitine): $150–$300',
          'NAD+ low dose (250mg): $400–$600',
          'NAD+ high dose (500mg+): $700–$1,200+',
        ],
      },
      {
        heading: 'What drives the price differences',
        paragraphs: [
          `Three things explain most of the variation between clinics: the cost of the ingredients (NAD+ alone is dramatically more expensive than B vitamins), the time the infusion takes (slow drips occupy a chair for hours and tie up staff), and the operating cost of the clinic itself (Manhattan rent vs suburban Texas drives wildly different overhead).`,
          `A drip menu that lists $99 hangover IVs is either a loss-leader to get you in the door or skimping on ingredients. A drip menu that charges $400 for the same isn't necessarily a rip-off — it may include better sourcing, more medical oversight, or premium add-ons baked in. Read the ingredient list, not just the price.`,
        ],
      },
      {
        heading: 'In-clinic vs mobile pricing',
        paragraphs: [
          `Mobile IV therapy (in-home or hotel-room) typically adds a $50 to $100 service premium over the equivalent in-clinic drip. You're paying for the nurse's travel time, the convenience of not leaving home, and the privacy. For occasional clients this premium is well worth it; for regular users it adds up fast.`,
          `Some mobile services also charge a flat minimum (e.g., "$250 minimum for any mobile service") which can make smaller drips disproportionately expensive. Always check the total when you call.`,
        ],
      },
      {
        heading: 'Add-ons and packages',
        paragraphs: [
          `Most clinics offer optional add-ons that can quickly inflate the total: extra glutathione, vitamin C boosts, B12 pushes, anti-nausea or pain medication, and so on. Each typically runs $25 to $75. They're often worth the upgrade for specific situations (Toradol for a stubborn hangover headache) but can also be soft-sold during your visit.`,
          `If you're a regular user, ask about packages. Most clinics offer 4-to-10-session bundles at a 10 to 20% discount over single sessions. Monthly memberships are increasingly common too.`,
        ],
      },
      {
        heading: 'Is IV therapy covered by insurance?',
        paragraphs: [
          `In most cases, no. Standard wellness IVs (hydration, vitamins, beauty drips) are considered elective and not medically necessary by insurers. Specific therapeutic uses — like IV iron for diagnosed iron-deficiency anemia, or IV fluids for severe dehydration during an ER visit — may be covered, but you typically need a physician's order and a clinical diagnosis.`,
          `HSA and FSA accounts can sometimes be used for IV therapy if it's deemed medically necessary by your doctor. Check with your plan administrator before assuming reimbursement.`,
        ],
      },
    ],
    faqs: [
      {
        question: 'Why does the same drip cost different amounts at different clinics?',
        answer: 'Ingredient quality, dosing, medical oversight level, location overhead, and what add-ons are included can all account for $100+ price differences on similar-sounding drips. Compare ingredient lists, not just menu names.',
      },
      {
        question: 'Can I use HSA or FSA funds for IV therapy?',
        answer: 'Sometimes. If your doctor documents medical necessity, HSA/FSA reimbursement is possible. Pure wellness drips without a clinical diagnosis usually do not qualify.',
      },
      {
        question: 'Are package deals worth it?',
        answer: 'If you plan to do IV therapy regularly (monthly or more often), yes — packages typically save 10 to 20%. For occasional users, single sessions are more flexible.',
      },
    ],
    relatedTreatments: [
      { name: 'NAD+ Plus', slug: 'nad-plus' },
      { name: 'Hangover', slug: 'hangover' },
      { name: 'Myers Cocktail', slug: 'myers-cocktail' },
      { name: 'Beauty Glow', slug: 'beauty-glow' },
    ],
    relatedCities: [
      { name: 'Las Vegas', slug: 'las-vegas' },
      { name: 'New York', slug: 'new-york' },
      { name: 'Los Angeles', slug: 'los-angeles' },
    ],
  },

  {
    slug: 'iv-therapy-vs-oral-supplements',
    title: 'IV Therapy vs Oral Supplements — Which Actually Works?',
    metaTitle: 'IV Therapy vs Oral Supplements — Bioavailability & Cost Compared',
    metaDescription: 'Direct comparison of IV therapy and oral supplements. Bioavailability, speed of effect, cost per dose, and when each is the better choice.',
    intro: `The case for IV therapy hinges almost entirely on one word: bioavailability — the percentage of a nutrient that actually makes it into your bloodstream. Oral supplements have to survive your stomach acid, intestinal transport limits, and first-pass metabolism by your liver. IV therapy skips all of that. But that doesn't mean IV is always the right answer. Here's an honest comparison of when each approach makes sense.`,
    sections: [
      {
        heading: 'Bioavailability — the core difference',
        paragraphs: [
          `When you take an oral supplement, your body absorbs somewhere between 10% and 50% of the active ingredient, depending on the nutrient, the formulation, what you ate with it, and your individual gut. Vitamin C, for example, has saturable intestinal transport — you can only absorb about 200mg per dose orally, regardless of how much you swallow.`,
          `IV administration bypasses your digestive system entirely. The nutrient enters your bloodstream directly, achieving close to 100% bioavailability. This is why a single IV vitamin C drip can deliver more of the active nutrient than weeks of oral supplementation.`,
        ],
      },
      {
        heading: 'Where IV therapy wins clearly',
        paragraphs: [
          `Some nutrients are simply impractical to deliver in meaningful doses orally. Glutathione is degraded almost completely in the digestive tract — IV is the only reliable way to raise circulating levels. NAD+ has similar issues. High-dose vitamin C (5,000mg or more) can only be reached through IV.`,
          `IV therapy also wins when speed matters. If you're severely dehydrated, hungover, or fighting an early-stage cold, IV restores fluids and delivers nutrients in 30 minutes — oral hydration and supplementation would take many hours to produce comparable effects.`,
        ],
      },
      {
        heading: 'Where oral supplements win clearly',
        paragraphs: [
          `For daily maintenance, oral supplementation is dramatically more cost-effective. A bottle of high-quality multivitamin or B-complex costs $20 to $40 and lasts a month. The equivalent IV drips would run $1,500+ for monthly use. For most people, daily multivitamin + occasional IV makes more financial sense than weekly IVs.`,
          `Oral supplementation also wins for slow-build nutrients like vitamin D, magnesium, and omega-3 fatty acids — these need consistent daily intake to maintain tissue levels, and a once-a-month IV doesn't replicate that effect.`,
        ],
      },
      {
        heading: 'When to use each',
        subsections: [
          {
            heading: 'IV therapy is the right choice when:',
            paragraphs: [
              `You need fast effect (hangover, illness onset, post-workout recovery, before a big event).`,
              `The nutrient is poorly absorbed orally (glutathione, NAD+, high-dose C).`,
              `You can't tolerate oral intake (nausea, gut issues, post-surgery).`,
              `You want a known, exact dose without absorption variability.`,
            ],
          },
          {
            heading: 'Oral supplementation is the right choice when:',
            paragraphs: [
              `You're maintaining baseline health on a budget.`,
              `The nutrient absorbs well orally (most B vitamins, vitamin D, fish oil).`,
              `You're treating a slow-build deficiency that needs daily intake.`,
              `You want consistency rather than periodic high-dose pulses.`,
            ],
          },
        ],
      },
      {
        heading: 'The smart combination',
        paragraphs: [
          `Most people who benefit most from IV therapy use it strategically: a monthly maintenance Myers Cocktail or immune drip, situational hangover or recovery IVs after demanding weekends, and a sustained oral supplement regimen for daily nutrients. Treating IV as a replacement for sensible daily nutrition is expensive and unnecessary. Treating it as a focused tool for specific situations is where the real value sits.`,
        ],
      },
    ],
    faqs: [
      {
        question: 'Does IV vitamin C actually do anything an orange can\'t?',
        answer: 'Yes, at the right dose. An orange gives you about 70mg of vitamin C — within normal range. A high-dose IV can deliver 5,000 to 25,000mg in a single session, reaching plasma levels you cannot achieve through diet or oral supplementation due to gut absorption limits.',
      },
      {
        question: 'Will an IV magnesium drip replace my daily magnesium supplement?',
        answer: 'Not really. A weekly or monthly IV gives you a high-dose pulse, but magnesium absorption into tissues happens gradually with consistent daily intake. Most clinics recommend combining occasional IV with daily oral magnesium for sustained effects.',
      },
      {
        question: 'Is IV therapy "more natural" than oral supplements?',
        answer: 'Neither is more or less natural than the other — both deliver isolated vitamins and minerals in concentrated form. The choice should be based on bioavailability needs, speed of effect, and budget, not perceived naturalness.',
      },
    ],
    relatedTreatments: [
      { name: 'NAD+ Plus', slug: 'nad-plus' },
      { name: 'Beauty Glow', slug: 'beauty-glow' },
      { name: 'Immune Support', slug: 'immune-support' },
    ],
    relatedCities: [
      { name: 'Los Angeles', slug: 'los-angeles' },
      { name: 'San Francisco', slug: 'san-francisco' },
    ],
  },

  {
    slug: 'first-time-iv-therapy-what-to-expect',
    title: 'First-Time IV Therapy — What to Expect, Step by Step',
    metaTitle: 'First-Time IV Therapy — What to Expect on Your First Visit',
    metaDescription: 'Nervous about your first IV therapy session? A complete walkthrough of intake, the actual drip, how long it takes, and how you\'ll feel after.',
    intro: `Your first IV therapy session can feel intimidating if you've never had an IV before. The good news is that the entire experience is far gentler than most people expect — closer to a long massage than a medical procedure. This guide walks you through exactly what happens from the moment you arrive until you walk out the door, so you know what to expect at each step.`,
    sections: [
      {
        heading: 'Before your appointment',
        paragraphs: [
          `Hydrate well in the 24 hours leading up to your visit. Properly hydrated veins are easier to access, which makes the IV insertion smoother and faster. Drink water, avoid heavy alcohol or caffeine in the hours immediately before, and have a light meal an hour or two before — going in on an empty stomach is generally fine but can leave some people lightheaded.`,
          `If you're on any medications, supplements, or have allergies, write them down or have your phone notes ready. The clinic will ask during intake, and it's faster than trying to remember on the spot.`,
        ],
      },
      {
        heading: 'Arrival and intake',
        paragraphs: [
          `When you arrive, you'll fill out a brief medical intake form: your medical history, current medications, allergies, what you're hoping to get out of the session, and an informed consent. A nurse or practitioner will review it with you, ask follow-up questions, and recommend (or confirm) the drip that fits your goals.`,
          `This is the right time to ask any questions: what's in the drip, what you'll feel, how long it'll take, what to expect after. A good clinic welcomes this; if you feel rushed or dismissed, that's a sign to leave.`,
        ],
      },
      {
        heading: 'The IV insertion',
        paragraphs: [
          `You'll be seated in a comfortable reclining chair (or your own bed, for mobile service). The nurse will tie a tourniquet around your upper arm, clean the insertion site with alcohol, and insert a small catheter — typically into a vein in your forearm or the back of your hand. The needle itself only stays in for a few seconds; what remains is a flexible plastic catheter no thicker than a coffee stir stick.`,
          `The insertion feels like a quick pinch followed by a brief pressure sensation. Most people describe it as far less painful than a blood draw. If your veins are hard to access (which the nurse can usually tell within seconds), they may try a different spot or use a warm compress to bring veins to the surface.`,
        ],
      },
      {
        heading: 'During the drip',
        paragraphs: [
          `Once the catheter is in and the drip is running, you can relax completely. Most clinics have Wi-Fi, magazines, snacks, charging stations, and entertainment. You can read, work on your laptop, take a call, or just nap. Sessions typically run 30 to 60 minutes for standard drips, or longer for NAD+ or high-dose treatments.`,
          `You may feel some sensations as the drip runs: a brief warmth as B vitamins infuse, a "vitamin smell" or metallic taste with vitamin C, a flushing or chest warmth with magnesium. These are all normal. If anything feels uncomfortable, tell the nurse immediately — they can slow the rate or stop the infusion.`,
        ],
      },
      {
        heading: 'After the drip',
        paragraphs: [
          `The nurse will remove the catheter, apply pressure for 30 seconds, and put on a small bandage. You can keep it on for an hour or two; you may have a small bruise at the insertion site for a few days, especially if you bruise easily.`,
          `There's no recovery time. You can drive, work, exercise, and resume your normal day. Most clients feel a subtle but noticeable lift within an hour — clearer-headed, more energetic, less foggy. The full effect typically builds over the following 24 to 48 hours, especially for vitamin and antioxidant drips.`,
        ],
      },
      {
        heading: 'What to watch for',
        bullets: [
          'Mild bruising or tenderness at the insertion site — normal, resolves in days',
          'Slight lightheadedness as you stand up — common, drink water',
          'Vitamin smell or taste in your mouth for an hour or two — normal',
          'Significant pain, swelling, or redness at the insertion site — contact the clinic',
          'Any allergic reaction signs (rash, throat tightness, difficulty breathing) — seek immediate medical attention',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does the IV needle hurt?',
        answer: 'Most people describe it as a quick pinch followed by mild pressure — less painful than a typical blood draw. The needle itself only stays in for seconds; what remains is a soft flexible catheter you barely feel.',
      },
      {
        question: 'How long does a first session take?',
        answer: 'Plan for 60 to 90 minutes total — intake (15 to 30 minutes), the drip itself (30 to 60 minutes), and a few minutes to wrap up. Returning visits are faster since intake is already on file.',
      },
      {
        question: 'Can I work during the drip?',
        answer: 'Yes. Once the IV is running, you can use your phone, laptop, or read. The catheter is in your non-dominant arm at most clinics so you can type or write. Many clients schedule sessions during work hours.',
      },
    ],
    relatedTreatments: [
      { name: 'Myers Cocktail', slug: 'myers-cocktail' },
      { name: 'Hydration', slug: 'hydration' },
      { name: 'Energy Boost', slug: 'energy-boost' },
    ],
    relatedCities: [
      { name: 'Toronto', slug: 'toronto' },
      { name: 'San Francisco', slug: 'san-francisco' },
    ],
  },

  {
    slug: 'mobile-iv-therapy-vs-clinic',
    title: 'Mobile IV Therapy vs Clinic — Which Should You Choose?',
    metaTitle: 'Mobile IV Therapy vs Clinic — Pros, Cons, Pricing Comparison',
    metaDescription: 'Should you go to an IV clinic or have a nurse come to you? Detailed comparison of mobile vs in-clinic IV therapy: cost, convenience, safety.',
    intro: `Mobile IV therapy — where a licensed nurse comes to your home, office, or hotel — has exploded in popularity over the past few years. For some clients it's a clear win; for others, the in-clinic experience offers benefits that mobile can't match. Here's the practical comparison to help you decide which fits your situation.`,
    sections: [
      {
        heading: 'The case for mobile IV therapy',
        paragraphs: [
          `Mobile is the obvious choice when leaving the house isn't appealing or possible. Severe hangovers, post-flight exhaustion, recovery from a tough workout, or simply not wanting to drive — mobile brings the entire experience to your couch, bed, or hotel room. You can be in pajamas. You can nap. You don't have to commute.`,
          `Mobile is also the standard choice for group events: bachelorette parties, wedding mornings, corporate wellness days. Many providers offer group rates that make mobile cheaper per person than booking everyone into a clinic.`,
        ],
      },
      {
        heading: 'The case for in-clinic IV therapy',
        paragraphs: [
          `In-clinic visits give you access to a wider menu, faster service, and lower per-session pricing. Most clinics have refrigerated stock of every ingredient and can mix custom protocols on demand. Mobile providers usually carry a limited inventory and require you to choose from a shorter menu.`,
          `In-clinic is also typically the safer choice for first-time clients. The full clinic environment — multiple staff on site, complete emergency equipment, easier escalation if something goes wrong — provides a higher level of medical backup than a single nurse arriving alone with a kit.`,
        ],
      },
      {
        heading: 'Pricing comparison',
        paragraphs: [
          `Mobile typically adds $50 to $100 per session over the equivalent in-clinic drip. Some mobile services also have minimums — for example, a $250 minimum charge even if the drip alone would be $175. For occasional use these premiums are negligible. For regular use, they add up: a weekly mobile habit can cost $400 to $500 more per month than the equivalent clinic visits.`,
          `Group bookings are where mobile pricing flips. Three or more people getting drips together at one location often costs less per person via mobile than three separate clinic appointments.`,
        ],
      },
      {
        heading: 'Service quality and safety',
        paragraphs: [
          `Good mobile providers are operationally identical to good clinics: licensed medical director, RN-administered, sterile single-use supplies, proper intake, proper post-treatment monitoring. Bad ones cut corners on all of those. Because mobile providers operate without the visibility of a public clinic space, vetting matters even more.`,
          `Before booking mobile, confirm the same things you would for a clinic: who's the medical director, what's the nurse's license, what's the emergency protocol if something goes wrong in your home, and what's the procedure for sharps disposal.`,
        ],
      },
      {
        heading: 'When mobile is the clear winner',
        bullets: [
          'You\'re too hungover or sick to leave home',
          'You\'re jet-lagged at a hotel and want to recover in your room',
          'You\'re organizing a group session (bachelorette, wedding, corporate)',
          'You\'re bed-bound or have mobility issues',
          'You value privacy over the clinic atmosphere',
        ],
      },
      {
        heading: 'When in-clinic is the clear winner',
        bullets: [
          'It\'s your first IV therapy session and you want full medical backup',
          'You want access to a wider drip menu or custom protocols',
          'You\'re a regular user and want the lower per-session cost',
          'You want the spa-like atmosphere and downtime away from home',
          'You need a complex add-on (Toradol, ondansetron) that mobile may not carry',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is mobile IV therapy safe?',
        answer: 'Yes — when the provider is properly licensed, uses sterile single-use supplies, follows medical intake procedures, and has clear emergency protocols. Verify these before booking, just as you would for a clinic.',
      },
      {
        question: 'How much extra does mobile IV therapy cost?',
        answer: 'Typically $50 to $100 per session over the equivalent in-clinic drip. Some services have minimum charges or travel fees on top, especially for outlying suburbs or off-hours appointments.',
      },
      {
        question: 'Can mobile IV providers handle group events?',
        answer: 'Yes — group bookings are a major part of the mobile IV market. Bachelorette parties, weddings, and corporate wellness events are common. Group pricing per person is often cheaper than individual clinic visits.',
      },
    ],
    relatedTreatments: [
      { name: 'Hangover', slug: 'hangover' },
      { name: 'Jet Lag', slug: 'jet-lag' },
      { name: 'Hydration', slug: 'hydration' },
    ],
    relatedCities: [
      { name: 'Las Vegas', slug: 'las-vegas' },
      { name: 'Miami', slug: 'miami' },
    ],
  },
  {
    slug: 'do-you-need-a-prescription-for-iv-therapy-canada',
    title: 'Do You Need a Prescription or Referral for IV Therapy in Canada?',
    metaTitle: 'Do You Need a Prescription or Referral for IV Therapy in Canada?',
    metaDescription: 'Do you need a doctor’s note, referral, or prescription for an IV drip in Canada? How intake works, when a prescriber is required, and what to ask before you book.',
    intro: `Short answer: for most standard wellness drips at a private IV clinic in Canada, you do not need a referral from your family doctor the way you would for a specialist. But that does not mean anyone can walk in and get anything. IV therapy is a medical act, and the clinic itself is responsible for making sure a qualified professional assesses you and authorizes your drip. This guide explains how that works, when a prescriber is genuinely required, and the questions that tell you a clinic is doing it properly. TheDripMap is a matching platform, not a medical provider, so always confirm the details with the clinic.`,
    sections: [
      {
        heading: 'Referral vs prescription: they are not the same',
        paragraphs: [
          `These terms get used interchangeably, but they mean different things. A referral is one clinician sending you to another, usually a specialist. Private IV clinics are direct-access, so you almost never need a referral from your GP to book.`,
          `A prescription or medical order is a qualified prescriber authorizing a specific treatment for you. For IV therapy this is often handled inside the clinic: a nurse practitioner, physician, or, within their provincial scope, a naturopathic doctor reviews your intake and authorizes the drip. You may never hold a paper prescription, but that authorization still has to happen.`,
        ],
      },
      {
        heading: 'How intake usually works at a Canadian IV clinic',
        bullets: [
          'You book. Many clinics take walk-ins; some require an appointment.',
          'You complete a health intake: medications, conditions, allergies, pregnancy, kidney and liver history, and your goal for the visit.',
          'A qualified professional reviews it: a nurse under medical oversight, a nurse practitioner, a physician, or a naturopathic doctor, depending on the clinic and your history.',
          'They confirm the drip is appropriate, adjust it, or decline it. A good clinic will say no when something is not safe for you.',
          'A regulated professional places the IV and monitors you during the infusion.',
        ],
      },
      {
        heading: 'When a prescriber is genuinely required',
        paragraphs: [
          `Some treatments are not simple wellness drips and do require a prescriber’s order, often with bloodwork first.`,
        ],
        bullets: [
          'Iron infusions usually require recent bloodwork (ferritin, iron studies) and a prescriber’s order, because dosing depends on your labs.',
          'Prescription medications added to a drip (certain anti-nausea meds or higher doses) require a prescriber.',
          'Anything for a diagnosed medical condition, as opposed to general wellness, belongs under a prescriber’s care.',
        ],
      },
      {
        heading: 'Who can authorize and place your IV (varies by province)',
        paragraphs: [
          `Rules are set provincially and scope of practice differs. In general, IVs are started by a regulated health professional such as a registered nurse, nurse practitioner, or physician, and in some provinces a naturopathic doctor within their scope, under medical oversight. If a clinic offers an iron infusion or a prescription add-on with no intake, no bloodwork, and no prescriber involved, treat that as a red flag.`,
        ],
      },
      {
        heading: 'What to ask before you book',
        bullets: [
          'Who reviews my intake, and who places the IV? Look for a regulated title.',
          'Is there medical oversight, and who provides it?',
          'For an iron infusion: do you require bloodwork and a prescriber’s order first?',
          'Where do your IV ingredients come from? A licensed compounding pharmacy or prepared on site is what you want to hear.',
        ],
      },
    ],
    faqs: [
      { question: 'Do I need my family doctor’s referral for an IV drip in Canada?', answer: 'Usually no. Private IV clinics are direct-access. You book directly, complete an intake, and a qualified professional at the clinic authorizes the drip.' },
      { question: 'Do I need a prescription for a vitamin drip?', answer: 'For a standard wellness vitamin drip, the authorization is typically handled inside the clinic after your intake. For iron infusions or prescription add-ons, a prescriber’s order, and often bloodwork, is required.' },
      { question: 'Can I just walk in?', answer: 'Many clinics accept walk-ins for standard drips, but you still complete a health intake and can be declined if a drip is not appropriate for you.' },
      { question: 'Is a naturopath allowed to give IV therapy in Canada?', answer: 'In several provinces, naturopathic doctors administer IV therapy within their regulated scope. It varies by province, so confirm with the clinic.' },
    ],
    relatedTreatments: [
      { name: 'Iron Infusion', slug: 'iron-infusion' },
      { name: 'Myers Cocktail', slug: 'myers-cocktail' },
      { name: 'NAD+ Plus', slug: 'nad-plus' },
    ],
    relatedCities: [
      { name: 'Toronto', slug: 'toronto' },
      { name: 'Calgary', slug: 'calgary' },
      { name: 'Vancouver', slug: 'vancouver' },
    ],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug.toLowerCase());
}
