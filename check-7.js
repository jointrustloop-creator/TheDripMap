import { searchListings } from './src/lib/data';

async function check7() {
  const results = await searchListings('chicago');
  results.forEach(r => console.log(`${r.name} | ${r.city}`));
}

check7();
