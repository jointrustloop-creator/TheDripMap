'use client';

/**
 * AskPriceButton: the one control on the site that turns a visitor who was
 * about to leave into a recorded lead.
 *
 * Why it exists (2026-09-25): the site had 492 listing views in the last 30
 * days and zero patient messages. The single question every visitor has and
 * almost no clinic page answers is "what does it cost". Most Canadian clinics
 * do not publish prices; the Price Index is stuck on exactly that. So on any
 * card or page with no price we ask the question FOR the patient, pre-filled,
 * through the existing message-clinic pipe: a claimed clinic gets it in their
 * inbox with the patient's email as reply-to, an unclaimed clinic's question
 * lands with info@ for relay, and either way it is a row on /admin/leads.
 *
 * It is the same modal and the same endpoint as "Message clinic", so nothing
 * new can fail silently. Renders nothing when the clinic already shows a
 * price; the price itself is the better answer.
 */
import React, { useState } from 'react';
import { Tag } from 'lucide-react';
import type { Provider } from '../types';
import { MessageClinicModal } from './MessageClinicModal';
import { trackEvent } from '../lib/analytics-client';
import { priceSignalOf } from '../lib/card-signals';

export const ASK_PRICE_MESSAGE =
  "Hi, could you tell me the price of a standard IV vitamin drip (for example a Myers' Cocktail), and whether there is a consultation fee? Thank you.";

type Variant = 'card' | 'card-text' | 'page';

export function AskPriceButton({ provider, variant = 'card', className }: { provider: Provider; variant?: Variant; className?: string }) {
  const [open, setOpen] = useState(false);
  if (priceSignalOf(provider)) return null;

  const base =
    variant === 'page'
      ? 'block w-full text-center py-[15px] rounded-[13px] font-semibold text-[15px] mb-[10px] bg-[#f3efe2] text-[#1f3a27] border border-[rgba(25,36,28,0.15)] hover:bg-[#ebe4cf] transition cursor-pointer flex items-center justify-center gap-2'
      : variant === 'card-text'
      ? 'mt-3 inline-flex items-center gap-1.5 text-[12px] font-black text-wellness-700 hover:text-wellness-800 transition-colors'
      : 'h-11 px-3 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-wellness-200 bg-wellness-50 text-wellness-700 text-[12px] font-black hover:bg-wellness-100 transition-colors whitespace-nowrap';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (provider?.id) trackEvent(provider.id, 'message_click');
          setOpen(true);
        }}
        className={className || base}
        title={`Ask ${provider.name} what a drip costs`}
      >
        <Tag size={variant === 'page' ? 15 : 13} /> {variant === 'page' ? 'Ask their price' : 'Ask price'}
      </button>
      <MessageClinicModal
        provider={provider}
        isOpen={open}
        onClose={() => setOpen(false)}
        initialMessage={ASK_PRICE_MESSAGE}
        heading={`Ask ${provider.name} their price`}
        subheading="They reply to your email. Edit the question if you like."
      />
    </>
  );
}

export default AskPriceButton;
