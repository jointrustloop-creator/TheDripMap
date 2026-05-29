'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, ShieldCheck, Star, ArrowRight, Loader2, Mail } from 'lucide-react';

const EMERALD = '#0F6E56';

interface Clinic {
  name: string; slug: string | null; city: string | null; state: string | null;
  rating: number | null; reviews: number | null; verified: boolean; claimed: boolean; mobile: boolean;
}
interface Msg { role: 'user' | 'assistant'; content: string; clinics?: Clinic[]; greeting?: boolean }

const GREETING = 'Hi! I can help you find the right IV therapy or peptide clinic near you — or answer quick questions about treatments. What are you looking for?';

const SUGGESTIONS = [
  'Find a hangover IV near me',
  "What's a Myers Cocktail?",
  'Mobile IV to my hotel',
  'Are peptides safe?',
  'How much does NAD+ cost?',
];

const HIDDEN_PREFIXES = ['/for-clinics', '/resources/clinic-owners', '/tools', '/admin', '/dashboard', '/apply-copy', '/verify-claim'];

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function ClinicMiniCard({ c }: { c: Clinic }) {
  return (
    <Link href={`/providers/${c.slug || slugify(c.name)}`} className="block bg-white rounded-2xl border border-slate-200 p-3 hover:border-emerald-300 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-slate-900 text-sm truncate">{c.name}</div>
          <div className="text-[11px] text-slate-400 truncate">{c.city}{c.state ? `, ${c.state}` : ''}</div>
        </div>
        {c.rating != null && c.rating > 0 && (
          <span className="flex items-center gap-0.5 text-xs font-bold text-slate-700 shrink-0">
            <Star size={11} fill="currentColor" className="text-amber-400" />{c.rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex flex-wrap gap-1">
          {c.verified ? (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full"><ShieldCheck size={9} /> Verified</span>
          ) : c.claimed ? (
            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full">Claimed</span>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100 px-1.5 py-0.5 rounded-full">Unclaimed</span>
          )}
          {c.mobile && <span className="text-[9px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-100 px-1.5 py-0.5 rounded-full">Mobile</span>}
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#0F6E56] shrink-0">View <ArrowRight size={11} /></span>
      </div>
    </Link>
  );
}

export const DripAssistant = () => {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: GREETING, greeting: true }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [msgName, setMsgName] = useState('');
  const [msgEmail, setMsgEmail] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, loading, showMsgForm]);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const sendText = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    const next = [...messages, { role: 'user' as const, content: t }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const payload = next.filter((m) => !m.greeting).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/drip-assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      });
      const data = await res.json();
      if (!res.ok) setMessages((m) => [...m, { role: 'assistant', content: data.error || 'Sorry, something went wrong. Please try again.' }]);
      else setMessages((m) => [...m, { role: 'assistant', content: data.reply, clinics: data.clinics }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'I couldn\'t reach the server — please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (msgSending) return;
    setMsgSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: msgName, email: msgEmail, subject: 'Drip Assistant message', message: msgBody }),
      });
      const data = await res.json();
      if (data.success) {
        setShowMsgForm(false);
        const first = msgName.trim().split(' ')[0];
        setMessages((m) => [...m, { role: 'assistant', content: `Thanks${first ? `, ${first}` : ''}! We've got your message and will reply to ${msgEmail} soon.` }]);
        setMsgName(''); setMsgEmail(''); setMsgBody('');
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, that didn\'t send — please try again or email info@thedripmap.com.' }]);
        setShowMsgForm(false);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Couldn\'t send your message — please try again.' }]);
    } finally {
      setMsgSending(false);
    }
  };

  const onlyGreeting = messages.length === 1;

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open Drip Assistant"
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 text-white pl-4 pr-5 py-3.5 rounded-full shadow-2xl shadow-emerald-900/30 hover:scale-105 active:scale-95 transition-transform"
          style={{ backgroundColor: EMERALD }}>
          <MessageCircle size={20} />
          <span className="font-black text-sm">Drip Assistant</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-[60] w-[calc(100vw-2.5rem)] max-w-[390px] h-[min(74vh,640px)] bg-white rounded-3xl shadow-2xl shadow-slate-900/25 border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 text-white shrink-0" style={{ backgroundColor: EMERALD }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center"><ShieldCheck size={16} /></div>
              <div>
                <div className="font-black text-sm leading-tight">Drip Assistant</div>
                <div className="text-[10px] text-emerald-50/80 leading-tight">Find a clinic · ask anything</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"><X size={18} /></button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F8F7F3]">
            {messages.map((m, i) => (
              <div key={i}>
                <div className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user' ? 'text-white rounded-br-md' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-md'
                  }`} style={m.role === 'user' ? { backgroundColor: EMERALD } : undefined}>
                    {m.content}
                  </div>
                </div>
                {m.clinics && m.clinics.length > 0 && (
                  <div className="mt-2 space-y-2">{m.clinics.map((c) => <ClinicMiniCard key={c.slug || c.name} c={c} />)}</div>
                )}
              </div>
            ))}

            {/* Suggested questions — shown before the conversation starts */}
            {onlyGreeting && !showMsgForm && !loading && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => sendText(s)}
                    className="text-left text-xs font-bold text-[#0F6E56] bg-white border border-emerald-200 rounded-full px-3 py-1.5 hover:bg-emerald-50 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 size={14} className="animate-spin" /> thinking…
                </div>
              </div>
            )}

            {/* Leave-a-message form */}
            {showMsgForm && (
              <form onSubmit={submitMessage} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Leave us a message</span>
                  <button type="button" onClick={() => setShowMsgForm(false)} className="text-slate-300 hover:text-slate-500"><X size={15} /></button>
                </div>
                <input required value={msgName} onChange={(e) => setMsgName(e.target.value)} placeholder="Your name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-emerald-500" />
                <input required type="email" value={msgEmail} onChange={(e) => setMsgEmail(e.target.value)} placeholder="Your email"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-emerald-500" />
                <textarea required value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="How can we help?" rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-emerald-500 resize-none" />
                <button type="submit" disabled={msgSending}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-white text-sm disabled:opacity-60" style={{ backgroundColor: EMERALD }}>
                  {msgSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send message
                </button>
              </form>
            )}
          </div>

          {/* Input + leave-a-message toggle */}
          {!showMsgForm && (
            <>
              <form onSubmit={(e) => { e.preventDefault(); sendText(input); }} className="px-3 pt-3 border-t border-slate-100 bg-white shrink-0 flex items-center gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask or type your city…"
                  className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500" />
                <button type="submit" disabled={loading || !input.trim()} aria-label="Send"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-50 transition-opacity" style={{ backgroundColor: EMERALD }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
              <button onClick={() => setShowMsgForm(true)} className="bg-white pb-3 pt-1.5 text-[11px] font-bold text-slate-400 hover:text-[#0F6E56] inline-flex items-center justify-center gap-1.5 transition-colors">
                <Mail size={12} /> Prefer to leave a message?
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};
