# Drip Assistant — White-Label Mode

> Resell the Drip Assistant to a single clinic as their on-site chat concierge.
> One `<script>` tag, under 5 minutes to install, fully branded.

---

## 1. Overview

The **public** Drip Assistant (visible on every page of www.thedripmap.com)
acts as a directory concierge: it searches across ~770 clinics in North
America, distance-ranks results, and recommends verified options.

The **white-label** mode flips that script. When the chat is loaded with a
specific clinic slug, the assistant:

- Identifies itself as that clinic's assistant ("Hi! I'm the chat concierge
  for **Drip & Glow Wellness**…").
- Only discusses that clinic's menu, prices, and hours.
- Never recommends a competitor and never mentions TheDripMap to the user.
- Sends bookings straight to that clinic's booking URL (or phone number).
- Runs the same safety-screening logic on higher-risk treatments.

**Why this exists:** it's the resaleable SKU. A clinic owner pays for a
branded on-site agent that answers FAQs and books appointments 24/7. The
infrastructure (LLM, hosting, prompt engineering, safety screening) is
TheDripMap's; the clinic just provides their menu and brand.

---

## 2. Per-clinic config schema

White-label config lives in two places — Supabase (canonical clinic data)
and a typed overlay file (curated copy).

### Supabase row (`providers` table)

