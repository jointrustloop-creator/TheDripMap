'use client';

import React from 'react';
import { Provider } from '../types';
import { useClaimListing } from '../context/ClaimListingContext';

interface ClaimListingTriggerProps {
  provider: Provider;
  children: React.ReactNode;
  className?: string;
}

export const ClaimListingTrigger = ({ provider, children, className }: ClaimListingTriggerProps) => {
  const { openClaimModal } = useClaimListing();

  return (
    <button 
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openClaimModal(provider);
      }}
      className={className}
    >
      {children}
    </button>
  );
};
