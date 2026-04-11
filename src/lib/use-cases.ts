export interface UseCase {
  slug: string;
  title: string;
  icon: string;
  serviceTag: string;
  description: string;
  whyItWorks?: string;
  comparisons?: string;
  typicalPatient?: string;
  ingredients: string[];
  ingredientsDetailed?: { name: string; role: string }[];
  sessionExpectation: string;
  faqs: { question: string; answer: string }[];
}

export const USE_CASES: UseCase[] = [
  {
    slug: 'hangover',
    title: 'Hangover',
    icon: 'GlassWater',
    serviceTag: 'Hangover',
    description: 'Many people use IV therapy after a night of celebration to help rehydrate and replenish essential nutrients. When you\'ve had a few too many drinks, your body can become dehydrated and depleted of B vitamins and electrolytes. IV therapy is commonly used for a quicker recovery than traditional oral hydration, as it delivers fluids directly into the bloodstream. This approach is often favored by those looking to get back to their day without the lingering discomfort of a heavy head or upset stomach. It\'s a popular choice for weekend travelers and event-goers who want to maximize their time. By bypassing the digestive system, the nutrients are available for immediate use by your cells, which many find helps them feel better much faster than drinking water or taking oral supplements.',
    whyItWorks: 'The science behind why many people find IV therapy effective for hangovers lies in its ability to address three main issues: dehydration, electrolyte imbalance, and nutrient depletion. Alcohol is a diuretic, meaning it causes your body to remove fluids from your blood through your renal system at a much quicker rate than other liquids. This leads to the classic symptoms of dehydration like headaches and dry mouth.\n\nFurthermore, many people find that the rapid delivery of B-complex vitamins helps support their liver as it processes toxins. By delivering a balanced saline solution directly into the bloodstream, IV therapy restores fluid balance almost instantly. Many individuals report that the addition of anti-nausea support helps them return to their normal routine without the typical "down time" associated with a rough morning.',
    comparisons: 'When comparing IV therapy to oral supplements for hangovers, the primary difference is absorption. Oral rehydration requires the digestive system to process fluids and nutrients, which can be slow and inefficient, especially if you are feeling nauseous. IV therapy provides 100% bioavailability, meaning your body can use the nutrients immediately.',
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
      { question: 'How quickly will I feel relief from hangover symptoms?', answer: 'Most people report a significant improvement in symptoms like headache and nausea within 30 to 60 minutes.' },
      { question: 'Is IV therapy for hangover covered by insurance?', answer: 'In most cases, IV therapy is considered a wellness service and is not covered by traditional health insurance.' }
    ]
  },
  {
    slug: 'jet-lag',
    title: 'Jet Lag',
    icon: 'Plane',
    serviceTag: 'Jet Lag',
    description: 'Traveling across time zones can leave you feeling disoriented and exhausted. IV therapy is frequently used by frequent flyers and international travelers to help reset their internal clocks and combat the fatigue associated with long-haul flights. By providing a concentrated dose of hydration and energy-supporting vitamins, many people find it helps them adjust to new schedules more easily. It\'s commonly used for reducing that "foggy" feeling that comes after a long day of travel. Whether you\'re traveling for business or pleasure, a quick hydration session can help you hit the ground running and make the most of your trip.',
    whyItWorks: 'Jet lag occurs when your body\'s internal clock is out of sync with the local time, often exacerbated by the dry air and pressure changes in airplane cabins. Many people find that deep hydration is the first step in resetting this rhythm. The inclusion of Vitamin B12 and Vitamin C helps support the immune system and energy levels, which are often compromised during travel.\n\nMany individuals report that the magnesium in the drip helps relax their muscles after being cramped in a plane seat, while taurine supports mental focus. By delivering these nutrients directly, IV therapy helps bypass the "travel tummy" issues that can make oral supplements less effective during long trips.',
    comparisons: 'Oral hydration and caffeine are the traditional go-to for travelers, but many find they lead to a cycle of dehydration and crashes. IV therapy provides a more stable foundation for recovery by ensuring the body is fully hydrated at a cellular level, which many find is more effective for long-term adjustment to a new time zone.',
    typicalPatient: 'Typical users include international business travelers, digital nomads, and vacationers who want to avoid losing their first two days of a trip to exhaustion. It is also popular among flight crews and frequent domestic travelers.',
    ingredients: ['Hydration fluids', 'Vitamin B12', 'Vitamin C', 'Magnesium', 'Taurine'],
    ingredientsDetailed: [
      { name: 'Hydration Fluids', role: 'Combats the extreme dehydration caused by dry airplane cabin air.' },
      { name: 'Vitamin B12', role: 'Supports natural energy levels to help you stay awake until the local bedtime.' },
      { name: 'Vitamin C', role: 'Provides immune support to help your body stay resilient after exposure to travel germs.' },
      { name: 'Magnesium', role: 'Helps relax muscles and supports a better quality of sleep in a new environment.' },
      { name: 'Taurine', role: 'Supports mental clarity and helps reduce the "brain fog" associated with travel.' }
    ],
    sessionExpectation: 'You\'ll be seated in a relaxing chair for about 45 minutes. Most clinics provide a quiet space where you can rest and begin your adjustment to the local time zone. Many people find it helpful to dim the lights and listen to calming music during the session to help their nervous system reset.',
    faqs: [
      { question: 'When should I get IV therapy for jet lag?', answer: 'Many travelers find it most effective either immediately after landing or the morning after their arrival.' },
      { question: 'Does IV therapy for jet lag help with sleep?', answer: 'By supporting hydration and nutrient balance, it may help your body adjust its natural rhythms more smoothly.' },
      { question: 'What vitamins are in a jet lag IV?', answer: 'B12 for energy and Vitamin C for immune support are common additions to travel-focused drips.' },
      { question: 'Is IV therapy for jet lag common for business travelers?', answer: 'Yes, it is a very popular choice for professionals who need to be sharp and focused shortly after arrival.' },
      { question: 'How long do the effects of IV therapy for jet lag last?', answer: 'The hydration benefits are immediate, while the nutrient support can help you through the first few days of your trip.' },
      { question: 'How much does IV therapy for jet lag cost?', answer: 'Costs generally range from $175 to $300, with some clinics offering travel packages.' },
      { question: 'How quickly will I feel relief from jet lag symptoms?', answer: 'The hydration effect is immediate, and many people feel a lift in energy and mental clarity during the session.' },
      { question: 'Is IV therapy for jet lag covered by insurance?', answer: 'Jet lag IV therapy is typically an out-of-pocket expense and not covered by insurance.' }
    ]
  },
  {
    slug: 'fatigue',
    title: 'Fatigue',
    icon: 'BatteryLow',
    serviceTag: 'Energy',
    description: 'In today\'s fast-paced world, many people experience periods of low energy and persistent tiredness. IV therapy is commonly used for those seeking a natural-feeling boost to their daily vitality. Unlike caffeine, which can lead to a crash, nutrient-focused IV drips aim to support the body\'s natural energy production processes. It is often used by busy parents, students, and professionals who feel "run down" and need a reliable way to replenish their reserves. By delivering B vitamins and amino acids directly to the cells, many people report a sustained sense of alertness and well-being that helps them tackle their to-do list with renewed vigor.',
    whyItWorks: 'Fatigue is often a symptom of underlying dehydration or a deficiency in the vitamins that act as cofactors in the body\'s energy production cycle (the Krebs cycle). Many people find that B-complex vitamins, particularly B12, are essential for converting food into usable energy. When these are delivered via IV, they bypass the digestive tract where absorption can be limited by factors like stress or gut health.\n\nMany individuals report that the addition of amino acids helps support muscle function and reduces the feeling of physical exhaustion. By ensuring the body is fully hydrated and has a surplus of these energy-supporting nutrients, IV therapy helps provide a foundation for sustained vitality without the "jitters" associated with energy drinks or excessive coffee.',
    comparisons: 'Oral energy supplements often contain high amounts of sugar and caffeine, which provide a temporary spike followed by a significant crash. IV therapy focuses on replenishing the actual building blocks of energy, providing a more natural and long-lasting lift. Many people find that the 100% absorption rate of IV nutrients makes a noticeable difference compared to pills that may only be 20-30% absorbed.',
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
      { question: 'How quickly will I feel relief from fatigue symptoms?', answer: 'Many people feel a sustained lift in energy within 2 to 4 hours of their session.' },
      { question: 'Is IV therapy for fatigue covered by insurance?', answer: 'Most insurance providers do not cover IV therapy for general fatigue or wellness support.' }
    ]
  },
  {
    slug: 'cold-and-flu',
    title: 'Cold & Flu',
    icon: 'Thermometer',
    serviceTag: 'Immunity',
    description: 'When you\'re feeling under the weather, staying hydrated is one of the most important things you can do. IV therapy is commonly used for those experiencing the early signs of a seasonal sniffle or a scratchy throat. By delivering high doses of Vitamin C and zinc along with essential fluids, many people use this approach to support their body\'s natural defenses. It\'s often favored by those who want to avoid the dehydration that can occur during a bout of illness. While it doesn\'t replace rest and traditional care, it is a popular supportive measure for those looking to feel more comfortable and hydrated while they recover.',
    whyItWorks: 'The body\'s immune response requires a significant amount of energy and specific nutrients to function optimally. Many people find that high-dose Vitamin C supports the production of white blood cells, which are the body\'s primary defense against invaders. Zinc is another critical mineral that many individuals use to support the integrity of their immune system.\n\nDehydration is a common side effect of illness, especially if you have a fever or are unable to keep fluids down. By delivering a balanced saline solution directly into the bloodstream, IV therapy ensures that your cells stay hydrated, which is essential for flushing out toxins and supporting the healing process. Many people report that the rapid delivery of these nutrients helps them feel less "run down" during their recovery.',
    comparisons: 'When you are sick, your digestive system may not be functioning at its best, making it difficult to absorb oral vitamins and stay hydrated through drinking alone. IV therapy bypasses the gut entirely, ensuring that 100% of the immune-supporting nutrients reach your cells. Many people find this direct approach more effective than taking multiple oral supplements when they are already feeling unwell.',
    typicalPatient: 'Typical users include busy professionals who can\'t afford to be out of commission, parents who need to stay healthy for their families, and anyone who wants to support their recovery process with deep hydration and targeted nutrients at the first sign of symptoms.',
    ingredients: ['High-dose Vitamin C', 'Zinc', 'Hydration fluids', 'B vitamins', 'Selenium'],
    ingredientsDetailed: [
      { name: 'High-dose Vitamin C', role: 'Supports the production and function of white blood cells.' },
      { name: 'Zinc', role: 'A mineral that is essential for immune cell development and function.' },
      { name: 'Hydration Fluids', role: 'Restores fluid balance and helps the body flush out metabolic waste.' },
      { name: 'B vitamins', role: 'Supports energy levels which are often depleted when the body is fighting illness.' },
      { name: 'Selenium', role: 'An antioxidant that helps protect cells from damage during an immune response.' }
    ],
    sessionExpectation: 'If you\'re feeling unwell, many services offer mobile visits so you don\'t have to leave home. The process is gentle and focused on making you as comfortable as possible. A typical session lasts 45-60 minutes, and many people find the extra hydration helps them feel more alert and comfortable almost immediately.',
    faqs: [
      { question: 'Can IV therapy for cold and flu prevent illness?', answer: 'It is commonly used to support the immune system, which may help your body maintain its natural defenses.' },
      { question: 'Is it safe to get IV therapy for cold and flu while sick?', answer: 'Yes, many people find the extra hydration very helpful when they are feeling unwell.' },
      { question: 'What is the main benefit of IV therapy for cold and flu?', answer: 'The primary benefits are rapid rehydration and the delivery of immune-supporting nutrients like Vitamin C.' },
      { question: 'How long does a cold and flu IV session take?', answer: 'Most sessions are completed within 45 to 60 minutes.' },
      { question: 'Should I get IV therapy for cold and flu at the first sign of symptoms?', answer: 'Many people find it most helpful to start supportive hydration as soon as they feel run down.' },
      { question: 'How much does IV therapy for cold and flu cost?', answer: 'Prices typically range from $175 to $350, depending on the specific immune-boosting additives.' },
      { question: 'How quickly will I feel relief from cold and flu symptoms?', answer: 'While it doesn\'t cure the virus, many people feel more hydrated and less fatigued within an hour.' },
      { question: 'Is IV therapy for cold and flu covered by insurance?', answer: 'Insurance rarely covers IV therapy for seasonal illnesses, though some flexible spending accounts may apply.' }
    ]
  },
  {
    slug: 'sports-recovery',
    title: 'Sports Recovery',
    icon: 'Dumbbell',
    serviceTag: 'Recovery',
    description: 'Athletes and fitness enthusiasts often push their bodies to the limit, leading to muscle soreness and nutrient depletion. IV therapy is a staple for many people in the fitness community, commonly used for post-workout recovery and pre-event preparation. By delivering amino acids and electrolytes directly to the muscles, it helps support the body\'s natural repair processes. Many people use it after marathons, heavy lifting sessions, or intense training blocks to help reduce the time they spend feeling sore. It\'s a popular way to ensure your body has exactly what it needs to bounce back and perform at its best again, whether you are a professional or a dedicated amateur.',
    whyItWorks: 'During intense physical activity, the body loses significant amounts of water and electrolytes through sweat, and muscles undergo micro-tears that require repair. Many people find that the rapid delivery of amino acids like glutamine and arginine helps support muscle protein synthesis. Magnesium is another key ingredient that many individuals use to help reduce muscle tension and prevent cramping.\n\nBy delivering these nutrients via IV, they reach the muscle tissues much faster than oral supplements. Many athletes report that the deep hydration provided by the saline base helps flush out lactic acid and other metabolic byproducts that contribute to post-exercise soreness. This comprehensive approach to recovery is why many people find they can return to their training schedule sooner after an IV session.',
    comparisons: 'Oral recovery drinks often contain high levels of sugar and artificial colors, and their absorption is limited by the speed of the digestive system. IV therapy provides a clean, direct route for essential nutrients, ensuring 100% bioavailability. Many people find that the immediate rehydration from an IV is far superior to drinking large volumes of water, which can sometimes lead to bloating or discomfort during recovery.',
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
      { question: 'How quickly will I feel relief from sports recovery symptoms?', answer: 'Many athletes report feeling less muscle tension and more hydrated within 2 to 4 hours.' },
      { question: 'Is IV therapy for sports recovery covered by insurance?', answer: 'Sports recovery IVs are typically considered performance-enhancing wellness services and are not covered by insurance.' }
    ]
  },
  {
    slug: 'migraine',
    title: 'Migraine',
    icon: 'Headset',
    serviceTag: 'Migraine',
    description: 'For those who experience intense head discomfort, finding a quiet and effective way to find relief is a top priority. IV therapy is commonly used for individuals looking to manage the dehydration and nutrient imbalances that can accompany severe headaches. Many people find that the combination of magnesium and rapid hydration helps them feel more comfortable during a flare-up. It is often used in a calm, dark environment to minimize sensory input while the fluids are administered. While not a cure, it is a popular supportive option for those who want to address the physical toll that intense head pressure and nausea can take on the body.',
    whyItWorks: 'The exact cause of migraines is complex, but many people find that certain nutrients and hydration levels play a significant role in managing symptoms. Magnesium is one of the most well-studied minerals in this context, as many individuals with migraines are found to have low levels. It is thought to help by supporting healthy blood vessel function and nerve signaling in the brain.\n\nDehydration is also a known trigger for many people, and the nausea associated with migraines can make it nearly impossible to stay hydrated through drinking. By delivering fluids and magnesium directly into the bloodstream, IV therapy provides immediate support. Many people report that the addition of B vitamins helps support overall neurological health, providing a comprehensive approach to comfort during a difficult episode.',
    comparisons: 'Oral medications and supplements can be difficult to take during a migraine due to stomach sensitivity and nausea. IV therapy bypasses the digestive system entirely, ensuring that the supportive nutrients are absorbed even when you are feeling unwell. Many people find the rapid hydration from an IV provides a level of relief that oral fluids simply cannot match during an acute flare-up.',
    typicalPatient: 'Typical users include chronic migraine sufferers who are looking for supportive measures to use alongside their traditional care. It is also popular among those who experience occasional but severe tension headaches and want a way to address the dehydration and nutrient depletion that often follows.',
    ingredients: ['Magnesium', 'Hydration fluids', 'Vitamin B2', 'Vitamin B12', 'Anti-inflammatory support'],
    ingredientsDetailed: [
      { name: 'Magnesium', role: 'Supports healthy blood vessel and nerve function in the brain.' },
      { name: 'Hydration Fluids', role: 'Provides rapid rehydration to combat one of the most common headache triggers.' },
      { name: 'Vitamin B2 (Riboflavin)', role: 'A key vitamin that many people use to support neurological health.' },
      { name: 'Vitamin B12', role: 'Supports energy levels and healthy nerve function.' },
      { name: 'Anti-inflammatory support', role: 'Helps reduce the body\'s inflammatory response during a flare-up.' }
    ],
    sessionExpectation: 'Clinics often provide a dim, quiet room for these sessions. You can rest in a comfortable recliner for about 60 minutes in a peaceful atmosphere. Many people find it helpful to bring an eye mask and noise-canceling headphones to create a truly sensory-neutral environment while the drip is administered.',
    faqs: [
      { question: 'How does IV therapy for migraine help?', answer: 'It provides rapid hydration and essential minerals like magnesium, which many people find supportive during a headache.' },
      { question: 'Can I get IV therapy for migraine at home?', answer: 'Yes, mobile IV services are a popular choice so you can stay in a comfortable, familiar environment.' },
      { question: 'What is the most important ingredient in a migraine IV?', answer: 'Magnesium is one of the most commonly included minerals due to its role in supporting nerve and muscle relaxation.' },
      { question: 'Is IV therapy for migraine a common treatment?', answer: 'It is a widely used supportive measure for those looking to manage the symptoms of severe head discomfort.' },
      { question: 'How long does it take to feel better after IV therapy for migraine?', answer: 'Many people report feeling more comfortable and hydrated shortly after the session is complete.' },
      { question: 'How much does IV therapy for migraine cost?', answer: 'Costs typically range from $200 to $400, often depending on the inclusion of specific anti-nausea or anti-inflammatory support.' },
      { question: 'How quickly will I feel relief from migraine symptoms?', answer: 'Many people report a reduction in symptom intensity within 45 to 90 minutes of starting the drip.' },
      { question: 'Is IV therapy for migraine covered by insurance?', answer: 'While some specialized clinics may work with insurance, most IV therapy for migraines is an out-of-pocket expense.' }
    ]
  },
  {
    slug: 'weight-loss',
    title: 'Weight Loss',
    icon: 'Scale',
    serviceTag: 'Weight Loss',
    description: 'Supporting a healthy metabolism is a key part of any wellness journey. IV therapy is commonly used for those looking to complement their diet and exercise routine with targeted nutrient support. Many people use "fat-burning" drips that include lipotropic compounds and B vitamins to help support their energy levels while they work toward their goals. It is often favored by those who feel their progress has plateaued or who need an extra boost to stay active and focused. By ensuring the body has the necessary cofactors for metabolism, many people find it easier to maintain the lifestyle changes needed for long-term success.',
    whyItWorks: 'Metabolism is a complex series of chemical reactions that convert food into energy, and these reactions require specific vitamins and minerals to function efficiently. Many people find that lipotropic compounds (like methionine, inositol, and choline) help support the liver\'s ability to process fats. B-complex vitamins are also essential cofactors in the energy production process.\n\nWhen these nutrients are delivered via IV, they are immediately available to the cells, bypassing the potential absorption issues of oral supplements. Many individuals report that the addition of L-carnitine helps support the transport of fatty acids into the mitochondria for energy production. By providing these metabolic building blocks directly, IV therapy helps ensure your body has what it needs to support your weight management efforts.',
    comparisons: 'Oral weight loss supplements often contain stimulants that can cause jitters and sleep disturbances. IV therapy focuses on providing the essential nutrients your body needs for natural metabolism support. Many people find that the 100% absorption rate of IV nutrients provides a more consistent and reliable boost to their wellness routine compared to pills or powders.',
    typicalPatient: 'The typical user for weight loss IV therapy is a health-conscious adult who is already following a balanced diet and exercise plan but wants to optimize their nutrient levels. It is also popular among those who are starting a new fitness challenge and want to ensure their energy levels stay high as they increase their activity.',
    ingredients: ['Lipotropic compounds (MIC)', 'Vitamin B12', 'L-Carnitine', 'Vitamin B Complex', 'Taurine'],
    ingredientsDetailed: [
      { name: 'Lipotropic compounds (MIC)', role: 'A blend of nutrients that help support healthy liver function and fat metabolism.' },
      { name: 'Vitamin B12', role: 'Essential for energy production and supporting a healthy metabolism.' },
      { name: 'L-Carnitine', role: 'An amino acid derivative that helps transport fatty acids into cells for energy.' },
      { name: 'Vitamin B Complex', role: 'Supports the conversion of food into usable energy throughout the body.' },
      { name: 'Taurine', role: 'An amino acid that supports metabolic health and antioxidant defense.' }
    ],
    sessionExpectation: 'The session is a simple addition to your weekly routine, taking about 45 minutes. It\'s a good time to focus on your wellness goals and plan your healthy meals for the week. Many people find the quiet time in the clinic helps them stay motivated and committed to their long-term health journey.',
    faqs: [
      { question: 'Does IV therapy for weight loss work without exercise?', answer: 'It is most effective when used as a supportive measure alongside a healthy diet and regular physical activity.' },
      { question: 'How often should I get IV therapy for weight loss?', answer: 'Many people choose to have a session once a week or every other week during their active weight loss phase.' },
      { question: 'What are lipotropic compounds in a weight loss IV?', answer: 'These are nutrients like methionine, inositol, and choline that help support healthy liver function and fat metabolism.' },
      { question: 'Will IV therapy for weight loss give me more energy?', answer: 'Yes, the B vitamins included are commonly used to support natural energy production.' },
      { question: 'Is IV therapy for weight loss safe?', answer: 'It is commonly used by healthy adults as part of a supervised wellness program.' },
      { question: 'How much does IV therapy for weight loss cost?', answer: 'Prices generally range from $150 to $300 per session, with many clinics offering multi-session packages.' },
      { question: 'How quickly will I feel relief from weight loss symptoms?', answer: 'Many people feel a lift in energy and motivation within 24 hours of their session.' },
      { question: 'Is IV therapy for weight loss covered by insurance?', answer: 'Weight loss IV therapy is almost always considered an elective wellness service and is not covered by insurance.' }
    ]
  },
  {
    slug: 'skin-glow',
    title: 'Skin Glow',
    icon: 'Sparkles',
    serviceTag: 'Beauty',
    description: 'True beauty often starts from within, and hydration is the foundation of a healthy complexion. IV therapy is a popular choice for those seeking a "lit-from-within" radiance, commonly used for skin brightening and overall rejuvenation. By delivering high doses of antioxidants like glutathione and Vitamin C, many people use these drips to support their skin\'s natural defense against environmental stress and oxidative damage. It is often favored before big events or as part of a regular skincare routine to help maintain a hydrated, youthful appearance. Many people report that their skin looks more plump and vibrant after a session of deep hydration.',
    whyItWorks: 'The skin is the body\'s largest organ, and it is often the last to receive hydration and nutrients from the food and water we consume. Many people find that direct IV delivery of glutathione, often called the "master antioxidant," helps support the skin\'s natural detoxification processes and may help reduce the appearance of dullness. Vitamin C is another critical nutrient that many individuals use to support collagen production.\n\nBy providing these beauty-supporting nutrients directly into the bloodstream, IV therapy ensures that the skin cells receive the hydration and antioxidants they need to look their best. Many people report that the deep hydration helps "plump" the skin from the inside out, reducing the appearance of fine lines and giving the complexion a more refreshed and radiant look.',
    comparisons: 'Topical skincare products are essential, but they can only penetrate the outermost layers of the skin. IV therapy works from the inside out, providing the building blocks for healthy skin at a cellular level. Many people find that the combination of high-quality topicals and regular IV hydration provides the most comprehensive and noticeable results for their complexion.',
    typicalPatient: 'Typical users include brides and grooms preparing for their wedding, professionals who are frequently on camera, and anyone who wants to support their anti-aging skincare routine with deep hydration and potent antioxidants. It is also popular among those who spend a lot of time outdoors and want to support their skin after sun exposure.',
    ingredients: ['Glutathione', 'Vitamin C', 'Biotin', 'Hydration fluids', 'B-Complex vitamins'],
    ingredientsDetailed: [
      { name: 'Glutathione', role: 'A powerful antioxidant that supports skin brightening and detoxification.' },
      { name: 'Vitamin C', role: 'Essential for collagen synthesis and protecting skin from environmental damage.' },
      { name: 'Biotin', role: 'A B-vitamin that is well-known for supporting healthy hair, skin, and nails.' },
      { name: 'Hydration Fluids', role: 'Provides the deep cellular hydration that is the foundation of a healthy glow.' },
      { name: 'B-Complex vitamins', role: 'Supports overall cellular health and helps maintain a vibrant complexion.' }
    ],
    sessionExpectation: 'This is a true "beauty break." You\'ll relax for about 45-60 minutes, and many people leave the clinic feeling refreshed with a noticeable "glow" to their skin. Many clinics offer a spa-like atmosphere for these sessions, making it a perfect time to unwind and focus on self-care.',
    faqs: [
      { question: 'How many sessions of IV therapy for skin glow do I need?', answer: 'While one session provides a hydration boost, many people choose regular sessions for sustained results.' },
      { question: 'What is glutathione in a skin glow IV?', answer: 'Glutathione is a powerful antioxidant commonly used for its skin-brightening and detoxifying properties.' },
      { question: 'Can IV therapy for skin glow help with acne?', answer: 'By supporting hydration and reducing oxidative stress, it may help maintain a clearer-looking complexion.' },
      { question: 'Is biotin included in IV therapy for skin glow?', answer: 'Yes, biotin is often added to support the health of your hair, skin, and nails.' },
      { question: 'How long does the "glow" from IV therapy for skin glow last?', answer: 'The immediate hydration effects are visible for several days, while the nutrient benefits can last longer.' },
      { question: 'How much does IV therapy for skin glow cost?', answer: 'Prices typically range from $200 to $450, depending on the concentration of glutathione and other antioxidants.' },
      { question: 'How quickly will I feel relief from skin glow symptoms?', answer: 'Many people notice a more hydrated and "plump" appearance to their skin within 24 to 48 hours.' },
      { question: 'Is IV therapy for skin glow covered by insurance?', answer: 'As a cosmetic beauty service, IV therapy for skin glow is not covered by health insurance.' }
    ]
  },
  {
    slug: 'stress',
    title: 'Stress',
    icon: 'Wind',
    serviceTag: 'Wellness',
    description: 'In our high-pressure world, chronic stress can take a significant toll on both mental and physical health. IV therapy is commonly used for those seeking a natural way to support their body\'s response to stress and promote a sense of calm. Many people use drips containing magnesium and B vitamins to help support their nervous system and reduce the feeling of "burnout." It is often favored by those who find that stress affects their sleep, mood, and energy levels. By providing the essential nutrients that the body depletes more quickly during stressful periods, many people report feeling more balanced and resilient in the face of daily challenges. The forced "time-out" of a 60-minute session also provides a much-needed mental break from the constant demands of modern life.',
    whyItWorks: 'When the body is under stress, it enters a "fight or flight" state that increases the demand for certain nutrients, particularly magnesium and B-complex vitamins. Many people find that magnesium helps support the relaxation of both muscles and the nervous system, while B vitamins are essential for the production of neurotransmitters like serotonin and dopamine that regulate mood.\n\nBy delivering these nutrients via IV, they are immediately available to the body without the need for digestive processing, which can often be impaired by stress itself. Many individuals report that the deep hydration provided by the saline base helps reduce the physical symptoms of stress, such as tension headaches and fatigue. This direct approach to nutrient replenishment helps provide the foundation for a more calm and focused state of mind, helping you navigate your responsibilities with greater ease.',
    comparisons: 'Oral stress supplements often take weeks of consistent use to show results, and their absorption can be inconsistent, especially if stress is affecting your gut health. IV therapy provides an immediate infusion of supportive nutrients, which many people find provides a more noticeable and rapid sense of relaxation. It is a popular choice for those who need a "reset" during particularly intense periods of life or when they feel they are on the verge of exhaustion.',
    typicalPatient: 'Typical users include high-level executives, healthcare workers, parents, and anyone experiencing a period of significant life transition or high workload. It is also popular among those who prioritize mental wellness and want to support their body\'s stress-management capabilities naturally without relying on stimulants or heavy medications.',
    ingredients: ['Magnesium', 'Vitamin B Complex', 'Vitamin C', 'GABA support', 'Hydration fluids'],
    ingredientsDetailed: [
      { name: 'Magnesium', role: 'Often called the "relaxation mineral," it supports a healthy nervous system response and muscle relaxation.' },
      { name: 'Vitamin B Complex', role: 'Essential for mood regulation and supporting energy levels during periods of high stress.' },
      { name: 'Vitamin C', role: 'Supports the adrenal glands, which are the body\'s primary stress-response centers.' },
      { name: 'GABA support', role: 'An amino acid that helps promote a sense of calm and relaxation in the brain.' },
      { name: 'Hydration Fluids', role: 'Provides the foundation for cellular health and helps reduce the physical toll of stress.' }
    ],
    sessionExpectation: 'The session is designed to be a peaceful sanctuary. You\'ll relax for 45-60 minutes in a quiet, comfortable environment. Many people find it helpful to use this time for deep breathing or meditation, allowing the supportive nutrients to help their body transition from a state of stress to one of relaxation. Most clinics offer dim lighting and comfortable recliners to enhance the experience.',
    faqs: [
      { question: 'Can IV therapy for stress help me sleep better?', answer: 'By supporting relaxation and nutrient balance, many people find it easier to unwind at the end of the day.' },
      { question: 'How does magnesium in IV therapy for stress work?', answer: 'Magnesium is commonly used to support muscle relaxation and a healthy nervous system.' },
      { question: 'Is IV therapy for stress better than taking oral supplements?', answer: 'IV delivery ensures 100% absorption of the nutrients, which can be helpful when your digestive system is affected by stress.' },
      { question: 'How often should I get IV therapy for stress?', answer: 'Many people find a monthly session or a session during particularly busy weeks to be very supportive.' },
      { question: 'What is the most relaxing part of IV therapy for stress?', answer: 'The combination of a quiet environment and calming nutrients like magnesium provides a comprehensive sense of relief.' },
      { question: 'How much does IV therapy for stress cost?', answer: 'Prices generally range from $150 to $300, depending on the specific relaxation-supporting ingredients included.' },
      { question: 'How quickly will I feel relief from stress symptoms?', answer: 'Many people report a sense of calm and relaxation starting during the session and lasting for several days.' },
      { question: 'Is IV therapy for stress covered by insurance?', answer: 'Stress management IV therapy is typically considered a wellness service and is not covered by insurance.' }
    ]
  },
  {
    slug: 'stomach-flu',
    title: 'Stomach Flu',
    icon: 'Activity',
    serviceTag: 'Stomach Flu',
    description: 'Dealing with a stomach bug can be incredibly draining, primarily due to the rapid loss of fluids and electrolytes. IV therapy is a common supportive measure for those looking to address the dehydration that often accompanies the stomach flu. Many people find that when they are unable to keep fluids down, a direct IV infusion is the most effective way to restore balance. It is often used to help reduce the feeling of extreme weakness and lightheadedness that comes with severe dehydration. While it doesn\'t treat the virus itself, many people report that the rapid rehydration helps them feel significantly more comfortable as they recover.',
    whyItWorks: 'The primary danger of the stomach flu is dehydration, which occurs when the body loses more fluids than it can take in. Many people find that oral rehydration is difficult or impossible during an active flare-up. IV therapy provides a direct route for fluids and electrolytes, ensuring they reach the bloodstream immediately and bypass the irritated digestive system.\n\nMany individuals report that the addition of anti-nausea support helps settle their stomach, making it easier for them to eventually resume oral hydration. By restoring fluid balance and providing essential minerals like sodium and potassium, IV therapy helps support the body\'s overall resilience and reduces the physical toll of the illness. This rapid rehydration is often the key to feeling more alert and comfortable during recovery.',
    comparisons: 'Drinking water or electrolyte drinks is the traditional advice for stomach bugs, but many people find they simply cannot keep enough down to stay hydrated. IV therapy provides 100% absorption and immediate results, which many find is a much more reliable way to manage dehydration during an acute illness. It is a popular choice for those who want to avoid the potential need for more intensive care due to dehydration.',
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
      { question: 'How quickly will I feel relief from stomach flu symptoms?', answer: 'Most people report feeling significantly more hydrated and less lightheaded within 45 to 60 minutes.' },
      { question: 'Is IV therapy for stomach flu covered by insurance?', answer: 'Typically, this is an out-of-pocket wellness service, though some HSA/FSA plans may be accepted.' }
    ]
  },
  {
    slug: 'immunity',
    title: 'Immunity',
    icon: 'ShieldCheck',
    serviceTag: 'Immunity',
    description: 'Maintaining a strong immune system is a year-round priority for many health-conscious individuals. IV therapy is commonly used for immune support, especially during travel, seasonal changes, or periods of high activity. By delivering a potent blend of Vitamin C, zinc, and other antioxidants directly into the bloodstream, many people use this approach to help their body stay resilient. It is a popular choice for those who want to ensure they are getting the maximum benefit from their supplements. Whether you\'re looking to stay healthy during flu season or preparing for a busy trip, a targeted immune-support drip is a common way to prioritize your wellness and ensure your body has the building blocks it needs to defend itself.',
    whyItWorks: 'The immune system is a complex network that requires a constant supply of specific vitamins and minerals to function at its peak. Many people find that high-dose Vitamin C supports the production of white blood cells, while zinc is essential for the development and activation of T-lymphocytes. When these are delivered via IV, they reach the immune cells much faster than oral supplements.\n\nMany individuals report that the addition of glutathione helps protect immune cells from oxidative stress, allowing them to function more efficiently. By providing deep hydration along with these targeted nutrients, IV therapy helps ensure that the body\'s natural defense mechanisms are well-supported. Many people find this proactive approach particularly helpful when they know they will be exposed to more germs than usual, such as during air travel or in crowded environments.',
    comparisons: 'Oral immune supplements can be hard on the stomach in high doses and are subject to the limitations of the digestive system. IV therapy provides 100% bioavailability, meaning your immune system can use the nutrients immediately. Many people find that the direct delivery of high-dose Vitamin C and zinc provides a level of support that is difficult to achieve through diet and oral pills alone.',
    typicalPatient: 'Typical users include frequent travelers, teachers, healthcare workers, and anyone who wants to take a proactive approach to their health. It is also popular among those who are feeling slightly "run down" and want to support their system before a full-blown illness can take hold.',
    ingredients: ['Vitamin C', 'Zinc', 'Selenium', 'Vitamin B12', 'Glutathione'],
    ingredientsDetailed: [
      { name: 'Vitamin C', role: 'A powerful antioxidant that supports the production and function of white blood cells.' },
      { name: 'Zinc', role: 'A critical mineral for immune cell development and maintaining the body\'s natural defenses.' },
      { name: 'Selenium', role: 'Supports the immune system by reducing oxidative stress and protecting cells from damage.' },
      { name: 'Vitamin B12', role: 'Supports energy metabolism, which is essential for a robust immune response.' },
      { name: 'Glutathione', role: 'The "master antioxidant" that helps protect immune cells and supports detoxification.' }
    ],
    sessionExpectation: 'The session is a proactive step for your health, taking about 45-60 minutes. It\'s a comfortable process that leaves you feeling hydrated and well-supported. You can relax in a comfortable chair, read, or listen to a podcast while the immune-supporting nutrients are administered by a trained professional.',
    faqs: [
      { question: 'Can I get IV therapy for immunity every week?', answer: 'While safe for many, most people choose a session once or twice a month for ongoing support.' },
      { question: 'What is the best vitamin for IV therapy for immunity?', answer: 'Vitamin C and Zinc are the most common and well-known ingredients for supporting immune health.' },
      { question: 'Is IV therapy for immunity good for travel prep?', answer: 'Yes, many people get a session a few days before a big trip to support their system during travel.' },
      { question: 'Does IV therapy for immunity help with allergies?', answer: 'By supporting a healthy immune response, some people find it a helpful addition to their allergy management.' },
      { question: 'Who typically gets IV therapy for immunity?', answer: 'It is popular among travelers, teachers, and anyone looking to support their natural defenses.' },
      { question: 'How much does IV therapy for immunity cost?', answer: 'Prices generally range from $175 to $350, with some clinics offering seasonal immunity packages.' },
      { question: 'How quickly will I feel relief from immunity symptoms?', answer: 'While it\'s a proactive measure, many people feel more hydrated and energized within a few hours of their session.' },
      { question: 'Is IV therapy for immunity covered by insurance?', answer: 'Immune support IV therapy is typically considered a wellness service and is not covered by insurance.' }
    ]
  },
  {
    slug: 'morning-sickness',
    title: 'Morning Sickness',
    icon: 'Baby',
    serviceTag: 'Prenatal',
    description: 'Pregnancy is a beautiful journey, but for many, the early stages are marked by persistent nausea and difficulty staying hydrated. IV therapy is commonly used for those experiencing morning sickness who are struggling to keep fluids down. By providing gentle hydration and essential vitamins like B6, many people find it helps them feel more comfortable and energized during their first trimester. It is often favored as a way to ensure both mother and baby are getting the hydration they need when oral intake is limited. Many services offer specialized prenatal drips designed with safety and comfort in mind, providing a much-needed reprieve from the exhaustion and discomfort that can accompany early pregnancy.',
    whyItWorks: 'Morning sickness, or Nausea and Vomiting of Pregnancy (NVP), can quickly lead to dehydration, which often makes the nausea even worse. Many people find that breaking this cycle with direct IV hydration is a game-changer. Vitamin B6 (pyridoxine) is one of the most well-regarded nutrients for supporting comfort during early pregnancy, and delivering it via IV ensures it is absorbed even if you are feeling unwell.\n\nBy restoring electrolyte balance and providing a steady stream of fluids, IV therapy helps support the mother\'s energy levels and overall well-being. Many individuals report that the addition of Vitamin B12 helps combat the extreme fatigue that often goes hand-in-hand with morning sickness. This supportive approach helps ensure that the body has the resources it needs to support a healthy pregnancy during a challenging time.',
    comparisons: 'Oral prenatal vitamins and anti-nausea medications can be difficult to swallow and keep down when you are experiencing morning sickness. IV therapy bypasses the stomach entirely, providing 100% absorption of essential fluids and vitamins. Many women find that the rapid rehydration from an IV provides a level of relief that is difficult to achieve through small sips of water or oral supplements.',
    typicalPatient: 'Typical users include pregnant women in their first trimester who are experiencing moderate to severe nausea and are concerned about their hydration levels. It is also popular among those who have a busy schedule and need to maintain their energy levels while managing the symptoms of early pregnancy.',
    ingredients: ['Saline solution', 'Vitamin B6', 'Vitamin B12', 'Electrolytes', 'Folic Acid (optional)'],
    ingredientsDetailed: [
      { name: 'Saline Solution', role: 'Provides the essential hydration needed to support both mother and baby.' },
      { name: 'Vitamin B6', role: 'A key nutrient that many people find helps reduce the feeling of pregnancy-related nausea.' },
      { name: 'Vitamin B12', role: 'Supports energy levels and healthy red blood cell production during pregnancy.' },
      { name: 'Electrolytes', role: 'Restores the balance of minerals that can be lost through vomiting or poor intake.' },
      { name: 'Folic Acid (optional)', role: 'A critical B-vitamin for the healthy development of the baby\'s neural tube.' }
    ],
    sessionExpectation: 'Safety is the top priority. You\'ll be in a very comfortable, supportive environment for about 45-60 minutes, and the staff will ensure you are relaxed throughout. Many clinics provide extra pillows and a quiet space where you can rest and focus on your well-being while the gentle hydration is administered.',
    faqs: [
      { question: 'Is IV therapy for morning sickness safe during pregnancy?', answer: 'Many clinics offer specialized drips that are commonly used by pregnant women for hydration support.' },
      { question: 'How quickly does IV therapy for morning sickness work?', answer: 'The hydration benefits are immediate, which many women find helps reduce the feeling of nausea quickly.' },
      { question: 'Can I get IV therapy for morning sickness at home?', answer: 'Yes, mobile IV services are a very popular and convenient option for those who aren\'t feeling well enough to travel.' },
      { question: 'What is the main ingredient in a morning sickness IV?', answer: 'A balanced saline solution for hydration and Vitamin B6 are the most common components.' },
      { question: 'Do I need a doctor\'s note for IV therapy for morning sickness?', answer: 'Most clinics will perform a health screening, and some may require a quick check-in with your OB-GYN.' },
      { question: 'How much does IV therapy for morning sickness cost?', answer: 'Prices generally range from $175 to $350, with mobile services often having an additional travel fee.' },
      { question: 'How quickly will I feel relief from morning sickness symptoms?', answer: 'Many women report a significant reduction in nausea and an increase in energy within 30 to 60 minutes of their session.' },
      { question: 'Is IV therapy for morning sickness covered by insurance?', answer: 'While usually an out-of-pocket expense, some women are able to use HSA or FSA funds for pregnancy-related hydration.' }
    ]
  },
  {
    slug: 'event-prep',
    title: 'Event Prep',
    icon: 'CalendarStar',
    serviceTag: 'Beauty',
    description: 'Whether it\'s a wedding, a big presentation, or a special celebration, you want to look and feel your absolute best. IV therapy is commonly used for event preparation, providing a boost of hydration and nutrients that can help you shine. Many people use these drips a day or two before their big day to ensure their skin is glowing and their energy levels are high. It\'s a popular "secret weapon" for brides, grooms, and public speakers who want to avoid feeling run down during their most important moments. By delivering a concentrated dose of vitamins and antioxidants, many people report feeling more confident and ready to take on the spotlight, ensuring they have the stamina to enjoy every moment of their event.',
    whyItWorks: 'The stress of planning and preparing for a major event can deplete the body of essential nutrients and lead to dehydration, which often shows up as dull skin and low energy. Many people find that the combination of Vitamin B12 and Vitamin C helps support their natural vitality and immune system during these busy times. Glutathione is another key ingredient that many individuals use to support a clear and radiant complexion.\n\nBy delivering these nutrients via IV, they are immediately available to the body, providing a more rapid and noticeable effect than oral supplements. Many people report that the deep hydration helps "plump" the skin and reduces the appearance of fatigue around the eyes. This comprehensive approach to wellness helps ensure that you are not only looking your best but also feeling energized and focused for your special occasion.',
    comparisons: 'Oral "beauty" vitamins often take months of consistent use to show a difference in skin and energy. IV therapy provides an immediate infusion of high-dose nutrients, which many people find is much more effective for short-term preparation for a specific date. It provides a level of hydration and nutrient density that is difficult to achieve through diet alone in the days leading up to an event.',
    typicalPatient: 'Typical users include brides, grooms, members of a wedding party, keynote speakers, and anyone attending a high-profile social or professional event. It is also popular among those who have a busy travel schedule leading up to an event and want to ensure they arrive looking and feeling refreshed.',
    ingredients: ['Vitamin B12', 'Vitamin C', 'Glutathione', 'Biotin', 'Hydration fluids'],
    ingredientsDetailed: [
      { name: 'Vitamin B12', role: 'Supports natural energy levels and helps you stay alert during long events.' },
      { name: 'Vitamin C', role: 'Provides antioxidant support and helps maintain a healthy, vibrant complexion.' },
      { name: 'Glutathione', role: 'Supports skin brightening and helps the body manage the oxidative stress of a busy schedule.' },
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
      { question: 'How much does IV therapy for event prep cost?', answer: 'Costs typically range from $200 to $450, depending on the number of beauty-boosting additives like Biotin and Glutathione.' },
      { question: 'How quickly will I feel relief from event prep symptoms?', answer: 'While not for "relief," most people notice a boost in energy and skin hydration within 12 to 24 hours.' },
      { question: 'Is IV therapy for event prep covered by insurance?', answer: 'Event prep IV therapy is considered a cosmetic wellness service and is not covered by insurance.' }
    ]
  },
  {
    slug: 'dehydration',
    title: 'Dehydration',
    icon: 'Droplets',
    serviceTag: 'Hydration',
    description: 'Dehydration can happen more easily than many people realize, whether from intense heat, exercise, or simply not drinking enough water throughout the day. IV therapy is commonly used for rapid rehydration, as it delivers fluids directly into the bloodstream for 100% absorption. Many people find it much more effective than drinking water alone when they are feeling significantly depleted. It is often used by outdoor workers, athletes, and those recovering from illness who need to restore their fluid balance quickly. By providing a balanced mix of saline and electrolytes, many people report feeling a near-immediate improvement in their energy levels, mental clarity, and overall sense of well-being.',
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
      { question: 'Can I get IV therapy for dehydration after a long flight?', answer: 'Yes, it is a very common and effective way to combat the dry air and dehydration of air travel.' },
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
    description: 'That "cloudy" feeling in your head can make it difficult to focus and stay productive throughout the day. IV therapy is commonly used for those seeking mental clarity and improved cognitive function. Many people use drips containing NAD+ or high doses of B vitamins to help support their brain\'s natural energy processes. It is often favored by students during finals, professionals with demanding schedules, and anyone who feels their mental sharpness has slipped due to stress or fatigue. By delivering essential nutrients directly to the system, many people report a "lifting of the fog," allowing them to think more clearly, stay focused on the tasks at hand, and feel more mentally present.',
    whyItWorks: 'The brain is a highly metabolic organ that requires a constant supply of energy and specific nutrients to function optimally. Many people find that NAD+ (Nicotinamide Adenine Dinucleotide) is a powerful cofactor that supports mitochondrial health and cellular energy production in the brain. B-complex vitamins, particularly B12, are also essential for healthy nerve function and the production of neurotransmitters.\n\nWhen these nutrients are delivered via IV, they bypass the digestive system and are immediately available to the brain cells. Many individuals report that the addition of taurine helps support neurological health and reduces oxidative stress. By ensuring the brain is well-hydrated and has a surplus of these cognitive-supporting nutrients, IV therapy helps provide the foundation for improved focus, memory, and mental clarity.',
    comparisons: 'Oral "nootropics" and energy drinks often rely on caffeine and other stimulants that can lead to a crash and increased anxiety. IV therapy focuses on providing the actual building blocks of brain health, providing a more natural and sustainable lift in mental clarity. Many people find that the 100% absorption rate of IV nutrients makes a significant difference compared to oral supplements that may have limited bioavailability.',
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
      { question: 'How quickly will I feel relief from brain fog symptoms?', answer: 'Many individuals report a "lifting" of mental cloudiness within 2 to 6 hours of their session.' },
      { question: 'Is IV therapy for brain fog covered by insurance?', answer: 'IV therapy for cognitive support is generally considered a wellness service and is not covered by insurance.' }
    ]
  }
];
