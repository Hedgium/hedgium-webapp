import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MITC & RA',
  description:
    'Hedgium Model Investment and Trading Conditions (MITC) and Risk Assessment (RA) documents.',
};

export default function MitcRaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
