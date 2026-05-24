export interface CityIntro {
  localContext: string;
  pricing: string;
  popularTreatments: string[];
}

const intros: Record<string, CityIntro> = {
  'new-york': {
    localContext: `New York's long-hour finance, media, and legal sectors — combined with constant international travel through JFK, LaGuardia, and Newark — drive some of the most consistent IV therapy demand of any US city. Manhattan clinics see steady bookings for hangover recovery, jet-lag drips, and pre-meeting energy boosts, while the outer boroughs have developed their own thriving mobile and in-clinic markets.`,
    pricing: `NYC pricing runs on the higher end of the US market — typically $200 to $450 for premium Manhattan drips, with outer-borough and mobile-focused providers usually $50 to $100 lower.`,
    popularTreatments: ['Hangover Recovery', 'NAD+ Plus', 'Beauty Glow', 'Energy Boost'],
  },

  'las-vegas': {
    localContext: `Las Vegas has the highest per-capita demand for hangover and recovery IV therapy of any city in North America, driven by year-round tourism, bachelorette and bachelor parties, conventions, weddings, and concert weekends. The hotel-room mobile model dominates the Strip, with most providers offering near-24/7 in-room service.`,
    pricing: `Strip and resort drips typically run $250 to $500 with the mobile-service premium baked in; off-Strip clinics are usually $150 to $300 for the same protocols.`,
    popularTreatments: ['Hangover Recovery', 'Hydration', 'Jet Lag', 'Energy Boost'],
  },

  'san-francisco': {
    localContext: `San Francisco's biohacking, longevity, and tech wellness communities drive unusually high demand for NAD+ and high-dose protocols. SF clients are more likely than the national average to book regular maintenance drips — monthly Myers Cocktails or immune support — as part of broader healthspan routines rather than situational recovery.`,
    pricing: `Among the highest pricing in the US — $250 to $500 for premium drips, with NAD+ sessions ranging from $700 to over $1,200 depending on dose.`,
    popularTreatments: ['NAD+ Plus', 'Immune Support', 'Energy Boost', 'Recovery'],
  },

  'clearwater': {
    localContext: `Clearwater sits at the heart of Florida's wellness corridor, with a notable concentration of IV therapy clinics serving year-round tourism, the local retiree community, and an increasingly health-conscious permanent population. The Clearwater market skews more toward hydration and beauty-focused drips than the recovery-heavy mix in larger metros.`,
    pricing: `Mid-market by Florida standards — typically $150 to $325 for standard drips, slightly above the state average given the local clinic density and competition for premium clientele.`,
    popularTreatments: ['Hydration', 'Beauty Glow', 'Immune Support', 'Myers Cocktail'],
  },

  'toronto': {
    localContext: `Toronto and the broader GTA make up Canada's largest IV therapy market, with clinics serving the downtown business core, the surrounding GTA suburbs, and the steady flow of international travellers through Pearson. Mobile service across the GTA is mature and widely available.`,
    pricing: `Expect $175 to $350 CAD for standard drips at most Toronto-area clinics, with NAD+ protocols ranging from $400 to $1,000+; mobile (in-home or hotel) typically adds $50 to $100.`,
    popularTreatments: ['Hydration', 'Beauty Glow', 'Hangover Recovery', 'Myers Cocktail'],
  },

  'houston': {
    localContext: `Houston's IV therapy market spans the central business district and the sprawling metro including Spring, Cypress, Tomball, and The Woodlands. The local market sees heavy demand from the energy sector workforce, the Texas Medical Center community, and weekend recovery clients dealing with the city's hot, humid summers.`,
    pricing: `Standard drips at most Houston-area clinics run $150 to $300, with NAD+ protocols typically $500 to $900 depending on dose.`,
    popularTreatments: ['Hydration', 'Hangover Recovery', 'Myers Cocktail', 'Energy Boost'],
  },

  'washington': {
    localContext: `Washington DC's IV therapy market is shaped by its political and lobbying sectors — demand surges around inaugurations, major conferences, and high-profile event seasons. The market mixes upscale Georgetown and downtown clinics with practical Northern Virginia and Maryland mobile services that handle the suburban professional commute.`,
    pricing: `Mid-to-upper market — typically $175 to $400 for standard drips, with DC-proper clinics sitting at the higher end.`,
    popularTreatments: ['Hangover Recovery', 'Immune Support', 'NAD+ Plus', 'Myers Cocktail'],
  },

  'fresno': {
    localContext: `Fresno is a growing IV therapy market in California's Central Valley, serving the agricultural workforce, the local healthcare and university communities, and a population that's increasingly looking for wellness options outside the coastal city pricing. Mobile service has grown rapidly across Fresno County.`,
    pricing: `More affordable than coastal California — typically $125 to $275 for standard drips, with NAD+ protocols starting around $400.`,
    popularTreatments: ['Hydration', 'Hangover Recovery', 'Immune Support', 'Recovery'],
  },

  'san-jose': {
    localContext: `South Bay IV therapy demand mirrors Silicon Valley's broader wellness focus — biohacking, long work hours, frequent international travel for tech workers, and growing interest in longevity protocols. Both mobile and in-clinic options are well-represented across San Jose and the surrounding Santa Clara Valley.`,
    pricing: `Premium pricing similar to San Francisco — $200 to $450 for standard drips, with NAD+ sessions in the $700 to $1,200 range.`,
    popularTreatments: ['NAD+ Plus', 'Energy Boost', 'Immune Support', 'Recovery'],
  },

  'glendale': {
    localContext: `Glendale's IV therapy market serves both LA-adjacent commuters and the local Armenian-American community, with a notable concentration of beauty- and recovery-focused clinics. The Glendale offering overlaps heavily with greater LA pricing and protocols, while remaining more accessible than Beverly Hills or West Hollywood.`,
    pricing: `Mid-to-upper LA-area pricing — typically $175 to $400 for standard drips, with beauty and glow protocols at the higher end.`,
    popularTreatments: ['Beauty Glow', 'Hangover Recovery', 'Hydration', 'Energy Boost'],
  },
};

// Slug aliases — some cities are referenced by multiple slugs in the wild
intros['washington-dc'] = intros['washington'];

export function getCityIntro(slug: string): CityIntro | undefined {
  return intros[slug.toLowerCase()];
}
