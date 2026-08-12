'use client';

import React, { useEffect, useState } from 'react';

interface Draft {
  to: string; city: string | null; priceCity: string; localLine: string | null;
  subject: string; html: string; alreadySent: boolean;
}
interface Example { to: string; city: string | null; priceCity: string; localLine: string | null; subject: string; html: string; }
interface Excluded { email: string; city: string | null; reason: string }
interface LastSend {
  created_at: string; action: string; actor: string | null; recipient_count: number; recipients: string[] | null; subject: string | null;
}
interface Payload {
  ok: boolean; resendConfigured: boolean; from: string; replyTo: string; sendPaused?: boolean; confirmCode?: string; lastSend?: LastSend | null;
  counts: { total: number; clean: number; excluded: number; alreadySent: number };
  examples: Example[]; drafts: Draft[]; excluded: Excluded[];
}

export function NewsletterClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('info@thedripmap.com');
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try {
      const r = await fetch('/api/admin/newsletter', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load');
      setData(j);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };
  useEffect(() => { load(); }, []);

  const sendTest = async () => {
    setBusy('test'); setFlash(null);
    try {
      const r = await fetch('/api/admin/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test', testEmail }) });
      const j = await r.json();
      setFlash(j.ok ? `Test sent to ${j.to} via ${j.provider} (${j.sampleCity || 'sample'} edition). Check that inbox — verify it lands in the primary tab and looks right with images blocked.` : `Test failed: ${j.error}`);
    } catch (e) { setFlash('Test failed: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(null); }
  };

  const fmtLast = (l?: LastSend | null) =>
    l ? `${l.recipient_count} sent ${new Date(l.created_at).toLocaleString()} by ${l.actor || 'operator'}` : 'none on record';

  const sendBatch = async () => {
    if (!data) return;
    const n = data.counts.clean - data.counts.alreadySent;
    const last = data.lastSend;
    const lastLine = last
      ? `LAST SEND: ${last.recipient_count} on ${new Date(last.created_at).toLocaleString()} by ${last.actor || 'operator'}.`
      : 'LAST SEND: none on record.';
    const code = data.confirmCode || '';
    const typed = window.prompt(`${lastLine}\n\nTHIS SEND: ${n} subscribers who have NOT already received this edition.\n\nTo send, type this confirmation code: ${code}`);
    if (typed == null) return; // cancelled
    setBusy('send'); setFlash(null);
    try {
      const r = await fetch('/api/admin/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', confirmCode: typed.trim() }) });
      const j = await r.json();
      if (j.needCode) setFlash(`Not sent — ${j.error}`);
      else if (j.paused) setFlash(`Paused — nothing sent. ${j.message || ''}`);
      else setFlash(j.ok ? `Sent ${j.sent}, failed ${j.failed}, skipped ${j.skippedAlreadySent} already-sent.` : `Send failed: ${j.error}`);
      await load();
    } catch (e) { setFlash('Send failed: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(null); }
  };

  if (err) return <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-bold">{err}</div>;
  if (!data) return <div className="text-slate-400 font-bold">Loading subscribers…</div>;

  const previewBox = (html: string) => (
    <div className="mt-3 border border-slate-100 rounded-xl overflow-hidden bg-white" dangerouslySetInnerHTML={{ __html: html }} />
  );

  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">First-edition newsletter</h1>
      <p className="text-sm text-slate-500 mb-6">Sent via Resend as <b className="text-slate-700">{data.from}</b> (reply-to {data.replyTo}). Never through the Workspace account. Nothing sends until you click.</p>

      {!data.resendConfigured && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm font-bold">
          RESEND_API_KEY is not set in this environment, so sends will fail here. It works on the deployed site where Resend is configured.
        </div>
      )}

      {/* Send-gate visibility: what already went out + the default-paused state. */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last send</div>
          <div className="text-sm font-bold text-slate-900">{fmtLast(data.lastSend)}</div>
        </div>
        <div className={`p-4 rounded-2xl border ${data.sendPaused ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Send status</div>
          <div className={`text-sm font-black ${data.sendPaused ? 'text-rose-700' : 'text-emerald-700'}`}>
            {data.sendPaused ? 'PAUSED (default safe state)' : 'Sending enabled'}
          </div>
          {data.sendPaused && <div className="text-xs text-rose-600/80 mt-0.5">Set NEWSLETTER_SEND_ENABLED=&apos;true&apos; in Vercel to release the batch.</div>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 text-[11px] font-bold text-slate-500">
        <span className="bg-white border border-slate-200 rounded-full px-3 py-1">clean list: <b className="text-emerald-700">{data.counts.clean}</b></span>
        <span className="bg-white border border-slate-200 rounded-full px-3 py-1">excluded: <b className="text-slate-900">{data.counts.excluded}</b></span>
        <span className="bg-white border border-slate-200 rounded-full px-3 py-1">already sent: <b className="text-slate-900">{data.counts.alreadySent}</b></span>
        <span className="bg-white border border-slate-200 rounded-full px-3 py-1">subscribers seen: <b className="text-slate-900">{data.counts.total}</b></span>
      </div>

      {/* Two example renders (Montreal + Halifax) the operator asked to see */}
      {data.examples.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-black text-slate-900 mb-3">Example renders</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.examples.map((ex) => (
              <div key={ex.to} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="text-xs font-black uppercase tracking-widest text-wellness-700 mb-1">{ex.city} subscriber</div>
                <div className="text-[13px] text-slate-500 mb-1">Price card anchors to <b>{ex.priceCity}</b></div>
                <div className="text-[13px] text-slate-600 italic mb-2">{ex.localLine || 'no local line (skipped gracefully)'}</div>
                {previewBox(ex.html)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test send */}
      <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Send one test edition to</label>
          <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="info@thedripmap.com" className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-wellness-500" />
        </div>
        <button onClick={sendTest} disabled={busy !== null || !testEmail} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-slate-800 disabled:opacity-50">{busy === 'test' ? 'Sending…' : 'Send test'}</button>
      </div>

      {flash && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-bold">{flash}</div>}

      {/* Approve + send */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black text-slate-900">Clean subscriber list · {data.counts.clean}</h2>
        <button onClick={sendBatch} disabled={busy !== null || data.counts.clean === 0 || data.sendPaused} title={data.sendPaused ? 'Sending is paused (NEWSLETTER_SEND_ENABLED not set)' : undefined} className="bg-wellness-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-wellness-700 disabled:opacity-50">
          {busy === 'send' ? 'Sending…' : data.sendPaused ? 'Sending paused' : `Approve and send (${data.counts.clean - data.counts.alreadySent})`}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 mb-8">
        {data.drafts.map((d) => (
          <div key={d.to} className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-slate-900">{d.city || 'unknown city'}</span>
              <span className="text-xs text-slate-400">{d.to}</span>
              <span className="text-[10px] font-bold text-slate-400">price → {d.priceCity}</span>
              {d.alreadySent && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">already sent</span>}
              <button onClick={() => setOpen(open === d.to ? null : d.to)} className="ml-auto text-xs font-black text-wellness-700 hover:underline">{open === d.to ? 'Hide' : 'Preview'}</button>
            </div>
            {d.localLine && <div className="text-[12px] text-slate-500 italic mt-1">{d.localLine}</div>}
            {open === d.to && previewBox(d.html)}
          </div>
        ))}
      </div>

      {/* Excluded, for transparency */}
      {data.excluded.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-slate-900 mb-3">Excluded · {data.excluded.length}</h2>
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            {data.excluded.map((x) => (
              <div key={x.email} className="p-3 flex items-center gap-3 flex-wrap text-sm">
                <span className="font-bold text-slate-700">{x.email}</span>
                <span className="text-xs text-slate-400">{x.city || 'no city'}</span>
                <span className="ml-auto text-xs font-bold text-rose-500">{x.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
