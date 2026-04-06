import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Matches | TheDripMap',
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuizResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
