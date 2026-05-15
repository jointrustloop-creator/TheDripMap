import { Provider, BlogPost } from '../types';

export const MOCK_CITIES: { city: string, state: string }[] = [];

export const MOCK_LISTINGS: Provider[] = [];

export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    title: 'The Benefits of NAD+ IV Therapy for Longevity',
    slug: 'benefits-of-nad-plus-iv-therapy',
    excerpt: 'Discover how NAD+ IV therapy can boost cellular health and promote longevity.',
    content: 'NAD+ (Nicotinamide Adenine Dinucleotide) is a critical coenzyme found in every cell of your body...',
    author: 'TheDripMap Team',
    date: '2024-03-15',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80',
    category: 'Treatment Guides',
    metaTitle: 'Benefits of NAD+ IV Therapy | TheDripMap',
    metaDescription: 'Learn about the anti-aging and cellular benefits of NAD+ infusion therapy.',
    relatedCities: ['Toronto', 'New York', 'Los Angeles'],
    relatedClinics: []
  },
  {
    title: 'How IV Hydration Helps with Athletic Recovery',
    slug: 'iv-hydration-for-athletic-recovery',
    excerpt: 'Learn why top athletes incorporate IV hydration into their post-workout routines.',
    content: 'For athletes, recovery is just as important as training. IV hydration provides rapid replenishment...',
    author: 'TheDripMap Team',
    date: '2024-02-28',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    category: 'Lifestyle & Wellness',
    metaTitle: 'Athletic Recovery with IV Hydration | TheDripMap',
    metaDescription: 'Discover how IV therapy speeds up recovery and reduces muscle soreness after intense exercise.',
    relatedCities: ['Austin', 'Chicago', 'Miami'],
    relatedClinics: []
  },
  {
    title: 'IV Therapy for Migraines: A Fast-Acting Solution',
    slug: 'iv-therapy-for-migraines',
    excerpt: 'Relieve migraine symptoms quickly with targeted IV nutrient therapy.',
    content: 'Migraines can be debilitating, but targeted IV therapy can provide fast-acting relief...',
    author: 'TheDripMap Team',
    date: '2024-02-10',
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
    category: 'Conditions & Symptoms',
    metaTitle: 'Migraine Relief with IV Therapy | TheDripMap',
    metaDescription: 'Find out how IV therapy can help alleviate migraine symptoms faster than traditional oral medications.',
    relatedCities: ['Seattle', 'Boston', 'Denver'],
    relatedClinics: []
  }
];
