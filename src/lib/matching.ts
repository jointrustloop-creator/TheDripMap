import { Provider, SurveyState, OperatorProfile } from '../types';
import { calculateDistance } from './geo';

export function matchProviders(
  answers: SurveyState, 
  providers: Provider[], 
  operatorProfiles: OperatorProfile[] = [],
  userLocation?: { latitude: number; longitude: number }
) {
  return providers.map(p => {
    let score = 0;
    const profile = operatorProfiles.find(op => op.clinicId === p.id);
    
    // 0. Distance Match (High Priority if location available)
    let distance: number | undefined;
    if (userLocation && p.latitude && p.longitude) {
      distance = calculateDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        p.latitude, 
        p.longitude
      );
      
      // Bonus for proximity
      if (distance <= 5) score += 500;
      else if (distance <= 15) score += 300;
      else if (distance <= 30) score += 100;
      
      // Penalty for very far (if not mobile)
      if (distance > 50 && p.type !== 'Mobile') score -= 200;
    }

    // 1. City Match (Highest Priority)
    if (answers.city && p.city === answers.city) {
      score += 1000;
    }

    // 2. Rank in City (Inverse weight)
    if (p.rank_in_city) {
      score += (10 - p.rank_in_city) * 10; // rank 1 gets +90, rank 2 gets +80, etc.
    }

    // 3. User Goal (Specialties)
    if (answers.goal && p.specialties.some(s => s.toLowerCase().includes(answers.goal?.toLowerCase() || ''))) {
      score += 50;
    }

    // 4. Delivery Preference
    if (answers.locationPreference === 'Mobile' && p.type === 'Mobile') {
      score += 30;
    } else if (answers.locationPreference === 'In-Clinic' && p.type === 'In-Clinic') {
      score += 30;
    } else if (answers.locationPreference === 'Both') {
      score += 30;
    }

    // 5. Availability (if present)
    if (p.availability === true) {
      score += 40;
    } else if (p.availability === false) {
      score -= 100; // Penalize if explicitly unavailable
    }

    // 6. Urgency (ASAP preference)
    if (answers.urgency === 'ASAP' && p.type === 'Mobile') {
      score += 20;
    }

    // THE MATCHING UPGRADE (Operator Profiles)
    if (profile) {
      const data = profile.profile_data;
      
      // Bonus for profile completion (always rank above identical-scoring clinics)
      score += 1;

      // clinic primary_specialty matches patient goal (+20 points)
      if (answers.goal && data.primarySpecialty.toLowerCase().includes(answers.goal.toLowerCase())) {
        score += 20;
      }

      // clinic environment matches patient preference (+10 points)
      // Note: We need to map patient preference to environment if applicable
      // For now, let's assume if patient wants luxury and clinic is spa-like
      if (data.environment === 'Spa-like lounge' && (answers.lifestyle === 'Luxury' || answers.goal === 'Beauty + glow')) {
        score += 10;
      }

      // clinic price_range matches patient budget (+10 points)
      if (answers.budget && data.priceRange.includes(answers.budget)) {
        score += 10;
      }

      // clinic walk_ins=true AND patient timing=today (+15 points)
      if (data.walkInsWelcome && (answers.urgency === 'Today' || answers.urgency === 'ASAP')) {
        score += 15;
      }

      // clinic mobile=true AND patient delivery=mobile (+15 points)
      if (data.mobileService && answers.locationPreference === 'Mobile') {
        score += 15;
      }
    }

    // Randomize slightly for "clinical nuance" simulation
    // const finalScore = Math.min(100, score + Math.floor(Math.random() * 5));

    return { ...p, matchScore: score, distance }; // Using raw score for sorting
  }).sort((a, b) => b.matchScore - a.matchScore);
}
