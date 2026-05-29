import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClinicAgentEmbedClient } from './ClinicAgentEmbedClient';

// Embed page loaded inside an iframe by /clinic-agent.js on a clinic's site.
// Renders ONLY the floating chat widget — no nav, no footer, no chrome.
// White-label mode is controlled by the ?clinic=<slug> query string.

export const metadata: Metadata = {
  title: 'Clinic Agent — TheDripMap',
  robots: { index: false, follow: false },
};

export default function ClinicAgentEmbedPage() {
  return (
    <Suspense fallback={null}>
      <ClinicAgentEmbedClient />
    </Suspense>
  );
}
