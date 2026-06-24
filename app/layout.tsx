import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Fraunces, Hanken_Grotesk } from 'next/font/google';
import "./globals.css";
import Script from "next/script";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { ClaimListingProvider } from "../src/context/ClaimListingContext";
import { EmailCapturePopup } from "../src/components/EmailCapturePopup";
import { CompareBar } from "../src/components/CompareBar";
import { DripAssistant } from "../src/components/DripAssistant";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
});

// Editorial-listing fonts (used by DefinitiveListingLayout on claimed clinic
// pages). Exposed site-wide as CSS variables — only the listing template
// actually references them, so other pages are unaffected.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-fraunces',
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-hanken',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thedripmap.com';

// 2026-06-11: Google's "Site Name" feature (the bold name above URLs in
// mobile search results) was displaying "thedripmap.com" because the
// previous siteName ("TheDripMap", no space) was visually identical to the
// domain. Switching the primary display name to "The Drip Map" with spaces
// + adding "TheDripMap" as alternateName in the WebSite + Organization JSON-LD
// gives Google a clear distinct display name to surface. Per Google's docs
// at https://developers.google.com/search/docs/appearance/site-names this
// can take 1 to 2 weeks to propagate in search results.
//
// Hardcoded (not env-driven) on purpose: the brand display name should not
// vary by environment. Vercel had NEXT_PUBLIC_SITE_NAME=TheDripMap set which
// was overriding the default and re-introducing the bug on prod.
const siteName = 'The Drip Map';
const siteNameAlternate = 'TheDripMap';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s',
    default: 'The Drip Map | Find Your Perfect IV Therapy Match',
  },
  description: 'Find and compare the best IV therapy clinics near you. Browse verified IV therapy providers across Canada, or get matched in 60 seconds.',
  // NOTE: no global `alternates.canonical` here. A canonical set in the root
  // layout is inherited by every child page that doesn't override it, which made
  // pages without their own canonical declare the homepage as canonical — the
  // exact cause of "Duplicate, Google chose different canonical". Each page now
  // sets its own self-referencing canonical (the homepage sets its own in page.tsx).
  openGraph: {
    title: `${siteName} | Find Your Perfect IV Therapy Match`,
    description: `Find and compare the best IV therapy clinics near you.`,
    url: siteUrl,
    siteName: siteName,
    type: "website",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${siteName} - Find Your Perfect IV Therapy Match`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | Find Your Perfect IV Therapy Match`,
    description: `Find and compare the best IV therapy clinics near you.`,
    images: ['/og-image.png'],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

// Brand green (#78AA50, sampled from the logo) for the mobile browser chrome bar.
export const viewport: Viewport = {
  themeColor: '#78AA50',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "alternateName": siteNameAlternate,
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "areaServed": { "@type": "Country", "name": "Canada" },
    "sameAs": [
      "https://www.instagram.com/thedripmap"
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "alternateName": siteNameAlternate,
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en-CA" className={`${inter.variable} ${outfit.variable} ${fraunces.variable} ${hankenGrotesk.variable}`}>
      <head>
        <script
          id="fix-fetch-getter"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var _fetch = window.fetch;
                  Object.defineProperty(window, 'fetch', {
                    get: function() { return _fetch; },
                    set: function(v) { _fetch = v; },
                    configurable: true,
                    enumerable: true
                  });
                } catch (e) {
                  // Ignore
                }
              })();
            `
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="font-sans">
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        <ErrorBoundary>
          <ClaimListingProvider>
            {children}
            <CompareBar />
            <EmailCapturePopup />
            {/* Drip Assistant is hidden until its LLM key is configured: a
                widget that errors on every message is worse than no widget.
                Gated on GROQ_API_KEY (server-only), so it self-restores the
                moment the key is added to Vercel and the app redeploys. */}
            {process.env.GROQ_API_KEY ? <DripAssistant /> : null}
          </ClaimListingProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
