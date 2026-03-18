import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grievance Redressal',
  description:
    'Hedgium Grievance Redressal. Contact our customer care, compliance officer, or principal officer for any complaints.',
};

export default function GrievanceRedressalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
