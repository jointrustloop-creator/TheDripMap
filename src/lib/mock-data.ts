import { Provider, BlogPost } from '../types';

export const MOCK_CITIES: { city: string, state: string }[] = [
  { city: 'New York', state: 'NY' },
  { city: 'San Francisco', state: 'CA' },
  { city: 'Clearwater', state: 'FL' },
  { city: 'Washington DC', state: 'DC' },
  { city: 'Kansas City', state: 'MO' },
  { city: 'Tampa', state: 'FL' },
  { city: 'Fairfax', state: 'VA' },
  { city: 'San Diego', state: 'CA' },
  { city: 'Houston', state: 'TX' },
  { city: 'Huntsville', state: 'AL' },
  { city: 'Pleasanton', state: 'CA' },
  { city: 'Cypress', state: 'TX' },
  { city: 'Greenville', state: 'SC' },
];

export const MOCK_LISTINGS: Provider[] = [
  {
    id: '1',
    name: 'The Wellness Drip',
    city: 'New York',
    address: '123 Manhattan Ave, New York, NY 10001',
    rating: 4.9,
    reviewCount: 128,
    priceRange: '$$',
    type: 'Both',
    specialties: ['NAD+ Plus', 'Immune Support', 'Beauty Glow'],
    amenities: ['Private Rooms', 'Free WiFi', 'Beverages'],
    description: 'Premier IV therapy clinic in the heart of Manhattan offering customized wellness solutions.',
    imageUrl: 'https://picsum.photos/seed/provider-1/800/600',
    is_featured: true,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '1-2',
    name: 'Gotham Hydration',
    city: 'New York',
    address: '456 Park Ave, New York, NY 10022',
    rating: 4.7,
    reviewCount: 85,
    priceRange: '$$$',
    type: 'In-Clinic',
    specialties: ['Hangover', 'Recovery', 'NAD+ Plus'],
    amenities: ['Luxury Lounge', 'Valet'],
    description: 'Upscale IV hydration lounge catering to Manhattan\'s elite professionals.',
    imageUrl: 'https://picsum.photos/seed/provider-1-2/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 3,
      valueForMoney: 3
    }
  },
  {
    id: '1-3',
    name: 'Brooklyn Drip Co',
    city: 'New York',
    address: '789 Bedford Ave, Brooklyn, NY 11211',
    rating: 4.8,
    reviewCount: 112,
    priceRange: '$',
    type: 'Mobile',
    specialties: ['Immune Support', 'Hydration'],
    amenities: ['Mobile Service', 'Group Discounts'],
    description: 'Fast, affordable mobile IV therapy serving all of Brooklyn and Queens.',
    imageUrl: 'https://picsum.photos/seed/provider-1-3/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 2,
      speedOfService: 5,
      valueForMoney: 5
    }
  },
  {
    id: '2',
    name: 'LA Hydration Hub',
    city: 'Los Angeles',
    address: '456 Sunset Blvd, Los Angeles, CA 90028',
    rating: 4.8,
    reviewCount: 95,
    priceRange: '$$$',
    type: 'In-Clinic',
    specialties: ['Hangover', 'Recovery', 'Hydration'],
    amenities: ['Valet Parking', 'Luxury Lounge'],
    description: 'Hollywood\'s favorite hydration spot for quick recovery and performance boosts.',
    imageUrl: 'https://picsum.photos/seed/provider-2/800/600',
    is_featured: true,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 5,
      valueForMoney: 3
    }
  },
  {
    id: '2-2',
    name: 'Santa Monica Wellness',
    city: 'Los Angeles',
    address: '1200 Ocean Ave, Santa Monica, CA 90401',
    rating: 4.9,
    reviewCount: 156,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Beauty Glow', 'NAD+ Plus', 'Immune Support'],
    amenities: ['Ocean View', 'Private Suites'],
    description: 'Clinical excellence meets coastal luxury. The premier destination for NAD+ and beauty drips.',
    imageUrl: 'https://picsum.photos/seed/provider-2-2/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '3',
    name: 'Miami Glow IV',
    city: 'Miami',
    address: '789 Ocean Dr, Miami Beach, FL 33139',
    rating: 4.7,
    reviewCount: 210,
    priceRange: '$$',
    type: 'Mobile',
    specialties: ['Beauty Glow', 'Weight Loss', 'Hydration'],
    amenities: ['Mobile Service', 'Group Discounts'],
    description: 'Expert mobile IV therapy bringing the glow directly to your home or hotel.',
    imageUrl: 'https://picsum.photos/seed/provider-3/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 3,
      speedOfService: 4,
      valueForMoney: 5
    }
  },
  {
    id: '3-2',
    name: 'Brickell Recovery Lounge',
    city: 'Miami',
    address: '1000 Brickell Ave, Miami, FL 33131',
    rating: 4.6,
    reviewCount: 78,
    priceRange: '$$$',
    type: 'In-Clinic',
    specialties: ['Hangover', 'NAD+ Plus'],
    amenities: ['Private Pods', 'Refreshments'],
    description: 'High-tech recovery in the heart of the financial district.',
    imageUrl: 'https://picsum.photos/seed/provider-3-2/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 3
    }
  },
  {
    id: '4',
    name: 'The IV Health Centre',
    city: 'Toronto',
    address: '672 Dupont St Suite 206, Toronto, ON M6G 1Z5',
    rating: 4.9,
    reviewCount: 142,
    priceRange: '$$',
    type: 'In-Clinic',
    specialties: ['Immune Support', 'NAD+ Plus', 'Chronic Fatigue'],
    amenities: ['Clinical Environment', 'Expert Consultations'],
    description: 'Toronto\'s premier clinical IV therapy centre specializing in functional medicine and personalized wellness.',
    imageUrl: 'https://picsum.photos/seed/provider-4/800/600',
    is_featured: true,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 3,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '5',
    name: 'Reviv Toronto',
    city: 'Toronto',
    address: '118 Yorkville Ave, Toronto, ON M5R 1C2',
    rating: 4.8,
    reviewCount: 89,
    priceRange: '$$$',
    type: 'In-Clinic',
    specialties: ['Beauty Glow', 'Hangover', 'Hydration'],
    amenities: ['Luxury Lounge', 'Yorkville Location'],
    description: 'Global leader in IV wellness located in the heart of Yorkville, offering premium hydration and vitamin therapies.',
    imageUrl: 'https://picsum.photos/seed/provider-5/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 4,
      valueForMoney: 3
    }
  },
  {
    id: '6',
    name: 'Austin Drip Society',
    city: 'Austin',
    address: '500 San Marcos St, Austin, TX 78702',
    rating: 4.9,
    reviewCount: 167,
    priceRange: '$$',
    type: 'Both',
    specialties: ['NAD+ Plus', 'Hangover', 'Immune Support'],
    amenities: ['Modern Lounge', 'Complimentary Snacks'],
    description: 'Austin\'s premier destination for clinical-grade IV therapy and wellness optimization.',
    imageUrl: 'https://picsum.photos/seed/provider-6/800/600',
    is_featured: true,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '7',
    name: 'Vegas Vitality',
    city: 'Las Vegas',
    address: '3570 S Las Vegas Blvd, Las Vegas, NV 89109',
    rating: 4.8,
    reviewCount: 342,
    priceRange: '$$$',
    type: 'Both',
    specialties: ['Hangover', 'Recovery', 'Hydration'],
    amenities: ['Strip View', 'Mobile Service'],
    description: 'The ultimate recovery station on the Las Vegas Strip. We bring the cure to your suite or welcome you in our luxury lounge.',
    imageUrl: 'https://picsum.photos/seed/provider-7/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 5,
      valueForMoney: 3
    }
  },
  {
    id: '8',
    name: 'Windy City Wellness',
    city: 'Chicago',
    address: '150 N Riverside Plaza, Chicago, IL 60606',
    rating: 4.7,
    reviewCount: 124,
    priceRange: '$$',
    type: 'In-Clinic',
    specialties: ['Immune Support', 'NAD+ Plus'],
    amenities: ['River View', 'Private Rooms'],
    description: 'Premium IV hydration and wellness in the heart of Chicago\'s Loop.',
    imageUrl: 'https://picsum.photos/seed/provider-8/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 3,
      valueForMoney: 4
    }
  },
  {
    id: '9',
    name: 'Fog City Hydration',
    city: 'San Francisco',
    address: '101 California St, San Francisco, CA 94111',
    rating: 4.9,
    reviewCount: 98,
    priceRange: '$$$',
    type: 'Both',
    specialties: ['NAD+ Plus', 'Immune Support', 'Recovery', 'Hangover'],
    amenities: ['Tech-Forward Lounge', 'Mobile Service'],
    description: 'Advanced IV therapy for San Francisco\'s high-performers and wellness enthusiasts.',
    imageUrl: 'https://picsum.photos/seed/provider-9/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 4,
      valueForMoney: 3
    }
  },
  {
    id: 'sf-2',
    name: 'Golden Gate IV & Wellness',
    city: 'San Francisco',
    state: 'CA',
    address: '2200 Fillmore St, San Francisco, CA 94115',
    rating: 4.8,
    reviewCount: 45,
    priceRange: '$$',
    type: 'In-Clinic',
    specialties: ['Hangover', 'Beauty Glow', 'Immune Support'],
    amenities: ['Boutique Setting', 'Organic Refreshments'],
    description: 'Personalized IV hydration and vitamin therapy in the heart of Pacific Heights.',
    imageUrl: 'https://picsum.photos/seed/sf-2/800/600',
    is_featured: true,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '11',
    name: 'Big D Drip',
    city: 'Dallas',
    address: '2200 Victory Ave, Dallas, TX 75219',
    rating: 4.8,
    reviewCount: 156,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Hangover', 'Beauty Glow', 'Hydration'],
    amenities: ['Luxury Lounge', 'Mobile Service'],
    description: 'Dallas\' premier destination for hydration and vitamin therapy.',
    imageUrl: 'https://picsum.photos/seed/provider-11/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '12',
    name: 'Space City Hydration',
    city: 'Houston',
    address: '1200 Main St, Houston, TX 77002',
    rating: 4.8,
    reviewCount: 189,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Recovery', 'Immune Support'],
    amenities: ['Modern Lounge', 'Mobile Service'],
    description: 'Houston\'s leading IV therapy provider for athletes and busy professionals.',
    imageUrl: 'https://picsum.photos/seed/provider-12/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '13',
    name: 'Desert Drip',
    city: 'Phoenix',
    address: '2 N Central Ave, Phoenix, AZ 85004',
    rating: 4.9,
    reviewCount: 145,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Hydration', 'Heat Recovery'],
    amenities: ['Cooling Lounge', 'Mobile Service'],
    description: 'Stay hydrated in the Valley of the Sun with our specialized IV protocols.',
    imageUrl: 'https://picsum.photos/seed/provider-13/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 5,
      valueForMoney: 4
    }
  },
  {
    id: '14',
    name: 'Peach State Wellness',
    city: 'Atlanta',
    address: '191 Peachtree St NE, Atlanta, GA 30303',
    rating: 4.8,
    reviewCount: 178,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Immune Support', 'Energy Boost'],
    amenities: ['Luxury Lounge', 'Mobile Service'],
    description: 'Atlanta\'s premier IV therapy and wellness destination.',
    imageUrl: 'https://picsum.photos/seed/provider-14/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '15',
    name: 'Mile High Hydration',
    city: 'Denver',
    address: '1701 Wynkoop St, Denver, CO 80202',
    rating: 4.8,
    reviewCount: 134,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Altitude Recovery', 'Immune Support'],
    amenities: ['Mountain Views', 'Mobile Service'],
    description: 'Denver\'s top choice for altitude sickness relief and wellness drips.',
    imageUrl: 'https://picsum.photos/seed/provider-15/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '16',
    name: 'Emerald City Drip',
    city: 'Seattle',
    address: '1000 4th Ave, Seattle, WA 98104',
    rating: 4.9,
    reviewCount: 112,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Immune Support', 'Energy Boost'],
    amenities: ['Modern Lounge', 'Mobile Service'],
    description: 'Premium IV therapy for Seattle\'s active and professional community.',
    imageUrl: 'https://picsum.photos/seed/provider-16/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 5,
      valueForMoney: 4
    }
  },
  {
    id: '17',
    name: 'Boston Wellness Hub',
    city: 'Boston',
    address: '100 Federal St, Boston, MA 02110',
    rating: 4.8,
    reviewCount: 167,
    priceRange: '$$$',
    type: 'In-Clinic',
    specialties: ['NAD+ Plus', 'Recovery'],
    amenities: ['Clinical Excellence', 'Private Suites'],
    description: 'Advanced clinical IV therapy in the heart of Boston.',
    imageUrl: 'https://picsum.photos/seed/provider-17/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 3,
      valueForMoney: 3
    }
  },
  {
    id: '19',
    name: 'Queen City Drip',
    city: 'Charlotte',
    address: '100 N Tryon St, Charlotte, NC 28202',
    rating: 4.7,
    reviewCount: 92,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Immune Support', 'Recovery'],
    amenities: ['Modern Lounge', 'Mobile Service'],
    description: 'Charlotte\'s premier destination for hydration and wellness optimization.',
    imageUrl: 'https://picsum.photos/seed/provider-19/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '20',
    name: 'Orlando Wellness Drip',
    city: 'Orlando',
    address: '400 W Church St, Orlando, FL 32801',
    rating: 4.8,
    reviewCount: 156,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Hydration', 'Immune Support'],
    amenities: ['Family Friendly', 'Mobile Service'],
    description: 'Expert IV therapy in the heart of Orlando, perfect for theme park recovery and wellness.',
    imageUrl: 'https://picsum.photos/seed/provider-20/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '21',
    name: 'Rocky Mountain IV',
    city: 'Denver',
    address: '1200 17th St, Denver, CO 80202',
    rating: 4.7,
    reviewCount: 88,
    priceRange: '$$',
    type: 'Mobile',
    specialties: ['Altitude Recovery', 'Hydration'],
    amenities: ['Mobile Service', 'Oxygen Therapy'],
    description: 'Specialized altitude sickness relief delivered to your door in Denver and surrounding areas.',
    imageUrl: 'https://picsum.photos/seed/provider-21/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 3,
      speedOfService: 5,
      valueForMoney: 4
    }
  },
  {
    id: '22',
    name: 'Rain City Recovery',
    city: 'Seattle',
    address: '1201 3rd Ave, Seattle, WA 98101',
    rating: 4.6,
    reviewCount: 74,
    priceRange: '$$',
    type: 'In-Clinic',
    specialties: ['Immune Support', 'NAD+ Plus'],
    amenities: ['Private Pods', 'Coffee Bar'],
    description: 'Boost your immunity and energy in our cozy downtown Seattle lounge.',
    imageUrl: 'https://picsum.photos/seed/provider-22/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 3
    }
  },
  {
    id: '23',
    name: 'Beacon Hill Wellness',
    city: 'Boston',
    address: '1 Beacon St, Boston, MA 02108',
    rating: 4.9,
    reviewCount: 110,
    priceRange: '$$$',
    type: 'Both',
    specialties: ['NAD+ Plus', 'Beauty Glow'],
    amenities: ['Luxury Lounge', 'Mobile Service'],
    description: 'Elite IV therapy and anti-aging treatments in Boston\'s historic Beacon Hill.',
    imageUrl: 'https://picsum.photos/seed/provider-23/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 4,
      valueForMoney: 3
    }
  },
  {
    id: '24',
    name: 'Broadway Drip Lounge',
    city: 'Nashville',
    address: '414 Union St, Nashville, TN 37219',
    rating: 4.8,
    reviewCount: 195,
    priceRange: '$$',
    type: 'In-Clinic',
    specialties: ['Hangover', 'Hydration'],
    amenities: ['Group Seating', 'Music'],
    description: 'The perfect pre- or post-Broadway recovery spot for groups and individuals.',
    imageUrl: 'https://picsum.photos/seed/provider-24/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 3,
      speedOfService: 5,
      valueForMoney: 4
    }
  },
  {
    id: '25',
    name: 'Tryon Wellness',
    city: 'Charlotte',
    address: '201 S Tryon St, Charlotte, NC 28202',
    rating: 4.7,
    reviewCount: 65,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Immune Support', 'Recovery'],
    amenities: ['Modern Lounge', 'Mobile Service'],
    description: 'Comprehensive IV therapy solutions for Charlotte\'s growing wellness community.',
    imageUrl: 'https://picsum.photos/seed/provider-25/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: 'tampa-1',
    name: 'Tampa Bay IV Hydration',
    city: 'Tampa',
    state: 'FL',
    address: '401 E Jackson St, Tampa, FL 33602',
    rating: 4.9,
    reviewCount: 87,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Immune Support', 'Recovery', 'Beauty Glow'],
    amenities: ['Private Suites', 'Free WiFi', 'Refreshments'],
    description: 'Tampa\'s premier IV therapy destination for rapid recovery and wellness optimization.',
    imageUrl: 'https://picsum.photos/seed/tampa-1/800/600',
    is_featured: true,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 5,
      valueForMoney: 4
    }
  },
  {
    id: 'tampa-2',
    name: 'Ybor City Drip Lounge',
    city: 'Tampa',
    state: 'FL',
    address: '1600 E 7th Ave, Tampa, FL 33605',
    rating: 4.8,
    reviewCount: 54,
    priceRange: '$$',
    type: 'In-Clinic',
    specialties: ['Hangover', 'Energy Boost'],
    amenities: ['Historic Building', 'Lounge Area'],
    description: 'Located in the heart of Ybor City, offering fast hydration for locals and visitors alike.',
    imageUrl: 'https://picsum.photos/seed/tampa-2/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 3,
      speedOfService: 4,
      valueForMoney: 5
    }
  },
  {
    id: 'clearwater-1',
    name: 'Clearwater Beach IV',
    city: 'Clearwater',
    state: 'FL',
    address: '25 Causeway Blvd, Clearwater, FL 33767',
    rating: 4.9,
    reviewCount: 112,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Sunburn Recovery', 'Hydration', 'Immune Support'],
    amenities: ['Beach View', 'Mobile Service'],
    description: 'Specialized IV protocols for beachgoers and vacationers in Clearwater Beach.',
    imageUrl: 'https://picsum.photos/seed/clearwater-1/800/600',
    is_featured: true,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 5,
      valueForMoney: 4
    }
  },
  {
    id: 'clearwater-2',
    name: 'Gulf Coast Wellness',
    city: 'Clearwater',
    state: 'FL',
    address: '1234 Gulf to Bay Blvd, Clearwater, FL 33755',
    rating: 4.7,
    reviewCount: 43,
    priceRange: '$',
    type: 'In-Clinic',
    specialties: ['Wellness', 'Vitamin C'],
    amenities: ['Easy Parking', 'Fast Service'],
    description: 'Affordable and effective IV therapy for the Clearwater community.',
    imageUrl: 'https://picsum.photos/seed/clearwater-2/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 2,
      speedOfService: 4,
      valueForMoney: 5
    }
  },
  {
    id: 'dc-1',
    name: 'Capital Drip & Wellness',
    city: 'Washington DC',
    state: 'DC',
    address: '1200 17th St NW, Washington, DC 20036',
    rating: 4.9,
    reviewCount: 156,
    priceRange: '$$$',
    type: 'Both',
    specialties: ['NAD+ Plus', 'Immune Support', 'Executive Recovery'],
    amenities: ['Private Suites', 'Concierge Service'],
    description: 'Premier IV therapy for DC\'s professionals and residents.',
    imageUrl: 'https://picsum.photos/seed/dc-1/800/600',
    is_featured: true,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 4,
      valueForMoney: 3
    }
  },
  {
    id: 'kc-1',
    name: 'Kansas City Hydration Lounge',
    city: 'Kansas City',
    state: 'MO',
    address: '4740 Grand Ave, Kansas City, MO 64112',
    rating: 4.8,
    reviewCount: 92,
    priceRange: '$$',
    type: 'In-Clinic',
    specialties: ['Athletic Recovery', 'Immune Support'],
    amenities: ['Relaxing Environment', 'Free WiFi'],
    description: 'The Plaza\'s top destination for IV wellness and hydration.',
    imageUrl: 'https://picsum.photos/seed/kc-1/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: 'sd-1',
    name: 'San Diego Glow IV',
    city: 'San Diego',
    state: 'CA',
    address: '1230 Prospect St, La Jolla, CA 92037',
    rating: 4.9,
    reviewCount: 134,
    priceRange: '$$',
    type: 'Both',
    specialties: ['Beauty Glow', 'Hydration', 'NAD+ Plus'],
    amenities: ['Ocean View', 'Mobile Service'],
    description: 'Coastal wellness and hydration in the heart of La Jolla.',
    imageUrl: 'https://picsum.photos/seed/sd-1/800/600',
    is_featured: true,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: 'fairfax-1',
    name: 'Fairfax Wellness Drip',
    city: 'Fairfax',
    state: 'VA',
    address: '2905 District Ave, Fairfax, VA 22031',
    rating: 4.8,
    reviewCount: 67,
    priceRange: '$$',
    type: 'In-Clinic',
    specialties: ['Immune Support', 'Wellness'],
    amenities: ['Modern Facility', 'Expert Staff'],
    description: 'Professional IV therapy services in the Mosaic District.',
    imageUrl: 'https://picsum.photos/seed/fairfax-1/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: 'tampa-3',
    name: 'Hydrate Tampa Mobile',
    city: 'Tampa',
    state: 'FL',
    address: 'Mobile Service, Tampa, FL 33602',
    rating: 4.7,
    reviewCount: 31,
    priceRange: '$$',
    type: 'Mobile',
    specialties: ['Hydration', 'Flu Recovery'],
    amenities: ['Mobile Service', 'Fast Response'],
    description: 'On-demand mobile IV therapy serving the greater Tampa Bay area.',
    imageUrl: 'https://picsum.photos/seed/tampa-3/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 3,
      speedOfService: 5,
      valueForMoney: 4
    }
  },
  {
    id: 'tampa-4',
    name: 'South Tampa Wellness',
    city: 'Tampa',
    state: 'FL',
    address: '2502 S MacDill Ave, Tampa, FL 33629',
    rating: 4.9,
    reviewCount: 104,
    priceRange: '$$$',
    type: 'In-Clinic',
    specialties: ['NAD+ Plus', 'Anti-Aging', 'Weight Loss'],
    amenities: ['Luxury Lounge', 'Private Rooms'],
    description: 'Premium wellness and longevity treatments in South Tampa.',
    imageUrl: 'https://picsum.photos/seed/tampa-4/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 4,
      valueForMoney: 3
    }
  },
  {
    id: 'clearwater-3',
    name: 'Clearwater Mobile Drip',
    city: 'Clearwater',
    state: 'FL',
    address: 'Mobile Service, Clearwater, FL 33756',
    rating: 4.8,
    reviewCount: 28,
    priceRange: '$$',
    type: 'Mobile',
    specialties: ['Hydration', 'Recovery'],
    amenities: ['Mobile Service', 'Group Discounts'],
    description: 'We bring the wellness to you in Clearwater and surrounding beaches.',
    imageUrl: 'https://picsum.photos/seed/clearwater-3/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 3,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: 'clearwater-4',
    name: 'Sand Key Wellness',
    city: 'Clearwater',
    state: 'FL',
    address: '1160 Gulf Blvd, Clearwater, FL 33767',
    rating: 4.9,
    reviewCount: 76,
    priceRange: '$$$',
    type: 'In-Clinic',
    specialties: ['Beauty Glow', 'NAD+ Plus'],
    amenities: ['Resort Location', 'Valet Parking'],
    description: 'High-end IV therapy located within the Sand Key resort area.',
    imageUrl: 'https://picsum.photos/seed/clearwater-4/800/600',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 4,
      valueForMoney: 3
    }
  }
];

