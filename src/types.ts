export type City = string;

export type TreatmentType = 'In-Clinic' | 'Mobile' | 'Both';

export interface Provider {
  id: string;
  name: string;
  category?: string;
  subtypes?: string[];
  phone?: string;
  website?: string;
  city: City;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  address: string;
  rating: number;
  reviewCount: number;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  type?: TreatmentType;
  specialties: string[];
  amenities: string[];
  description: string;
  imageUrl: string;
  slug?: string;
  is_featured: boolean;
  distance?: number;
  decisionDrivers?: {
    medicalSupervision: boolean;
    luxuryExperience: number; // 1-5
    speedOfService: number; // 1-5
    valueForMoney: number; // 1-5
  };
  rank_in_city?: number;
  availability?: boolean;
  working_hours?: Record<string, string[]>;
}

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: 'Educational' | 'Local' | 'Use-Case';
  content: string;
  date: string;
  lastUpdated?: string;
  author: string;
  authorImageUrl?: string;
  reviewedBy?: string;
  imageUrl: string;
  relatedCities?: City[];
  relatedClinics?: string[]; // Provider IDs
}

export interface LocationInfo {
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isPrecise: boolean;
  detectedAt: number;
}

export interface SurveyState {
  feeling?: string;
  goal?: string;
  locationPreference?: TreatmentType;
  budget?: string;
  city?: City;
  symptoms?: string[];
  lifestyle?: string;
  medicalHistory?: string[];
  urgency?: 'ASAP' | 'Today' | 'This Week';
}

export interface OperatorProfile {
  id: string;
  clinicId: string;
  ownerName: string;
  email: string;
  profile_data: {
    primarySpecialty: string;
    additionalServices: string[];
    environment: string;
    waitTime: string;
    administerType: string;
    typicalPatientAge: string[];
    primaryReasons: string[];
    priceRange: string;
    walkInsWelcome: boolean;
    mobileService: boolean;
    oneLiner: string;
  };
  createdAt: string;
}
