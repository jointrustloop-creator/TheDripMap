import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "IV Therapy Matching Quiz — Find Your Perfect Drip | TheDripMap",
  description: "Answer 5 quick questions and get matched to the right IV therapy clinic for your goals, symptoms, and budget. Takes 60 seconds.",
  alternates: {
    canonical: 'https://www.thedripmap.com/quiz',
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
