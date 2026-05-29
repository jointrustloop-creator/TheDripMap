import { NextResponse } from 'next/server';
import { buildSystemPrompt, TOOL_SCHEMAS, runTool, type AssistantClinic } from '../../../src/lib/drip-assistant';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOOL_ROUNDS = 5;

interface InMsg { role: 'user' | 'assistant'; content: string }
interface Coords { lat: number; lng: number }
/* eslint-disable @typescript-eslint/no-explicit-any */

async function callAnthropic(system: string, messages: any[]): Promise<any> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('NO_KEY');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 512, system, tools: TOOL_SCHEMAS, messages }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  let body: { messages?: InMsg[]; userCity?: string; userCoords?: Coords };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (incoming.length === 0) return NextResponse.json({ error: 'No messages.' }, { status: 400 });

  // Location grounding — passed from the browser (geolocation and/or stated city).
  const userCity = typeof body.userCity === 'string' && body.userCity.trim() ? body.userCity.trim().slice(0, 80) : null;
  const userCoords =
    body.userCoords && Number.isFinite(body.userCoords.lat) && Number.isFinite(body.userCoords.lng)
      ? { lat: Number(body.userCoords.lat), lng: Number(body.userCoords.lng) }
      : null;

  // Keep the last 12 turns, normalize to Anthropic format.
  const messages: any[] = incoming
    .slice(-12)
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Expected a user message.' }, { status: 400 });
  }

  const system = buildSystemPrompt({}, { city: userCity, hasCoords: !!userCoords });
  let lastClinics: AssistantClinic[] = [];
  let finalText = '';

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const resp = await callAnthropic(system, messages);
      const content: any[] = resp?.content || [];
      const toolUses = content.filter((b) => b.type === 'tool_use');
      const text = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();

      if (resp?.stop_reason === 'tool_use' && toolUses.length) {
        messages.push({ role: 'assistant', content });
        const roundClinics: AssistantClinic[] = [];
        const toolResults: any[] = [];
        for (const tu of toolUses) {
          const toolInput = { ...((tu.input || {}) as Record<string, unknown>) };
          // Apply the user's real location to clinic searches so "near me" works
          // and the model can't accidentally search globally. If the model named a
          // specific city, honor it; otherwise prefer precise coordinates (true
          // distance ranking, incl. nearby suburbs) and fall back to the known city.
          if (tu.name === 'search_providers' && !toolInput.city) {
            if (userCoords) toolInput.near = userCoords;
            else if (userCity) toolInput.city = userCity;
          }
          const outcome = await runTool(tu.name, toolInput);
          if (outcome.clinics?.length) roundClinics.push(...outcome.clinics);
          toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: outcome.forModel });
        }
        if (roundClinics.length) lastClinics = roundClinics;
        messages.push({ role: 'user', content: toolResults });
        continue;
      }

      finalText = text;
      break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'NO_KEY') {
      return NextResponse.json({ error: 'The assistant isn\'t configured yet. Please try again shortly, or browse clinics directly.' }, { status: 503 });
    }
    console.error('drip-assistant error:', msg);
    return NextResponse.json({ error: 'I hit a snag — please try again in a moment.' }, { status: 502 });
  }

  if (!finalText) {
    finalText = 'Sorry, I couldn\'t pull that together. Try rephrasing, or browse clinics in your city from the search page.';
  }

  // Dedupe clinic cards by slug/name.
  const seen = new Set<string>();
  const clinics = lastClinics.filter((c) => {
    const k = (c.slug || c.name).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 4);

  return NextResponse.json({ reply: finalText, clinics });
}
