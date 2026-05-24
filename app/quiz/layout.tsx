import type { Metadata } from "next";
import React from "react";

const quizTitle = "IV Therapy Matching Quiz — Find Your Perfect Drip | TheDripMap";
const quizDescription = "Answer 5 quick questions and get matched to the right IV therapy clinic for your goals, symptoms, and budget. Takes 60 seconds.";
const quizOgImage = 'https://www.thedripmap.com/og-image.png';

export const metadata: Metadata = {
  title: quizTitle,
  description: quizDescription,
  alternates: { canonical: 'https://www.thedripmap.com/quiz' },
  openGraph: {
    title: quizTitle,
    description: quizDescription,
    url: 'https://www.thedripmap.com/quiz',
    type: 'website',
    siteName: 'TheDripMap',
    images: [{ url: quizOgImage, width: 1200, height: 630, alt: 'TheDripMap Quiz' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: quizTitle,
    description: quizDescription,
    images: [quizOgImage],
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
