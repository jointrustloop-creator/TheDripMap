import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get your finish link | TheDripMap',
  robots: { index: false, follow: false },
};

export default function GetVerifiedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
