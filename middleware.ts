/**
 * Admin gate middleware.
 *
 * Per the 2026-06-09 operator instruction: every /admin/* page and every
 * /api/admin/* route is password-protected behind a signed cookie, with
 * the exception of the login / logout endpoints themselves. The
 * Authorization: Bearer ${CRON_SECRET} header continues to work for
 * programmatic / curl callers (cron, scripts) so the existing admin
 * automation does not break.
 *
 * Runtime: Edge (default). Node's `crypto.createHmac` is replaced with
 * SubtleCrypto so this works in the Edge runtime. The HMAC scheme is
 * the SAME as src/lib/admin-auth.ts: HMAC-SHA-256(timestamp, ADMIN_PASSWORD),
 * cookie value is `<timestamp>.<hex>`, 7-day expiry.
 */
import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = 'tdm_admin';
const MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000;

// Paths under /admin or /api/admin that are publicly reachable so the
// operator can log in / log out. Anything else is gated.
const PUBLIC_ALLOWLIST = new Set<string>([
  '/admin/login',
  '/api/admin/login',
  '/api/admin/logout',
]);

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return r === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(sig);
}

async function verifyAdminCookieValue(value: string | undefined, password: string): Promise<boolean> {
  if (!value || !password) return false;
  const parts = value.split('.');
  if (parts.length !== 2) return false;
  const [timestampStr, signature] = parts;
  const timestamp = Number(timestampStr);
  if (!Number.isFinite(timestamp)) return false;
  if (Date.now() - timestamp > MAX_AGE_MS) return false;
  try {
    const expected = await hmacSha256Hex(password, timestampStr);
    return timingSafeEqual(signature, expected);
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login / logout endpoints through.
  if (PUBLIC_ALLOWLIST.has(pathname)) {
    return NextResponse.next();
  }

  // Bearer CRON_SECRET continues to work for programmatic callers (cron,
  // scripts using curl). This keeps the existing automation operational.
  const auth = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) {
    return NextResponse.next();
  }

  // Cookie-based gate. Verify the HMAC against ADMIN_PASSWORD.
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    // Misconfigured deploy. Better to fail closed than silently allow.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'ADMIN_PASSWORD not configured' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/admin/login?error=misconfigured', req.url));
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const ok = await verifyAdminCookieValue(cookie, adminPassword);
  if (ok) return NextResponse.next();

  // Unauthorized. API routes return 401 JSON; HTML pages redirect to login.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const loginUrl = new URL('/admin/login', req.url);
  loginUrl.searchParams.set('next', pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
