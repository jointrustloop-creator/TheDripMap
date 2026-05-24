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
  },
};

export function getTreatmentContent(serviceName: string): TreatmentContent | undefined {
  return TREATMENT_CONTENT[serviceName];
}
