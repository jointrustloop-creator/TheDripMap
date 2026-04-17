import { Provider, SurveyState, OperatorProfile } from '../types';

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLng = (lng2-lng1) * Math.PI/180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180) * 
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(
    Math.sqrt(a), Math.sqrt(1-a));
}

export function matchProviders(
  answers: SurveyState, 
  providers: Provider[], 
  operatorProfiles: OperatorProfile[] = [],
  userLocation?: { latitude: number; longitude: number }
) {
  const matched = providers.map(p => {
    let score = 0;
    const profile = operatorProfiles.find(op => op.clinicId === p.id);
    
    // 0. Distance Match (High Priority)
    let distance: number | undefined;
    if (userLocation && p.latitude && p.longitude) {
      distance = getDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        p.latitude, 
        p.longitude
      );
      
      // Proximity Scoring (Step 2)
      if (distance < 5) score += 15;
      else if (distance < 10) score += 12;
      else if (distance < 20) score += 8;
      else if (distance < 50) score += 4;
    }

    // Mobile Service Bonus (Step 2)
    const isMobile = p.type === 'Mobile' || p.mobile_service === true || (profile?.profile_data?.mobileService === true);
    if (isMobile) {
      score += 15; // Mobile comes to them, distance irrelevant
    }

    // 1. City Match
    if (answers.city && p.city.toLowerCase() === answers.city.toLowerCase()) {
      score += 20;
    }

    // 2. Rank in City
    if (p.rank_in_city) {
      score += (10 - p.rank_in_city) * 2;
    }

    // 2.1 Rating Quality Score
    if (p.rating >= 4.8) score += 25;
    else if (p.rating >= 4.5) score += 20;
    else if (p.rating >= 4.0) score += 15;
    else if (p.rating >= 3.5) score += 10;

    // 2.2 Review Count Bonus
    if (p.reviewCount >= 100) score += 5;
    else if (p.reviewCount >= 50) score += 3;
    else if (p.reviewCount >= 10) score += 1;

    // 2.3 Featured and Verified Bonuses
    if (p.is_featured) score += 10;
    if (p.is_verified) score += 8;

    // 3. User Goal (Specialties & Keywords)
    if (answers.goal) {
      const goal = answers.goal.toLowerCase();
      const pSpecialties = (p.specialties || []).map(s => s.toLowerCase());
      const pSubtypes = (p.subtypes || []).map(s => s.toLowerCase());
      const pName = p.name.toLowerCase();
      const pDesc = (p.description || '').toLowerCase();

      // Define keyword mappings for goals
      const goalKeywords: Record<string, string[]> = {
        'hangover': ['hangover', 'hydration', 'recovery', 'rehydrate'],
        'nad-plus': ['nad', 'nicotinamide', 'anti-aging', 'energy'],
        'immune-support': ['immune', 'wellness', 'vitamin c', 'zinc', 'immunity', 'shield', 'defense', 'defender', 'glutathione'],
        'beauty-glow': ['beauty', 'glow', 'skin', 'hair', 'nails', 'collagen', 'glutathione', 'skin glow'],
        'weight-loss': ['weight', 'metabolism', 'fat', 'slim', 'semaglutide', 'tirzepatide', 'mic', 'lipo'],
        'hydration': ['hydration', 'rehydrate', 'fluids', 'saline'],
        'recovery': ['recovery', 'athletic', 'sport', 'muscle', 'performance'],
        'myers-cocktail': ['myers', 'cocktail', 'multivitamin']
      };

      const keywords = goalKeywords[goal] || [goal];
      
      // Check specialties, subtypes, name, and description for keywords
      const hasKeyword = keywords.some(kw => 
        pSpecialties.some(s => s.includes(kw)) || 
        pSubtypes.some(s => s.includes(kw)) ||
        pName.includes(kw) ||
        pDesc.includes(kw)
      );

      if (hasKeyword) {
        score += 30; // Significant boost for goal match
      }
      
      // Also check for exact goal match in specialties
      if (pSpecialties.some(s => s.includes(goal))) {
        score += 10;
      }
    }

    // 4. Delivery Preference
    if (answers.locationPreference === 'Mobile' && p.type === 'Mobile') {
      score += 15;
    } else if (answers.locationPreference === 'In-Clinic' && p.type === 'In-Clinic') {
      score += 15;
    }

    // 5. Availability
    if (p.availability === true) {
      score += 10;
    }

    // THE MATCHING UPGRADE (Operator Profiles)
    if (profile) {
      const data = profile.profile_data;
      
      // Bonus for profile completion
      score += 5;

      // clinic primary_specialty matches patient goal
      if (answers.goal && data.primarySpecialty && typeof data.primarySpecialty === 'string' && data.primarySpecialty.toLowerCase().includes(answers.goal.toLowerCase())) {
        score += 20;
      }

      // clinic environment matches patient preference
      if (data.environment && typeof data.environment === 'string' && data.environment === 'Spa-like lounge' && (answers.lifestyle === 'Luxury' || answers.goal === 'Beauty + glow')) {
        score += 5;
      }

      // clinic price_range matches patient budget
      if (answers.budget && data.priceRange && typeof data.priceRange === 'string' && data.priceRange.includes(answers.budget)) {
        score += 5;
      }

      // clinic walk_ins=true AND patient timing=today
      if (data.walkInsWelcome && (answers.urgency === 'Today' || answers.urgency === 'ASAP')) {
        score += 5;
      }
    }

    return { ...p, matchScore: score, distance };
  });

  // Deduplication Logic - 100% Unique result set
  const uniqueMatches: (Provider & { matchScore: number; distance?: number })[] = [];
  const seenNames = new Set<string>();
  const seenIds = new Set<string>();

  // Sort by score first to keep the best versions of each clinic
  const sorted = matched.sort((a, b) => b.matchScore - a.matchScore);

  for (const item of sorted) {
    const nameKey = item.name.toLowerCase().split(' - ')[0].split(' (')[0].trim();
    // Prevent same clinic brand from appearing multiple times in top matches
    if (!seenIds.has(item.id) && !seenNames.has(nameKey)) {
      uniqueMatches.push(item);
      seenIds.add(item.id);
      seenNames.add(nameKey);
    }
    
    // Safety exit
    if (uniqueMatches.length >= 12) break;
  }

  return uniqueMatches;
}
