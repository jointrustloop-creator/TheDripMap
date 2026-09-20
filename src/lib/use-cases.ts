export interface UseCase {
  slug: string;
  title: string;
  icon: string;
  serviceTag: string;
  description: string;
  imageUrl?: string;
  whyItWorks?: string;
  comparisons?: string;
  typicalPatient?: string;
  ingredients: string[];
  ingredientsDetailed?: { name: string; role: string }[];
  sessionExpectation: string;
  faqs: { question: string; answer: string }[];
}

const SUPABASE_BASE_URL = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';

/**
 * Retired 2026-09-20 (Hubert delegated the /symptoms decision: "best practice,
 * legal rules must follow"). Pages built around a medical condition or a
 * regulated claim (Health Canada and provincial college advertising standards:
 * no treatment, cure or weight-loss claims for a wellness drip) are withdrawn:
 * they redirect to /treatments and leave the sitemap. Lifestyle situations
 * (hangover, jet lag, event prep, dehydration...) stay, evidence-framed.
 */
export const RETIRED_USE_CASE_SLUGS = new Set(['migraine', 'morning-sickness', 'weight-loss', 'immunity', 'stomach-flu', 'cold-and-flu']);
export const isRetiredUseCase = (slug: string) => RETIRED_USE_CASE_SLUGS.has(slug);

