import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';

const termsTitle = "Terms of Service | TheDripMap";
const termsDescription = "The rules and guidelines for using TheDripMap platform.";
const termsOgImage = 'https://www.thedripmap.com/og-image.png';

export const metadata: Metadata = {
  title: termsTitle,
  description: termsDescription,
  alternates: { canonical: 'https://www.thedripmap.com/terms' },
  openGraph: {
    title: termsTitle,
    description: termsDescription,
    url: 'https://www.thedripmap.com/terms',
    type: 'website',
    siteName: 'TheDripMap',
    images: [{ url: termsOgImage, width: 1200, height: 630, alt: 'TheDripMap' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: termsTitle,
    description: termsDescription,
    images: [termsOgImage],
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black text-slate-900 mb-8">Terms of Service</h1>
        <div className="prose prose-slate max-w-none">
          <p><strong>Last updated: May 2026</strong></p>
          <p>
            Welcome to TheDripMap. These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the
            TheDripMap website and services (the &ldquo;Services&rdquo;). By accessing or using the Services,
            you agree to these Terms. Please read them carefully. If you do not agree, please do not use the
            Services.
          </p>

          <h2>1. About the Service — Informational Directory Only</h2>
          <p>
            TheDripMap is an online directory that helps people discover IV therapy and wellness clinics across
            the United States and Canada. The Services are provided for general informational purposes only.
            We are a directory and matching platform — we do not provide medical, health, or treatment services,
            and we are not a clinic, pharmacy, or healthcare provider.
          </p>

          <h2>2. Not Medical Advice</h2>
          <p>
            The content on TheDripMap, including listings, quiz results, guides, articles, and tool outputs, is
            for informational purposes only and is <strong>not</strong> medical advice. It is not a substitute
            for the advice, diagnosis, or treatment of a licensed physician, nurse, or other qualified healthcare
            professional. Always seek the advice of a qualified clinician before starting, stopping, or changing
            any treatment, and never disregard professional medical advice because of something you read on
            TheDripMap. If you think you may have a medical emergency, call your doctor or emergency services
            immediately.
          </p>

          <h2>3. Clinic Listing Accuracy</h2>
          <p>
            We work to keep our directory accurate, but clinic information — including services, hours, pricing,
            ratings, contact details, and availability — may change or become out of date, and may contain errors.
            We do not warrant or guarantee the accuracy, completeness, or currency of any listing. Always confirm
            details directly with the clinic before relying on them or booking a service. TheDripMap does not
            endorse, recommend, or vouch for any clinic, and the inclusion of a clinic in our directory is not an
            endorsement of its services, qualifications, or safety.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>When using the Services, you agree that you will not:</p>
          <ul>
            <li>Use the Services for any unlawful, harmful, or fraudulent purpose.</li>
            <li>Submit false, misleading, or impersonating information.</li>
            <li>Scrape, harvest, or copy our data or listings without permission.</li>
            <li>Attempt to disrupt, overload, reverse-engineer, or gain unauthorized access to the Services or our systems.</li>
            <li>Use the Services to send spam or to harass, abuse, or harm others.</li>
            <li>Infringe the intellectual property or other rights of TheDripMap or any third party.</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>
            The Services, including the TheDripMap name, logo, design, text, graphics, and software, are owned by
            TheDripMap or its licensors and are protected by intellectual property laws. We grant you a limited,
            non-exclusive, non-transferable license to access and use the Services for their intended purpose.
            You may not copy, reproduce, distribute, or create derivative works from our content without our prior
            written consent. Clinic names, marks, and materials remain the property of their respective owners.
          </p>

          <h2>6. Third-Party Clinics &amp; Links</h2>
          <p>
            The Services may include listings of, and links to, third-party clinics and websites. We do not
            control and are not responsible for the services, content, practices, or policies of any third-party
            clinic or website. Any dealings you have with a clinic are solely between you and that clinic.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            The Services are provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any
            kind, whether express or implied. To the fullest extent permitted by law, TheDripMap will not be liable
            for any indirect, incidental, special, consequential, or punitive damages, or any loss arising out of
            or related to your use of (or inability to use) the Services, your reliance on any listing or content,
            or the services provided by any third-party clinic. Nothing in these Terms limits liability that cannot
            be limited under applicable law.
          </p>

          <h2>8. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless TheDripMap and its operators from any claims, damages, or
            expenses (including reasonable legal fees) arising from your misuse of the Services or your violation
            of these Terms.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            TheDripMap operates in both the United States and Canada. These Terms, and any dispute arising from
            them or from your use of the Services, are governed by the applicable laws of the jurisdiction in which
            TheDripMap operates, without regard to conflict-of-law principles. Where local consumer-protection laws
            in your country, province, or state grant you rights that cannot be waived, nothing in these Terms is
            intended to limit those rights.
          </p>

          <h2>10. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. When we do, we will revise the &ldquo;Last updated&rdquo;
            date above. Your continued use of the Services after changes take effect means you accept the updated
            Terms.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about these Terms, email us at{' '}
            <a href="mailto:info@thedripmap.com">info@thedripmap.com</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
