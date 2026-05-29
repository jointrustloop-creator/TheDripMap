import type { Metadata } from 'next';
import { ClinicAgentDemoClient } from './ClinicAgentDemoClient';

const title = 'Clinic Agent Demo — TheDripMap';
const description =
  'See exactly what the Drip Assistant looks like installed on your IV therapy or wellness clinic’s website.';

// This is a sales demo, not a real clinic page — keep it out of search results.
export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
};

export default function ClinicAgentDemoPage() {
  return <ClinicAgentDemoClient />;
}
