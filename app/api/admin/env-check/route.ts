import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';

// Admin-only diagnostic. Returns presence + fingerprint of env vars
// (length + first/last few chars). Never returns the full secret.
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fingerprint = (key: string) => {
    const v = process.env[key];
    if (!v) return { set: false };
    return {
      set: true,
      length: v.length,
      starts: v.slice(0, 12) + '…',
      ends: '…' + v.slice(-8),
    };
  };

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: fingerprint('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: fingerprint('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: fingerprint('SUPABASE_SERVICE_ROLE_KEY'),
    ADMIN_PASSWORD: fingerprint('ADMIN_PASSWORD'),
    RESEND_API_KEY: fingerprint('RESEND_API_KEY'),
  });
}
