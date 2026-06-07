'use client';

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SmartSummaryProps {
  reviews: { text: string }[];
  clinicName: string;
}

export default function SmartSummary({ reviews, clinicName }: SmartSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateSummary() {
      if (!reviews || reviews.length === 0) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('Missing Gemini API Key');
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Combine a few reviews (up to 5 for speed and context)
        const reviewText = reviews
          .slice(0, 5)
          .map(r => r.text)
          .join('\n---\n');

        const prompt = `
          You are a medical matching platform expert. I am providing you with customer reviews for an IV therapy clinic called "${clinicName}".
          
          Based on these reviews, write a 2-sentence "The Bottom Line" summary.
          The first sentence should highlight the primary strength (e.g. mobile speed, luxury ambiance, specific drip effectiveness).
          The second sentence should mention a minor caveat or a specific detail that differentiates them.
          
          Keep it professional, honest, and concise. No fluff or superlatives like "amazing" unless repeatedly cited by patients.
          
          REVIEWS:
          ${reviewText}
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-preview",
          contents: prompt,
        });

        const text = response.text;
        if (text) {
          setSummary(text.trim());
        }
      } catch (err) {
        console.error('Error generating AI summary:', err);
        setError('Could not generate summary at this time.');
      } finally {
        setIsLoading(false);
      }
    }

    generateSummary();
  }, [reviews, clinicName]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 relative overflow-hidden mb-8">
      {/* Background Decor */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-wellness-100/50 rounded-full blur-2xl" />
      
      <div className="flex items-center gap-2 mb-4 text-wellness-600">
        <Sparkles size={18} />
        <span className="text-xs font-black uppercase tracking-widest">AI &quot;The Bottom Line&quot; Summary</span>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 text-slate-400 py-2"
          >
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Analyzing verified patient feedback...</span>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-slate-400 py-2"
          >
            <Info size={18} />
            <span className="text-sm">{error}</span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-slate-700 leading-relaxed font-medium">
              {summary}
            </p>
            <div className="pt-4 border-t border-slate-200/50 text-[10px] text-slate-400 flex items-center gap-1">
              <Sparkles size={10} />
              The Bottom Line AI analysis based on {reviews.length} patient experiences.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
