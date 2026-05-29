import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Reverse-geocode browser coordinates → city/state using OpenStreetMap Nominatim
// (free, no key). Used by the Drip Assistant to label the user's location.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=12`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Nominatim TOS requires a descriptive User-Agent with contact info.
        'User-Agent': 'TheDripMap/1.0 (info@thedripmap.com)',
        'Accept-Language': 'en',
      },
    });
    if (!res.ok) return NextResponse.json({ city: null }, { status: 200 });
    const data = await res.json();
    const a = data?.address || {};
    const city = a.city || a.town || a.village || a.suburb || a.county || null;
    const state = a.state || null;
    return NextResponse.json(
      { city, state },
      { headers: { 'Cache-Control': 'public, max-age=86400' } }
    );
  } catch {
    return NextResponse.json({ city: null }, { status: 200 });
  } finally {
    clearTimeout(timer);
  }
}
