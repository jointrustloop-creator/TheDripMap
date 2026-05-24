import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Application Received | TheDripMap',
  robots: { index: false, follow: false },
};

export default function ForClinicsSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
