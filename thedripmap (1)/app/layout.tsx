import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { ErrorBoundary } from "../src/components/ErrorBoundary";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedripmap.com';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'TheDripMap';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `IV Therapy Near Me — Find Top Rated Clinics | ${siteName}`,
    template: `%s | ${siteName}`,
  },
  description: `Find and compare the best IV therapy clinics near you. Browse providers across the US or get matched to your perfect drip in 60 seconds.`,
  alternates: {
    canonical: '/',
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
      "https://facebook.com/thedripmap",
      "https://instagram.com/thedripmap",
      "https://twitter.com/thedripmap"
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
    <html lang="en">
      <head>
        <Script id="fix-fetch" strategy="beforeInteractive">
          {`
            (function() {
              try {
                const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
                if (descriptor && !descriptor.writable && descriptor.configurable) {
                  const originalFetch = window.fetch;
                  Object.defineProperty(window, 'fetch', {
                    value: originalFetch,
                    writable: true,
                    configurable: true,
                    enumerable: true
                  });
                }
              } catch (e) {
                // Silently fail if we can't patch fetch
              }
            })();
          `}
        </Script>
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
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
