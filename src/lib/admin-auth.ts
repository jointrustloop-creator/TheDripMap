import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'tdm_admin';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error('ADMIN_PASSWORD env var is not set');
  }
  return secret;
}

function signToken(timestamp: number): string {
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update(String(timestamp));
  return hmac.digest('hex');
}

export function createAdminCookie(): { name: string; value: string; maxAge: number } {
  const now = Date.now();
  const value = `${now}.${signToken(now)}`;
  return { name: COOKIE_NAME, value, maxAge: MAX_AGE_SECONDS };
}

export function verifyAdminCookieValue(value: string | undefined): boolean {
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 2) return false;
  const [timestampStr, signature] = parts;
  const timestamp = Number(timestampStr);
  if (!Number.isFinite(timestamp)) return false;
  // Reject older than max age
  if (Date.now() - timestamp > MAX_AGE_SECONDS * 1000) return false;
  let expected: string;
  try {
    expected = signToken(timestamp);
  } catch {
    return false;
  }
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function isAdminRequest(): Promise<boolean> {
  try {
    const store = await cookies();
    const c = store.get(COOKIE_NAME);
    return verifyAdminCookieValue(c?.value);
  } catch {
    return false;
  }
}

export function verifyPassword(password: string): boolean {
  if (!password) return false;
  const expected = getSecret();
  if (password.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expected));
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
