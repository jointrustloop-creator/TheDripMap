// Curated city photo URLs for the /cities directory page card backgrounds.
//
// Photos are hot-linked from Unsplash's CDN (allowed by Unsplash Terms with
// attribution somewhere on the page — see footer / about page disclosure).
//
// Cities not in this map get a deterministic gradient + initial overlay
// (see getCityGradient below).

export const CITY_PHOTOS: Record<string, string> = {
  // Populated by scripts/curate-city-photos.js (sub-agent research).
  // Initial empty — the gradient fallback covers every city until real
  // photos are added.
};

export function getCityPhoto(slug: string): string | null {
  return CITY_PHOTOS[slug] || null;
}

// 12 hand-picked gradient pairs that look great as card backgrounds.
// Picked from-warm to from-cool so adjacent cities in the grid feel varied.
const GRADIENTS: [string, string][] = [
  ['from-rose-500', 'to-orange-500'],
  ['from-orange-500', 'to-amber-500'],
  ['from-amber-500', 'to-yellow-400'],
  ['from-emerald-500', 'to-teal-500'],
  ['from-teal-500', 'to-cyan-500'],
  ['from-cyan-500', 'to-sky-500'],
  ['from-sky-500', 'to-indigo-500'],
  ['from-indigo-500', 'to-violet-500'],
  ['from-violet-500', 'to-fuchsia-500'],
  ['from-fuchsia-500', 'to-pink-500'],
  ['from-pink-500', 'to-rose-500'],
  ['from-slate-700', 'to-slate-900'],
];

// Deterministic hash → gradient. Same city always gets the same gradient
// across rebuilds so the page looks stable.
function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getCityGradient(slug: string): string {
  const [from, to] = GRADIENTS[hashSlug(slug) % GRADIENTS.length];
  return `bg-gradient-to-br ${from} ${to}`;
}

export function getCityInitial(name: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
