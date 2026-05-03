'use client';

import React, { useState } from 'react';
import { ClaimListingModal } from './ClaimListingModal';
import { Provider } from '../types';

interface ClaimListingTriggerProps {
  provider: Provider;
  children: React.ReactNode;
  className?: string;
}

export const ClaimListingTrigger = ({ provider, children, className }: ClaimListingTriggerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={className}
      >
        {children}
      </button>
      <ClaimListingModal 
        provider={provider}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
