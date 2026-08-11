'use client';

import React, { useEffect, useState } from 'react';

interface Claim {
  id: string; email: string; owner_name: string | null; listing_id: string | null;
  created_at: string; expires_at: string; clinicName: string | null; city: string | null;
  country: string | null; slug: string | null; expired: boolean; daysPending: number;
}

export function ClaimsClient() {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try {
      const r = await fetch('/api/admin/claim-action', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load');
      setClaims(j.claims);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };
  useEffect(() => { load(); }, []);

  const act = async (claim: Claim, action: 'resend' | 'verify') => {
    if (action === 'verify' && !confirm(`Verify the claim for ${claim.clinicName || claim.email} now? This marks the listing claimed and emails the owner their finish link. Only do this for a legitimate owner.`)) return;
    setBusy(claim.id + action); setFlash(null);
    try {
      const r = await fetch('/api/admin/claim-action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, claim_request_id: claim.id }),
      });
      const j = await r.json();
      if (action === 'resend') {
        setFlash(j.ok ? `Verification email re-sent to ${j.to}.` : `Resend failed: ${j.error}`);
      } else {
        setFlash(j.ok ? `Verified ${j.clinicName}. Listing is now claimed and live.` : `Verify failed: ${j.error}`);
      }
      await load();
    } catch (e) { setFlash('Action failed: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(null); }
  };

  if (err) return <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-bold">{err}</div>;
  if (!claims) return <div className="text-slate-400 font-bold">Loading pending claims…</div>;

  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Claim requests</h1>
      <p className="text-sm text-slate-500 mb-6">{claims.length} pending. Resend a stuck owner their verification email, or verify a legitimate claim yourself. No terminal needed.</p>

      {flash && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-bold">{flash}</div>}

      {claims.length === 0 ? (
        <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 font-bold">No pending claims. All caught up.</div>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => {
            const isUS = (c.country || '').toLowerCase().startsWith('united');
            return (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-slate-900">{c.clinicName || '(no listing)'}</span>
                      {c.city && <span className="text-xs font-bold text-slate-400">{c.city}{c.country ? `, ${c.country}` : ''}</span>}
                      {isUS && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">US · paused</span>}
                      {c.expired && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">token expired</span>}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">{c.owner_name ? `${c.owner_name} · ` : ''}{c.email}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Pending {c.daysPending} day{c.daysPending === 1 ? '' : 's'} · since {c.created_at.slice(0, 10)}{c.slug ? <> · <a href={`/providers/${c.slug}`} target="_blank" rel="noopener noreferrer" className="text-wellness-700 font-bold hover:underline">view listing</a></> : null}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => act(c, 'resend')}
                      disabled={busy !== null || c.expired}
                      title={c.expired ? 'Token expired; owner must submit a new claim' : 'Re-send the verification email to the owner'}
                      className="bg-slate-200 text-slate-800 px-4 py-2 rounded-xl font-black text-xs hover:bg-slate-300 disabled:opacity-40"
                    >
                      {busy === c.id + 'resend' ? 'Sending…' : 'Resend verification'}
                    </button>
                    <button
                      onClick={() => act(c, 'verify')}
                      disabled={busy !== null || c.expired}
                      title={c.expired ? 'Token expired; owner must submit a new claim' : 'Mark this claim verified now'}
                      className="bg-wellness-600 text-white px-4 py-2 rounded-xl font-black text-xs hover:bg-wellness-700 disabled:opacity-40"
                    >
                      {busy === c.id + 'verify' ? 'Verifying…' : 'Verify claim'}
                    </button>
                  </div>
                </div>
                {isUS && <div className="mt-3 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">US clinic during the market pause. Leave frozen unless you have a specific reason to verify.</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
