import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '../../../../src/lib/admin-auth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
