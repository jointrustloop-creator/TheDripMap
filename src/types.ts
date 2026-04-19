export type City = string;

export type TreatmentType = 'In-Clinic' | 'Mobile' | 'Both';

export interface ListingStats {
  totalListings: number;
  totalCities: number;
  totalStates: number;
  avgRating: number;
  isLive: boolean;
  error?: string;
}

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
  price_range?: string;
  type?: TreatmentType;
  specialties: string[];
  amenities: string[];
  description: string;
  imageUrl: string;
  slug?: string;
  is_featured: boolean;
  is_verified?: boolean;
  is_top_rated?: boolean;
  is_claimed?: boolean;
  claimed_at?: string;
  subscription_tier?: string;
  mobile_service?: boolean;
  walk_ins_welcome?: boolean;
  photos?: string[];
  hours?: Record<string, string>;
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
  services?: {
    name: string;
    description: string;
    price: string;
    category?: string;
  }[];
  reviews_data?: {
    author: string;
    rating: number;
    text: string;
    date: string;
    avatar?: string;
  }[];
  medical_team?: {
    name: string;
    role: string;
    bio: string;
    photo?: string;
  }[];
  special_offers?: {
    title: string;
    description: string;
    code?: string;
    expires?: string;
  }[];
}

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt?: string;
  category: 'Educational' | 'Local' | 'Use-Case';
  content: string;
  date: string;
  lastUpdated?: string;
  author: string;
  authorRole?: string;
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
  lat?: number;
  lng?: number;
  country?: string;
  state?: string;
  symptoms?: string[];
  lifestyle?: string;
  medicalHistory?: string[];
  urgency?: 'ASAP' | 'Today' | 'This Week';
}

export interface OperatorProfile {
  id: string;
  clinicId: string;
  clinic_id?: string;
  ownerName: string;
  email: string;
  owner_name?: string;
  one_liner?: string;
  credentials?: string;
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
