export interface ActiveCity {
  name: string;
  state: string;
  stateCode: string;
  country: string;
  slug: string;
}

export const ACTIVE_CITIES: ActiveCity[] = [
  { name: 'San Francisco', state: 'California', stateCode: 'CA', country: 'US', slug: 'san-francisco' },
  { name: 'Las Vegas', state: 'Nevada', stateCode: 'NV', country: 'US', slug: 'las-vegas' },
  { name: 'San Diego', state: 'California', stateCode: 'CA', country: 'US', slug: 'san-diego' },
  { name: 'Fresno', state: 'California', stateCode: 'CA', country: 'US', slug: 'fresno' },
  { name: 'San Jose', state: 'California', stateCode: 'CA', country: 'US', slug: 'san-jose' },
  { name: 'Peoria', state: 'Illinois', stateCode: 'IL', country: 'US', slug: 'peoria' },
  { name: 'Los Banos', state: 'California', stateCode: 'CA', country: 'US', slug: 'los-banos' },
  { name: 'Chicago', state: 'Illinois', stateCode: 'IL', country: 'US', slug: 'chicago' },
  { name: 'New York', state: 'New York', stateCode: 'NY', country: 'US', slug: 'new-york' },
  { name: 'Los Angeles', state: 'California', stateCode: 'CA', country: 'US', slug: 'los-angeles' },
  { name: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI', country: 'US', slug: 'milwaukee' },
  { name: 'Green Bay', state: 'Wisconsin', stateCode: 'WI', country: 'US', slug: 'green-bay' },
];
