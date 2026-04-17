import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Your Matching Results | Personalized IV Therapy Selection | TheDripMap",
  description: "View your personalized IV therapy clinic matches. We've matched you with the best providers for your specific health goals and location.",
  robots: {
    index: false,
    follow: true,
  }
};

export default function QuizResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
