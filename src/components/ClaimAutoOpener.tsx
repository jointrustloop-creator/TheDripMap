'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useClaimListing } from '../context/ClaimListingContext';
import { Provider } from '../types';

interface ClaimAutoOpenerProps {
  provider: Provider;
}

/**
 * Auto-opens the claim modal when the URL has `?claim=1`. Used by outreach
 * emails so the recipient can land straight into the claim flow with one
 * click — no scrolling for the CTA.
 *
 * Mounted on unclaimed provider pages only (claimed listings can't be
 * re-claimed). Server page handles the is_featured gating.
 */
export const ClaimAutoOpener = ({ provider }: ClaimAutoOpenerProps) => {
  const searchParams = useSearchParams();
  const { openClaimModal } = useClaimListing();

  useEffect(() => {
    if (searchParams.get('claim') === '1') {
      // Tiny delay so the page chrome renders first — feels less jarring
      const t = setTimeout(() => openClaimModal(provider), 250);
      return () => clearTimeout(t);
    }
  }, [searchParams, openClaimModal, provider]);

  return null;
};
