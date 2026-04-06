import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clinic Setup | TheDripMap',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
