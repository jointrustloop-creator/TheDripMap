'use client';

import React, { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch('/api/admin/clinic-owner-pains-refresh', { method: 'POST' });
      const data = await r.json();
      if (!r.ok) setMsg('Refresh failed: ' + (data.error || r.status));
      else setMsg('Refresh complete. Reload the page to see the new content.');
    } catch (err) {
      setMsg('Refresh failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-black transition-all"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        Refresh research
      </button>
      {msg && <p className="text-xs text-slate-500 font-medium">{msg}</p>}
    </div>
  );
}
