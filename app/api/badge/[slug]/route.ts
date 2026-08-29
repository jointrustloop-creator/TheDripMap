/**
 * GET /api/badge/[slug] — the embeddable clinic badge (PLAN-5, 2026-08-28).
 *
 * Returns an SVG whose content reflects the clinic's LIVE status through
 * isSafetyVerified(), the same single gate the site renders with. Three
 * states, in strict integrity order:
 *
 *   1. safety-verified  -> "Safety Verified" (green). Only when the operator-
 *      approved badge is active and unexpired. A revoked or expired badge
 *      falls to state 2 on clinic websites within the cache hour.
 *   2. verified-listing -> "Verified Listing" (claimed, owner-confirmed).
 *   3. listed           -> "Find us on TheDripMap" (anything else, including
 *      unknown slugs — never an error image, never a verification claim).
 *
 * WHY: every clinic that pastes the snippet gives the site a followed
 * backlink from a real Canadian clinic domain, and shows our name to every
 * patient on their site. The badge is free for claimed clinics; the trust
 * states are earned, never bought.
 *
 * Cache: CDN 1 hour + stale-while-revalidate. Status changes (approval,
 * revocation, expiry) propagate without redeploys.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isSafetyVerified } from '../../../../src/lib/safety';

export const dynamic = 'force-dynamic';

type BadgeState = 'safety-verified' | 'verified-listing' | 'listed';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 240x56, self-contained, no external fonts (system stack renders everywhere).
function badgeSvg(state: BadgeState): string {
  const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const shield =
    'M12 3l7 3v5c0 4.4-3 8.4-7 9.5C8 19.4 5 15.4 5 11V6l7-3z';
  const check = 'M9 11.5l2.2 2.2L15.5 9';

  if (state === 'safety-verified') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="56" viewBox="0 0 240 56" role="img" aria-label="Safety Verified on TheDripMap">
<rect width="240" height="56" rx="14" fill="#0F6E56"/>
<g transform="translate(14,16)">
<path d="${shield}" fill="none" stroke="#FFFFFF" stroke-width="1.8" transform="scale(1.0)"/>
<path d="${check}" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<text x="48" y="26" font-family="${FONT}" font-size="14" font-weight="800" fill="#FFFFFF" letter-spacing="0.4">Safety Verified</text>
<text x="48" y="42" font-family="${FONT}" font-size="11" font-weight="600" fill="#BCE0D3">on TheDripMap, human-reviewed</text>
</svg>`;
  }
  if (state === 'verified-listing') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="56" viewBox="0 0 240 56" role="img" aria-label="Verified listing on TheDripMap">
<rect x="1" y="1" width="238" height="54" rx="14" fill="#FFFFFF" stroke="#0F6E56" stroke-width="2"/>
<g transform="translate(14,16)">
<path d="${shield}" fill="none" stroke="#0F6E56" stroke-width="1.8"/>
<path d="${check}" fill="none" stroke="#0F6E56" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<text x="48" y="26" font-family="${FONT}" font-size="14" font-weight="800" fill="#0F6E56" letter-spacing="0.4">Verified Listing</text>
<text x="48" y="42" font-family="${FONT}" font-size="11" font-weight="600" fill="#6E837B">on TheDripMap, owner-confirmed</text>
</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="56" viewBox="0 0 240 56" role="img" aria-label="Find us on TheDripMap">
<rect x="1" y="1" width="238" height="54" rx="14" fill="#FFFFFF" stroke="#D5E3DD" stroke-width="2"/>
<g transform="translate(14,16)">
<path d="${shield}" fill="none" stroke="#6E837B" stroke-width="1.8"/>
</g>
<text x="48" y="26" font-family="${FONT}" font-size="14" font-weight="800" fill="#1A2B26" letter-spacing="0.4">Find us on</text>
<text x="48" y="42" font-family="${FONT}" font-size="12" font-weight="700" fill="#0F6E56">TheDripMap.com</text>
</svg>`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  let state: BadgeState = 'listed';
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: p } = await sb
      .from('providers')
      .select('is_claimed, is_hidden, safety_verified, safety_review_status, decision_drivers')
      .eq('slug', String(slug || '').slice(0, 120))
      .maybeSingle();
    if (p && !p.is_hidden) {
      if (isSafetyVerified(p)) state = 'safety-verified';
      else if (p.is_claimed === true) state = 'verified-listing';
    }
  } catch {
    /* fall through to the neutral badge — never an error image */
  }

  return new NextResponse(badgeSvg(state), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // 1h CDN cache: revocations and approvals propagate within the hour.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400, max-age=3600',
      'X-Badge-State': esc(state),
    },
  });
}
