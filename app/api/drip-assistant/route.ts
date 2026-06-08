import { NextResponse } from 'next/server';
import { buildSystemPrompt, TOOL_SCHEMAS, runTool, type AssistantClinic, type AssistantConfig, type ComparePayload } from '../../../src/lib/drip-assistant';
import { getServiceSupabase } from '../../../src/lib/supabase';
import { getWhitelabelConfig } from '../../../src/lib/whitelabel-configs';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Groq + Llama 3.3 70B. OpenAI-compatible API. Function calling supported.
// Operator needs to set GROQ_API_KEY in Vercel env. Get a free key at
// https://console.groq.com/keys (no card required for the free tier).
const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOOL_ROUNDS = 5;

interface InMsg { role: 'user' | 'assistant'; content: string }
interface Coords { lat: number; lng: number }
/* eslint-disable @typescript-eslint/no-explicit-any */

// Translate the Anthropic-style TOOL_SCHEMAS to OpenAI's tools format.
// Cached at module init.
const GROQ_TOOLS = TOOL_SCHEMAS.map((t: any) => ({
  type: 'function' as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  },
}));

async function callGroq(systemPrompt: string, messages: any[]): Promise<any> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('NO_KEY');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        tools: GROQ_TOOLS,
        tool_choice: 'auto',
        max_tokens: 1024,
        temperature: 0.4,
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Build a white-label AssistantConfig from a clinic slug. Reads the Supabase
// row (for name/phone/booking) and overlays a per-clinic config from
// src/lib/whitelabel-configs.ts (for treatments, menu, hours, copy tweaks).
// Returns null if the slug doesn't map to anything — the caller falls back to
// the public Drip Assistant. Synthetic slugs (e.g. the demo clinic) come from
// the overlay alone — Supabase miss is fine.
async function loadWhitelabelConfig(slug: string | null): Promise<AssistantConfig | null> {
  if (!slug) return null;
  const overlay = getWhitelabelConfig(slug);
  let row: Record<string, unknown> | null = null;
  try {
    const sb = getServiceSupabase();
    const { data } = await sb
      .from('providers')
      .select('name, slug, phone, online_booking_url, working_hours, state')
      .eq('slug', slug)
      .maybeSingle();
    row = (data as Record<string, unknown>) || null;
  } catch {
    // If Supabase is unreachable, an overlay-only config still works.
  }
  if (!row && !overlay) return null;

  const rowName = row?.name as string | undefined;
  const rowPhone = row?.phone as string | undefined;
  const rowBooking = row?.online_booking_url as string | undefined;
  const rowState = row?.state as string | undefined;
  const isCanada = rowState ? /Ontario|British Columbia|Alberta|Quebec|Manitoba|Nova Scotia|Saskatchewan|New Brunswick|Newfoundland|Prince Edward Island|Northwest Territories|Nunavut|Yukon/.test(rowState) : false;

  return {
    clinicName: overlay?.clinicName || rowName || 'Our Clinic',
    clinicSlug: slug,
    treatments: overlay?.treatments,
    menu: overlay?.menu,
    bookingUrl: overlay?.bookingUrl ?? rowBooking ?? null,
    phone: overlay?.phone ?? rowPhone ?? null,
    hours: overlay?.hours,
    currency: isCanada ? 'CAD' : 'USD',
    extraSystemPrompt: overlay?.extraSystemPrompt,
  };
}

