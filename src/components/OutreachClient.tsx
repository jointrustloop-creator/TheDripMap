'use client';

import React, { useEffect, useState } from 'react';

interface BatchRow {
  id: string; to: string; name: string; city: string; band: string; score: number; touch: string; views: number; subject: string; html: string;
}
interface LastSend {
  created_at: string; action: string; actor: string | null; recipient_count: number; recipients: string[] | null; subject: string | null;
}
interface Payload {
  ok: boolean; resendConfigured: boolean; from: string; sendPaused?: boolean; lastSend?: LastSend | null; counts: Record<string, number>; batchSize: number; remaining: number; batch: BatchRow[];
}

export function OutreachClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try {
      const r = await fetch('/api/admin/outreach', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load');
      setData(j);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };
  useEffect(() => { load(); }, []);

  const sendTest = async (realFromQueue = false) => {
    setBusy('test'); setFlash(null);
    try {
      const r = await fetch('/api/admin/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test', testEmail, realFromQueue }) });
      const j = await r.json();
      const who = j.clinic ? ` (real clinic: ${j.clinic.name}, band ${j.clinic.band})` : '';
      setFlash(j.ok ? `Test sent to ${j.to} via ${j.provider}${who}. Subject: "${j.subject}". Check that inbox.` : `Test failed: ${j.error}`);
    } catch (e) { setFlash('Test failed: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(null); }
  };

  const sendBatch = async () => {
    if (!data) return;
    // Confirm dialog that SHOWS what already went out and the exact new batch —
    // the visibility that was missing on 2026-08-11 (batch sent twice).
    const last = data.lastSend;
    const lastLine = last
      ? `LAST BATCH: ${last.recipient_count} sent ${new Date(last.created_at).toLocaleString()} by ${last.actor || 'operator'}.`
      : 'LAST BATCH: none on record.';
    const names = data.batch.slice(0, 5).map((b) => b.name).join(', ');
    const msg = `${lastLine}\n\nTHIS BATCH: ${data.batchSize} clinics — ${names}${data.batchSize > 5 ? ', …' : ''}.\n\nSend these ${data.batchSize} real emails now? This cannot be undone.`;
    if (!confirm(msg)) return;
    setBusy('send'); setFlash(null);
    try {
      const r = await fetch('/api/admin/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send' }) });
      const j = await r.json();
      if (j.paused) setFlash(`Paused — nothing sent. ${j.message || ''}`);
      else setFlash(j.ok ? `Sent ${j.sent}, failed ${j.failed}.` : `Send failed: ${j.error}`);
      await load();
    } catch (e) { setFlash('Send failed: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(null); }
  };

  const fmtLast = (l?: LastSend | null) =>
    l ? `${l.recipient_count} sent ${new Date(l.created_at).toLocaleString()} by ${l.actor || 'operator'}` : 'none on record';

  if (err) return <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-bold">{err}</div>;
  if (!data) return <div className="text-slate-400 font-bold">Loading pending batch…</div>;

  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Score outreach</h1>
      <p className="text-sm text-slate-500 mb-6">Sent via Resend as <b className="text-slate-700">{data.from}</b> (reply-to info@). Never through the Workspace account. Nothing sends until you click. {data.remaining} more clinics queued after this batch.</p>

      {!data.resendConfigured && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm font-bold">
          RESEND_API_KEY is not set in this environment, so sends will fail here. It works on the deployed site where Resend is configured.
        </div>
      )}

      {/* Send-gate visibility: what already went out + the default-paused state. */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last batch sent</div>
          <div className="text-sm font-bold text-slate-900">{fmtLast(data.lastSend)}</div>
          {data.lastSend?.subject && <div className="text-xs text-slate-400 mt-0.5">{data.lastSend.subject}</div>}
        </div>
        <div className={`p-4 rounded-2xl border ${data.sendPaused ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Send status</div>
          <div className={`text-sm font-black ${data.sendPaused ? 'text-rose-700' : 'text-emerald-700'}`}>
            {data.sendPaused ? 'PAUSED (default safe state)' : 'Sending enabled'}
          </div>
          {data.sendPaused && <div className="text-xs text-rose-600/80 mt-0.5">Set OUTREACH_SEND_ENABLED=&apos;true&apos; in Vercel to release a batch.</div>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 text-[11px] font-bold text-slate-500">
        {Object.entries(data.counts).map(([k, v]) => (
          <span key={k} className="bg-white border border-slate-200 rounded-full px-3 py-1">{k.replace(/_/g, ' ')}: <b className="text-slate-900">{v}</b></span>
        ))}
      </div>

      {/* Test send */}
      <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Send one test email to</label>
          <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-wellness-500" />
        </div>
        <button onClick={() => sendTest(false)} disabled={busy !== null || !testEmail} className="bg-slate-200 text-slate-800 px-5 py-2.5 rounded-xl font-black text-sm hover:bg-slate-300 disabled:opacity-50">{busy === 'test' ? 'Sending…' : 'Sample test'}</button>
        <button onClick={() => sendTest(true)} disabled={busy !== null || !testEmail} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-slate-800 disabled:opacity-50">{busy === 'test' ? 'Sending…' : 'Real first-clinic test'}</button>
      </div>

      {flash && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-bold">{flash}</div>}

      {/* Pending batch */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black text-slate-900">Pending batch · {data.batchSize} clinics</h2>
        <button onClick={sendBatch} disabled={busy !== null || data.batchSize === 0 || data.sendPaused} title={data.sendPaused ? 'Sending is paused (OUTREACH_SEND_ENABLED not set)' : undefined} className="bg-wellness-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-wellness-700 disabled:opacity-50">
          {busy === 'send' ? 'Sending…' : data.sendPaused ? 'Sending paused' : `Approve and send this batch (${data.batchSize})`}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
        {data.batch.map((r) => (
          <div key={r.id} className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${r.band === '0-2' ? 'bg-slate-100 text-slate-600' : 'bg-wellness-50 text-wellness-700'}`}>Band {r.band}</span>
              <span className="text-[10px] font-bold text-slate-400">{r.score}/7 · {r.touch} · {r.views} views</span>
              <span className="text-sm font-bold text-slate-900">{r.name}</span>
              <span className="text-xs text-slate-400">{r.to}</span>
              <button onClick={() => setOpen(open === r.id ? null : r.id)} className="ml-auto text-xs font-black text-wellness-700 hover:underline">{open === r.id ? 'Hide' : 'Preview'}</button>
            </div>
            <div className="text-[13px] text-slate-500 mt-1">{r.subject}</div>
            {open === r.id && (
              <div className="mt-3 border border-slate-100 rounded-xl p-4 bg-slate-50" dangerouslySetInnerHTML={{ __html: r.html }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