export const USE_CASES: UseCase[] = [
  {
    slug: 'hangover',
    title: 'Hangover',
    icon: 'GlassWater',
    serviceTag: 'Hangover',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-hangover.jpg`,
    description: 'Many people book IV therapy after a night of celebration to rehydrate and replace B vitamins and electrolytes. When you\'ve had a few too many drinks, your body is dehydrated and low on B vitamins and electrolytes, and a hangover drip delivers fluids directly into the bloodstream rather than through an unsettled stomach. It\'s a popular choice for weekend travelers and event-goers who want to get back to their day. It does not cure a hangover; what it does reliably is rehydrate, and rest, water and time do the rest.',
    whyItWorks: 'Clinics pitch hangover drips at three things: dehydration, electrolyte loss, and depleted B vitamins. Alcohol is a diuretic, so you lose more fluid than you take in, which drives the headache and dry mouth. A litre of saline replaces that fluid directly, which is the one part of the pitch with a clear rationale.\n\nB vitamins are included because alcohol depletes them; there is no evidence that infusing them speeds how the liver clears alcohol. Anti-nausea medication, where a prescriber includes it, targets the queasiness that stops people drinking water in the first place. Some people report feeling back to normal sooner, which is anecdotal.',
    comparisons: 'When comparing IV therapy to oral supplements for hangovers, the primary difference is absorption. Oral rehydration requires the digestive system to process fluids and nutrients, which can be slow and inefficient, especially if you are feeling nauseous. IV therapy delivers nutrients directly into the bloodstream, bypassing digestion.',
    typicalPatient: 'The typical person seeking hangover IV therapy is an active adult who has a busy schedule and cannot afford a day of low productivity. This includes wedding guests, vacationers in cities like Las Vegas or Miami, and professionals who need to be sharp for a meeting after a social event.',
    ingredients: ['Saline solution', 'Vitamin B Complex', 'Electrolytes', 'Anti-nausea support', 'Mineral blend'],
    ingredientsDetailed: [
      { name: 'Saline Solution', role: 'Provides immediate rehydration to restore fluid balance in the body.' },
      { name: 'Vitamin B Complex', role: 'Supports energy production and helps the liver process alcohol byproducts.' },
      { name: 'Electrolytes', role: 'Restores essential minerals like potassium and sodium lost during dehydration.' },
      { name: 'Anti-nausea support', role: 'Helps calm the stomach and reduce the feeling of queasiness.' },
      { name: 'Mineral Blend', role: 'Provides magnesium and zinc to support overall cellular recovery.' }
    ],
    sessionExpectation: 'A typical session lasts about 45-60 minutes in a comfortable, lounge-like environment. You can relax, read, or catch up on emails while the fluids are administered by a trained professional. Most people find the process very gentle and report feeling a sense of cooling and hydration as the drip begins.',
    faqs: [
      { question: 'How quickly does IV therapy for hangover work?', answer: 'Many people report feeling more hydrated and refreshed within an hour of completing their session.' },
      { question: 'Is IV therapy for hangover better than drinking water?', answer: 'IV therapy delivers fluids directly into the bloodstream, bypassing the digestive system for faster absorption.' },
      { question: 'What is the most common ingredient in a hangover IV?', answer: 'A balanced saline solution for rehydration and B vitamins for energy are the most common components.' },
      { question: 'Can I get IV therapy for hangover at home?', answer: 'Yes, many mobile IV services offer hangover recovery in the comfort of your own home or hotel room.' },
      { question: 'Who typically seeks IV therapy for hangover?', answer: 'It is commonly used by adults who want to recover quickly from dehydration after consuming alcohol.' },
      { question: 'How much does IV therapy for hangover cost?', answer: 'Prices typically range from $150 to $350 depending on the ingredients and whether you choose in-clinic or mobile service.' },
      { question: 'How quickly will I feel relief from hangover symptoms?', answer: 'There is no trial evidence on timing. Rehydration is what most people notice, and a litre of fluid takes 30 to 60 minutes to run; anything beyond that is anecdotal.' },
      { question: 'Is IV therapy for hangover covered by insurance?', answer: 'In most cases, IV therapy is considered a wellness service and is not covered by traditional health insurance.' }
    ]
  },
  {
    slug: 'jet-lag',
    title: 'Jet Lag',
    icon: 'Plane',
    serviceTag: 'Jet Lag',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-jet-lag.jpg`,
    description: 'IV therapy is commonly booked by frequent flyers and international travelers after long-haul flights. Cabin air is dry, so many arrive dehydrated, and a hydration drip addresses that part directly. It does not reset the body clock; jet lag itself responds to light exposure, sleep timing and time. Clinics market it for the "foggy" feeling that comes after a long day of travel.',
    whyItWorks: 'Jet lag is a mismatch between your body clock and local time, and the dry, pressurised cabin adds dehydration on top. A drip addresses the dehydration; nothing in it shifts the body clock. Vitamin B12 and vitamin C are included for their general roles in energy metabolism and immune function, and magnesium because people arrive stiff from the seat. Taurine is a common clinic add-on with no jet-lag evidence.\n\nThe IV route sidesteps a travel-upset stomach, which is the practical reason people choose it over oral supplements. Melatonin, where a clinic offers it, is the one ingredient with reasonable evidence for shifting sleep timing.',
    comparisons: 'Oral hydration and caffeine are the traditional go-to for travelers. An IV rehydrates faster than drinking, which is its one clear edge. For adjusting to the new time zone, light exposure, sleep timing and (with advice on timing) melatonin have the evidence, not the drip.',
    typicalPatient: 'Typical users include international business travelers, digital nomads, and vacationers who want to avoid losing their first two days of a trip to exhaustion. It is also popular among flight crews and frequent domestic travelers.',
    ingredients: ['Hydration fluids', 'Vitamin B12', 'Vitamin C', 'Magnesium', 'Taurine'],
    ingredientsDetailed: [
      { name: 'Hydration Fluids', role: 'Combats the extreme dehydration caused by dry airplane cabin air.' },
      { name: 'Vitamin B12', role: 'Included for its role in energy metabolism; no jet-lag evidence.' },
      { name: 'Vitamin C', role: 'Included as an antioxidant; no evidence it prevents travel illness.' },
      { name: 'Magnesium', role: 'Commonly included for muscle tension after a long flight.' },
      { name: 'Taurine', role: 'A common clinic add-on; no jet-lag evidence.' }
    ],
    sessionExpectation: 'You\'ll be seated in a relaxing chair for about 45 minutes. Most clinics provide a quiet space where you can rest. Many people find it helpful to dim the lights and listen to calming music during the session.',
    faqs: [
      { question: 'When should I get IV therapy for jet lag?', answer: 'Clinics usually suggest it within 24 hours of landing. There is no trial evidence on timing.' },
      { question: 'Does IV therapy for jet lag help with sleep?', answer: 'No. Sleep on a new schedule depends on light exposure and sleep timing; a drip does not shift the body clock. Melatonin, with advice on timing, is the ingredient with evidence.' },
      { question: 'What vitamins are in a jet lag IV?', answer: 'B12 and vitamin C are common additions to travel-focused drips, alongside magnesium and fluids.' },
      { question: 'Is IV therapy for jet lag common for business travelers?', answer: 'Yes, it is commonly booked by professionals who want to feel functional shortly after arrival.' },
      { question: 'How long do the effects of IV therapy for jet lag last?', answer: 'The rehydration is immediate. There is no evidence the vitamins carry any effect into the following days.' },
      { question: 'How much does IV therapy for jet lag cost?', answer: 'Costs generally range from $175 to $300, with some clinics offering travel packages.' },
      { question: 'How quickly will I feel relief from jet lag symptoms?', answer: 'Rehydration is felt during the session; any lift in energy or clarity is anecdotal.' },
      { question: 'Is IV therapy for jet lag covered by insurance?', answer: 'Jet lag IV therapy is typically an out-of-pocket expense and not covered by insurance.' }
    ]
  },
  {
    slug: 'fatigue',
    title: 'Fatigue',
    icon: 'BatteryLow',
    serviceTag: 'Energy',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-fatigue.jpg`,
    description: 'IV therapy is commonly used for those seeking a natural-feeling boost to their daily vitality. Unlike caffeine, which can lead to a crash, nutrient-focused IV drips aim to support the body\'s natural energy production processes. It is often used by busy parents, students, and professionals who feel "run down" and need a reliable way to replenish their reserves. By delivering B vitamins and amino acids directly to the cells, many people report a sustained sense of alertness and well-being that helps them tackle their to-do list with renewed vigor.',
    whyItWorks: 'Fatigue is often a symptom of underlying dehydration or a deficiency in the vitamins that act as cofactors in the body\'s energy production cycle (the Krebs cycle). Many people find that B-complex vitamins, particularly B12, are essential for converting food into usable energy. When these are delivered via IV, they bypass the digestive tract where absorption can be limited by factors like stress or gut health.\n\nMany individuals report that the addition of amino acids helps support muscle function and reduces the feeling of physical exhaustion. By ensuring the body is fully hydrated and has a surplus of these energy-supporting nutrients, IV therapy helps provide a foundation for sustained vitality without the "jitters" associated with energy drinks or excessive coffee.',
    comparisons: 'Oral energy supplements often contain high amounts of sugar and caffeine, which provide a temporary spike followed by a significant crash. IV therapy focuses on replenishing the actual building blocks of energy, providing a more natural and long-lasting lift. An IV bypasses digestion entirely, though it is fair to know that at ordinary intakes oral absorption of most vitamins is already good, and persistent fatigue is a reason for bloodwork with your doctor rather than a menu decision.',
    typicalPatient: 'The typical patient for fatigue IV therapy is a high-achiever juggling multiple responsibilities. This includes corporate professionals, parents of young children, and students during intense study periods. It is also popular among those recovering from a busy season of life who need to "reset" their energy levels.',
    ingredients: ['Vitamin B Complex', 'Vitamin B12', 'Amino Acids', 'Vitamin C', 'Magnesium'],
    ingredientsDetailed: [
      { name: 'Vitamin B Complex', role: 'A group of 8 vitamins that help convert nutrients into energy.' },
      { name: 'Vitamin B12', role: 'Essential for red blood cell formation and healthy nerve function.' },
      { name: 'Amino Acids', role: 'The building blocks of protein that support muscle recovery and energy.' },
      { name: 'Vitamin C', role: 'A powerful antioxidant that supports the adrenal glands during times of stress.' },
      { name: 'Magnesium', role: 'Supports over 300 biochemical reactions, including energy production.' }
    ],
    sessionExpectation: 'The session is a peaceful break in your day, typically taking 45-60 minutes. You\'ll leave feeling refreshed and hydrated, often with a noticeable lift in your energy levels. Many clinics offer comfortable recliners and a quiet atmosphere, making it a perfect time to meditate or simply disconnect from your phone.',
    faqs: [
      { question: 'How often can I get IV therapy for fatigue?', answer: 'Frequency depends on individual needs, but many people choose to have a session once or twice a month.' },
      { question: 'Will IV therapy for fatigue make me jittery?', answer: 'No, unlike stimulants, IV therapy supports energy through hydration and essential nutrients.' },
      { question: 'What is the best time of day for IV therapy for fatigue?', answer: 'Morning or early afternoon is often preferred to help power you through the rest of your day.' },
      { question: 'Does IV therapy for fatigue help with mental clarity?', answer: 'Many people report improved focus and reduced "brain fog" along with increased physical energy.' },
      { question: 'Is IV therapy for fatigue suitable for everyone?', answer: 'It is commonly used by healthy adults looking to support their daily energy levels.' },
      { question: 'How much does IV therapy for fatigue cost?', answer: 'Prices usually start around $150 and can go up to $400 for more complex nutrient blends.' },
      { question: 'How quickly will I feel relief from fatigue symptoms?', answer: 'Some people describe feeling more energetic the same day; others notice little. There is no reliable timeline, and results vary by person and cause.' },
      { question: 'Is IV therapy for fatigue covered by insurance?', answer: 'Most insurance providers do not cover IV therapy for general fatigue or wellness support.' }
    ]
  },
  {
    slug: 'cold-and-flu',
    title: 'Cold & Flu',
    icon: 'Thermometer',
    serviceTag: 'Immunity',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-cold-and-flu.jpg`,
    description: 'IV therapy is commonly used for those experiencing the early signs of a seasonal sniffle or a scratchy throat. By delivering high doses of Vitamin C and zinc along with essential fluids, many people use this approach to support their body\'s natural defenses. It\'s often favored by those who want to avoid the dehydration that can occur during a bout of illness. While it doesn\'t replace rest and traditional care, it is a popular supportive measure for those looking to feel more comfortable and hydrated while they recover.',
    whyItWorks: 'Clinics build these drips around high-dose vitamin C and zinc because both nutrients have roles in immune cell function. That is a fact about nutrition, not evidence that infusing them changes the course of a cold; trials of vitamin C for colds show little to no effect in people who are not deficient.\n\nDehydration is a common side effect of illness, especially with a fever or when you cannot keep fluids down, and a litre of fluids addresses that directly. Some people report feeling less "run down" afterward, which is mostly the rehydration.',
    comparisons: 'When you are sick, your digestive system may not be functioning at its best, making it difficult to absorb oral vitamins and stay hydrated through drinking alone. IV therapy bypasses the gut, which genuinely helps with hydration when drinking is hard. On the vitamins themselves, the honest picture is that correcting a real deficiency helps immunity, while surplus in a well-nourished body is mostly excreted.',
    typicalPatient: 'Typical users include busy professionals who can\'t afford to be out of commission, parents who need to stay healthy for their families, and anyone who wants to support their recovery process with deep hydration and targeted nutrients at the first sign of symptoms.',
    ingredients: ['High-dose Vitamin C', 'Zinc', 'Hydration fluids', 'B vitamins', 'Selenium'],
    ingredientsDetailed: [
      { name: 'High-dose Vitamin C', role: 'Included for its role in immune cell function; no evidence it shortens a cold.' },
      { name: 'Zinc', role: 'A mineral involved in immune cell development and function.' },
      { name: 'Hydration Fluids', role: 'Restores fluid balance when fever or poor intake has left you dehydrated.' },
      { name: 'B vitamins', role: 'Supports energy levels which are often depleted when the body is fighting illness.' },
      { name: 'Selenium', role: 'An antioxidant that helps protect cells from damage during an immune response.' }
    ],
    sessionExpectation: 'If you\'re feeling unwell, many services offer mobile visits so you don\'t have to leave home. The process is gentle and focused on making you as comfortable as possible. A typical session lasts 45-60 minutes, and many people find the extra hydration helps them feel more alert and comfortable almost immediately.',
    faqs: [
      { question: 'Can IV therapy for cold and flu prevent illness?', answer: 'No. There is no evidence that an IV prevents colds or flu. Vaccination, hand hygiene and sleep are what the evidence supports.' },
      { question: 'Is it safe to get IV therapy for cold and flu while sick?', answer: 'For most healthy adults under supervision, yes, and the hydration is the useful part. Severe or worsening illness needs a doctor, not a drip.' },
      { question: 'What is the main benefit of IV therapy for cold and flu?', answer: 'Rapid rehydration when you cannot keep fluids down. The vitamin C and zinc are included on nutritional grounds, not because they change the course of the illness.' },
      { question: 'How long does a cold and flu IV session take?', answer: 'Most sessions are completed within 45 to 60 minutes.' },
      { question: 'Should I get IV therapy for cold and flu at the first sign of symptoms?', answer: 'Clinics market it for the first sign of symptoms; there is no evidence that timing changes the course of the illness. If you cannot keep fluids down, that is the clearer reason.' },
      { question: 'How much does IV therapy for cold and flu cost?', answer: 'Prices typically range from $175 to $350, depending on the add-ons.' },
      { question: 'How quickly will I feel relief from cold and flu symptoms?', answer: 'While it doesn\'t cure the virus, many people feel more hydrated and less fatigued within an hour.' },
      { question: 'Is IV therapy for cold and flu covered by insurance?', answer: 'Insurance rarely covers IV therapy for seasonal illnesses, though some flexible spending accounts may apply.' }
    ]
  },
  {
    slug: 'sports-recovery',
    title: 'Sports Recovery',
    icon: 'Dumbbell',
    serviceTag: 'Recovery',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-sports-recovery.jpg`,
    description: 'Athletes and fitness enthusiasts often push their bodies to the limit, leading to muscle soreness and nutrient depletion. IV therapy is a staple for many people in the fitness community, commonly used for post-workout recovery and pre-event preparation. By delivering amino acids and electrolytes directly to the muscles, it helps support the body\'s natural repair processes. Many people use it after marathons, heavy lifting sessions, or intense training blocks to help reduce the time they spend feeling sore. It\'s a popular way to ensure your body has exactly what it needs to bounce back and perform at its best again, whether you are a professional or a dedicated amateur.',
    whyItWorks: 'During intense physical activity, the body loses significant amounts of water and electrolytes through sweat, and muscles undergo micro-tears that require repair. Many people find that the rapid delivery of amino acids like glutamine and arginine helps support muscle protein synthesis. Magnesium is another key ingredient that many individuals use to help reduce muscle tension and prevent cramping.\n\nBy delivering these nutrients via IV, they reach the muscle tissues much faster than oral supplements. Many athletes report that the deep hydration provided by the saline base helps flush out lactic acid and other metabolic byproducts that contribute to post-exercise soreness. This comprehensive approach to recovery is why many people find they can return to their training schedule sooner after an IV session.',
    comparisons: 'Oral recovery drinks often contain high levels of sugar and artificial colors, and their absorption is limited by the speed of the digestive system. IV therapy provides a direct route for nutrients into the bloodstream, bypassing digestion. Many people find that the immediate rehydration from an IV is far superior to drinking large volumes of water, which can sometimes lead to bloating or discomfort during recovery.',
    typicalPatient: 'The typical user for sports recovery IV therapy ranges from professional athletes and marathon runners to "weekend warriors" and fitness enthusiasts. It is also popular among those preparing for or recovering from physically demanding events like triathlons, CrossFit competitions, or long hiking trips.',
    ingredients: ['Amino Acid blend', 'Magnesium', 'Electrolytes', 'Vitamin B12', 'Glutathione'],
    ingredientsDetailed: [
      { name: 'Amino Acid blend', role: 'Provides the building blocks for muscle repair and growth.' },
      { name: 'Magnesium', role: 'Helps relax muscles and supports healthy nerve function.' },
      { name: 'Electrolytes', role: 'Restores the balance of minerals lost through intense sweating.' },
      { name: 'Vitamin B12', role: 'Supports energy metabolism and red blood cell production.' },
      { name: 'Glutathione', role: 'A powerful antioxidant that helps reduce oxidative stress caused by exercise.' }
    ],
    sessionExpectation: 'The session is a great time to rest your muscles. You\'ll be in a comfortable chair for about 45-60 minutes, allowing the recovery nutrients to circulate throughout your body. Many people find it helpful to use this time for mental recovery as well, practicing visualization or simply resting in a quiet environment.',
    faqs: [
      { question: 'When is the best time for IV therapy for sports recovery?', answer: 'Most athletes prefer a session within 24 hours after an intense workout or competition.' },
      { question: 'Does IV therapy for sports recovery help with muscle cramps?', answer: 'By replenishing electrolytes and magnesium, it may help support healthy muscle function.' },
      { question: 'What amino acids are in a sports recovery IV?', answer: 'Common additions include glutamine, arginine, and ornithine to support muscle repair.' },
      { question: 'Is IV therapy for sports recovery only for pro athletes?', answer: 'Not at all; it is commonly used by weekend warriors and anyone with an active lifestyle.' },
      { question: 'Can IV therapy for sports recovery improve performance?', answer: 'By supporting faster recovery, it may help you stay consistent with your training schedule.' },
      { question: 'How much does IV therapy for sports recovery cost?', answer: 'Prices generally range from $175 to $350, with some clinics offering athlete-specific packages.' },
      { question: 'Is IV therapy for sports recovery covered by insurance?', answer: 'Sports recovery IVs are typically considered performance-enhancing wellness services and are not covered by insurance.' }
    ]
  },
  {
    slug: 'migraine',
    title: 'Migraine',
    icon: 'Headset',
    serviceTag: 'Migraine',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-migraine.jpg`,
    description: 'IV therapy is commonly used for individuals looking to manage the dehydration and nutrient imbalances that can accompany severe headaches. Many people find that the combination of magnesium and rapid hydration helps them feel more comfortable during a flare-up. It is often used in a calm, dark environment to minimize sensory input while the fluids are administered. While not a cure, it is a popular supportive option for those who want to address the physical toll that intense head pressure and nausea can take on the body.',
    whyItWorks: 'Magnesium is the ingredient with a real clinical record: emergency departments give IV magnesium, with antiemetics and other medication, for acute migraine under medical supervision. A wellness clinic drip borrows the magnesium and the fluids without that setting or the prescription components, so it should not be expected to do the same job.\n\nDehydration is a known trigger for many people, and the nausea that comes with a migraine can make drinking impossible, which is the practical reason people choose the IV route. B vitamins are included for general reasons, not migraine evidence.',
    comparisons: 'Oral medications and supplements can be difficult to take during a migraine due to stomach sensitivity and nausea. IV therapy bypasses the digestive system, so fluids go in even when you cannot drink; that is the one clear advantage. Your migraine medication plan belongs with your doctor, and a new or worst-ever headache needs emergency care.',
    typicalPatient: 'Typical users include chronic migraine sufferers who are looking for supportive measures to use alongside their traditional care. It is also popular among those who experience occasional but severe tension headaches and want a way to address the dehydration and nutrient depletion that often follows.',
    ingredients: ['Magnesium', 'Hydration fluids', 'Vitamin B2', 'Vitamin B12', 'Anti-inflammatory support'],
    ingredientsDetailed: [
      { name: 'Magnesium', role: 'The ingredient emergency departments use for acute migraine under medical supervision.' },
      { name: 'Hydration Fluids', role: 'Rehydration; dehydration is a common headache trigger.' },
      { name: 'Vitamin B2 (Riboflavin)', role: 'Commonly included; the riboflavin evidence is for daily oral use, not infusion.' },
      { name: 'Vitamin B12', role: 'Included for general reasons, not migraine evidence.' },
      { name: 'Anti-inflammatory support', role: 'Prescription anti-inflammatory, only where a prescriber orders it.' }
    ],
    sessionExpectation: 'Clinics often provide a dim, quiet room for these sessions. You can rest in a comfortable recliner for about 60 minutes in a peaceful atmosphere. Many people find it helpful to bring an eye mask and noise-canceling headphones to create a truly sensory-neutral environment while the drip is administered.',
    faqs: [
      { question: 'How does IV therapy for migraine help?', answer: 'Emergency departments use IV magnesium and antiemetics for acute migraine under medical supervision; a wellness drip is not that. What a clinic drip offers is fluids and magnesium, and where a prescriber is involved, anti-nausea medication.' },
      { question: 'Can I get IV therapy for migraine at home?', answer: 'Yes, mobile IV services are a popular choice so you can stay in a comfortable, familiar environment.' },
      { question: 'What is the most important ingredient in a migraine IV?', answer: 'Magnesium is the most commonly included mineral, because it is what hospitals use for acute migraine under supervision.' },
      { question: 'Is IV therapy for migraine a common treatment?', answer: 'Hospitals use IV migraine cocktails, which is where the idea comes from. A wellness clinic version is not a treatment for migraine; it is fluids and magnesium marketed for comfort during an attack, and a new or worst-ever headache needs emergency care.' },
      { question: 'How long does it take to feel better after IV therapy for migraine?', answer: 'Some people report feeling more comfortable and hydrated shortly after the session; that is anecdotal.' },
      { question: 'How much does IV therapy for migraine cost?', answer: 'Costs typically range from $200 to $400, often depending on the inclusion of specific anti-nausea or anti-inflammatory support.' },
      { question: 'How quickly will I feel relief from migraine symptoms?', answer: 'There is no trial evidence on a wellness drip. Rehydration is felt during the session; anything else is anecdotal. Emergency departments treat acute migraine with IV medication under supervision, and that is the setting for real relief.' },
      { question: 'Is IV therapy for migraine covered by insurance?', answer: 'While some specialized clinics may work with insurance, most IV therapy for migraines is an out-of-pocket expense.' }
    ]
  },
  {
    slug: 'weight-loss',
    title: 'Weight Loss',
    icon: 'Scale',
    serviceTag: 'Weight Loss',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-weight-loss.jpg`,
    description: 'Clinics market "weight loss" or "fat-burning" drips built on lipotropic compounds (MIC) and B vitamins to people already on a diet and exercise plan. Nothing in a vitamin blend changes energy balance, and the evidence for MIC blends is weak, so these are sold as a supportive add-on rather than a treatment. Prescription weight-loss medication is a different, prescriber-only category. People book these drips for energy during a calorie deficit; weight change comes from the plan, not the bag.',
    whyItWorks: 'Metabolism runs on reactions that use B vitamins as cofactors, and methionine, inositol and choline (MIC) are involved in how the liver handles fats. Those are facts about nutrition; they are not evidence that infusing them burns fat or moves the scale, and no large trial shows the combined formula does. L-carnitine is included on the same basis.\n\nWhat the drip can reasonably do is top up B vitamins in someone eating less than usual. Any weight result belongs to the diet and activity around it.',
    comparisons: 'Oral weight loss supplements often contain stimulants that can cause jitters and sleep disturbances. The honest mechanism review on vitamin drips for weight is short: nothing in a vitamin blend changes energy balance, and the evidence for MIC blends is weak. Prescription weight-loss medication is a different, genuinely effective category that belongs with a prescriber who assesses you.',
    typicalPatient: 'The typical user for weight loss IV therapy is a health-conscious adult who is already following a balanced diet and exercise plan but wants to optimize their nutrient levels. It is also popular among those who are starting a new fitness challenge and want to ensure their energy levels stay high as they increase their activity.',
    ingredients: ['Lipotropic compounds (MIC)', 'Vitamin B12', 'L-Carnitine', 'Vitamin B Complex', 'Taurine'],
    ingredientsDetailed: [
      { name: 'Lipotropic compounds (MIC)', role: 'Methionine, inositol and choline; marketed for fat metabolism, with weak evidence.' },
      { name: 'Vitamin B12', role: 'A B vitamin involved in energy metabolism.' },
      { name: 'L-Carnitine', role: 'Involved in moving fatty acids into cells; no evidence infusing it drives weight loss.' },
      { name: 'Vitamin B Complex', role: 'Cofactors in converting food into usable energy.' },
      { name: 'Taurine', role: 'A common clinic add-on.' }
    ],
    sessionExpectation: 'The session is a simple addition to your weekly routine, taking about 45 minutes. It\'s a good time to focus on your wellness goals and plan your healthy meals for the week. Many people find the quiet time in the clinic helps them stay motivated and committed to their long-term health journey.',
    faqs: [
      { question: 'Does IV therapy for weight loss work without exercise?', answer: 'No drip causes weight loss on its own, with or without exercise. Any result comes from the diet and activity plan it is sold alongside.' },
      { question: 'How often should I get IV therapy for weight loss?', answer: 'Clinics typically sell it weekly or every other week as a series. There is no evidence-backed schedule, because there is no evidence the drip itself changes weight.' },
      { question: 'What are lipotropic compounds in a weight loss IV?', answer: 'Methionine, inositol, and choline, nutrients involved in how the liver handles fats. They are marketed for fat metabolism; the evidence that infusing them changes weight is weak.' },
      { question: 'Will IV therapy for weight loss give me more energy?', answer: 'B vitamins are included for that reason; the lift is modest unless you are deficient.' },
      { question: 'Is IV therapy for weight loss safe?', answer: 'It is commonly used by healthy adults under supervision, with mild side effects. A clinician should screen you first.' },
      { question: 'How much does IV therapy for weight loss cost?', answer: 'Prices generally range from $150 to $300 per session, with many clinics offering multi-session packages.' },
      { question: 'Is IV therapy for weight loss covered by insurance?', answer: 'Weight loss IV therapy is almost always considered an elective wellness service and is not covered by insurance.' }
    ]
  },
  {
    slug: 'skin-glow',
    title: 'Skin Glow',
    icon: 'Sparkles',
    serviceTag: 'Beauty',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-skin-glow.jpg`,
    description: 'True beauty often starts from within, and hydration is the foundation of a healthy complexion. IV therapy is a popular choice for those seeking a "lit-from-within" radiance, commonly used for skin brightening and overall rejuvenation. By delivering high doses of antioxidants like glutathione and Vitamin C, many people use these drips to support their skin\'s natural defense against environmental stress and oxidative damage. It is often favored before big events or as part of a regular skincare routine to help maintain a hydrated, youthful appearance. Many people report that their skin looks more plump and vibrant after a session of deep hydration.',
    whyItWorks: 'The honest version: the marketed skin benefits of these drips are not established in good clinical evidence. Glutathione is a real antioxidant your own cells make, vitamin C genuinely matters for collagen, and neither fact is proof that infusing them changes how your skin looks. Where people report changes with glutathione they are described as gradual and temporary, which makes any effect an ongoing paid subscription rather than a result.\n\nThe specific skin-brightening or whitening pitch carries an actual regulatory record: no injectable drug is approved for skin lightening by the US FDA, which has warned these are unapproved products, and Canada has had documented contamination incidents with injectable glutathione supplied to clinics. If you consider one anyway, the highest-value question is where the product in the vial is compounded.',
    comparisons: 'Topical skincare and sunscreen have the evidence for skin appearance. An IV is marketed as working "from the inside out", but there is no good evidence that infusing glutathione or vitamin C changes how skin looks in people who are not deficient.',
    typicalPatient: 'Typical users include brides and grooms preparing for their wedding, professionals who are frequently on camera, and anyone who wants to support their skincare routine with deep hydration and potent antioxidants. It is also popular among those who spend a lot of time outdoors and want to support their skin after sun exposure.',
    ingredients: ['Glutathione', 'Vitamin C', 'Biotin', 'Hydration fluids', 'B-Complex vitamins'],
    ingredientsDetailed: [
      { name: 'Glutathione', role: 'An antioxidant your own cells produce; marketed for skin effects that remain unproven, and the one ingredient where asking about product sourcing matters most.' },
      { name: 'Vitamin C', role: 'Essential for collagen synthesis and protecting skin from environmental damage.' },
      { name: 'Biotin', role: 'A B vitamin marketed for hair, skin and nails; little benefit unless deficient.' },
      { name: 'Hydration Fluids', role: 'Rehydrates; the one part of the drip that reliably does what it says.' },
      { name: 'B-Complex vitamins', role: 'Included for general reasons; no skin evidence.' }
    ],
    sessionExpectation: 'This is a true "beauty break." You\'ll relax for about 45-60 minutes, and some people describe a "glow" afterward, which is subjective. Many clinics offer a spa-like atmosphere for these sessions, making it a perfect time to unwind and focus on self-care.',
    faqs: [
      { question: 'How many sessions of IV therapy for skin glow do I need?', answer: 'Clinics usually sell it as a series. There is no evidence a series produces a lasting skin change, so decide based on whether you want the experience, not a promised result.' },
      { question: 'What is glutathione in a skin glow IV?', answer: 'An antioxidant your own cells make, marketed for skin brightening. The honest picture: those effects are not established in good evidence, no injectable is approved for skin lightening by the US FDA, and the documented harms in Canada came from contaminated product, so ask where the vial is compounded.' },
      { question: 'Can IV therapy for skin glow help with acne?', answer: 'No. There is no evidence that an IV drip helps acne. See a dermatologist; acne has prescription and topical options that do.' },
      { question: 'Is biotin included in IV therapy for skin glow?', answer: 'Yes, biotin is often added and marketed for hair, skin, and nails. Research shows little benefit unless you are deficient.' },
      { question: 'How long does the "glow" from IV therapy for skin glow last?', answer: 'Any hydration effect fades within days. There is no evidence of a lasting skin change.' },
      { question: 'How much does IV therapy for skin glow cost?', answer: 'Prices typically range from $200 to $450, depending on the concentration of glutathione and other antioxidants.' },
      { question: 'Is IV therapy for skin glow covered by insurance?', answer: 'As a cosmetic beauty service, IV therapy for skin glow is not covered by health insurance.' }
    ]
  },
  {
    slug: 'stress',
    title: 'Stress',
    icon: 'Wind',
    serviceTag: 'Wellness',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-stress.jpg`,
    description: 'IV therapy is commonly used for those seeking a natural way to support their body\'s response to stress and promote a sense of calm. Many people use drips containing magnesium and B vitamins to help support their nervous system and reduce the feeling of "burnout." It is often favored by those who find that stress affects their sleep, mood, and energy levels. By providing the essential nutrients that the body depletes more quickly during stressful periods, many people report feeling more balanced and resilient in the face of daily challenges. The forced "time-out" of a 60-minute session also provides a much-needed mental break from the constant demands of modern life.',
    whyItWorks: 'When the body is under stress, it enters a "fight or flight" state that increases the demand for certain nutrients, particularly magnesium and B-complex vitamins. Many people find that magnesium helps support the relaxation of both muscles and the nervous system, while B vitamins are essential for the production of neurotransmitters like serotonin and dopamine that regulate mood.\n\nBy delivering these nutrients via IV, they are immediately available to the body without the need for digestive processing, which can often be impaired by stress itself. Many individuals report that the deep hydration provided by the saline base helps reduce the physical symptoms of stress, such as tension headaches and fatigue. This direct approach to nutrient replenishment helps provide the foundation for a more calm and focused state of mind, helping you navigate your responsibilities with greater ease.',
    comparisons: 'Oral stress supplements often take weeks of consistent use to show anything, and their absorption can be inconsistent. IV therapy delivers the nutrients at once, but there is no evidence infused vitamins outperform oral ones for stress in well-nourished people. What many people notice is the hour of rest. It is a popular choice for those who want a "reset" during particularly intense periods of life.',
    typicalPatient: 'Typical users include high-level executives, healthcare workers, parents, and anyone experiencing a period of significant life transition or high workload. It is also popular among those who prioritize mental wellness and want to support their body\'s stress-management capabilities naturally without relying on stimulants or heavy medications.',
    ingredients: ['Magnesium', 'Vitamin B Complex', 'Vitamin C', 'Hydration fluids'],
    ingredientsDetailed: [
      { name: 'Magnesium', role: 'Often called the "relaxation mineral" on clinic menus; included for muscle tension.' },
      { name: 'Vitamin B Complex', role: 'Involved in energy metabolism and neurotransmitter synthesis; no stress evidence in well-nourished people.' },
      { name: 'Vitamin C', role: 'Included as an antioxidant; the adrenal-support pitch is marketing.' },
      { name: 'Hydration Fluids', role: 'Rehydrates, which is the part of the drip most people feel.' }
    ],
    sessionExpectation: 'The session is designed to be a peaceful sanctuary. You\'ll relax for 45-60 minutes in a quiet, comfortable environment. Many people find it helpful to use this time for deep breathing or meditation, allowing the supportive nutrients to help their body transition from a state of stress to one of relaxation. Most clinics offer dim lighting and comfortable recliners to enhance the experience.',
    faqs: [
      { question: 'Can IV therapy for stress help me sleep better?', answer: 'There is no evidence it does. The hour of enforced rest is real; the vitamins have no sleep evidence in well-nourished people.' },
      { question: 'How does magnesium in IV therapy for stress work?', answer: 'Magnesium is commonly used to support muscle relaxation and a healthy nervous system.' },
      { question: 'Is IV therapy for stress better than taking oral supplements?', answer: 'An IV bypasses digestion, but at ordinary intakes oral absorption is already good, and there is no evidence infused vitamins outperform oral ones for stress in well-nourished people. The honest benefits of a session are the fluids, the hour of enforced rest, and the ritual, which are real but purchasable more cheaply.' },
      { question: 'How often should I get IV therapy for stress?', answer: 'Many people find a monthly session or a session during particularly busy weeks to be very supportive.' },
      { question: 'What is the most relaxing part of IV therapy for stress?', answer: 'The quiet hour. Magnesium is marketed as calming; the rest and the ritual are what most people actually notice.' },
      { question: 'How much does IV therapy for stress cost?', answer: 'Prices generally range from $150 to $300, depending on the ingredients included.' },
      { question: 'Is IV therapy for stress covered by insurance?', answer: 'Stress management IV therapy is typically considered a wellness service and is not covered by insurance.' }
    ]
  },
  {
    slug: 'stomach-flu',
    title: 'Stomach Flu',
    icon: 'Activity',
    serviceTag: 'Stomach Flu',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-stomach-flu.jpg`,
    description: 'IV therapy is a common supportive measure for those looking to address the dehydration that often accompanies the stomach flu. When you are unable to keep fluids down, a direct IV infusion is the most direct way to restore fluid balance. It is often used to help reduce the feeling of extreme weakness and lightheadedness that comes with severe dehydration. While it doesn\'t treat the virus itself, many people report that the rapid rehydration helps them feel significantly more comfortable as they recover.',
    whyItWorks: 'The primary danger of the stomach flu is dehydration, which occurs when the body loses more fluids than it can take in. Many people find that oral rehydration is difficult or impossible during an active flare-up. IV therapy provides a direct route for fluids and electrolytes, ensuring they reach the bloodstream immediately and bypass the irritated digestive system.\n\nMany individuals report that the addition of anti-nausea support helps settle their stomach, making it easier for them to eventually resume oral hydration. By restoring fluid balance and providing essential minerals like sodium and potassium, IV therapy helps support the body\'s overall resilience and reduces the physical toll of the illness. This rapid rehydration is often the key to feeling more alert and comfortable during recovery.',
    comparisons: 'Drinking water or electrolyte drinks is the traditional advice for stomach bugs, but many people find they simply cannot keep enough down to stay hydrated. Genuinely being unable to keep fluids down is the one situation where IV rehydration clearly beats drinking, because it bypasses the stomach entirely. It is also a situation worth a call to a clinic or telehealth line first, since worsening dehydration during an acute illness can need proper medical care rather than a lounge visit.',
    typicalPatient: 'Typical users include anyone who is struggling to maintain hydration during a bout of stomach flu, as well as those who have recently recovered from the acute phase and want to replenish their energy and fluid levels quickly.',
    ingredients: ['Saline solution', 'Electrolytes', 'Anti-nausea support', 'Vitamin B Complex', 'Vitamin C'],
    ingredientsDetailed: [
      { name: 'Saline Solution', role: 'Provides the immediate fluid volume needed to restore hydration and blood volume.' },
      { name: 'Electrolytes', role: 'Essential minerals like potassium and sodium that are lost during illness.' },
      { name: 'Anti-nausea support', role: 'Helps calm the digestive system and reduce the feeling of queasiness.' },
      { name: 'Vitamin B Complex', role: 'Supports energy production which is often severely depleted during illness.' },
      { name: 'Vitamin C', role: 'Provides general antioxidant support for the body during recovery.' }
    ],
    sessionExpectation: 'If you are actively unwell, many providers offer mobile services so you can stay in the comfort of your own home. The session lasts about 45-60 minutes, and the focus is on gentle, effective rehydration. Many people find that the cooling effect of the fluids helps them feel more comfortable and alert almost immediately.',
    faqs: [
      { question: 'Can IV therapy help with stomach flu symptoms?', answer: 'By providing rapid rehydration and anti-nausea support, many people find it helps them feel more comfortable during recovery.' },
      { question: 'Is IV therapy for stomach flu safe?', answer: 'It is a common supportive measure for hydration, but you should always consult with a healthcare professional for medical advice.' },
      { question: 'How quickly does IV therapy for stomach flu work?', answer: 'The hydration benefits are immediate, which many people find helps reduce the feeling of weakness quickly.' },
      { question: 'What is the best ingredient for a stomach flu IV?', answer: 'A balanced saline solution and electrolytes are the most critical components for restoring fluid balance.' },
      { question: 'Can I get IV therapy for stomach flu at home?', answer: 'Yes, mobile IV services are highly recommended for those who are too unwell to travel to a clinic.' },
      { question: 'How much does IV therapy for stomach flu cost?', answer: 'Prices typically range from $175 to $375, often depending on whether mobile service is required.' },
      { question: 'How quickly will I feel relief from stomach flu symptoms?', answer: 'Rehydration itself happens during the drip, so lightheadedness from fluid loss often eases the same day. How you feel afterward depends on what caused the illness.' },
      { question: 'Is IV therapy for stomach flu covered by insurance?', answer: 'Typically, this is an out-of-pocket wellness service, though some HSA/FSA plans may be accepted.' }
    ]
  },
  {
    slug: 'immunity',
    title: 'Immunity',
    icon: 'ShieldCheck',
    serviceTag: 'Immunity',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-immunity.jpg`,
    description: 'IV therapy is commonly booked for "immune support", especially before travel, at seasonal changes, or during busy periods. These drips are built around vitamin C, zinc and antioxidants. There is no evidence that they prevent illness in people who are not deficient; what they offer is hydration and a top-up of nutrients most people already get from food.',
    whyItWorks: 'The immune system uses vitamin C and zinc, and both matter if you are deficient. In well-nourished people, extra does not add protection: trials of vitamin C show it does not prevent colds in the general population, and the surplus from an infusion is excreted.\n\nGlutathione is a common antioxidant add-on with no immune-outcome evidence. What a drip reliably does is hydrate, which is why some people report feeling better after one; it is not a substitute for vaccination, sleep and hand hygiene before travel or during flu season.',
    comparisons: 'Oral immune supplements can be hard on the stomach in high doses and are subject to the limitations of the digestive system. IV therapy delivers nutrients directly into the bloodstream, bypassing digestion. Many people find that the direct delivery of high-dose Vitamin C and zinc provides a level of support that is difficult to achieve through diet and oral pills alone.',
    typicalPatient: 'Typical users include frequent travelers, teachers, healthcare workers, and anyone who wants to take a proactive approach to their health. It is also popular among those who are feeling slightly "run down" and want to support their system before a full-blown illness can take hold.',
    ingredients: ['Vitamin C', 'Zinc', 'Selenium', 'Vitamin B12', 'Glutathione'],
    ingredientsDetailed: [
      { name: 'Vitamin C', role: 'Involved in immune cell function; extra adds nothing if you are not deficient.' },
      { name: 'Zinc', role: 'A mineral involved in immune cell development; no evidence infusing it prevents illness.' },
      { name: 'Selenium', role: 'An antioxidant mineral; included on general grounds.' },
      { name: 'Vitamin B12', role: 'Included for energy metabolism.' },
      { name: 'Glutathione', role: 'An antioxidant add-on; no evidence it changes immune outcomes.' }
    ],
    sessionExpectation: 'The session is a proactive step for your health, taking about 45-60 minutes. It\'s a comfortable process that leaves you feeling hydrated and well-supported. You can relax in a comfortable chair, read, or listen to a podcast while the immune-supporting nutrients are administered by a trained professional.',
    faqs: [
      { question: 'Can I get IV therapy for immunity every week?', answer: 'While safe for many, most people choose a session once or twice a month for ongoing support.' },
      { question: 'What is the best vitamin for IV therapy for immunity?', answer: 'Vitamin C and Zinc are the most common and well-known ingredients for supporting immune health.' },
      { question: 'Is IV therapy for immunity good for travel prep?', answer: 'It is commonly booked before trips. There is no evidence it prevents travel illness.' },
      { question: 'Does IV therapy for immunity help with allergies?', answer: 'No. There is no evidence an IV drip helps allergies; antihistamines and a plan from your doctor do.' },
      { question: 'Who typically gets IV therapy for immunity?', answer: 'It is popular among travelers, teachers, and anyone who wants to feel proactive about their health.' },
      { question: 'How much does IV therapy for immunity cost?', answer: 'Prices generally range from $175 to $350, with some clinics offering seasonal immunity packages.' },
      { question: 'Is IV therapy for immunity covered by insurance?', answer: 'Immune support IV therapy is typically considered a wellness service and is not covered by insurance.' }
    ]
  },
  {
    slug: 'morning-sickness',
    title: 'Morning Sickness',
    icon: 'Baby',
    serviceTag: 'Prenatal',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-morning-sickness.jpg`,
    description: 'Nausea and vomiting of pregnancy is a genuine medical issue with genuine medical pathways, and that is where this page starts: with your obstetric provider, not with a menu. IV rehydration is established hospital care for severe cases, delivered with diagnosis and monitoring. An elective wellness drip in pregnancy is a different product without that oversight, and the confident yes you may have read elsewhere online almost always comes from someone selling the service. Talk to your OB, midwife or family doctor first. A drip that is genuinely appropriate for you will still be appropriate after that conversation.',
    whyItWorks: 'Morning sickness, or Nausea and Vomiting of Pregnancy (NVP), can lead to dehydration, and severe cases, hyperemesis gravidarum, are one of the most common reasons pregnant women are admitted to hospital. In that setting, IV fluids are established care, alongside prescription anti-nausea medications chosen for their pregnancy safety data, electrolyte correction and monitoring.\n\nEverything in that sentence matters: a diagnosis, medications with pregnancy evidence, and an obstetric team. Effective treatment for pregnancy nausea exists, including prescription options your provider can offer, and if you cannot keep fluids down, that is a same-day call to your care provider or urgent care, not a booking decision.',
    comparisons: 'The comparison that matters in pregnancy is not IV versus oral. It is medical care versus a wellness menu. Hospital IV treatment for severe pregnancy nausea comes with diagnosis, pregnancy-specific medication choices and monitoring. A wellness clinic drip skips the assessment that determines what you actually need, and what is appropriate in pregnancy depends on trimester, dose and your history, a judgment that belongs to a prescriber who knows your pregnancy.',
    typicalPatient: 'If your nausea is mild, your provider can suggest options with pregnancy safety data, and hydration by drinking usually works. If it is significant or you are losing weight, dizzy, or unable to keep fluids down, you may be dealing with hyperemesis gravidarum, which deserves proper medical assessment and treatment, not a lounge chair. Either way, the right first stop is the person managing your pregnancy.',
    ingredients: ['Saline solution', 'Vitamin B6', 'Vitamin B12', 'Electrolytes', 'Folic Acid (optional)'],
    ingredientsDetailed: [
      { name: 'Saline Solution', role: 'Provides the essential hydration needed to support both mother and baby.' },
      { name: 'Vitamin B6', role: 'A key nutrient that many people find helps reduce the feeling of pregnancy-related nausea.' },
      { name: 'Vitamin B12', role: 'Supports energy levels and healthy red blood cell production during pregnancy.' },
      { name: 'Electrolytes', role: 'Restores the balance of minerals that can be lost through vomiting or poor intake.' },
      { name: 'Folic Acid (optional)', role: 'A critical B-vitamin for the healthy development of the baby\'s neural tube.' }
    ],
    sessionExpectation: 'If you and your obstetric provider decide an IV makes sense, expect a proper health screening first, a clear ingredient list before you consent, and a named prescriber behind anything beyond fluids. Sessions run about 45 to 60 minutes. A clinic that treats a pregnant patient without asking about the pregnancy has failed the only test that matters.',
    faqs: [
      { question: 'Is IV therapy for morning sickness safe during pregnancy?', answer: 'That question is too broad to answer honestly with yes or no, and the confident yes you find online almost always comes from companies selling the service. IV rehydration is established hospital care for severe pregnancy nausea, delivered with diagnosis and monitoring. Elective wellness drips are a different product. The decision belongs with your obstetric care provider, ingredient by ingredient.' },
      { question: 'What should I do if I cannot keep fluids down while pregnant?', answer: 'Contact your obstetric provider or seek same-day care. Persistent vomiting with signs of dehydration can be hyperemesis gravidarum, which is managed with IV fluids, specific medications and monitoring in a medical setting. It is a treatable medical problem, and it deserves proper care.' },
      { question: 'Are there real treatments for pregnancy nausea?', answer: 'Yes. Effective, pregnancy-specific treatment exists, including prescription anti-nausea medications with safety data, which your OB, midwife or family doctor can discuss with you. That conversation is the right first step before any elective drip.' },
      { question: 'Can I get a morning sickness IV at home?', answer: 'Mobile services offer it, but pregnancy is the situation where skipping medical assessment carries the most weight. Ask your obstetric provider first, and if you do proceed anywhere, ask exactly what is in the bag and who prescribed it, and verify the provider on your provincial register.' },
      { question: 'Do I need to talk to my OB before an IV in pregnancy?', answer: 'Yes, and a clinic that discourages that conversation is telling you something. What is appropriate in pregnancy depends on trimester, dose and your history, and that judgment belongs to someone who knows your pregnancy.' }
    ]
  },
  {
    slug: 'event-prep',
    title: 'Event Prep',
    icon: 'CalendarStar',
    serviceTag: 'Beauty',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-event-prep.jpg`,
    description: 'IV therapy is commonly used for event preparation, providing a boost of hydration and nutrients that can help you shine. Many people use these drips a day or two before their big day to ensure their skin is glowing and their energy levels are high. It\'s a popular "secret weapon" for brides, grooms, and public speakers who want to avoid feeling run down during their most important moments. By delivering a concentrated dose of vitamins and antioxidants, many people report feeling more confident and ready to take on the spotlight, ensuring they have the stamina to enjoy every moment of their event.',
    whyItWorks: 'The stress of planning and preparing for a major event can deplete the body of essential nutrients and lead to dehydration, which often shows up as dull skin and low energy. Many people find that the combination of Vitamin B12 and Vitamin C helps support their natural vitality and immune system during these busy times. Glutathione is another key ingredient that many individuals use to support a clear and radiant complexion.\n\nBy delivering these nutrients via IV, they are immediately available to the body, providing a more rapid and noticeable effect than oral supplements. Many people report that the deep hydration helps "plump" the skin and reduces the appearance of fatigue around the eyes. This comprehensive approach to wellness helps ensure that you are not only looking your best but also feeling energized and focused for your special occasion.',
    comparisons: 'Oral "beauty" vitamins take months to change anything, if they do at all. An IV delivers the dose at once, but there is no evidence that changes how you look or feel on the day; the rehydration is the part people notice.',
    typicalPatient: 'Typical users include brides, grooms, members of a wedding party, keynote speakers, and anyone attending a high-profile social or professional event. It is also popular among those who have a busy travel schedule leading up to an event and want to ensure they arrive looking and feeling refreshed.',
    ingredients: ['Vitamin B12', 'Vitamin C', 'Glutathione', 'Biotin', 'Hydration fluids'],
    ingredientsDetailed: [
      { name: 'Vitamin B12', role: 'Supports natural energy levels and helps you stay alert during long events.' },
      { name: 'Vitamin C', role: 'Provides antioxidant support and helps maintain a healthy, vibrant complexion.' },
      { name: 'Glutathione', role: 'Marketed for skin brightening; evidence is limited and no injectable is approved for it.' },
      { name: 'Biotin', role: 'A B-vitamin that supports the health and appearance of hair, skin, and nails.' },
      { name: 'Hydration Fluids', role: 'The foundation of a healthy glow and essential for maintaining energy throughout the day.' }
    ],
    sessionExpectation: 'This is a great addition to your pre-event beauty or grooming routine. Relax for 45-60 minutes and take a moment to breathe before your busy schedule begins. Many people find the quiet time in the clinic is a perfect way to center themselves and reduce pre-event jitters while their body is being replenished.',
    faqs: [
      { question: 'When should I get IV therapy for event prep?', answer: 'Most people find that 24 to 48 hours before the event is the ideal time for a hydration and glow boost.' },
      { question: 'Will IV therapy for event prep help with my energy?', answer: 'Yes, the B vitamins included are commonly used to support sustained energy throughout a long day.' },
      { question: 'Is IV therapy for event prep common for weddings?', answer: 'It is a very popular choice for bridal parties looking to stay hydrated and radiant.' },
      { question: 'Can I get a group session for IV therapy for event prep?', answer: 'Many clinics and mobile services offer group bookings for wedding parties or corporate events.' },
      { question: 'How long do the results of IV therapy for event prep last?', answer: 'You\'ll likely feel the hydration and energy benefits for several days, covering the duration of most events.' },
      { question: 'How much does IV therapy for event prep cost?', answer: 'Costs typically range from $200 to $450, depending on the number of add-ons like Biotin and Glutathione.' },
      { question: 'Is IV therapy for event prep covered by insurance?', answer: 'Event prep IV therapy is considered a cosmetic wellness service and is not covered by insurance.' }
    ]
  },
  {
    slug: 'dehydration',
    title: 'Dehydration',
    icon: 'Droplets',
    serviceTag: 'Hydration',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-dehydration.jpg`,
    description: 'Rehydration is the most honest use on any IV menu: fluids delivered to a vein rehydrate you, full stop, and faster than drinking because nothing passes through the stomach. The equally honest half is that for most mildly dehydrated people, drinking works as well at almost no cost. It is often used by outdoor workers, athletes, and those recovering from illness who need to restore their fluid balance quickly. By providing a balanced mix of saline and electrolytes, many people report feeling a near-immediate improvement in their energy levels, mental clarity, and overall sense of well-being.',
    whyItWorks: 'When the body is dehydrated, the volume of blood decreases, which can lead to a drop in blood pressure and reduced oxygen delivery to the organs. Many people find that oral rehydration can be slow, especially if the dehydration is severe enough to cause nausea or a lack of appetite. IV therapy restores fluid volume almost instantly, allowing the cardiovascular system to function more efficiently.\n\nMany individuals report that the addition of electrolytes like potassium and magnesium helps restore the electrical balance needed for healthy muscle and nerve function. By delivering a balanced saline solution directly into the bloodstream, IV therapy ensures that the cells are hydrated at a deep level. This rapid restoration of fluid balance is why many people find they feel significantly more alert and comfortable shortly after starting their session.',
    comparisons: 'Drinking water or sports drinks is the first line of defense, but many people find they can only absorb about a liter of water per hour through the digestive system. IV therapy provides immediate rehydration without the need for gastric processing. It is a popular choice for those who need to recover quickly and want to avoid the bloating or discomfort that can come from drinking large volumes of fluid.',
    typicalPatient: 'Typical users include athletes after intense training, individuals who have spent a long day in the sun, travelers who are feeling the effects of dry cabin air, and anyone recovering from a stomach bug or other illness that has led to fluid loss. It is also popular among those who simply struggle to maintain adequate hydration through drinking alone.',
    ingredients: ['Saline solution', 'Electrolytes', 'Magnesium', 'Potassium', 'Calcium'],
    ingredientsDetailed: [
      { name: 'Saline Solution', role: 'Provides the immediate fluid volume needed to restore hydration and blood volume.' },
      { name: 'Electrolytes', role: 'Essential minerals that maintain the body\'s fluid balance and support nerve function.' },
      { name: 'Magnesium', role: 'Supports muscle relaxation and helps maintain a healthy heart rhythm.' },
      { name: 'Potassium', role: 'A critical electrolyte for muscle contraction and maintaining healthy blood pressure.' },
      { name: 'Calcium', role: 'Supports bone health and is essential for proper muscle and nerve function.' }
    ],
    sessionExpectation: 'The session is straightforward and focused on restoration. You\'ll be seated comfortably for about 45 minutes while your body\'s fluid levels are replenished. Most people find the process very relaxing and report feeling a sense of "cooling" and renewed energy as the hydration begins to take effect.',
    faqs: [
      { question: 'How do I know if I need IV therapy for dehydration?', answer: 'Common signs include persistent thirst, dry mouth, fatigue, and dark-colored urine.' },
      { question: 'Is IV therapy for dehydration better than sports drinks?', answer: 'IV therapy provides direct hydration without the added sugars and dyes often found in commercial sports drinks.' },
      { question: 'How quickly will I feel better after IV therapy for dehydration?', answer: 'Most people report feeling more alert and refreshed before the session is even finished.' },
      { question: 'Can I get IV therapy for dehydration after a long flight?', answer: 'Yes, it is a common reason people book one after a long flight; drinking water works too.' },
      { question: 'Who typically seeks IV therapy for dehydration?', answer: 'It is commonly used by athletes, travelers, and those recovering from stomach bugs or heat exposure.' },
      { question: 'How much does IV therapy for dehydration cost?', answer: 'Basic hydration drips usually start around $125, while those with added electrolytes and minerals range from $175 to $275.' },
      { question: 'How quickly will I feel relief from dehydration symptoms?', answer: 'The effects of IV rehydration are often felt almost immediately, with significant improvement within 30 to 45 minutes.' },
      { question: 'Is IV therapy for dehydration covered by insurance?', answer: 'While medically necessary IVs in a hospital are covered, elective IV therapy for general dehydration is typically an out-of-pocket expense.' }
    ]
  },
  {
    slug: 'brain-fog',
    title: 'Brain Fog',
    icon: 'Cloud',
    serviceTag: 'Brain Fog',
    imageUrl: `${SUPABASE_BASE_URL}iv-therapy-brain-fog.jpg`,
    description: 'That "cloudy" feeling in your head can make it difficult to focus and stay productive throughout the day. IV therapy is commonly used for those seeking mental clarity and improved cognitive function. Many people use drips containing NAD+ or high doses of B vitamins to help support their brain\'s natural energy processes. It is often favored by students during finals, professionals with demanding schedules, and anyone who feels their mental sharpness has slipped due to stress or fatigue. By delivering essential nutrients directly to the system, many people report a "lifting of the fog," allowing them to think more clearly, stay focused on the tasks at hand, and feel more mentally present.',
    whyItWorks: 'The brain is a highly metabolic organ that requires a constant supply of energy and specific nutrients to function optimally. Many people find that NAD+ (Nicotinamide Adenine Dinucleotide) is a powerful cofactor that supports mitochondrial health and cellular energy production in the brain. B-complex vitamins, particularly B12, are also essential for healthy nerve function and the production of neurotransmitters.\n\nWhen these nutrients are delivered via IV, they bypass the digestive system and are immediately available to the brain cells. Many individuals report that the addition of taurine helps support neurological health and reduces oxidative stress. IV therapy is marketed for focus, memory and mental clarity; there is no evidence it improves any of them in people who are not deficient.',
    comparisons: 'Oral "nootropics" and energy drinks often rely on caffeine and other stimulants that can lead to a crash and increased anxiety. IV therapy focuses on providing the actual building blocks of brain health, providing a more natural and sustainable lift in mental clarity. An IV bypasses digestion, though the honest caveat is that unexplained persistent brain fog is a reason to see a doctor, since common treatable causes, sleep, thyroid, mood, medications, are things no drip addresses.',
    typicalPatient: 'Typical users include corporate professionals, students, creative individuals, and anyone who feels that mental fatigue is holding them back. It is also popular among those who are recovering from a period of high stress or travel and want to regain their mental sharpness and focus.',
    ingredients: ['NAD+ (optional)', 'Vitamin B12', 'Taurine', 'Vitamin B Complex', 'Alpha-Lipoic Acid'],
    ingredientsDetailed: [
      { name: 'NAD+ (optional)', role: 'A critical coenzyme that supports cellular energy production and brain health.' },
      { name: 'Vitamin B12', role: 'Essential for healthy nerve function and maintaining mental clarity.' },
      { name: 'Taurine', role: 'An amino acid that supports neurological health and helps maintain focus.' },
      { name: 'Vitamin B Complex', role: 'A group of vitamins that are essential for converting nutrients into brain energy.' },
      { name: 'Alpha-Lipoic Acid', role: 'A powerful antioxidant that helps protect brain cells from oxidative damage.' }
    ],
    sessionExpectation: 'The session is a quiet time to clear your mind. You\'ll relax for 45-60 minutes (longer if NAD+ is included) in a calm environment conducive to mental rest. Many people find it helpful to disconnect from their devices and use the time for quiet reflection or simply resting their eyes while the supportive nutrients are administered.',
    faqs: [
      { question: 'What is the best ingredient for IV therapy for brain fog?', answer: 'B12 and NAD+ are two of the most popular ingredients used to support mental clarity and focus.' },
      { question: 'How long does it take for IV therapy for brain fog to work?', answer: 'Many people report improved focus and alertness within a few hours of their session.' },
      { question: 'Can IV therapy for brain fog help with my memory?', answer: 'By supporting overall brain health and hydration, many people find it easier to recall information and stay sharp.' },
      { question: 'Is IV therapy for brain fog safe for students?', answer: 'It is commonly used by healthy adults, including students looking for a natural way to support their studies.' },
      { question: 'How often should I get IV therapy for brain fog?', answer: 'Many people find a session every few weeks or during particularly demanding periods to be very helpful.' },
      { question: 'How much does IV therapy for brain fog cost?', answer: 'Standard brain fog drips range from $175 to $350, while specialized NAD+ sessions can cost $500 or more.' },
      { question: 'How quickly will I feel relief from brain fog symptoms?', answer: 'There is no reliable timeline. Some people describe feeling clearer the same day; the evidence for IV therapy and brain fog is limited.' },
      { question: 'Is IV therapy for brain fog covered by insurance?', answer: 'IV therapy for cognitive support is generally considered a wellness service and is not covered by insurance.' }
    ]
  }
];

/** The use cases that are published: everything not retired. */
export const PUBLIC_USE_CASES: UseCase[] = USE_CASES.filter((u) => !RETIRED_USE_CASE_SLUGS.has(u.slug));
