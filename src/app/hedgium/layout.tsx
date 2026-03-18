import HedgiumLayoutClient from './HedgiumLayoutClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default function HedgiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HedgiumLayoutClient>{children}</HedgiumLayoutClient>;
}
