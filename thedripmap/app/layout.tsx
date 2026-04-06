import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { ErrorBoundary } from "../src/components/ErrorBoundary";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://thedripmap.com'),
  title: {
    default: "IV Therapy Near Me — Find Top Rated Clinics | TheDripMap",
    template: "%s | TheDripMap",
  },
  description: "Find and compare the best IV therapy clinics near you. Browse providers across the US or get matched to your perfect drip in 60 seconds.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "TheDripMap | Find Your Perfect IV Therapy Match",
    description: "Find and compare the best IV therapy clinics near you.",
    url: "https://thedripmap.com",
    siteName: "TheDripMap",
    type: "website",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TheDripMap - Find Your Perfect IV Therapy Match',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TheDripMap | Find Your Perfect IV Therapy Match',
    description: 'Find and compare the best IV therapy clinics near you.',
    images: ['/og-image.png'],
  },
  verification: {
    google: "PASTE_VERIFICATION_CODE_HERE",
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
    "name": "TheDripMap",
    "url": "https://thedripmap.com",
    "logo": "https://thedripmap.com/logo.png",
    "sameAs": [
      "https://facebook.com/thedripmap",
      "https://instagram.com/thedripmap",
      "https://twitter.com/thedripmap"
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TheDripMap",
    "url": "https://thedripmap.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://thedripmap.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>
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
