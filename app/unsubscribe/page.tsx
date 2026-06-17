import type { CSSProperties } from 'react';
import { createClient } from '@supabase/supabase-js';
import { verifyUnsubToken, suppressEmail } from '../../src/lib/outreach-autopilot';

export const dynamic = 'force-dynamic';

// One-click unsubscribe target for the autopilot outreach footer. The link is
// signed (HMAC over the recipient's own address) so only a genuine recipient
// link can suppress, and the write is idempotent.
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string }>;
}) {
  const { e, t } = await searchParams;
  const email = (e || '').trim();
  const token = (t || '').trim();

  let state: 'ok' | 'invalid' | 'error' = 'invalid';
  if (email && token && verifyUnsubToken(email, token)) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await suppressEmail(supabase, email, 'unsubscribe_link');
      state = 'ok';
    } catch {
      state = 'error';
    }
  }

  const wrap: CSSProperties = {
    maxWidth: 520, margin: '12vh auto', padding: '0 24px',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#1f2937', textAlign: 'center',
  };

  return (
    <main style={wrap}>
      <div style={{ fontWeight: 800, fontSize: 20, color: '#0F6E56', marginBottom: 24 }}>TheDripMap</div>
      {state === 'ok' && (
        <>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>You are unsubscribed</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: '#4b5563' }}>
            We will not send any more outreach to <b>{email}</b>. Your public listing stays live either way.
            If this was a mistake, reply to any of our emails and we will add you back.
          </p>
        </>
      )}
      {state === 'invalid' && (
        <>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Link not recognized</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: '#4b5563' }}>
            This unsubscribe link is missing or invalid. You can reply to any of our emails with the word
            unsubscribe and we will remove you right away.
          </p>
        </>
      )}
      {state === 'error' && (
        <>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Something went wrong</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: '#4b5563' }}>
            We could not process that just now. Please reply to any of our emails with the word unsubscribe
            and we will remove you.
          </p>
        </>
      )}
    </main>
  );
}
