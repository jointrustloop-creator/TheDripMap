import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';

const privacyTitle = "Privacy Policy | TheDripMap";
const privacyDescription = "Our commitment to protecting your privacy and medical data.";
const privacyOgImage = 'https://www.thedripmap.com/og-image.png';

export const metadata: Metadata = {
  title: privacyTitle,
  description: privacyDescription,
  alternates: { canonical: 'https://www.thedripmap.com/privacy' },
  openGraph: {
    title: privacyTitle,
    description: privacyDescription,
    url: 'https://www.thedripmap.com/privacy',
    type: 'website',
    siteName: 'TheDripMap',
    images: [{ url: privacyOgImage, width: 1200, height: 630, alt: 'TheDripMap' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: privacyTitle,
    description: privacyDescription,
    images: [privacyOgImage],
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black text-slate-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-slate max-w-none">
          <p><strong>Last updated: May 2026</strong></p>
          <p>
            At TheDripMap (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), we take your privacy seriously.
            TheDripMap operates an online matching platform for IV therapy and wellness clinics across Canada
            and the United States. This policy explains, in plain English, what information we collect, how we use it, who
            we share it with, and the rights you have over your data. If you have any questions, email us anytime
            at <a href="mailto:info@thedripmap.com">info@thedripmap.com</a>.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect only the information we need to run the matching platform and the tools we offer:</p>
          <ul>
            <li><strong>Clinic &amp; business information</strong> — the name, address, phone number, website, hours, services, ratings, and other publicly available details of the IV therapy clinics listed in our matching platform.</li>
            <li><strong>Email addresses</strong> — addresses of clinics we contact about their listings, and addresses you provide when you sign up, submit a form, or request results from one of our tools.</li>
            <li><strong>Quiz answers</strong> — the responses you give in our clinical matching quiz so we can match you with appropriate IV therapy providers.</li>
            <li><strong>Lead &amp; contact form submissions</strong> — information you submit through our contact forms, &ldquo;message a clinic&rdquo; forms, and lead-capture forms (such as your name, email, and message).</li>
            <li><strong>SEO-audit inputs</strong> — the website URLs and related details you enter into our free SEO-audit tool so we can generate and return your report.</li>
            <li><strong>Basic analytics</strong> — standard usage data such as pages visited, device and browser type, and approximate location, collected to understand how the site is used and improve it.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Build and maintain our public platform listings of IV therapy clinics.</li>
            <li>Send outreach and follow-up emails to clinics about claiming or improving their listings.</li>
            <li>Capture and respond to leads and contact-form inquiries.</li>
            <li>Generate and return SEO-audit results and other tool outputs you request.</li>
            <li>Match you with appropriate IV therapy providers based on your quiz answers.</li>
            <li>Measure product analytics so we can maintain, secure, and improve our services.</li>
          </ul>

          <h2>3. Third-Party Service Providers</h2>
          <p>
            We rely on a small set of trusted third-party processors to operate TheDripMap. These providers
            process data on our behalf and under our instructions:
          </p>
          <ul>
            <li><strong>Supabase</strong> — database and authentication (stores our matching platform data and account information).</li>
            <li><strong>Vercel</strong> — website hosting and delivery.</li>
            <li><strong>Mapbox</strong> — interactive maps and clinic location display.</li>
            <li><strong>Anthropic</strong> — AI services that power our chat assistant, brand-voice tools, and SEO tools.</li>
            <li><strong>OpenStreetMap (Nominatim)</strong> — geocoding (converting addresses into map coordinates).</li>
            <li><strong>Google Workspace (Gmail via SMTP/nodemailer)</strong> — transactional and outreach email delivery, with <strong>Resend</strong> as a fallback email provider.</li>
            <li><strong>Google Analytics</strong> — website usage analytics.</li>
          </ul>
          <p>We do not sell your personal information.</p>

          <h2>4. Your Rights &amp; Choices</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access</strong> the personal information we hold about you.</li>
            <li><strong>Correct</strong> information that is inaccurate or out of date.</li>
            <li><strong>Delete</strong> your personal information.</li>
            <li><strong>Opt out</strong> of marketing or outreach emails at any time.</li>
          </ul>
          <p>
            To exercise any of these rights, email us at <a href="mailto:info@thedripmap.com">info@thedripmap.com</a> and
            we will respond promptly. If you are a clinic and would like your listing removed, just let us know.
          </p>

          <h2>5. Email Communications &amp; Anti-Spam Compliance</h2>
          <p>
            TheDripMap sends commercial electronic messages to IV therapy clinics in Canada and the United States
            about their platform listings. We are committed to following the anti-spam laws of both countries.
          </p>

          <h3>Canada — CASL (Canada&rsquo;s Anti-Spam Legislation)</h3>
          <p>
            Because we email clinics in Canada, we comply with CASL. Every commercial electronic message we send:
          </p>
          <ul>
            <li>Clearly identifies TheDripMap as the sender.</li>
            <li>Includes valid contact information, including our email address (<a href="mailto:info@thedripmap.com">info@thedripmap.com</a>).</li>
            <li>Provides a working, easy-to-use unsubscribe mechanism.</li>
          </ul>
          <p>
            Recipients may withdraw their consent to receive our messages at any time, and we will honor that
            request. To unsubscribe, reply with &ldquo;unsubscribe&rdquo; in the subject line or email
            us at <a href="mailto:info@thedripmap.com">info@thedripmap.com</a>.
          </p>

          <h3>United States — CAN-SPAM Act</h3>
          <p>
            For recipients in the United States, we comply with the CAN-SPAM Act. This means our commercial emails:
          </p>
          <ul>
            <li>Use accurate, non-deceptive &ldquo;From,&rdquo; &ldquo;To,&rdquo; and routing headers and honest subject lines.</li>
            <li>Are identified as advertising or solicitation where applicable.</li>
            <li>Include a valid physical or contact address and identify TheDripMap as the sender.</li>
            <li>Offer a clear way to opt out, and we honor opt-out requests promptly.</li>
          </ul>

          <h2>6. Data Security</h2>
          <p>
            We implement reasonable technical and organizational measures to protect your information from
            unauthorized access, loss, or disclosure. No method of transmission or storage is completely secure,
            but we work to safeguard your data and limit access to it.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We keep personal information only as long as we need it for the purposes described in this policy,
            to comply with our legal obligations, resolve disputes, and enforce our agreements. When information
            is no longer needed, we delete or anonymize it.
          </p>

          <h2>8. Children&rsquo;s Privacy</h2>
          <p>
            TheDripMap is not directed to children, and we do not knowingly collect personal information from
            anyone under the age of majority in their jurisdiction.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the &ldquo;Last
            updated&rdquo; date above. Material changes will be reflected on this page.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have any questions or requests about this policy or your personal information, email us at{' '}
            <a href="mailto:info@thedripmap.com">info@thedripmap.com</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
