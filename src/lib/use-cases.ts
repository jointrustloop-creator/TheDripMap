export interface UseCase {
  slug: string;
  title: string;
  icon: string;
  serviceTag: string;
  description: string;
  ingredients: string[];
  sessionExpectation: string;
  faqs: { question: string; answer: string }[];
}

export const USE_CASES: UseCase[] = [
  {
    slug: 'hangover',
    title: 'Hangover',
    icon: 'GlassWater',
    serviceTag: 'Hangover',
    description: 'Many people use IV therapy after a night of celebration to help rehydrate and replenish essential nutrients. When you\'ve had a few too many drinks, your body can become dehydrated and depleted of B vitamins and electrolytes. IV therapy is commonly used for a quicker recovery than traditional oral hydration, as it delivers fluids directly into the bloodstream. This approach is often favored by those looking to get back to their day without the lingering discomfort of a heavy head or upset stomach. It\'s a popular choice for weekend travelers and event-goers who want to maximize their time.',
    ingredients: ['Saline solution', 'Vitamin B Complex', 'Electrolytes', 'Anti-nausea support', 'Mineral blend'],
    sessionExpectation: 'A typical session lasts about 45-60 minutes in a comfortable, lounge-like environment. You can relax, read, or catch up on emails while the fluids are administered by a trained professional.',
    faqs: [
      { question: 'How quickly does IV therapy for hangover work?', answer: 'Many people report feeling more hydrated and refreshed within an hour of completing their session.' },
      { question: 'Is IV therapy for hangover better than drinking water?', answer: 'IV therapy delivers fluids directly into the bloodstream, bypassing the digestive system for faster absorption.' },
      { question: 'What is the most common ingredient in a hangover IV?', answer: 'A balanced saline solution for rehydration and B vitamins for energy are the most common components.' },
      { question: 'Can I get IV therapy for hangover at home?', answer: 'Yes, many mobile IV services offer hangover recovery in the comfort of your own home or hotel room.' },
      { question: 'Who typically seeks IV therapy for hangover?', answer: 'It is commonly used by adults who want to recover quickly from dehydration after consuming alcohol.' }
    ]
  },
  {
    slug: 'jet-lag',
    title: 'Jet Lag',
    icon: 'Plane',
    serviceTag: 'Jet Lag',
    description: 'Traveling across time zones can leave you feeling disoriented and exhausted. IV therapy is frequently used by frequent flyers and international travelers to help reset their internal clocks and combat the fatigue associated with long-haul flights. By providing a concentrated dose of hydration and energy-supporting vitamins, many people find it helps them adjust to new schedules more easily. It\'s commonly used for reducing that "foggy" feeling that comes after a long day of travel. Whether you\'re traveling for business or pleasure, a quick hydration session can help you hit the ground running.',
    ingredients: ['Hydration fluids', 'Vitamin B12', 'Vitamin C', 'Magnesium', 'Taurine'],
    sessionExpectation: 'You\'ll be seated in a relaxing chair for about 45 minutes. Most clinics provide a quiet space where you can rest and begin your adjustment to the local time zone.',
    faqs: [
      { question: 'When should I get IV therapy for jet lag?', answer: 'Many travelers find it most effective either immediately after landing or the morning after their arrival.' },
      { question: 'Does IV therapy for jet lag help with sleep?', answer: 'By supporting hydration and nutrient balance, it may help your body adjust its natural rhythms more smoothly.' },
      { question: 'What vitamins are in a jet lag IV?', answer: 'B12 for energy and Vitamin C for immune support are common additions to travel-focused drips.' },
      { question: 'Is IV therapy for jet lag common for business travelers?', answer: 'Yes, it is a very popular choice for professionals who need to be sharp and focused shortly after arrival.' },
      { question: 'How long do the effects of IV therapy for jet lag last?', answer: 'The hydration benefits are immediate, while the nutrient support can help you through the first few days of your trip.' }
    ]
  },
  {
    slug: 'fatigue',
    title: 'Fatigue',
    icon: 'BatteryLow',
    serviceTag: 'Energy',
    description: 'In today\'s fast-paced world, many people experience periods of low energy and persistent tiredness. IV therapy is commonly used for those seeking a natural-feeling boost to their daily vitality. Unlike caffeine, which can lead to a crash, nutrient-focused IV drips aim to support the body\'s natural energy production processes. It is often used by busy parents, students, and professionals who feel "run down" and need a reliable way to replenish their reserves. By delivering B vitamins and amino acids directly to the cells, many people report a sustained sense of alertness and well-being.',
    ingredients: ['Vitamin B Complex', 'Vitamin B12', 'Amino Acids', 'Vitamin C', 'Magnesium'],
    sessionExpectation: 'The session is a peaceful break in your day, typically taking 45-60 minutes. You\'ll leave feeling refreshed and hydrated, often with a noticeable lift in your energy levels.',
    faqs: [
      { question: 'How often can I get IV therapy for fatigue?', answer: 'Frequency depends on individual needs, but many people choose to have a session once or twice a month.' },
      { question: 'Will IV therapy for fatigue make me jittery?', answer: 'No, unlike stimulants, IV therapy supports energy through hydration and essential nutrients.' },
      { question: 'What is the best time of day for IV therapy for fatigue?', answer: 'Morning or early afternoon is often preferred to help power you through the rest of your day.' },
      { question: 'Does IV therapy for fatigue help with mental clarity?', answer: 'Many people report improved focus and reduced "brain fog" along with increased physical energy.' },
      { question: 'Is IV therapy for fatigue suitable for everyone?', answer: 'It is commonly used by healthy adults looking to support their daily energy levels.' }
    ]
  },
  {
    slug: 'cold-and-flu',
    title: 'Cold & Flu',
    icon: 'Thermometer',
    serviceTag: 'Immunity',
    description: 'When you\'re feeling under the weather, staying hydrated is one of the most important things you can do. IV therapy is commonly used for those experiencing the early signs of a seasonal sniffle or a scratchy throat. By delivering high doses of Vitamin C and zinc along with essential fluids, many people use this approach to support their body\'s natural defenses. It\'s often favored by those who want to avoid the dehydration that can occur during a bout of illness. While it doesn\'t replace rest and traditional care, it is a popular supportive measure for those looking to feel more comfortable while they recover.',
    ingredients: ['High-dose Vitamin C', 'Zinc', 'Hydration fluids', 'B vitamins', 'Selenium'],
    sessionExpectation: 'If you\'re feeling unwell, many services offer mobile visits so you don\'t have to leave home. The process is gentle and focused on making you as comfortable as possible.',
    faqs: [
      { question: 'Can IV therapy for cold and flu prevent illness?', answer: 'It is commonly used to support the immune system, which may help your body maintain its natural defenses.' },
      { question: 'Is it safe to get IV therapy for cold and flu while sick?', answer: 'Yes, many people find the extra hydration very helpful when they are feeling unwell.' },
      { question: 'What is the main benefit of IV therapy for cold and flu?', answer: 'The primary benefits are rapid rehydration and the delivery of immune-supporting nutrients like Vitamin C.' },
      { question: 'How long does a cold and flu IV session take?', answer: 'Most sessions are completed within 45 to 60 minutes.' },
      { question: 'Should I get IV therapy for cold and flu at the first sign of symptoms?', answer: 'Many people find it most helpful to start supportive hydration as soon as they feel run down.' }
    ]
  },
  {
    slug: 'sports-recovery',
    title: 'Sports Recovery',
    icon: 'Dumbbell',
    serviceTag: 'Recovery',
    description: 'Athletes and fitness enthusiasts often push their bodies to the limit, leading to muscle soreness and nutrient depletion. IV therapy is a staple for many people in the fitness community, commonly used for post-workout recovery and pre-event preparation. By delivering amino acids and electrolytes directly to the muscles, it helps support the body\'s natural repair processes. Many people use it after marathons, heavy lifting sessions, or intense training blocks to help reduce the time they spend feeling sore. It\'s a popular way to ensure your body has exactly what it needs to bounce back and perform at its best again.',
    ingredients: ['Amino Acid blend', 'Magnesium', 'Electrolytes', 'Vitamin B12', 'Glutathione'],
    sessionExpectation: 'The session is a great time to rest your muscles. You\'ll be in a comfortable chair for about 45-60 minutes, allowing the recovery nutrients to circulate throughout your body.',
    faqs: [
      { question: 'When is the best time for IV therapy for sports recovery?', answer: 'Most athletes prefer a session within 24 hours after an intense workout or competition.' },
      { question: 'Does IV therapy for sports recovery help with muscle cramps?', answer: 'By replenishing electrolytes and magnesium, it may help support healthy muscle function.' },
      { question: 'What amino acids are in a sports recovery IV?', answer: 'Common additions include glutamine, arginine, and ornithine to support muscle repair.' },
      { question: 'Is IV therapy for sports recovery only for pro athletes?', answer: 'Not at all; it is commonly used by weekend warriors and anyone with an active lifestyle.' },
      { question: 'Can IV therapy for sports recovery improve performance?', answer: 'By supporting faster recovery, it may help you stay consistent with your training schedule.' }
    ]
  },
  {
    slug: 'migraine',
    title: 'Migraine',
    icon: 'Headset',
    serviceTag: 'Migraine',
    description: 'For those who experience intense head discomfort, finding a quiet and effective way to find relief is a top priority. IV therapy is commonly used for individuals looking to manage the dehydration and nutrient imbalances that can accompany severe headaches. Many people find that the combination of magnesium and rapid hydration helps them feel more comfortable during a flare-up. It is often used in a calm, dark environment to minimize sensory input while the fluids are administered. While not a cure, it is a popular supportive option for those who want to address the physical toll that intense head pressure can take on the body.',
    ingredients: ['Magnesium', 'Hydration fluids', 'Vitamin B2', 'Vitamin B12', 'Anti-inflammatory support'],
    sessionExpectation: 'Clinics often provide a dim, quiet room for these sessions. You can rest in a comfortable recliner for about 60 minutes in a peaceful atmosphere.',
    faqs: [
      { question: 'How does IV therapy for migraine help?', answer: 'It provides rapid hydration and essential minerals like magnesium, which many people find supportive during a headache.' },
      { question: 'Can I get IV therapy for migraine at home?', answer: 'Yes, mobile IV services are a popular choice so you can stay in a comfortable, familiar environment.' },
      { question: 'What is the most important ingredient in a migraine IV?', answer: 'Magnesium is one of the most commonly included minerals due to its role in supporting nerve and muscle relaxation.' },
      { question: 'Is IV therapy for migraine a common treatment?', answer: 'It is a widely used supportive measure for those looking to manage the symptoms of severe head discomfort.' },
      { question: 'How long does it take to feel better after IV therapy for migraine?', answer: 'Many people report feeling more comfortable and hydrated shortly after the session is complete.' }
    ]
  },
  {
    slug: 'weight-loss',
    title: 'Weight Loss',
    icon: 'Scale',
    serviceTag: 'Weight Loss',
    description: 'Supporting a healthy metabolism is a key part of any wellness journey. IV therapy is commonly used for those looking to complement their diet and exercise routine with targeted nutrient support. Many people use "fat-burning" drips that include lipotropic compounds and B vitamins to help support their energy levels while they work toward their goals. It is often favored by those who feel their progress has plateaued or who need an extra boost to stay active. By ensuring the body has the necessary cofactors for metabolism, many people find it easier to maintain the lifestyle changes needed for long-term success.',
    ingredients: ['Lipotropic compounds (MIC)', 'Vitamin B12', 'L-Carnitine', 'Vitamin B Complex', 'Taurine'],
    sessionExpectation: 'The session is a simple addition to your weekly routine, taking about 45 minutes. It\'s a good time to focus on your wellness goals and plan your healthy meals for the week.',
    faqs: [
      { question: 'Does IV therapy for weight loss work without exercise?', answer: 'It is most effective when used as a supportive measure alongside a healthy diet and regular physical activity.' },
      { question: 'How often should I get IV therapy for weight loss?', answer: 'Many people choose to have a session once a week or every other week during their active weight loss phase.' },
      { question: 'What are lipotropic compounds in a weight loss IV?', answer: 'These are nutrients like methionine, inositol, and choline that help support healthy liver function and fat metabolism.' },
      { question: 'Will IV therapy for weight loss give me more energy?', answer: 'Yes, the B vitamins included are commonly used to support natural energy production.' },
      { question: 'Is IV therapy for weight loss safe?', answer: 'It is commonly used by healthy adults as part of a supervised wellness program.' }
    ]
  },
  {
    slug: 'skin-glow',
    title: 'Skin Glow',
    icon: 'Sparkles',
    serviceTag: 'Beauty',
    description: 'True beauty often starts from within, and hydration is the foundation of a healthy complexion. IV therapy is a popular choice for those seeking a "lit-from-within" radiance, commonly used for skin brightening and overall rejuvenation. By delivering high doses of antioxidants like glutathione and Vitamin C, many people use these drips to support their skin\'s natural defense against environmental stress. It is often favored before big events or as part of a regular skincare routine to help maintain a hydrated, youthful appearance. Many people report that their skin looks more plump and vibrant after a session of deep hydration.',
    ingredients: ['Glutathione', 'Vitamin C', 'Biotin', 'Hydration fluids', 'B-Complex vitamins'],
    sessionExpectation: 'This is a true "beauty break." You\'ll relax for about 45-60 minutes, and many people leave the clinic feeling refreshed with a noticeable "glow" to their skin.',
    faqs: [
      { question: 'How many sessions of IV therapy for skin glow do I need?', answer: 'While one session provides a hydration boost, many people choose regular sessions for sustained results.' },
      { question: 'What is glutathione in a skin glow IV?', answer: 'Glutathione is a powerful antioxidant commonly used for its skin-brightening and detoxifying properties.' },
      { question: 'Can IV therapy for skin glow help with acne?', answer: 'By supporting hydration and reducing oxidative stress, it may help maintain a clearer-looking complexion.' },
      { question: 'Is biotin included in IV therapy for skin glow?', answer: 'Yes, biotin is often added to support the health of your hair, skin, and nails.' },
      { question: 'How long does the "glow" from IV therapy for skin glow last?', answer: 'The immediate hydration effects are visible for several days, while the nutrient benefits can last longer.' }
    ]
  },
  {
    slug: 'stress',
    title: 'Stress',
    icon: 'Wind',
    serviceTag: 'Wellness',
    description: 'When life gets overwhelming, your body can quickly become depleted of the nutrients it needs to stay balanced. IV therapy is commonly used for those seeking a moment of calm and a way to replenish their system during high-stress periods. Many people find that magnesium and B vitamins help support a sense of relaxation and mental well-being. It is often used by busy professionals and those juggling multiple responsibilities who need a forced "time-out" to recharge. By providing a quiet environment and targeted nutrient support, many people report feeling more grounded and better equipped to handle their daily challenges after a session.',
    ingredients: ['Magnesium', 'Vitamin B Complex', 'Vitamin C', 'GABA support', 'Hydration fluids'],
    sessionExpectation: 'This session is designed to be a peaceful escape. You\'ll be in a quiet, comfortable space for 45-60 minutes, often with calming music or a chance to simply rest.',
    faqs: [
      { question: 'Can IV therapy for stress help me sleep better?', answer: 'By supporting relaxation and nutrient balance, many people find it easier to unwind at the end of the day.' },
      { question: 'How does magnesium in IV therapy for stress work?', answer: 'Magnesium is commonly used to support muscle relaxation and a healthy nervous system.' },
      { question: 'Is IV therapy for stress better than taking oral supplements?', answer: 'IV delivery ensures 100% absorption of the nutrients, which can be helpful when your digestive system is affected by stress.' },
      { question: 'How often should I get IV therapy for stress?', answer: 'Many people find a monthly session or a session during particularly busy weeks to be very supportive.' },
      { question: 'What is the most relaxing part of IV therapy for stress?', answer: 'The combination of a quiet environment and calming nutrients like magnesium provides a comprehensive sense of relief.' }
    ]
  },
  {
    slug: 'immunity',
    title: 'Immunity',
    icon: 'ShieldCheck',
    serviceTag: 'Immunity',
    description: 'Maintaining a strong immune system is a year-round priority for many health-conscious individuals. IV therapy is commonly used for immune support, especially during travel, seasonal changes, or periods of high activity. By delivering a potent blend of Vitamin C, zinc, and other antioxidants directly into the bloodstream, many people use this approach to help their body stay resilient. It is a popular choice for those who want to ensure they are getting the maximum benefit from their supplements. Whether you\'re looking to stay healthy during flu season or preparing for a busy trip, a targeted immune-support drip is a common way to prioritize your wellness.',
    ingredients: ['Vitamin C', 'Zinc', 'Selenium', 'Vitamin B12', 'Glutathione'],
    sessionExpectation: 'The session is a proactive step for your health, taking about 45-60 minutes. It\'s a comfortable process that leaves you feeling hydrated and well-supported.',
    faqs: [
      { question: 'Can I get IV therapy for immunity every week?', answer: 'While safe for many, most people choose a session once or twice a month for ongoing support.' },
      { question: 'What is the best vitamin for IV therapy for immunity?', answer: 'Vitamin C and Zinc are the most common and well-known ingredients for supporting immune health.' },
      { question: 'Is IV therapy for immunity good for travel prep?', answer: 'Yes, many people get a session a few days before a big trip to support their system during travel.' },
      { question: 'Does IV therapy for immunity help with allergies?', answer: 'By supporting a healthy immune response, some people find it a helpful addition to their allergy management.' },
      { question: 'Who typically gets IV therapy for immunity?', answer: 'It is popular among travelers, teachers, and anyone looking to support their natural defenses.' }
    ]
  },
  {
    slug: 'morning-sickness',
    title: 'Morning Sickness',
    icon: 'Baby',
    serviceTag: 'Prenatal',
    description: 'Pregnancy is a beautiful journey, but for many, the early stages are marked by persistent nausea and difficulty staying hydrated. IV therapy is commonly used for those experiencing morning sickness who are struggling to keep fluids down. By providing gentle hydration and essential vitamins like B6, many people find it helps them feel more comfortable and energized during their first trimester. It is often favored as a way to ensure both mother and baby are getting the hydration they need. Many services offer specialized prenatal drips designed with safety and comfort in mind, providing a much-needed reprieve from the discomfort of early pregnancy.',
    ingredients: ['Saline solution', 'Vitamin B6', 'Vitamin B12', 'Electrolytes', 'Folic Acid (optional)'],
    sessionExpectation: 'Safety is the top priority. You\'ll be in a very comfortable, supportive environment for about 45-60 minutes, and the staff will ensure you are relaxed throughout.',
    faqs: [
      { question: 'Is IV therapy for morning sickness safe during pregnancy?', answer: 'Many clinics offer specialized drips that are commonly used by pregnant women for hydration support.' },
      { question: 'How quickly does IV therapy for morning sickness work?', answer: 'The hydration benefits are immediate, which many women find helps reduce the feeling of nausea quickly.' },
      { question: 'Can I get IV therapy for morning sickness at home?', answer: 'Yes, mobile IV services are a very popular and convenient option for those who aren\'t feeling well enough to travel.' },
      { question: 'What is the main ingredient in a morning sickness IV?', answer: 'A balanced saline solution for hydration and Vitamin B6 are the most common components.' },
      { question: 'Do I need a doctor\'s note for IV therapy for morning sickness?', answer: 'Most clinics will perform a health screening, and some may require a quick check-in with your OB-GYN.' }
    ]
  },
  {
    slug: 'event-prep',
    title: 'Event Prep',
    icon: 'CalendarStar',
    serviceTag: 'Beauty',
    description: 'Whether it\'s a wedding, a big presentation, or a special celebration, you want to look and feel your absolute best. IV therapy is commonly used for event preparation, providing a boost of hydration and nutrients that can help you shine. Many people use these drips a day or two before their big day to ensure their skin is glowing and their energy levels are high. It\'s a popular "secret weapon" for brides, grooms, and public speakers who want to avoid feeling run down during their most important moments. By delivering a concentrated dose of vitamins and antioxidants, many people report feeling more confident and ready to take on the spotlight.',
    ingredients: ['Vitamin B12', 'Vitamin C', 'Glutathione', 'Biotin', 'Hydration fluids'],
    sessionExpectation: 'This is a great addition to your pre-event beauty or grooming routine. Relax for 45-60 minutes and take a moment to breathe before your busy schedule begins.',
    faqs: [
      { question: 'When should I get IV therapy for event prep?', answer: 'Most people find that 24 to 48 hours before the event is the ideal time for a hydration and glow boost.' },
      { question: 'Will IV therapy for event prep help with my energy?', answer: 'Yes, the B vitamins included are commonly used to support sustained energy throughout a long day.' },
      { question: 'Is IV therapy for event prep common for weddings?', answer: 'It is a very popular choice for bridal parties looking to stay hydrated and radiant.' },
      { question: 'Can I get a group session for IV therapy for event prep?', answer: 'Many clinics and mobile services offer group bookings for wedding parties or corporate events.' },
      { question: 'How long do the results of IV therapy for event prep last?', answer: 'You\'ll likely feel the hydration and energy benefits for several days, covering the duration of most events.' }
    ]
  },
  {
    slug: 'dehydration',
    title: 'Dehydration',
    icon: 'Droplets',
    serviceTag: 'Hydration',
    description: 'Dehydration can happen more easily than many people realize, whether from intense heat, exercise, or simply not drinking enough water. IV therapy is commonly used for rapid rehydration, as it delivers fluids directly into the bloodstream for 100% absorption. Many people find it much more effective than drinking water alone when they are feeling significantly depleted. It is often used by outdoor workers, athletes, and those recovering from illness who need to restore their fluid balance quickly. By providing a balanced mix of saline and electrolytes, many people report feeling a near-immediate improvement in their energy levels and overall sense of well-being.',
    ingredients: ['Saline solution', 'Electrolytes', 'Magnesium', 'Potassium', 'Calcium'],
    sessionExpectation: 'The session is straightforward and focused on restoration. You\'ll be seated comfortably for about 45 minutes while your body\'s fluid levels are replenished.',
    faqs: [
      { question: 'How do I know if I need IV therapy for dehydration?', answer: 'Common signs include persistent thirst, dry mouth, fatigue, and dark-colored urine.' },
      { question: 'Is IV therapy for dehydration better than sports drinks?', answer: 'IV therapy provides direct hydration without the added sugars and dyes often found in commercial sports drinks.' },
      { question: 'How quickly will I feel better after IV therapy for dehydration?', answer: 'Most people report feeling more alert and refreshed before the session is even finished.' },
      { question: 'Can I get IV therapy for dehydration after a long flight?', answer: 'Yes, it is a very common and effective way to combat the dry air and dehydration of air travel.' },
      { question: 'Who typically seeks IV therapy for dehydration?', answer: 'It is commonly used by athletes, travelers, and those recovering from stomach bugs or heat exposure.' }
    ]
  },
  {
    slug: 'brain-fog',
    title: 'Brain Fog',
    icon: 'Cloud',
    serviceTag: 'Brain Fog',
    description: 'That "cloudy" feeling in your head can make it difficult to focus and stay productive throughout the day. IV therapy is commonly used for those seeking mental clarity and improved cognitive function. Many people use drips containing NAD+ or high doses of B vitamins to help support their brain\'s natural energy processes. It is often favored by students during finals, professionals with demanding schedules, and anyone who feels their mental sharpness has slipped. By delivering essential nutrients directly to the system, many people report a "lifting of the fog," allowing them to think more clearly and stay focused on the tasks at hand.',
    ingredients: ['NAD+ (optional)', 'Vitamin B12', 'Taurine', 'Vitamin B Complex', 'Alpha-Lipoic Acid'],
    sessionExpectation: 'The session is a quiet time to clear your mind. You\'ll relax for 45-60 minutes (longer if NAD+ is included) in a calm environment conducive to mental rest.',
    faqs: [
      { question: 'What is the best ingredient for IV therapy for brain fog?', answer: 'B12 and NAD+ are two of the most popular ingredients used to support mental clarity and focus.' },
      { question: 'How long does it take for IV therapy for brain fog to work?', answer: 'Many people report improved focus and alertness within a few hours of their session.' },
      { question: 'Can IV therapy for brain fog help with my memory?', answer: 'By supporting overall brain health and hydration, many people find it easier to recall information and stay sharp.' },
      { question: 'Is IV therapy for brain fog safe for students?', answer: 'It is commonly used by healthy adults, including students looking for a natural way to support their studies.' },
      { question: 'How often should I get IV therapy for brain fog?', answer: 'Many people find a session every few weeks or during particularly demanding periods to be very helpful.' }
    ]
  }
];
