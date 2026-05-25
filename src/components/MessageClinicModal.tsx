'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import { Provider } from '../types';

interface MessageClinicModalProps {
  provider: Provider;
  isOpen: boolean;
  onClose: () => void;
}

export const MessageClinicModal = ({ provider, isOpen, onClose }: MessageClinicModalProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName(''); setEmail(''); setPhone(''); setMessage('');
    setIsSuccess(false); setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/message-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: provider.id,
          clinicName: provider.name,
          clinicSlug: provider.slug,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Could not send. Please try again.');
      }
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="fixed inset-0 z-[101] flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-none"
          >
            <div className="bg-white w-full md:max-w-xl rounded-t-[2rem] md:rounded-[2rem] shadow-2xl pointer-events-auto max-h-[92vh] overflow-y-auto">
              {isSuccess ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                    Message sent
                  </h3>
                  <p className="text-slate-500 mb-8 leading-relaxed">
                    We&apos;ve forwarded your message to {provider.name}. Expect a reply within 24 hours.
                  </p>
                  <button
                    onClick={handleClose}
                    className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-6 md:px-8 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 bg-wellness-50 text-wellness-600 rounded-2xl flex items-center justify-center shrink-0">
                        <MessageSquare size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">
                          Message {provider.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 truncate">
                          We&apos;ll forward your message and connect you.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">
                          Your name
                        </label>
                        <input
                          required
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">
                          Email
                        </label>
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">
                        Phone <span className="text-slate-400 font-medium">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">
                        What would you like to ask?
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Hi! I'm interested in NAD+ therapy. What does a session cost and when's your earliest availability?"
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all resize-none font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>

                    {error && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-bold">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !name.trim() || !email.trim() || !message.trim()}
                      className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-base hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Sending…
                        </>
                      ) : (
                        <>
                          Send message <Send size={16} />
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-slate-400 font-medium text-center leading-relaxed">
                      Your message is forwarded directly to {provider.name}. No spam — your email is only used for the clinic&apos;s reply.
                    </p>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
