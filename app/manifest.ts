import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Drip Map',
    short_name: 'DripMap',
    description: 'Find and compare the best IV therapy clinics near you.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    // Brand green sampled from the official logo (#78AA50).
    theme_color: '#78AA50',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