| Field                | Source              | Required for white-label? |
|----------------------|---------------------|----------------------------|
| `slug`               | already exists      | yes (it's the lookup key)  |
| `name`               | already exists      | yes                        |
| `phone`              | already exists      | recommended                |
| `online_booking_url` | added 2026-05-29    | strongly recommended       |
| `working_hours`      | already exists      | optional                   |
| `state`              | already exists      | used to detect CAD vs USD  |

### Overlay (`src/lib/whitelabel-configs.ts`)

```ts
{
  clinicName?: string;        // pretty display name (overrides providers.name)
  clinicLogo?: string;        // logo URL — used in the chat header
  treatments?: string[];      // curated treatment list shown to the model
  menu?: Array<{ name, price?, description? }>; // for "what does X cost"
  bookingUrl?: string;        // overrides providers.online_booking_url
  phone?: string;             // overrides providers.phone
  hours?: string;             // free-text human-readable hours
  tagline?: string;           // shown under the clinic name in the header
  extraSystemPrompt?: string; // verbatim text appended to the prompt
}
```

Anything omitted falls back to the Supabase row. A brand-new white-label
clinic can launch with just an empty `{ tagline: 'IV & Wellness · ...' }`
overlay — the menu/hours/booking URL pull straight from Supabase.

---

## 3. Setup steps (target: under 1 hour)

> Goal: from "clinic owner says yes" to "agent live on their site" in
> well under an hour.

1. **Confirm we have the Supabase row** for this clinic. If not, add it via
   the normal new-provider flow. (5 min)
2. **Set `online_booking_url`** on that row. Either edit in Supabase Studio,
   or add to `scripts/seed-claimed-booking-urls.cjs` and re-run. (2 min)
3. **Add the slug to `src/lib/whitelabel-configs.ts`** with any overlay
   fields you want (tagline, custom treatment list, menu with prices). (5 min)
4. **Test locally**: run `npm run dev`, open
   `http://localhost:3000/embed/clinic-agent?clinic=<slug>`. Verify the
   header shows the clinic name, suggestions are clinic-flavored, and the
   booking link works. (10 min)
5. **Deploy** to production (auto on push to `main`).
6. **Send the clinic owner the install snippet** — see
   `/tools/clinic-agent-install` for the exact `<script>` tag. They paste
   one line into their site's `<head>`. (clinic-side: 5 min)
7. **Verify on their live site.** Open their page, send a few test queries
   ("hours?", "how much is NAD+?", "book an appointment").

Total: ~25 min on our end, ~5 min on theirs.

---

## 4. Where the prompt diverges from the public assistant

| Aspect              | Public                             | White-label                                |
|---------------------|------------------------------------|--------------------------------------------|
| Identity            | "Drip Assistant" for TheDripMap    | The clinic's named concierge               |
| Tools               | Full directory tools enabled       | Tools disabled in-prompt (we don't search) |
| Scope               | All ~770 clinics                   | One clinic only                            |
| Booking             | `book_appointment` tool → button   | Hard-coded link/phone in system prompt     |
| Location            | Asked / geolocation enabled        | N/A — single clinic                        |
| Currency            | Per-clinic auto-detect             | Locked to clinic's country                 |
| Safety screening    | Enabled, filters to verified       | Enabled, redirects to consultation         |
| Mentions of TDM     | Yes (it's their brand)             | Never                                      |
| Mentions of others  | Yes (search across directory)      | Never                                      |

The implementation: `buildSystemPrompt(config, ctx)` in
`src/lib/drip-assistant.ts` checks for `config.clinicName` first. When
present, it calls `buildWhitelabelPrompt(config)` which produces a
completely different system prompt. The TOOL_SCHEMAS array is still passed
to the model, but the prompt instructs it NOT to use them in white-label
mode — instead, give the booking link directly.

---

## 5. Testing the setup

### Locally

```
npm run dev
# Visit the embed page:
open http://localhost:3000/embed/clinic-agent?clinic=drip-and-glow-wellness-toronto
# Or the demo page that wraps it:
open http://localhost:3000/tools/clinic-agent-demo
```

Manual checklist:

- [ ] Chat header shows the clinic name (not "Drip Assistant").
- [ ] Greeting names the clinic.
- [ ] Suggested questions are clinic-flavored ("How much is X?", "Are you
      open this weekend?", "How do I book?").
- [ ] "What treatments do you offer?" returns the menu — not a directory
      search.
- [ ] "How do I book?" returns the booking URL or phone — not a tool call.
- [ ] No mention of "TheDripMap" or competitor clinics in the response.
- [ ] Higher-risk treatments (NAD+, GLP-1) still trigger safety screening.

### On production

Same checklist, but at:
`https://www.thedripmap.com/embed/clinic-agent?clinic=<slug>`

For the install instructions and the demo page, see:
`/tools/clinic-agent-install` and `/tools/clinic-agent-demo`.

---

## 6. Known limitations (v1)

- **Booking URL accuracy.** We rely on the clinic to give us the right
  link. If they switch from JaneApp to Vagaro, we have to update
  `online_booking_url` manually — they can't self-serve yet.
- **Menu freshness.** Same story — the menu is in `whitelabel-configs.ts`,
  not Supabase. v2 should move it to a `menu` JSONB column on `providers`
  so a per-clinic dashboard can edit it.
- **Styling.** The header colour and the launcher button are fixed (TDM
  emerald). v2 should accept a `brandColor` overlay field.
- **No analytics.** We don't track per-clinic chat volume yet. Add a
  `chat_events` table to log per-clinic message counts.
- **iframe sandbox.** The embed loads in a same-origin Next.js page that
  the script-tag shim iframes into the customer's site. v1 doesn't pass
  the parent page URL to the agent — so the chat doesn't know what page
  the user is on. v1.1 should `postMessage` that down.
- **Pricing.** This doc deliberately doesn't quote a price — we're
  pre-revenue and the user has paused public pricing language. Quote
  per-clinic until at least 3 are paying.

---

## Files involved

- `src/lib/drip-assistant.ts` — `buildSystemPrompt` + `buildWhitelabelPrompt`
- `src/lib/whitelabel-configs.ts` — per-clinic overlays
- `app/api/drip-assistant/route.ts` — `?clinic=` / `clinicSlug` / `x-clinic-slug` resolution
- `src/components/DripAssistant.tsx` — header swap, suggestion swap, location-strip hide
- `app/embed/clinic-agent/page.tsx` — public embed page (loaded by the shim)
- `public/clinic-agent.js` — the script-tag shim clinics paste into their site
- `app/tools/clinic-agent-demo/page.tsx` — sales demo using fake clinic
- `app/tools/clinic-agent-install/page.tsx` — install instructions for owners