export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    slug: 'science-of-iv-therapy-for-hangover-recovery',
    title: 'The Science of Hangover Recovery: Why IV Therapy is the Gold Standard',
    metaTitle: 'Hangover IV Therapy: Science, Benefits & Recovery Guide | TheDripMap',
    metaDescription: 'Struggling with a severe hangover? Learn the clinical science behind IV hydration, how it clears acetaldehyde, and why it outperforms oral rehydration.',
    category: 'Educational',
    content: `
<h2>Why Hangovers Hit So Hard</h2>
<p>Hangovers are your body's response to dehydration, nutrient depletion, and the toxic byproducts of alcohol metabolism. Alcohol is a diuretic — every drink causes your kidneys to excrete more water than you consume, leading to significant dehydration by morning.</p>
<p>Beyond dehydration, alcohol metabolism produces acetaldehyde — a compound significantly more toxic than alcohol itself. Your liver works to break this down but when you drink heavily it cannot keep pace. The result is inflammation throughout the body including the brain, which causes that characteristic pounding headache.</p>
<h2>Why IV Therapy Works for Hangovers</h2>
<p>IV therapy delivers fluids, vitamins and medications directly into your bloodstream. There is no digestive system to navigate — absorption is immediate and complete. Most people begin feeling better within 20 to 30 minutes of starting a drip, often before the session is even finished.</p>
<p>A typical hangover IV drip contains saline solution to restore hydration, B vitamins to support metabolism, vitamin C as an antioxidant, magnesium to address muscle tension and mood, and in medically supervised clinics, anti-nausea and anti-inflammatory medications.</p>
<h2>In-Clinic vs Mobile IV for Hangovers</h2>
<p>Many New York and major city clinics offer mobile IV service where a licensed nurse comes to your home or hotel room. For hangover recovery when you are not feeling well enough to travel, this is often the most practical option. Several clinics offer same-day or rapid-dispatch availability.</p>
<h2>What to Look For in a Hangover Clinic</h2>
<p>Look for clinics staffed by licensed Registered Nurses or Nurse Practitioners. Focus on providers with 50 or more reviews rather than just star rating alone. Confirm same-day availability before booking, and check whether anti-nausea medications are available as part of the formula.</p>
<h2>Find a Hangover IV Clinic Near You</h2>
<p>TheDripMap lists verified IV therapy clinics across the United States with real ratings and same-day availability. Take the free matching quiz to find the best hangover IV clinic for your location and budget.</p>
`,
    date: 'March 15, 2025',
    author: 'TheDripMap Team',
    authorRole: 'TheDripMap Editorial',
    imageUrl: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&q=80'
  },
  {
    slug: 'nad-plus-iv-therapy-cellular-longevity-guide',
    title: 'NAD+ IV Therapy: A Deep Dive into Cellular Longevity and DNA Repair',
    metaTitle: 'NAD+ IV Therapy Guide: Benefits, Science & Longevity | TheDripMap',
    metaDescription: 'Unlock the secrets of NAD+ therapy. Discover how this coenzyme repairs DNA, boosts mitochondria, and reverses cellular aging.',
    category: 'Educational',
    content: `
<h2>The Essential Guide to NAD+ IV Therapy</h2>
<p>NAD+ — nicotinamide adenine dinucleotide — is one of the most important molecules in the human body. It is involved in hundreds of metabolic processes, plays a central role in DNA repair, and is essential for the function of mitochondria — the energy-producing structures inside every cell. Low levels of NAD+ are directly linked to the physical and cognitive decline often associated with aging.</p>
<p>The problem is that NAD+ levels decline significantly with age. By the time most people reach their 50s they have roughly half the NAD+ levels they had in their 20s. This decline is associated with many of the hallmark features of ageing — reduced energy, slower recovery, cognitive changes, and decreased cellular repair capacity. IV therapy offers a direct way to replenish these levels immediately.</p>
<h2>How NAD+ Works at a Cellular Level</h2>
<p>NAD+ functions as a coenzyme — a helper molecule that enables enzymes to perform their jobs. It exists in two forms: NAD+ (oxidised) and NADH (reduced). Beyond energy metabolism, NAD+ activates sirtuins, which are proteins often described as "longevity genes." These proteins regulate cellular health, inflammation control, and the elimination of damaged cells.</p>
<p>Furthermore, NAD+ is essential for PARP enzymes which detect and repair DNA damage. When NAD+ levels are low, DNA repair slows down, leading to accelerated cellular dysfunction. By bypassing the digestive system, IV therapy delivers this critical coenzyme directly to the cells that need it most.</p>
<h2>Benefits of NAD+ Infusions</h2>
<p>Patients seeking NAD+ therapy typically report improvements in several key areas. Athletes use it to support faster recovery between training sessions, while professionals use it to combat "brain fog" and improve cognitive function. Others use it as a cornerstone of an anti-aging protocol to maintain cellular vitality well into their later years.</p>
<p>Because NAD+ infusions are quite potent, they are typically administered slowly over 2 to 4 hours. This controlled rate ensures comfort and allows the body to absorb the nutrient efficiently. Standard sessions may cost between $400 and $800, reflecting the high grade of the pharmaceutical components used.</p>
<h2>Finding a Qualified NAD+ Provider</h2>
<p>NAD+ therapy requires precise medical supervision. Always choose a clinic with licensed medical personnel who can monitor the infusion rate and adjust based on your specific response. You can find top-rated NAD+ providers in your city using TheDripMap directory.</p>
`,
    date: 'March 15, 2025',
    author: 'TheDripMap Team',
    authorRole: 'TheDripMap Editorial',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71f1536783?w=800&q=80'
  },
  {
    slug: 'myers-cocktail-iv-therapy-complete-guide',
    title: 'The Myers\' Cocktail: The Original Wellness Drip for Chronic Fatigue',
    metaTitle: 'The Myers\' Cocktail: Benefits, Ingredients & Guide | TheDripMap',
    metaDescription: 'Discover the original IV nutrition therapy: the Myers\' Cocktail. Learn about its ingredients, benefits for fatigue, and why it remains a wellness standard.',
    category: 'Educational',
    content: `
<h2>The Myers' Cocktail: The Gold Standard of IV Nutrition</h2>
<p>Developed in the 1950s by Dr. John Myers, this original blend of vitamins and minerals remains the most popular IV therapy choice in the world. It was designed to address diverse symptoms including chronic fatigue, asthma, and migraines by flooding the body with essential nutrients that are often deficient in modern diets.</p>
<p>If you have visited a wellness clinic and ordered a "Wellness Drip" or an "Immune Boost," you were likely receiving a variation of the classic Myers' formula. Its enduring popularity is a testament to its efficacy in balancing the body's biochemistry and restoring energy levels rapidly.</p>
<h2>The Core Ingredients</h2>
<p>A true Myers' Cocktail typically contains a precise blend of Magnesium, Calcium, B vitamins (including B12, B6, and B5), and high-dose Vitamin C. Magnesium is particularly crucial as it is involved in over 300 enzymatic reactions, yet many adults are chronically deficient.</p>
<p>Vitamin C acts as a powerful antioxidant, and when delivered intravenously, it can reach plasma concentrations that are impossible to achieve through oral supplements alone. This makes it an invaluable tool for immune support and oxidative stress reduction.</p>
<h2>Why Patients Choose the Myers' Cocktail</h2>
<p>Patients frequently report relief from chronic fatigue, fibro-myalgia, and recurring migraines. The combination of nutrients supports cellular energy production (ATP) and helps regulate nervous system activity. For many, a monthly infusion becomes a cornerstone of their long-term wellness strategy.</p>
<p>A typical session takes only 30 to 45 minutes and is administered in a relaxing environment. The rapid absorption means you can walk out of the clinic feeling significantly more alert and revitalized than when you arrived.</p>
<h2>Is it Right for You?</h2>
<p>Whether you are a busy professional, a parent managing a hectic schedule, or someone dealing with a chronic condition, the Myers' Cocktail offers a comprehensive nutritional reset. Consult with a licensed provider on TheDripMap to see how this original wellness drip can benefit your specific health needs.</p>
`,
    date: 'March 15, 2025',
    author: 'TheDripMap Team',
    authorRole: 'TheDripMap Editorial',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80'
  },
  {
    slug: 'mobile-iv-therapy-complete-guide',
    title: 'Mobile IV Therapy — Everything You Need to Know Before Booking',
    metaTitle: 'Mobile IV Therapy: How It Works, Costs & Providers | TheDripMap',
    metaDescription: 'Learn everything about mobile IV therapy. How nurses come to your home, what it costs, and how to find the best on-demand providers.',
    category: 'Use-Case',
    content: `
<h2>The Ultimate Guide to Mobile IV Therapy</h2>
<p>Mobile IV therapy is the pinnacle of wellness convenience: a licensed medical professional comes directly to your home, office, or hotel room to deliver an infusion. This eliminated the need for travel when you are feeling under the weather, making it the preferred choice for recovery and performance wellness across the United States.</p>
<p>Whether you're recovering from a long night out, fighting off a seasonal illness, or just too busy to visit a storefront clinic, mobile IV services provide the same medical-grade treatment you'd receive in a hospital or clinic, but in the comfort of your own living room.</p>
<h2>How the Mobile Experience Works</h2>
<p>Booking a mobile session is simple. Most providers allow for on-demand booking where a nurse can arrive in as little as 45 minutes. Upon arrival, the nurse will perform a brief medical intake, check your vitals, and set up the sterile infusion equipment. The entire process typically takes 45 to 60 minutes.</p>
<p>Because safety is paramount, these services are staffed by registered nurses (RNs) and work under the strict protocols of a medical director. Everything used is single-use and pharmaceutical-grade, ensuring clinic-level safety in a residential setting.</p>
<h2>When to Use Mobile Services</h2>
<p>The most common use cases include rapid hangover recovery, jet lag treatment for travelers, and immune support during flu season. Athletes also frequently use mobile IVs for pre-race hydration or post-event recovery at their training facility. It is also an excellent option for group bookings, such as wedding parties or corporate wellness days.</p>
<p>Pricing for mobile services usually includes a small travel fee (typically $50-$75) on top of the drip price. While slightly more expensive than a clinic visit, the time saved and the comfort of staying home often outweigh the cost for most patients.</p>
<h2>Choosing a Reputable Mobile Provider</h2>
<p>When booking, ensure the provider has a strong track record of safety and positive reviews. Look for clinics that are transparent about their staff's credentials and medical oversight. TheDripMap simplifies this by vetting mobile providers so you can book with complete confidence.</p>
`,
    date: 'April 1, 2025',
    author: 'TheDripMap Team',
    authorRole: 'TheDripMap Editorial',
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80'
  },
  {
    slug: 'how-much-does-iv-therapy-cost',
    title: 'How Much Does IV Therapy Cost in 2025? A Complete Price Guide',
    metaTitle: 'IV Therapy Costs 2025: Pricing Guide by Treatment Type | TheDripMap',
    metaDescription: 'Find out exactly how much you should pay for IV therapy in 2025. Prices for hydration, NAD+, vitamin drips, and mobile service fees.',
    category: 'Educational',
    content: `
<h2>Understanding the Cost of IV Therapy in 2025</h2>
<p>One of the most common questions for first-time patients is about the financial commitment required for IV therapy. While prices can vary based on your location and the specific formula chosen, having a clear understanding of the market rates helps you make an informed decision about your wellness budget.</p>
<p>In 2025, IV therapy has become more accessible than ever, with a range of pricing tiers designed to accommodate everything from a basic hydration boost to premium anti-aging treatments like NAD+ infusions.</p>
<h2>Pricing Tiers for Most Common Drips</h2>
<p>A basic hydration drip, containing saline and essential electrolytes, typically ranges from $75 to $125. For a more comprehensive wellness infusion like a Myers' Cocktail, you should expect to pay between $150 and $225. Premium specialized formulas for athletic recovery or hair and skin health often fall in the $200 to $300 range.</p>
<p>The most expensive treatments are NAD+ infusions, which require longer administration times and higher-cost ingredients. These typically start at $400 and can go up to $800 per session depending on the dosage and clinic location.</p>
<h2>Mobile Service Fees and Premiums</h2>
<p>If you opt for mobile IV therapy, where a nurse comes to your location, you should expect to pay a convenience fee. This usually adds $50 to $100 to the base price of the drip. In major hubs like New York City or Los Angeles, these fees might be slightly higher due to travel time and demand.</p>
<p>It is also worth noting that many clinics offer "Add-ons" such as extra Vitamin B12, Glutathione, or anti-nausea medication. These typically cost an additional $25 to $50 each but allow you to customize the treatment to your specific symptoms.</p>
<h2>How to Save on IV Therapy</h2>
<p>Many regular patients save money by enrolling in monthly memberships or purchasing multi-session packages. A package of five sessions can often reduce the per-drip cost by 15% to 20%. memberships often include one "base" drip per month for a reduced flat fee plus discounts on all add-ons and premium drips.</p>
<p>While insurance rarely covers wellness infusions, some patients are able to use their HSA or FSA funds if the therapy is prescribed for a specific medical condition. Always check with your provider and the clinic for detailed coding on your receipt.</p>
`,
    date: 'April 1, 2025',
    author: 'TheDripMap Team',
    authorRole: 'TheDripMap Editorial',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80'
  },
  {
    slug: 'what-to-expect-first-iv-therapy-session',
    title: 'What to Expect at Your First IV Therapy Session — A Complete Guide',
    metaTitle: 'First IV Therapy Session: What to Expect & Preparation Tips | TheDripMap',
    metaDescription: 'Preparing for your first IV therapy drip? Learn everything from medical intake to the insertion process and post-drip care.',
    category: 'Educational',
    content: `
<h2>Your First IV Therapy Session: A Comprehensive Guide</h2>
<p>Stepping into an IV therapy clinic for the first time can be a mix of excitement and mild apprehension. Understanding exactly what happens during a session helps you relax and enjoy the benefits of the treatment. Most professional clinics are designed to be high-end wellness spaces that feel more like a spa than a doctor's office.</p>
<p>From the initial intake to the final drop, this guide covers everything you need to know to make your first "drip" a success.</p>
<h2>Preparing for Your Infusion</h2>
<p>To get the most out of your session, it is best to arrive well-hydrated. Drinking plenty of water beforehand makes your veins more accessible, which ensures a smoother insertion. It is also a good idea to eat a light snack about an hour before your appointment to keep your blood sugar levels stable during the infusion.</p>
<p>Wear comfortable clothing, ideally with sleeves that can be easily rolled up, as the nurse will need access to either your inner elbow or the back of your hand. Most sessions take between 30 and 60 minutes, so feel free to bring a book, headphones, or a laptop if you'd like to work while you're being treated.</p>
<h2>The Clinical Intake and Insertion</h2>
<p>When you arrive, a licensed medical professional will review your health intake form, check your vitals, and discuss your goals for the day. Once a formula is chosen, the nurse will select a vein and insert a tiny, flexible catheter. You'll feel a quick, sharp pinch for a second, but once the catheter is in place, you shouldn't feel any pain at all.</p>
<p>Reputable clinics use "butterfly" needles or standard catheters that allow for movement, so you can still reach for your phone or a magazine without disrupting the flow of nutrients.</p>
<h2>During and After the Drip</h2>
<p>As the fluid enters your bloodstream, some patients report a slight metallic taste in their mouth or a cooling sensation in their arm—this is completely normal. The nurse will check on you periodically to ensure the drip rate is comfortable. Most patients leave the clinic feeling an immediate sense of refreshment and mental clarity.</p>
<p>After the session, the nurse will remove the catheter and apply a small bandage. You can return to your normal activities immediately. There is no downtime, and you may continue to feel the benefits of the nutrient boost for several days following the treatment.</p>
<h2>Ready for Your First Drip?</h2>
<p>Finding a trustworthy clinic is the first step. Use TheDripMap to browse verified providers with real patient reviews to ensure you get the best medical-grade wellness experience possible.</p>
`,
    date: 'April 1, 2025',
    author: 'TheDripMap Team',
    authorRole: 'TheDripMap Editorial',
    imageUrl: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&q=80'
  }
];
