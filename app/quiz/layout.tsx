import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Drip Finder Quiz | Personalized IV Therapy Matching | TheDripMap",
  description: "Take our 60-second clinical matching quiz. Get personalized IV therapy recommendations based on your symptoms, goals, and location.",
  alternates: {
    canonical: 'https://www.thedripmap.com/quiz',
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
