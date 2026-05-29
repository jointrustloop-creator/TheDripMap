'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DripAssistant } from '../../../src/components/DripAssistant';
import { getWhitelabelConfig } from '../../../src/lib/whitelabel-configs';

// Iframe-friendly: no chrome, transparent background, just the widget.
// The host page (clinic site) iframes this URL via public/clinic-agent.js.
export function ClinicAgentEmbedClient() {
  const params = useSearchParams();
  const slug = params?.get('clinic') || null;
  const [config, setConfig] = useState<{ clinicName?: string; tagline?: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    const overlay = getWhitelabelConfig(slug);
    setConfig({
      clinicName: overlay?.clinicName,
      tagline: overlay?.tagline,
    });
  }, [slug]);

  if (!slug) {
    return (
      <div style={{ padding: 20, fontFamily: 'sans-serif', color: '#475569' }}>
        <strong>Drip Assistant embed</strong> — missing <code>?clinic=&lt;slug&gt;</code> parameter.
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <DripAssistant
        clinicSlug={slug}
        clinicName={config?.clinicName}
        tagline={config?.tagline}
      />
    </div>
  );
}
