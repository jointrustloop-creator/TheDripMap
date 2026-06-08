import { NextResponse } from 'next/server';
import { getServiceSupabase } from '../../../src/lib/supabase';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export interface BrandVoiceResult {
  listingDescription: string;
  gbpAbout: string;
  instagramBio: string;
  instagramCaptions: { tone: string; text: string }[];
  welcomeEmail: { subject: string; paragraph: string };
  heroHeadline: string;
  tagline: string;
}

export interface BrandVoiceListing {
  found: boolean;
  claimed: boolean;
  name: string | null;
  slug: string | null;
  city: string | null;
}

const MODEL = 'claude-sonnet-4-6';

function buildPrompt(p: { clinicName: string; city: string; treatments: string[]; vibe: string; patient: string }) {
  return `Write a complete marketing copy kit for an IV therapy clinic.

CLINIC DETAILS
- Name: ${p.clinicName}
- City: ${p.city}
- Top treatments: ${p.treatments.join(', ')}
- Brand vibe: ${p.vibe}
- Ideal patient: ${p.patient}

Match the tone to the brand vibe and speak to the ideal patient. Be specific to the city and treatments. Do NOT invent medical claims, health guarantees, statistics, star ratings, or years in business. Keep it honest, premium, and trustworthy.

Respond with ONLY valid minified JSON (no markdown, no commentary) using exactly these keys:
{
 "listingDescription": "2-3 sentences for a platform listing",
 "gbpAbout": "Google Business Profile About blurb, MAX 250 characters",
 "instagramBio": "Instagram bio, MAX 150 characters, may use 1-2 tasteful emojis",
 "instagramCaptions": [
   {"tone":"educational","text":"a caption that teaches something"},
   {"tone":"promotional","text":"a caption that promotes a treatment/offer"},
   {"tone":"personal","text":"a warm personal-story-angle caption"}
 ],
 "welcomeEmail": {"subject":"new-patient welcome email subject line","paragraph":"first paragraph of the welcome email"},
 "heroHeadline": "one punchy website hero headline",
 "tagline": "brand tagline, MAX 5 words"
}`;
}

async function callClaude(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('NO_KEY');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 50000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: 'You are an expert brand copywriter for medical wellness and IV therapy clinics. You write polished, trustworthy, on-brand copy and never fabricate medical claims, guarantees, or statistics. Respect all character limits. Respond ONLY with valid minified JSON.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Anthropic ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text) throw new Error('Empty response');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function parseResult(text: string): BrandVoiceResult {
  let s = text.trim();
  // Strip code fences if the model added them despite instructions.
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s) as BrandVoiceResult;
}

async function matchClinic(name: string, city: string): Promise<BrandVoiceListing> {
  try {
    const sb = getServiceSupabase();
    let q = sb
      .from('providers')
      .select('name, slug, city, is_featured')
      .ilike('name', `%${name}%`)
      .order('is_featured', { ascending: false })
      .limit(1);
    if (city) q = q.ilike('city', `%${city}%`);
    const { data } = await q;
    const row = (data || [])[0] as { name: string; slug: string | null; city: string | null; is_featured: boolean | null } | undefined;
    if (!row) return { found: false, claimed: false, name: null, slug: null, city: null };
    return { found: true, claimed: !!row.is_featured, name: row.name, slug: row.slug, city: row.city };
  } catch {
    return { found: false, claimed: false, name: null, slug: null, city: null };
  }
}

export async function POST(req: Request) {
  let body: { clinicName?: string; city?: string; treatments?: string[]; vibe?: string; patient?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const clinicName = (body.clinicName || '').trim();
  const city = (body.city || '').trim();
  const treatments = Array.isArray(body.treatments) ? body.treatments.slice(0, 3) : [];
  const vibe = (body.vibe || '').trim();
  const patient = (body.patient || '').trim();
  if (!clinicName || !city || treatments.length === 0 || !vibe || !patient) {
    return NextResponse.json({ error: 'Please complete all five fields.' }, { status: 400 });
  }

  let result: BrandVoiceResult;
  try {
    const text = await callClaude(buildPrompt({ clinicName, city, treatments, vibe, patient }));
    result = parseResult(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'NO_KEY') {
      return NextResponse.json({ error: 'The copy generator isn\'t configured yet (missing API key). Please try again shortly.' }, { status: 503 });
    }
    console.error('brand-voice generate error:', msg);
    return NextResponse.json({ error: 'We couldn\'t generate your copy right now. Please try again.' }, { status: 502 });
  }

  const listing = await matchClinic(clinicName, city);
  return NextResponse.json({ result, listing });
}
