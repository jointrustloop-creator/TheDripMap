export type City = 
  | 'New York' 
  | 'Los Angeles' 
  | 'Miami' 
  | 'Las Vegas' 
  | 'Austin' 
  | 'Chicago'
  | 'Washington'
  | 'Portland'
  | 'Little Rock'
  | 'Birmingham'
  | 'Greenville'
  | 'Bentonville'
  | 'San Francisco'
  | 'San Diego'
  | 'Sacramento'
  | 'Fresno'
  | 'Milwaukee'
  | 'Madison'
  | 'Minneapolis'
  | 'St Paul'
  | 'Rochester'
  | 'Orlando'
  | 'Palm Springs'
  | 'Reno'
  | 'Bakersfield'
  | 'Springfield'
  | 'Decatur'
  | 'Champaign'
  | 'Joliet'
  | 'Santa Monica'
  | 'Beverly Hills'
  | 'West Hollywood'
  | 'Palm Desert'
  | 'Mission Viejo'
  | 'Laguna Niguel'
  | 'San Mateo'
  | 'San Carlos'
  | 'Glendale'
  | 'Long Beach'
  | 'Clovis'
  | 'Riverside'
  | 'Corona'
  | 'Burbank'
  | 'Redlands'
  | 'Claremont'
  | 'Edgewater'
  | 'Wausau'
  | 'Shelbyville'
  | 'Normal'
  | 'Lincoln'
  | 'Oak Brook'
  | 'Olney'
  | 'Niles'
  | 'Morton Grove'
  | 'Skokie'
  | 'Lincolnwood'
  | 'Park Ridge'
  | 'Glenview'
  | 'Arlington Heights'
  | 'Downey'
  | 'Cranford'
  | 'Upland'
  | 'Cerritos'
  | 'Foxborough'
  | 'Becker'
  | 'Bloomington'
  | 'Mankato'
  | 'Mendota Heights'
  | 'Long Lake'
  | 'Edina'
  | 'Verndale'
  | 'Grand Forks'
  | 'Wayzata'
  | 'Commack'
  | 'Andover'
  | 'Crofton'
  | 'Beverly'
  | 'Albany'
  | 'Hammond'
  | 'Andover'
  | 'Wadena'
  | 'Greenwood Village'
  | 'Rehoboth Beach'
  | 'Woodbury'
  | 'Troy'
  | 'Jamestown'
  | 'Clifton Park'
  | 'Fayetteville'
  | 'Sebring'
  | 'Scranton'
  | 'Crown Point'
  | 'Carrollwood'
  | 'Rochester Hills'
  | 'Town and Country'
  | 'Mt Vernon'
  | 'Hoboken'
  | 'Edwardsville'
  | 'Jacksonville'
  | 'Ladera Ranch'
  | 'Laguna Hills'
  | 'San Juan Capistrano'
  | 'Whitefish Bay'
  | 'New Berlin'
  | 'Brown Deer'
  | 'Shorewood'
  | 'Greenfield'
  | 'Minooka'
  | 'Glen Carbon'
  | 'Sycamore'
  | 'McHenry'
  | 'Pleasanton'
  | 'Plano'
  | 'Mt Prospect'
  | 'Barrington'
  | 'Kildeer'
  | 'Oak Lawn'
  | 'Hinsdale'
  | 'Downers Grove'
  | 'River Forest'
  | 'Highland Park'
  | 'Burr Ridge'
  | 'Stevens Point'
  | 'Marshfield'
  | 'Altoona'
  | 'Mt Horeb'
  | 'DeForest'
  | 'Stillwater'
  | 'Walker'
  | 'Dayton'
  | 'Verona'
  | 'Fennimore'
  | 'Watertown'
  | 'Muscoda'
  | 'Sauk City'
  | 'West Chicago'
  | 'South San Francisco'
  | 'Pinole'
  | 'Union City'
  | 'Sunnyvale'
  | 'Crosslake'
  | 'Brainerd'
  | 'Waite Park'
  | 'Deerwood'
  | 'Weston'
  | 'Iron Mountain'
  | 'Crivitz'
  | 'Aberdeen Township'
  | 'Albertville'
  | 'Alexandria'
  | 'Allentown'
  | 'Alloway'
  | 'Alma'
  | 'Annapolis'
  | 'Anoka'
  | 'Appleton'
  | 'Bloomfield Hills'
  | 'Wausaukee'
  | 'Brielle'
  | 'Cottage Grove'
  | 'Ely'
  | 'West Covina'
  | 'Peoria Heights'
  | 'Barron'
  | 'Crystal Lake'
  | 'Cathedral City'
  | 'La Quinta'
  | 'Indian Wells'
  | 'Minnetonka'
  | 'Montclair'
  | 'National City'
  | 'Morristown'
  | 'Pawnee'
  | 'Rochelle'
  | 'Southern View'
  | 'Encino'
  | 'Woodland Hills'
  | 'Los Alamitos'
  | 'Seal Beach'
  | 'La Crosse'
  | 'Atascadero'
  | 'Carpinteria'
  | 'Los Banos'
  | 'Algonquin'
  | 'Huntington Beach'
  | 'Becker'
  | 'Bloomington'
  | 'Mankato'
  | 'Mendota Heights'
  | 'Rogers'
  | 'St. Cloud'
  | 'Woodbury'
  | 'Hudson'
  | 'Eau Claire'
  | 'Madison'
  | 'Middleton'
  | 'Sun Prairie'
  | 'Waukesha'
  | 'Brookfield'
  | 'Menomonee Falls'
  | 'Mequon'
  | 'Whitefish Bay'
  | 'Shorewood'
  | 'Oak Creek';

export type TreatmentType = 'In-Clinic' | 'Mobile' | 'Both';

export interface Provider {
  id: string;
  name: string;
  city: City;
  address: string;
  rating: number;
  reviewCount: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  type: TreatmentType;
  specialties: string[];
  amenities: string[];
  description: string;
  imageUrl: string;
  featured: boolean;
  decisionDrivers: {
    medicalSupervision: boolean;
    luxuryExperience: number; // 1-5
    speedOfService: number; // 1-5
    valueForMoney: number; // 1-5
  };
  rank_in_city?: number;
  availability?: boolean;
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
