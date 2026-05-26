import type { Metadata } from "next";
import { Inter, Outfit } from 'next/font/google';
import "./globals.css";
import Script from "next/script";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { ClaimListingProvider } from "../src/context/ClaimListingContext";
import { EmailCapturePopup } from "../src/components/EmailCapturePopup";
import { CompareBar } from "../src/components/CompareBar";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thedripmap.com';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'TheDripMap';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s',
    default: 'TheDripMap | Find Your Perfect IV Therapy Match',
  },
  description: 'Find and compare the best IV therapy clinics near you. Browse verified providers across hundreds of US cities or get matched in 60 seconds.',
  alternates: {
    canonical: 'https://www.thedripmap.com',
  },
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
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "sameAs": [
      "https://www.instagram.com/thedripmap"
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
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
          </ClaimListingProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
