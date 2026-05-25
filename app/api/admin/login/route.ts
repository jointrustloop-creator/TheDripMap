import { NextResponse } from 'next/server';
import { verifyPassword, createAdminCookie } from '../../../../src/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const password = String(data?.password || '');

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Admin not configured. Set ADMIN_PASSWORD env var.' },
        { status: 500 }
      );
    }

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password.' },
        { status: 401 }
      );
    }

    const cookie = createAdminCookie();
    const res = NextResponse.json({ success: true });
    res.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: cookie.maxAge,
    });
    return res;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