export async function POST(req: Request) {
  let body: { messages?: InMsg[]; userCity?: string; userCoords?: Coords; clinicSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (incoming.length === 0) return NextResponse.json({ error: 'No messages.' }, { status: 400 });

  // White-label mode: ?clinic=<slug> on the URL OR clinicSlug in the body OR
  // an x-clinic-slug header. The widget passes whichever is cleanest.
  const url = new URL(req.url);
  const querySlug = url.searchParams.get('clinic');
  const headerSlug = req.headers.get('x-clinic-slug');
  const bodySlug = typeof body.clinicSlug === 'string' ? body.clinicSlug : null;
  const clinicSlug = (querySlug || bodySlug || headerSlug || '').trim().slice(0, 120) || null;
  const whitelabelConfig = clinicSlug ? await loadWhitelabelConfig(clinicSlug) : null;

  // Location grounding — passed from the browser (geolocation and/or stated city).
  const userCity = typeof body.userCity === 'string' && body.userCity.trim() ? body.userCity.trim().slice(0, 80) : null;
  const userCoords =
    body.userCoords && Number.isFinite(body.userCoords.lat) && Number.isFinite(body.userCoords.lng)
      ? { lat: Number(body.userCoords.lat), lng: Number(body.userCoords.lng) }
      : null;

  // Keep the last 12 turns, normalize to OpenAI / Groq format.
  const messages: any[] = incoming
    .slice(-12)
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Expected a user message.' }, { status: 400 });
  }

  // Pull the live clinic count so the system prompt's "N+ listed clinics"
  // phrasing stays accurate as inventory grows. Service-role count(*) on
  // a small index is sub-30ms — cheap relative to the LLM call.
  let clinicCount: number | undefined;
  try {
    const sb = getServiceSupabase();
    const { count } = await sb
      .from('providers')
      .select('id', { count: 'exact', head: true })
      .neq('availability', false);
    if (typeof count === 'number') clinicCount = count;
  } catch {
    // Non-fatal — buildSystemPrompt falls back to neutral phrasing when count is absent.
  }

  const system = buildSystemPrompt(whitelabelConfig || {}, { city: userCity, hasCoords: !!userCoords, clinicCount });
  let lastClinics: AssistantClinic[] = [];
  let lastComparison: ComparePayload | null = null;
  let finalText = '';

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const resp = await callGroq(system, messages);
      const choice = resp?.choices?.[0];
      const assistantMsg = choice?.message;
      const toolCalls: any[] = Array.isArray(assistantMsg?.tool_calls) ? assistantMsg.tool_calls : [];
      const text = typeof assistantMsg?.content === 'string' ? assistantMsg.content : '';

      if (toolCalls.length > 0) {
        // Push the assistant's response (with tool calls) onto the conversation.
        messages.push({
          role: 'assistant',
          content: text || null,
          tool_calls: toolCalls,
        });

        const roundClinics: AssistantClinic[] = [];
        for (const tc of toolCalls) {
          // Groq returns arguments as a JSON string.
          let toolInput: Record<string, unknown> = {};
          try {
            toolInput = typeof tc.function?.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : (tc.function?.arguments || {});
          } catch {
            // If the model produced malformed JSON, treat as empty args.
            toolInput = {};
          }
          // Apply the user's real location to clinic searches so "near me" works
          // and the model can't accidentally search globally. If the model named
          // a specific city, honor it; otherwise prefer precise coordinates and
          // fall back to the known city.
          if (tc.function?.name === 'search_providers' && !toolInput.city) {
            if (userCoords) toolInput.near = userCoords as unknown as Record<string, unknown>;
            else if (userCity) toolInput.city = userCity;
          }
          const outcome = await runTool(tc.function?.name, toolInput as never);
          if (outcome.clinics?.length) roundClinics.push(...outcome.clinics);
          if (outcome.comparison) lastComparison = outcome.comparison;

          // Tool result message
          const resultContent = typeof outcome.forModel === 'string'
            ? outcome.forModel
            : JSON.stringify(outcome.forModel);
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: resultContent,
          });
        }
        if (roundClinics.length) lastClinics = roundClinics;
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

  // In white-label mode, surface the clinic-pinned booking action so the widget
  // can show a persistent BOOK NOW button even when the model hasn't surfaced a
  // clinic card this turn.
  const whitelabelMeta = whitelabelConfig
    ? {
        clinicName: whitelabelConfig.clinicName,
        clinicSlug: whitelabelConfig.clinicSlug,
        bookingUrl: whitelabelConfig.bookingUrl || null,
        phone: whitelabelConfig.phone || null,
      }
    : null;

  return NextResponse.json({ reply: finalText, clinics, whitelabel: whitelabelMeta, comparison: lastComparison });
}
