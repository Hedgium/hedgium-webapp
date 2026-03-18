import './global.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import RootLayoutClient from './RootLayoutClient';
import type { Metadata } from 'next';

const font = Plus_Jakarta_Sans({
  weight: ['200', '300', '400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hedgium.ai';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Hedgium | Quant-Based Investment Platform',
    template: '%s | Hedgium',
  },
  description:
    'Hedgium offers a quant-based dual-engine investing framework for superior risk-adjusted returns. Build model portfolios and deploy statistical arbitrage strategies.',
  keywords: [
    'Hedgium',
    'quant investing',
    'statistical arbitrage',
    'model portfolio',
    'investment platform',
    'risk-adjusted returns',
  ],
  authors: [{ name: 'Hedgium', url: SITE_URL }],
  creator: 'Hedgium',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Hedgium',
    title: 'Hedgium | Quant-Based Investment Platform',
    description:
      'Hedgium offers a quant-based dual-engine investing framework for superior risk-adjusted returns.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hedgium | Quant-Based Investment Platform',
    description:
      'Hedgium offers a quant-based dual-engine investing framework for superior risk-adjusted returns.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={font.className + ' min-h-screen flex flex-col'}
      >
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
