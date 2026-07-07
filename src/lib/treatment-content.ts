export interface TreatmentContent {
  description: string;
  howItWorks: string;
  benefits: string[];
  whatToExpect: string;
  costRange: string;
  costContext: string;
  primaryIngredients: string[];
  sessionDuration: string;
  alternateName?: string;
  relevantSpecialty?: string;
  /** Ideal candidates / situations for this treatment. */
  whoItsFor?: string;
  /** Honest safety note: common side effects + who should check with a doctor first. */
  safety?: string;
  /** Per-treatment FAQs (powers the FAQ section + FAQPage schema). */
  faqs?: { question: string; answer: string }[];
}

export const TREATMENT_CONTENT: Record<string, TreatmentContent> = {
  'Hangover': {
    description: `Hangover IV therapy is a clinical intervention designed to rapidly relieve the dehydration, nutrient depletion, and inflammation that follow heavy alcohol consumption. Alcohol acts as a diuretic, flushing water and essential electrolytes from your body while depleting B vitamins, vitamin C, and magnesium. The hepatic metabolism of alcohol also leaves behind acetaldehyde, a toxic byproduct responsible for many hangover symptoms. A hangover IV bypasses your digestive system entirely, delivering fluids and replacement nutrients directly into your bloodstream for near-immediate relief.

Most hangover IV formulations include a litre of Lactated Ringer's or normal saline for rehydration, a high-dose B-complex (especially B1, B6, and B12), vitamin C for immune and adrenal support, and magnesium to ease headaches and muscle tension. Many providers offer optional add-ons such as ondansetron (Zofran) for nausea or ketorolac (Toradol) for headache and body aches. The result is what many describe as a "reset button" — relief that would otherwise take 12 to 24 hours of rest and oral hydration to achieve.

Hangover IV therapy is most effective when administered within 4 to 8 hours of waking. It is not a license to drink more, nor a substitute for moderation, but it is widely used by professionals, athletes, and frequent travellers who need to be functional after a long night.`,
    howItWorks: `A medical professional inserts a small IV catheter into a vein in your arm or hand. Over 30 to 60 minutes, the fluids and nutrients drip directly into your bloodstream, achieving close to 100% bioavailability compared to roughly 20 to 50% for the same nutrients taken orally. Your body begins rehydrating from the first few minutes, with most clients reporting noticeable relief within 15 to 20 minutes of the infusion starting.`,
    benefits: [
      'Rapid rehydration — restores fluid balance in minutes, not hours',
      'Replaces B vitamins and magnesium depleted by alcohol metabolism',
      'Relieves headache, nausea, and brain fog',
      'Restores energy and mental clarity',
      'Optional anti-nausea and pain-relief add-ons available',
    ],
    whatToExpect: `Sessions typically last 30 to 60 minutes. You'll be seated in a comfortable lounge chair (or at home for mobile services) while the IV runs. Most clinics offer Wi-Fi, beverages, and entertainment. There's no recovery time — you can drive home and return to your day immediately after.`,
    costRange: '$150 to $350',
    costContext: `Standard hangover IVs run $150 to $250. Adding anti-nausea medication, IV pain relief, or a glutathione push usually adds $25 to $75 per add-on. Mobile (in-home or hotel) service typically carries a $50 to $100 premium over in-clinic pricing.`,
    primaryIngredients: ['1L IV fluids (saline or Lactated Ringer\'s)', 'B-complex vitamins', 'Vitamin C', 'Magnesium', 'Optional: ondansetron, ketorolac'],
    sessionDuration: '30-60 minutes',
    alternateName: 'Hangover Recovery IV',
    relevantSpecialty: 'Emergency Medicine',
    whoItsFor: `This drip is aimed at adults dealing with significant hangover symptoms — especially dehydration and nausea — who want faster relief than oral remedies provide, or who simply can't keep fluids down. It's reasonable for the occasional rough morning, but it isn't a fix for regular heavy drinking; if you find yourself needing it often, that's worth a conversation with your doctor.`,
    safety: `Side effects are usually mild — bruising or discomfort at the IV site, lightheadedness, or minor reactions to add-on medications. There's no large-scale evidence that an IV "cures" a hangover, and severe symptoms can sometimes mask alcohol poisoning, which needs medical care rather than a drip. People with kidney disease, heart failure, high blood pressure, or who are pregnant should be cleared first, and a licensed clinician should screen you and check any add-ons for allergies and interactions.`,
    faqs: [
      { question: 'Does a hangover IV actually cure a hangover?', answer: 'No drip cures a hangover, and there is no large-scale evidence one does. It can speed relief of specific symptoms — especially dehydration and nausea — but rest, water, electrolytes and time also work. The only true prevention is drinking less.' },
      { question: 'How fast does it work?', answer: 'Many people feel better within an hour, mostly from rapid rehydration plus any anti-nausea or anti-inflammatory add-on. Results vary with how severe the hangover is.' },
      { question: 'Is it better than just drinking water and resting?', answer: 'It is faster and bypasses an upset stomach, but for a typical hangover, oral fluids, electrolytes and over-the-counter remedies can reach similar results more cheaply. The IV\'s main edge is speed and convenience.' },
      { question: 'Is a hangover IV safe?', answer: 'For most healthy adults under medical supervision, yes, with mild side effects. People with kidney, heart or blood-pressure conditions or who are pregnant should be screened first — and severe symptoms warrant a doctor, not a drip.' },
      { question: 'Can I get one regularly?', answer: 'Frequent use is not advisable and may signal it is time to cut back on alcohol. If you need hangover relief often, it is worth discussing your drinking with a healthcare provider.' },
    ],
  },

  'NAD+ Plus': {
    description: `NAD+ (nicotinamide adenine dinucleotide) is a coenzyme found in every living cell, essential for converting nutrients into cellular energy, repairing DNA, and regulating circadian rhythms. NAD+ levels decline naturally with age — research suggests by middle age we may have only about half the NAD+ we had in our twenties — and that decline has been linked to fatigue, cognitive slowdown, and impaired cellular recovery. NAD+ IV therapy bypasses oral supplements (which have very poor bioavailability for NAD+) and delivers the molecule directly into the bloodstream, restoring cellular levels in a single session.

NAD+ IV therapy is used for a wide range of goals: sustained energy, mental clarity, focus, exercise recovery, and increasingly as a supportive therapy in addiction recovery programs. Some longevity-focused clients use NAD+ as part of a broader healthspan protocol. Sessions are notably longer than other IV therapies — NAD+ must be infused slowly to avoid side effects like chest pressure, anxiety, or stomach discomfort, so a standard 250mg dose can take 2 to 4 hours, and high-dose protocols (500mg+) can stretch to 6 to 8 hours.

NAD+ is one of the more researched IV interventions, but it remains an emerging area. Clinical evidence for some claimed benefits is still maturing, and results vary by individual. Most clinics recommend a series of sessions for noticeable effect rather than a single drip.`,
    howItWorks: `NAD+ is infused at a controlled, slow rate to allow your cells to absorb and convert it into the active forms (NADH, NADP+) that power mitochondrial function. As cellular NAD+ rises, mitochondria produce more ATP — the energy currency your cells run on — and DNA-repair enzymes called sirtuins become more active. Most clients feel the effects build over the days following each session, with cumulative benefit across a series.`,
    benefits: [
      'Sustained energy and mental clarity',
      'Improved focus and cognitive performance',
      'Supports cellular repair and mitochondrial function',
      'Used adjunctively in addiction recovery programs',
      'Part of longevity and healthspan protocols',
    ],
    whatToExpect: `Plan for a long session — typically 2 to 4 hours, sometimes longer for high-dose protocols. The clinic should provide a reclining chair, blanket, snacks, and entertainment. The infusion can cause mild side effects (warm flushing, chest pressure, abdominal discomfort, or anxiety) if it runs too fast, which is why slow titration matters. A good provider will start slow and adjust the rate to your tolerance.`,
    costRange: '$400 to $1,200',
    costContext: `Pricing varies significantly by dose. A 250mg "starter" drip runs $400 to $600. A 500mg session ranges $700 to $900. High-dose 1000mg protocols can be $1,000 to $1,200+. Most clinics offer 4-to-10-session packages at a 10 to 20% discount over single sessions.`,
    primaryIngredients: ['NAD+ (250mg to 1000mg)', 'Saline carrier', 'Sometimes paired with B-complex, glutathione, or amino acids'],
    sessionDuration: '2-4 hours (longer for high doses)',
    alternateName: 'NAD+ Therapy',
    relevantSpecialty: 'Anti-Aging Medicine',
    whoItsFor: `NAD+ IV therapy may appeal to adults dealing with age-related fatigue, burnout or brain fog who have realistic expectations about still-emerging evidence, as well as people in supervised recovery settings where intensive protocols are used. It suits those who can commit to a series and who understand it is a wellness adjunct, not a treatment for any diagnosed condition. Anyone considering it should first rule out an underlying medical cause for their symptoms.`,
    safety: `NAD+ is generally well tolerated, but side effects track closely with infusion speed: going too fast commonly causes flushing, nausea, cramping and a temporary chest-tightness sensation (typically muscular rather than cardiac) that eases when the drip is slowed — which is why infusions run long. People who are pregnant or breastfeeding, have significant heart conditions, or take multiple medications should be cautious, and a licensed clinician should screen you before a first infusion.`,
    faqs: [
      { question: 'Does NAD+ IV therapy actually work?', answer: 'Many people report more energy and clearer thinking, but the human evidence is still limited and mostly from small studies. The biology is plausible, yet the general-wellness benefits are not firmly proven. It is best viewed as an emerging therapy approached with realistic expectations.' },
      { question: 'Why does a NAD+ drip take so long?', answer: 'NAD+ must be infused slowly because rapid administration triggers flushing, nausea and chest tightness. Stretching it to 2–4 hours keeps the experience comfortable. The long duration is a safety feature, not just a sign of a higher dose.' },
      { question: 'Is NAD+ IV safe?', answer: 'Generally yes under qualified supervision, with most side effects mild and tied to infusion speed. A clinician should review your history first. Pregnancy, heart conditions, or taking many medications all warrant extra caution.' },
      { question: 'How many sessions do I need?', answer: 'Most clinics recommend a series rather than one visit, since effects tend to build gradually. The number depends on your goals and protocol — discuss a realistic plan with the clinic.' },
      { question: 'Can NAD+ reverse aging?', answer: 'No. NAD+ is involved in cellular-repair pathways, but there is no proof that infusions reverse aging in humans. Claims to that effect currently outpace the evidence.' },
    ],
  },

  'Immune Support': {
    description: `Immune support IV therapy delivers a concentrated combination of immune-modulating nutrients directly into the bloodstream — most notably high-dose vitamin C, zinc, B vitamins, and the master antioxidant glutathione. Oral supplementation of vitamin C is capped at roughly 200mg of absorption per dose due to intestinal transport limits, but IV administration can deliver several thousand milligrams in a single session, achieving plasma concentrations impossible to reach through diet or pills alone.

The protocol is commonly used in three contexts: preventatively during cold-and-flu season or before high-risk travel, at the first sign of an oncoming illness to shorten its duration and severity, and during chronic stress or recovery from prolonged illness. Athletes use it ahead of competition, frequent travellers use it before long-haul flights, and many wellness clients schedule it monthly as part of a broader immunity-focused protocol.

While robust clinical evidence varies by indication, the underlying nutrients have well-established roles in immune cell function — vitamin C supports neutrophil and lymphocyte activity, zinc is required for T-cell maturation, and glutathione protects immune cells from oxidative stress. A typical immune drip combines all of these in one infusion.`,
    howItWorks: `Over 30 to 45 minutes, the IV delivers vitamin C (typically 5,000 to 25,000mg), zinc, B-complex, and often glutathione directly into your bloodstream. These nutrients become immediately available to white blood cells and the lymphatic system, supporting the cellular machinery that detects and clears pathogens. Glutathione also helps regenerate other antioxidants inside immune cells, extending their functional lifespan during an immune response.`,
    benefits: [
      'High-dose vitamin C and zinc — well beyond what oral supplementation can deliver',
      'Supports immune cell function during stress or illness',
      'Useful preventatively before travel or during cold-and-flu season',
      'May shorten duration and severity of early-stage colds',
      'Glutathione protects immune cells from oxidative damage',
    ],
    whatToExpect: `A comfortable 30 to 45 minute drip in a clinic lounge or at home. You may feel a slight warmth or metallic taste during the vitamin C push — this is normal. Most clients feel a subtle energy lift within hours and report feeling more resilient over the following days. No downtime required.`,
    costRange: '$150 to $300',
    costContext: `Base immune drips run $150 to $225. Adding glutathione push, B12 boost, or a higher vitamin C dose adds $25 to $50 per add-on. Series packages (3 to 6 sessions for cold-and-flu season) are commonly offered at a 10 to 15% discount.`,
    primaryIngredients: ['High-dose vitamin C (5,000-25,000mg)', 'Zinc', 'B-complex vitamins', 'Glutathione (often)'],
    sessionDuration: '30-45 minutes',
    alternateName: 'Immunity IV',
    relevantSpecialty: 'Preventive Medicine',
    whoItsFor: `This IV may appeal to generally healthy adults wanting antioxidant and immune support — particularly during cold-and-flu season or stressful stretches — who have first been screened by a clinician. It is not right for everyone: candidates should be cleared for kidney health and G6PD status before high-dose vitamin C. People after everyday immune maintenance can often meet their needs through diet, so treat this as an optional wellness add-on.`,
    safety: `High-dose IV vitamin C has specific, important contraindications. It must be avoided in people with G6PD deficiency, where it can trigger dangerous red-blood-cell breakdown, so G6PD screening is essential; it should also be avoided with significant kidney impairment or a history of calcium-oxalate kidney stones. Mild effects can include nausea, a warm or metallic sensation, and lightheadedness. A licensed clinician must check kidney function, G6PD status and history before the first infusion.`,
    faqs: [
      { question: 'Why get vitamin C by IV instead of a pill?', answer: 'Oral absorption is capped by a saturable gut transporter, so blood levels plateau even at high doses. IV bypasses that limit and reaches far higher concentrations — the main reason clinics use IV for high-dose vitamin C.' },
      { question: 'Does an immune IV prevent colds or flu?', answer: 'There is no strong proof it prevents infection in healthy people. The ingredients support immune function, but evidence for this specific combination preventing or shortening illness is limited. Treat it as supportive wellness care, not protection.' },
      { question: 'Who should NOT get high-dose vitamin C?', answer: 'People with G6PD deficiency must avoid it because it can trigger dangerous red-blood-cell breakdown. Those with kidney disease or a history of calcium-oxalate kidney stones should also avoid it. Screening for these before treatment is essential.' },
      { question: 'Can you have too much vitamin C?', answer: 'Yes. Beyond what your body needs, excess offers no added benefit, and very high doses can raise oxalate and stress the kidneys. That is why medical supervision and dosing limits matter.' },
      { question: 'What does the glutathione add?', answer: 'Glutathione is the body\'s main intracellular antioxidant, added for antioxidant and detoxification support. Evidence for IV glutathione\'s wellness benefits is still emerging, but it is generally well tolerated under supervision.' },
    ],
  },

  'Beauty Glow': {
    description: `Beauty Glow IV therapy is built around glutathione — a powerful antioxidant produced naturally in the liver — combined with biotin, vitamin C, and often B-complex and amino acids that support skin, hair, and nail health from the inside out. Glutathione neutralizes free radicals, supports liver detoxification pathways, and inhibits tyrosinase (the enzyme responsible for melanin production), which is why high-dose glutathione protocols are popular for skin brightening and even tone.

The "beauty" or "glow" drip is one of the fastest-growing IV categories, driven by clients looking for results that oral supplements simply cannot replicate. Oral glutathione is largely degraded in the digestive tract before reaching the bloodstream — IV delivery is the only way to reliably raise circulating glutathione levels. Biotin supports keratin production for hair and nails. Vitamin C is a cofactor for collagen synthesis, contributing to skin elasticity and wound healing. Together these ingredients form a comprehensive aesthetic-support protocol.

Results are typically gradual and cumulative. Most clients receive a series of 6 to 10 sessions over 8 to 12 weeks for visible effect, then transition to monthly maintenance. Standalone single sessions are popular before events, weddings, or photoshoots for a short-term glow.`,
    howItWorks: `Glutathione is administered either as a slow push at the end of the infusion or mixed into the IV fluids. Vitamin C and B vitamins are infused first to load the antioxidant network. Once circulating, glutathione is taken up by skin cells, where it neutralizes oxidative stress and inhibits melanogenesis. Biotin and amino acids feed into keratin and collagen synthesis pathways. The full session typically runs 45 to 60 minutes.`,
    benefits: [
      'Brighter, more even skin tone over a series of sessions',
      'Supports collagen production for elasticity',
      'Biotin for stronger hair and nails',
      'Liver detoxification support via glutathione',
      'Antioxidant protection against environmental oxidative stress',
    ],
    whatToExpect: `Sessions are calm and spa-like. You may notice a subtle "lit-from-within" glow within 24 to 48 hours of a single session. Cumulative effects on tone and clarity build over a series. Single drips are common before special events; series of 6 to 10 are recommended for noticeable lasting effects.`,
    costRange: '$200 to $450',
    costContext: `Standard beauty drips run $200 to $325. High-dose glutathione (2,000mg+) sessions can reach $400 to $450. Most clinics offer 6-session packages at $1,200 to $1,800. Single pre-event "glow" sessions sit at the lower end of the range.`,
    primaryIngredients: ['Glutathione (master antioxidant)', 'Biotin', 'Vitamin C', 'B-complex vitamins', 'Sometimes amino acids'],
    sessionDuration: '45-60 minutes',
    alternateName: 'Glow IV',
    relevantSpecialty: 'Aesthetic Medicine',
    whoItsFor: `Beauty Glow IVs are most commonly chosen by adults seeking a cosmetic boost — often before weddings, photoshoots or events — or antioxidant and skin-tone support as part of a broader skincare routine. They suit people who understand the effects are gradual, cumulative and not guaranteed, and who pursue it as an optional wellness experience rather than a medical treatment for a skin condition.`,
    safety: `Mild effects can include a cooling or metallic sensation during the infusion, bruising at the IV site, and rarely lightheadedness. More importantly, IV glutathione specifically has been linked in case reports to rare but serious events — including liver and kidney injury and severe skin reactions — and there is no standardized dosing, so a licensed clinician should screen every client. People who are pregnant or breastfeeding, or who have liver, kidney or asthma conditions, should be especially cautious and consult their physician first.`,
    faqs: [
      { question: 'Does a Beauty Glow IV actually lighten skin?', answer: 'The evidence is weak and inconsistent. A 2025 systematic review found IV glutathione\'s skin-lightening effect unclear, with no robust human trials, and it is not approved for this use. Any effect tends to be subtle and temporary, so it should not be relied on as a skin-lightening treatment.' },
      { question: 'How long does the glow last?', answer: 'After a single session, many people report a brief glow lasting a few days to a couple of weeks. Clinics typically recommend a series for more sustained effects, though results vary by person and are not guaranteed.' },
      { question: 'Is IV glutathione safer than oral or topical?', answer: 'Not necessarily. Oral and topical forms have milder effects and milder risks, while the IV route has been associated with rare but serious adverse events. A clinician should weigh the trade-offs with you first.' },
      { question: 'Will the biotin grow my hair faster?', answer: 'Probably not unless you are biotin-deficient. Research shows little benefit from extra biotin for hair and nails in people with normal levels, even though biotin is biochemically involved in keratin production.' },
      { question: 'Can I just take supplements instead?', answer: 'Oral glutathione absorbs poorly, which is part of the IV appeal, but oral options carry far lower risk, and vitamin C and biotin are inexpensive over the counter. Ask a clinician whether an IV adds meaningful value for your goals.' },
    ],
  },

  'Weight Loss': {
    description: `Weight loss IV therapy — sometimes called a "skinny drip" — combines lipotropic compounds, B vitamins, and amino acids designed to support metabolic function alongside diet and exercise. The most common formulation centers on MIC (methionine, inositol, and choline), a combination that supports fat metabolism in the liver, paired with L-carnitine, which assists in transporting fatty acids into the mitochondria where they're burned for energy. B12 and B-complex round out the formula, supporting energy metabolism and helping reduce fatigue often associated with caloric restriction.

It's important to be clear about what weight loss IVs are and aren't. They are not a replacement for a sustainable caloric deficit, exercise, or medical weight-loss treatments — the most consistent and well-evidenced approaches remain nutrition, activity, and where appropriate, prescription medications under medical supervision. What weight-loss IVs can do is support the metabolic side of an existing weight-loss plan by ensuring you're not nutrient-depleted, maintaining energy through caloric restriction, and providing lipotropic cofactors that help the liver process fat efficiently.

Most clients use weight-loss IVs as part of a 6-to-12-week protocol, often paired with B12 injections between IV sessions. Results vary significantly and depend almost entirely on the broader lifestyle changes accompanying the drips.`,
    howItWorks: `MIC compounds support hepatic fat metabolism by aiding the breakdown and transport of fats out of the liver. L-carnitine shuttles long-chain fatty acids into mitochondria for oxidation (energy production). B vitamins support the enzymatic conversion of food into usable energy. Over a 30 to 45 minute infusion, these compounds enter circulation and reach the liver, muscle, and adipose tissue where they support metabolic activity.`,
    benefits: [
      'Lipotropic compounds (MIC) support fat metabolism in the liver',
      'L-carnitine assists fatty acid transport for energy production',
      'B vitamins help maintain energy during caloric restriction',
      'May reduce fatigue common during weight-loss programs',
      'Useful as a supportive protocol alongside diet and exercise',
    ],
    whatToExpect: `Sessions are 30 to 45 minutes. Most clinics recommend a series of 4 to 8 IVs over 4 to 12 weeks, often paired with weekly B12 intramuscular injections in between. Some clients notice increased energy within hours; weight-related changes are gradual and entirely dependent on diet and activity changes outside the clinic.`,
    costRange: '$150 to $300',
    costContext: `Standard MIC/B12 drips run $150 to $225 per session. Adding L-carnitine, glutathione, or higher-dose B12 pushes adds $25 to $50 per add-on. Series packages of 4 to 8 sessions are commonly offered at a 15 to 20% discount.`,
    primaryIngredients: ['MIC (methionine, inositol, choline)', 'L-carnitine', 'B-complex vitamins', 'B12'],
    sessionDuration: '30-45 minutes',
    alternateName: 'Skinny Drip',
    relevantSpecialty: 'Preventive Medicine',
    whoItsFor: `This drip is best suited to adults already committed to a structured weight-management plan — a sustainable calorie deficit, activity and clinician guidance — who want supplemental metabolic and energy support, or who are nutrient-depleted from dieting. It is not appropriate for anyone expecting it to drive weight loss on its own, and it is not a substitute for evidence-based options like GLP-1 medications, which require separate medical evaluation.`,
    safety: `Side effects are generally mild — soreness or bruising at the IV site, a warm flush, transient nausea, or an unusual taste. Because the formulation is not FDA-approved for weight loss and dosing is not standardized, a licensed clinician should screen each client, review medications and set realistic expectations before treatment. People who are pregnant or breastfeeding, or who have liver, kidney or cardiovascular conditions, should consult a doctor first.`,
    faqs: [
      { question: 'Is a weight-loss IV the same as Ozempic or semaglutide?', answer: 'No. Semaglutide and tirzepatide are FDA-approved GLP-1 prescription medications with strong trial evidence for weight loss. MIC / lipotropic IVs are nutrient-based, work by a different mechanism, and are not FDA-approved for weight loss.' },
      { question: 'Will MIC injections make me lose weight on their own?', answer: 'There is insufficient evidence that they cause weight loss by themselves. They are best viewed as a supportive adjunct to a calorie deficit and exercise, not a standalone solution.' },
      { question: 'Do lipotropic ingredients actually burn fat?', answer: 'They play roles in how the liver and cells handle fats, but no large human trials show the combined formula directly burns fat. Any benefit appears modest and depends on overall lifestyle changes.' },
      { question: 'How fast will I see results?', answer: 'Most people use a series over several weeks and some report an energy boost within hours, but visible weight changes are gradual and driven mainly by diet and activity, not the drip.' },
      { question: 'Are MIC shots safe?', answer: 'They are generally well tolerated, with mild effects like injection-site soreness or occasional nausea. A clinician should screen you first, especially if you are pregnant, breastfeeding, or have liver, kidney or heart conditions.' },
    ],
  },

  'Hydration': {
    description: `Hydration IV therapy is the simplest and most foundational drip — a litre of medical-grade saline or Lactated Ringer's solution, sometimes paired with basic electrolytes or a B-vitamin boost. While the recipe sounds basic, the impact can be substantial. The human body is roughly 60% water by weight, and even mild dehydration (just 1 to 2% fluid loss) measurably impairs cognitive performance, energy, mood, and physical output. Oral hydration takes hours for fluids to absorb and distribute through the body — IV fluids restore intravascular volume in minutes.

The hydration drip is the go-to for clients who can't keep fluids down (severe nausea, food poisoning, post-illness), need rapid recovery (after intense exercise, long flights, or heat exposure), or simply want the fastest and most reliable rehydration method. It's also the most affordable IV in most clinics' menus and the most common entry point for first-time IV therapy clients.

Many providers offer hydration as a "build your own" base — you choose a litre of saline and then add vitamin C, B vitamins, magnesium, glutathione, or anti-nausea medication based on your needs. This modular approach makes it one of the most versatile IV options.`,
    howItWorks: `A litre of sterile saline (0.9% sodium chloride) or Lactated Ringer's solution is infused over 30 to 45 minutes through a small IV catheter. The fluid enters your bloodstream directly, immediately restoring intravascular volume and supporting cellular hydration. Unlike oral fluids, which must pass through the digestive system, IV hydration is 100% absorbed and distributed within minutes.`,
    benefits: [
      'Rapid restoration of fluid balance — minutes, not hours',
      'Useful when oral hydration isn\'t possible (nausea, illness)',
      'Speeds recovery from intense exercise, heat, or travel',
      'Modular — easy to add vitamins, electrolytes, or medications',
      'Most affordable IV therapy option',
    ],
    whatToExpect: `A quick 30 to 45 minute session in a clinic lounge or at home. Most clients feel noticeably better — clearer-headed, less fatigued, less thirsty — by the time the bag finishes. There's no downtime; you can return to normal activities immediately.`,
    costRange: '$100 to $250',
    costContext: `Plain saline hydration is the most affordable option, typically $100 to $175. Adding electrolytes, a vitamin push, or anti-nausea medication brings the total to $150 to $250. Mobile (in-home or hotel) hydration adds a $50 to $100 service premium.`,
    primaryIngredients: ['1L sterile saline or Lactated Ringer\'s', 'Optional: electrolytes, B vitamins, vitamin C'],
    sessionDuration: '30-45 minutes',
    alternateName: 'IV Fluids',
    relevantSpecialty: 'Emergency Medicine',
    whoItsFor: `Ideal candidates are people recovering from dehydration due to heat, intense activity, travel, mild illness or a night of poor fluid intake — especially anyone who struggles to rehydrate by mouth. It is a reasonable convenience reset for healthy adults too, though those who are already well-hydrated are unlikely to gain much beyond what a glass of water provides.`,
    safety: `Hydration IVs are very safe, with the most common side effects being minor — bruising, discomfort or mild swelling at the insertion site. The more important consideration is fluid and electrolyte overload: people with congestive heart failure, kidney disease, uncontrolled high blood pressure, or who are pregnant should be cautious, as their bodies may not handle the extra volume well. A licensed clinician should screen you and run the infusion under sterile, supervised conditions.`,
    faqs: [
      { question: 'Is an IV better than just drinking water?', answer: 'For genuinely dehydrated people, or those who cannot keep fluids down, an IV rehydrates faster and more reliably. For healthy, mildly dehydrated people, drinking water and oral electrolytes works nearly as well for far less cost.' },
      { question: 'How long does the hydration last?', answer: 'Your body retains the fluid and rebalances over the following hours, and the kidneys excrete any excess. The hydration "boost" is temporary and depends on your overall fluid intake and activity afterward.' },
      { question: 'How often can I get a hydration IV?', answer: 'Occasional use is fine for most healthy people, but routine IV hydration is not medically necessary. A clinician can advise based on your health and reasons for use.' },
      { question: 'Does it hurt?', answer: 'You will feel a brief pinch when the catheter is inserted, and sometimes a cool sensation as the fluid flows in. Most people find it mild and easy to tolerate.' },
      { question: 'Is it safe for everyone?', answer: 'It is safe for most healthy adults, but people with heart, kidney or blood-pressure conditions, or who are pregnant, should be screened by a clinician first to avoid fluid overload.' },
    ],
  },

  'Recovery': {
    description: `Recovery IV therapy is designed for athletes, weekend warriors, and anyone whose body is recovering from intense physical exertion. The protocol combines amino acids (typically a blend including BCAAs — branched-chain amino acids leucine, isoleucine, and valine), magnesium for muscle relaxation and cramp prevention, B vitamins for energy metabolism, vitamin C and glutathione for antioxidant defense against exercise-induced oxidative stress, and a litre of IV fluids for rehydration.

Intense exercise creates micro-tears in muscle fibers, depletes glycogen, generates reactive oxygen species, and disrupts fluid and electrolyte balance. Oral supplements help but absorb slowly and incompletely. Recovery IVs deliver the same nutrients at much higher concentrations directly into circulation, accelerating the rebuild-and-restore process. Many clients report meaningful reductions in delayed-onset muscle soreness (DOMS) and faster return-to-training the next day.

This drip is popular with marathoners, CrossFit athletes, cyclists, professional and college athletes, and anyone training for a specific event. It's also used by clients recovering from physical labor, long hikes, or sports vacations.`,
    howItWorks: `Over 45 to 60 minutes, the IV delivers amino acids for muscle protein synthesis, magnesium to reduce muscle tension and cramping, B vitamins to convert nutrients into ATP, and antioxidants to neutralize free radicals generated during exercise. IV fluids restore intravascular volume lost through sweat. Most clients feel less stiff and more rested within hours, with full recovery acceleration apparent the following day.`,
    benefits: [
      'Amino acids support muscle repair and protein synthesis',
      'Magnesium reduces muscle tension and cramping',
      'Antioxidants neutralize exercise-induced oxidative stress',
      'IV fluids rapidly restore hydration lost through sweat',
      'May reduce delayed-onset muscle soreness (DOMS)',
    ],
    whatToExpect: `Plan for a 45 to 60 minute session in a comfortable chair. Many clinics that cater to athletes have post-event packages designed for race-day and post-competition recovery. Mobile service is popular for athletes who don't want to travel after a race or long ride.`,
    costRange: '$175 to $400',
    costContext: `Standard recovery drips run $200 to $300. Adding amino acid mega-doses, glutathione, or magnesium push brings the total to $350 to $400. Pre-event hydration + recovery packages typically run $400 to $600 for a paired drip.`,
    primaryIngredients: ['Amino acids (including BCAAs)', 'Magnesium', 'B-complex vitamins', 'Vitamin C', 'Glutathione', 'IV fluids'],
    sessionDuration: '45-60 minutes',
    alternateName: 'Athletic Recovery IV',
    relevantSpecialty: 'Sports Medicine',
    whoItsFor: `This drip appeals to athletes, endurance competitors and active people recovering from intense training or events with heavy sweating and fluid loss — particularly when significantly dehydrated. Competitive athletes subject to anti-doping rules should confirm that infusion volumes comply with regulations, and most recreational exercisers can recover well with oral hydration and nutrition alone.`,
    safety: `Side effects are typically mild — IV-site bruising, lightheadedness, or a warm sensation from magnesium. The more serious risks are fluid overload and electrolyte imbalance, so people with kidney disease, heart conditions or high blood pressure, and those who are pregnant, should get clinician clearance first. Athletes should also be aware of anti-doping infusion-volume limits (e.g. WADA). A licensed clinician should screen and supervise each infusion.`,
    faqs: [
      { question: 'Does a recovery IV really speed up recovery?', answer: 'Rehydration and electrolyte replacement genuinely help after heavy sweating, but claims of dramatically "faster recovery" come mostly from marketing and are not well proven. For most athletes, oral hydration and nutrition recover the body comparably.' },
      { question: 'Is it allowed for competitive athletes?', answer: 'Many anti-doping bodies such as WADA restrict IV infusions above certain volumes except for legitimate medical care. Competitive athletes should verify compliance with their sport\'s rules before getting one.' },
      { question: 'Will it help with muscle soreness?', answer: 'Amino acids and antioxidants play real roles in muscle repair and managing oxidative stress, and some people report less soreness. However, the evidence that IV delivery beats oral nutrition for soreness is mixed.' },
      { question: 'Is it safe?', answer: 'It is generally safe for healthy adults under medical supervision, with mild side effects. People with kidney, heart or blood-pressure conditions or who are pregnant should be screened first due to fluid-overload risk.' },
      { question: 'How often should an athlete get one?', answer: 'There is no standardized schedule; occasional use after significant exertion is reasonable for most. A clinician should guide frequency, and routine reliance is not necessary when oral hydration and nutrition suffice.' },
    ],
  },

  'Myers Cocktail': {
    description: `The Myers Cocktail is the original IV vitamin therapy — developed in the 1960s by Baltimore physician Dr. John Myers, who used it for decades to treat patients with chronic fatigue, fibromyalgia, asthma, migraines, and other conditions that responded poorly to oral therapy. The formula remains largely unchanged today: B-complex vitamins, B12, vitamin C, calcium, and magnesium, infused over 15 to 30 minutes. It is the most widely used and best-known IV cocktail in the field, and the foundation from which most modern IV therapy protocols evolved.

The Myers Cocktail's enduring popularity comes from its remarkable versatility. The combination of magnesium and B vitamins addresses a wide range of symptoms — fatigue, muscle tension, migraine, asthma, seasonal allergies, and chronic stress. Calcium supports nervous system regulation and muscle function. Vitamin C provides antioxidant and immune support. Together, these nutrients address common deficiencies and provide what many describe as a comprehensive "tune-up."

A small but growing body of clinical research has examined the Myers Cocktail's effects in conditions like fibromyalgia and migraine, with mixed but generally positive results. Most clients receive a Myers as monthly maintenance or as needed during stressful periods. It remains the entry-point IV that most clinics recommend for first-time clients who don't have a specific protocol in mind.`,
    howItWorks: `The classic formula is mixed into 250mL to 500mL of sterile saline and infused over 15 to 30 minutes — making it one of the shorter IV sessions available. The combination of B vitamins, vitamin C, calcium, and magnesium enters the bloodstream and is distributed to tissues where these nutrients support energy production, nervous system function, antioxidant defense, and muscle relaxation.`,
    benefits: [
      'Comprehensive vitamin and mineral replenishment',
      'May help with fatigue, migraine, and fibromyalgia symptoms',
      'Magnesium for muscle relaxation and stress reduction',
      'Short session — one of the quickest IV options',
      'Well-established formula with decades of clinical use',
    ],
    whatToExpect: `A short 15 to 30 minute session. You may feel a warm sensation in your chest during the magnesium push — this is normal and passes within minutes. Most clients feel a noticeable lift in energy and clarity by the end of the session, with effects building over the following day.`,
    costRange: '$150 to $300',
    costContext: `Standard Myers Cocktails run $150 to $225. Variations with added glutathione, extra B12, or higher-dose vitamin C bring the total to $250 to $300. Often offered as a monthly maintenance series with discounted pricing.`,
    primaryIngredients: ['B-complex vitamins', 'B12', 'Vitamin C', 'Calcium', 'Magnesium'],
    sessionDuration: '15-30 minutes',
    alternateName: 'Myers IV',
    relevantSpecialty: 'Preventive Medicine',
    whoItsFor: `The best candidates are people with confirmed or likely nutrient deficiencies, malabsorption conditions, or who tolerate oral supplements poorly — plus generally healthy people seeking an energy or wellness boost, provided they understand the evidence for benefit in healthy individuals is limited. Anyone with a chronic condition should view it as a complement to, not a replacement for, proper medical care.`,
    safety: `The Myers' Cocktail is generally well tolerated, but side effects can include a warm flush (especially from magnesium), a metallic or vitamin taste, lightheadedness, and IV-site discomfort. Rapid magnesium infusion can cause a drop in blood pressure, so it is pushed slowly. People with kidney disease, heart conditions, pregnancy, or G6PD deficiency (for the vitamin C) need clinician clearance first.`,
    faqs: [
      { question: 'Does a Myers\' Cocktail actually work?', answer: 'It can genuinely help people with nutrient deficiencies or malabsorption. For healthy people without a deficiency, rigorous evidence is limited and reported benefits may partly reflect hydration and placebo. It is not proven to treat any serious illness.' },
      { question: 'How often should I get one?', answer: 'There is no standardized schedule — some clinics suggest monthly, others as needed. Frequency should be guided by a clinician based on your health and labs, rather than a fixed routine.' },
      { question: 'Is it safe?', answer: 'For most healthy adults under medical supervision, yes, with mostly mild side effects. People with kidney, heart or blood-pressure conditions, pregnancy, or G6PD deficiency need clearance first.' },
      { question: 'Why not just take vitamins by mouth?', answer: 'Oral supplements are sufficient for most people. The IV route mainly helps those with poor absorption or who do not tolerate pills; for everyone else, the advantage over oral intake is modest.' },
      { question: 'What does it feel like during the infusion?', answer: 'Many people feel a warm flush and briefly taste vitamins — both normal and harmless. The magnesium is infused slowly to keep you comfortable.' },
    ],
  },

  'Jet Lag': {
    description: `Jet lag IV therapy is built for travellers crossing multiple time zones — a population whose internal circadian rhythm gets desynchronized from local time, leading to fatigue, insomnia, brain fog, and gastrointestinal disruption that can last days. The typical jet-lag IV combines a litre of IV fluids (long-haul flights are profoundly dehydrating due to dry cabin air and limited oral hydration), B vitamins for energy metabolism, magnesium for nervous system regulation and sleep quality, vitamin C for antioxidant support, and sometimes melatonin to help re-anchor the circadian rhythm to local time.

Long flights cause both physiological dehydration (cabin humidity is typically 10 to 20%, compared to 30 to 65% on the ground) and circadian disruption. Both factors stack to produce the post-flight slump familiar to frequent travellers. The jet-lag IV addresses the dehydration component immediately and provides the cofactors the body needs to reset its internal clock more quickly. Many clients schedule the drip within 12 to 24 hours of landing for maximum effect.

This IV is especially popular in destination cities — Las Vegas, Miami, New York, Los Angeles, and Toronto's downtown core all have clinics that cater to arriving business travellers and tourists who don't want to lose their first 24 to 48 hours to recovery. Mobile (hotel-room) service is widely available for this category.`,
    howItWorks: `Over 30 to 45 minutes, a litre of IV fluids restores cellular and intravascular hydration depleted by the dry cabin environment. B vitamins support cellular energy production, helping you push through the day at local time. Magnesium aids the transition into restful sleep on the new local schedule. Optional melatonin supports the circadian reset directly. Most clients report feeling significantly more alert and clear-headed by the time the bag finishes.`,
    benefits: [
      'Rapid rehydration after dry cabin air',
      'B vitamins help maintain energy on the local schedule',
      'Magnesium supports nervous system reset and sleep quality',
      'Helps shorten the post-flight "fog" period',
      'Mobile (hotel) service widely available — no need to leave your room',
    ],
    whatToExpect: `A quick 30 to 45 minute session, either at a clinic or in your hotel room. Most clients feel meaningfully clearer and more energetic by the end of the drip and sleep better that night on local time. The drip works best when scheduled within 24 hours of arrival.`,
    costRange: '$175 to $325',
    costContext: `Base jet-lag drips run $175 to $250. Hotel (in-room) service typically adds $50 to $100. Adding melatonin, extra B12, or a glutathione push adds $25 to $50 per add-on. Some destination clinics offer "arrival + departure" two-session packages.`,
    primaryIngredients: ['1L IV fluids', 'B-complex vitamins', 'Magnesium', 'Vitamin C', 'Optional: melatonin'],
    sessionDuration: '30-45 minutes',
    alternateName: 'Travel Recovery IV',
    relevantSpecialty: 'Preventive Medicine',
    whoItsFor: `It appeals to business travelers, tourists and anyone landing after a multi-time-zone flight who wants to feel functional quickly rather than losing the first day or two to recovery — most useful for people who arrive notably dehydrated or run-down. Travelers who already hydrate well, sleep adequately and manage light exposure may not notice a dramatic difference and can lean on those free strategies instead.`,
    safety: `Common effects are mild — bruising at the site, brief coolness as fluids infuse, or lightheadedness. People with heart, kidney or blood-pressure conditions need caution because IV fluid loading affects fluid balance, and anyone pregnant, breastfeeding or taking sedating medication should discuss the melatonin and magnesium with a doctor first. As with any IV, a licensed clinician should screen each traveler and place the line under sterile technique.`,
    faqs: [
      { question: 'Does an IV actually cure jet lag?', answer: 'No. It can rapidly rehydrate you and may help you feel better faster, but jet lag is mainly a circadian (body-clock) issue. The strongest evidence-based fixes are hydration, light exposure, sleep timing and sometimes melatonin.' },
      { question: 'When should I get the drip relative to my flight?', answer: 'Most people schedule it within about 24 hours of landing for the biggest comfort benefit. Some clinics also offer a pre-departure hydration session.' },
      { question: 'Is the IV better than just drinking water?', answer: 'It rehydrates faster and more completely than oral fluids, which is its clearest advantage. For a healthy traveler who hydrates and sleeps well, the added benefit over water and good habits may be modest.' },
      { question: 'Does the melatonin add-on help me adjust faster?', answer: 'Melatonin has reasonable evidence for shifting the body clock and aiding sleep on a new schedule. As an add-on it can support circadian adjustment, but timing and dose matter, so ask the clinician.' },
      { question: 'Is it safe to get an IV right after a long flight?', answer: 'For most healthy adults, yes, with mild risks like bruising at the site. People with heart, kidney or blood-pressure conditions, or who are pregnant or breastfeeding, should be screened by a clinician first.' },
    ],
  },

  'Energy Boost': {
    description: `Energy Boost IV therapy targets the cellular machinery responsible for converting food into usable energy. The formula centers on B12 (methylcobalamin or hydroxocobalamin, the bioactive forms), B-complex vitamins (especially B1, B2, B3, B5, B6), and often amino acids and vitamin C. These nutrients are essential cofactors in the Krebs cycle and electron transport chain — the cellular pathways that produce ATP, the energy currency of every cell in your body. When any of these cofactors are depleted, energy production slows and fatigue sets in.

B12 deficiency is surprisingly common, particularly among vegetarians, vegans, people over 50 (whose stomach acid production declines, impairing oral B12 absorption), and anyone taking acid-reducing medications long-term. Oral B12 absorption is highly variable — IV (or intramuscular) delivery bypasses absorption issues entirely. The same applies to other B vitamins, which are water-soluble and not stored long-term in the body. IV delivery provides an immediate, near-complete loading of these nutrients.

This drip is popular with busy professionals, parents, frequent travellers, and anyone going through a high-stress period who needs a sustained energy lift without the crash that comes with caffeine or sugar. It's also used as a "Monday morning reset" by clients who routinely sacrifice sleep and recovery for work or social demands.`,
    howItWorks: `Over 20 to 40 minutes, the IV delivers a high dose of B12 alongside the full B-complex range. These nutrients are immediately available to cells throughout the body, where they serve as cofactors in the enzymes that produce ATP from carbohydrates, fats, and proteins. Many clients feel a noticeable energy lift within hours, with effects lasting several days to a week before the next session.`,
    benefits: [
      'High-dose B12 and B-complex — bypasses oral absorption variability',
      'Supports cellular energy production at the mitochondrial level',
      'Sustained energy lift without caffeine crash',
      'Quick session — one of the fastest IVs available',
      'Useful during high-stress, high-demand periods',
    ],
    whatToExpect: `One of the shorter IV sessions at 20 to 40 minutes. You may feel a subtle warmth as the B vitamins infuse. Most clients feel noticeably more energetic within a few hours, with the lift lasting several days. Often booked weekly or biweekly during demanding periods.`,
    costRange: '$125 to $250',
    costContext: `Base energy drips run $125 to $200. Adding amino acids, vitamin C, or a glutathione push brings the total to $200 to $250. Often paired with a separate B12 intramuscular injection between IV sessions for sustained effect.`,
    primaryIngredients: ['B12 (methylcobalamin)', 'B-complex vitamins', 'Sometimes amino acids', 'Sometimes vitamin C'],
    sessionDuration: '20-40 minutes',
    alternateName: 'B12 Energy IV',
    relevantSpecialty: 'Preventive Medicine',
    whoItsFor: `This IV is most clearly beneficial for people with a confirmed B12 deficiency or a condition that impairs absorption (Crohn's, celiac, pernicious anemia, or after GI surgery), where IV or injected B12 is standard care. It may also appeal to healthy adults wanting a hydration-and-vitamin pick-me-up for fatigue or jet lag — provided they understand the benefit may be modest and partly due to fluids. Persistent fatigue warrants a medical workup to find the underlying cause.`,
    safety: `Energy/B-complex IVs are among the safer IV therapies, with serious side effects rarely reported. Mild, temporary effects can include a warm flush, a vitamin taste during infusion, and IV-site discomfort. Magnesium (if included) can briefly lower blood pressure if pushed quickly, and people with kidney or heart conditions should be cautious about the mineral and fluid load. A licensed clinician should review your history and medications first.`,
    faqs: [
      { question: 'Will a B12 or energy IV boost my energy if my levels are normal?', answer: 'Probably not in any lasting way. Major health institutions note that if your B12 is already normal, injections are unlikely to increase energy, and much of the lift may come from hydration or placebo. The clear benefit is correcting an actual deficiency.' },
      { question: 'How is this different from taking B vitamins as a pill?', answer: 'IV delivery bypasses the gut, which matters if you have absorption problems like Crohn\'s or pernicious anemia. For healthy people who absorb normally, oral supplements are usually enough and far cheaper — the body excretes excess water-soluble B vitamins.' },
      { question: 'Is it safe?', answer: 'It has a long safety record and serious side effects are rare. Mild flushing or a vitamin taste can occur. People with kidney or heart conditions should be screened first.' },
      { question: 'How often can I get an energy IV?', answer: 'There is no universal schedule; clinics often suggest periodic sessions, but frequent infusions in healthy people add little proven benefit. Persistent fatigue warrants a medical workup instead.' },
      { question: 'How long does it take?', answer: 'Most energy/B-complex IVs run about 20–40 minutes, and you can resume normal activities right away. Some people notice a same-day lift, though effects are typically short-term.' },
    ],
  },

  'Iron Infusion': {
    description: `Iron infusion is a medical treatment that delivers iron directly into the bloodstream to correct iron-deficiency anemia. It is not a wellness drip, and not something to take "for energy" without documented low iron. It is reserved for people whose iron stores are confirmed low on bloodwork and who either cannot tolerate oral iron, do not absorb it (due to conditions like celiac disease, inflammatory bowel disease, or bariatric surgery), have ongoing blood loss that outpaces pills, or need their levels restored faster than oral iron allows. The modern agents (ferric carboxymaltose, iron sucrose, and ferric derisomaltose) let a clinician replace a large iron deficit in one or a few visits.

Iron deficiency is the most common nutritional deficiency worldwide and a frequent cause of fatigue, breathlessness, and poor concentration. But fatigue has many causes, and "tired" is not a reason to get iron. Giving iron to someone who is not deficient is useless at best and harmful at worst, because the body has no efficient way to excrete excess iron. That is why a confirmed diagnosis, typically ferritin, transferrin saturation, and a complete blood count, must come before any infusion.

In Canada, IV iron requires recent bloodwork and an order from an authorized prescriber. Hospital infusion clinics deliver it when medically necessary, but referral queues can be long, which is why many people with a valid requisition turn to private infusion clinics for faster booking. Because it is a prescription medical therapy with a real (if small) risk of serious reactions, iron infusion belongs in a clinical setting equipped to recognize and treat an allergic reaction, supervised by trained staff. It is a legitimate, often life-changing treatment when used correctly, and inappropriate when used as a generic pick-me-up.`,
    howItWorks: `Iron is bound within a carbohydrate shell in these formulations, which lets the body take it up gradually and refill the iron stores used to make hemoglobin, the oxygen-carrying protein in red blood cells. After bloodwork confirms deficiency and a clinician calculates your iron deficit, the dose is infused over anywhere from a few minutes to roughly an hour depending on the product, with monitoring during and for a period after the infusion. Hemoglobin and symptoms typically improve over the following weeks, not immediately.`,
    benefits: [
      'Corrects diagnosed iron-deficiency anemia when oral iron fails or is not tolerated',
      'Replaces a large iron deficit in one or a few visits rather than months of pills',
      'Bypasses the gut for people with malabsorption or poor oral-iron tolerance',
      'Can relieve deficiency-related fatigue, breathlessness, and poor concentration over weeks',
      'Hospital infusions are publicly covered when medically necessary; extended health plans often cover the drug at private clinics',
    ],
    whatToExpect: `Expect a clinical, monitored visit rather than a spa experience. Bring your bloodwork and prescription, or ask the clinic what they need ahead of time; a legitimate provider will not infuse iron without both. After confirming your diagnosis and reviewing your history, staff start an IV and infuse the iron over several minutes to about an hour, watching for any reaction during the infusion and keeping you for a short observation period afterward. Some products are split across more than one visit. Mild reactions can occur, and a clinician should be present and equipped to manage them.`,
    costRange: '$250 to $800 CAD',
    costContext: `In Canada, private clinic pricing typically runs $250 to $800 CAD per infusion depending on the product and total dose, with newer single-dose agents at the higher end and multi-visit iron sucrose protocols priced per session. Hospital infusions are covered when medically necessary but usually involve a referral and a wait. Many extended health plans cover the drug portion with a prescription, so out-of-pocket cost can be far lower than the cash price; confirm with your plan before booking.`,
    primaryIngredients: ['Ferric carboxymaltose', 'Iron sucrose', 'Ferric derisomaltose'],
    sessionDuration: '15-60 minutes plus observation',
    alternateName: 'IV Iron',
    relevantSpecialty: 'Hematology',
    whoItsFor: `This is for people with iron-deficiency anemia confirmed on bloodwork who cannot take, tolerate, or absorb oral iron, or who need faster correction than pills allow: for example those with malabsorption, heavy menstrual or GI blood loss, chronic kidney disease, or who are post-bariatric surgery. It is not for anyone seeking an energy boost without proven low iron: giving iron to a non-deficient person is inappropriate and potentially dangerous, since the body cannot easily remove excess iron.`,
    safety: `Iron infusion carries real risks that set it apart from wellness drips. Serious allergic reactions including anaphylaxis are rare but possible, so it must be given where staff can recognize and treat a reaction. Some products can cause hypophosphatemia (a drop in blood phosphate) that may need monitoring, and skin staining at the IV site can occur if iron leaks out. More common, milder effects include headache, nausea, joint or muscle aches, and a transient flushing reaction. Anyone with a history of iron-infusion reactions, significant allergies, active infection, or who is pregnant must be assessed by a clinician first, and no one should receive iron without bloodwork confirming deficiency.`,
    faqs: [
      { question: 'Do I need a prescription or referral for an iron infusion in Canada?', answer: 'Yes. IV iron is a prescription medication, and any legitimate clinic requires recent bloodwork plus an order from an authorized prescriber. Many private clinics can arrange the assessment and requisition if you do not already have one from your family doctor or nurse practitioner.' },
      { question: 'How much does an iron infusion cost in Canada?', answer: 'Private clinics typically charge $250 to $800 CAD per infusion depending on the product and dose. Hospital infusions are covered when medically necessary but usually involve a referral and a wait. Extended health plans often cover the drug portion with a prescription, so check your plan before booking.' },
      { question: 'Can I get an iron infusion just for energy?', answer: 'No. Iron should only be given when bloodwork confirms iron deficiency. Fatigue has many causes, and iron does not help, and may harm, people whose levels are normal, because the body cannot easily excrete excess iron.' },
      { question: 'Is iron infusion safe?', answer: 'For appropriately selected patients in a properly equipped clinic, it is generally safe, but it carries a real risk of serious allergic reactions and other effects like a temporary drop in blood phosphate. That is why it must be supervised in a setting prepared to treat a reaction.' },
      { question: 'Why not just take iron pills?', answer: 'Oral iron works for many people and is the first choice when it is tolerated and absorbed. Infusion is reserved for those who cannot tolerate pills, do not absorb them, have ongoing blood loss, or need faster correction than oral iron allows.' },
      { question: 'How soon will I feel better?', answer: 'Improvement is gradual. Hemoglobin and symptoms such as fatigue or breathlessness typically improve over several weeks as your body uses the iron to build new red blood cells, not immediately after the infusion.' },
    ],
  },

  'Vitamin D': {
    description: `Vitamin D injection delivers cholecalciferol (vitamin D3) into the muscle to correct a diagnosed deficiency. Because vitamin D is fat-soluble, it is given intramuscularly rather than by IV — it is not a water-based drip ingredient. The injection is most useful for people with a confirmed low blood level, malabsorption conditions such as celiac disease or a history of bariatric surgery, or significant lack of sun exposure, where reliably raising vitamin D through diet and sunlight alone is difficult.

Vitamin D plays a central role in calcium absorption, bone health, and immune and muscle function, and deficiency is common — especially in northern climates, in people with darker skin, and in those who spend little time outdoors. For many people with mild deficiency, daily oral vitamin D works perfectly well and is inexpensive. The injectable form is mainly valuable when absorption is impaired or when adherence to daily pills is a genuine problem, allowing a clinician to deliver a larger dose at once.

The key principle is that vitamin D should be dosed against a blood level, not given blindly. It is genuinely useful for correcting deficiency, but more is not better — and the right approach is to test, treat, and re-test rather than assume everyone needs a shot.`,
    howItWorks: `Cholecalciferol is injected into a large muscle, from which it is absorbed and stored in body fat, then gradually converted by the liver and kidneys into the active hormone that drives calcium absorption and supports bone, immune, and muscle function. Because the body stores it, a single injection can raise blood levels over weeks. A clinician uses your baseline blood level to choose a dose and schedule, then rechecks to confirm you have reached — but not overshot — the target range.`,
    benefits: [
      'Corrects diagnosed vitamin D deficiency, supporting bone and muscle health',
      'Useful when malabsorption (celiac, bariatric surgery) limits oral absorption',
      'Helpful for people who cannot maintain a daily oral supplement routine',
      'Supports calcium absorption and normal immune function',
      'A single dose can raise levels over weeks because vitamin D is stored',
    ],
    whatToExpect: `This is a quick intramuscular injection, not an infusion — usually just a few minutes in the office. Ideally a recent vitamin D blood level guides the dose. You may feel brief soreness at the injection site afterward. Because levels rise gradually and vitamin D is stored, your clinician will often recommend a follow-up blood test to confirm you have reached the right range before repeating.`,
    costRange: '$25 to $75',
    costContext: `A single injection is inexpensive, with price driven mainly by the clinic and whether a consultation or lab work is bundled in. The blood test to guide dosing is a separate cost but is what makes the injection appropriate and safe.`,
    primaryIngredients: ['Cholecalciferol (vitamin D3)'],
    sessionDuration: '5-10 minutes',
    alternateName: 'Vitamin D Injection',
    relevantSpecialty: 'Preventive Medicine',
    whoItsFor: `Good candidates are people with a confirmed low vitamin D level, those with malabsorption conditions, and people who struggle to keep up with daily oral supplements. It is less necessary for healthy people with normal levels, who can usually maintain them with modest sun exposure, diet, or inexpensive oral vitamin D. Anyone considering it should ideally have a blood level checked first rather than supplementing blindly.`,
    safety: `Vitamin D injections are generally well tolerated, with the most common side effect being temporary soreness at the injection site. The main risk is over-correction: too much vitamin D can raise blood calcium (hypercalcemia), causing nausea, weakness, excessive thirst, and, over time, kidney problems — which is why dosing should be guided by a blood level rather than given indiscriminately. People with high calcium, kidney disease, certain granulomatous conditions (such as sarcoidosis), or who are pregnant should consult a clinician before treatment.`,
    faqs: [
      { question: 'Why is vitamin D injected instead of given by IV?', answer: 'Vitamin D is fat-soluble, so it is delivered as an intramuscular injection rather than mixed into a water-based IV drip. The muscle acts as a slow-release depot, and the body stores the vitamin in fat.' },
      { question: 'Do I need a blood test before getting one?', answer: 'Ideally yes. Vitamin D should be dosed against a measured blood level so you correct a real deficiency without overshooting. Testing, treating, and re-testing is safer than blind supplementation.' },
      { question: 'Is an injection better than taking pills?', answer: 'Not for most people. Daily oral vitamin D works well and costs little. The injection is mainly useful for malabsorption or when keeping up with daily pills is genuinely difficult.' },
      { question: 'Can you get too much vitamin D?', answer: 'Yes. Over-correction can raise blood calcium and, over time, harm the kidneys. This is why dosing should be lab-guided and monitored rather than repeated automatically.' },
      { question: 'How long does one injection last?', answer: 'Because vitamin D is stored in body fat, a single dose can raise levels for weeks. Your clinician may recommend a follow-up test to decide whether and when another dose is needed.' },
    ],
  },

  'B12 Shot': {
    description: `A B12 shot delivers vitamin B12 directly into the muscle, bypassing the digestive system. B12 is essential for red blood cell production, nerve function, and DNA synthesis, and a true deficiency can cause fatigue, numbness or tingling, memory problems, and a specific type of anemia. The injection is the standard, evidence-based treatment for people who are genuinely deficient — including those with pernicious anemia (an autoimmune condition that blocks B12 absorption), strict vegans and vegetarians who get little from diet, older adults whose stomach acid declines with age, and people on long-term acid-reducing or diabetes medications that impair absorption.

Available forms include methylcobalamin, hydroxocobalamin, and cyanocobalamin; all can correct deficiency, and hydroxocobalamin tends to last longer between doses. For someone who is deficient, B12 injections are clearly beneficial and can resolve symptoms that oral supplements may not, particularly when absorption is the problem.

B12 is also widely marketed as an energy and metabolism booster for people who are not deficient — and here the honest picture is different. If your B12 level is already normal, there is little evidence that extra B12 boosts energy, aids weight loss, or improves metabolism. Any lift some people feel is often modest and may reflect expectation. The clear, well-supported benefit is correcting an actual deficiency.`,
    howItWorks: `B12 is injected into a muscle, from which it is absorbed steadily into the bloodstream, sidestepping the gut entirely — which matters for people who cannot absorb B12 from food or pills. Once circulating, it serves as a cofactor for the enzymes that build red blood cells, maintain the protective sheath around nerves, and synthesize DNA. In a deficient person, repleting B12 can reverse anemia and improve neurological symptoms over weeks; in someone with normal levels, the excess is simply excreted.`,
    benefits: [
      'Standard, effective treatment for diagnosed B12 deficiency and pernicious anemia',
      'Bypasses the gut for people who cannot absorb oral B12',
      'Useful for vegans, vegetarians, and older adults at higher deficiency risk',
      'Can relieve deficiency-related fatigue, tingling, and brain fog over weeks',
      'Quick, inexpensive, in-office injection',
    ],
    whatToExpect: `This is a fast intramuscular injection — typically a couple of minutes in the office, not an infusion. You may feel brief stinging at the injection site and mild soreness afterward. People being treated for a confirmed deficiency usually follow a schedule of repeated injections that a clinician sets based on their condition and follow-up bloodwork; one-off "energy" shots are common but offer little if your level is already normal.`,
    costRange: '$20 to $60',
    costContext: `A single shot is inexpensive, and many clinics offer multi-shot packages or memberships that lower the per-injection price. When B12 injections treat a documented deficiency, they may be covered by insurance; "energy boost" shots for people with normal levels are typically cash-pay.`,
    primaryIngredients: ['Methylcobalamin', 'Hydroxocobalamin', 'Cyanocobalamin'],
    sessionDuration: '5-10 minutes',
    alternateName: 'Vitamin B12 Injection',
    relevantSpecialty: 'Preventive Medicine',
    whoItsFor: `B12 shots are clearly worthwhile for people with a confirmed deficiency or a condition that impairs absorption — pernicious anemia, strict plant-based diets, age-related low stomach acid, certain GI conditions or surgeries, or long-term use of acid-reducing or metformin medications. They are far less compelling for healthy people with normal levels who are simply seeking an energy lift, where the benefit is likely minimal. Persistent fatigue deserves a medical workup rather than assuming low B12.`,
    safety: `B12 injections are among the safest treatments available, since the body excretes what it does not use. Side effects are usually limited to mild injection-site pain or redness, and rarely a temporary headache or nausea. True allergic reactions are uncommon but possible. People with certain conditions — for example a rare hereditary eye disorder (Leber's optic neuropathy) or known cobalt/B12 allergy — should consult a clinician first, and anyone with unexplained symptoms should be evaluated rather than self-treating, since masking a deficiency can delay diagnosis of its underlying cause.`,
    faqs: [
      { question: 'Will a B12 shot give me more energy if my levels are normal?', answer: 'Probably not in any meaningful way. The clear benefit of B12 is correcting a deficiency. If your level is already normal, there is little evidence that extra B12 increases energy, and any lift may reflect expectation.' },
      { question: 'Who actually needs B12 injections?', answer: 'People with confirmed deficiency or impaired absorption — such as pernicious anemia, strict vegan diets, older adults, or those on long-term acid-reducing or diabetes medications. For them, injections are standard, effective care.' },
      { question: 'Is the injection better than a pill?', answer: 'For people who absorb B12 normally, high-dose oral B12 often works fine and costs less. The injection mainly helps when absorption is the problem, because it bypasses the gut entirely.' },
      { question: 'Is it safe?', answer: 'Very. B12 has an excellent safety record and the body excretes any excess, so side effects are usually limited to mild injection-site discomfort. Allergic reactions are rare but possible.' },
      { question: 'How often would I get one?', answer: 'It depends on why you need it. People treating a deficiency follow a clinician-set schedule guided by bloodwork; occasional wellness shots have no fixed schedule and limited benefit if you are not deficient.' },
    ],
  },

  'Glutathione': {
    description: `Glutathione is the body's master antioxidant — a molecule produced naturally in the liver that neutralizes free radicals, supports detoxification pathways, and helps regenerate other antioxidants. Because oral glutathione is largely broken down in the digestive tract, clinics deliver it as an IV push or an intramuscular injection to raise circulating levels directly. It is offered both as a standalone treatment and as a popular add-on to other drips for general antioxidant and "detox" support.

Glutathione is also heavily marketed for skin brightening or lightening, and this is where honesty matters most. The evidence that injectable glutathione reliably lightens or evens skin tone is weak and inconsistent, with no robust human trials, and it is not FDA-approved for that purpose. In fact, the FDA has specifically warned about injectable skin-whitening products, citing safety concerns and unproven claims. Any cosmetic effect tends to be subtle and temporary, and it should not be relied on as a skin-lightening treatment.

For antioxidant support, glutathione is generally well tolerated under supervision, but it is not a proven therapy for any disease. It is best viewed as a wellness add-on with realistic, modest expectations rather than a treatment that delivers dramatic results.`,
    howItWorks: `Glutathione is given as a slow IV push or an intramuscular injection so it reaches the bloodstream intact, since oral forms are mostly degraded before absorption. Once circulating, it is taken up by cells, where it neutralizes oxidative stress, supports liver detoxification enzymes, and helps recycle other antioxidants such as vitamins C and E. Its proposed effect on skin tone comes from inhibiting tyrosinase, the enzyme involved in melanin production — but this effect is not reliably demonstrated in people.`,
    benefits: [
      'Delivers the master antioxidant directly, bypassing poor oral absorption',
      "Supports the body's natural detoxification and antioxidant defenses",
      'Helps regenerate other antioxidants such as vitamins C and E',
      'Popular, generally well-tolerated add-on to other IV drips',
      'May offer subtle, temporary skin radiance for some — though this is unproven',
    ],
    whatToExpect: `A standalone glutathione push is quick — often around 15 to 30 minutes — while as an add-on it is given at the end of another infusion. You may notice a cooling or faintly metallic sensation as it goes in. Cosmetic claims aside, do not expect dramatic or reliable skin changes; any radiance some people report tends to be subtle and short-lived, and clinics often suggest a series, which raises both cost and cumulative risk.`,
    costRange: '$50 to $150',
    costContext: `As a standalone push, glutathione typically runs $50 to $150 depending on dose, while as an add-on to another drip it usually costs $25 to $75. High-dose protocols marketed for skin brightening sit at the upper end and are often sold as multi-session packages.`,
    primaryIngredients: ['Reduced L-glutathione'],
    sessionDuration: '15-30 minutes (or as an add-on)',
    alternateName: 'Glutathione Push',
    relevantSpecialty: 'Aesthetic Medicine',
    whoItsFor: `Glutathione may appeal to healthy adults wanting antioxidant or "detox" support as an optional add-on, who understand the wellness evidence is still emerging and the effects modest. It is a poor fit for anyone expecting reliable skin lightening, since that use is unproven and not FDA-approved. People who are pregnant or breastfeeding, or who have liver, kidney, or asthma conditions, should be especially cautious and consult a physician first.`,
    safety: `Mild effects can include a cooling or metallic sensation, bruising at the IV site, and occasionally lightheadedness. More importantly, injectable glutathione has been linked in case reports to rare but serious events — including liver and kidney injury and severe skin reactions such as Stevens-Johnson syndrome — and there is no standardized dosing, so risk is hard to predict. The FDA has warned specifically about injectable skin-whitening products. A licensed clinician should screen every client, and people who are pregnant, breastfeeding, or have liver, kidney, or asthma conditions should consult a physician before treatment.`,
    faqs: [
      { question: 'Does glutathione actually lighten skin?', answer: 'The evidence is weak and inconsistent, with no robust human trials, and it is not FDA-approved for skin lightening. Any effect tends to be subtle and temporary, so it should not be relied on for that purpose.' },
      { question: 'Is injectable glutathione safe?', answer: 'It is generally well tolerated under supervision, but case reports link it to rare but serious events including liver and kidney injury and severe skin reactions. There is no standardized dosing, and the FDA has warned about injectable skin-whitening products.' },
      { question: 'Why is it given by IV or injection instead of a pill?', answer: 'Oral glutathione is largely broken down in the gut before it can be absorbed, so clinics use IV or intramuscular delivery to raise blood levels. Oral and topical forms carry lower risk but milder effects.' },
      { question: 'What does it actually do?', answer: "Glutathione is the body's main intracellular antioxidant and supports detoxification and recycling of other antioxidants. Beyond that, it is not a proven treatment for any disease, and wellness benefits remain an emerging area." },
      { question: 'Can I just take it as a supplement?', answer: 'Oral glutathione absorbs poorly, which is part of why clinics inject it, though oral and topical options carry far lower risk. Ask a clinician whether the injectable form adds meaningful value for your goals.' },
    ],
  },

  'Cold & Flu': {
    description: `A Cold & Flu IV — sometimes called a "sick day drip" — is aimed at easing symptoms while you are actively ill, not at curing the illness itself. When a virus has you dehydrated, nauseated, achy, and depleted, the drip combines a litre of IV fluids with anti-nausea and anti-inflammatory medication options plus supportive vitamins to help you feel more comfortable and rehydrate quickly. It is the reactive counterpart to a prevention-focused immune drip: this one is for when you are already sick.

A typical formulation includes IV fluids for rehydration, vitamin C and zinc for general support, B-complex vitamins, and optional medications such as ondansetron for nausea or ketorolac for aches and fever-related discomfort. For someone who cannot keep fluids or food down, rapid rehydration and anti-nausea relief can make a genuinely miserable day more bearable.

It is important to be clear: this drip does not cure or shorten a viral cold or flu. Viruses run their course regardless, and no IV changes that. What the drip can do is relieve dehydration and specific symptoms while your immune system does its work — and it is no substitute for medical care when an illness is severe.`,
    howItWorks: `Over roughly 30 to 45 minutes, a litre of IV fluids restores hydration lost to fever, sweating, vomiting, or poor intake, while optional anti-nausea and anti-inflammatory medications target the most distressing symptoms directly. Vitamin C, zinc, and B vitamins provide general nutritional support. Because the fluids and medications enter the bloodstream directly, relief from dehydration and nausea is often faster than oral remedies — but the underlying virus still has to run its course.`,
    benefits: [
      'Rapid rehydration when fever, vomiting, or poor intake leave you depleted',
      'Optional anti-nausea medication for an upset, uncooperative stomach',
      'Optional anti-inflammatory for aches and fever-related discomfort',
      'Supportive vitamins and zinc while you recover',
      'Faster symptom relief than oral remedies when you cannot keep things down',
    ],
    whatToExpect: `A 30 to 45 minute session in a clinic chair or, commonly for this category, at home so you do not have to leave bed. You may feel better — less nauseated, clearer-headed, less thirsty — by the time the bag finishes, largely from rehydration and any anti-nausea add-on. Remember it eases symptoms rather than ending the illness, and worsening symptoms warrant a doctor.`,
    costRange: '$150 to $300',
    costContext: `Base sick-day drips run $150 to $225, with anti-nausea medication, IV anti-inflammatory, or higher-dose vitamin C typically adding $25 to $50 per add-on. Mobile (in-home) service, popular when you are too sick to travel, usually carries a $50 to $100 premium.`,
    primaryIngredients: ['1L IV fluids', 'Vitamin C', 'Zinc', 'B-complex vitamins', 'Optional: ondansetron, ketorolac'],
    sessionDuration: '30-45 minutes',
    alternateName: 'Sick Day Drip',
    relevantSpecialty: 'Emergency Medicine',
    whoItsFor: `This drip suits adults who are actively sick with a cold or flu and feeling dehydrated, nauseated, or run-down — especially those who struggle to keep fluids down and want faster symptom relief. It is not appropriate as a cure, nor as a replacement for medical evaluation when illness is severe. Anyone with a high or persistent fever, trouble breathing, chest pain, confusion, or symptoms that keep worsening needs a doctor or emergency care, not a drip.`,
    safety: `Side effects are usually mild — bruising or discomfort at the IV site, lightheadedness, or minor reactions to add-on medications. The most important caution is that an IV can mask the warning signs of a serious infection: high fever, shortness of breath, chest pain, severe dehydration, or worsening illness needs medical care, not a wellness drip. People with kidney disease, heart failure, high blood pressure, or who are pregnant should be cleared first, and a licensed clinician should screen you and check any add-ons for allergies and interactions.`,
    faqs: [
      { question: 'Will a Cold & Flu IV cure my cold or shorten the flu?', answer: 'No. It does not cure or shorten a viral illness — viruses run their course regardless. The drip eases symptoms like dehydration and nausea while your immune system does the work.' },
      { question: 'How is this different from an immune support drip?', answer: 'An immune support drip is generally used preventively or at the very first sign of illness, while a Cold & Flu drip is for when you are already actively sick and want symptom and hydration relief.' },
      { question: 'When should I see a doctor instead of getting a drip?', answer: 'Seek medical care for a high or persistent fever, trouble breathing, chest pain, confusion, severe dehydration, or symptoms that keep worsening. A drip can mask these warning signs, so do not use it in place of evaluation.' },
      { question: 'What actually makes me feel better during it?', answer: 'Most of the relief comes from rapid rehydration plus any anti-nausea or anti-inflammatory medication. The vitamins provide general support, but they are not what cures the infection.' },
      { question: 'Is it safe while I am sick?', answer: 'For most healthy adults under medical supervision, yes, with mild side effects. People with kidney, heart, or blood-pressure conditions or who are pregnant should be screened first, and severe illness needs a doctor.' },
    ],
  },

  'Migraine Relief': {
    description: `A Migraine Relief IV — often called a "migraine cocktail" — is designed to abort or ease an active migraine or severe headache when oral medications are not working or cannot be kept down. Notably, this drip has more clinical grounding than most wellness infusions: emergency departments have used intravenous "migraine cocktails" for years, and components like IV magnesium and antiemetic (anti-nausea) medications have meaningful evidence for treating acute migraine. That makes it one of the more evidence-based offerings on a clinic menu — when delivered appropriately.

A typical formulation combines IV magnesium, an anti-nausea medication such as ondansetron, an anti-inflammatory such as ketorolac (Toradol), B-complex vitamins, and fluids for hydration. Clinical migraine cocktails in medical settings may also use antiemetics like metoclopramide or prochlorperazine, which have a strong track record for acute migraine. Together these target the pain, nausea, and dehydration that define a bad attack.

Because several of these are prescription medications, this is a clinical treatment that requires a clinician's involvement, not a routine vitamin drip. It is intended for known migraine or recurrent severe headache — and crucially, not for a brand-new, sudden, or "worst-ever" headache, which can signal a medical emergency.`,
    howItWorks: `Over roughly 30 to 60 minutes, the IV delivers magnesium (which has evidence for calming migraine, particularly in some patients), an antiemetic to control the nausea and vomiting that accompany attacks, an anti-inflammatory such as ketorolac to reduce pain, and fluids to correct the dehydration that often worsens headache. Delivering these directly into the bloodstream works when an upset stomach makes oral medication ineffective, and many people experience relief during or shortly after the infusion.`,
    benefits: [
      'Targets an active migraine when oral medication fails or cannot be kept down',
      'IV magnesium and antiemetics have real clinical evidence for acute migraine',
      'Anti-inflammatory (such as ketorolac) addresses headache pain directly',
      'Controls the nausea and vomiting that accompany severe attacks',
      'Rehydration helps relieve a contributing factor to headache',
    ],
    whatToExpect: `Expect a clinical session of about 30 to 60 minutes, ideally in a calm, dim environment since light and sound worsen migraine. After a clinician reviews your history and confirms this is a familiar migraine pattern, the medications and fluids are infused while you rest. Many people feel meaningful relief during or shortly after the drip. Because prescription drugs are involved, a clinician must be part of the process.`,
    costRange: '$150 to $350',
    costContext: `Base migraine drips run $150 to $250, with additional prescription medications, higher magnesium doses, or anti-nausea add-ons bringing the total toward $300 to $350. Because the formulation includes prescription drugs requiring clinician oversight, pricing is typically higher than a plain vitamin drip.`,
    primaryIngredients: ['IV magnesium', 'Ondansetron', 'Ketorolac (Toradol)', 'B-complex vitamins', 'IV fluids'],
    sessionDuration: '30-60 minutes',
    alternateName: 'Migraine Drip',
    relevantSpecialty: 'Neurology',
    whoItsFor: `This drip is for people with diagnosed migraine or recurrent severe headaches experiencing an active attack, particularly when oral medication has failed or nausea makes pills impossible. It is not for someone experiencing a first-ever, sudden, or unusually severe "worst headache of my life," which requires emergency evaluation, not a wellness drip. People who are pregnant, have kidney or heart conditions, stomach ulcers, or take blood thinners or other migraine medications must be screened first, since several components are prescription drugs with interactions.`,
    safety: `Because this drip contains prescription medications, a clinician must screen you for allergies, interactions, and contraindications first. Common side effects include a warm flush or lowered blood pressure from magnesium, drowsiness, and IV-site discomfort; ketorolac is an anti-inflammatory that must be avoided with stomach ulcers, kidney disease, bleeding risk, or blood thinners, and some antiemetics can cause restlessness or, rarely, muscle reactions. Most importantly, a new, sudden, or "worst-ever" headache, or a headache with fever, stiff neck, weakness, confusion, or vision changes, is a potential medical emergency and needs urgent evaluation rather than an IV.`,
    faqs: [
      { question: 'Does a migraine IV really work?', answer: 'It has more clinical support than most wellness drips — IV magnesium and antiemetic medications have genuine evidence for acute migraine, and ER "migraine cocktails" use similar ingredients. Many people get meaningful relief, though results vary by person.' },
      { question: 'Is this safe to use for any bad headache?', answer: 'No. A new, sudden, or "worst-ever" headache, or one with fever, stiff neck, weakness, confusion, or vision changes, can be a medical emergency and needs urgent evaluation — not a drip. This treatment is for known migraine or recurrent severe headache.' },
      { question: 'Why is a clinician required?', answer: 'The formulation includes prescription medications such as anti-inflammatories and antiemetics, which carry real contraindications and interactions. A clinician must screen your history and confirm the drip is appropriate and safe for you.' },
      { question: 'How fast does it relieve a migraine?', answer: 'Many people feel relief during or shortly after the 30 to 60 minute infusion, helped by delivering medication and fluids directly into the bloodstream when nausea makes pills ineffective. Response still varies between individuals.' },
      { question: 'Who should not get one?', answer: 'People with stomach ulcers, kidney disease, bleeding risk, or on blood thinners may not be able to receive the anti-inflammatory component, and those who are pregnant or have heart conditions need careful screening. Always disclose your medications and history first.' },
    ],
  },

  'GLP-1 Weight Loss': {
    description: `GLP-1 weight loss therapy uses physician-prescribed medications — semaglutide (Ozempic, Wegovy) and tirzepatide (Mounjaro, Zepbound) — given as a once-weekly subcutaneous injection, not an IV drip. These are the most rigorously studied and effective medical weight-loss treatments available, with large clinical trials showing substantial, sustained weight loss when combined with diet and lifestyle changes. They work by mimicking gut hormones that regulate appetite and blood sugar, reducing hunger and helping people eat less.

This is genuine prescription medicine, not a wellness add-on. It requires a medical evaluation, an appropriate clinical reason to treat, dose titration over weeks, and ongoing monitoring by a prescriber. It is also distinct from the MIC/lipotropic "Weight Loss" IV offered at many clinics: GLP-1s are FDA-approved drugs with strong evidence, while lipotropic IVs are nutrient-based and not FDA-approved for weight loss. The two should not be confused.

A real-world caution concerns compounded versions. After the GLP-1 shortages were declared resolved in 2024–2025, routine compounding of semaglutide and tirzepatide became restricted, and some compounded or gray-market products carry quality, purity, and dosing concerns. Anyone pursuing GLP-1 therapy should verify the source and work with a legitimate prescriber and a licensed pharmacy.`,
    howItWorks: `GLP-1 medications mimic glucagon-like peptide-1, a hormone the gut releases after eating. They act on appetite centers in the brain to increase fullness and reduce hunger, slow stomach emptying so you feel satisfied longer, and improve the body's blood-sugar handling (tirzepatide also acts on a second receptor, GIP). Delivered as a small weekly self-injection under the skin, the dose is typically started low and increased gradually to limit side effects while the medication takes effect over weeks to months.`,
    benefits: [
      'FDA-approved with strong trial evidence for substantial, sustained weight loss',
      'Reduces appetite and hunger by mimicking natural gut hormones',
      'Once-weekly self-injection rather than a daily routine',
      'Also improves blood-sugar control (originally developed for type 2 diabetes)',
      'Prescribed and monitored by a clinician, with dosing tailored to you',
    ],
    whatToExpect: `This is a program, not a one-time drip. It begins with a medical evaluation and often bloodwork, after which a prescriber starts you on a low dose that is gradually increased over weeks. You self-administer a small subcutaneous injection once a week at home, with periodic follow-up visits to monitor side effects, progress, and dosing. GI side effects like nausea are common, especially early on, and the medication works alongside diet and lifestyle changes over months.`,
    costRange: '$200 to $500 per month',
    costContext: `Monthly cost varies widely depending on whether you use a brand-name drug (through insurance or manufacturer self-pay programs) or a compounded version, and on your dose. Insurance coverage is inconsistent and often depends on diagnosis. Compounded products may be cheaper but carry quality and regulatory concerns, so source matters as much as price.`,
    primaryIngredients: ['Semaglutide (Ozempic / Wegovy)', 'Tirzepatide (Mounjaro / Zepbound)'],
    sessionDuration: 'Weekly self-injection + ongoing monitoring',
    alternateName: 'Semaglutide & Tirzepatide',
    relevantSpecialty: 'Endocrinology',
    whoItsFor: `GLP-1 therapy is for adults who meet medical criteria for weight management and are evaluated and monitored by a prescriber — typically those with obesity or overweight plus a related condition, who can commit to ongoing treatment and lifestyle change. It is not appropriate for people who are pregnant or trying to conceive, those with a personal or family history of medullary thyroid carcinoma or MEN2 syndrome, a history of pancreatitis, or anyone seeking a quick fix without medical oversight. It should not be confused with nutrient-based weight-loss IVs.`,
    safety: `These are prescription medications that require medical evaluation and ongoing monitoring. The most common side effects are gastrointestinal — nausea, vomiting, diarrhea, and constipation — usually worst when starting or increasing the dose. More serious considerations include pancreatitis, gallbladder problems, and a boxed warning about thyroid C-cell tumors seen in animal studies; they should not be used by anyone with a personal or family history of medullary thyroid carcinoma or MEN2, and they are not for use in pregnancy. Compounded versions carry additional quality and dosing concerns, so verify the source and use only a legitimate prescriber and licensed pharmacy.`,
    faqs: [
      { question: 'Is GLP-1 therapy an IV drip?', answer: 'No. Semaglutide and tirzepatide are given as a small once-weekly injection under the skin, which you self-administer at home — not as an IV infusion. They are also different from nutrient-based weight-loss IVs.' },
      { question: 'How is this different from a weight-loss IV?', answer: 'GLP-1s are FDA-approved medications with strong trial evidence for weight loss, while MIC/lipotropic weight-loss IVs are nutrient-based and not FDA-approved for that purpose. The two work by entirely different mechanisms.' },
      { question: 'What are the main side effects?', answer: 'Gastrointestinal effects like nausea, vomiting, diarrhea, and constipation are most common, especially when starting. Serious but less common concerns include pancreatitis, gallbladder problems, and a thyroid-tumor warning based on animal studies.' },
      { question: 'Who should not take GLP-1 medications?', answer: 'They should be avoided by people who are pregnant or trying to conceive, anyone with a personal or family history of medullary thyroid carcinoma or MEN2 syndrome, and those with a history of pancreatitis. A clinician evaluation determines whether they are appropriate.' },
      { question: 'Are compounded versions safe?', answer: 'They carry added concerns. After the shortages ended, routine compounding became restricted, and some compounded or gray-market products have quality, purity, and dosing issues. Verify the source and use only a legitimate prescriber and a licensed pharmacy.' },
    ],
  },

  'Hormone Therapy': {
    description: `Hormone therapy (TRT or HRT) is a clinician-prescribed treatment that replaces hormones the body is no longer producing in adequate amounts — testosterone for men with diagnosed low levels (andropause or hypogonadism), and estrogen and progesterone for women managing menopause, among other indications. It is delivered as intramuscular injections, implanted pellets, or topical creams and gels — not as an IV drip. When used appropriately for a genuine deficiency, it can meaningfully improve symptoms; when used casually, it carries real risks.

A typical regimen depends on the person and goal: testosterone cypionate or enanthate for testosterone replacement, estradiol and progesterone for menopausal hormone therapy, and sometimes adjuncts such as anastrozole or hCG in specific situations. This is lab-driven, individualized medicine — the right hormone, dose, and route depend on bloodwork, symptoms, and a person's overall health profile.

What hormone therapy is not is a quick wellness drip or an anti-aging shortcut. It requires a proper diagnosis, baseline and follow-up bloodwork, a prescriber, and ongoing monitoring for known risks. Used responsibly within that framework, it is a legitimate medical therapy; used without it, it can do harm.`,
    howItWorks: `Replacement hormones are delivered through the route best suited to the person — an intramuscular injection every one to two weeks, a pellet implanted under the skin that releases hormone over months, or a daily cream or gel — to restore blood levels into a target range. The clinician uses baseline labs to choose the starting dose, then rechecks hormone levels and related markers and adjusts over time. The aim is to relieve deficiency symptoms while keeping levels and safety markers within a monitored range.`,
    benefits: [
      'Replaces a diagnosed hormone deficiency to relieve related symptoms',
      'Can improve energy, mood, libido, and other deficiency symptoms when appropriate',
      'Menopausal HRT can ease hot flashes, sleep, and other menopause symptoms',
      'Multiple delivery options — injection, pellet, or topical — tailored to you',
      'Lab-driven and individualized rather than one-size-fits-all',
    ],
    whatToExpect: `This is an ongoing medical program, not a single visit or drip. It starts with a consultation, symptom review, and baseline bloodwork, after which a prescriber designs a regimen. Injections are quick in-office or at-home administrations on a set schedule; pellets are placed during a brief office procedure every few months; creams are applied daily at home. Expect periodic follow-up labs and visits to monitor levels and safety markers and to adjust your dose over time.`,
    costRange: '$100 to $400 per month',
    costContext: `Monthly cost depends on the hormone, the delivery method (injections are generally cheaper; pellets carry a higher per-procedure cost), and the required lab monitoring. Consultations and follow-up bloodwork add to the total. Insurance may cover therapy for a documented medical deficiency, while purely elective optimization is often cash-pay.`,
    primaryIngredients: ['Testosterone cypionate / enanthate', 'Estradiol', 'Progesterone', 'Sometimes anastrozole or hCG'],
    sessionDuration: 'Ongoing program with periodic dosing',
    alternateName: 'TRT / HRT',
    relevantSpecialty: 'Endocrinology',
    whoItsFor: `Hormone therapy is for people with a hormone deficiency confirmed by symptoms and bloodwork — men with diagnosed low testosterone, or women managing menopausal symptoms — who are evaluated and monitored by a prescriber. It is not appropriate as a casual anti-aging or performance shortcut, and certain people must avoid or carefully weigh it: those with hormone-sensitive cancers (such as prostate or certain breast cancers), uncontrolled cardiovascular disease, untreated sleep apnea, or who are pregnant. Men wishing to preserve fertility need a specific discussion, since testosterone can suppress sperm production.`,
    safety: `This is a prescription, lab-driven therapy that requires diagnosis, baseline and follow-up bloodwork, and ongoing monitoring. Testosterone therapy needs monitoring of hematocrit (it can thicken the blood), prostate health, and cardiovascular risk factors, and it can reduce fertility. Menopausal hormone therapy carries its own risk profile, including considerations around blood clots and, depending on the regimen, breast and cardiovascular risk, which is why it must be individualized. People with hormone-sensitive cancers, significant cardiovascular disease, untreated sleep apnea, or who are pregnant should not start without careful specialist evaluation. A qualified prescriber must oversee the entire course.`,
    faqs: [
      { question: 'Is hormone therapy an IV drip?', answer: 'No. It is delivered as intramuscular injections, implanted pellets, or topical creams and gels, not by IV. It is also an ongoing program with monitoring rather than a one-time treatment.' },
      { question: 'Do I need bloodwork before starting?', answer: 'Yes. Hormone therapy is lab-driven: a diagnosis and baseline bloodwork should confirm a genuine deficiency before treatment, and follow-up labs are used to adjust the dose and monitor safety.' },
      { question: 'What needs to be monitored during treatment?', answer: 'For testosterone, clinicians monitor hematocrit, prostate health, and cardiovascular risk factors, among others; menopausal HRT has its own monitoring around clot, breast, and cardiovascular risk. Ongoing follow-up is part of doing it safely.' },
      { question: 'Who should not use hormone therapy?', answer: 'People with hormone-sensitive cancers, uncontrolled cardiovascular disease, untreated sleep apnea, or who are pregnant should avoid it or proceed only after careful specialist evaluation. It is not a casual anti-aging shortcut.' },
      { question: 'Will testosterone therapy affect fertility?', answer: "It can. Testosterone replacement often suppresses the body's own sperm production, so men who want to preserve fertility need a specific discussion with their prescriber about alternatives or adjuncts." },
    ],
  },

  'High-Dose Vitamin C': {
    description: `High-dose vitamin C (IVC) delivers concentrations of ascorbic acid far beyond what the gut can absorb from pills, given by IV for antioxidant and immune support. Because intestinal absorption of oral vitamin C is capped, IV is the only way to reach the high plasma levels some protocols aim for. It is used as a wellness and immune-support infusion, and is sometimes sought by people with cancer as a complementary, supportive therapy alongside conventional treatment.

This is the area where honesty is non-negotiable. High-dose IV vitamin C is investigational — it is not a proven cancer treatment, and no one should make or believe any claim that it cures or treats cancer. Research into its role alongside conventional cancer care is ongoing and unsettled. If cancer is part of the conversation at all, it should be framed strictly as investigational and complementary, and discussed with your oncologist before considering it — never as a substitute for proven therapy.

There are also specific, mandatory safety steps. High doses can be dangerous for people with certain conditions, so screening — especially for G6PD deficiency — is required before treatment, not optional. Used within proper medical limits and screening, IVC is generally well tolerated; used carelessly, it can cause serious harm.`,
    howItWorks: `Over roughly 30 minutes to a couple of hours depending on dose, ascorbic acid is infused directly into the bloodstream, bypassing the gut's absorption ceiling to reach plasma levels impossible to achieve orally. At these concentrations vitamin C acts as a potent antioxidant and supports immune cell function; at very high pharmacologic levels it is also being studied for pro-oxidant effects in research settings. Kidney function and G6PD status determine whether high doses are safe, which is why screening precedes any infusion.`,
    benefits: [
      'Reaches plasma vitamin C levels impossible to achieve with oral doses',
      'Provides high-dose antioxidant and immune support',
      "Bypasses the gut's absorption ceiling for vitamin C",
      'Generally well tolerated when proper screening and dose limits are followed',
      'Studied as a complementary, supportive option — strictly alongside conventional care',
    ],
    whatToExpect: `Before a first high-dose infusion, expect required screening — including a G6PD test and a review of kidney health and stone history — without which the infusion should not proceed. The infusion itself runs from about 30 minutes for lower doses up to a couple of hours for very high doses, in a clinic chair. You may notice a warm or metallic sensation or mild lightheadedness. This is supportive wellness care, not a treatment for any disease.`,
    costRange: '$100 to $250',
    costContext: `Standard high-dose vitamin C sessions run $100 to $250, with very high-dose protocols and the required G6PD and kidney screening adding to the overall cost. Because this is not a proven medical treatment for disease, it is generally cash-pay and not covered by insurance.`,
    primaryIngredients: ['High-dose ascorbic acid (vitamin C)', 'Saline carrier'],
    sessionDuration: '30 minutes to 2 hours',
    alternateName: 'IV Vitamin C (IVC)',
    relevantSpecialty: 'Integrative Medicine',
    whoItsFor: `IVC may appeal to adults seeking high-dose antioxidant or immune support who have been screened and cleared by a clinician, and occasionally to people exploring complementary support during cancer care — only ever in coordination with their oncologist and never in place of proven treatment. It is not appropriate for anyone with G6PD deficiency, significant kidney disease, or a history of oxalate kidney stones, and not for anyone hoping it will treat or cure a serious illness on its own.`,
    safety: `High-dose IV vitamin C has mandatory safety requirements. G6PD deficiency screening is required before high doses, because giving it to someone with G6PD deficiency can trigger dangerous breakdown of red blood cells (hemolysis). It should also be avoided in people with significant kidney disease or a history of calcium-oxalate kidney stones, as high doses raise oxalate and stress the kidneys. On the regulatory side, IVC is investigational and not a proven cancer treatment — no cancer-cure claims should be made, and any cancer-related use must be discussed with an oncologist as complementary only. Milder effects include nausea, a warm or metallic sensation, and lightheadedness; a licensed clinician must screen kidney function and G6PD status first.`,
    faqs: [
      { question: 'Does high-dose vitamin C treat or cure cancer?', answer: 'No. It is investigational and not a proven cancer treatment, and no cancer-cure claims should be made. Any cancer-related use should be considered complementary only and discussed with your oncologist, never as a replacement for proven therapy.' },
      { question: 'Why is G6PD screening required?', answer: 'People with G6PD deficiency can experience dangerous red-blood-cell breakdown (hemolysis) from high-dose vitamin C. Screening for it before treatment is mandatory, not optional, which is why it precedes any infusion.' },
      { question: 'Who should not get high-dose IV vitamin C?', answer: 'People with G6PD deficiency, significant kidney disease, or a history of calcium-oxalate kidney stones should avoid it, since high doses raise oxalate and stress the kidneys. A clinician must confirm your kidney function and G6PD status first.' },
      { question: 'Why give vitamin C by IV instead of a pill?', answer: 'Oral absorption is capped by the gut, so blood levels plateau even at high doses. IV bypasses that limit to reach concentrations impossible to achieve orally, which is the entire rationale for high-dose IVC.' },
      { question: 'Is it safe?', answer: 'Within proper dose limits and after required screening, it is generally well tolerated, with mild effects like nausea or a warm sensation. Without G6PD and kidney screening, however, it can cause serious harm, so medical supervision is essential.' },
    ],
  },
};

export function getTreatmentContent(serviceName: string): TreatmentContent | undefined {
  return TREATMENT_CONTENT[serviceName];
}
