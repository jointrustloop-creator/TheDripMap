'use client';

import React from 'react';
import { Map as MapIcon } from 'lucide-react';

export function MapTrigger() {
  return (
    <button 
      onClick={() => {
        // Find and click the map view trigger in ListingController
        const trigger = document.getElementById('map-view-trigger');
        if (trigger) {
          trigger.click();
        }
      }}
      className="text-sm font-bold text-slate-500 hover:text-wellness-600 flex items-center gap-1 transition-colors underline decoration-slate-300 underline-offset-4"
    >
      <MapIcon size={14} />
      Quick Map View
    </button>
  );
}
