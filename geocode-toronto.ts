
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function geocode(address: string, city: string, state: string) {
  const query = encodeURIComponent(`${address}, ${city}, ${state}`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TheDripMap-Geocoding-Utility' }
    });
    const data = await response.json() as any;
    if (data && Array.isArray(data) && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
}

async function fixToronto() {
  console.log('Fetching Toronto providers...');
  const { data: allProviders, error } = await supabase
    .from('providers')
    .select('id, name, address, city, state, latitude, longitude')
    .eq('city', 'Toronto');

  if (error) {
    console.error('Error fetching providers:', error);
    return;
  }

  const providers = (allProviders || []).filter(p => !p.latitude || !p.longitude);

  if (providers.length === 0) {
    console.log('No Toronto providers found missing coordinates in the set of ' + (allProviders?.length || 0));
    return;
  }

  console.log(`Found ${providers.length} providers missing coordinates. Starting geocoding...`);

  for (const provider of providers) {
    const coords = await geocode(provider.address, provider.city, provider.state);
    if (coords) {
      const { error } = await supabase
        .from('providers')
        .update({
          latitude: coords.lat,
          longitude: coords.lng
        })
        .eq('id', provider.id);

      if (error) {
        console.error(`Failed to update ${provider.name}:`, error);
      } else {
        console.log(`✅ Updated ${provider.name} -> [${coords.lat}, ${coords.lng}]`);
      }
    } else {
      console.log(`❌ Could not find coordinates for ${provider.name} at ${provider.address}`);
    }
    // Respect Nominatim 1 request per second policy
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

fixToronto();
