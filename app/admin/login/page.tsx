'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin/testimonials';

  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Login failed.');
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <div className="w-12 h-12 mx-auto mb-6 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
          <Lock size={20} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">
          Admin login
        </h1>
        <p className="text-sm text-slate-500 text-center mb-8">
          Restricted to TheDripMap operators.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
          />
          {error && (
            <div className="px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-bold">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
