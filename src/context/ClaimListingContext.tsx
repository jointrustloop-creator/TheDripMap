'use client';

import React, { createContext, useContext, useState } from 'react';
import { Provider } from '../types';
import { ClaimListingModal } from '../components/ClaimListingModal';

interface ClaimListingContextType {
  openClaimModal: (provider: Provider) => void;
}

const ClaimListingContext = createContext<ClaimListingContextType | undefined>(undefined);

export const ClaimListingProvider = ({ children }: { children: React.ReactNode }) => {
  const [claimModal, setClaimModal] = useState<Provider | null>(null);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimChecked, setClaimChecked] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const closeModal = () => {
    setClaimModal(null);
    setClaimEmail('');
    setClaimChecked(false);
    setClaimSuccess(false);
  };

  const openClaimModal = (provider: Provider) => {
    setClaimModal(provider);
  };

  return (
    <ClaimListingContext.Provider value={{ openClaimModal }}>
      {children}
      {claimModal && (
        <ClaimListingModal 
          provider={claimModal}
          isOpen={!!claimModal}
          onClose={closeModal}
          email={claimEmail}
          setEmail={setClaimEmail}
          confirmed={claimChecked}
          setConfirmed={setClaimChecked}
          isSubmitting={claimSubmitting}
          setIsSubmitting={setClaimSubmitting}
          isSuccess={claimSuccess}
          setIsSuccess={setClaimSuccess}
        />
      )}
    </ClaimListingContext.Provider>
  );
};

export const useClaimListing = () => {
  const context = useContext(ClaimListingContext);
  if (context === undefined) {
    throw new Error('useClaimListing must be used within a ClaimListingProvider');
  }
  return context;
};
