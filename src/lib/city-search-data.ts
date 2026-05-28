// Per-city monthly Google search demand for "iv therapy [city]" and related
// terms. Real figures used across the SEO audit tool and the listing audit.
// Cities not listed default to a conservative 30/mo floor.
export const CITY_SEARCHES: Record<string, number> = {
  houston: 604, 'new york': 450, toronto: 350, clearwater: 300, 'san francisco': 280,
  'san carlos': 181, 'san ramon': 141, 'del mar': 136, 'rochester hills': 123, miami: 110,
  'la jolla': 100, chicago: 80, 'los angeles': 80, 'san diego': 75, vancouver: 70,
  montreal: 65, ottawa: 60, calgary: 60, mississauga: 55, tampa: 50, 'washington dc': 50,
  'washington': 50, fairfax: 45, fresno: 40, 'san jose': 40, glendale: 35, edmonton: 30,
  winnipeg: 25, austin: 25, denver: 25, nashville: 20, oakville: 20, 'las vegas': 90,
  atlanta: 70, boston: 65, dallas: 90, philadelphia: 60, phoenix: 70,
};

export const CITY_SEARCH_FLOOR = 30;

export function getCitySearches(city: string | null | undefined): number {
  if (!city) return CITY_SEARCH_FLOOR;
  return CITY_SEARCHES[city.trim().toLowerCase()] ?? CITY_SEARCH_FLOOR;
}

// A friendly list for the city autocomplete on the audit form.
export const AUDIT_CITY_SUGGESTIONS: string[] = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'Austin', 'San Francisco', 'San Jose',
  'Miami', 'Tampa', 'Clearwater', 'Atlanta', 'Boston', 'Las Vegas', 'Denver',
  'Nashville', 'Washington DC', 'Toronto', 'Vancouver', 'Montreal', 'Calgary',
  'Ottawa', 'Edmonton', 'Mississauga',
];
