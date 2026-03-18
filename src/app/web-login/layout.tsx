import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Web Login',
  description: 'Sign in to Hedgium via web.',
  robots: { index: false, follow: false },
};

export default function WebLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
