// ClinicMedia — the ONE media block every clinic-card surface uses.
//
// Resolution order (identical everywhere):
//   1. real photo (photos[0], stock-filtered) -> next/image, object-cover
//   2. else, the calm logo panel: one consistent light brand-green tint with
//      the logo centered in a clean white card (no gradient, no per-clinic colour)
//   3. else, the clinic initials on the same panel
//
// The caller sizes the block (aspect ratio / radius via className). Overlays
// (trust badge, rating, the overlapping logo avatar) are added by the card on
// top of this, so they are not ClinicMedia's concern.
//
// Server-compatible (no hooks) so it renders in both the homepage server
// component and the client cards.

import React from 'react';
import { ResilientImage } from './ResilientImage';
import { realPhotoUrl, realLogoUrl, clinicInitials, type ClinicLike } from '../lib/clinic-media';
import { cn } from '../lib/utils';

// The single, consistent photoless-panel tint. Subtle, solid, brand-green.
const PANEL_TINT = 'bg-wellness-50';

interface ClinicMediaProps {
  provider: ClinicLike;
  /** Sizing + radius for the block (e.g. 'aspect-[3/2] rounded-2xl'). */
  className?: string;
  /** next/image sizes hint for the photo case. */
  sizes?: string;
  /** Eager-load above-the-fold media; otherwise it lazy-loads. */
  priority?: boolean;
  /** Tune the initials size per surface (default suits the standard card). */
  initialsClassName?: string;
  /** Tune the centered-logo card size per surface. */
  logoBoxClassName?: string;
}

export function ClinicMedia({
  provider,
  className,
  sizes = '(max-width: 768px) 100vw, 33vw',
  priority = false,
  initialsClassName,
  logoBoxClassName,
}: ClinicMediaProps) {
  const photo = realPhotoUrl(provider);
  const logo = realLogoUrl(provider);

  return (
    <div className={cn('relative overflow-hidden', PANEL_TINT, className)}>
      {photo ? (
        <ResilientImage
          src={photo}
          fallbackSrc=""
          alt={`${provider.name} clinic`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : logo ? (
        // Centered logo on the calm panel. Sizes are percentages of the media
        // block so the same panel reads correctly from an 80px thumbnail to a
        // full card, with no per-clinic colour and no gradient.
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              'relative rounded-xl bg-white shadow-[0_8px_24px_-14px_rgba(25,40,28,0.3)] flex items-center justify-center',
              logoBoxClassName || 'w-[64%] h-[64%]'
            )}
          >
            <ResilientImage
              src={logo}
              fallbackSrc=""
              alt={`${provider.name} logo`}
              fill
              sizes={sizes}
              unoptimized
              className="object-contain p-[10%]"
            />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-serif italic text-wellness-700/80 tracking-tight', initialsClassName || 'text-4xl')}>
            {clinicInitials(provider.name)}
          </span>
        </div>
      )}
    </div>
  );
}
